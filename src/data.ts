import { Department, Manager, SubNode, Material } from './types.ts';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-it', name: 'Information Technology', deptNum: '10', icon: 'Network', shortCode: 'IT' },
  { id: 'dept-finance', name: 'Finance & Audit', deptNum: '20', icon: 'Coins', shortCode: 'FIN' },
  { id: 'dept-hr', name: 'Human Resources', deptNum: '30', icon: 'Users', shortCode: 'HR' },
  { id: 'dept-engineering', name: 'Engineering & R&D', deptNum: '40', icon: 'Cpu', shortCode: 'ENG' },
  { id: 'dept-logistics', name: 'Logistics & Supply Chain', deptNum: '50', icon: 'Truck', shortCode: 'LOG' }
];

export const INITIAL_MANAGERS: Manager[] = [
  // IT Managers (Dept 10)
  {
    id: 'mng-alex',
    name: 'Alexander Wright',
    email: 'a.wright@tc-group.com',
    role: 'IT Director (TC)',
    avatarColor: 'bg-indigo-500',
    officeNum: '101',
    company: 'TC',
    departmentId: 'dept-it'
  },
  {
    id: 'mng-helena',
    name: 'Helena Rostova',
    email: 'h.rostova@lx-corp.com',
    role: 'Global Network Chief (LX)',
    avatarColor: 'bg-emerald-500',
    officeNum: '201',
    company: 'LX',
    departmentId: 'dept-it'
  },
  {
    id: 'mng-david',
    name: 'David Kim',
    email: 'd.kim@pl-industries.com',
    role: 'Infrastructure Manager (PL)',
    avatarColor: 'bg-red-500',
    officeNum: '301',
    company: 'PL',
    departmentId: 'dept-it'
  },

  // Finance Managers (Dept 20)
  {
    id: 'mng-sophie',
    name: 'Sophie Laurent',
    email: 's.laurent@tc-group.com',
    role: 'Chief Auditor (TC)',
    avatarColor: 'bg-pink-500',
    officeNum: '105',
    company: 'TC',
    departmentId: 'dept-finance'
  },
  {
    id: 'mng-julian',
    name: 'Julian Vance',
    email: 'j.vance@lx-corp.com',
    role: 'Finance Controller (LX)',
    avatarColor: 'bg-purple-500',
    officeNum: '205',
    company: 'LX',
    departmentId: 'dept-finance'
  },

  // HR Managers (Dept 30)
  {
    id: 'mng-clara',
    name: 'Clara Oswald',
    email: 'c.oswald@tc-group.com',
    role: 'Talent Acquisition VP (TC)',
    avatarColor: 'bg-teal-500',
    officeNum: '108',
    company: 'TC',
    departmentId: 'dept-hr'
  },
  {
    id: 'mng-marcus',
    name: 'Marcus Aurelius',
    email: 'm.aurelius@pl-industries.com',
    role: 'Employee Relations Lead (PL)',
    avatarColor: 'bg-cyan-500',
    officeNum: '308',
    company: 'PL',
    departmentId: 'dept-hr'
  },

  // R&D Managers (Dept 40)
  {
    id: 'mng-linus',
    name: 'Linus Torvalds',
    email: 'l.torvalds@lx-corp.com',
    role: 'Systems Chief Architect (LX)',
    avatarColor: 'bg-rose-500',
    officeNum: '211',
    company: 'LX',
    departmentId: 'dept-engineering'
  },
  {
    id: 'mng-ada',
    name: 'Ada Lovelace',
    email: 'a.lovelace@pl-industries.com',
    role: 'Director of Machine Intelligence (PL)',
    avatarColor: 'bg-blue-600',
    officeNum: '315',
    company: 'PL',
    departmentId: 'dept-engineering'
  },

  // Logistics Managers (Dept 50)
  {
    id: 'mng-hugo',
    name: 'Hugo Dupont',
    email: 'h.dupont@tc-group.com',
    role: 'Supply Chain Operations VP (TC)',
    avatarColor: 'bg-orange-500',
    officeNum: '112',
    company: 'TC',
    departmentId: 'dept-logistics'
  }
];

