import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';


import type {
  Department,
  Manager,
  SubNode,
  Material,
  Puce
} from './types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_MANAGERS,
  INITIAL_SUB_NODES,
  INITIAL_MATERIALS
} from './data.ts';
import Sidebar from './components/SideBar';
import PortalView from './components/PortalView';
import QrScannerTab from './components/QrScannerTab.tsx';
import ReportsTab from './components/ReportsTab';
import PuceReportsTab from './components/PuceReportsTab';
import ManagementTab from './components/ManagementTab';
import LoginPage from './components/LoginPage.tsx';
import { RefreshCw, HelpCircle, UserCheck, ShieldAlert, Heart, Calendar, LogOut } from 'lucide-react';

export default function App() {
  const { t, i18n } = useTranslation();
  const [authenticatedUserEmail, setAuthenticatedUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('erp_authenticated_user') || null;
  });

  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    dbName: string | null;
    fallback: boolean;
    error: string | null;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers,    setManagers]    = useState<Manager[]>([]);
  const [subNodes,    setSubNodes]    = useState<SubNode[]>([]);
  const [materials,   setMaterials]   = useState<Material[]>([]);
  const [puces,       setPuces]       = useState<Puce[]>([]);

  const [selectedDeptId,    setSelectedDeptId]    = useState<string>('');
  const [selectedUtility,   setSelectedUtility]   = useState<'portal' | 'scanner' | 'management' | 'reports' | 'puce_reports'>('portal');
  const [selectedAssetFromScanner, setSelectedAssetFromScanner] = useState<Material | null>(null);
  const [showResetConfirm,  setShowResetConfirm]  = useState(false);

  // ── Core sync: fetch all state from backend ──────────────────────────────
  const syncDatabaseState = async () => {
    try {
      setIsLoading(true);
      const statusRes = await fetch('/api/db-status');
      const statusData = await statusRes.json();
      setDbStatus(statusData);

      const [deptRes, mngRes, nodeRes, matRes, puceRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/managers'),
        fetch('/api/subnodes'),
        fetch('/api/materials'),
        fetch('/api/puces'),
      ]);

      const [depts, mngs, nodes, mats, puceRows] = await Promise.all([
        deptRes.json(),
        mngRes.json(),
        nodeRes.json(),
        matRes.json(),
        puceRes.json(),
      ]);

      setDepartments(Array.isArray(depts) ? depts : []);
      setManagers(   Array.isArray(mngs)  ? mngs  : []);
      setSubNodes(   Array.isArray(nodes) ? nodes : []);
      setMaterials(  Array.isArray(mats)  ? mats  : []);
      setPuces(      Array.isArray(puceRows) ? puceRows : []);

      if (Array.isArray(depts) && depts.length > 0) {
        const exists = depts.some((d: any) => d.id === selectedDeptId);
        if (!exists || !selectedDeptId) setSelectedDeptId(depts[0].id);
      } else {
        setSelectedDeptId('');
        setSelectedUtility('management');
      }
    } catch (err) {
      console.error('Failed to sync state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authenticatedUserEmail) syncDatabaseState();
  }, [authenticatedUserEmail]);

  // ── DB Reset handlers ─────────────────────────────────────────────────────
  const handleRestoreDefaults = () => setShowResetConfirm(true);

  const executeClearDatabaseNew = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/clean-db', { method: 'POST' });
      setDepartments([]);
      setManagers([]);
      setSubNodes([]);
      setMaterials([]);
      setPuces([]);
      setSelectedDeptId('');
      setSelectedUtility('management');
      setSelectedAssetFromScanner(null);
      setShowResetConfirm(false);
      const statusRes = await fetch('/api/db-status');
      setDbStatus(await statusRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeRestoreMockSamples = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/clean-db', { method: 'POST' });

      // Sequential seeding respects FK order: departments → managers → subnodes → materials
      for (const d of INITIAL_DEPARTMENTS) {
        await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d),
        });
      }
      for (const m of INITIAL_MANAGERS) {
        await fetch('/api/managers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(m),
        });
      }
      for (const s of INITIAL_SUB_NODES) {
        await fetch('/api/subnodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s),
        });
      }
      for (const mat of INITIAL_MATERIALS) {
        await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mat),
        });
      }

      await syncDatabaseState();
      setShowResetConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── CRUD handlers — await DB confirmation BEFORE updating UI ─────────────
  // This prevents FK violations where a child is created before its parent
  // is confirmed to exist in the database.

  const handleAddDepartment = async (newDept: Department) => {
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/departments failed (${res.status}): ${text}`);
      }
      const saved = await res.json();
      setDepartments(prev => [...prev, saved]);
    } catch (err) {
      console.error('Failed to create department:', err);
      await syncDatabaseState();
    }
  };

  const handleUpdateDepartment = async (id: string, updated: Department) => {
    setDepartments(prev => prev.map(d => d.id === id ? updated : d));
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/departments failed (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error('Failed to update department:', err);
      await syncDatabaseState();
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    const affectedManagerIds = managers.filter(m => m.departmentId === id).map(m => m.id);
    setManagers(prev => prev.filter(m => m.departmentId !== id));
    const affectedSubNodeIds = subNodes.filter(n => affectedManagerIds.includes(n.managerId)).map(n => n.id);
    setSubNodes(prev => prev.filter(n => !affectedManagerIds.includes(n.managerId)));
    setMaterials(prev => prev.filter(m => !affectedSubNodeIds.includes(m.assignedNodeId)));
    setPuces(prev => prev.filter(p => !affectedSubNodeIds.includes(p.assignedNodeId)));
    try {
      await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete department:', err);
      await syncDatabaseState();
    }
  };

  // FIX: await DB save before adding to UI state so children can safely reference this manager
  const handleAddManager = async (newManager: Manager) => {
    try {
      const res = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newManager),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/managers failed (${res.status}): ${text}`);
      }
      const saved = await res.json();
      setManagers(prev => [...prev, saved]);
    } catch (err) {
      console.error('Failed to create manager:', err);
      await syncDatabaseState();
    }
  };

  const handleUpdateManager = async (id: string, updated: Manager) => {
    setManagers(prev => prev.map(m => m.id === id ? updated : m));
    try {
      const res = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/managers failed (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error('Failed to update manager:', err);
      await syncDatabaseState();
    }
  };

  const handleDeleteManager = async (id: string) => {
    setManagers(prev => prev.filter(m => m.id !== id));
    const affectedSubNodeIds = subNodes.filter(n => n.managerId === id).map(n => n.id);
    setSubNodes(prev => prev.filter(n => n.managerId !== id));
    setMaterials(prev => prev.filter(m => !affectedSubNodeIds.includes(m.assignedNodeId)));
    setPuces(prev => prev.filter(p => !affectedSubNodeIds.includes(p.assignedNodeId)));
    try {
      await fetch(`/api/managers/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete manager:', err);
      await syncDatabaseState();
    }
  };

  // FIX: await DB save before adding to UI state so materials can safely reference this subnode
  const handleAddSubNode = async (newNode: SubNode) => {
    try {
      const res = await fetch('/api/subnodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/subnodes failed (${res.status}): ${text}`);
      }
      const saved = await res.json();
      setSubNodes(prev => [...prev, saved]);
    } catch (err) {
      console.error('Failed to create subnode:', err);
      await syncDatabaseState();
    }
  };

  const handleUpdateSubNode = async (id: string, updated: SubNode) => {
    setSubNodes(prev => prev.map(n => n.id === id ? updated : n));
    try {
      const res = await fetch('/api/subnodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/subnodes failed (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error('Failed to update subnode:', err);
      await syncDatabaseState();
    }
  };

  const handleDeleteSubNode = async (id: string) => {
    setSubNodes(prev => prev.filter(n => n.id !== id));
    setMaterials(prev => prev.filter(m => m.assignedNodeId !== id));
    setPuces(prev => prev.filter(p => p.assignedNodeId !== id));
    try {
      const res = await fetch(`/api/subnodes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`DELETE /api/subnodes failed (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error('Failed to delete subnode:', err);
      await syncDatabaseState();
    }
  };

  const handleAddMaterial = async (newMaterial: Material) => {
    try {
      const payload = { ...newMaterial, deptNum: newMaterial.deptNum || '10' };
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/materials failed (${res.status}): ${text}`);
      }
      const saved = await res.json();
      setMaterials(prev => [...prev, saved]);
    } catch (err) {
      console.error('Failed to create material:', err);
      await syncDatabaseState();
    }
  };

  const handleUpdateMaterial = async (id: string, updated: Material) => {
    setMaterials(prev => prev.map(m => m.id === id ? updated : m));
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/materials failed (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error('Failed to update material:', err);
      await syncDatabaseState();
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    try {
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`DELETE /api/materials failed (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error('Failed to delete material:', err);
      await syncDatabaseState();
    }
  };

  const handleAddPuce = async (newPuce: Puce) => {
    try {
      const res = await fetch('/api/puces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPuce),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/puces failed (${res.status}): ${text}`);
      }
      const saved = await res.json();
      setPuces(prev => [...prev, saved]);
    } catch (err) {
      console.error('Failed to create puce:', err);
      await syncDatabaseState();
    }
  };

  const handleUpdatePuce = async (id: string, updated: Puce) => {
    setPuces(prev => prev.map(p => p.id === id ? updated : p));
    try {
      const res = await fetch('/api/puces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/puces failed (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error('Failed to update puce:', err);
      await syncDatabaseState();
    }
  };

  const handleDeletePuce = async (id: string) => {
    setPuces(prev => prev.filter(p => p.id !== id));
    try {
      const res = await fetch(`/api/puces/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`DELETE /api/puces failed (${res.status}): ${text}`);
      }
    } catch (err) {
      console.error('Failed to delete puce:', err);
      await syncDatabaseState();
    }
  };

  // ── Derived state & helpers ───────────────────────────────────────────────
  const selectedDeptObj = departments.find(d => d.id === selectedDeptId) || departments[0];

  const handleInspectAssetFromScanner = (mat: Material) => {
    const targetNode = subNodes.find(n => n.id === mat.assignedNodeId);
    if (targetNode) {
      const associatedManager = managers.find(m => m.id === targetNode.managerId);
      if (associatedManager) setSelectedDeptId(associatedManager.departmentId);
    }
    setSelectedAssetFromScanner(mat);
    setSelectedUtility('portal');
  };

  if (!authenticatedUserEmail) {
    return (
      <LoginPage
        onLoginSuccess={(email) => {
          setAuthenticatedUserEmail(email);
          localStorage.setItem('erp_authenticated_user', email);
        }}
        defaultEmail="ayalounis679@gmail.com"
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F5F5F7] font-sans antialiased text-[#1D1D1F]">

      <Sidebar
        departments={departments}
        selectedDeptId={selectedDeptId}
        onSelectDept={setSelectedDeptId}
        selectedUtility={selectedUtility}
        onSelectUtility={setSelectedUtility}
      />

      <div className="flex-1 flex flex-col min-w-0">

        <header className="bg-white/80 backdrop-blur-md border-b border-[#D2D2D7] h-16 px-6 flex items-center justify-between sticky top-0 z-30 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-[#D2D2D7] text-white text-xs font-bold font-mono">
              {authenticatedUserEmail.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[#1D1D1F] leading-none">{t('workspace_active')}</p>
              <p className="text-[10px] text-[#86868B] font-medium mt-0.5">{authenticatedUserEmail}</p>
            </div>
          </div>

          {dbStatus && (
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${
              dbStatus.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-[#FF1E1E] animate-pulse'}`} />
              <span className="font-semibold text-[10px] tracking-wide uppercase">
                {dbStatus.connected ? `PostgreSQL Connected: ${dbStatus.dbName}` : 'Postgres Offline: Memory fall-back'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F7] text-[10px] font-mono font-medium text-[#86868B] border border-[#D2D2D7]/50">
              <Calendar className="w-3.5 h-3.5 text-[#86868B]" />
              <span>{t('system_clock')}: {new Date().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </span>

            {/* Global Dashboard Language Switcher */}
            <div className="flex items-center gap-1 bg-[#F5F5F7] border border-[#D2D2D7]/50 rounded-lg p-0.5">
              {(['en', 'fr', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all uppercase cursor-pointer ${
                    i18n.language === lang
                      ? 'bg-slate-950 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-slate-900'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setAuthenticatedUserEmail(null);
                localStorage.removeItem('erp_authenticated_user');
              }}
              className="px-3 py-1.5 bg-slate-900 border border-transparent hover:bg-slate-800 text-white rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              title="Terminate Secure Session"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FF1E1E]" />
              <span className="hidden sm:inline text-[11px]">{t('sign_out')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto workspace-scroll">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
              <p className="text-xs text-neutral-500 font-mono tracking-wider uppercase font-semibold">Synchronizing with PostgreSQL Database...</p>
            </div>
          ) : selectedUtility === 'portal' && selectedDeptObj ? (
            <PortalView
  selectedDept={selectedDeptObj}
  managers={managers}
  subNodes={subNodes}
  materials={materials}
  onSelectMaterial={handleInspectAssetFromScanner}
  selectedAssetFromScanner={selectedAssetFromScanner}
  onClearSelectedAssetScanner={() => setSelectedAssetFromScanner(null)}
  onAddManager={handleAddManager}
  onAddSubNode={handleAddSubNode}
  onAddMaterial={handleAddMaterial}
  onDeleteMaterial={handleDeleteMaterial}
  onUpdateMaterial={handleUpdateMaterial}
  onUpdateSubNode={handleUpdateSubNode}
  departments={departments}
  puces={puces}
  onAddPuce={handleAddPuce}
  onDeletePuce={handleDeletePuce}
  onUpdatePuce={handleUpdatePuce}
/>
          ) : selectedUtility === 'portal' ? (
            <div className="flex flex-col items-center justify-center h-96 p-6 border border-dashed border-red-200/50 rounded-3xl bg-white/70 max-w-xl mx-auto text-center shadow-xs">
              <ShieldAlert className="w-12 h-12 text-red-500 opacity-80 mb-4" />
              <h3 className="text-base font-black text-slate-950 uppercase tracking-[0.12em] font-display">No registered departments</h3>
              <p className="text-xs text-neutral-500 leading-relaxed mt-2 max-w-sm">
                To start tracking resources, please register an active department from the <strong>User & Infrastructure Control Tab</strong>.
              </p>
              <button
                onClick={() => setSelectedUtility('management')}
                className="mt-5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
              >
                Go to Controls Panel
              </button>
            </div>
          ) : null}

          {!isLoading && selectedUtility === 'scanner' && (
            <QrScannerTab
              materials={materials}
              onSelectMaterial={handleInspectAssetFromScanner}
            />
          )}

          {!isLoading && selectedUtility === 'management' && (
            <ManagementTab
              departments={departments}
              managers={managers}
              subNodes={subNodes}
              materials={materials}
              puces={puces}
              onAddDepartment={handleAddDepartment}
              onAddManager={handleAddManager}
              onAddSubNode={handleAddSubNode}
              onAddMaterial={handleAddMaterial}
              onAddPuce={handleAddPuce}
              onDeleteMaterial={handleDeleteMaterial}
              onDeletePuce={handleDeletePuce}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onUpdateManager={handleUpdateManager}
              onDeleteManager={handleDeleteManager}
              onUpdateSubNode={handleUpdateSubNode}
              onDeleteSubNode={handleDeleteSubNode}
              onUpdateMaterial={handleUpdateMaterial}
              onUpdatePuce={handleUpdatePuce}
            />
          )}

          {!isLoading && selectedUtility === 'reports' && (
            <ReportsTab
              materials={materials}
              departments={departments}
            />
          )}

          {!isLoading && selectedUtility === 'puce_reports' && (
            <PuceReportsTab
              puces={puces}
              departments={departments}
              subNodes={subNodes}
              managers={managers}
            />
          )}
        </main>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-lg bg-black border border-red-900/50 rounded-2xl p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(255,30,30,0.15)] overflow-hidden text-white"
            >
              <div className="absolute top-0 left-0 right-0 h-0.75 bg-red-600" />
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.15em] font-display">Configure Database State</h3>
                    <p className="text-[10px] text-red-500 font-mono tracking-wider uppercase font-semibold">Control Protocol • Active Schema</p>
                  </div>
                </div>
                <div className="text-xs text-neutral-300 leading-relaxed space-y-3 border-y border-neutral-900 py-4">
                  <p>Select the preferred state initialization pattern for your current database (<strong>{dbStatus?.dbName || 'inventory'}</strong>):</p>
                  <div className="space-y-2 mt-2">
                    <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl">
                      <h4 className="text-[#FF1E1E] font-black uppercase tracking-wider text-[10px]">Pattern A • Complete Clean slate</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">Truncates all rows from every table. Fresh canvas for new configurations.</p>
                    </div>
                    <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl">
                      <h4 className="text-blue-400 font-black uppercase tracking-wider text-[10px]">Pattern B • Seeding Demo configuration</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">Empties tables then populates demo departments, managers, and materials for full structural walkthroughs.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button type="button" onClick={() => setShowResetConfirm(false)}
                    className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer text-center">
                    Cancel
                  </button>
                  <button type="button" onClick={executeClearDatabaseNew}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-[0_4px_12px_rgba(255,30,30,0.2)] text-center">
                    Wipe Slate
                  </button>
                  <button type="button" onClick={executeRestoreMockSamples}
                    className="py-2.5 px-3 bg-neutral-800 hover:bg-[#1D1D20] text-white border border-neutral-700 rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer text-center">
                    Seed Demo Items
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
