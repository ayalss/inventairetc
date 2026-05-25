import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
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
app.use(express.json());

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
  users: [
    { email: 'ayalounis679@gmail.com', password: 'luxury', role: 'admin' }
  ] as any[]
};

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
        role       VARCHAR(150)
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
        assigned_node_id VARCHAR(50)    REFERENCES sub_nodes(id) ON DELETE CASCADE
      );
    `);

    // Seed admin user if missing
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      await client.query(
        "INSERT INTO users (email, password, role) VALUES ('ayalounis679@gmail.com', 'luxury', 'admin')"
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
          `INSERT INTO materials (id,name,type,company,dept_num,office_num,material_num,codification,status,serial_number,purchase_date,cost,notes,assigned_node_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`,
          [mat.id, mat.name, mat.type, mat.company, mat.deptNum, mat.officeNum, mat.materialNum,
           mat.codification, mat.status, mat.serialNumber, mat.purchaseDate || null,
           mat.cost, mat.notes || null, mat.assignedNodeId || null]
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

  try {
    if (isDbConnected) {
      const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (rows.length === 0) return res.status(401).json({ error: 'Access Denied: User not found.' });
      const storedPassword = rows[0].password ?? rows[0].password_hash ?? '';
      if (storedPassword !== cleanPassword) return res.status(401).json({ error: 'Access Denied: Invalid password.' });
      return res.json({ success: true, email: rows[0].email });
    } else {
      const user = memoryStore.users.find(u => String(u.email).toLowerCase() === cleanEmail);
      if (!user) return res.status(401).json({ error: 'Access Denied: User not found.' });
      if (String(user.password) !== cleanPassword) return res.status(401).json({ error: 'Access Denied: Invalid password.' });
      return res.json({ success: true, email: user.email });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CLEAN DB ---
app.post('/api/clean-db', async (req, res) => {
  try {
    if (isDbConnected) {
      await pool.query('TRUNCATE TABLE materials, sub_nodes, managers, departments RESTART IDENTITY CASCADE;');
    } else {
      memoryStore.departments = [];
      memoryStore.managers    = [];
      memoryStore.subNodes    = [];
      memoryStore.materials   = [];
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

// FIX: single POST /api/departments for both create and update
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
      // Verify the referenced department exists before inserting
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
        SELECT id, name, type, role,
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
      // Verify the referenced manager exists before inserting
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
      res.json({ id, name, type, officeNum, managerId, role });
    } else {
      const idx = memoryStore.subNodes.findIndex(s => s.id === id);
      const payload = { id, name, type, officeNum, managerId, role };
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
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MATERIALS ---
app.get('/api/materials', async (req, res) => {
  try {
    if (isDbConnected) {
      const { rows } = await pool.query(`
        SELECT id, name, type, company, status, codification, cost, notes,
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

// FIX: single POST /api/materials (duplicate removed)
app.post('/api/materials', async (req, res) => {
  const {
    id, name, type, company, deptNum, officeNum, materialNum,
    codification, status, serialNumber, purchaseDate, cost, notes, assignedNodeId
  } = req.body;

  if (!id || !name || !type || !company || !codification || !status) {
    return res.status(400).json({ error: 'Missing required material fields.' });
  }

  try {
    if (isDbConnected) {
      // Verify the referenced sub_node exists before inserting
      if (assignedNodeId) {
        const nodeCheck = await pool.query('SELECT id FROM sub_nodes WHERE id = $1', [assignedNodeId]);
        if (nodeCheck.rows.length === 0) {
          return res.status(400).json({ error: `Sub-node "${assignedNodeId}" does not exist in the database.` });
        }
      }
      const { rows } = await pool.query(
        `INSERT INTO materials (
           id, name, type, company, dept_num, office_num, material_num,
           codification, status, serial_number, purchase_date, cost, notes, assigned_node_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (id) DO UPDATE SET
           name=$2, type=$3, company=$4, dept_num=$5, office_num=$6, material_num=$7,
           codification=$8, status=$9, serial_number=$10, purchase_date=$11,
           cost=$12, notes=$13, assigned_node_id=$14
         RETURNING
           id, name, type, company, status, codification, cost, notes,
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
          assignedNodeId || null
        ]
      );
      res.json(rows[0]);
    } else {
      const idx = memoryStore.materials.findIndex(m => m.id === id);
      const payload = {
        id, name, type, company, deptNum, officeNum, materialNum,
        codification, status, serialNumber, purchaseDate, cost, notes, assignedNodeId
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