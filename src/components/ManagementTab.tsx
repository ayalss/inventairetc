import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Department, Manager, SubNode, Material, Puce } from '../types';
import { generateMaterialCodification } from '../data';
import { 
  Plus, FolderPlus, UserPlus, Layers, Laptop, Check, AlertCircle, Trash2, 
  Edit, Printer, X, FileText, Search, User, Briefcase, Network, Coins, 
  Users, Cpu, Truck, LayoutList, ClipboardCheck, CreditCard, ChevronDown,
  Square, CheckSquare, AlertTriangle, Paperclip, FileUp, Eye, Download, Smartphone
} from 'lucide-react';

// ─── Catalog Selector types ──────────────────────────────────────────────────
interface CatalogBrand {
  name: string;
  models: string[];
}

interface CatalogItem {
  label: string;
  deviceCategory: 'Printer' | 'Server' | 'Switch' | 'Desktop' | 'Screen' | 'UPS' | 'Laptop' | 'Mouse' | 'Keyboard' | 'Phone' | 'Cable' | 'Desk Phone' | 'Flash Disque' | 'Other';
  brands: CatalogBrand[];
}

const DEFAULT_CATALOG: Record<string, CatalogItem> = {
  ecran: {
    label: 'Écran / Screen',
    deviceCategory: 'Screen',
    brands: [
      { name: 'LG', models: ['24MK600', 'Flatron IPS', 'UltraGear 27"'] },
      { name: 'Samsung', models: ['SyncMaster', 'T35F', 'Odyssey G3'] },
      { name: 'Dell', models: ['P2419H', 'E2216H'] },
      { name: 'HP', models: ['EliteDisplay', 'ProDisplay'] }
    ]
  },
  clavier: {
    label: 'Clavier / Keyboard',
    deviceCategory: 'Keyboard',
    brands: [
      { name: 'Dell', models: ['KB216', 'KB522'] },
      { name: 'HP', models: ['K1500', 'Slim Keyboard'] },
      { name: 'Logitech', models: ['K120', 'K270 Wireless', 'MX Keys'] },
      { name: 'Lenovo', models: ['Essential Wired'] }
    ]
  },
  souris: {
    label: 'Souris / Mouse',
    deviceCategory: 'Mouse',
    brands: [
      { name: 'Dell', models: ['MS116', 'MS3320W'] },
      { name: 'HP', models: ['X1000', 'USB Mouse'] },
      { name: 'Logitech', models: ['M90', 'M185 Wireless', 'MX Master 3'] },
      { name: 'Lenovo', models: ['Essential USB'] }
    ]
  },
  printer: {
    label: 'Imprimante / Printer',
    deviceCategory: 'Printer',
    brands: [
      { name: 'Canon', models: ['Pixma G3010', 'LBP6030', 'i-SENSYS LBP223dw'] },
      { name: 'HP', models: ['LaserJet Pro M404dn', 'Smart Tank 515', 'Neverstop Laser'] },
      { name: 'Epson', models: ['L3150 Wi-Fi', 'L805 Photo'] },
      { name: 'Brother', models: ['HL-L2320D', 'DCP-T420W'] }
    ]
  },
  laptop: {
    label: 'Laptop / Notebook',
    deviceCategory: 'Laptop',
    brands: [
      { name: 'Dell', models: ['Latitude 5420', 'Inspiron 15', 'XPS 13'] },
      { name: 'HP', models: ['ProBook 450 G8', 'EliteBook 840', 'Pavilion 15'] },
      { name: 'Lenovo', models: ['ThinkPad L14', 'IdeaPad 3', 'ThinkPad E15'] },
      { name: 'ASUS', models: ['ZenBook', 'VivoBook'] },
      { name: 'Apple', models: ['MacBook Air M1', 'MacBook Pro 14"'] }
    ]
  },
  desktop: {
    label: 'Desktop PC',
    deviceCategory: 'Desktop',
    brands: [
      { name: 'Dell', models: ['OptiPlex 3080', 'OptiPlex 7090'] },
      { name: 'HP', models: ['ProDesk 400', 'EliteDesk 800'] },
      { name: 'Lenovo', models: ['ThinkCentre M70q', 'ThinkCentre Neo 50t'] }
    ]
  },
  server: {
    label: 'Server Room Host',
    deviceCategory: 'Server',
    brands: [
      { name: 'Dell', models: ['PowerEdge R650', 'PowerEdge R750', 'PowerEdge T150'] },
      { name: 'HP', models: ['ProLiant DL360 Gen10', 'ProLiant ML30 Gen10'] }
    ]
  },
  switch: {
    label: 'Switch / Gateway',
    deviceCategory: 'Switch',
    brands: [
      { name: 'Cisco', models: ['Catalyst 2960', 'Catalyst 9200'] },
      { name: 'TP-Link', models: ['TL-SG1024D', 'TL-SF1008D'] },
      { name: 'D-Link', models: ['DES-1008A', 'DGS-1024D'] }
    ]
  },
  ups: {
    label: 'UPS (Onduleur)',
    deviceCategory: 'UPS',
    brands: [
      { name: 'APC', models: ['Back-UPS 700VA', 'Easy UPS 1000VA', 'Smart-UPS 1500VA'] },
      { name: 'Legrand', models: ['Keor SP 800VA', 'Niky S 1000VA'] },
      { name: 'Eaton', models: ['5E 650i USB', 'Ellipse PRO 850'] }
    ]
  },
  phone: {
    label: 'Phone',
    deviceCategory: 'Phone',
    brands: [
      { name: 'Samsung', models: ['Galaxy A12', 'Galaxy S21'] },
      { name: 'Apple', models: ['iPhone 11', 'iPhone 13', 'iPhone SE'] },
      { name: 'Xiaomi', models: ['Redmi Note 10', 'Poco X3'] }
    ]
  },
  'desk phone': {
    label: 'Desk Phone',
    deviceCategory: 'Desk Phone',
    brands: [
      { name: 'Yealink', models: ['SIP-T31P', 'SIP-T46U'] },
      { name: 'Cisco', models: ['IP Phone 7821', 'IP Phone 8845'] },
      { name: 'Grandstream', models: ['GRP2601', 'GXP1625'] }
    ]
  },
  cable: {
    label: 'Cable',
    deviceCategory: 'Cable',
    brands: [
      { name: 'Generic', models: ['Power Cable', 'HDMI Cable 1.5m', 'HDMI Cable 3m', 'Ethernet RJ45 2m', 'Ethernet RJ45 5m', 'VGA Cable'] }
    ]
  },
  'flash disque': {
    label: 'Flash Disque',
    deviceCategory: 'Flash Disque',
    brands: [
      { name: 'Kingston', models: ['DataTraveler 32GB', 'DataTraveler 64GB'] },
      { name: 'SanDisk', models: ['Cruzer Blade 16GB', 'Cruzer Glide 64GB', 'Ultra Dual Drive 128GB'] },
      { name: 'Adata', models: ['UV128 32GB'] }
    ]
  },
  other: {
    label: 'Autre / Other',
    deviceCategory: 'Other',
    brands: [
      { name: 'Generic', models: ['Standard Unit'] }
    ]
  }
};

// ─── Document type for SubNode attachments ────────────────────────────────────
export interface SubNodeDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

type SubNodeWithDocs = SubNode & { documents?: SubNodeDocument[] };

// ─── Props ────────────────────────────────────────────────────────────────────
interface ManagementTabProps {
  departments: Department[];
  managers: Manager[];
  subNodes: SubNode[];
  materials: Material[];
  puces: Puce[];
  onAddDepartment: (dept: Department) => void;
  onAddManager: (manager: Manager) => void;
  onAddSubNode: (node: SubNode) => void;
  onAddMaterial: (material: Material) => void;
  onAddPuce: (puce: Puce) => void;
  onDeleteMaterial: (id: string) => void;
  onDeletePuce: (id: string) => void;
  onUpdateDepartment: (id: string, updated: Department) => void;
  onDeleteDepartment: (id: string) => void;
  onUpdateManager: (id: string, updated: Manager) => void;
  onDeleteManager: (id: string) => void;
  onUpdateSubNode: (id: string, updated: SubNode) => void;
  onDeleteSubNode: (id: string) => void;
  onUpdateMaterial: (id: string, updated: Material) => void;
  onUpdatePuce: (id: string, updated: Puce) => void;
}

