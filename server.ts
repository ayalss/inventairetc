import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_MANAGERS,
  INITIAL_SUB_NODES,
  INITIAL_MATERIALS
} from './src/data.ts';

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const { Pool } = pg;

const dbConfig: any = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'inventory',
  connectionTimeoutMillis: 4000,
  idleTimeoutMillis: 10000,
};

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  dbConfig.connectionString = process.env.DATABASE_URL;
}

const pool = new Pool(dbConfig);

let isDbConnected = false;
let activeConnectionError = '';

const memoryStore = {
  departments: [...INITIAL_DEPARTMENTS] as any[],
  managers:    [...INITIAL_MANAGERS]    as any[],
  subNodes:    [...INITIAL_SUB_NODES]   as any[],
  materials:   [...INITIAL_MATERIALS]   as any[],
  puces:        [] as any[],
  auditLogs:    [] as any[],
  users: [] as any[]
};

// ==========================================
// ROLE PERMISSIONS HELPER (mirrors frontend)
// ==========================================

const ROLE_PRESETS: Record<string, Record<string, boolean>> = {
  user: {
    dashboard: true,  materials: true,  puces: false, reports: false,
    portals:   true,  qr:        false, admin: false, audit:   false,
  },
  manager: {
    dashboard: true,  materials: true,  puces: true,  reports: true,
    portals:   true,  qr:        true,  admin: false, audit:   false,
  },
  admin: {
    dashboard: true,  materials: true,  puces: true,  reports: true,
    portals:   true,  qr:        true,  admin: true,  audit:   true,
  },
};

function defaultPermsForRole(role: string) {
  return { ...(ROLE_PRESETS[role] ?? ROLE_PRESETS.user) };
}

// ==========================================
// AUDIT LOGGER HELPER
// ==========================================

