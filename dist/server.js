var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_pg = __toESM(require("pg"), 1);
var import_vite = require("vite");

// src/data.ts
var INITIAL_DEPARTMENTS = [
  { id: "dept-it", name: "Information Technology", deptNum: "10", icon: "Network", shortCode: "IT" },
  { id: "dept-finance", name: "Finance & Audit", deptNum: "20", icon: "Coins", shortCode: "FIN" },
  { id: "dept-hr", name: "Human Resources", deptNum: "30", icon: "Users", shortCode: "HR" },
  { id: "dept-engineering", name: "Engineering & R&D", deptNum: "40", icon: "Cpu", shortCode: "ENG" },
  { id: "dept-logistics", name: "Logistics & Supply Chain", deptNum: "50", icon: "Truck", shortCode: "LOG" }
];
var INITIAL_MANAGERS = [
  // IT Managers (Dept 10)
  {
    id: "mng-alex",
    name: "Alexander Wright",
    email: "a.wright@tc-group.com",
    role: "IT Director (TC)",
    avatarColor: "bg-indigo-500",
    officeNum: "101",
    company: "TC",
    departmentId: "dept-it"
  },
  {
    id: "mng-helena",
    name: "Helena Rostova",
    email: "h.rostova@lx-corp.com",
    role: "Global Network Chief (LX)",
    avatarColor: "bg-emerald-500",
    officeNum: "201",
    company: "LX",
    departmentId: "dept-it"
  },
  {
    id: "mng-david",
    name: "David Kim",
    email: "d.kim@pl-industries.com",
    role: "Infrastructure Manager (PL)",
    avatarColor: "bg-red-500",
    officeNum: "301",
    company: "PL",
    departmentId: "dept-it"
  },
  // Finance Managers (Dept 20)
  {
    id: "mng-sophie",
    name: "Sophie Laurent",
    email: "s.laurent@tc-group.com",
    role: "Chief Auditor (TC)",
    avatarColor: "bg-pink-500",
    officeNum: "105",
    company: "TC",
    departmentId: "dept-finance"
  },
  {
    id: "mng-julian",
    name: "Julian Vance",
    email: "j.vance@lx-corp.com",
    role: "Finance Controller (LX)",
    avatarColor: "bg-purple-500",
    officeNum: "205",
    company: "LX",
    departmentId: "dept-finance"
  },
  // HR Managers (Dept 30)
  {
    id: "mng-clara",
    name: "Clara Oswald",
    email: "c.oswald@tc-group.com",
    role: "Talent Acquisition VP (TC)",
    avatarColor: "bg-teal-500",
    officeNum: "108",
    company: "TC",
    departmentId: "dept-hr"
  },
  {
    id: "mng-marcus",
    name: "Marcus Aurelius",
    email: "m.aurelius@pl-industries.com",
    role: "Employee Relations Lead (PL)",
    avatarColor: "bg-cyan-500",
    officeNum: "308",
    company: "PL",
    departmentId: "dept-hr"
  },
  // R&D Managers (Dept 40)
  {
    id: "mng-linus",
    name: "Linus Torvalds",
    email: "l.torvalds@lx-corp.com",
    role: "Systems Chief Architect (LX)",
    avatarColor: "bg-rose-500",
    officeNum: "211",
    company: "LX",
    departmentId: "dept-engineering"
  },
  {
    id: "mng-ada",
    name: "Ada Lovelace",
    email: "a.lovelace@pl-industries.com",
    role: "Director of Machine Intelligence (PL)",
    avatarColor: "bg-blue-600",
    officeNum: "315",
    company: "PL",
    departmentId: "dept-engineering"
  },
  // Logistics Managers (Dept 50)
  {
    id: "mng-hugo",
    name: "Hugo Dupont",
    email: "h.dupont@tc-group.com",
    role: "Supply Chain Operations VP (TC)",
    avatarColor: "bg-orange-500",
    officeNum: "112",
    company: "TC",
    departmentId: "dept-logistics"
  }
];
var INITIAL_SUB_NODES = [
  // Under Alexander Wright (mng-alex, IT, TC, Office 101)
  {
    id: "node-alex",
    name: "Alexander Wright",
    type: "Person",
    officeNum: "101",
    managerId: "mng-alex",
    role: "IT Director (TC)"
  },
  {
    id: "node-peter",
    name: "Peter Parker",
    type: "Person",
    officeNum: "101-C",
    managerId: "mng-alex",
    role: "IT Tech Lead"
  },
  {
    id: "node-ned",
    name: "Ned Leeds",
    type: "Person",
    officeNum: "101-B",
    managerId: "mng-alex",
    role: "Senior Systems Engineer"
  },
  // Under Helena Rostova (mng-helena, IT, LX, Office 201)
  {
    id: "node-helena",
    name: "Helena Rostova",
    type: "Person",
    officeNum: "201",
    managerId: "mng-helena",
    role: "Global Network Chief (LX)"
  },
  {
    id: "node-natasha",
    name: "Natasha Romanoff",
    type: "Person",
    officeNum: "201-B",
    managerId: "mng-helena",
    role: "Cybersecurity Analyst"
  },
  // Under David Kim (mng-david, IT, PL, Office 301)
  {
    id: "node-david",
    name: "David Kim",
    type: "Person",
    officeNum: "301",
    managerId: "mng-david",
    role: "Infrastructure Manager (PL)"
  },
  {
    id: "node-steve",
    name: "Steve Rogers",
    type: "Person",
    officeNum: "301-B",
    managerId: "mng-david",
    role: "Specialist Support Lead"
  },
  // Under Sophie Laurent (mng-sophie, Finance, TC, Office 105)
  {
    id: "node-sophie",
    name: "Sophie Laurent",
    type: "Person",
    officeNum: "105",
    managerId: "mng-sophie",
    role: "Chief Auditor (TC)"
  },
  {
    id: "node-bruce",
    name: "Bruce Wayne",
    type: "Person",
    officeNum: "105-B",
    managerId: "mng-sophie",
    role: "Senior Accountant Analyst"
  },
  // Under Julian Vance (mng-julian, Finance, LX, Office 205)
  {
    id: "node-julian",
    name: "Julian Vance",
    type: "Person",
    officeNum: "205",
    managerId: "mng-julian",
    role: "Finance Controller (LX)"
  },
  // Under Linus Torvalds (mng-linus, Engineering, LX, Office 211)
  {
    id: "node-linus",
    name: "Linus Torvalds",
    type: "Person",
    officeNum: "211",
    managerId: "mng-linus",
    role: "Systems Chief Architect (LX)"
  },
  {
    id: "node-torvalds-crew",
    name: "Richard Stallman",
    type: "Person",
    officeNum: "211-B",
    managerId: "mng-linus",
    role: "Kernel Specialist"
  }
];
var INITIAL_MATERIALS = [
  // materials under Alexander Wright (node-alex, IT, TC, 101)
  // Server#1, Switch#1, UPS#1 — each type starts at 1
  {
    id: "mat-1",
    name: "Dell PowerEdge R750 Enterprise Server",
    type: "Server",
    company: "TC",
    deptNum: "10",
    officeNum: "101",
    materialNum: "1",
    codification: "T-10-101-SRV1",
    status: "Active",
    serialNumber: "SN-7729-XEON",
    purchaseDate: "2025-01-15",
    cost: 5400,
    assignedNodeId: "node-alex",
    notes: "Primary active domain controller and database mirror."
  },
  {
    id: "mat-2",
    name: "Cisco Catalyst 9300 48-Port WAN Switch",
    type: "Switch",
    company: "TC",
    deptNum: "10",
    officeNum: "101",
    materialNum: "1",
    codification: "T-10-101-SW1",
    status: "Active",
    serialNumber: "CISC-CAT-9300-X39",
    purchaseDate: "2024-11-20",
    cost: 3200,
    assignedNodeId: "node-alex",
    notes: "Handles 10Gbps backbone fiber link to floor aggregates."
  },
  {
    id: "mat-3",
    name: "APC Smart-UPS SRT 5000VA Battery Rack",
    type: "UPS",
    company: "TC",
    deptNum: "10",
    officeNum: "101",
    materialNum: "1",
    codification: "T-10-101-UPS1",
    status: "Active",
    serialNumber: "APC-SRT5K-9902",
    purchaseDate: "2025-02-10",
    cost: 1850,
    assignedNodeId: "node-alex",
    notes: "Battery runtime approx 45 mins under full rack load."
  },
  // materials under Ned Leeds (node-ned, IT, TC, 101-B)
  // Desktop#1, Screen#1, Printer#1 — each type starts at 1
  {
    id: "mat-4",
    name: "HP ProDesk Mini G9 PC Workstation",
    type: "Desktop",
    company: "TC",
    deptNum: "10",
    officeNum: "101-B",
    materialNum: "1",
    codification: "T-10-101-B-PC1",
    status: "Active",
    serialNumber: "HP-PD-G9-0199",
    purchaseDate: "2025-03-01",
    cost: 1100,
    assignedNodeId: "node-ned",
    notes: "Assigned to Dev Station 1"
  },
  {
    id: "mat-5",
    name: 'Dell UltraSharp 32" Curved 4K Display',
    type: "Screen",
    company: "TC",
    deptNum: "10",
    officeNum: "101-B",
    materialNum: "1",
    codification: "T-10-101-B-ECR1",
    status: "Active",
    serialNumber: "DELL-US32-DEVC",
    purchaseDate: "2025-03-02",
    cost: 850,
    assignedNodeId: "node-ned",
    notes: "Dual screen setup for high efficiency code reviews"
  },
  {
    id: "mat-6",
    name: "Epson WorkForce Enterprise Color Printer",
    type: "Printer",
    company: "TC",
    deptNum: "10",
    officeNum: "101-B",
    materialNum: "1",
    codification: "T-10-101-B-IMP1",
    status: "Active",
    serialNumber: "EPS-WFE-499X",
    purchaseDate: "2024-05-18",
    cost: 1400,
    assignedNodeId: "node-ned",
    notes: "Shared workgroup multifunction printer"
  },
  // materials under Peter Parker (node-peter, IT, TC, 101-C)
  // Laptop#1
  {
    id: "mat-7",
    name: 'Apple MacBook Pro M3 Max 16"',
    type: "Laptop",
    company: "TC",
    deptNum: "10",
    officeNum: "101-C",
    materialNum: "1",
    codification: "T-10-101-C-LAP1",
    status: "Active",
    serialNumber: "CO2G38DJ16M3",
    purchaseDate: "2025-04-12",
    cost: 3499,
    assignedNodeId: "node-peter",
    notes: "High power mobile development unit."
  },
  // materials under Helena Rostova (node-helena, IT, LX, 201)
  // Switch#1, UPS#1
  {
    id: "mat-8",
    name: "Ubiquiti UniFi Dream Machine Pro Gateway",
    type: "Switch",
    company: "LX",
    deptNum: "10",
    officeNum: "201",
    materialNum: "1",
    codification: "L-10-201-SW1",
    status: "Active",
    serialNumber: "UBQ-UDM-PRO-LC9",
    purchaseDate: "2024-08-30",
    cost: 950,
    assignedNodeId: "node-helena",
    notes: "Core routing and security gateway with integrated NVR."
  },
  {
    id: "mat-9",
    name: "Eaton 9PX Double-Conversion UPS 1500W",
    type: "UPS",
    company: "LX",
    deptNum: "10",
    officeNum: "201",
    materialNum: "1",
    codification: "L-10-201-UPS1",
    status: "Active",
    serialNumber: "EATN-9PX-82910",
    purchaseDate: "2024-09-02",
    cost: 1200,
    assignedNodeId: "node-helena",
    notes: "Provides filtered active sinewave power to critical switches."
  },
  // materials under Sophie Laurent (node-sophie, Finance, TC, 105)
  // Printer#1
  {
    id: "mat-10",
    name: "HP LaserJet Managed MFP E60155 DN",
    type: "Printer",
    company: "TC",
    deptNum: "20",
    officeNum: "105",
    materialNum: "1",
    codification: "T-20-105-IMP1",
    status: "Active",
    serialNumber: "HP-LJMFP-E60-72",
    purchaseDate: "2024-02-14",
    cost: 2100,
    assignedNodeId: "node-sophie",
    notes: "Secure badge release print enabled for financial compliance."
  },
  // materials under Bruce Wayne (node-bruce, Finance, TC, 105-B)
  // Desktop#1
  {
    id: "mat-11",
    name: "Lenovo ThinkCentre Neo 50t Tiny Tower",
    type: "Desktop",
    company: "TC",
    deptNum: "20",
    officeNum: "105-B",
    materialNum: "1",
    codification: "T-20-105-B-PC1",
    status: "Active",
    serialNumber: "LNV-TC-NEO50-482",
    purchaseDate: "2025-01-20",
    cost: 890,
    assignedNodeId: "node-bruce",
    notes: "Dedicated ledger processing node."
  },
  // materials under Linus Torvalds (node-linus, R&D, LX, 211)
  // Server#1
  {
    id: "mat-12",
    name: "Supermicro SuperServer 4029GP Dual Xeon",
    type: "Server",
    company: "LX",
    deptNum: "40",
    officeNum: "211",
    materialNum: "1",
    codification: "L-40-211-SRV1",
    status: "Active",
    serialNumber: "SMC-4029-GP-GPU8",
    purchaseDate: "2025-03-30",
    cost: 14500,
    assignedNodeId: "node-linus",
    notes: "Host containing 4x NVIDIA H100 cards for AI simulation runtimes."
  },
  // materials under Richard Stallman (node-torvalds-crew, R&D, LX, 211-B)
  // Switch#1
  {
    id: "mat-13",
    name: "Mellanox Quantum InfiniBand 40-Port Switch",
    type: "Switch",
    company: "LX",
    deptNum: "40",
    officeNum: "211-B",
    materialNum: "1",
    codification: "L-40-211-B-SW1",
    status: "Active",
    serialNumber: "MLNX-QIB-40P-99",
    purchaseDate: "2025-04-02",
    cost: 6700,
    assignedNodeId: "node-torvalds-crew",
    notes: "Extremely high bandwidth inter-cluster fabric backplane."
  }
];

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var { Pool } = import_pg.default;
var dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "inventory",
  connectionTimeoutMillis: 4e3,
  idleTimeoutMillis: 1e4
};
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
  dbConfig.connectionString = process.env.DATABASE_URL;
}
var pool = new Pool(dbConfig);
var isDbConnected = false;
var activeConnectionError = "";
var memoryStore = {
  departments: [...INITIAL_DEPARTMENTS],
  managers: [...INITIAL_MANAGERS],
  subNodes: [...INITIAL_SUB_NODES],
  materials: [...INITIAL_MATERIALS],
  users: [
    { email: "ayalounis679@gmail.com", password: "luxury", role: "admin" }
  ]
};
async function checkAndInitializeDatabase() {
  try {
    console.log(`[POSTGRES] Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);
    const client = await pool.connect();
    isDbConnected = true;
    activeConnectionError = "";
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
    const userCount = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCount.rows[0].count) === 0) {
      await client.query(
        "INSERT INTO users (email, password, role) VALUES ('ayalounis679@gmail.com', 'luxury', 'admin')"
      );
      console.log("[POSTGRES] Admin user seeded.");
    }
    const deptCount = await client.query("SELECT COUNT(*) FROM departments");
    if (parseInt(deptCount.rows[0].count) === 0) {
      console.log("[POSTGRES] Seeding initial data...");
      for (const d of INITIAL_DEPARTMENTS) {
        await client.query(
          "INSERT INTO departments (id, name, dept_num, icon, short_code) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING",
          [d.id, d.name, d.deptNum, d.icon, d.shortCode]
        );
      }
      for (const m of INITIAL_MANAGERS) {
        await client.query(
          "INSERT INTO managers (id, name, email, role, avatar_color, office_num, company, department_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING",
          [m.id, m.name, m.email, m.role, m.avatarColor, m.officeNum, m.company, m.departmentId || null]
        );
      }
      for (const s of INITIAL_SUB_NODES) {
        await client.query(
          "INSERT INTO sub_nodes (id, name, type, office_num, manager_id, role) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING",
          [s.id, s.name, s.type, s.officeNum, s.managerId || null, s.role || null]
        );
      }
      for (const mat of INITIAL_MATERIALS) {
        await client.query(
          `INSERT INTO materials (id,name,type,company,dept_num,office_num,material_num,codification,status,serial_number,purchase_date,cost,notes,assigned_node_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING`,
          [
            mat.id,
            mat.name,
            mat.type,
            mat.company,
            mat.deptNum,
            mat.officeNum,
            mat.materialNum,
            mat.codification,
            mat.status,
            mat.serialNumber,
            mat.purchaseDate || null,
            mat.cost,
            mat.notes || null,
            mat.assignedNodeId || null
          ]
        );
      }
      console.log("[POSTGRES] Initial seeding complete.");
    }
    client.release();
  } catch (err) {
    isDbConnected = false;
    activeConnectionError = err.message || "Unknown error";
    console.log("[DB] PostgreSQL unavailable \u2014 running on in-memory fallback.");
  }
}
app.use(async (req, res, next) => {
  if (!isDbConnected && req.path.startsWith("/api/") && req.path !== "/api/db-status") {
    try {
      const client = await pool.connect();
      isDbConnected = true;
      activeConnectionError = "";
      client.release();
    } catch {
    }
  }
  next();
});
app.get("/api/db-status", (req, res) => {
  res.json({
    connected: isDbConnected,
    dbName: dbConfig.database,
    fallback: !isDbConnected,
    error: activeConnectionError || null
  });
});
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();
  try {
    if (isDbConnected) {
      const { rows } = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1", [cleanEmail]);
      if (rows.length === 0) return res.status(401).json({ error: "Access Denied: User not found." });
      const storedPassword = rows[0].password ?? rows[0].password_hash ?? "";
      if (storedPassword !== cleanPassword) return res.status(401).json({ error: "Access Denied: Invalid password." });
      return res.json({ success: true, email: rows[0].email });
    } else {
      const user = memoryStore.users.find((u) => String(u.email).toLowerCase() === cleanEmail);
      if (!user) return res.status(401).json({ error: "Access Denied: User not found." });
      if (String(user.password) !== cleanPassword) return res.status(401).json({ error: "Access Denied: Invalid password." });
      return res.json({ success: true, email: user.email });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/clean-db", async (req, res) => {
  try {
    if (isDbConnected) {
      await pool.query("TRUNCATE TABLE materials, sub_nodes, managers, departments RESTART IDENTITY CASCADE;");
    } else {
      memoryStore.departments = [];
      memoryStore.managers = [];
      memoryStore.subNodes = [];
      memoryStore.materials = [];
    }
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/departments", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/departments", async (req, res) => {
  const { id, name, deptNum, icon, shortCode } = req.body;
  if (!id || !name || !deptNum || !icon || !shortCode) {
    return res.status(400).json({ error: "Missing required department fields." });
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
      const idx = memoryStore.departments.findIndex((d) => d.id === id);
      const payload = { id, name, deptNum, icon, shortCode };
      if (idx > -1) memoryStore.departments[idx] = payload;
      else memoryStore.departments.push(payload);
      res.json(payload);
    }
  } catch (err) {
    console.error("\u274C DEPARTMENT INSERT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/departments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query("DELETE FROM departments WHERE id = $1", [id]);
    } else {
      memoryStore.departments = memoryStore.departments.filter((d) => d.id !== id);
      memoryStore.managers = memoryStore.managers.map((m) => m.departmentId === id ? { ...m, departmentId: null } : m);
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/managers", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/managers", async (req, res) => {
  const { id, name, email, role, avatarColor, officeNum, company, departmentId } = req.body;
  if (!id || !name || !email || !role || !avatarColor || !officeNum || !company) {
    return res.status(400).json({ error: "Missing required manager fields." });
  }
  try {
    if (isDbConnected) {
      if (departmentId) {
        const deptCheck = await pool.query("SELECT id FROM departments WHERE id = $1", [departmentId]);
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
      const idx = memoryStore.managers.findIndex((m) => m.id === id);
      const payload = { id, name, email, role, avatarColor, officeNum, company, departmentId };
      if (idx > -1) memoryStore.managers[idx] = payload;
      else memoryStore.managers.push(payload);
      res.json(payload);
    }
  } catch (err) {
    console.error("\u274C MANAGER INSERT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/managers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query("DELETE FROM managers WHERE id = $1", [id]);
    } else {
      memoryStore.managers = memoryStore.managers.filter((m) => m.id !== id);
      memoryStore.subNodes = memoryStore.subNodes.map((s) => s.managerId === id ? { ...s, managerId: null } : s);
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/subnodes", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/subnodes", async (req, res) => {
  const { id, name, type, officeNum, managerId, role } = req.body;
  if (!id || !name || !type || !officeNum) {
    return res.status(400).json({ error: "Missing required subnode fields." });
  }
  try {
    if (isDbConnected) {
      if (managerId) {
        const mgrCheck = await pool.query("SELECT id FROM managers WHERE id = $1", [managerId]);
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
      const idx = memoryStore.subNodes.findIndex((s) => s.id === id);
      const payload = { id, name, type, officeNum, managerId, role };
      if (idx > -1) memoryStore.subNodes[idx] = payload;
      else memoryStore.subNodes.push(payload);
      res.json(payload);
    }
  } catch (err) {
    console.error("\u274C SUBNODE INSERT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/subnodes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query("DELETE FROM sub_nodes WHERE id = $1", [id]);
    } else {
      memoryStore.subNodes = memoryStore.subNodes.filter((s) => s.id !== id);
      memoryStore.materials = memoryStore.materials.filter((m) => m.assignedNodeId !== id);
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/materials", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/materials", async (req, res) => {
  const {
    id,
    name,
    type,
    company,
    deptNum,
    officeNum,
    materialNum,
    codification,
    status,
    serialNumber,
    purchaseDate,
    cost,
    notes,
    assignedNodeId
  } = req.body;
  if (!id || !name || !type || !company || !codification || !status) {
    return res.status(400).json({ error: "Missing required material fields." });
  }
  try {
    if (isDbConnected) {
      if (assignedNodeId) {
        const nodeCheck = await pool.query("SELECT id FROM sub_nodes WHERE id = $1", [assignedNodeId]);
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
          id,
          name,
          type,
          company,
          deptNum || null,
          officeNum || null,
          materialNum || null,
          codification,
          status,
          serialNumber || null,
          purchaseDate || null,
          parseFloat(cost) || 0,
          notes || null,
          assignedNodeId || null
        ]
      );
      res.json(rows[0]);
    } else {
      const idx = memoryStore.materials.findIndex((m) => m.id === id);
      const payload = {
        id,
        name,
        type,
        company,
        deptNum,
        officeNum,
        materialNum,
        codification,
        status,
        serialNumber,
        purchaseDate,
        cost,
        notes,
        assignedNodeId
      };
      if (idx > -1) memoryStore.materials[idx] = payload;
      else memoryStore.materials.push(payload);
      res.json(payload);
    }
  } catch (err) {
    console.error("\u274C MATERIAL INSERT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/materials/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected) {
      await pool.query("DELETE FROM materials WHERE id = $1", [id]);
    } else {
      memoryStore.materials = memoryStore.materials.filter((m) => m.id !== id);
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function runExpressAndVite() {
  await checkAndInitializeDatabase();
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
  });
}
runExpressAndVite();
//# sourceMappingURL=server.js.map