export const INITIAL_SUB_NODES: SubNode[] = [
  // Under Alexander Wright (mng-alex, IT, TC, Office 101)
  {
    id: 'node-alex',
    name: 'Alexander Wright',
    type: 'Person',
    officeNum: '101',
    managerId: 'mng-alex',
    role: 'IT Director (TC)'
  },
  {
    id: 'node-peter',
    name: 'Peter Parker',
    type: 'Person',
    officeNum: '101-C',
    managerId: 'mng-alex',
    role: 'IT Tech Lead'
  },
  {
    id: 'node-ned',
    name: 'Ned Leeds',
    type: 'Person',
    officeNum: '101-B',
    managerId: 'mng-alex',
    role: 'Senior Systems Engineer'
  },

  // Under Helena Rostova (mng-helena, IT, LX, Office 201)
  {
    id: 'node-helena',
    name: 'Helena Rostova',
    type: 'Person',
    officeNum: '201',
    managerId: 'mng-helena',
    role: 'Global Network Chief (LX)'
  },
  {
    id: 'node-natasha',
    name: 'Natasha Romanoff',
    type: 'Person',
    officeNum: '201-B',
    managerId: 'mng-helena',
    role: 'Cybersecurity Analyst'
  },

  // Under David Kim (mng-david, IT, PL, Office 301)
  {
    id: 'node-david',
    name: 'David Kim',
    type: 'Person',
    officeNum: '301',
    managerId: 'mng-david',
    role: 'Infrastructure Manager (PL)'
  },
  {
    id: 'node-steve',
    name: 'Steve Rogers',
    type: 'Person',
    officeNum: '301-B',
    managerId: 'mng-david',
    role: 'Specialist Support Lead'
  },

  // Under Sophie Laurent (mng-sophie, Finance, TC, Office 105)
  {
    id: 'node-sophie',
    name: 'Sophie Laurent',
    type: 'Person',
    officeNum: '105',
    managerId: 'mng-sophie',
    role: 'Chief Auditor (TC)'
  },
  {
    id: 'node-bruce',
    name: 'Bruce Wayne',
    type: 'Person',
    officeNum: '105-B',
    managerId: 'mng-sophie',
    role: 'Senior Accountant Analyst'
  },

  // Under Julian Vance (mng-julian, Finance, LX, Office 205)
  {
    id: 'node-julian',
    name: 'Julian Vance',
    type: 'Person',
    officeNum: '205',
    managerId: 'mng-julian',
    role: 'Finance Controller (LX)'
  },

  // Under Linus Torvalds (mng-linus, Engineering, LX, Office 211)
  {
    id: 'node-linus',
    name: 'Linus Torvalds',
    type: 'Person',
    officeNum: '211',
    managerId: 'mng-linus',
    role: 'Systems Chief Architect (LX)'
  },
  {
    id: 'node-torvalds-crew',
    name: 'Richard Stallman',
    type: 'Person',
    officeNum: '211-B',
    managerId: 'mng-linus',
    role: 'Kernel Specialist'
  }
];