async function logAudit(
  action: string,
  userEmail: string | null,
  details: string,
  ip: string,
  userAgent: string
) {
  const entry = {
    user_email: userEmail,
    action,
    details,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  };

  try {
    if (isDbConnected) {
      await pool.query(
        `INSERT INTO audit_logs (user_email, action, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [entry.user_email, entry.action, entry.details, entry.ip_address, entry.user_agent]
      );
    } else {
      memoryStore.auditLogs.unshift({ id: Date.now(), ...entry });
      if (memoryStore.auditLogs.length > 500) memoryStore.auditLogs.pop();
    }
  } catch (err: any) {
    console.error('[AUDIT] Failed to write log:', err.message);
  }
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

async function checkAndInitializeDatabase() {
  try {
    console.log(`[POSTGRES] Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);
    const client = await pool.connect();
    isDbConnected = true;
    activeConnectionError = '';
    console.log(`[POSTGRES] Connected to "${dbConfig.database}" successfully.`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        email         VARCHAR(150) PRIMARY KEY,
        password      VARCHAR(100) NOT NULL,
        role          VARCHAR(50)  NOT NULL DEFAULT 'user',
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS departments (
        id         VARCHAR(50) PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        dept_num   VARCHAR(50)  NOT NULL,
        icon       VARCHAR(50)  NOT NULL,
        short_code VARCHAR(50)  NOT NULL
      );

      CREATE TABLE IF NOT EXISTS managers (
        id            VARCHAR(50)  PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(100) NOT NULL,
        role          VARCHAR(150) NOT NULL,
        avatar_color  VARCHAR(50)  NOT NULL,
        office_num    VARCHAR(50)  NOT NULL,
        company       VARCHAR(5)   NOT NULL,
        department_id VARCHAR(50)  REFERENCES departments(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS sub_nodes (
        id         VARCHAR(50)  PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        type       VARCHAR(50)  NOT NULL,
        office_num VARCHAR(50)  NOT NULL,
        manager_id VARCHAR(50)  REFERENCES managers(id) ON DELETE SET NULL,
        role       VARCHAR(150),
        documents  JSONB        DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS materials (
        id               VARCHAR(50)    PRIMARY KEY,
        name             VARCHAR(100)   NOT NULL,
        type             VARCHAR(50)    NOT NULL,
        company          VARCHAR(5)     NOT NULL,
        dept_num         VARCHAR(50)    NOT NULL,
        office_num       VARCHAR(50)    NOT NULL,
        material_num     VARCHAR(50)    NOT NULL,
        codification     VARCHAR(100)   NOT NULL,
        status           VARCHAR(50)    NOT NULL,
        serial_number    VARCHAR(100)   NOT NULL,
        purchase_date    VARCHAR(50),
        cost             DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        notes            TEXT,
        condition        VARCHAR(20)    NOT NULL DEFAULT 'Bon',
        assigned_node_id VARCHAR(50)    REFERENCES sub_nodes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS puces (
        id               VARCHAR(50)    PRIMARY KEY,
        serial_number    VARCHAR(100)   NOT NULL,
        phone_number     VARCHAR(50)    NOT NULL,
        puk_code         VARCHAR(100)   NOT NULL,
        monthly_credit   DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        status           VARCHAR(50)    NOT NULL DEFAULT 'Active',
        contract_company VARCHAR(5)     NOT NULL DEFAULT 'TC',
        assigned_node_id VARCHAR(50)    REFERENCES sub_nodes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id          SERIAL        PRIMARY KEY,
        user_email  VARCHAR(150),
        action      VARCHAR(100)  NOT NULL,
        details     TEXT,
        ip_address  VARCHAR(100),
        user_agent  TEXT,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Migrations ──
    await client.query(`ALTER TABLE materials ADD COLUMN IF NOT EXISTS condition VARCHAR(20) NOT NULL DEFAULT 'Bon';`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;`);

    // ── NEW: permissions column migration ──
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{
        "dashboard":true,"materials":true,"puces":false,"reports":false,
        "portals":true,"qr":false,"admin":false,"audit":false
      }'::jsonb;
    `);

    // Seed admin user if missing
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      await client.query(
        `INSERT INTO users (email, password, role, permissions)
         VALUES ('ayalss@gmail.com', 'luxury', 'admin', $1)`,
        [JSON.stringify(defaultPermsForRole('admin'))]
      );
      console.log('[POSTGRES] Admin user seeded.');
    }

    // Seed initial data only if departments table is empty
    const deptCount = await client.query('SELECT COUNT(*) FROM departments');
    if (parseInt(deptCount.rows[0].count) === 0) {
      console.log('[POSTGRES] Seeding initial data...');

      for (const d of INITIAL_DEPARTMENTS) {
        await client.query(
          'INSERT INTO departments (id, name, dept_num, icon, short_code) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
          [d.id, d.name, d.deptNum, d.icon, d.shortCode]
        );
      }
      for (const m of INITIAL_MANAGERS) {
        await client.query(
          'INSERT INTO managers (id, name, email, role, avatar_color, office_num, company, department_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING',
          [m.id, m.name, m.email, m.role, m.avatarColor, m.officeNum, m.company, m.departmentId || null]
        );
      }
      for (const s of INITIAL_SUB_NODES) {
        await client.query(
          'INSERT INTO sub_nodes (id, name, type, office_num, manager_id, role) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
          [s.id, s.name, s.type, s.officeNum, s.managerId || null, s.role || null]
        );
      }
      for (const mat of INITIAL_MATERIALS) {
        await client.query(
          `INSERT INTO materials (id,name,type,company,dept_num,office_num,material_num,codification,status,serial_number,purchase_date,cost,notes,condition,assigned_node_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
          [mat.id, mat.name, mat.type, mat.company, mat.deptNum, mat.officeNum, mat.materialNum,
           mat.codification, mat.status, mat.serialNumber, mat.purchaseDate || null,
           mat.cost, mat.notes || null, (mat as any).condition || 'Bon', mat.assignedNodeId || null]
        );
      }
      console.log('[POSTGRES] Initial seeding complete.');
    }

    client.release();
  } catch (err: any) {
    isDbConnected = false;
    activeConnectionError = err.message || 'Unknown error';
    console.log('[DB] PostgreSQL unavailable — running on in-memory fallback.');
  }
}

// Re-check DB connection on each API request if currently disconnected
app.use(async (req, res, next) => {
  if (!isDbConnected && req.path.startsWith('/api/') && req.path !== '/api/db-status') {
    try {
      const client = await pool.connect();
      isDbConnected = true;
      activeConnectionError = '';
      client.release();
    } catch { /* silent — handlers will fall back to memory */ }
  }
  next();
});

// ==========================================
// FILE UPLOAD SETUP
// ==========================================

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}-${file.originalname}`)
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadsDir));

// ==========================================
// API ENDPOINTS
// ==========================================

app.get('/api/db-status', (req, res) => {
  res.json({
    connected: isDbConnected,
    dbName: dbConfig.database,
    fallback: !isDbConnected,
    error: activeConnectionError || null
  });
});

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const cleanEmail    = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();
  const ip            = getClientIp(req);
  const ua            = req.headers['user-agent'] || 'unknown';

  try {
    if (isDbConnected) {
      const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (rows.length === 0) {
        await logAudit('LOGIN_FAILED', cleanEmail, 'User not found', ip, ua);
        return res.status(401).json({ error: 'Access Denied: User not found.' });
      }
      if (rows[0].is_blocked) {
        await logAudit('LOGIN_FAILED', cleanEmail, 'Account blocked', ip, ua);
        return res.status(403).json({ error: 'Access Denied: Your account has been blocked.' });
      }
      const storedPassword = rows[0].password ?? rows[0].password_hash ?? '';
      if (storedPassword !== cleanPassword) {
        await logAudit('LOGIN_FAILED', cleanEmail, 'Invalid password', ip, ua);
        return res.status(401).json({ error: 'Access Denied: Invalid password.' });
      }
      await logAudit('LOGIN_SUCCESS', rows[0].email, 'Authenticated successfully', ip, ua);
      return res.json({
        success: true,
        email: rows[0].email,
        role: rows[0].role,
        permissions: rows[0].permissions ?? defaultPermsForRole(rows[0].role),
      });
    } else {
      const user = memoryStore.users.find(u => String(u.email).toLowerCase() === cleanEmail);
      if (!user) {
        await logAudit('LOGIN_FAILED', cleanEmail, 'User not found (memory)', ip, ua);
        return res.status(401).json({ error: 'Access Denied: User not found.' });
      }
      if (user.is_blocked) {
        await logAudit('LOGIN_FAILED', cleanEmail, 'Account blocked (memory)', ip, ua);
        return res.status(403).json({ error: 'Access Denied: Your account has been blocked.' });
      }
      if (String(user.password) !== cleanPassword) {
        await logAudit('LOGIN_FAILED', cleanEmail, 'Invalid password (memory)', ip, ua);
        return res.status(401).json({ error: 'Access Denied: Invalid password.' });
      }
      await logAudit('LOGIN_SUCCESS', user.email, 'Authenticated successfully (memory)', ip, ua);
      return res.json({
        success: true,
        email: user.email,
        role: user.role,
        permissions: user.permissions ?? defaultPermsForRole(user.role),
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/session-restored', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || 'unknown';
  await logAudit('LOGIN_SUCCESS', String(email).trim().toLowerCase(), 'Session restored (already logged in)', ip, ua);
  res.json({ success: true });
});

// --- USERS ---

// GET all users — includes permissions
app.get('/api/users', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query(
        `SELECT email, role, is_blocked, created_at, permissions
         FROM users ORDER BY created_at ASC`
      );
      res.json(rows);
    } else {
      res.json(memoryStore.users.map(({ password: _, ...u }) => u));
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user — saves permissions
app.post('/api/users', async (req, res) => {
  const { email, password, role, permissions } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanRole  = role || 'user';
  const cleanPerms = permissions ?? defaultPermsForRole(cleanRole);
  const ip         = getClientIp(req);
  const ua         = req.headers['user-agent'] || 'unknown';
  const adminEmail = req.headers['x-admin-email'] as string || null;

  try {
    if (isDbConnected) {
      const existing = await pool.query('SELECT email FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        await logAudit('USER_CREATE_FAILED', adminEmail, `Attempted to create duplicate user: ${cleanEmail}`, ip, ua);
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }
      const { rows } = await pool.query(
        `INSERT INTO users (email, password, role, permissions)
         VALUES ($1, $2, $3, $4)
         RETURNING email, role, is_blocked, created_at, permissions`,
        [cleanEmail, String(password).trim(), cleanRole, JSON.stringify(cleanPerms)]
      );
      await logAudit('USER_CREATED', adminEmail, `New user created: ${cleanEmail} with role: ${cleanRole}`, ip, ua);
      res.json(rows[0]);
    } else {
      if (memoryStore.users.find(u => u.email === cleanEmail)) {
        await logAudit('USER_CREATE_FAILED', adminEmail, `Attempted to create duplicate user: ${cleanEmail}`, ip, ua);
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }
      const newUser = {
        email: cleanEmail,
        password: String(password).trim(),
        role: cleanRole,
        permissions: cleanPerms,
        is_blocked: false,
        created_at: new Date().toISOString(),
      };
      memoryStore.users.push(newUser);
      await logAudit('USER_CREATED', adminEmail, `New user created: ${cleanEmail} with role: ${cleanRole}`, ip, ua);
      const { password: _, ...safe } = newUser;
      res.json(safe);
    }
  } catch (err: any) {
    await logAudit('USER_CREATE_ERROR', adminEmail, `Error creating user: ${err.message}`, ip, ua);
    res.status(500).json({ error: err.message });
  }
});

// ── NEW: PATCH /api/users/:email — update role, permissions, password ──
// IMPORTANT: this must be defined BEFORE /api/users/:email/block
app.patch('/api/users/:email', async (req, res) => {
  const email      = decodeURIComponent(req.params.email).toLowerCase();
  const { role, permissions, password } = req.body;
  const ip         = getClientIp(req);
  const ua         = req.headers['user-agent'] || 'unknown';
  const adminEmail = req.headers['x-admin-email'] as string || null;

  try {
    if (isDbConnected) {
      const updates: string[] = [];
      const values:  any[]    = [];
      let   idx = 1;

      if (role !== undefined) {
        updates.push(`role = $${idx++}`);
        values.push(role);
      }
      if (permissions !== undefined) {
        updates.push(`permissions = $${idx++}`);
        values.push(JSON.stringify(permissions));
      }
      if (password && String(password).trim()) {
        updates.push(`password = $${idx++}`);
        values.push(String(password).trim());
      }

      if (updates.length === 0)
        return res.status(400).json({ error: 'Nothing to update.' });

      values.push(email);
      const { rows } = await pool.query(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE LOWER(email) = $${idx}
         RETURNING email, role, is_blocked, created_at, permissions`,
        values
      );

      if (rows.length === 0)
        return res.status(404).json({ error: 'User not found.' });

      await logAudit(
        'USER_UPDATED', adminEmail,
        `Updated user: ${email}${role ? ` | role → ${role}` : ''}${password ? ' | password changed' : ''}`,
        ip, ua
      );
      res.json(rows[0]);

    } else {
      const u = memoryStore.users.find(u => u.email === email);
      if (!u) return res.status(404).json({ error: 'User not found.' });

      if (role !== undefined)        u.role        = role;
      if (permissions !== undefined) u.permissions = permissions;
      if (password && String(password).trim()) u.password = String(password).trim();

      await logAudit('USER_UPDATED', adminEmail, `Updated user (memory): ${email}`, ip, ua);
      const { password: _, ...safe } = u;
      res.json(safe);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH block/unblock — unchanged
app.patch('/api/users/:email/block', async (req, res) => {
  const email      = decodeURIComponent(req.params.email).toLowerCase();
  const is_blocked = Boolean(req.body.is_blocked);
  const ip         = getClientIp(req);
  const ua         = req.headers['user-agent'] || 'unknown';
  const adminEmail = req.headers['x-admin-email'] as string || null;

  try {
    if (isDbConnected) {
      await pool.query('UPDATE users SET is_blocked = $1 WHERE LOWER(email) = $2', [is_blocked, email]);
    } else {
      const u = memoryStore.users.find(u => u.email === email);
      if (u) u.is_blocked = is_blocked;
    }
    const action  = is_blocked ? 'USER_BLOCKED'   : 'USER_UNBLOCKED';
    const details = is_blocked ? `User blocked: ${email}` : `User unblocked: ${email}`;
    await logAudit(action, adminEmail, details, ip, ua);
    res.json({ success: true, email, is_blocked });
  } catch (err: any) {
    await logAudit('USER_BLOCK_ERROR', adminEmail, `Error blocking/unblocking user: ${err.message}`, ip, ua);
    res.status(500).json({ error: err.message });
  }
});

// DELETE user — unchanged
app.delete('/api/users/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email).toLowerCase();
  const ip    = getClientIp(req);
  const ua    = req.headers['user-agent'] || 'unknown';
  const adminEmail = req.headers['x-admin-email'] as string || null;

  try {
    if (isDbConnected) {
      await pool.query('DELETE FROM users WHERE LOWER(email) = $1', [email]);
    } else {
      memoryStore.users = memoryStore.users.filter(u => u.email !== email);
    }
    await logAudit('USER_DELETED', adminEmail, `User deleted: ${email}`, ip, ua);
    res.json({ success: true, email });
  } catch (err: any) {
    await logAudit('USER_DELETE_ERROR', adminEmail, `Error deleting user: ${err.message}`, ip, ua);
    res.status(500).json({ error: err.message });
  }
});

// --- AUDIT LOGS ---
app.get('/api/audit-logs', async (req, res) => {
  const limit  = Math.min(parseInt(String(req.query.limit  || '200')), 500);
  const offset = parseInt(String(req.query.offset || '0'));

  try {
    if (isDbConnected) {
      const { rows } = await pool.query(
        `SELECT id, user_email, action, details, ip_address, user_agent, created_at
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      const countResult = await pool.query('SELECT COUNT(*) FROM audit_logs');
      res.json({ logs: rows, total: parseInt(countResult.rows[0].count) });
    } else {
      const slice = memoryStore.auditLogs.slice(offset, offset + limit);
      res.json({ logs: slice, total: memoryStore.auditLogs.length });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CLEAN DB ---
app.post('/api/clean-db', async (req, res) => {
  try {
    if (isDbConnected) {
      await pool.query('TRUNCATE TABLE materials, puces, sub_nodes, managers, departments RESTART IDENTITY CASCADE;');
    } else {
      memoryStore.departments = [];
      memoryStore.managers    = [];
      memoryStore.subNodes    = [];
      memoryStore.materials   = [];
      memoryStore.puces       = [];
    }
    res.json({ status: 'success' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DEPARTMENTS ---
app.get('/api/departments', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query(`
        SELECT id, name, icon,
               dept_num   AS "deptNum",
               short_code AS "shortCode"
        FROM departments ORDER BY name ASC
      `);
      res.json(rows);
    } else {
      res.json(memoryStore.departments);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', async (req, res) => {
  const { id, name, deptNum, icon, shortCode } = req.body;
  if (!id || !name || !deptNum || !icon || !shortCode) {
    return res.status(400).json({ error: 'Missing required department fields.' });
  }
  try {
    if (isDbConnected) {
      await pool.query(
        `INSERT INTO departments (id, name, dept_num, icon, short_code)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name=$2, dept_num=$3, icon=$4, short_code=$5`,
        [id, name, deptNum, icon, shortCode]
      );
      res.json({ id, name, deptNum, icon, shortCode });
    } else {
      const idx = memoryStore.departments.findIndex(d => d.id === id);
      const payload = { id, name, deptNum, icon, shortCode };
      if (idx > -1) memoryStore.departments[idx] = payload;
      else memoryStore.departments.push(payload);
      res.json(payload);
    }
  } catch (err: any) {
    console.error('❌ DEPARTMENT INSERT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query('DELETE FROM departments WHERE id = $1', [id]);
    } else {
      memoryStore.departments = memoryStore.departments.filter(d => d.id !== id);
      memoryStore.managers    = memoryStore.managers.map(m => m.departmentId === id ? { ...m, departmentId: null } : m);
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MANAGERS ---
app.get('/api/managers', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query(`
        SELECT id, name, email, role, company,
               avatar_color  AS "avatarColor",
               office_num    AS "officeNum",
               department_id AS "departmentId"
        FROM managers ORDER BY name ASC
      `);
      res.json(rows);
    } else {
      res.json(memoryStore.managers);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/managers', async (req, res) => {
  const { id, name, email, role, avatarColor, officeNum, company, departmentId } = req.body;
  if (!id || !name || !email || !role || !avatarColor || !officeNum || !company) {
    return res.status(400).json({ error: 'Missing required manager fields.' });
  }
  try {
    if (isDbConnected) {
      if (departmentId) {
        const deptCheck = await pool.query('SELECT id FROM departments WHERE id = $1', [departmentId]);
        if (deptCheck.rows.length === 0) {
          return res.status(400).json({ error: `Department "${departmentId}" does not exist in the database.` });
        }
      }
      await pool.query(
        `INSERT INTO managers (id, name, email, role, avatar_color, office_num, company, department_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET name=$2, email=$3, role=$4, avatar_color=$5, office_num=$6, company=$7, department_id=$8`,
        [id, name, email, role, avatarColor, officeNum, company, departmentId || null]
      );
      res.json({ id, name, email, role, avatarColor, officeNum, company, departmentId });
    } else {
      const idx = memoryStore.managers.findIndex(m => m.id === id);
      const payload = { id, name, email, role, avatarColor, officeNum, company, departmentId };
      if (idx > -1) memoryStore.managers[idx] = payload;
      else memoryStore.managers.push(payload);
      res.json(payload);
    }
  } catch (err: any) {
    console.error('❌ MANAGER INSERT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/managers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query('DELETE FROM managers WHERE id = $1', [id]);
    } else {
      memoryStore.managers = memoryStore.managers.filter(m => m.id !== id);
      memoryStore.subNodes = memoryStore.subNodes.map(s => s.managerId === id ? { ...s, managerId: null } : s);
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SUB NODES ---
app.get('/api/subnodes', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query(`
        SELECT id, name, type, role, documents,
               office_num AS "officeNum",
               manager_id AS "managerId"
        FROM sub_nodes ORDER BY name ASC
      `);
      res.json(rows);
    } else {
      res.json(memoryStore.subNodes);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subnodes', async (req, res) => {
  const { id, name, type, officeNum, managerId, role } = req.body;
  if (!id || !name || !type || !officeNum) {
    return res.status(400).json({ error: 'Missing required subnode fields.' });
  }
  try {
    if (isDbConnected) {
      if (managerId) {
        const mgrCheck = await pool.query('SELECT id FROM managers WHERE id = $1', [managerId]);
        if (mgrCheck.rows.length === 0) {
          return res.status(400).json({ error: `Manager "${managerId}" does not exist in the database.` });
        }
      }
      await pool.query(
        `INSERT INTO sub_nodes (id, name, type, office_num, manager_id, role)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name=$2, type=$3, office_num=$4, manager_id=$5, role=$6`,
        [id, name, type, officeNum, managerId || null, role || null]
      );
      res.json({ id, name, type, officeNum, managerId, role, documents: [] });
    } else {
      const idx = memoryStore.subNodes.findIndex(s => s.id === id);
      const payload = { id, name, type, officeNum, managerId, role, documents: [] };
      if (idx > -1) memoryStore.subNodes[idx] = payload;
      else memoryStore.subNodes.push(payload);
      res.json(payload);
    }
  } catch (err: any) {
    console.error('❌ SUBNODE INSERT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subnodes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query('DELETE FROM sub_nodes WHERE id = $1', [id]);
    } else {
      memoryStore.subNodes  = memoryStore.subNodes.filter(s => s.id !== id);
      memoryStore.materials = memoryStore.materials.filter(m => m.assignedNodeId !== id);
      memoryStore.puces     = memoryStore.puces.filter(p => p.assignedNodeId !== id);
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOCUMENT UPLOAD ---
app.post('/api/subnodes/:id/documents', upload.array('files'), async (req, res) => {
  const docs = (req.files as Express.Multer.File[]).map(f => ({
    id: crypto.randomUUID(),
    name: f.originalname,
    url: `/uploads/${f.filename}`,
    type: f.mimetype,
    uploadedAt: new Date().toISOString()
  }));
  try {
    if (isDbConnected) {
      await pool.query(
        `UPDATE sub_nodes SET documents = documents || $1::jsonb WHERE id = $2`,
        [JSON.stringify(docs), req.params.id]
      );
    } else {
      const node = memoryStore.subNodes.find(s => s.id === req.params.id) as any;
      if (node) node.documents = [...(node.documents || []), ...docs];
    }
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/subnodes/:id/documents/:docId', async (req, res) => {
  try {
    if (isDbConnected) {
      const result = await pool.query(`SELECT documents FROM sub_nodes WHERE id = $1`, [req.params.id]);
      const filtered = (result.rows[0]?.documents || []).filter((d: any) => d.id !== req.params.docId);
      await pool.query(`UPDATE sub_nodes SET documents = $1 WHERE id = $2`, [JSON.stringify(filtered), req.params.id]);
    } else {
      const node = memoryStore.subNodes.find(s => s.id === req.params.id) as any;
      if (node) node.documents = (node.documents || []).filter((d: any) => d.id !== req.params.docId);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MATERIALS ---
app.get('/api/materials', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query(`
        SELECT id, name, type, company, status, codification, cost, notes, condition,
               dept_num         AS "deptNum",
               office_num       AS "officeNum",
               material_num     AS "materialNum",
               serial_number    AS "serialNumber",
               purchase_date    AS "purchaseDate",
               assigned_node_id AS "assignedNodeId"
        FROM materials ORDER BY name ASC
      `);
      res.json(rows);
    } else {
      res.json(memoryStore.materials);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materials', async (req, res) => {
  const {
    id, name, type, company, deptNum, officeNum, materialNum,
    codification, status, serialNumber, purchaseDate, cost, notes,
    condition,
    assignedNodeId
  } = req.body;

  if (!id || !name || !type || !company || !codification || !status) {
    return res.status(400).json({ error: 'Missing required material fields.' });
  }

  try {
    if (isDbConnected) {
      if (assignedNodeId) {
        const nodeCheck = await pool.query('SELECT id FROM sub_nodes WHERE id = $1', [assignedNodeId]);
        if (nodeCheck.rows.length === 0) {
          return res.status(400).json({ error: `Sub-node "${assignedNodeId}" does not exist in the database.` });
        }
      }
      const { rows } = await pool.query(
        `INSERT INTO materials (
           id, name, type, company, dept_num, office_num, material_num,
           codification, status, serial_number, purchase_date, cost, notes, condition, assigned_node_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO UPDATE SET
           name=$2, type=$3, company=$4, dept_num=$5, office_num=$6, material_num=$7,
           codification=$8, status=$9, serial_number=$10, purchase_date=$11,
           cost=$12, notes=$13, condition=$14, assigned_node_id=$15
         RETURNING
           id, name, type, company, status, codification, cost, notes, condition,
           dept_num AS "deptNum", office_num AS "officeNum", material_num AS "materialNum",
           serial_number AS "serialNumber", purchase_date AS "purchaseDate",
           assigned_node_id AS "assignedNodeId"`,
        [
          id, name, type, company,
          deptNum      || null,
          officeNum    || null,
          materialNum  || null,
          codification, status,
          serialNumber || null,
          purchaseDate || null,
          parseFloat(cost) || 0,
          notes        || null,
          condition    || 'Bon',
          assignedNodeId || null
        ]
      );
      res.json(rows[0]);
    } else {
      const idx = memoryStore.materials.findIndex(m => m.id === id);
      const payload = {
        id, name, type, company, deptNum, officeNum, materialNum,
        codification, status, serialNumber, purchaseDate, cost, notes,
        condition: condition || 'Bon',
        assignedNodeId
      };
      if (idx > -1) memoryStore.materials[idx] = payload;
      else memoryStore.materials.push(payload);
      res.json(payload);
    }
  } catch (err: any) {
    console.error('❌ MATERIAL INSERT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/materials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query('DELETE FROM materials WHERE id = $1', [id]);
    } else {
      memoryStore.materials = memoryStore.materials.filter(m => m.id !== id);
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- PUCES ---
app.get('/api/puces', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query(`
        SELECT id, status,
               serial_number    AS "serialNumber",
               phone_number     AS "phoneNumber",
               puk_code         AS "pukCode",
               monthly_credit   AS "monthlyCredit",
               contract_company AS "contractCompany",
               assigned_node_id AS "assignedNodeId"
        FROM puces ORDER BY phone_number ASC
      `);
      res.json(rows);
    } else {
      res.json(memoryStore.puces);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/puces', async (req, res) => {
  const { id, serialNumber, phoneNumber, pukCode, monthlyCredit, status, assignedNodeId, contractCompany } = req.body;

  if (!id || !serialNumber || !phoneNumber || !pukCode || !status || !contractCompany) {
    return res.status(400).json({ error: 'Missing required puce fields.' });
  }

  try {
    if (isDbConnected) {
      if (assignedNodeId) {
        const nodeCheck = await pool.query('SELECT id FROM sub_nodes WHERE id = $1', [assignedNodeId]);
        if (nodeCheck.rows.length === 0) {
          return res.status(400).json({ error: `Sub-node "${assignedNodeId}" does not exist in the database.` });
        }
      }

      const { rows } = await pool.query(
        `INSERT INTO puces (
           id, serial_number, phone_number, puk_code, monthly_credit, status, contract_company, assigned_node_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           serial_number=$2, phone_number=$3, puk_code=$4, monthly_credit=$5,
           status=$6, contract_company=$7, assigned_node_id=$8
         RETURNING
           id, status,
           serial_number    AS "serialNumber",
           phone_number     AS "phoneNumber",
           puk_code         AS "pukCode",
           monthly_credit   AS "monthlyCredit",
           contract_company AS "contractCompany",
           assigned_node_id AS "assignedNodeId"`,
        [
          id, serialNumber, phoneNumber, pukCode,
          parseFloat(monthlyCredit) || 0,
          status, contractCompany,
          assignedNodeId || null
        ]
      );
      res.json(rows[0]);
    } else {
      const idx = memoryStore.puces.findIndex(p => p.id === id);
      const payload = {
        id, serialNumber, phoneNumber, pukCode,
        monthlyCredit: parseFloat(monthlyCredit) || 0,
        status, contractCompany,
        assignedNodeId: assignedNodeId || null
      };
      if (idx > -1) memoryStore.puces[idx] = payload;
      else memoryStore.puces.push(payload);
      res.json(payload);
    }
  } catch (err: any) {
    console.error('PUCE INSERT ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/puces/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query('DELETE FROM puces WHERE id = $1', [id]);
    } else {
      memoryStore.puces = memoryStore.puces.filter(p => p.id !== id);
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC ASSETS
// ==========================================

async function runExpressAndVite() {
  await checkAndInitializeDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
  });
}

runExpressAndVite();