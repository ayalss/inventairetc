export interface Material {
  id: string;
  name: string;
  type: 'Printer' | 'Server' | 'Switch' | 'Desktop' | 'Screen' | 'UPS' | 'Laptop' | 'Other';
  company: 'TC' | 'LX' | 'PL';
  deptNum: string; // e.g. "10"
  officeNum: string; // e.g. "102"
  materialNum: string; // e.g. "01" (PC 1, printer 4, etc. computed based on count)
  codification: string; // [Company]-[DEPT]-[Office]-[Material] e.g. TC-10-102-SRV01
  status: 'Active' | 'Under Repair' | 'In Storage' | 'Retired';
  serialNumber: string;
  purchaseDate?: string;
  cost: number;
  notes?: string;
  assignedNodeId: string; // ID of the SubNode (Office/Person/Cabinet) owning this
}

export interface SubNode {
  id: string;
  name: string; // e.g., "Server Room Rack A", "Michael (Helpdesk)", "Office 102 Workstations"
  type: 'Office' | 'Person' | 'Cabinet' | 'Other';
  officeNum: string; // e.g., "102A" or "102-B"
  managerId: string; // belongs to this manager
  role?: string; // person's role or position, e.g., "IT Tech Lead"
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string; // Tailwind bg color class name
  officeNum: string; // e.g., "102"
  company: 'TC' | 'LX' | 'PL';
  departmentId: string; // Belongs to this department
}

export interface Department {
  id: string;
  name: string; // e.g., "Information Technology"
  deptNum: string; // e.g., "10"
  icon: string; // Lucide icon name
  shortCode: string; // e.g., "IT", "FIN", "HR", "ENG", "LOG"
}