export const INITIAL_MATERIALS: Material[] = [
  // materials under Alexander Wright (node-alex, IT, TC, 101)
  // Server#1, Switch#1, UPS#1 — each type starts at 1
  {
    id: 'mat-1',
    name: 'Dell PowerEdge R750 Enterprise Server',
    type: 'Server',
    company: 'TC',
    deptNum: '10',
    officeNum: '101',
    materialNum: '1',
    codification: 'T-10-101-SRV1',
    status: 'Active',
    serialNumber: 'SN-7729-XEON',
    purchaseDate: '2025-01-15',
    cost: 5400,
    assignedNodeId: 'node-alex',
    notes: 'Primary active domain controller and database mirror.'
  },
  {
    id: 'mat-2',
    name: 'Cisco Catalyst 9300 48-Port WAN Switch',
    type: 'Switch',
    company: 'TC',
    deptNum: '10',
    officeNum: '101',
    materialNum: '1',
    codification: 'T-10-101-SW1',
    status: 'Active',
    serialNumber: 'CISC-CAT-9300-X39',
    purchaseDate: '2024-11-20',
    cost: 3200,
    assignedNodeId: 'node-alex',
    notes: 'Handles 10Gbps backbone fiber link to floor aggregates.'
  },
  {
    id: 'mat-3',
    name: 'APC Smart-UPS SRT 5000VA Battery Rack',
    type: 'UPS',
    company: 'TC',
    deptNum: '10',
    officeNum: '101',
    materialNum: '1',
    codification: 'T-10-101-UPS1',
    status: 'Active',
    serialNumber: 'APC-SRT5K-9902',
    purchaseDate: '2025-02-10',
    cost: 1850,
    assignedNodeId: 'node-alex',
    notes: 'Battery runtime approx 45 mins under full rack load.'
  },

  // materials under Ned Leeds (node-ned, IT, TC, 101-B)
  // Desktop#1, Screen#1, Printer#1 — each type starts at 1
  {
    id: 'mat-4',
    name: 'HP ProDesk Mini G9 PC Workstation',
    type: 'Desktop',
    company: 'TC',
    deptNum: '10',
    officeNum: '101-B',
    materialNum: '1',
    codification: 'T-10-101-B-PC1',
    status: 'Active',
    serialNumber: 'HP-PD-G9-0199',
    purchaseDate: '2025-03-01',
    cost: 1100,
    assignedNodeId: 'node-ned',
    notes: 'Assigned to Dev Station 1'
  },
  {
    id: 'mat-5',
    name: 'Dell UltraSharp 32" Curved 4K Display',
    type: 'Screen',
    company: 'TC',
    deptNum: '10',
    officeNum: '101-B',
    materialNum: '1',
    codification: 'T-10-101-B-ECR1',
    status: 'Active',
    serialNumber: 'DELL-US32-DEVC',
    purchaseDate: '2025-03-02',
    cost: 850,
    assignedNodeId: 'node-ned',
    notes: 'Dual screen setup for high efficiency code reviews'
  },
  {
    id: 'mat-6',
    name: 'Epson WorkForce Enterprise Color Printer',
    type: 'Printer',
    company: 'TC',
    deptNum: '10',
    officeNum: '101-B',
    materialNum: '1',
    codification: 'T-10-101-B-IMP1',
    status: 'Active',
    serialNumber: 'EPS-WFE-499X',
    purchaseDate: '2024-05-18',
    cost: 1400,
    assignedNodeId: 'node-ned',
    notes: 'Shared workgroup multifunction printer'
  },

  // materials under Peter Parker (node-peter, IT, TC, 101-C)
  // Laptop#1
  {
    id: 'mat-7',
    name: 'Apple MacBook Pro M3 Max 16"',
    type: 'Laptop',
    company: 'TC',
    deptNum: '10',
    officeNum: '101-C',
    materialNum: '1',
    codification: 'T-10-101-C-LAP1',
    status: 'Active',
    serialNumber: 'CO2G38DJ16M3',
    purchaseDate: '2025-04-12',
    cost: 3499,
    assignedNodeId: 'node-peter',
    notes: 'High power mobile development unit.'
  },

  // materials under Helena Rostova (node-helena, IT, LX, 201)
  // Switch#1, UPS#1
  {
    id: 'mat-8',
    name: 'Ubiquiti UniFi Dream Machine Pro Gateway',
    type: 'Switch',
    company: 'LX',
    deptNum: '10',
    officeNum: '201',
    materialNum: '1',
    codification: 'L-10-201-SW1',
    status: 'Active',
    serialNumber: 'UBQ-UDM-PRO-LC9',
    purchaseDate: '2024-08-30',
    cost: 950,
    assignedNodeId: 'node-helena',
    notes: 'Core routing and security gateway with integrated NVR.'
  },
  {
    id: 'mat-9',
    name: 'Eaton 9PX Double-Conversion UPS 1500W',
    type: 'UPS',
    company: 'LX',
    deptNum: '10',
    officeNum: '201',
    materialNum: '1',
    codification: 'L-10-201-UPS1',
    status: 'Active',
    serialNumber: 'EATN-9PX-82910',
    purchaseDate: '2024-09-02',
    cost: 1200,
    assignedNodeId: 'node-helena',
    notes: 'Provides filtered active sinewave power to critical switches.'
  },

  // materials under Sophie Laurent (node-sophie, Finance, TC, 105)
  // Printer#1
  {
    id: 'mat-10',
    name: 'HP LaserJet Managed MFP E60155 DN',
    type: 'Printer',
    company: 'TC',
    deptNum: '20',
    officeNum: '105',
    materialNum: '1',
    codification: 'T-20-105-IMP1',
    status: 'Active',
    serialNumber: 'HP-LJMFP-E60-72',
    purchaseDate: '2024-02-14',
    cost: 2100,
    assignedNodeId: 'node-sophie',
    notes: 'Secure badge release print enabled for financial compliance.'
  },

  // materials under Bruce Wayne (node-bruce, Finance, TC, 105-B)
  // Desktop#1
  {
    id: 'mat-11',
    name: 'Lenovo ThinkCentre Neo 50t Tiny Tower',
    type: 'Desktop',
    company: 'TC',
    deptNum: '20',
    officeNum: '105-B',
    materialNum: '1',
    codification: 'T-20-105-B-PC1',
    status: 'Active',
    serialNumber: 'LNV-TC-NEO50-482',
    purchaseDate: '2025-01-20',
    cost: 890,
    assignedNodeId: 'node-bruce',
    notes: 'Dedicated ledger processing node.'
  },

  // materials under Linus Torvalds (node-linus, R&D, LX, 211)
  // Server#1
  {
    id: 'mat-12',
    name: 'Supermicro SuperServer 4029GP Dual Xeon',
    type: 'Server',
    company: 'LX',
    deptNum: '40',
    officeNum: '211',
    materialNum: '1',
    codification: 'L-40-211-SRV1',
    status: 'Active',
    serialNumber: 'SMC-4029-GP-GPU8',
    purchaseDate: '2025-03-30',
    cost: 14500,
    assignedNodeId: 'node-linus',
    notes: 'Host containing 4x NVIDIA H100 cards for AI simulation runtimes.'
  },

  // materials under Richard Stallman (node-torvalds-crew, R&D, LX, 211-B)
  // Switch#1
  {
    id: 'mat-13',
    name: 'Mellanox Quantum InfiniBand 40-Port Switch',
    type: 'Switch',
    company: 'LX',
    deptNum: '40',
    officeNum: '211-B',
    materialNum: '1',
    codification: 'L-40-211-B-SW1',
    status: 'Active',
    serialNumber: 'MLNX-QIB-40P-99',
    purchaseDate: '2025-04-02',
    cost: 6700,
    assignedNodeId: 'node-torvalds-crew',
    notes: 'Extremely high bandwidth inter-cluster fabric backplane.'
  }
];