export default function ManagementTab({
  departments, managers, subNodes, materials, puces,
  onAddDepartment, onAddManager, onAddSubNode, onAddMaterial, onAddPuce,
  onDeleteMaterial, onDeletePuce, onUpdateDepartment, onDeleteDepartment,
  onUpdateManager, onDeleteManager, onUpdateSubNode, onDeleteSubNode, onUpdateMaterial, onUpdatePuce
}: ManagementTabProps) {
  const { t } = useTranslation();

  const [activeForm, setActiveForm] = useState<'material' | 'puce' | 'subnode' | 'manager' | 'dept'>('material');
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  // Database Inspector
  const [inspectorTab, setInspectorTab] = useState<'materials' | 'puces' | 'subnodes' | 'managers' | 'depts'>('materials');
  const [inspectorSearch, setInspectorSearch] = useState('');

  // Edit modal
  const [editingItem, setEditingItem] = useState<{ type: 'material' | 'puce' | 'subnode' | 'manager' | 'dept'; id: string; data: any } | null>(null);

  // Documents modal
  const [docsModalNode, setDocsModalNode] = useState<SubNodeWithDocs | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

  // Décharge multi-select
  const [dechargeSelectedIds, setDechargeSelectedIds] = useState<string[]>([]);
  const [dechargePreviewMaterials, setDechargePreviewMaterials] = useState<Material[] | null>(null);

  // Department report
  const [printDeptReport, setPrintDeptReport] = useState<Department | null>(null);

  // ─── Auto-number helpers ───────────────────────────────────────────────────
  const getNextDeptNum          = () => String(departments.length + 1);
  // ✅ FIX
const getNextManagerOfficeNum = () =>
  String(managers.filter(m => m.company === mngCompany).length + 1);

const getNextNodeOfficeNum = () => {
  const selectedMng = managers.find(m => m.id === nodeManagerId);
  const company = selectedMng?.company || 'TC';
  return String(subNodes.filter(s => {
    const mng = managers.find(m => m.id === s.managerId);
    return mng?.company === company;
  }).length + 1);
};

  // ─── Form states ───────────────────────────────────────────────────────────
  const [deptName, setDeptName] = useState('');
  const [deptIcon, setDeptIcon] = useState('Briefcase');

  const [mngName,    setMngName]    = useState('');
  const [mngEmail,   setMngEmail]   = useState('');
  const [mngRole,    setMngRole]    = useState('');
  const [mngCompany, setMngCompany] = useState<'TC' | 'LX' | 'PL'>('TC');
  const [mngDeptId,  setMngDeptId]  = useState(departments[0]?.id || '');
  const [mngCin,     setMngCin]     = useState('');

  const [nodeName,      setNodeName]      = useState('');
  const [nodeType,      setNodeType]      = useState<'Office' | 'Person' | 'Cabinet' | 'Other'>('Person');
  const [nodeManagerId, setNodeManagerId] = useState(managers[0]?.id || '');
  const [nodeRole,      setNodeRole]      = useState('');
  const [nodeCin,       setNodeCin]       = useState('');

  const [matName,      setMatName]      = useState('');
  const [matType,      setMatType]      = useState<'Printer' | 'Server' | 'Switch' | 'Desktop' | 'Screen' | 'UPS' | 'Laptop' | 'Mouse' | 'Keyboard' | 'Phone' | 'Cable' | 'Desk Phone' | 'Flash Disque' | 'Other'>('Desktop');
  const [matStatus,    setMatStatus]    = useState<'Active' | 'Under Repair' | 'In Storage' | 'Retired'>('Active');
  const [matCondition, setMatCondition] = useState<'Bon' | 'Neuf'>('Bon');
  const [matSerial,    setMatSerial]    = useState('');
  const [matCost,      setMatCost]      = useState('');
  const [matDate,      setMatDate]      = useState('');
  const [matNodeId,    setMatNodeId]    = useState(subNodes[0]?.id || '');
  const [matNotes,     setMatNotes]     = useState('');

  // ─── Dynamic Catalog Picker states ─────────────────────────────────────────
  const [catalog, setCatalog] = useState<Record<string, CatalogItem>>(() => {
    const saved = localStorage.getItem('tc_article_catalog');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse catalog from localStorage', e);
      }
    }
    return DEFAULT_CATALOG;
  });

  const [selectedCatalogType, setSelectedCatalogType] = useState<string>('');
  const [selectedCatalogBrand, setSelectedCatalogBrand] = useState<string>('');
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [selectedCatalogModel, setSelectedCatalogModel] = useState<string>('');
  const [newModelName, setNewModelName] = useState<string>('');

  const handleCatalogTypeChange = (type: string) => {
    setSelectedCatalogType(type);
    setSelectedCatalogBrand('');
    setSelectedCatalogModel('');
    setNewBrandName('');
    setNewModelName('');

    if (type && catalog[type]) {
      setMatType(catalog[type].deviceCategory);
    }
  };

  const availableBrands = useMemo(() => {
    if (!selectedCatalogType || !catalog[selectedCatalogType]) return [];
    return catalog[selectedCatalogType].brands;
  }, [selectedCatalogType, catalog]);

  const availableModels = useMemo(() => {
    if (!selectedCatalogType || !selectedCatalogBrand || !catalog[selectedCatalogType]) return [];
    const brandObj = catalog[selectedCatalogType].brands.find(b => b.name === selectedCatalogBrand);
    return brandObj ? brandObj.models : [];
  }, [selectedCatalogType, selectedCatalogBrand, catalog]);

  useEffect(() => {
    if (!selectedCatalogType) return;
    
    const nameParts = [selectedCatalogType];

    let brand = '';
    if (selectedCatalogBrand === '__NEW__') {
      brand = newBrandName.trim();
    } else if (selectedCatalogBrand) {
      brand = selectedCatalogBrand;
    }
    if (brand) nameParts.push(brand);

    let model = '';
    if (selectedCatalogModel === '__NEW__') {
      model = newModelName.trim();
    } else if (selectedCatalogModel) {
      model = selectedCatalogModel;
    }
    if (model) nameParts.push(model);

    setMatName(nameParts.join(' '));
  }, [selectedCatalogType, selectedCatalogBrand, newBrandName, selectedCatalogModel, newModelName]);

  // ─── Puce form state ───────────────────────────────────────────────────────
  const [puceSerial,   setPuceSerial]   = useState('');
  const [pucePhone,    setPucePhone]    = useState('');
  const [pucePuk,      setPucePuk]      = useState('');
  const [puceCredit,   setPuceCredit]   = useState('');
  const [puceStatus,   setPuceStatus]   = useState<'Active' | 'Suspended'>('Active');
  const [puceContract, setPuceContract] = useState<'TC' | 'LX' | 'PL'>('TC');
  // '' = puce vierge (unassigned), otherwise a subNode id
  const [puceNodeId,   setPuceNodeId]   = useState('');

  const triggerSuccess = (msg: string) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  // ─── Submit handlers ───────────────────────────────────────────────────────
  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName) return;
    const autoNum = getNextDeptNum();
    const newDept: Department = {
      id: `dept-${Date.now()}`, name: deptName, deptNum: autoNum, icon: deptIcon,
      shortCode: deptName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'GEN'
    };
    onAddDepartment(newDept);
    triggerSuccess(`Department "${deptName}" registered with auto ID #${autoNum}`);
    setDeptName('');
  };

  const handleManagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mngName || !mngEmail || !mngRole) return;
    const colors = ['bg-[#FF1E1E]', 'bg-[#000000]', 'bg-slate-800', 'bg-red-800', 'bg-neutral-800', 'bg-[#3A3A3C]'];
    const autoOffice = getNextManagerOfficeNum();
    const newMng: any = {
      id: `mng-${Date.now()}`, name: mngName, email: mngEmail, role: mngRole,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      officeNum: autoOffice, company: mngCompany,
      departmentId: mngDeptId || departments[0]?.id,
      cin: mngCin.trim() || undefined
    };
    onAddManager(newMng);
    triggerSuccess(`Manager "${mngName}" appointed — auto office #${autoOffice}`);
    setMngName(''); setMngEmail(''); setMngRole(''); setMngCin('');
  };

  const handleSubNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName || !nodeManagerId) return;
    const autoOffice = getNextNodeOfficeNum();
    const newNode: any = {
      id: `node-${Date.now()}`, name: nodeName, type: nodeType,
      officeNum: autoOffice, managerId: nodeManagerId,
      role: nodeRole.trim() || undefined,
      cin: nodeCin.trim() || undefined,
      documents: []
    };
    onAddSubNode(newNode);
    triggerSuccess(`Desk card "${nodeName}" created — auto office #${autoOffice}`);
    setNodeName(''); setNodeRole(''); setNodeCin('');
  };

  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName) return;
    const activeNodeId = matNodeId || subNodes[0]?.id;
    if (!activeNodeId) { alert('Please select a valid infrastructure office sub-node location.'); return; }
    const targetNode = subNodes.find(n => n.id === activeNodeId);
    if (!targetNode) { alert('Selected office location node not found.'); return; }
    const associatedManager = managers.find(m => m.id === targetNode.managerId);
    if (!associatedManager) { alert('Could not identify the corporate manager for this location.'); return; }
    const departmentObj = departments.find(d => d.id === associatedManager.departmentId);
    const resolvedDeptNum = departmentObj?.deptNum || '10';
    const { materialNum, codification } = generateMaterialCodification(
      associatedManager.company, resolvedDeptNum, targetNode.officeNum, matType, materials
    );
    const newMaterial: Material = {
      id: `mat-${Date.now()}`, name: matName, type: matType,
      company: associatedManager.company, deptNum: resolvedDeptNum,
      officeNum: targetNode.officeNum, materialNum, codification, status: matStatus,
      condition: matCondition,
      serialNumber: matSerial.trim() || `SN-PENDING-${Math.floor(1000 + Math.random() * 9000)}`,
      purchaseDate: matDate ? matDate : undefined, cost: Number(matCost) || 0,
      notes: matNotes.trim() || undefined, assignedNodeId: activeNodeId
    };

    // Save new brand/model to catalog if added
    let updatedCatalog = { ...catalog };
    let catalogChanged = false;

    if (selectedCatalogType && catalog[selectedCatalogType]) {
      const typeKey = selectedCatalogType;
      let brandToUse = selectedCatalogBrand;

      if (selectedCatalogBrand === '__NEW__' && newBrandName.trim()) {
        const brandNameClean = newBrandName.trim();
        const brandExists = updatedCatalog[typeKey].brands.find(
          (b) => b.name.toLowerCase() === brandNameClean.toLowerCase()
        );

        if (!brandExists) {
          const newBrandObj: CatalogBrand = { name: brandNameClean, models: [] };
          updatedCatalog[typeKey] = {
            ...updatedCatalog[typeKey],
            brands: [...updatedCatalog[typeKey].brands, newBrandObj],
          };
          catalogChanged = true;
        }
        brandToUse = brandNameClean;
      }

      if (brandToUse && (selectedCatalogModel === '__NEW__' || selectedCatalogBrand === '__NEW__') && newModelName.trim()) {
        const modelNameClean = newModelName.trim();
        const brandIndex = updatedCatalog[typeKey].brands.findIndex(
          (b) => b.name.toLowerCase() === brandToUse.toLowerCase()
        );

        if (brandIndex > -1) {
          const brandObj = updatedCatalog[typeKey].brands[brandIndex];
          const modelExists = brandObj.models.find(
            (m) => m.toLowerCase() === modelNameClean.toLowerCase()
          );

          if (!modelExists) {
            const updatedBrands = [...updatedCatalog[typeKey].brands];
            updatedBrands[brandIndex] = {
              ...brandObj,
              models: [...brandObj.models, modelNameClean],
            };
            updatedCatalog[typeKey] = {
              ...updatedCatalog[typeKey],
              brands: updatedBrands,
            };
            catalogChanged = true;
          }
        }
      }

      if (catalogChanged) {
        setCatalog(updatedCatalog);
        localStorage.setItem('tc_article_catalog', JSON.stringify(updatedCatalog));
      }
    }

    onAddMaterial(newMaterial);
    triggerSuccess(`Asset cataloged — QR ID: ${codification}`);
    
    // Reset inputs
    setMatName(''); setMatSerial(''); setMatCost(''); setMatNotes(''); setMatDate('');
    setMatCondition('Bon');
    setMatNodeId(subNodes[0]?.id || '');
    
    setSelectedCatalogType('');
    setSelectedCatalogBrand('');
    setSelectedCatalogModel('');
    setNewBrandName('');
    setNewModelName('');
  };

  // ─── Puce submit — assignedNodeId is optional (puce vierge allowed) ────────
  const handlePuceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puceSerial || !pucePhone || !pucePuk) return;

    const newPuce: Puce = {
      id: `puce-${Date.now()}`,
      serialNumber: puceSerial.trim(),
      phoneNumber: pucePhone.trim(),
      pukCode: pucePuk.trim(),
      monthlyCredit: Number(puceCredit) || 0,
      status: puceStatus,
      contractCompany: puceContract,
      // undefined when no node selected → puce vierge
      // FIXED — explicit cast satisfies TS regardless of types.ts state
assignedNodeId: (puceNodeId || undefined) as string,
    };
    onAddPuce(newPuce);
    const locationLabel = puceNodeId
      ? (subNodes.find(n => n.id === puceNodeId)?.name || puceNodeId)
      : 'Non affectée';
    triggerSuccess(`Puce ${newPuce.phoneNumber} enregistrée — ${locationLabel}`);
    setPuceSerial(''); setPucePhone(''); setPucePuk(''); setPuceCredit('');
    setPuceStatus('Active');
    setPuceContract('TC');
    setPuceNodeId(''); // reset to unassigned
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const { type, id, data } = editingItem;
    if (type === 'dept')     { onUpdateDepartment(id, data); triggerSuccess(`Department "${data.name}" updated`); }
    if (type === 'manager')  { onUpdateManager(id, data);   triggerSuccess(`Manager "${data.name}" updated`); }
    if (type === 'subnode')  { onUpdateSubNode(id, data);   triggerSuccess(`Desk "${data.name}" updated`); }
    if (type === 'puce')     { onUpdatePuce(id, data);      triggerSuccess(`Puce "${data.phoneNumber}" updated`); }
    if (type === 'material') {
      const targetNode = subNodes.find(n => n.id === data.assignedNodeId);
      if (targetNode) {
        const mgr = managers.find(m => m.id === targetNode.managerId);
        if (mgr) {
          const dept = departments.find(d => d.id === mgr.departmentId);
          data.company = mgr.company;
          data.deptNum = dept ? dept.deptNum : '10';
          data.officeNum = targetNode.officeNum;
        }
      }
      onUpdateMaterial(id, data);
      triggerSuccess(`Asset "${data.name}" updated`);
    }
    setEditingItem(null);
  };

  // ─── Search filters ────────────────────────────────────────────────────────
  const getFilteredMaterials   = () => { const q = inspectorSearch.toLowerCase().trim(); if (!q) return materials; return materials.filter(m => m.name.toLowerCase().includes(q) || m.codification.toLowerCase().includes(q) || m.serialNumber.toLowerCase().includes(q) || m.notes?.toLowerCase().includes(q)); };
  const getFilteredPuces       = () => { const q = inspectorSearch.toLowerCase().trim(); if (!q) return puces; return puces.filter(p => p.serialNumber.toLowerCase().includes(q) || p.phoneNumber.toLowerCase().includes(q) || p.pukCode.toLowerCase().includes(q) || p.status.toLowerCase().includes(q)); };
  const getFilteredSubNodes    = () => { const q = inspectorSearch.toLowerCase().trim(); if (!q) return subNodes; return subNodes.filter(s => s.name.toLowerCase().includes(q) || s.officeNum.toLowerCase().includes(q) || s.type.toLowerCase().includes(q)); };
  const getFilteredManagers    = () => { const q = inspectorSearch.toLowerCase().trim(); if (!q) return managers; return managers.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)); };
  const getFilteredDepartments = () => { const q = inspectorSearch.toLowerCase().trim(); if (!q) return departments; return departments.filter(d => d.name.toLowerCase().includes(q) || d.deptNum.toLowerCase().includes(q)); };

  // ─── Décharge helpers ─────────────────────────────────────────────────────
  const dechargeNodeId = useMemo(() => {
    if (dechargeSelectedIds.length === 0) return null;
    const first = materials.find(m => m.id === dechargeSelectedIds[0]);
    return first?.assignedNodeId || null;
  }, [dechargeSelectedIds, materials]);

  const canAddToSelection = (materialId: string) => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return false;
    if (dechargeSelectedIds.length === 0) return true;
    return mat.assignedNodeId === dechargeNodeId;
  };

  const toggleDechargeSelect = (id: string) => {
    if (dechargeSelectedIds.includes(id)) {
      setDechargeSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      if (!canAddToSelection(id)) return;
      setDechargeSelectedIds(prev => [...prev, id]);
    }
  };

  const openDechargePreview = () => {
    const selected = materials.filter(m => dechargeSelectedIds.includes(m.id));
    setDechargePreviewMaterials(selected);
  };

  const triggerSystemBrowserPrint = () => {
    document.title = "BON_DE_DECHARGE";
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  // ─── Document upload handler ───────────────────────────────────────────────
  const handleDocumentUpload = async (nodeId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const node = subNodes.find(n => n.id === nodeId) as SubNodeWithDocs;
    if (!node) return;

    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));

    try {
      const res = await fetch(`/api/subnodes/${nodeId}/documents`, { method: 'POST', body: formData });
      const newDocs: SubNodeDocument[] = await res.json();
      const existingDocs: SubNodeDocument[] = (node as any).documents || [];
      const updated = { ...node, documents: [...existingDocs, ...newDocs] };
      onUpdateSubNode(nodeId, updated as SubNode);
      if (docsModalNode?.id === nodeId) setDocsModalNode(updated as SubNodeWithDocs);
      triggerSuccess(`${newDocs.length} document(s) uploaded to "${node.name}"`);
    } catch {
      triggerSuccess('Upload failed — check server connection');
    }
  };

  // ─── Document delete handler ──────────────────────────────────────────────
  const handleDeleteDocument = async (nodeId: string, docId: string) => {
    try {
      await fetch(`/api/subnodes/${nodeId}/documents/${docId}`, { method: 'DELETE' });
      const node = subNodes.find(n => n.id === nodeId) as SubNodeWithDocs;
      if (!node) return;
      const updated = {
        ...node,
        documents: ((node as any).documents || []).filter((d: SubNodeDocument) => d.id !== docId)
      };
      onUpdateSubNode(nodeId, updated as SubNode);
      setDocsModalNode(updated as SubNodeWithDocs);
      triggerSuccess('Document removed');
    } catch {
      triggerSuccess('Delete failed — check server connection');
    }
  };

  const getDocIcon = (mimeType: string) => {
    if (mimeType.includes('pdf'))   return { label: 'PDF', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (mimeType.includes('image')) return { label: 'IMG', color: 'bg-violet-100 text-violet-700 border-violet-200' };
    if (mimeType.includes('word') || mimeType.includes('document')) return { label: 'DOC', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (mimeType.includes('sheet') || mimeType.includes('excel'))   return { label: 'XLS', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    return { label: 'FILE', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  // ─── Décharge document renderer ───────────────────────────────────────────
  const renderDechargeDocument = (selectedMaterials: Material[]) => {
    if (selectedMaterials.length === 0) return null;
    const node = subNodes.find(n => n.id === selectedMaterials[0].assignedNodeId) as any;
    const mng  = node ? managers.find(m => m.id === node.managerId) as any : null;
    const dept = mng ? departments.find(d => d.id === mng.departmentId) : null;
    const currentDate = new Date().toLocaleDateString("fr-FR");

    return (
      <div className="printable-area bg-white text-black w-[210mm] h-[297mm] mx-auto px-[20mm] py-[14mm] font-sans text-[12.5px] leading-[1.5] print:w-[210mm] print:h-[297mm] box-border flex flex-col overflow-hidden">
        <div>
          <div className="flex items-start gap-4">
            <img src="/tc.jpg" alt="TECHNOCERAM" className="w-14 object-contain" />
            <h1 className="font-black text-[20px] leading-none mt-1">TECHNOCERAM</h1>
          </div>
          <div className="border-b-[3px] border-red-600 mt-5" />
          <p className="font-semibold text-[13px] mt-3">N° : ______ /2026</p>
        </div>
        <div className="mt-15 text-center">
          <h2 className="font-black text-[18px]">Bon de Décharge pour Matériel Informatique</h2>
        </div>
        <div className="mt-15 text-[13px] leading-[1.7]">
          <p>
            Je soussigné(e),{" "}
            <strong>{node?.name || "________________"}</strong>,{" "}
            <strong>{node?.role || mng?.role || "________________"}</strong>{" "}
            de la SARL TECHNOCERAM, déclare par la présente avoir reçu le matériel informatique suivant,
            et fournir, à cet effet, une copie de ma carte d'identité nationale n°{" "}
            <strong>{(node as any)?.cin || "________________"}</strong>.
          </p>
        </div>
        <div className="mt-4 text-[13px] leading-[1.6] space-y-1">
          {selectedMaterials.map((mat) => (
            <div key={mat.id} className="space-y-0.5">
              <p><strong>{mat.type} :</strong> {mat.name}</p>
              <p><strong>Marque et modèle :</strong> {mat.name}</p>
              {mat.notes && <p className="whitespace-pre-wrap text-[12.5px] leading-[1.55]">{mat.notes}</p>}
            </div>
          ))}
        </div>
        <div className="mt-5 text-[13px] leading-[1.7] space-y-3">
          <p>Je reconnais avoir reçu ce matériel en <strong>
            {selectedMaterials[0]?.condition === 'Neuf' ? 'état neuf' : 'bon état'}
          </strong>{" "}état de fonctionnement et m'engage à en faire un usage approprié conformément aux politiques de sécurité informatique de l'entreprise.</p>
          <p>Je m'engage également à prendre toutes les mesures nécessaires pour assurer la sécurité et la confidentialité des données stockées sur cet appareil, ainsi que pour prévenir tout dommage, perte ou vol.</p>
          <p>En cas de départ de l'entreprise ou de transfert de responsabilité, je m'engage à restituer ce matériel en bon état dans les plus brefs délais.</p>
        </div>
        <div className="mt-auto flex justify-end pb-16">
          <div className="w-72">
            <p className="text-[13px]">
              Fait à BATNA, le {(() => {
                const d = selectedMaterials[0]?.purchaseDate;
                if (!d) return currentDate;
                const date = new Date(d);
                return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
              })()}
            </p>
            <div className="mt-16 mb-1 border-b border-black w-full" />
            <p className="text-[11px] text-slate-500 mb-5">Signature</p>
            <p className="font-bold uppercase text-[13px]">{node?.name}</p>
            <p className="font-semibold text-[13px]">SARL TECHNOCERAM</p>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-1">

      {/* ── Toast ── */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1D1D1F]/95 backdrop-blur-md border border-[#D2D2D7]/30 text-white rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-6 h-6 rounded-full bg-[#34C759] flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" /></div>
          <p className="text-xs font-semibold">{showSuccessToast}</p>
        </div>
      )}

      {/* ── Form tab selectors ── */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-3xl mx-auto border border-[#D2D2D7]/40">
        {[
          { id: 'material', label: '+ IT Material', icon: Laptop },
          { id: 'puce',     label: '+ Puce',        icon: Smartphone },
          { id: 'subnode',  label: '+ Office Desk', icon: Layers },
          { id: 'manager',  label: '+ New Manager', icon: UserPlus },
          { id: 'dept',     label: '+ Department',  icon: FolderPlus }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeForm === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveForm(tab.id as any)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${isSelected ? 'bg-white text-[#FF1E1E] shadow-sm border border-[#D2D2D7]/20 font-extrabold' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
              <Icon className="w-3.5 h-3.5" /><span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── FORM PANEL ── */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D2D2D7]/50 shadow-sm p-6 relative overflow-hidden">

          {/* A. MATERIAL FORM */}
          {activeForm === 'material' && (
            <form onSubmit={handleMaterialSubmit} className="space-y-4">
              <div className="border-b border-slate-150 pb-3">
                <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2"><Laptop className="text-[#FF1E1E] w-4.5 h-4.5" />{t('add_new_asset')}</h4>
                <p className="text-[11px] text-[#86868B] mt-1">Registers new operational hardware. System auto-generates codes.</p>
              </div>
              {subNodes.length === 0 ? (
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800"><p className="font-bold">No Office Sub-Nodes Found</p><p className="mt-1">Create a Desk/Office card first.</p></div>
                </div>
              ) : (
                <>
                  {/* Dynamic Catalog Selectors */}
                  <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4.5 space-y-3">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/80 pb-2 flex items-center justify-between">
                      <span>Quick Catalog Picker</span>
                      
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {/* Type d'article */}
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Type d'article</label>
                        <select 
                          className="w-full text-xs px-2.5 py-2 bg-white border border-[#D2D2D7]/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer"
                          value={selectedCatalogType} 
                          onChange={(e) => handleCatalogTypeChange(e.target.value)}
                        >
                          <option value="">— Select Type —</option>
                          {Object.entries(catalog).map(([key, item]) => (
                            <option key={key} value={key}>{item.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Brand / Marque */}
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Marque</label>
                        <select 
                          className="w-full text-xs px-2.5 py-2 bg-white border border-[#D2D2D7]/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer disabled:opacity-50"
                          disabled={!selectedCatalogType}
                          value={selectedCatalogBrand} 
                          onChange={(e) => {
                            setSelectedCatalogBrand(e.target.value);
                            setSelectedCatalogModel('');
                            setNewBrandName('');
                            setNewModelName('');
                          }}
                        >
                          <option value="">— Select Brand —</option>
                          {availableBrands.map((b) => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                          ))}
                          {selectedCatalogType && (
                            <option value="__NEW__" className="text-[#FF1E1E] font-bold">+ Ajouter une marque...</option>
                          )}
                        </select>
                      </div>

                      {/* Model / Modèle */}
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Modèle</label>
                        <select 
                          className="w-full text-xs px-2.5 py-2 bg-white border border-[#D2D2D7]/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer disabled:opacity-50"
                          disabled={!selectedCatalogBrand || selectedCatalogBrand === '__NEW__'}
                          value={selectedCatalogModel} 
                          onChange={(e) => {
                            setSelectedCatalogModel(e.target.value);
                            setNewModelName('');
                          }}
                        >
                          <option value="">— Select Model —</option>
                          {availableModels.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                          {selectedCatalogBrand && selectedCatalogBrand !== '__NEW__' && (
                            <option value="__NEW__" className="text-[#FF1E1E] font-bold">+ Ajouter un modèle...</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Custom Brand Input */}
                    {selectedCatalogBrand === '__NEW__' && (
                      <div className="bg-white border border-[#FF1E1E]/20 rounded-xl p-2.5 space-y-1.5 transition-all">
                        <label className="text-[9px] font-bold text-[#FF1E1E] block uppercase tracking-wider">Nom de la nouvelle marque</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Samsung"
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                          value={newBrandName} 
                          onChange={(e) => setNewBrandName(e.target.value)} 
                        />
                      </div>
                    )}

                    {/* Custom Model Input */}
                    {(selectedCatalogModel === '__NEW__' || selectedCatalogBrand === '__NEW__') && (
                      <div className="bg-white border border-[#FF1E1E]/20 rounded-xl p-2.5 space-y-1.5 transition-all">
                        <label className="text-[9px] font-bold text-[#FF1E1E] block uppercase tracking-wider">Nom du nouveau modèle</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. T35F"
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                          value={newModelName} 
                          onChange={(e) => setNewModelName(e.target.value)} 
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Asset Model / Name</label>
                    <input type="text" required placeholder="e.g. Dell PowerEdge Server R650"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                      value={matName} onChange={(e) => setMatName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Infrastructure Location (Office/Desk)</label>
                    <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer"
                      value={matNodeId} onChange={(e) => setMatNodeId(e.target.value)}>
                      {subNodes.map((node) => {
                        const mng = managers.find(m => m.id === node.managerId);
                        return <option key={node.id} value={node.id}>{node.name} (Office {node.officeNum} — {mng ? mng.name : 'Unknown'})</option>;
                      })}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Device Category</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer"
                        value={matType} onChange={(e) => setMatType(e.target.value as any)}>
                        <option value="Printer">Printer</option><option value="Server">Server Room Host</option>
                        <option value="Switch">Switch / Gateway</option><option value="Desktop">Desktop PC</option>
                        <option value="Screen">Screen Display</option><option value="UPS">UPS (Ondulateur)</option>
                        <option value="Laptop">Laptop Notebook</option><option value="Flash Disque">Flash Disque</option>
                        <option value="Mouse">Mouse</option><option value="Keyboard">Keyboard</option>
                        <option value="Phone">Phone</option><option value="Cable">Cable</option>
                        <option value="Desk Phone">Desk Phone</option><option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Lifecycle Status</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer"
                        value={matStatus} onChange={(e) => setMatStatus(e.target.value as any)}>
                        <option value="Active">Active (Deployed)</option><option value="Under Repair">Under Repair</option>
                        <option value="In Storage">In Reserve Stock</option><option value="Retired">Retired</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">État</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Bon', 'Neuf'] as const).map((c) => (
                        <button key={c} type="button"
                          onClick={() => setMatCondition(c)}
                          className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                            matCondition === c
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Serial No (S/N)</label>
                      <input type="text" placeholder="e.g. SN-8822A-CISCO"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={matSerial} onChange={(e) => setMatSerial(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Purchase Price (DA)</label>
                      <input type="number" placeholder="e.g. 1500"
                        className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={matCost} onChange={(e) => setMatCost(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Acquisition Date (Optional)</label>
                    <input type="date" className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] text-[#1D1D1F]"
                      value={matDate} onChange={(e) => setMatDate(e.target.value)} />
                  </div>
                  <div>
                    <textarea rows={3} placeholder="e.g. Processeur: AMD RYZEN 7 8845HS @5.1GHz&#10;RAM: 16Gb DDR5&#10;Disque: 1Tb SSD"
                      className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                      value={matNotes} onChange={(e) => setMatNotes(e.target.value)} />
                  </div>
                  <button type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-99 transition-all text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2">
                    <Plus className="w-4 h-4 text-[#FF1E1E]" />Catalog Asset & Generate QR Code
                  </button>
                </>
              )}
            </form>
          )}

          {/* B. PUCE FORM */}
          {activeForm === 'puce' && (
            <form onSubmit={handlePuceSubmit} className="space-y-4">
              <div className="border-b border-slate-150 pb-3">
                <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="text-[#FF1E1E] w-4.5 h-4.5" />Add New Puce
                </h4>
                <p className="text-[11px] text-[#86868B] mt-1">
                  Registers SIM cards. Location is optional — leave blank to create a <span className="font-bold text-amber-600">puce Non affectée</span> and assign it later.
                </p>
              </div>

              {/* ── Location — optional ── */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                  Infrastructure Location
                  <span className="ml-1.5 normal-case font-normal text-slate-400">(optional)</span>
                </label>
                <select
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer"
                  value={puceNodeId}
                  onChange={(e) => setPuceNodeId(e.target.value)}
                >
                  <option value="">— Non affectée —</option>
                  {subNodes.map((node) => {
                    const mng = managers.find(m => m.id === node.managerId);
                    return (
                      <option key={node.id} value={node.id}>
                        {node.name} (Office {node.officeNum} — {mng ? mng.name : 'Unknown'})
                      </option>
                    );
                  })}
                </select>
                {/* visual hint when nothing selected */}
                {!puceNodeId && (
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Aucun utilisateur — vous pourrez affecter cette puce plus tard via Modifier.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">S/N</label>
                  <input type="text" required placeholder="e.g. SIM-000123"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] font-mono"
                    value={puceSerial} onChange={(e) => setPuceSerial(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">N° tel</label>
                  <input type="tel" required placeholder="e.g. 0550 00 00 00"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] font-mono"
                    value={pucePhone} onChange={(e) => setPucePhone(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Code PUK</label>
                <input type="text" required placeholder="e.g. 12345678"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] font-mono"
                  value={pucePuk} onChange={(e) => setPucePuk(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Crédit / mois (DA)</label>
                  <input type="number" placeholder="e.g. 1000"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                    value={puceCredit} onChange={(e) => setPuceCredit(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">État</label>
                  <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer"
                    value={puceStatus} onChange={(e) => setPuceStatus(e.target.value as any)}>
                    <option value="Active">Actif</option>
                    <option value="Suspended">Suspendu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                  Contrat Ooredoo <span className="text-[#FF1E1E]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TC', 'LX', 'PL'] as const).map((co) => (
                    <button key={co} type="button"
                      onClick={() => setPuceContract(co)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                        puceContract === co
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                      {co}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#86868B] mt-1">
                  Whose Ooredoo contract this SIM is billed under — independent of where it's physically used.
                </p>
              </div>

              <button type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-99 transition-all text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2">
                <Plus className="w-4 h-4 text-[#FF1E1E]" />
                {puceNodeId ? 'Register Puce' : 'Register SIM CARD Non affectée'}
              </button>
            </form>
          )}

          {/* C. SUBNODE FORM */}
          {activeForm === 'subnode' && (
            <form onSubmit={handleSubNodeSubmit} className="space-y-4">
              <div className="border-b border-slate-150 pb-3">
                <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2"><Layers className="text-emerald-600 w-4.5 h-4.5" />{t('create_office_desk')}</h4>
                <p className="text-[11px] text-[#86868B] mt-1">Adds a card under a manager. Office number is auto-assigned.</p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-emerald-800 font-semibold">Auto office number: <span className="font-black font-mono">#{getNextNodeOfficeNum()}</span></span>
              </div>
              {managers.length === 0 ? (
                <p className="text-xs text-rose-500 font-semibold p-4 bg-rose-50 rounded-xl">No registered managers. Create a manager first!</p>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Full Name (Desk / Person)</label>
                    <input type="text" required placeholder="e.g. MESSAOUDI HOUSSEM"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                      value={nodeName} onChange={(e) => setNodeName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                      Role / Title <span className="text-slate-400 normal-case font-normal">(optional — shown in Décharge)</span>
                    </label>
                    <input type="text" placeholder="e.g. Méthodiste Luxe Tile"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                      value={nodeRole} onChange={(e) => setNodeRole(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />CIN <span className="text-slate-400 normal-case font-normal">(optional — shown in Décharge)</span>
                    </label>
                    <input type="text" placeholder="e.g. 123456789"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] font-mono"
                      value={nodeCin} onChange={(e) => setNodeCin(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Direct Responsible Head (Manager)</label>
                    <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                      value={nodeManagerId} onChange={(e) => setNodeManagerId(e.target.value)}>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.company} - {m.role})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Structure Type</label>
                    <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl cursor-pointer focus:outline-none"
                      value={nodeType} onChange={(e) => setNodeType(e.target.value as any)}>
                      <option value="Person">Particular Person Desk</option>
                      <option value="Office">Office Room</option>
                      <option value="Cabinet">Rack Array / Cabinet</option>
                      <option value="Other">Other space</option>
                    </select>
                  </div>
                  <button type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-99 transition-all text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4">
                    <Plus className="w-4 h-4" />Register Desk Element CARD
                  </button>
                </>
              )}
            </form>
          )}

          {/* D. MANAGER FORM */}
          {activeForm === 'manager' && (
            <form onSubmit={handleManagerSubmit} className="space-y-4">
              <div className="border-b border-slate-150 pb-3">
                <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2"><UserPlus className="text-[#FF1E1E] w-4.5 h-4.5" />{t('appoint_corporate_head')}</h4>
                <p className="text-[11px] text-[#86868B] mt-1">Enrolls an executive manager. Office suite auto-assigned.</p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                <UserPlus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] text-blue-800 font-semibold">Auto office suite: <span className="font-black font-mono">#{getNextManagerOfficeNum()}</span></span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" required placeholder="e.g. Helena Rostova"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                    value={mngName} onChange={(e) => setMngName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Official E-Mail</label>
                  <input type="email" required placeholder="e.g. h.rostova@lx-corp.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                    value={mngEmail} onChange={(e) => setMngEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Corporate Role / Title</label>
                  <input type="text" required placeholder="e.g. Global Network Chief"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                    value={mngRole} onChange={(e) => setMngRole(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Corporate Entity</label>
                  <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl cursor-pointer focus:outline-none"
                    value={mngCompany} onChange={(e) => setMngCompany(e.target.value as any)}>
                    <option value="TC">TC (Telecom Group)</option><option value="LX">LX (Logistics)</option><option value="PL">PL (Plants)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Department</label>
                  <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl cursor-pointer focus:outline-none"
                    value={mngDeptId} onChange={(e) => setMngDeptId(e.target.value)}>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name} (Code #{d.deptNum})</option>)}
                  </select>
                </div>
              </div>
              <button type="submit"
                className="w-full py-3 bg-[#FF1E1E] hover:bg-red-700 active:scale-99 transition-all text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4">
                <Plus className="w-4 h-4" />Appoint Department Head
              </button>
            </form>
          )}

          {/* E. DEPARTMENT FORM */}
          {activeForm === 'dept' && (
            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div className="border-b border-slate-150 pb-3">
                <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2"><FolderPlus className="text-[#FF1E1E] w-4.5 h-4.5" />{t('define_system_department')}</h4>
                <p className="text-[11px] text-[#86868B] mt-1">Department number assigned automatically.</p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <FolderPlus className="w-3.5 h-3.5 text-[#FF1E1E] shrink-0" />
                <span className="text-[11px] text-rose-800 font-semibold">Auto dept number: <span className="font-black font-mono">#{getNextDeptNum()}</span></span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Department Name</label>
                <input type="text" required placeholder="e.g. Operations & Labs"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                  value={deptName} onChange={(e) => setDeptName(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Representation Icon</label>
                <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-[#D2D2D7]/60 rounded-xl cursor-pointer focus:outline-none"
                  value={deptIcon} onChange={(e) => setDeptIcon(e.target.value)}>
                  <option value="Briefcase">Business Briefcase</option><option value="Network">Infrastructure Network</option>
                  <option value="Coins">Finance & Audit</option><option value="Users">HR Users</option>
                  <option value="Cpu">Engineering Cpu</option><option value="Truck">Logistics Truck</option>
                  <option value="Layers">Database Modules</option>
                </select>
              </div>
              <button type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-99 transition-all text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4">
                <Plus className="w-4 h-4 text-[#FF1E1E]" />Initialize Department
              </button>
            </form>
          )}
        </div>

        {/* ── DATABASE INSPECTOR PANEL ── */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D2D2D7]/50 shadow-sm p-6 flex flex-col min-h-125">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                <LayoutList className="w-4 h-4 text-[#FF1E1E]" />{t('database_records')}
              </h4>
              <p className="text-[11px] text-[#86868B] mt-0.5">Edit, delete, and generate Décharge handover certifications</p>
            </div>
            <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 select-none">
              {[
                { id: 'materials', label: `${t('assets')} (${materials.length})` },
                { id: 'puces',     label: `Puces (${puces.length})` },
                { id: 'subnodes',  label: `${t('desks')} (${subNodes.length})` },
                { id: 'managers',  label: `${t('heads')} (${managers.length})` },
                { id: 'depts',     label: `${t('depts')} (${departments.length})` },
              ].map(tab => (
                <button key={tab.id}
                  onClick={() => { setInspectorTab(tab.id as any); setInspectorSearch(''); setDechargeSelectedIds([]); }}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all text-[11px] cursor-pointer ${inspectorTab === tab.id ? 'bg-white text-slate-950 shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder={`Search in ${inspectorTab}...`}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] rounded-xl transition-all"
              value={inspectorSearch} onChange={(e) => setInspectorSearch(e.target.value)} />
          </div>

          {/* Décharge action bar — only on Materials tab */}
          {inspectorTab === 'materials' && (
            <div className="mt-3 flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#FF1E1E] shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide">Décharge Multi-Sélection</p>
                  <p className="text-[9.5px] text-slate-500">
                    {dechargeSelectedIds.length === 0
                      ? 'Cochez les équipements ci-dessous — ils doivent appartenir au même utilisateur.'
                      : <span className="text-emerald-700 font-bold">{dechargeSelectedIds.length} équipement(s) sélectionné(s) {dechargeNodeId ? `— ${(subNodes.find(n => n.id === dechargeNodeId) as any)?.name || ''}` : ''}</span>
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dechargeSelectedIds.length > 0 && (
                  <button onClick={() => setDechargeSelectedIds([])}
                    className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-all cursor-pointer">
                    Effacer
                  </button>
                )}
                <button onClick={openDechargePreview} disabled={dechargeSelectedIds.length === 0}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${dechargeSelectedIds.length > 0 ? 'bg-[#FF1E1E] hover:bg-[#E01B1B] text-white cursor-pointer shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  <Printer className="w-3.5 h-3.5" />
                  Générer Décharge ({dechargeSelectedIds.length})
                </button>
              </div>
            </div>
          )}

          {/* Record list */}
          <div className="mt-3 flex-1 overflow-y-auto workspace-scroll max-h-110 pr-1 space-y-2">

            {/* MATERIALS */}
            {inspectorTab === 'materials' && (
              getFilteredMaterials().length > 0 ? getFilteredMaterials().map((m) => {
                const node = subNodes.find(n => n.id === m.assignedNodeId);
                const isChecked = dechargeSelectedIds.includes(m.id);
                const isBlocked = !isChecked && dechargeSelectedIds.length > 0 && !canAddToSelection(m.id);
                return (
                  <div key={m.id}
                    className={`flex justify-between items-center p-3.5 rounded-2xl border transition-colors gap-3 ${isChecked ? 'bg-[#FF1E1E]/5 border-[#FF1E1E]/30 ring-1 ring-[#FF1E1E]/20' : isBlocked ? 'bg-slate-50 border-[#D2D2D7]/40 opacity-40' : 'bg-slate-50 border-[#D2D2D7]/40 hover:bg-slate-100/40'}`}>
                    <button onClick={() => toggleDechargeSelect(m.id)} disabled={isBlocked}
                      className={`shrink-0 transition-colors ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      title={isBlocked ? 'Doit appartenir au même utilisateur' : ''}>
                      {isChecked ? <CheckSquare className="w-4 h-4 text-[#FF1E1E]" /> : <Square className={`w-4 h-4 ${isBlocked ? 'text-slate-300' : 'text-slate-400 hover:text-slate-600'}`} />}
                    </button>
                    <div className="truncate min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-950 text-xs tracking-wide">{m.codification}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${m.status === 'Active' ? 'bg-[#34C759]/10 text-[#34C759]' : m.status === 'Under Repair' ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-slate-200 text-slate-700'}`}>{m.status}</span>
                        {(m as any).condition && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${(m as any).condition === 'Neuf' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {(m as any).condition}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 block truncate mt-0.5">{m.name}</span>
                      <span className="text-[10px] text-[#86868B] block truncate">
                        {node ? node.name : 'Unknown Desk'} • S/N: {m.serialNumber} • {m.cost.toLocaleString()} DA
                      </span>
                      {m.notes && (
                        <span className="text-[9.5px] text-slate-400 italic block truncate mt-0.5">
                          ↳ {m.notes.slice(0, 80)}{m.notes.length > 80 ? '…' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setEditingItem({ type: 'material', id: m.id, data: { ...m } })}
                        className="p-1.5 bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete material ${m.codification}?`)) { onDeleteMaterial(m.id); triggerSuccess(`Deleted "${m.codification}"`); } }}
                        className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-[#86868B] text-center py-10">No matching assets found.</p>
            )}

            {/* PUCES */}
            {inspectorTab === 'puces' && (
              getFilteredPuces().length > 0 ? getFilteredPuces().map((p) => {
                const node = p.assignedNodeId ? subNodes.find(n => n.id === p.assignedNodeId) : null;
                const isVierge = !p.assignedNodeId;
                return (
                  <div key={p.id}
                    className={`flex justify-between items-center p-3.5 rounded-2xl border transition-colors gap-3 ${isVierge ? 'bg-amber-50/60 border-amber-200/70' : 'bg-slate-50 border-[#D2D2D7]/40 hover:bg-slate-100/40'}`}>
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-[#FF1E1E]/10 text-[#FF1E1E] flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="truncate min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-950 text-xs tracking-wide">{p.phoneNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${p.status === 'Active' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF9500]/10 text-[#FF9500]'}`}>
                          {p.status === 'Active' ? 'Actif' : 'Suspendu'}
                        </span>
                        {p.contractCompany && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                            p.contractCompany === 'TC' ? 'bg-red-100 text-red-700 border-red-200' :
                            p.contractCompany === 'LX' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}>
                            {p.contractCompany}
                          </span>
                        )}
                        {/* Puce vierge badge */}
                        {isVierge && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />Non affectée
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 block truncate mt-0.5">
                        {isVierge
                          ? <span className="italic text-amber-600">Non affectée — affecter via Modifier</span>
                          : <>{node ? node.name : 'Unknown Desk'} — Crédit/mois : {Number(p.monthlyCredit || 0).toLocaleString()} DA</>
                        }
                      </span>
                      <span className="text-[10px] text-[#86868B] block truncate">
                        S/N : {p.serialNumber} — PUK : {p.pukCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setEditingItem({ type: 'puce', id: p.id, data: { ...p } })}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isVierge ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200' : 'bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border-slate-200'}`}>
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete puce ${p.phoneNumber}?`)) { onDeletePuce(p.id); triggerSuccess(`Deleted puce "${p.phoneNumber}"`); } }}
                        className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-[#86868B] text-center py-10">No matching puces found.</p>
            )}

            {/* SUBNODES */}
            {inspectorTab === 'subnodes' && (
              getFilteredSubNodes().length > 0 ? getFilteredSubNodes().map((s: any) => {
                const mng = managers.find(man => man.id === s.managerId);
                const count = materials.filter(m => m.assignedNodeId === s.id).length;
                const puceCount = puces.filter(p => p.assignedNodeId === s.id).length;
                const docCount = (s.documents || []).length;
                return (
                  <div key={s.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 border border-[#D2D2D7]/40 hover:bg-slate-100/40 transition-colors">
                    <div className="truncate pr-3 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">{s.name}</span>
                        <span className="bg-[#FAF9F6] border border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 rounded font-mono">{s.type}</span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-mono font-bold px-1.5 rounded">#{s.officeNum}</span>
                      </div>
                      {s.role && <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">Rôle : {s.role}</span>}
                      <span className="text-[10px] text-[#86868B] block mt-0.5">
                        Manager: {mng ? mng.name : 'Unassigned'}
                        {s.cin && <> • CIN : <span className="font-mono">{s.cin}</span></>}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-extrabold text-teal-600 uppercase tracking-wide">{count} {count === 1 ? 'allocated asset' : 'allocated assets'}</span>
                        <span className="text-[9px] font-extrabold text-[#FF1E1E] uppercase tracking-wide">{puceCount} {puceCount === 1 ? 'puce' : 'puces'}</span>
                        {docCount > 0 && (
                          <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-wide flex items-center gap-0.5">
                            <Paperclip className="w-2.5 h-2.5" />{docCount} doc{docCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <label title="Upload documents" className="p-1.5 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer">
                        <FileUp className="w-3.5 h-3.5" />
                        <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                          onChange={(e) => handleDocumentUpload(s.id, e.target.files)} />
                      </label>
                      <button onClick={() => setDocsModalNode(s as SubNodeWithDocs)} title={`View documents (${docCount})`}
                        className={`p-1.5 border rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold ${docCount > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-100'}`}>
                        <Paperclip className="w-3.5 h-3.5" />
                        {docCount > 0 && <span>{docCount}</span>}
                      </button>
                      <button onClick={() => setEditingItem({ type: 'subnode', id: s.id, data: { ...s } })}
                        className="p-1.5 bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete desk node? (${count} assets and ${puceCount} puces affected)`)) { onDeleteSubNode(s.id); triggerSuccess('Deleted desk node'); } }}
                        className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-[#86868B] text-center py-10">No matching desk/office cards found.</p>
            )}

            {/* MANAGERS */}
            {inspectorTab === 'managers' && (
              getFilteredManagers().length > 0 ? getFilteredManagers().map((m: any) => {
                const deptObj = departments.find(d => d.id === m.departmentId);
                const nodeCount = subNodes.filter(s => s.managerId === m.id).length;
                return (
                  <div key={m.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 border border-[#D2D2D7]/40 hover:bg-slate-100/40 transition-colors">
                    <div className="truncate pr-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${m.avatarColor}`} />
                        <span className="font-bold text-slate-900 text-xs truncate">{m.name}</span>
                        <span className="text-[9px] font-black bg-rose-50 border border-rose-200/50 text-[#FF1E1E] px-1 rounded">{m.company}</span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-mono font-bold px-1.5 rounded">Suite #{m.officeNum}</span>
                      </div>
                      <span className="text-[10px] text-[#86868B] block mt-0.5">
                        {m.role} • Dept: {deptObj ? deptObj.name : 'Unassigned'}
                        {m.cin && <> • CIN : <span className="font-mono">{m.cin}</span></>}
                      </span>
                      <span className="text-[9.5px] text-indigo-600 font-bold block mt-1">Directly managing {nodeCount} desks/cells</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingItem({ type: 'manager', id: m.id, data: { ...m } })}
                        className="p-1.5 bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete Manager "${m.name}"?`)) { onDeleteManager(m.id); triggerSuccess('Decommissioned manager profile'); } }}
                        className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-[#86868B] text-center py-10">No matching managers found.</p>
            )}

            {/* DEPARTMENTS */}
            {inspectorTab === 'depts' && (
              getFilteredDepartments().length > 0 ? getFilteredDepartments().map((d) => {
                const headCount = managers.filter(m => m.departmentId === d.id).length;
                return (
                  <div key={d.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 border border-[#D2D2D7]/40 hover:bg-slate-100/40 transition-colors">
                    <div className="truncate pr-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-[#FF1E1E]/10 text-[#FF1E1E] text-[10px] font-mono font-bold leading-none">#{d.deptNum}</span>
                        <span className="font-bold text-slate-900 text-xs">{d.name} ({d.shortCode})</span>
                      </div>
                      <span className="text-[10px] text-[#86868B] block mt-0.5">Department heads: {headCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setPrintDeptReport(d)}
                        className="p-1.5 bg-white text-slate-755 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                        <Printer className="w-3.5 h-3.5" /><span>Report</span>
                      </button>
                      <button onClick={() => setEditingItem({ type: 'dept', id: d.id, data: { ...d } })}
                        className="p-1.5 bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete Department "${d.name}"?`)) { onDeleteDepartment(d.id); triggerSuccess('Purged Department registry'); } }}
                        className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-[#86868B] text-center py-10">No matching departments found.</p>
            )}
          </div>
        </div>
      </div>

      {/* ════════ DOCUMENTS MODAL ════════ */}
      {docsModalNode && (
        <div className="fixed inset-0 bg-[#1D1D1F]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#D2D2D7]/50 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Documents</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{docsModalNode.name} — Office #{docsModalNode.officeNum}</p>
                </div>
              </div>
              <button onClick={() => setDocsModalNode(null)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <label className="shrink-0 flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl py-4 cursor-pointer transition-all group mb-4">
              <FileUp className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
              <span className="text-xs font-bold text-indigo-500 group-hover:text-indigo-700 transition-colors">Click to upload documents</span>
              <span className="text-[10px] text-slate-400">(PDF, DOC, XLS, IMG...)</span>
              <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                onChange={(e) => { handleDocumentUpload(docsModalNode.id, e.target.files); e.target.value = ''; }} />
            </label>
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {((docsModalNode as any).documents || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Paperclip className="w-8 h-8 text-slate-200 mb-3" />
                  <p className="text-xs font-bold text-slate-400">No documents attached</p>
                  <p className="text-[10px] text-slate-300 mt-1">Upload files using the zone above</p>
                </div>
              ) : (
                ((docsModalNode as any).documents as SubNodeDocument[]).map((doc) => {
                  const icon = getDocIcon(doc.type);
                  const uploadDate = new Date(doc.uploadedAt).toLocaleDateString('fr-FR');
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/60 transition-colors group">
                      <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border font-mono ${icon.color}`}>{icon.label}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[9.5px] text-slate-400 mt-0.5">{uploadDate}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={doc.url} download={doc.name}
                          className="p-1.5 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer" title="Download">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {(doc.type.includes('image') || doc.type.includes('pdf')) && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 bg-white text-slate-500 hover:text-violet-600 hover:bg-violet-50 border border-slate-200 rounded-lg transition-colors cursor-pointer" title="Preview">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => handleDeleteDocument(docsModalNode.id, doc.id)}
                          className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {((docsModalNode as any).documents || []).length > 0 && (
              <div className="shrink-0 mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-semibold">{((docsModalNode as any).documents || []).length} document(s) attached</span>
                <button onClick={() => setDocsModalNode(null)} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ EDIT MODAL ════════ */}
      {editingItem && (
        <div className="fixed inset-0 bg-[#1D1D1F]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#D2D2D7]/50 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Modify Record — {editingItem.type.toUpperCase()}</h3>
              <button onClick={() => setEditingItem(null)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-4">

              {/* EDIT DEPT */}
              {editingItem.type === 'dept' && (
                <div className="space-y-3">
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Department Name</label>
                    <input type="text" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.name}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Dept ID Number</label>
                    <input type="text" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.deptNum}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, deptNum: e.target.value } })} /></div>
                </div>
              )}

              {/* EDIT MANAGER */}
              {editingItem.type === 'manager' && (
                <div className="space-y-3">
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Full Name</label>
                    <input type="text" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.name}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Official Email</label>
                    <input type="email" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.email}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, email: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Title / Role</label>
                      <input type="text" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.role}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value } })} /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Office Suite #</label>
                      <input type="text" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.officeNum}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, officeNum: e.target.value } })} /></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">CIN (optional)</label>
                    <input type="text" className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono" value={editingItem.data.cin || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, cin: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Entity</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={editingItem.data.company}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, company: e.target.value } })}>
                        <option value="TC">TC</option><option value="LX">LX</option><option value="PL">PL</option>
                      </select></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Department</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={editingItem.data.departmentId}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, departmentId: e.target.value } })}>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name} (#{d.deptNum})</option>)}
                      </select></div>
                  </div>
                </div>
              )}

              {/* EDIT SUBNODE */}
              {editingItem.type === 'subnode' && (
                <div className="space-y-3">
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Full Name</label>
                    <input type="text" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.name}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Role / Title</label>
                    <input type="text" className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" placeholder="e.g. Méthodiste Luxe Tile" value={editingItem.data.role || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value } })} /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">CIN (optional)</label>
                    <input type="text" className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-mono" value={editingItem.data.cin || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, cin: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Room/Area</label>
                      <input type="text" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.officeNum}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, officeNum: e.target.value } })} /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Node Type</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={editingItem.data.type}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, type: e.target.value } })}>
                        <option value="Person">Person Desk</option><option value="Office">Office Room</option>
                        <option value="Cabinet">Rack / Cabinet</option><option value="Other">Other</option>
                      </select></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Advisor Manager</label>
                    <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={editingItem.data.managerId}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, managerId: e.target.value } })}>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.company} - {m.role})</option>)}
                    </select></div>
                </div>
              )}

              {/* EDIT PUCE — assignedNodeId is now optional */}
              {editingItem.type === 'puce' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">
                      Location Node
                      <span className="ml-1.5 normal-case font-normal text-slate-400">(optional — laisser vide = puce Non affectée)</span>
                    </label>
                    <select
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                      value={editingItem.data.assignedNodeId || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, assignedNodeId: e.target.value || undefined } })}
                    >
                      <option value="">— Non affectée —</option>
                      {subNodes.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (office {s.officeNum})</option>
                      ))}
                    </select>
                    {/* hint when currently vierge */}
                    {!editingItem.data.assignedNodeId && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        Puce non affectée — choisissez un utilisateur pour l'affecter.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">S/N</label>
                      <input type="text" required className="font-mono w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.serialNumber}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, serialNumber: e.target.value } })} /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">N° tel</label>
                      <input type="tel" required className="font-mono w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.phoneNumber}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, phoneNumber: e.target.value } })} /></div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Code PUK</label>
                    <input type="text" required className="font-mono w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.pukCode}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, pukCode: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Crédit / mois (DA)</label>
                      <input type="number" className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.monthlyCredit}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, monthlyCredit: Number(e.target.value) } })} /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">État</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={editingItem.data.status}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, status: e.target.value } })}>
                        <option value="Active">Actif</option>
                        <option value="Suspended">Suspendu</option>
                      </select></div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Contrat Ooredoo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['TC', 'LX', 'PL'] as const).map((co) => (
                        <button key={co} type="button"
                          onClick={() => setEditingItem({ ...editingItem, data: { ...editingItem.data, contractCompany: co } })}
                          className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                            (editingItem.data.contractCompany || 'TC') === co
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                          {co}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT MATERIAL */}
              {editingItem.type === 'material' && (
                <div className="space-y-3">
                  <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Asset Model Name</label>
                    <input type="text" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.name}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Location Node</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={editingItem.data.assignedNodeId}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, assignedNodeId: e.target.value } })}>
                        {subNodes.map(s => <option key={s.id} value={s.id}>{s.name} (office {s.officeNum})</option>)}
                      </select></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Category</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={editingItem.data.type}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, type: e.target.value } })}>
                        <option value="Printer">Printer</option><option value="Server">Server</option>
                        <option value="Switch">Switch</option><option value="Desktop">Desktop PC</option>
                        <option value="Screen">Screen</option><option value="UPS">UPS</option>
                        <option value="Laptop">Laptop</option><option value="Flash Disque">Flash Disque</option>
                        <option value="Mouse">Mouse</option><option value="Keyboard">Keyboard</option>
                        <option value="Phone">Phone</option><option value="Cable">Cable</option>
                        <option value="Desk Phone">Desk Phone</option><option value="Other">Other</option>
                      </select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Serial Number</label>
                      <input type="text" required className="font-mono w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.serialNumber}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, serialNumber: e.target.value } })} /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Cost (DA)</label>
                      <input type="number" required className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.cost}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, cost: Number(e.target.value) } })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Status</label>
                      <select className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer" value={editingItem.data.status}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, status: e.target.value } })}>
                        <option value="Active">Active</option><option value="Under Repair">Under Repair</option>
                        <option value="In Storage">In Storage</option><option value="Retired">Retired</option>
                      </select></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Codification Ref</label>
                      <input type="text" required className="font-mono w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-100" value={editingItem.data.codification}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, codification: e.target.value } })} /></div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">État</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Bon', 'Neuf'] as const).map((c) => (
                        <button key={c} type="button"
                          onClick={() => setEditingItem({ ...editingItem, data: { ...editingItem.data, condition: c } })}
                          className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                            (editingItem.data.condition || 'Bon') === c
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">
                      Configuration / Specs <span className="text-[#FF1E1E]">(→ Décharge)</span>
                    </label>
                    <textarea rows={3} className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" value={editingItem.data.notes || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, notes: e.target.value } })} /></div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider">Save Modifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ DÉCHARGE PREVIEW MODAL ════════ */}
      {dechargePreviewMaterials && (
        <div className="fixed inset-0 bg-[#1D1D1F]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-8 my-8 relative flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-6 select-none shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#FF1E1E]" />
                <div>
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Bon de Décharge — Aperçu</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{dechargePreviewMaterials.length} équipement(s) • Bénéficiaire : {(subNodes.find(n => n.id === dechargePreviewMaterials[0]?.assignedNodeId) as any)?.name || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={triggerSystemBrowserPrint}
                  className="px-4 py-2 bg-[#FF1E1E] hover:bg-[#E01B1B] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /><span>Imprimer (Ctrl+P)</span>
                </button>
                <button onClick={() => setDechargePreviewMaterials(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto print:overflow-visible">
              {renderDechargeDocument(dechargePreviewMaterials)}
            </div>
          </div>
        </div>
      )}

      {/* ════════ DEPT REPORT MODAL ════════ */}
      {printDeptReport && (() => {
        const dept = printDeptReport;
        const deptMngs = managers.filter(m => m.departmentId === dept.id);
        const deptSubNodes = subNodes.filter(s => deptMngs.some(m => m.id === s.managerId));
        const deptMaterials = materials.filter(m => deptSubNodes.some(s => s.id === m.assignedNodeId));
        const totalValuation = deptMaterials.reduce((sum, c) => sum + c.cost, 0);
        return (
          <div className="fixed inset-0 bg-[#1D1D1F]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-250">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-8 my-8 relative flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4 select-none shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF1E1E]" />
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Department Status Report Audit</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={triggerSystemBrowserPrint} className="px-4 py-2 bg-[#FF1E1E] hover:bg-[#E01B1B] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
                    <Printer className="w-3.5 h-3.5" /><span>Print (Ctrl+P)</span>
                  </button>
                  <button onClick={() => setPrintDeptReport(null)} className="p-1.5 hover:bg-slate-150 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 print:overflow-visible font-sans text-xs">
                <div className="printable-area p-8 border border-slate-300 rounded-2xl bg-white text-slate-900 space-y-6 md:p-12 print:border-none print:p-0">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                    <div>
                      <h1 className="text-lg font-extrabold tracking-wider text-slate-950 uppercase font-sans">TECHNOCERAM</h1>
                      <p className="text-[10px] font-sans font-black text-[#FF1E1E] uppercase tracking-widest mt-1">Department Audit Report</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Date</p>
                      <p className="font-bold text-slate-850 mt-1">{currentDate}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-white p-4.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF1E1E]">Active Segment Index</span>
                      <h2 className="text-base font-black uppercase tracking-tight font-sans mt-0.5">{dept.name} Status Sheet</h2>
                    </div>
                    <div className="flex gap-4 md:text-right shrink-0">
                      <div><span className="text-[9px] text-slate-400 uppercase tracking-wider block">Dept ID Code</span><span className="text-xs font-bold font-mono">#{dept.deptNum}</span></div>
                      <div><span className="text-[9px] text-slate-400 uppercase tracking-wider block">Valuation Total</span><span className="text-xs font-bold text-[#FF1E1E] font-mono">{totalValuation.toLocaleString()} DA</span></div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider border-b border-slate-200 pb-1">1. Commissioned Department heads</h3>
                    {deptMngs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {deptMngs.map(m => (
                          <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                            <h4 className="font-extrabold text-slate-900 text-[11px]">{m.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium leading-none mt-1">{m.role}</p>
                            <p className="text-[9.5px] font-mono text-slate-400 mt-1 leading-none">{m.email}</p>
                            <span className="text-[9px] font-mono font-bold bg-[#FF1E1E]/8 text-[#FF1E1E] px-1 rounded mt-2 inline-block">Suite {m.officeNum} • {m.company}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-slate-400 italic">No appointed managers inside this department registry.</p>}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider border-b border-slate-200 pb-1">2. Sub-node Station Inventory Records</h3>
                    {deptSubNodes.length > 0 ? (
                      <div className="space-y-4">
                        {deptSubNodes.map(s => {
                          const stationMaterials = deptMaterials.filter(m => m.assignedNodeId === s.id);
                          const associatedManager = deptMngs.find(man => man.id === s.managerId);
                          return (
                            <div key={s.id} className="p-4 rounded-xl border border-slate-200 space-y-3">
                              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div>
                                  <span className="font-extrabold text-slate-900">{s.name}</span>
                                  <span className="text-[10px] text-slate-500 block">office {s.officeNum} • {s.type} • Head: {associatedManager?.name || 'Unassigned'}</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded shrink-0">{stationMaterials.length} items</span>
                              </div>
                              {stationMaterials.length > 0 ? (
                                <table className="w-full text-left text-[10px]">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-300">
                                      <th className="p-2">System Code</th><th className="p-2">Model / Name</th>
                                      <th className="p-2 text-center">Status</th><th className="p-2">Serial</th>
                                      <th className="p-2 text-right">Value (DA)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {stationMaterials.map(m => (
                                      <tr key={m.id} className="border-b border-slate-250 hover:bg-slate-50">
                                        <td className="p-2 font-mono font-bold text-[#FF1E1E] tracking-tight">{m.codification}</td>
                                        <td className="p-2"><p className="font-bold">{m.name}</p><p className="text-[9px] text-gray-400">{m.notes || 'No remarks'}</p></td>
                                        <td className="p-2 text-center"><span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold ${m.status === 'Active' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-slate-200 text-slate-700'}`}>{m.status.toUpperCase()}</span></td>
                                        <td className="p-2 font-mono text-slate-500">{m.serialNumber}</td>
                                        <td className="p-2 text-right font-mono font-bold">{m.cost.toLocaleString()} DA</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : <p className="text-[10px] text-slate-400 italic">No hardware assets mapped under this station.</p>}
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-xs text-slate-400 italic">No workstation sub-nodes associated under this department.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-250 text-slate-500">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="leading-relaxed text-[10px]">The {dept.name} Status Sheet presents complete compliance records verified against the hardware ledger registry.</p>
                    </div>
                    <div className="flex flex-col justify-end text-right pr-4 font-sans text-xs">
                      <p className="font-black text-slate-900">CERTIFIED SYSTEM</p>
                      <p className="text-[10.5px] text-slate-400 mt-1">Enterprise Operations</p>
                      <div className="border-b border-dashed border-slate-300 w-1/2 ml-auto mt-12 mb-1"></div>
                      <p className="text-[10px] text-slate-400 italic">Central Systems Registry validation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
