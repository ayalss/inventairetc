import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'inventory',
  connectionTimeoutMillis: 4000,
  idleTimeoutMillis: 10000,
  max: 10,
  allowExitOnIdle: true,
};

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  dbConfig.connectionString = process.env.DATABASE_URL;
}

const pool = new Pool(dbConfig);

const cache = {
  departments: [],
  managers: [],
  subNodes: [],
  materials: [],
  puces: [],
  enrichedMaterials: [],
  enrichedPuces: [],
  lastUpdated: null,
  refreshTimer: null,
};

function mapDepartment(row) {
  return {
    id: row.id,
    name: row.name,
    deptNum: row.dept_num,
    icon: row.icon,
    shortCode: row.short_code,
  };
}

function mapManager(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarColor: row.avatar_color,
    officeNum: row.office_num,
    company: row.company,
    departmentId: row.department_id,
  };
}

function mapSubNode(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    officeNum: row.office_num,
    managerId: row.manager_id,
    role: row.role,
  };
}

function mapMaterial(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    company: row.company,
    deptNum: row.dept_num,
    officeNum: row.office_num,
    materialNum: row.material_num,
    codification: row.codification,
    status: row.status,
    serialNumber: row.serial_number,
    purchaseDate: row.purchase_date ?? undefined,
    cost: Number(row.cost ?? 0),
    notes: row.notes ?? undefined,
    condition: row.condition ?? 'Bon',
    assignedNodeId: row.assigned_node_id ?? '',
  };
}

function mapPuce(row) {
  return {
    id: row.id,
    serialNumber: row.serial_number,
    phoneNumber: row.phone_number,
    pukCode: row.puk_code,
    monthlyCredit: Number(row.monthly_credit ?? 0),
    status: row.status,
    contractCompany: row.contract_company,
    assignedNodeId: row.assigned_node_id ?? '',
  };
}

function buildEnrichedMaterials(materials, subNodes, managers, departments) {
  return materials.map(item => {
    const node = subNodes.find(n => n.id === item.assignedNodeId);
    const manager = node ? managers.find(m => m.id === node.managerId) : undefined;
    const department = manager ? departments.find(d => d.id === manager.departmentId) : undefined;
    return { item, node, manager, department };
  });
}

function buildEnrichedPuces(puces, subNodes, managers, departments) {
  return puces.map(item => {
    const node = subNodes.find(n => n.id === item.assignedNodeId);
    const manager = node ? managers.find(m => m.id === node.managerId) : undefined;
    const department = manager ? departments.find(d => d.id === manager.departmentId) : undefined;
    return { item, node, manager, department };
  });
}

async function fetchRows() {
  const [departmentsResult, managersResult, subNodesResult, materialsResult, pucesResult] = await Promise.all([
    pool.query('SELECT id, name, dept_num, icon, short_code FROM departments ORDER BY name ASC'),
    pool.query('SELECT id, name, email, role, avatar_color, office_num, company, department_id FROM managers ORDER BY name ASC'),
    pool.query('SELECT id, name, type, office_num, manager_id, role FROM sub_nodes ORDER BY name ASC'),
    pool.query('SELECT id, name, type, company, dept_num, office_num, material_num, codification, status, serial_number, purchase_date, cost, notes, condition, assigned_node_id FROM materials ORDER BY name ASC'),
    pool.query('SELECT id, serial_number, phone_number, puk_code, monthly_credit, status, contract_company, assigned_node_id FROM puces ORDER BY phone_number ASC'),
  ]);

  return {
    departments: departmentsResult.rows.map(mapDepartment),
    managers: managersResult.rows.map(mapManager),
    subNodes: subNodesResult.rows.map(mapSubNode),
    materials: materialsResult.rows.map(mapMaterial),
    puces: pucesResult.rows.map(mapPuce),
  };
}

export function getCachedEnrichedData() {
  return {
    departments: cache.departments,
    managers: cache.managers,
    subNodes: cache.subNodes,
    materials: cache.materials,
    puces: cache.puces,
    enrichedMaterials: cache.enrichedMaterials,
    enrichedPuces: cache.enrichedPuces,
    lastUpdated: cache.lastUpdated,
  };
}

export async function refreshEnrichedCache() {
  const rows = await fetchRows();
  cache.departments = rows.departments;
  cache.managers = rows.managers;
  cache.subNodes = rows.subNodes;
  cache.materials = rows.materials;
  cache.puces = rows.puces;
  cache.enrichedMaterials = buildEnrichedMaterials(rows.materials, rows.subNodes, rows.managers, rows.departments);
  cache.enrichedPuces = buildEnrichedPuces(rows.puces, rows.subNodes, rows.managers, rows.departments);
  cache.lastUpdated = new Date();
  return getCachedEnrichedData();
}

export function startAutoRefresh(intervalMs = 180000) {
  if (cache.refreshTimer) {
    clearInterval(cache.refreshTimer);
  }
  cache.refreshTimer = setInterval(async () => {
    try {
      await refreshEnrichedCache();
      console.log('[telegramBot] Enriched cache refreshed.');
    } catch (err) {
      console.error('[telegramBot] Failed to refresh enriched cache:', err);
    }
  }, intervalMs);
  return cache.refreshTimer;
}

export async function initEnrichedCache(options = {}) {
  await refreshEnrichedCache();
  startAutoRefresh(options.refreshIntervalMs ?? 180000);
  return getCachedEnrichedData();
}

export function stopAutoRefresh() {
  if (cache.refreshTimer) {
    clearInterval(cache.refreshTimer);
    cache.refreshTimer = null;
  }
}
