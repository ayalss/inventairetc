import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Department, Manager, SubNode, Material } from '../types';
import { 
  MapPin, Layers, Server, Laptop, Plus, HelpCircle, UserCheck, 
  ChevronRight, User, X, Check, Mail, Info, Settings, ShieldAlert,
  FileText, Edit, Trash2, ClipboardCheck, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MaterialQrCard from './MaterialQrCard';
import { generateMaterialCodification } from '../data';

interface PortalViewProps {
  selectedDept: Department;
  managers: Manager[];
  subNodes: SubNode[];
  materials: Material[];
  onSelectMaterial: (m: Material) => void;
  selectedAssetFromScanner?: Material | null;
  onClearSelectedAssetScanner?: () => void;
  onAddManager: (manager: Manager) => void;
  onAddSubNode: (subnode: SubNode) => void;
  onAddMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => void;
  onUpdateMaterial: (id: string, updated: Material) => void;
  onUpdateSubNode: (id: string, updated: SubNode) => void;
  departments: Department[];
}

export default function PortalView({
  selectedDept,
  managers,
  subNodes,
  materials,
  onSelectMaterial,
  selectedAssetFromScanner,
  onClearSelectedAssetScanner,
  onAddManager,
  onAddSubNode,
  onAddMaterial,
  onDeleteMaterial,
  onUpdateMaterial,
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

  const [modalMaterial, setModalMaterial] = useState<Material | null>(null);
  const [activeCreationType, setActiveCreationType] = useState<'manager' | 'subnode' | 'material' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // ── Décharge state ──
  const [dechargePreviewMaterials, setDechargePreviewMaterials] = useState<Material[] | null>(null);

  React.useEffect(() => {
    if (selectedAssetFromScanner) {
      setModalMaterial(selectedAssetFromScanner);
      if (onClearSelectedAssetScanner) onClearSelectedAssetScanner();
    }
  }, [selectedAssetFromScanner, onClearSelectedAssetScanner]);

  // ── Form States ──
  const [mngName, setMngName] = useState('');
  const [mngEmail, setMngEmail] = useState('');
  const [mngRole, setMngRole] = useState('');
  const [mngCompany, setMngCompany] = useState<'TC' | 'LX' | 'PL'>('TC');

  const [nodeName, setNodeName] = useState('');
  const [nodeRole, setNodeRole] = useState('');
  const [nodeType, setNodeType] = useState<'Office' | 'Person' | 'Cabinet' | 'Other'>('Person');

  const [matName, setMatName] = useState('');
  const [matType, setMatType] = useState<'Printer' | 'Server' | 'Switch' | 'Desktop' | 'Screen' | 'UPS' | 'Laptop' | 'Mouse' | 'Keyboard' | 'Phone' | 'Cable' | 'Desk Phone' | 'Flash Disque'>('Laptop');
  const [matStatus, setMatStatus] = useState<'Active' | 'Under Repair' | 'In Storage' | 'Retired'>('Active');
  const [matSerial, setMatSerial] = useState('');
  const [matCost, setMatCost] = useState('');
  const [matDate, setMatDate] = useState('');
  const [matNotes, setMatNotes] = useState('');

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
      officeNum: String(managers.length + 1),
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
      officeNum: String(subNodes.length + 1),
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

    const newMaterial: Material = {
      id: `mat-${Date.now()}`,
      name: matName,
      type: matType,
      company: activeManager.company,
      deptNum: resolvedDeptNum,
      officeNum: activeSubNode.officeNum,
      materialNum: materialNum,
      codification: codification,
      status: matStatus,
      serialNumber: matSerial.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      purchaseDate: matDate || undefined,
      cost: Number(matCost) || 0,
      notes: matNotes.trim() || undefined,
      assignedNodeId: activeSubNode.id
    };

    onAddMaterial(newMaterial);
    triggerToast(`${t('hardware_asset_registered')} ${codification}!`);
    setActiveCreationType(null);

    setMatName('');
    setMatSerial('');
    setMatCost('');
    setMatNotes('');
    setMatDate('');
    setMatStatus('Active');
  };

  const handleEditMaterialSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    onUpdateMaterial(editingMaterial.id, editingMaterial);
    triggerToast(`${t('asset_updated_successfully')}`);
    setEditingMaterial(null);
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
                {mat.notes && <p className="whitespace-pre-wrap text-[12.5px] leading-[1.55]">{mat.notes}</p>}
              </div>
            ))}
          </div>
  
          {/* ── Commitment paragraphs ── */}
          <div className="mt-5 text-[13px] leading-[1.7] space-y-3">
            <p>Je reconnais avoir reçu ce matériel en <strong>bon</strong> état de fonctionnement et m'engage à en faire un usage approprié conformément aux politiques de sécurité informatique de l'entreprise.</p>
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
                          className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-5 hover:bg-[#F5F5F7]/50 transition-colors"
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
                              onClick={() => setEditingMaterial({ ...material })}
                              className="p-1.5 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-[#D2D2D7] rounded-lg transition-all cursor-pointer"
                              title={t('edit_asset')}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
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
                              onClick={() => setDechargePreviewMaterials([material])}
                              className="p-1.5 bg-white text-slate-500 hover:text-[#FF1E1E] hover:bg-red-50 border border-[#D2D2D7] rounded-lg transition-all cursor-pointer"
                              title="Bon de Décharge"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setModalMaterial(material)}
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
                    </h3>
                    <p className="text-[10.5px] text-[#86868B] mt-0.5">
                      {activeCreationType === 'manager' && `${t('appoint_responsible_supervisor')} ${selectedDept.name}`}
                      {activeCreationType === 'subnode' && `${t('structural_element_under')} ${activeManager?.name}`}
                      {activeCreationType === 'material' && `${t('individual_it_device_for_desk')} "${activeSubNode?.name}"`}
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
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('asset_model_name')}</label>
                      <input type="text" required placeholder={t('asset_model_name_placeholder')}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-[#D2D2D7]/60 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                        value={matName} onChange={(e) => setMatName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5">{t('asset_category')}</label>
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
                        value={matNotes} onChange={(e) => setMatNotes(e.target.value)} />
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

      {/* ════════ QR MODAL ════════ */}
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

    </div>
  );
}
