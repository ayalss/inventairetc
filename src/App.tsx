import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import type {
  Department,
  Manager,
  SubNode,
  Material
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
import ManagementTab from './components/ManagementTab';
import LoginPage from './components/LoginPage.tsx';
import { RefreshCw, HelpCircle, UserCheck, ShieldAlert, Heart, Calendar, LogOut } from 'lucide-react';

export default function App() {
  // Session Authentication state
  const [authenticatedUserEmail, setAuthenticatedUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('erp_authenticated_user') || null;
  });

  // Database status and Sync Manager
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    dbName: string | null;
    fallback: boolean;
    error: string | null;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [subNodes, setSubNodes] = useState<SubNode[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Navigation utilities state
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedUtility, setSelectedUtility] = useState<'portal' | 'scanner' | 'management' | 'reports'>('portal');

  // Scanner Redirect Reference (Let redirect scanner action load target materials in modal)
  const [selectedAssetFromScanner, setSelectedAssetFromScanner] = useState<Material | null>(null);

  // Fetch full state from backend
  const syncDatabaseState = async () => {
    try {
      setIsLoading(true);
      const statusRes = await fetch('/api/db-status');
      const statusData = await statusRes.json();
      setDbStatus(statusData);

      const [deptRes, mngRes, nodeRes, matRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/managers'),
        fetch('/api/subnodes'),
        fetch('/api/materials')
      ]);

      const [depts, mngs, nodes, mats] = await Promise.all([
  deptRes.json(),
  mngRes.json(),
  nodeRes.json(),
  matRes.json()
]);

setDepartments(Array.isArray(depts) ? depts : []);
setManagers(Array.isArray(mngs) ? mngs : []);
setSubNodes(Array.isArray(nodes) ? nodes : []);
setMaterials(Array.isArray(mats) ? mats : []);


      if (depts.length > 0) {
        // Find matching or default to first
        const exists = depts.some((d: any) => d.id === selectedDeptId);
        if (!exists || !selectedDeptId) {
          setSelectedDeptId(depts[0].id);
        }
      } else {
        setSelectedDeptId('');
        setSelectedUtility('management');
      }
    } catch (err) {
      console.error('Failed to sync PostgreSQL state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authenticatedUserEmail) {
      syncDatabaseState();
    }
  }, [authenticatedUserEmail]);

  // Show clean state reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle DB Resets
  const handleRestoreDefaults = () => {
    setShowResetConfirm(true);
  };

  const executeClearDatabaseNew = async () => {
    try {
      setIsLoading(true);
      await fetch('/api/clean-db', { method: 'POST' });
      setDepartments([]);
      setManagers([]);
      setSubNodes([]);
      setMaterials([]);
      setSelectedDeptId('');
      setSelectedUtility('management');
      setSelectedAssetFromScanner(null);
      setShowResetConfirm(false);
      // Re-fetch status
      const statusRes = await fetch('/api/db-status');
      const statusData = await statusRes.json();
      setDbStatus(statusData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeRestoreMockSamples = async () => {
    try {
      setIsLoading(true);
      // Clean first
      await fetch('/api/clean-db', { method: 'POST' });
      
      // Seed steps sequentially to preserve Foreign Key relationships
      for (const d of INITIAL_DEPARTMENTS) {
        await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d)
        });
      }
      for (const m of INITIAL_MANAGERS) {
        await fetch('/api/managers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(m)
        });
      }
      for (const s of INITIAL_SUB_NODES) {
        await fetch('/api/subnodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s)
        });
      }
      for (const mat of INITIAL_MATERIALS) {
        await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mat)
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

  // State Updaters
  const handleAddDepartment = async (newDept: Department) => {
    setDepartments(prev => [...prev, newDept]);
    try {
      await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept)
      });
    } catch (err) {
      console.error('Failed to create department: ', err);
    }
  };

  const handleUpdateDepartment = async (id: string, updated: Department) => {
    setDepartments(prev => prev.map(d => d.id === id ? updated : d));
    try {
      await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Failed to update department: ', err);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    
    // Cascade delete managers under this dept locally
    const affectedManagers = managers.filter(m => m.departmentId === id);
    const affectedManagerIds = affectedManagers.map(m => m.id);
    setManagers(prev => prev.filter(m => m.departmentId !== id));
    
    // Cascade delete subNodes under those managers locally
    const affectedSubNodes = subNodes.filter(n => affectedManagerIds.includes(n.managerId));
    const affectedSubNodeIds = affectedSubNodes.map(n => n.id);
    setSubNodes(prev => prev.filter(n => !affectedManagerIds.includes(n.managerId)));
    
    // Cascade delete materials assigned to those subNodes locally
    setMaterials(prev => prev.filter(m => !affectedSubNodeIds.includes(m.assignedNodeId)));

    try {
      await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete department: ', err);
    }
  };

  const handleAddManager = async (newManager: Manager) => {
    setManagers(prev => [...prev, newManager]);
    try {
      await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newManager)
      });
    } catch (err) {
      console.error('Failed to create manager: ', err);
    }
  };

  const handleUpdateManager = async (id: string, updated: Manager) => {
    setManagers(prev => prev.map(m => m.id === id ? updated : m));
    try {
      await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Failed to update manager: ', err);
    }
  };

  const handleDeleteManager = async (id: string) => {
    setManagers(prev => prev.filter(m => m.id !== id));
    
    // Cascade delete subNodes belonging to this manager locally
    const affectedSubNodes = subNodes.filter(n => n.managerId === id);
    const affectedSubNodeIds = affectedSubNodes.map(n => n.id);
    setSubNodes(prev => prev.filter(n => n.managerId !== id));
    
    // Cascade delete materials under those subNodes locally
    setMaterials(prev => prev.filter(m => !affectedSubNodeIds.includes(m.assignedNodeId)));

    try {
      await fetch(`/api/managers/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete manager: ', err);
    }
  };

  const handleAddSubNode = async (newNode: SubNode) => {
    setSubNodes(prev => [...prev, newNode]);
    try {
      const res = await fetch('/api/subnodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/subnodes failed (${res.status}): ${text}`);
      }

      // Ensure UI matches DB (especially when fallback is involved)
      await syncDatabaseState();
    } catch (err) {
      console.error('Failed to create subnode: ', err);
      // Re-sync to avoid lying in-memory on failed persistence
      await syncDatabaseState();
    }
  };

  const handleUpdateSubNode = async (id: string, updated: SubNode) => {
    setSubNodes(prev => prev.map(n => n.id === id ? updated : n));
    try {
      const res = await fetch('/api/subnodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST /api/subnodes failed (${res.status}): ${text}`);
      }

      await syncDatabaseState();
    } catch (err) {
      console.error('Failed to update subnode: ', err);
      await syncDatabaseState();
    }
  };

  const handleDeleteSubNode = async (id: string) => {
    setSubNodes(prev => prev.filter(n => n.id !== id));
    // Cascade delete materials assigned to this subNode
    setMaterials(prev => prev.filter(m => m.assignedNodeId !== id));

    try {
      const res = await fetch(`/api/subnodes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`DELETE /api/subnodes failed (${res.status}): ${text}`);
      }

      await syncDatabaseState();
    } catch (err) {
      console.error('Failed to delete subnode: ', err);
      await syncDatabaseState();
    }
  };

const handleAddMaterial = async (newMaterial: Material) => {
  setMaterials(prev => [...prev, newMaterial]);
  try {
    // Ensure dept_num is never empty before sending
    const payload = {
      ...newMaterial,
      deptNum: newMaterial.deptNum || '10', // hard fallback
    };

    console.log('Sending material payload:', payload); // check this in browser console

    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`POST /api/materials failed (${res.status}): ${text}`);
    }
    await syncDatabaseState();
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
      body: JSON.stringify(updated)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`POST /api/materials failed (${res.status}): ${text}`);
    }
    await syncDatabaseState(); // ← also missing here
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
    await syncDatabaseState(); // ← also missing here
  } catch (err) {
    console.error('Failed to delete material:', err);
    await syncDatabaseState();
  }
};

  // Safe Resolver for Active Department object context
  const selectedDeptObj = departments.find(d => d.id === selectedDeptId) || departments[0];

  // Handler passed to scanner tab so that viewing takes user to the department portal
  const handleInspectAssetFromScanner = (mat: Material) => {
    // Find matching sub-node and department
    const targetNode = subNodes.find(n => n.id === mat.assignedNodeId);
    if (targetNode) {
      const associatedManager = managers.find(m => m.id === targetNode.managerId);
      if (associatedManager) {
        setSelectedDeptId(associatedManager.departmentId);
      }
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
      
      {/* SIDEBAR: ERPNext themed sidebar with modules categories */}
      <Sidebar
        departments={departments}
        selectedDeptId={selectedDeptId}
        onSelectDept={setSelectedDeptId}
        selectedUtility={selectedUtility}
        onSelectUtility={setSelectedUtility}
      />

      {/* CORE WORKSPACE PANEL CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP COMPLIANCE Apple Style HEADER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-[#D2D2D7] h-16 px-6 flex items-center justify-between sticky top-0 z-30 select-none">
          {/* User profile / welcome welcome */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-[#D2D2D7] text-white text-xs font-bold font-mono">
              {authenticatedUserEmail.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-[#1D1D1F] leading-none"> Workspace Active</p>
              <p className="text-[10px] text-[#86868B] font-medium mt-0.5">{authenticatedUserEmail}</p>
            </div>
          </div>

          {/* Database connection badge */}
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

          {/* Quick Admin Toggles & metadata */}
          <div className="flex items-center gap-4">
            <span className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F7] text-[10px] font-mono font-medium text-[#86868B] border border-[#D2D2D7]/50">
              <Calendar className="w-3.5 h-3.5 text-[#86868B]" />
              <span>System Clock: {new Date().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </span>



            {/* Logout actions */}
            <button
              onClick={() => {
                setAuthenticatedUserEmail(null);
                localStorage.removeItem('erp_authenticated_user');
              }}
              className="px-3 py-1.5 bg-slate-900 border border-transparent hover:bg-slate-800 text-white rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              title="Terminate Secure Session"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FF1E1E]" />
              <span className="hidden sm:inline text-[11px]">Sign Out</span>
            </button>
          </div>
        </header>

        {/* COMPARTMENT MAIN SCROLL WORKSPACE PANEL */}
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
              departments={departments}
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
              onAddDepartment={handleAddDepartment}
              onAddManager={handleAddManager}
              onAddSubNode={handleAddSubNode}
              onAddMaterial={handleAddMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onUpdateDepartment={handleUpdateDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onUpdateManager={handleUpdateManager}
              onDeleteManager={handleDeleteManager}
              onUpdateSubNode={handleUpdateSubNode}
              onDeleteSubNode={handleDeleteSubNode}
              onUpdateMaterial={handleUpdateMaterial}
            />
          )}

          {!isLoading && selectedUtility === 'reports' && (
            <ReportsTab
              materials={materials}
              departments={departments}
            />
          )}
        </main>

      </div>

      {/* RESTORE CONFIRMATION MODAL - RED, BLACK, WHITE DESIGN */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-fade"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-black border border-red-900/50 rounded-2xl p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(255,30,30,0.15)] overflow-hidden text-white"
            >
              {/* Subtle top red line */}
              <div className="absolute top-0 left-0 right-0 h-0.75 bg-red-600" />

              {/* Decorative radial brand glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.15em] font-display">
                      Configure Database State
                    </h3>
                    <p className="text-[10px] text-red-500 font-mono tracking-wider uppercase font-semibold">
                      Control Protocol • Active Schema
                    </p>
                  </div>
                </div>

                <div className="text-xs text-neutral-300 leading-relaxed space-y-3 border-y border-neutral-900 py-4 font-sans">
                  <p>
                    Select the preferred state initialization pattern for your current database (<strong>{dbStatus?.dbName || 'inventory'}</strong>):
                  </p>
                  
                  <div className="space-y-2 mt-2">
                    <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl">
                      <h4 className="text-[#FF1E1E] font-black uppercase tracking-wider text-[10px]">Pattern A • Complete Clean slate (New canvas)</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">
                        Completely truncates all table rows from your database. All sample data is permanently deleted, giving you a fresh canvas suitable for local PC configurations.
                      </p>
                    </div>

                    <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl">
                      <h4 className="text-blue-400 font-black uppercase tracking-wider text-[10px]">Pattern B • Seeding Demo configuration</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">
                        Empties table rows and populates standard demo IT managers, 5 key departments, and asset materials lists for full structural walkthroughs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeClearDatabaseNew}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-[0_4px_12px_rgba(255,30,30,0.2)] text-center"
                  >
                    Wipe Slate (Wipe All)
                  </button>
                  <button
                    type="button"
                    onClick={executeRestoreMockSamples}
                    className="py-2.5 px-3 bg-neutral-800 hover:bg-[#1D1D20] text-white border border-neutral-700 rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer text-center"
                  >
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
