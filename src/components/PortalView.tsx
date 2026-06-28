import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Department, Manager, SubNode, Material, Puce } from '../types';
import { 
  MapPin, Layers, Server, Laptop, Plus, HelpCircle, UserCheck, 
  ChevronRight, User, X, Check, Mail, Info, Settings, ShieldAlert,
  FileText, Edit, Trash2, ClipboardCheck, Printer, Smartphone, History, Activity, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MaterialQrCard from './MaterialQrCard';
import { generateMaterialCodification } from '../data';

// ─── Catalog Selector types ──────────────────────────────────────────────────
interface CatalogBrand {
  name: string;
  models: string[];
}

interface CatalogItem {
  label: string;
  deviceCategory: 'Printer' | 'Server' | 'Switch' | 'Desktop' | 'Screen' | 'UPS' | 'Laptop' | 'Mouse' | 'Keyboard' | 'Phone' | 'Cable' | 'Desk Phone' | 'Flash Disque' | 'Access Point' | 'Other';
  brands: CatalogBrand[];
}

interface MaterialHistoryEntry {
  id: number | string;
  materialId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
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
    label: 'UPS (Ondulateur)',
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
  // ─── NEW: Access Point WiFi ──────────────────────────────────────────────
  'access point': {
    label: 'Access Point WiFi',
    deviceCategory: 'Access Point',
    brands: [
      { name: 'Ubiquiti', models: ['UAP-AC-LR', 'U6-Lite', 'U6-Pro', 'UAP-AC-Pro'] },
      { name: 'TP-Link', models: ['EAP225', 'EAP245', 'EAP610', 'EAP110'] },
      { name: 'Cisco', models: ['AIR-AP1815W', 'AIR-AP1840', 'AIR-AP2802E'] },
      { name: 'MikroTik', models: ['cAP AC', 'wAP AC', 'RBcAPGi-5acD2nD'] },
      { name: 'Ruckus', models: ['R510', 'R610', 'R710'] },
      { name: 'Zyxel', models: ['NWA1100-NH', 'NWA5123-AC', 'WAC500'] },
      { name: 'Aruba', models: ['AP-303', 'AP-505', 'AP-515'] },
      { name: 'Generic', models: ['WiFi Access Point', 'Dual Band AP'] }
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

interface PortalViewProps {
  selectedDept: Department;
  managers: Manager[];
  subNodes: SubNode[];
  materials: Material[];
  puces: Puce[];
  onSelectMaterial: (m: Material) => void;
  selectedAssetFromScanner?: Material | null;
  onClearSelectedAssetScanner?: () => void;
  onAddManager: (manager: Manager) => void;
  onAddSubNode: (subnode: SubNode) => void;
  onAddMaterial: (material: Material) => void;
  onAddPuce: (puce: Puce) => void;
  onDeleteMaterial: (id: string) => void;
  onDeletePuce: (id: string) => void;
  onUpdateMaterial: (id: string, updated: Material) => void;
  onUpdatePuce: (id: string, updated: Puce) => void;
  onUpdateSubNode: (id: string, updated: SubNode) => void;
  departments: Department[];
}

export default function PortalView({
  selectedDept,
  managers,
  subNodes,
  materials,
  puces,
  onSelectMaterial,
  selectedAssetFromScanner,
  onClearSelectedAssetScanner,
  onAddManager,
  onAddSubNode,
  onAddMaterial,
  onAddPuce,
  onDeleteMaterial,
  onDeletePuce,
  onUpdateMaterial,
  onUpdatePuce,
  onUpdateSubNode,
  departments
}: PortalViewProps) {
  const { t } = useTranslation();

  const deptManagers = useMemo(() => {
    return managers.filter(m => m.departmentId === selectedDept.id);
  }, [managers, selectedDept]);

  const [activeManagerId, setActiveManagerId] = useState<string>('');

  React.useEffect(() => {
    if (deptManagers.length > 0) {
      setActiveManagerId(deptManagers[0].id);
    } else {
      setActiveManagerId('');
    }
  }, [selectedDept, deptManagers]);

  const activeManager = useMemo(() => {
    return managers.find(m => m.id === activeManagerId) || deptManagers[0];
  }, [managers, activeManagerId, deptManagers]);

  const activeSubNodes = useMemo(() => {
    if (!activeManager) return [];

    const managerAsSubNode: SubNode = {
      id: `node-${activeManager.id.replace('mng-', '')}`,
      name: t('global_assets'),
      role: `${t('full_dept_overview')} — ${activeManager.company} Group`,
      type: 'Person',
      officeNum: t('department_desks'),
      managerId: activeManager.id
    };

    const otherNodes = subNodes.filter(node =>
      node.managerId === activeManager.id &&
      node.id !== `node-${activeManager.id.replace('mng-', '')}`
    );

    return [managerAsSubNode, ...otherNodes];
  }, [subNodes, activeManager, t]);

  const [activeSubNodeId, setActiveSubNodeId] = useState<string>('');

  React.useEffect(() => {
    if (activeSubNodes.length > 0) {
      const mngNode = activeSubNodes.find(n => n.id === `node-${activeManager?.id.replace('mng-', '')}`);
      setActiveSubNodeId(mngNode ? mngNode.id : activeSubNodes[0].id);
    } else {
      setActiveSubNodeId('');
    }
  }, [activeManager, activeSubNodes]);

  const activeSubNode = useMemo(() => {
    return activeSubNodes.find(node => node.id === activeSubNodeId) || activeSubNodes[0];
  }, [activeSubNodeId, activeSubNodes]);

  const nodeMaterials = useMemo(() => {
    if (!activeSubNode) return [];

    const isManagerNode = activeSubNode.id === `node-${activeManager?.id.replace('mng-', '')}`;
    if (isManagerNode) {
      const activeNodeIds = activeSubNodes.map(node => node.id);
      return materials.filter(m => activeNodeIds.includes(m.assignedNodeId));
    }

    return materials.filter(m => m.assignedNodeId === activeSubNode.id);
  }, [materials, activeSubNode, activeManager, activeSubNodes]);

  const nodePuces = useMemo(() => {
    if (!activeSubNode) return [];

    const isManagerNode = activeSubNode.id === `node-${activeManager?.id.replace('mng-', '')}`;
    if (isManagerNode) {
      const activeNodeIds = activeSubNodes.map(node => node.id);
      return puces.filter(p => activeNodeIds.includes(p.assignedNodeId));
    }

    return puces.filter(p => p.assignedNodeId === activeSubNode.id);
  }, [puces, activeSubNode, activeManager, activeSubNodes]);

  const [modalMaterial, setModalMaterial] = useState<Material | null>(null);
  const [timelineMaterial, setTimelineMaterial] = useState<Material | null>(null);
  const [materialHistory, setMaterialHistory] = useState<MaterialHistoryEntry[]>([]);
  const [materialHistoryLoading, setMaterialHistoryLoading] = useState(false);
  const [materialHistoryError, setMaterialHistoryError] = useState<string | null>(null);
  const [activeCreationType, setActiveCreationType] = useState<'manager' | 'subnode' | 'material' | 'puce' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingPuce, setEditingPuce] = useState<Puce | null>(null);
  const userEditedNotesRef = useRef(false);

  // ── Décharge state ──
  const [dechargePreviewMaterials, setDechargePreviewMaterials] = useState<Material[] | null>(null);
  const [dechargePreviewPuces, setDechargePreviewPuces] = useState<Puce[] | null>(null);

  React.useEffect(() => {
    if (selectedAssetFromScanner) {
      setModalMaterial(selectedAssetFromScanner);
      if (onClearSelectedAssetScanner) onClearSelectedAssetScanner();
    }
  }, [selectedAssetFromScanner, onClearSelectedAssetScanner]);

  useEffect(() => {
    if (!timelineMaterial) {
      setMaterialHistory([]);
      setMaterialHistoryError(null);
      return;
    }

    let cancelled = false;
    setMaterialHistoryLoading(true);
    setMaterialHistoryError(null);

    fetch(`/api/materials/${encodeURIComponent(timelineMaterial.id)}/history`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `History request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setMaterialHistory(Array.isArray(data.history) ? data.history : []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load material history:', err);
          setMaterialHistoryError('Unable to load audit history for this asset.');
        }
      })
      .finally(() => {
        if (!cancelled) setMaterialHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [timelineMaterial]);

  // ── Form States ──
  const [mngName, setMngName] = useState('');
  const [mngEmail, setMngEmail] = useState('');
  const [mngRole, setMngRole] = useState('');
  const [mngCompany, setMngCompany] = useState<'TC' | 'LX' | 'PL'>('TC');

  const [nodeName, setNodeName] = useState('');
  const [nodeRole, setNodeRole] = useState('');
  const [nodeType, setNodeType] = useState<'Office' | 'Person' | 'Cabinet' | 'Other'>('Person');

  const [matName, setMatName] = useState('');
  // ─── UPDATED: Added 'Access Point' to the type union ────────────────────
  const [matType, setMatType] = useState<'Printer' | 'Server' | 'Switch' | 'Desktop' | 'Screen' | 'UPS' | 'Laptop' | 'Mouse' | 'Keyboard' | 'Phone' | 'Cable' | 'Desk Phone' | 'Flash Disque' | 'Access Point' | 'Other'>('Laptop');
  const [matStatus, setMatStatus] = useState<'Active' | 'Under Repair' | 'In Storage' | 'Retired'>('Active');
  // ── NEW: condition state ──
  const [matCondition, setMatCondition] = useState<'Bon' | 'Neuf'>('Bon');
  const [matSerial, setMatSerial] = useState('');
  const [matCost, setMatCost] = useState('');
  const [matDate, setMatDate] = useState('');
  const [matNotes, setMatNotes] = useState('');
const saveCatalogToServer = (
  updatedCatalog: Record<string, CatalogItem>
) => {
  setCatalog(updatedCatalog);

  fetch('/api/catalog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedCatalog),
  }).catch(() => {});
};
// ─── Auto-populate remarks for Desktop/Laptop ──────────────────────────────
useEffect(() => {
  const isDesktopOrLaptop = matType === 'Desktop' || matType === 'Laptop';
  const template = 'Processeur: \nRAM: \nGPU: \nStockage:';
  
  if (isDesktopOrLaptop) {
    if (!userEditedNotesRef.current) {
      const currentNotes = matNotes.trim();
      if (!currentNotes || currentNotes === template.trim() || currentNotes === 'Processeur: \nRAM: \nGPU: \nStockage:') {
        setMatNotes(template);
        userEditedNotesRef.current = false;
      }
    }
  } else {
    if (matNotes.trim() === template.trim() || matNotes.trim() === 'Processeur: \nRAM: \nGPU: \nStockage:') {
      setMatNotes('');
      userEditedNotesRef.current = false;
    }
  }
}, [matType]);

// Also run on initial mount
useEffect(() => {
  const isDesktopOrLaptop = matType === 'Desktop' || matType === 'Laptop';
  const template = 'Processeur: \nRAM: \nGPU: \nStockage:';
  
  if (isDesktopOrLaptop && !matNotes.trim()) {
    setMatNotes(template);
  }
}, []);
const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setMatNotes(value);
  
  const template = 'Processeur: \nRAM: \nGPU: \nStockage:';
  if (value.trim() !== template.trim() && value.trim() !== 'Processeur: \nRAM: \nGPU: \nStockage:') {
    userEditedNotesRef.current = true;
  } else {
    userEditedNotesRef.current = false;
  }
};
  // ─── Dynamic Catalog Picker states ─────────────────────────────────────────
  const [catalog, setCatalog] = useState<Record<string, CatalogItem>>(DEFAULT_CATALOG);

useEffect(() => {
  fetch('/api/catalog')
    .then(res => res.json())
    .then(data => {
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        setCatalog(data);
      }
    })
    .catch(() => {});
}, []);

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
    if (selectedCatalogBrand === '__NEW__') return [];
    const brandObj = catalog[selectedCatalogType].brands.find(b => b.name === selectedCatalogBrand);
    return brandObj ? brandObj.models : [];
  }, [selectedCatalogType, selectedCatalogBrand, catalog]);

  React.useEffect(() => {
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

  const newName = nameParts.join(' ');
  if (newName !== matName) {
    setMatName(newName);
  }
}, [selectedCatalogType, selectedCatalogBrand, newBrandName, selectedCatalogModel, newModelName]);
// ─── Special handler for new model name ───
useEffect(() => {
  // Only run when we're adding a new model and have a model name
  if (selectedCatalogModel === '__NEW__' && newModelName.trim() && selectedCatalogType) {
    const nameParts = [selectedCatalogType];
    
    let brand = '';
    if (selectedCatalogBrand === '__NEW__') {
      brand = newBrandName.trim();
    } else if (selectedCatalogBrand) {
      brand = selectedCatalogBrand;
    }
    if (brand) nameParts.push(brand);
    
    nameParts.push(newModelName.trim());
    const newName = nameParts.join(' ');
    if (newName !== matName) {
      setMatName(newName);
    }
  }
}, [newModelName]); // Only depend on newModelName
  const [puceSerial,   setPuceSerial]   = useState('');
  const [pucePhone,    setPucePhone]    = useState('');
  const [pucePuk,      setPucePuk]      = useState('');
  const [puceCredit,   setPuceCredit]   = useState('');
  const [puceStatus,   setPuceStatus]   = useState<'Active' | 'Suspended'>('Active');
  const [puceContract, setPuceContract] = useState<'TC' | 'LX' | 'PL'>('TC');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddManagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mngName || !mngEmail || !mngRole) return;

    const colors = ['bg-[#FF1E1E]', 'bg-[#000000]', 'bg-slate-800', 'bg-red-800', 'bg-neutral-800', 'bg-[#3A3A3C]'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMng: Manager = {
      id: `mng-${Date.now()}`,
      name: mngName,
      email: mngEmail,
      role: mngRole,
      avatarColor: randomColor,
      officeNum: String(managers.filter(m => m.company === mngCompany).length + 1),
      company: mngCompany,
      departmentId: selectedDept.id
    };

    onAddManager(newMng);
    setActiveManagerId(newMng.id);
    triggerToast(`${t('officer_successfully_appointed')} ${selectedDept.name}!`);
    setActiveCreationType(null);

    setMngName('');
    setMngEmail('');
    setMngRole('');
  };

  const handleAddSubNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName || !activeManager) return;

    const newNode: SubNode = {
      id: `node-${Date.now()}`,
      name: nodeName,
      role: nodeRole.trim() || undefined,
      type: nodeType,
      officeNum: String(subNodes.filter(s => {
  const mng = managers.find(m => m.id === s.managerId);
  return mng?.company === activeManager.company;
}).length + 1),
      managerId: activeManager.id
    };

    onAddSubNode(newNode);
    setActiveSubNodeId(newNode.id);
    triggerToast(`${t('team_element_created_under')} ${activeManager.name}!`);
    setActiveCreationType(null);

    setNodeName('');
    setNodeRole('');
    setNodeType('Person');
  };

  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName || !activeSubNode || !activeManager) return;

    const resolvedDeptNum = selectedDept.deptNum;

    const { materialNum, codification } = generateMaterialCodification(
      activeManager.company,
      resolvedDeptNum,
      activeSubNode.officeNum,
      matType,
      materials
    );
const brand =
  selectedCatalogBrand === '__NEW__'
    ? newBrandName.trim()
    : selectedCatalogBrand;

const model =
  selectedCatalogModel === '__NEW__'
    ? newModelName.trim()
    : selectedCatalogModel;

const materialName = [
  selectedCatalogType,
  brand,
  model,
]
  .filter(Boolean)
  .join(' ');
    const newMaterial: Material = {
      id: `mat-${Date.now()}`,
      name: materialName,
      type: matType,
      company: activeManager.company,
      deptNum: resolvedDeptNum,
      officeNum: activeSubNode.officeNum,
      materialNum: materialNum,
      codification: codification,
      status: matStatus,
      // ── NEW: include condition ──
      condition: matCondition,
      serialNumber: matSerial.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      purchaseDate: matDate || undefined,
      cost: Number(matCost) || 0,
      notes: matNotes.trim() || undefined,
      assignedNodeId: activeSubNode.id
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
  saveCatalogToServer(updatedCatalog);
}
    }

    onAddMaterial(newMaterial);
    triggerToast(`${t('hardware_asset_registered')} ${codification}!`);
    setActiveCreationType(null);

    setMatName('');
    setMatSerial('');
    setMatCost('');
    setMatNotes('');
    setMatDate('');
    setMatStatus('Active');
    // ── NEW: reset condition ──
    setMatCondition('Bon');

    setSelectedCatalogType('');
    setSelectedCatalogBrand('');
    setSelectedCatalogModel('');
    setNewBrandName('');
    setNewModelName('');
    userEditedNotesRef.current = false;
  };

  const handleAddPuceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puceSerial || !pucePhone || !pucePuk || !activeSubNode) return;

    const newPuce: Puce = {
      id: `puce-${Date.now()}`,
      serialNumber: puceSerial.trim(),
      phoneNumber: pucePhone.trim(),
      pukCode: pucePuk.trim(),
      monthlyCredit: Number(puceCredit) || 0,
      status: puceStatus,
      contractCompany: puceContract,
      assignedNodeId: activeSubNode.id
    };

    onAddPuce(newPuce);
    triggerToast(`Puce ${newPuce.phoneNumber} registered under ${activeSubNode.name}!`);
    setActiveCreationType(null);

    setPuceSerial('');
    setPucePhone('');
    setPucePuk('');
    setPuceCredit('');
    setPuceStatus('Active');
    setPuceContract('TC');
  };

  const handleEditMaterialSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    onUpdateMaterial(editingMaterial.id, editingMaterial);
    triggerToast(`${t('asset_updated_successfully')}`);
    setEditingMaterial(null);
  };

  const handleEditPuceSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPuce) return;
    onUpdatePuce(editingPuce.id, editingPuce);
    triggerToast('Puce updated successfully');
    setEditingPuce(null);
  };

  const getSubNodeIcon = (type: string) => {
    switch (type) {
      case 'Cabinet': return Server;
      case 'Person': return UserCheck;
      case 'Office': return MapPin;
      default: return Layers;
    }
  };

  // ── Décharge document renderer ──
  const renderDechargeDocument = (selectedMaterials: Material[]) => {
      if (selectedMaterials.length === 0) return null;
      const node = subNodes.find(n => n.id === selectedMaterials[0].assignedNodeId) as any;
      const mng  = node ? managers.find(m => m.id === node.managerId) as any : null;
      const dept = mng ? departments.find(d => d.id === mng.departmentId) : null;
      const currentDate = new Date().toLocaleDateString("fr-FR");
  
      return (
        <div className="printable-area bg-white text-black w-[210mm] h-[297mm] mx-auto px-[20mm] py-[14mm] font-sans text-[12.5px] leading-[1.5] print:w-[210mm] print:h-[297mm] box-border flex flex-col overflow-hidden">
          {/* ── Header ── */}
          <div>
            <div className="flex items-start gap-4">
              <img src="/tc.jpg" alt="TECHNOCERAM" className="w-14 object-contain" />
              <h1 className="font-black text-[20px] leading-none mt-1">TECHNOCERAM</h1>
            </div>
            <div className="border-b-[3px] border-red-600 mt-5" />
            <p className="font-semibold text-[13px] mt-3">N° : ______ /2026</p>
          </div>
  
          {/* ── Title ── */}
          <div className="mt-15 text-center">
            <h2 className="font-black text-[18px]">Bon de Décharge pour Matériel Informatique</h2>
          </div>
  
          {/* ── Intro paragraph ── */}
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
  
          {/* ── Materials list ── */}
          <div className="mt-4 text-[13px] leading-[1.6] space-y-1">
            {selectedMaterials.map((mat) => (
              <div key={mat.id} className="space-y-0.5">
                <p><strong>{mat.type} :</strong> {mat.name}</p>
                <p><strong>Marque et modèle :</strong> {mat.name}</p>
                {/* ── NEW: show condition in décharge ── */}
                <p><strong>État :</strong> {mat.condition || 'Bon'}</p>
                {mat.notes && <p className="whitespace-pre-wrap text-[12.5px] leading-[1.55]">{mat.notes}</p>}
              </div>
            ))}
          </div>
  
          {/* ── Commitment paragraphs ── */}
          <div className="mt-5 text-[13px] leading-[1.7] space-y-3">
            <p>Je reconnais avoir reçu ce matériel en <strong>
    {selectedMaterials[0]?.condition === 'Neuf'
      ? 'état neuf'
      : 'bon état'}
  </strong>{" "} de fonctionnement et m'engage à en faire un usage approprié conformément aux politiques de sécurité informatique de l'entreprise.</p>
            <p>Je m'engage également à prendre toutes les mesures nécessaires pour assurer la sécurité et la confidentialité des données stockées sur cet appareil, ainsi que pour prévenir tout dommage, perte ou vol.</p>
            <p>En cas de départ de l'entreprise ou de transfert de responsabilité, je m'engage à restituer ce matériel en bon état dans les plus brefs délais.</p>
          </div>
  
          {/* ── Signature always pinned to bottom ── */}
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

  const getStatusClass = (status?: string | null) => {
    switch (status) {
      case 'Active':
        return 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20';
      case 'Under Repair':
        return 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20';
      case 'In Storage':
        return 'bg-[#FF1E1E]/10 text-[#FF1E1E] border-[#FF1E1E]/20';
      case 'Retired':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatHistoryDate = (value?: string | null) => {
    if (!value) return 'Unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getHistoryTitle = (entry: MaterialHistoryEntry) => {
    if (entry.action === 'MATERIAL_CREATED') return 'Asset registered';
    if (entry.action === 'STATUS_CHANGED') return 'Lifecycle status changed';
    if (entry.field === 'assignedNodeId') return 'Assignment changed';
    if (entry.field === 'condition') return 'Condition changed';
    return 'Asset detail changed';
  };

  const getNodeLabel = (nodeId?: string | null) => {
    if (!nodeId) return 'Unassigned';
    const node = subNodes.find(n => n.id === nodeId) || activeSubNodes.find(n => n.id === nodeId);
    if (!node) return nodeId;
    return node.officeNum ? `${node.name} (${node.officeNum})` : node.name;
  };

  const getHistoryValueLabel = (entry: MaterialHistoryEntry, value?: string | null) => {
    if (entry.field === 'assignedNodeId') return getNodeLabel(value);
    return value || 'Empty';
  };

  const timelineEntries = useMemo(() => {
    if (!timelineMaterial) return [];
    if (materialHistory.length > 0) return materialHistory;

    return [{
      id: 'current-status',
      materialId: timelineMaterial.id,
      action: 'CURRENT_STATUS',
      field: 'status',
      oldValue: null,
      newValue: timelineMaterial.status,
      createdAt: timelineMaterial.purchaseDate || '',
    }];
  }, [materialHistory, timelineMaterial]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-1 relative">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1D1D1F]/95 backdrop-blur-md border border-[#D2D2D7]/30 text-white rounded-xl p-4 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-350">
          <div className="w-6 h-6 rounded-full bg-[#34C759] flex items-center justify-center font-bold text-white shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-semibold text-white">{toastMessage}</p>
        </div>
      )}

      {/* Department Banner */}
      <div className="bg-linear-to-br from-[#1D1D1F] via-[#2F2F33] to-[#111111] text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-16 translate-y-16 w-80 h-80 rounded-full bg-[#FF1E1E]/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF1E1E]/15 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md border border-[#FF1E1E]/20 text-[#FF1E1E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E1E] animate-pulse"></span>
              {t('department_identity')} : {selectedDept.deptNum}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-widest font-display text-white">
              {selectedDept.name} {t('dashboard')}
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-xl font-sans">
              {t('portal_desc')}
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={() => setActiveCreationType('manager')}
              className="px-4 py-2 bg-[#FF1E1E] hover:bg-[#E01B1B] text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{t('appoint_heads')}</span>
            </button>

            <div className="flex gap-2 shrink-0 bg-white/5 border border-white/10 p-3 rounded-xl min-w-31 justify-center items-center">
              <span className="flex flex-col items-center text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{t('active_heads')}</span>
                <span className="text-sm font-bold font-mono tracking-tight text-[#FF1E1E]">{deptManagers.length} {t('heads')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: MANAGERS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
            {t('select_managing_head')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCreationType('manager')}
              className="px-2.5 py-1 bg-[#FF1E1E]/10 hover:bg-[#FF1E1E]/15 border border-[#FF1E1E]/20 rounded-lg text-[10px] font-bold text-[#FF1E1E] transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{t('appoint_head')}</span>
            </button>
            <span className="text-xs text-[#86868B] font-semibold">{deptManagers.length} {t('heads_available')}</span>
          </div>
        </div>

        {deptManagers.length < 1 ? (
          <div className="bg-white border border-dashed border-[#D2D2D7] rounded-xl p-8 text-center text-xs text-[#86868B] flex flex-col items-center justify-center gap-2">
            {t('no_heads_appointed')}
            <button
              onClick={() => setActiveCreationType('manager')}
              className="mt-2 px-4.5 py-2 bg-[#FF1E1E] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-red-600"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('appoint_dept_manager')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deptManagers.map((manager) => {
              const worksCount = subNodes.filter(s => s.managerId === manager.id).length;
              const isSelected = activeManager && activeManager.id === manager.id;
              return (
                <div
                  key={manager.id}
                  onClick={() => {
                    setActiveManagerId(manager.id);
                    const nodes = subNodes.filter(s => s.managerId === manager.id);
                    if (nodes.length > 0) {
                      setActiveSubNodeId(`node-${manager.id.replace('mng-', '')}`);
                    }
                  }}
                  className={`relative p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#FF1E1E] text-[#1D1D1F] shadow-md ring-2 ring-[#FF1E1E]/15 scale-[1.01]'
                      : 'bg-white border-[#D2D2D7] text-[#424245] hover:border-[#86868B] hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                        isSelected ? 'bg-[#FF1E1E] shadow-sm' : manager.avatarColor
                      }`}>
                        {manager.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider pointer-events-none ${
                        isSelected ? 'bg-[#FF1E1E]/10 text-[#FF1E1E]' : 'bg-[#F5F5F7] text-[#86868B]'
                      }`}>
                        {manager.company} {t('group')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-[#1D1D1F]">{manager.name}</h3>
                      <p className="text-[11px] mt-0.5 font-medium text-[#86868B]">{manager.role}</p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between mt-5 pt-3 border-t text-[11px] font-mono ${
                    isSelected ? 'border-[#FF1E1E]/20 text-[#FF1E1E]' : 'border-[#F5F5F7] text-[#86868B]'
                  }`}>
                    <div className="flex items-center gap-1.5"></div>
                    <span className="text-[10px] font-bold opacity-80">{worksCount || 0} {t('desks')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 2 & 3: SubNodes + Materials */}
      {activeManager && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
                {t('elements_team_members')}
              </span>
              <button
                onClick={() => setActiveCreationType('subnode')}
                className="px-2 py-0.5 bg-emerald-600/10 hover:bg-emerald-600/15 border border-emerald-600/20 rounded-md text-[9px] font-bold text-emerald-600 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{t('add_desk_office')}</span>
              </button>
            </div>

            {activeSubNodes.length === 0 ? (
              <div className="bg-white text-[#86868B] p-8 rounded-2xl border border-dashed border-[#D2D2D7] text-center text-xs space-y-2 py-10">
                <HelpCircle className="w-6 h-6 mx-auto text-[#86868B]/60" />
                <p className="font-semibold text-[#1D1D1F]">{t('no_elements')}</p>
                <p className="text-[11px] max-w-xs mx-auto">{t('create_team_workstations')} {activeManager.name}.</p>
                <button
                  onClick={() => setActiveCreationType('subnode')}
                  className="mt-2.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {t('define_first_desk')}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeSubNodes.map((node) => {
                  const isMngNode = activeManager && node.id === `node-${activeManager.id.replace('mng-', '')}`;
                  const departmentNodeIds = activeSubNodes.map(n => n.id);
                  const itemsCount = isMngNode
                    ? materials.filter(m => departmentNodeIds.includes(m.assignedNodeId)).length
                    : materials.filter(m => m.assignedNodeId === node.id).length;
                  const pucesCount = isMngNode
                    ? puces.filter(p => departmentNodeIds.includes(p.assignedNodeId)).length
                    : puces.filter(p => p.assignedNodeId === node.id).length;
                  const isSelected = activeSubNode && activeSubNode.id === node.id;

                  return (
                    <button
                      key={node.id}
                      onClick={() => setActiveSubNodeId(node.id)}
                      className={`w-full p-4.5 rounded-xl text-left border flex items-center justify-between transition-all duration-150 cursor-pointer group ${
                        isSelected
                          ? isMngNode
                            ? 'bg-[#FF1E1E]/10 border-[#FF1E1E]/30 text-[#FF1E1E] shadow-sm ring-1 ring-[#FF1E1E]/20'
                            : 'bg-slate-900/10 border-slate-900/30 text-slate-800 shadow-sm ring-1 ring-slate-900/20'
                          : 'bg-white border-[#D2D2D7] hover:border-[#86868B] text-[#424245] hover:bg-[#F5F5F7]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          isSelected
                            ? isMngNode ? 'bg-[#FF1E1E]/15 text-[#FF1E1E]' : 'bg-slate-900/15 text-slate-800'
                            : isMngNode ? 'bg-red-50 text-[#FF1E1E] border border-red-200/50' : 'bg-[#F2F2F7] text-[#86868B]'
                        }`}>
                          {isMngNode ? <UserCheck className="w-4.5 h-4.5 font-bold" /> : <User className="w-4.5 h-4.5" />}
                        </div>
                        <div className="truncate pr-2">
                          <span className={`text-xs font-bold block truncate tracking-tight ${
                            isSelected
                              ? isMngNode ? 'text-[#FF1E1E]' : 'text-slate-900'
                              : 'text-[#1D1D1F]'
                          }`}>
                            {node.name}
                            {isMngNode && (
                              <span className="ml-1.5 text-[8px] bg-[#FF1E1E]/10 text-[#FF1E1E] font-bold px-1.5 py-0.5 rounded-full border border-[#FF1E1E]/20 uppercase tracking-widest">
                                {t('head')}
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-[#86868B] font-medium block truncate mt-0.5">
                            {isMngNode
                              ? `${activeManager?.company} ${t('group')} — ${t('active_dept_overview')}`
                              : (node.role || node.type || t('team_desk'))}
                          </span>
                          <span className={`text-[10px] font-mono block mt-1 ${isSelected ? 'text-inherit/80' : 'text-[#86868B]'}`}>
                            {t('office_number')}: {node.officeNum}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                          isSelected
                            ? isMngNode ? 'bg-[#FF1E1E]/25 text-[#FF1E1E]' : 'bg-slate-900/25 text-slate-800'
                            : isMngNode ? 'bg-[#FF1E1E]/10 text-[#FF1E1E]' : 'bg-[#F2F2F7] text-[#86868B]'
                        }`}>
                          {itemsCount} {itemsCount === 1 ? t('asset_count') : t('assets_count')}
                        </span>
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                          isSelected
                            ? isMngNode ? 'bg-[#FF1E1E]/20 text-[#FF1E1E]' : 'bg-slate-900/15 text-slate-800'
                            : 'bg-red-50 text-[#FF1E1E]'
                        }`}>
                          {pucesCount} puce{pucesCount === 1 ? '' : 's'}
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-[#86868B] transition-transform ${
                          isSelected ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: MATERIALS */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold tracking-wider text-[#86868B] uppercase">{t('hardware_catalog')}</span>
              <div className="flex items-center gap-1.5">
                {activeSubNode && (
                  <button
                    onClick={() => {
                      if (activeSubNode.id === `node-${activeManager?.id.replace('mng-', '')}`) {
                        alert(t('please_select_specific_desk'));
                        return;
                      }
                      setActiveCreationType('material');
                    }}
                    className="px-2 py-0.5 bg-[#FF1E1E]/10 hover:bg-[#FF1E1E]/20 border border-[#FF1E1E]/25 rounded-md text-[9px] font-bold text-[#FF1E1E] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>{t('add_asset')}</span>
                  </button>
                )}
                {activeSubNode && (
                  <button
                    onClick={() => {
                      if (activeSubNode.id === `node-${activeManager?.id.replace('mng-', '')}`) {
                        alert(t('please_select_specific_desk'));
                        return;
                      }
                      setActiveCreationType('puce');
                    }}
                    className="px-2 py-0.5 bg-slate-900/10 hover:bg-slate-900/15 border border-slate-900/20 rounded-md text-[9px] font-bold text-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Add Puce</span>
                  </button>
                )}
                {activeSubNode && (
                  <span className="text-[10px] bg-[#F5F5F7] text-[#424245] border border-[#D2D2D7] font-semibold px-2 py-0.5 rounded font-mono uppercase max-w-20 truncate" title={activeSubNode.name}>
                    {activeSubNode.name}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D2D2D7] shadow-sm overflow-hidden min-h-87.5 flex flex-col justify-between">
              <div>
                {!activeSubNode ? (
                  <div className="text-center py-12 text-[#86868B] text-xs">
                    {t('select_card_to_view_inventory')}
                  </div>
                ) : nodeMaterials.length === 0 ? (
                  <div className="p-8 text-center text-[#86868B] text-xs space-y-3 py-16">
                    <Laptop className="w-10 h-10 mx-auto text-[#86868B]/40 animate-pulse" />
                    <div>
                      <p className="font-bold text-[#1D1D1F]">{t('no_hardware_allocated')}</p>
                      <p className="mt-1 leading-relaxed max-w-xs mx-auto text-[#86868B]">
                        {t('no_hardware_allocated_desc')}
                      </p>
                    </div>
                    {activeSubNode.id !== `node-${activeManager?.id.replace('mng-', '')}` && (
                      <button
                        onClick={() => setActiveCreationType('material')}
                        className="px-3.5 py-1.5 bg-[#FF1E1E] hover:bg-rose-600 text-white font-semibold rounded-xl text-[10px] mx-auto flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        {t('allocate_hardware')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-[#F5F5F7]">
                    {nodeMaterials.map((material) => {
                      const materialOwner = activeSubNodes.find(node => node.id === material.assignedNodeId);
                      return (
                        <div
                          key={material.id}
                          onClick={() => setTimelineMaterial(material)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setTimelineMaterial(material);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-5 hover:bg-[#F5F5F7]/50 transition-colors cursor-pointer focus:outline-none focus:bg-[#F5F5F7]"
                        >
                          {/* Left: asset metadata */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="font-mono font-bold text-[#1D1D1F] tracking-wide text-xs">{material.codification}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                material.status === 'Active' ? 'bg-[#34C759]/11 text-[#34C759]' :
                                material.status === 'Under Repair' ? 'bg-[#FF9500]/11 text-[#FF9500]' :
                                'bg-[#FF1E1E]/11 text-[#FF1E1E]'
                              }`}>
                                {material.status}
                              </span>
                              {/* ── NEW: show condition badge in list ── */}
                              {material.condition && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  material.condition === 'Neuf'
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200/60'
                                    : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                                }`}>
                                  {material.condition}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <h4 className="text-xs font-bold text-[#1D1D1F] tracking-tight leading-tight">{material.name}</h4>
                              {materialOwner && (
                                <span className="inline-flex items-center gap-1 bg-[#F5F5F7] text-[#86868B] text-[9px] font-semibold px-2 py-0.5 rounded-full border border-[#D2D2D7]/30 shrink-0">
                                  <User className="w-2.5 h-2.5 text-[#86868B]/80" />
                                  {materialOwner.name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3.5 text-[10px] text-[#86868B] font-mono">
                              <span>{t('sn')}: {material.serialNumber}</span>
                              <span>•</span>
                              <span>{t('cost')}: DA{material.cost.toLocaleString()}</span>
                            </div>

                            {material.notes && material.notes.trim() !== '' && (
                              <div className="flex items-start gap-1.5 mt-1 pt-1.5 border-t border-[#F0F0F5]">
                                <FileText className="w-3 h-3 text-[#86868B] shrink-0 mt-px" />
                                <p className="text-[10px] text-[#86868B] leading-relaxed italic line-clamp-2">
                                  {material.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right: action buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-start">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMaterial({ ...material });
                              }}
                              className="p-1.5 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-[#D2D2D7] rounded-lg transition-all cursor-pointer"
                              title={t('edit_asset')}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`${t('delete_asset_confirm')} "${material.codification} — ${material.name}"?`)) {
                                  onDeleteMaterial(material.id);
                                  triggerToast(`${t('asset_removed')} "${material.codification}".`);
                                }
                              }}
                              className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-[#D2D2D7] rounded-lg transition-all cursor-pointer"
                              title={t('delete_asset')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {/* ── Décharge button ── */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDechargePreviewMaterials([material]);
                              }}
                              className="p-1.5 bg-white text-slate-500 hover:text-[#FF1E1E] hover:bg-red-50 border border-[#D2D2D7] rounded-lg transition-all cursor-pointer"
                              title="Bon de Décharge"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalMaterial(material);
                              }}
                              className="py-1.5 px-3 bg-white text-[#FF1E1E] border border-[#FF1E1E]/30 hover:bg-[#FF1E1E] hover:text-white text-[11px] font-semibold tracking-wide rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Server className="w-3.5 h-3.5" />
                              {t('qr_code')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {activeSubNode && nodeMaterials.length > 0 && (
                <div className="bg-[#F5F5F7] p-3.5 border-t border-[#D2D2D7] flex justify-between items-center text-[10px] font-bold text-[#86868B] tracking-wider uppercase">
                  <span>{t('total_cost')}: DA{nodeMaterials.reduce((acc, c) => acc + c.cost, 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#D2D2D7] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F5F5F7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#FF1E1E]" />
                  <span className="text-[11px] font-black tracking-wider text-slate-900 uppercase">Puces</span>
                </div>
                {activeSubNode && activeSubNode.id !== `node-${activeManager?.id.replace('mng-', '')}` && (
                  <button
                    onClick={() => setActiveCreationType('puce')}
                    className="px-2.5 py-1 bg-[#FF1E1E]/10 hover:bg-[#FF1E1E]/15 border border-[#FF1E1E]/20 rounded-lg text-[10px] font-bold text-[#FF1E1E] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add Puce
                  </button>
                )}
              </div>
              {!activeSubNode ? (
                <div className="text-center py-8 text-[#86868B] text-xs">
                  {t('select_card_to_view_inventory')}
                </div>
              ) : nodePuces.length === 0 ? (
                <div className="p-8 text-center text-[#86868B] text-xs space-y-3">
                  <Smartphone className="w-8 h-8 mx-auto text-[#86868B]/35" />
                  <p className="font-bold text-[#1D1D1F]">No puces allocated</p>
                  {activeSubNode.id !== `node-${activeManager?.id.replace('mng-', '')}` && (
                    <button
                      onClick={() => setActiveCreationType('puce')}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-[10px] mx-auto flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#FF1E1E]" />
                      Allocate Puce
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#F5F5F7]">
                  {nodePuces.map((puce) => {
                    const puceOwner = activeSubNodes.find(node => node.id === puce.assignedNodeId);
                    return (
                      <div key={puce.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-[#F5F5F7]/50 transition-colors">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-mono font-bold text-[#1D1D1F] tracking-wide text-xs">{puce.phoneNumber}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              puce.status === 'Active' ? 'bg-[#34C759]/11 text-[#34C759]' : 'bg-[#FF9500]/11 text-[#FF9500]'
                            }`}>
                              {puce.status === 'Active' ? 'Actif' : 'Suspendu'}
                            </span>
                            {puceOwner && (
                              <span className="inline-flex items-center gap-1 bg-[#F5F5F7] text-[#86868B] text-[9px] font-semibold px-2 py-0.5 rounded-full border border-[#D2D2D7]/30">
                                <User className="w-2.5 h-2.5" />
                                {puceOwner.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3.5 text-[10px] text-[#86868B] font-mono">
                            <span>S/N: {puce.serialNumber}</span>
                            <span>-</span>
                            <span>PUK: {puce.pukCode}</span>
                            <span>-</span>
                            <span>Credit: DA{Number(puce.monthlyCredit || 0).toLocaleString()}/mois</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-start">
                          <button
                            onClick={() => setEditingPuce({ ...puce })}
                            className="p-1.5 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-[#D2D2D7] rounded-lg transition-all cursor-pointer"
                            title="Edit Puce"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm(`Delete puce "${puce.phoneNumber}"?`)) {
                                onDeletePuce(puce.id);
                                triggerToast(`Puce "${puce.phoneNumber}" removed.`);
                              }
                            }}
                            className="p-1.5 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-[#D2D2D7] rounded-lg transition-all cursor-pointer"
                            title="Delete Puce"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* ── Décharge button ── */}
                          <button
                            onClick={() => setDechargePreviewPuces([puce])}
                            className="p-1.5 bg-white text-slate-500 hover:text-[#FF1E1E] hover:bg-red-50 border border-[#D2D2D7] rounded-lg transition-all cursor-pointer"
                            title="Bon de Décharge"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════ CREATION DIALOGS ════════ */}
      <AnimatePresence>
        {activeCreationType !== null && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCreationType(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            />
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative overflow-hidden text-slate-800"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">
                      {activeCreationType === 'manager' && t('quick_appoint_manager')}
                      {activeCreationType === 'subnode' && t('quick_add_office_desk')}
                      {activeCreationType === 'material' && t('quick_catalog_hardware')}
                      {activeCreationType === 'puce' && 'Quick Register Puce'}
                    </h3>
                    <p className="text-[10.5px] text-[#86868B] mt-0.5">
                      {activeCreationType === 'manager' && `${t('appoint_responsible_supervisor')} ${selectedDept.name}`}
                      {activeCreationType === 'subnode' && `${t('structural_element_under')} ${activeManager?.name}`}
                      {activeCreationType === 'material' && `${t('individual_it_device_for_desk')} "${activeSubNode?.name}"`}
                      {activeCreationType === 'puce' && `SIM card for "${activeSubNode?.name}"`}
                    </p>
                  </div>
                  <button onClick={() => setActiveCreationType(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Manager Form */}
                {activeCreationType === 'manager' && (
                  <form onSubmit={handleAddManagerSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('corporate_head_name')}</label>
                      <input type="text" required placeholder={t('corporate_head_name_placeholder')}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={mngName} onChange={(e) => setMngName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('official_corporate_email')}</label>
                      <input type="email" required placeholder={t('official_corporate_email_placeholder')}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={mngEmail} onChange={(e) => setMngEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('official_title_role')}</label>
                      <input type="text" required placeholder={t('official_title_role_placeholder')}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={mngRole} onChange={(e) => setMngRole(e.target.value)} />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-[10px] text-blue-800 font-semibold">
                        {t('office_auto_assigned')}: <span className="font-black font-mono">#{managers.length + 1}</span>
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('responsible_corporate_entity')}</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['TC', 'LX', 'PL'] as const).map((entity) => (
                          <button key={entity} type="button" onClick={() => setMngCompany(entity)}
                            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                              mngCompany === entity ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100/60 text-slate-600 border border-slate-200'
                            }`}>
                            {entity} {t('group')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <Plus className="w-4 h-4 text-[#FF1E1E]" />
                      {t('appoint_manager')}
                    </button>
                  </form>
                )}

                {/* SubNode Form */}
                {activeCreationType === 'subnode' && (
                  <form onSubmit={handleAddSubNodeSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('person_desk_name')}</label>
                      <input type="text" required placeholder={t('asset_model_name_placeholder')}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={nodeName} onChange={(e) => setNodeName(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                        {t('role_title')} <span className="text-slate-400 normal-case font-normal">({t('optional')})</span>
                      </label>
                      <input type="text" placeholder={t('role_title_placeholder')}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={nodeRole} onChange={(e) => setNodeRole(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('structure_type')}</label>
                      <select className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none cursor-pointer"
                        value={nodeType} onChange={(e) => setNodeType(e.target.value as any)}>
                        <option value="Person">{t('individual_person')}</option>
                        <option value="Office">{t('office_room')}</option>
                        <option value="Cabinet">{t('rack_cabinet')}</option>
                        <option value="Other">{t('other_space')}</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[10px] text-emerald-800 font-semibold">
                        {t('office_auto_assigned')}: <span className="font-black font-mono">#{subNodes.length + 1}</span>
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2">
                      <Info className="w-4 h-4 text-[#FF1E1E] shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 leading-normal">
                        {t('element_card_under_manager')} <strong>{activeManager?.name}</strong> {t('of')} <strong>{activeManager?.company} {t('group')}</strong>.
                      </p>
                    </div>

                    <button type="submit" className="w-full mt-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      {t('create_hardware_desk_card')}
                    </button>
                  </form>
                )}

                {/* Material Form */}
                {activeCreationType === 'material' && activeSubNode && (
                  <form onSubmit={handleAddMaterialSubmit} className="space-y-4">
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
                        {/* Model / Modèle */}
<div>
  <label className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Modèle</label>
  <select 
    className="w-full text-xs px-2.5 py-2 bg-white border border-[#D2D2D7]/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] cursor-pointer disabled:opacity-50"
    disabled={!selectedCatalogBrand} // ← REMOVED the '__NEW__' check
    value={selectedCatalogModel} 
    onChange={(e) => {
      setSelectedCatalogModel(e.target.value);
      setNewModelName('');
    }}
  >
    <option value="">— Select Model —</option>
    {selectedCatalogBrand && selectedCatalogBrand !== '__NEW__' && // ← ADD this condition
      availableModels.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))
    }
    {selectedCatalogBrand && ( // ← REMOVED the '__NEW__' check
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
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('asset_model_name')}</label>
                      <input type="text" required placeholder={t('asset_model_name_placeholder')}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={matName} onChange={(e) => setMatName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('asset_category')}</label>
                        {/* ─── UPDATED: Added 'Access Point' to dropdown ─── */}
                        <select className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none cursor-pointer"
                          value={matType} onChange={(e) => setMatType(e.target.value as any)}>
                          <option value="Laptop">{t('laptop_notebook')}</option>
                          <option value="Desktop">{t('desktop_workspace')}</option>
                          <option value="Server">{t('server_station')}</option>
                          <option value="Printer">{t('printer_plotter')}</option>
                          <option value="Switch">{t('switch_router')}</option>
                          <option value="Screen">{t('screen_display')}</option>
                          <option value="UPS">{t('ups')}</option>
                          <option value="Mouse">{t('mouse') ?? 'Mouse'}</option>
                          <option value="Keyboard">{t('keyboard') ?? 'Keyboard'}</option>
                          <option value="Phone">{t('phone') ?? 'Phone'}</option>
                          <option value="Cable">{t('cable') ?? 'Cable'}</option>
                          <option value="Desk Phone">{t('desk_phone')}</option>
                          <option value="Flash Disque">{t('flash_disk')}</option>
                          <option value="Access Point">Access Point WiFi</option>
                          <option value="Other">{t('other_equipment')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('lifecycle_status')}</label>
                        <select className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none cursor-pointer"
                          value={matStatus} onChange={(e) => setMatStatus(e.target.value as any)}>
                          <option value="Active">{t('active_deployed')}</option>
                          <option value="Under Repair">{t('under_repair')}</option>
                          <option value="In Storage">{t('in_reserve_stock')}</option>
                        </select>
                      </div>
                    </div>

                    {/* ── NEW: État (condition) field ── */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                        État
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['Bon', 'Neuf'] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setMatCondition(c)}
                            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                              matCondition === c
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100/60 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('serial_number_optional')}</label>
                        <input type="text" placeholder={t('serial_number_placeholder')}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none"
                          value={matSerial} onChange={(e) => setMatSerial(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('price_valuation')}</label>
                        <input type="number" placeholder={t('price_valuation_placeholder')}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none"
                          value={matCost} onChange={(e) => setMatCost(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('acquisition_date')}</label>
                      <input type="date"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none text-slate-700"
                        value={matDate} onChange={(e) => setMatDate(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('device_integration_remarks')}</label>
                      <textarea rows={2} placeholder={t('device_integration_remarks_placeholder')}
  className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none text-slate-700"
  value={matNotes} onChange={handleNotesChange} />
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                      <p className="text-[10px] text-[#FF1E1E]">
                        <strong>{t('auto_codification')}:</strong> {t('auto_codification_desc')} {activeManager?.company} {t('group')} (#{t('department')}: {selectedDept.deptNum}, {t('office_number')}: {activeSubNode.officeNum}).
                      </p>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4 text-[#FF1E1E]" />
                      {t('catalog_asset_generate_qr')}
                    </button>
                  </form>
                )}

                {/* Puce Form */}
                {activeCreationType === 'puce' && activeSubNode && (
                  <form onSubmit={handleAddPuceSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">S/N</label>
                      <input type="text" required placeholder="e.g. SIM-000123"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF1E1E] font-mono"
                        value={puceSerial} onChange={(e) => setPuceSerial(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">N tel</label>
                        <input type="tel" required placeholder="0550 00 00 00"
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none font-mono"
                          value={pucePhone} onChange={(e) => setPucePhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Code PUK</label>
                        <input type="text" required placeholder="12345678"
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none font-mono"
                          value={pucePuk} onChange={(e) => setPucePuk(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Credit par mois (DA)</label>
                        <input type="number" placeholder="1000"
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none"
                          value={puceCredit} onChange={(e) => setPuceCredit(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Etat</label>
                        <select className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none cursor-pointer"
                          value={puceStatus} onChange={(e) => setPuceStatus(e.target.value as any)}>
                          <option value="Active">Actif</option>
                          <option value="Suspended">Suspendu</option>
                        </select>
                      </div>
                    </div>

                    {/* Contrat Ooredoo */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                        Contrat Ooredoo <span className="text-[#FF1E1E]">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['TC', 'LX', 'PL'] as const).map((co) => (
                          <button key={co} type="button"
                            onClick={() => setPuceContract(co)}
                            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                              puceContract === co
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                            {co}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#86868B] mt-1">
                        Which company's Ooredoo contract — independent of where it's used.
                      </p>
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                      <p className="text-[10px] text-[#FF1E1E]">
                        This puce will be assigned to <strong>{activeSubNode.name}</strong> (office {activeSubNode.officeNum}).
                      </p>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4 text-[#FF1E1E]" />
                      Register Puce
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════ EDIT MATERIAL MODAL ════════ */}
      <AnimatePresence>
        {editingMaterial && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMaterial(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative text-slate-800"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                      <Edit className="w-4 h-4 text-indigo-500" />
                      {t('edit_asset_title')}
                    </h3>
                    <p className="text-[10.5px] text-[#86868B] mt-0.5 font-mono">{editingMaterial.codification}</p>
                  </div>
                  <button onClick={() => setEditingMaterial(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditMaterialSave} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('asset_model_name')}</label>
                    <input type="text" required
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      value={editingMaterial.name}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('category')}</label>
                      {/* ─── UPDATED: Added 'Access Point' to edit dropdown ─── */}
                      <select
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none cursor-pointer"
                        value={editingMaterial.type}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, type: e.target.value as any })}>
                        <option value="Laptop">{t('laptop_notebook')}</option>
                        <option value="Desktop">{t('desktop_workspace')}</option>
                        <option value="Server">{t('server_station')}</option>
                        <option value="Printer">{t('printer_plotter')}</option>
                        <option value="Switch">{t('switch_router')}</option>
                        <option value="Screen">{t('screen_display')}</option>
                        <option value="UPS">{t('ups')}</option>
                        <option value="Mouse">{t('mouse') ?? 'Mouse'}</option>
                        <option value="Keyboard">{t('keyboard') ?? 'Keyboard'}</option>
                        <option value="Phone">{t('phone') ?? 'Phone'}</option>
                        <option value="Cable">{t('cable') ?? 'Cable'}</option>
                        <option value="Desk Phone">{t('desk_phone')}</option>
                        <option value="Flash Disque">{t('flash_disk')}</option>
                        <option value="Access Point">Access Point WiFi</option>
                        <option value="Other">{t('other_equipment')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('status')}</label>
                      <select
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none cursor-pointer"
                        value={editingMaterial.status}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, status: e.target.value as any })}>
                        <option value="Active">{t('active_deployed')}</option>
                        <option value="Under Repair">{t('under_repair')}</option>
                        <option value="In Storage">{t('in_reserve_stock')}</option>
                        <option value="Retired">{t('retired') ?? 'Retired'}</option>
                      </select>
                    </div>
                  </div>

                  {/* ── NEW: État (condition) in edit modal ── */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                      État
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(['Bon', 'Neuf'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditingMaterial({ ...editingMaterial, condition: c })}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                            (editingMaterial.condition || 'Bon') === c
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100/60 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('serial_number')}</label>
                      <input type="text"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none font-mono"
                        value={editingMaterial.serialNumber}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, serialNumber: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('cost')} (DA)</label>
                      <input type="number"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none"
                        value={editingMaterial.cost}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, cost: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('codification_ref')}</label>
                    <input type="text"
                      className="w-full text-xs px-3 py-2 bg-slate-100 border border-[#D2D2D7]/60 rounded-lg focus:outline-none font-mono text-slate-500"
                      value={editingMaterial.codification}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, codification: e.target.value })} />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">
                      {t('configuration_specs')} <span className="text-[#FF1E1E]">(→ {t('decharge')})</span>
                    </label>
                    <textarea rows={3}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none text-slate-700"
                      value={editingMaterial.notes || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, notes: e.target.value })} />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setEditingMaterial(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                      {t('cancel')}
                    </button>
                    <button type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider">
                      {t('save_changes')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════ EDIT PUCE MODAL ════════ */}
      <AnimatePresence>
        {editingPuce && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPuce(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-md relative text-slate-800"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                      <Edit className="w-4 h-4 text-indigo-500" />
                      Edit Puce
                    </h3>
                    <p className="text-[10.5px] text-[#86868B] mt-0.5 font-mono">{editingPuce.phoneNumber}</p>
                  </div>
                  <button onClick={() => setEditingPuce(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditPuceSave} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">S/N</label>
                    <input type="text" required
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                      value={editingPuce.serialNumber}
                      onChange={(e) => setEditingPuce({ ...editingPuce, serialNumber: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">N tel</label>
                      <input type="tel" required
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none font-mono"
                        value={editingPuce.phoneNumber}
                        onChange={(e) => setEditingPuce({ ...editingPuce, phoneNumber: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Code PUK</label>
                      <input type="text" required
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none font-mono"
                        value={editingPuce.pukCode}
                        onChange={(e) => setEditingPuce({ ...editingPuce, pukCode: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Credit/mois (DA)</label>
                      <input type="number"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none"
                        value={editingPuce.monthlyCredit}
                        onChange={(e) => setEditingPuce({ ...editingPuce, monthlyCredit: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Etat</label>
                      <select
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 rounded-lg focus:outline-none cursor-pointer"
                        value={editingPuce.status}
                        onChange={(e) => setEditingPuce({ ...editingPuce, status: e.target.value as any })}>
                        <option value="Active">Actif</option>
                        <option value="Suspended">Suspendu</option>
                      </select>
                    </div>
                  </div>

                  {/* Contrat Ooredoo — edit */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">Contrat Ooredoo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['TC', 'LX', 'PL'] as const).map((co) => (
                        <button key={co} type="button"
                          onClick={() => setEditingPuce({ ...editingPuce, contractCompany: co })}
                          className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                            (editingPuce.contractCompany || 'TC') === co
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                          {co}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setEditingPuce(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider">
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════ QR MODAL ════════ */}
      <AnimatePresence>
        {timelineMaterial && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTimelineMaterial(null)}
              className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 14 }}
                className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden"
              >
                <div className="px-6 py-5 bg-slate-950 text-white flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FF1E1E]">
                      <History className="w-4 h-4" />
                      Time Machine Audit
                    </div>
                    <h3 className="mt-2 text-lg font-black tracking-tight truncate">{timelineMaterial.name}</h3>
                    <p className="text-[11px] text-slate-300 font-mono mt-1">{timelineMaterial.codification}</p>
                  </div>
                  <button
                    onClick={() => setTimelineMaterial(null)}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Current Status</span>
                    <span className={`inline-flex mt-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusClass(timelineMaterial.status)}`}>
                      {timelineMaterial.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Serial Number</span>
                    <span className="block mt-1 text-xs font-mono font-bold text-slate-800 truncate">{timelineMaterial.serialNumber}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Condition</span>
                    <span className="block mt-1 text-xs font-bold text-slate-800">{timelineMaterial.condition || 'Bon'}</span>
                  </div>
                </div>

                <div className="p-6 max-h-[58vh] overflow-y-auto">
                  {materialHistoryLoading ? (
                    <div className="py-12 text-center">
                      <Activity className="w-7 h-7 mx-auto text-[#FF1E1E] animate-pulse" />
                      <p className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Loading audit trail...</p>
                    </div>
                  ) : materialHistoryError ? (
                    <div className="py-10 text-center text-xs font-semibold text-rose-600">
                      {materialHistoryError}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
                      <div className="space-y-4">
                        {timelineEntries.map((entry, index) => (
                          <div key={entry.id} className="relative pl-9">
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm ${
                              entry.field === 'status' ? 'bg-[#FF1E1E]' : 'bg-slate-400'
                            }`} />
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">{getHistoryTitle(entry)}</h4>
                                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                    {formatHistoryDate(entry.createdAt)}
                                  </p>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                  {entry.field || 'audit'}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                                {entry.oldValue ? (
                                  <>
                                    <span className={`px-2.5 py-1 rounded-full border ${entry.field === 'status' ? getStatusClass(entry.oldValue) : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                      {getHistoryValueLabel(entry, entry.oldValue)}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                  </>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full border bg-slate-50 text-slate-400 border-slate-200">New record</span>
                                )}
                                <span className={`px-2.5 py-1 rounded-full border ${entry.field === 'status' ? getStatusClass(entry.newValue) : 'bg-slate-900 text-white border-slate-900'}`}>
                                  {getHistoryValueLabel(entry, entry.newValue)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalMaterial && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalMaterial(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            />
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="relative"
              >
                <MaterialQrCard material={modalMaterial} onClose={() => setModalMaterial(null)} />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════ DÉCHARGE PREVIEW MODAL ════════ */}
      <AnimatePresence>
        {dechargePreviewMaterials && (
          <div className="fixed inset-0 bg-[#1D1D1F]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-8 my-8 relative flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-6 select-none shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#FF1E1E]" />
                  <div>
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Bon de Décharge — Aperçu</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {dechargePreviewMaterials.length} équipement(s) • Bénéficiaire :{" "}
                      {(subNodes.find(n => n.id === dechargePreviewMaterials[0]?.assignedNodeId) as any)?.name || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { document.title = "BON_DE_DECHARGE"; window.print(); }}
                    className="px-4 py-2 bg-[#FF1E1E] hover:bg-[#E01B1B] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /><span>Imprimer (Ctrl+P)</span>
                  </button>
                  <button
                    onClick={() => setDechargePreviewMaterials(null)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto print:overflow-visible">
                {renderDechargeDocument(dechargePreviewMaterials)}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════ DÉCHARGE PREVIEW MODAL FOR PUCES ════════ */}
      <AnimatePresence>
        {dechargePreviewPuces && (
          <div className="fixed inset-0 bg-[#1D1D1F]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-8 my-8 relative flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-6 select-none shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#FF1E1E]" />
                  <div>
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Bon de Décharge — Puces SIM</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {dechargePreviewPuces.length} puce(s) • Bénéficiaire :{" "}
                      {(subNodes.find(n => n.id === dechargePreviewPuces[0]?.assignedNodeId) as any)?.name || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { document.title = "BON_DE_DECHARGE_PUCES"; window.print(); }}
                    className="px-4 py-2 bg-[#FF1E1E] hover:bg-[#E01B1B] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /><span>Imprimer (Ctrl+P)</span>
                  </button>
                  <button
                    onClick={() => setDechargePreviewPuces(null)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto print:overflow-visible">
                {/* Puce Décharge Document */}
                <div className="printable-area bg-white text-black w-[210mm] h-[297mm] mx-auto px-[20mm] py-[14mm] font-sans text-[12.5px] leading-[1.5] print:w-[210mm] print:h-[297mm] box-border flex flex-col overflow-hidden">
  
  {/* ── Header ── */}
  <div>
    <div className="flex items-start gap-4">
      <img
        src="/tc.jpg"
        alt="TECHNOCERAM"
        className="w-14 object-contain"
      />
      <h1 className="font-black text-[20px] leading-none mt-1">
        TECHNOCERAM
      </h1>
    </div>

    <div className="border-b-[3px] border-red-600 mt-5" />

    <p className="font-semibold text-[13px] mt-3">
      N° : ______ /2026
    </p>
  </div>

  {/* ── Title ── */}
  <div className="mt-15 text-center">
    <h2 className="font-black text-[18px]">
      Bon de Décharge pour Carte SIM
    </h2>
  </div>

  {/* ── Beneficiary Info ── */}
  {(() => {
    const node = subNodes.find(
      n => n.id === dechargePreviewPuces[0]?.assignedNodeId
    ) as any;

    return (
      <>
        {/* ── Intro ── */}
        <div className="mt-15 text-[13px] leading-[1.8]">
          <p>
            Je soussigné(e),{" "}
            <strong>
              {node?.name || "________________"}
            </strong>
            ,{" "}
            <strong>
              {node?.role || "________________"}
            </strong>
            {" "}de la SARL TECHNOCERAM, déclare par la présente
            avoir reçu la carte SIM suivante :
          </p>
        </div>

        {/* ── SIM Information ── */}
        <div className="mt-6 text-[13px] leading-[1.9] pl-6">
          {dechargePreviewPuces.map((puce) => (
            <div key={puce.id} className="space-y-1">
              <p>
                <strong>Opérateur : OOREDOO</strong>{" "}
                
              </p>

              <p>
                <strong>Numéro de la ligne :</strong>{" "}
                {puce.phoneNumber || "________________"}
              </p>

              {puce.serialNumber && (
                <p>
                  <strong>Numéro de série :</strong>{" "}
                  {puce.serialNumber}
                </p>
              )}

              {puce.pukCode && (
                <p>
                  <strong>Code PUK :</strong>{" "}
                  {puce.pukCode}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ── Commitment Paragraphs ── */}
        <div className="mt-8 text-[13px] leading-[1.8] space-y-4">
          <p>
            Je reconnais avoir reçu cette carte SIM en état de
            fonctionnement et m'engage à en faire un usage
            strictement professionnel conformément aux politiques
            internes et aux règles de sécurité de l'entreprise.
          </p>

          <p>
            Je m'engage également à :
          </p>

          <div className="pl-5 space-y-2">
            <p>
              • Préserver la confidentialité des communications
              et informations liées à cette ligne ;
            </p>

            <p>
              • Ne pas céder ni prêter cette carte SIM à une
              tierce personne sans autorisation ;
            </p>

            <p>
              • Signaler immédiatement toute perte, vol ou
              dysfonctionnement au service concerné ;
            </p>

            <p>
              • Restituer la carte SIM en cas de départ de
              l'entreprise, changement de poste ou demande
              de la direction.
            </p>
          </div>

          <p className="pt-2">
            Le titulaire fournit également une copie de sa
            pièce d'identité / permis de conduire comportant
            son numéro d'identification nationale.
          </p>
        </div>

        {/* ── Signature ── */}
        <div className="mt-auto flex justify-end pb-16">
          <div className="w-72">
            <p className="text-[13px]">
              Fait à BATNA, le{" "}
              {new Date().toLocaleDateString("fr-FR")}
            </p>

            <div className="mt-16 mb-1 border-b border-black w-full" />

            <p className="text-[11px] text-slate-500 mb-5">
              Signature
            </p>

            <p className="font-bold uppercase text-[13px]">
              {node?.name || ""}
            </p>

            <p className="font-semibold text-[13px]">
              SARL TECHNOCERAM
            </p>
          </div>
        </div>
      </>
    );
  })()}
</div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