export function getMaterialTypePrefix(type: string): string {
  switch (type) {
    case 'Printer': return 'IMP';
    case 'Server':  return 'SRV';
    case 'Switch':  return 'SW';
    case 'Desktop': return 'PC';
    case 'Screen':  return 'ECR';
    case 'UPS':     return 'UPS';
    case 'Laptop':  return 'LAP';
    case 'Mouse':    return 'SRS';
    case 'Keyboard': return 'CLV';
    case 'Phone':    return 'PHN';
    case 'Cable':    return 'CBL';
    case 'Desk Phone':   return 'DP';
    case 'Flash Disque':   return 'FD';
    default:        return 'OTH';
  }
}

export function generateMaterialCodification(
  company: 'TC' | 'LX' | 'PL',
  deptNum: string,
  officeNum: string,
  type: string,
  existingMaterials: Material[]
): { materialNum: string; codification: string } {

  const companyLetter = company[0].toUpperCase(); // TC→T, LX→L, PL→P
  const typePrefix = getMaterialTypePrefix(type);

  // Count assets of the SAME type on the SAME desk only → resets per type
  const countSameTypeOnDesk = existingMaterials.filter(
    (m) => m.officeNum === officeNum && m.type === type
  ).length;

  const materialNum = String(countSameTypeOnDesk + 1);

  const codification = `${companyLetter}-${deptNum}-${officeNum}-${typePrefix}${materialNum}`;

  return { materialNum, codification };
}