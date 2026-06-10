import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Puce, Department, SubNode, Manager } from '../types';
import { Download, Printer, Filter, Smartphone, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

interface PuceReportsTabProps {
  puces: Puce[];
  departments: Department[];
  subNodes: SubNode[];
  managers: Manager[];
}

const CONTRACT_COLORS: Record<string, string> = {
  TC: 'bg-red-100 text-red-700 border-red-200',
  LX: 'bg-blue-100 text-blue-700 border-blue-200',
  PL: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function PuceReportsTab({ puces, departments, subNodes, managers }: PuceReportsTabProps) {
  const { t } = useTranslation();

  const [selectedContract,     setSelectedContract]     = useState<string>('ALL');
  const [selectedNodeCompany,  setSelectedNodeCompany]  = useState<string>('ALL');
  const [selectedDept,         setSelectedDept]         = useState<string>('ALL');
  const [selectedStatus,       setSelectedStatus]       = useState<string>('ALL');
  const [selectedAssignment,   setSelectedAssignment]   = useState<string>('ALL'); // ALL | ASSIGNED | VIERGE
  const [searchTerm,           setSearchTerm]           = useState<string>('');
  const [exportingCSV,         setExportingCSV]         = useState(false);
  const [exportingPDF,         setExportingPDF]         = useState(false);

  const filteredPuces = useMemo(() => {
    return puces.filter(p => {
      const subNode = p.assignedNodeId ? subNodes.find(s => s.id === p.assignedNodeId) : null;
      const manager = subNode ? managers.find(m => m.id === subNode.managerId) : null;

      const matchContract    = selectedContract    === 'ALL' || p.contractCompany === selectedContract;
      const matchNodeCompany = selectedNodeCompany === 'ALL' || (manager && manager.company === selectedNodeCompany);
      const matchDept        = selectedDept        === 'ALL' || (manager && manager.departmentId === selectedDept);
      const matchStatus      = selectedStatus      === 'ALL' || p.status === selectedStatus;
      const matchAssignment  =
        selectedAssignment === 'ALL'      ? true :
        selectedAssignment === 'VIERGE'   ? !p.assignedNodeId :
        selectedAssignment === 'ASSIGNED' ? !!p.assignedNodeId :
        true;

      const text = `${p.serialNumber} ${p.phoneNumber} ${p.pukCode} ${subNode?.name ?? ''}`.toLowerCase();
      const matchSearch = text.includes(searchTerm.toLowerCase());

      return matchContract && matchNodeCompany && matchDept && matchStatus && matchAssignment && matchSearch;
    });
  }, [puces, subNodes, managers, selectedContract, selectedNodeCompany, selectedDept, selectedStatus, selectedAssignment, searchTerm]);

  const stats = useMemo(() => {
    const totalCount    = filteredPuces.length;
    const totalCredit   = filteredPuces.reduce((acc, p) => acc + Number(p.monthlyCredit), 0);
    const active        = filteredPuces.filter(p => p.status === 'Active').length;
    const suspended     = filteredPuces.filter(p => p.status === 'Suspended').length;
    const vierge        = filteredPuces.filter(p => !p.assignedNodeId).length;
    const creditByContract = {
      TC: filteredPuces.filter(p => p.contractCompany === 'TC').reduce((acc, p) => acc + Number(p.monthlyCredit), 0),
      LX: filteredPuces.filter(p => p.contractCompany === 'LX').reduce((acc, p) => acc + Number(p.monthlyCredit), 0),
      PL: filteredPuces.filter(p => p.contractCompany === 'PL').reduce((acc, p) => acc + Number(p.monthlyCredit), 0),
    };
    return { totalCount, totalCredit, active, suspended, vierge, creditByContract };
  }, [filteredPuces]);

  const viergeCount = useMemo(() => puces.filter(p => !p.assignedNodeId).length, [puces]);

  const handleCSVExport = () => {
    setExportingCSV(true);
    setTimeout(() => {
      try {
        const data = filteredPuces.map(p => {
          const subNode = p.assignedNodeId ? subNodes.find(s => s.id === p.assignedNodeId) : null;
          const manager = subNode ? managers.find(m => m.id === subNode.managerId) : null;
          const dept    = manager ? departments.find(d => d.id === manager.departmentId) : null;
          return {
            Serial_Number:    p.serialNumber,
            Phone_Number:     p.phoneNumber,
            PUK_Code:         p.pukCode,
            Monthly_Credit:   p.monthlyCredit,
            Status:           p.status,
            Assignment:       p.assignedNodeId ? 'Assigned' : 'Vierge (unassigned)',
            Contract_Company: p.contractCompany,
            Used_By_Company:  manager?.company ?? '—',
            Sub_Node:         subNode?.name ?? '—',
            Department:       dept?.name ?? '—',
          };
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        worksheet['!cols'] = [
          { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
          { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 25 }, { wch: 25 },
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Puces Report');
        XLSX.writeFile(workbook, `Puces_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
      } finally {
        setExportingCSV(false);
      }
    }, 300);
  };

  const handlePDFExport = () => {
    setExportingPDF(true);
    const styleId = 'report-print-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @media print {
          body * { visibility: hidden; }
          #report-print-root, #report-print-root * { visibility: visible; }
          #report-print-root { position: absolute; left: 0; top: 0; width: 100%; background: white; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `;
      document.head.appendChild(style);
    }
    setTimeout(() => { setExportingPDF(false); window.print(); }, 300);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-1">

      {/* ── Vierge alert banner — only shown when unassigned puces exist ── */}
      {viergeCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 font-semibold">
            <span className="font-black">{viergeCount} puce{viergeCount > 1 ? 's' : ''} Non affectée{viergeCount > 1 ? 's' : ''}</span>
            {' '}non affectée{viergeCount > 1 ? 's' : ''} — cliquez sur{' '}
            <button
              onClick={() => setSelectedAssignment('VIERGE')}
              className="underline underline-offset-2 cursor-pointer hover:text-amber-900 transition-colors"
            >
              Afficher les Non affectées
            </button>
            {' '}ou assignez-les depuis User & Infrastructure.
          </p>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">

        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-4 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Total</span>
          <span className="text-2xl font-black text-slate-950 leading-none">{stats.totalCount}</span>
          <span className="text-[10px] text-[#86868B]">SIM cards</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-4 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Crédit / mois</span>
          <span className="text-xl font-black text-slate-950 leading-none">{stats.totalCredit.toLocaleString('fr-FR')}</span>
          <span className="text-[10px] text-[#86868B]">DA total</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-4 shadow-sm flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Statut</span>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#34C759]/8 border border-[#34C759]/20 rounded-xl py-1.5 text-center">
              <span className="text-sm font-black text-[#34C759] block leading-none">{stats.active}</span>
              <span className="text-[9px] text-[#34C759] font-bold uppercase">Actif</span>
            </div>
            <div className="flex-1 bg-[#FF9500]/8 border border-[#FF9500]/20 rounded-xl py-1.5 text-center">
              <span className="text-sm font-black text-[#FF9500] block leading-none">{stats.suspended}</span>
              <span className="text-[9px] text-[#FF9500] font-bold uppercase">Suspendu</span>
            </div>
          </div>
        </div>

        {/* Vierge card — amber */}
        <div
          className={`rounded-2xl border p-4 shadow-sm flex flex-col gap-1 cursor-pointer transition-all ${
            stats.vierge > 0
              ? 'bg-amber-50 border-amber-200 hover:bg-amber-100/60'
              : 'bg-white border-[#D2D2D7]'
          }`}
          onClick={() => stats.vierge > 0 && setSelectedAssignment(selectedAssignment === 'VIERGE' ? 'ALL' : 'VIERGE')}
          title={stats.vierge > 0 ? 'Cliquer pour filtrer les puces Non affectée' : ''}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider ${stats.vierge > 0 ? 'text-amber-700' : 'text-[#86868B]'}`}>
            Non affectées
          </span>
          <span className={`text-2xl font-black leading-none ${stats.vierge > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
            {stats.vierge}
          </span>
          <span className={`text-[10px] ${stats.vierge > 0 ? 'text-amber-600 font-semibold' : 'text-[#86868B]'}`}>
            {stats.vierge > 0 ? 'non affectée(s)' : 'toutes affectées ✓'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-4 shadow-sm flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Par contrat</span>
          {(['TC', 'LX', 'PL'] as const).map(co => (
            <div key={co} className="flex items-center justify-between">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${CONTRACT_COLORS[co]}`}>{co}</span>
              <span className="text-[11px] font-black text-slate-800">
                {stats.creditByContract[co].toLocaleString('fr-FR')}
                <span className="text-[9px] font-normal text-[#86868B] ml-0.5">DA</span>
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* ── Table panel ── */}
      <div id="report-print-root" className="bg-white rounded-2xl border border-[#D2D2D7] shadow-sm overflow-hidden">

        {/* Print title */}
        <div className="hidden print:block p-5 border-b border-[#D2D2D7]">
          <h1 className="text-lg font-bold text-[#1D1D1F]">Rapport Puces (SIM Cards)</h1>
          <p className="text-xs text-[#86868B] mt-0.5">
            {filteredPuces.length} puce(s) — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Controls */}
        <div className="no-print p-5 border-b border-[#F5F5F7] bg-[#F5F5F7]/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#86868B]" />
              <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">{t('configure_sheet_report_filters')}</h4>
              {(selectedContract !== 'ALL' || selectedNodeCompany !== 'ALL' || selectedDept !== 'ALL' || selectedStatus !== 'ALL' || selectedAssignment !== 'ALL') && (
                <button
                  onClick={() => { setSelectedContract('ALL'); setSelectedNodeCompany('ALL'); setSelectedDept('ALL'); setSelectedStatus('ALL'); setSelectedAssignment('ALL'); setSearchTerm(''); }}
                  className="text-[10px] text-[#FF1E1E] font-bold hover:underline cursor-pointer"
                >
                  Effacer filtres
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCSVExport} disabled={exportingCSV}
                className="px-4 py-2 bg-white hover:bg-[#F5F5F7] border border-[#D2D2D7] text-[#1D1D1F] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60">
                {exportingCSV ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {t('export_csv')}
              </button>
              <button onClick={handlePDFExport} disabled={exportingPDF}
                className="px-4 py-2 bg-[#FF1E1E] hover:bg-[#E01B1B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60">
                {exportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                {t('print_report')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">Recherche</label>
              <input type="text" placeholder="S/N, Tél, PUK..."
                className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* Assignment filter — the key new filter */}
            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">Affectation</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)}>
                <option value="ALL">Toutes</option>
                <option value="ASSIGNED">Affectées</option>
                <option value="VIERGE">⚠ Non affectée uniquement</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">Contrat Ooredoo</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedContract} onChange={(e) => setSelectedContract(e.target.value)}>
                <option value="ALL">Tous</option>
                <option value="TC">TC — TECHNOCERAM</option>
                <option value="LX">LX — LUXETILE</option>
                <option value="PL">PL — PORCELENDA</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">Utilisé par</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedNodeCompany} onChange={(e) => setSelectedNodeCompany(e.target.value)}>
                <option value="ALL">Toutes entités</option>
                <option value="TC">TC</option>
                <option value="LX">LX</option>
                <option value="PL">PL</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">{t('department')}</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                <option value="ALL">Tous</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">Statut</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="ALL">Tous</option>
                <option value="Active">Actif</option>
                <option value="Suspended">Suspendu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#D2D2D7] text-[10px] font-bold text-[#86868B] uppercase tracking-wider">
                <th className="py-3 px-4">Affectation</th>
                <th className="py-3 px-4">S/N</th>
                <th className="py-3 px-4">N° Tél</th>
                <th className="py-3 px-4">PUK</th>
                <th className="py-3 px-4">Crédit/mois</th>
                <th className="py-3 px-4">Contrat</th>
                <th className="py-3 px-4">Location / Desk</th>
                <th className="py-3 px-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7] text-xs text-[#424245]">
              {filteredPuces.length > 0 ? filteredPuces.map((p) => {
                const isVierge  = !p.assignedNodeId;
                const subNode   = !isVierge ? subNodes.find(s => s.id === p.assignedNodeId) : null;
                const manager   = subNode ? managers.find(m => m.id === subNode.managerId) : null;
                const crossComp = manager && manager.company !== p.contractCompany;

                return (
                  <tr key={p.id}
                    className={`transition-colors ${isVierge ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-[#F5F5F7]/30'}`}>

                    {/* Affectation column */}
                    <td className="py-3 px-4">
                      {isVierge ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wide">
                          <AlertTriangle className="w-2.5 h-2.5" />Non Affectée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wide">
                          <Smartphone className="w-2.5 h-2.5" />Affectée
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[#1D1D1F] tracking-wider text-[11px]">{p.serialNumber}</td>
                    <td className="py-3 px-4 font-semibold text-[#1D1D1F]">{p.phoneNumber}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{p.pukCode}</td>

                    <td className="py-3 px-4 font-bold text-[#1D1D1F]">
                      {Number(p.monthlyCredit).toLocaleString('fr-FR')}
                      <span className="font-normal text-[#86868B] ml-0.5 text-[10px]">DA</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border w-fit ${CONTRACT_COLORS[p.contractCompany] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {p.contractCompany}
                        </span>
                        {crossComp && (
                          <span className="text-[9px] text-amber-600 font-semibold">⚡ Utilisé par {manager.company}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isVierge ? (
                        <span className="italic text-amber-500 text-[11px] font-semibold">Non affectée</span>
                      ) : subNode ? (
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            subNode.type === 'Office'  ? 'bg-blue-400' :
                            subNode.type === 'Person'  ? 'bg-purple-400' :
                            subNode.type === 'Cabinet' ? 'bg-amber-400' : 'bg-slate-400'
                          }`} />
                          {subNode.name}
                        </span>
                      ) : (
                        <span className="text-[#86868B]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          p.status === 'Active'    ? 'bg-[#34C759]/10 text-[#34C759]' :
                          p.status === 'Suspended' ? 'bg-[#FF9500]/10 text-[#FF9500]' :
                          'bg-[#86868B]/10 text-[#86868B]'
                        }`}>
                          {p.status === 'Active' ? 'Actif' : 'Suspendu'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#86868B]">
                    <div className="space-y-1">
                      <AlertCircle className="w-8 h-8 text-[#86868B]/40 mx-auto" />
                      <p className="font-semibold text-[#1D1D1F] text-xs">Aucune puce ne correspond aux filtres</p>
                      <p className="text-[11px]">Essayez d'ajuster les critères de recherche</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer total row */}
            {filteredPuces.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t border-[#D2D2D7] text-xs font-black text-slate-700">
                  <td colSpan={4} className="py-3 px-4 uppercase tracking-wider text-[10px] text-slate-500">
                    {filteredPuces.length} puce(s) affichée(s)
                    {stats.vierge > 0 && (
                      <span className="ml-2 text-amber-600">• {stats.vierge} Non affectée{stats.vierge > 1 ? 's' : ''}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#1D1D1F]">
                    {stats.totalCredit.toLocaleString('fr-FR')}
                    <span className="font-normal text-[10px] text-slate-500 ml-0.5">DA</span>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
