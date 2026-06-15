import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Material, Department, SubNode } from '../types';
import { Download, Printer, Filter, Cpu, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

interface ReportsTabProps {
  materials: Material[];
  departments: Department[];
}

const PAGE_SIZE = 20;

export default function ReportsTab({ materials, departments }: ReportsTabProps) {
  const { t } = useTranslation();
  const [subNodes, setSubNodes] = useState<SubNode[]>([]);

  useEffect(() => {
    fetch('/api/subnodes')
      .then(r => r.json())
      .then(data => setSubNodes(Array.isArray(data) ? data : []))
      .catch(() => setSubNodes([]));
  }, []);

  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const filteredMaterials = useMemo(() => {
    setCurrentPage(1); // reset page on any filter change
    return materials.filter(m => {
      const matchCompany = selectedCompany === 'ALL' || m.company === selectedCompany;
      const deptObj = departments.find(d => d.id === selectedDept);
      const matchDept = selectedDept === 'ALL' || (deptObj && m.deptNum === deptObj.deptNum);
      const matchType = selectedType === 'ALL' || m.type === selectedType;
      const matchStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
      const subNode = subNodes.find(s => s.id === m.assignedNodeId);
      const deptName = departments.find(d => d.deptNum === m.deptNum)?.name ?? '';
      const text = `${m.name} ${m.codification} ${m.serialNumber} ${subNode?.name ?? ''} ${deptName}`.toLowerCase();
      const matchSearch = text.includes(searchTerm.toLowerCase());
      return matchCompany && matchDept && matchType && matchStatus && matchSearch;
    });
  }, [materials, departments, subNodes, selectedCompany, selectedDept, selectedType, selectedStatus, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / PAGE_SIZE));

  // Paginated slice for screen display only — print uses filteredMaterials directly
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMaterials.slice(start, start + PAGE_SIZE);
  }, [filteredMaterials, currentPage]);

  const stats = useMemo(() => {
    const totalCount = filteredMaterials.length;
    const totalCost = filteredMaterials.reduce((acc, c) => acc + Number(c.cost), 0);
    const active = filteredMaterials.filter(m => m.status === 'Active').length;
    const repair = filteredMaterials.filter(m => m.status === 'Under Repair').length;
    const storage = filteredMaterials.filter(m => m.status === 'In Storage').length;
    const tcCost = materials.filter(m => m.company === 'TC').reduce((acc, c) => acc + Number(c.cost), 0);
    const lxCost = materials.filter(m => m.company === 'LX').reduce((acc, c) => acc + Number(c.cost), 0);
    const plCost = materials.filter(m => m.company === 'PL').reduce((acc, c) => acc + Number(c.cost), 0);
    const typeCounts: Record<string, number> = {};
    filteredMaterials.forEach(m => { typeCounts[m.type] = (typeCounts[m.type] || 0) + 1; });
    return { totalCount, totalCost, active, repair, storage, companyCost: { TC: tcCost, LX: lxCost, PL: plCost }, typeCounts };
  }, [filteredMaterials, materials]);

  const handleCSVExport = () => {
    setExportingCSV(true);
    setTimeout(() => {
      try {
        const data = filteredMaterials.map(m => {
          const deptName = departments.find(d => d.deptNum === m.deptNum)?.name ?? '—';
          const subNodeName = subNodes.find(s => s.id === m.assignedNodeId)?.name ?? '—';
          return {
            Codification: m.codification,
            Asset_Name: m.name,
            Entity: m.company,
            Department: deptName,
            Sub_Node: subNodeName,
            Serial_Number: m.serialNumber,
            Notes: m.notes || '',
            Status: m.status
          };
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        worksheet['!cols'] = [
          { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 25 },
          { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 15 }
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Report');
        XLSX.writeFile(workbook, `Inventory_Report_${selectedCompany}_${selectedDept}.xlsx`);
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
          #report-print-root {
            position: absolute; left: 0; top: 0; width: 100%; background: white;
          }
          table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 8px;
}

th,
td {
  border: 1px solid #ccc;
  padding: 3px 4px;
  line-height: 1.2;
}
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `;
      document.head.appendChild(style);
    }
    setTimeout(() => {
      setExportingPDF(false);
      window.print();
    }, 300);
  };

  const maxCompanyCost = Math.max(stats.companyCost.TC, stats.companyCost.LX, stats.companyCost.PL) || 1;
  const materialTypes = ['Printer', 'Server', 'Switch', 'Desktop', 'Screen', 'UPS', 'Laptop', 'Mouse', 'Keyboard', 'Phone', 'Cable', 'Desk Phone', 'Flash Disque', 'Other'];

  // Rows rendered: paginatedMaterials on screen, filteredMaterials when printing
  const renderRows = (rows: Material[]) =>
    rows.map((m) => {
      const deptName = departments.find(d => d.deptNum === m.deptNum)?.name ?? '—';
      const subNode = subNodes.find(s => s.id === m.assignedNodeId);
      return (
        <tr key={m.id} className="hover:bg-[#F5F5F7]/30 transition-colors">
          <td className="py-3 px-5 font-mono font-bold text-[#1D1D1F] tracking-wider">{m.codification}</td>
          <td className="py-3 px-4 font-semibold text-[#1D1D1F]">{m.name}</td>
          <td className="py-3 px-4">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono bg-[#F5F5F7] text-[#424245] border border-[#D2D2D7]/40">
              {m.company}
            </span>
          </td>
          <td className="py-3 px-4 font-medium text-[#424245]">{deptName}</td>
          <td className="py-3 px-4 font-medium text-[#424245]">
            {subNode ? (
              <span className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                  subNode.type === 'Office' ? 'bg-blue-400' :
                  subNode.type === 'Person' ? 'bg-purple-400' :
                  subNode.type === 'Cabinet' ? 'bg-amber-400' : 'bg-slate-400'
                }`} />
                {subNode.name}
              </span>
            ) : <span className="text-[#86868B]">—</span>}
          </td>
          <td className="py-3 px-4 font-mono text-[11px] text-[#86868B]">{m.serialNumber}</td>
          <td className="py-3 px-4 text-[11px] text-[#86868B] max-w-50">
            <div className="whitespace-pre-wrap wrap-break-word leading-relaxed">{m.notes ?? '—'}</div>
          </td>
          <td className="py-3 px-4">
            <div className="flex justify-center">
              <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                m.status === 'Active' ? 'bg-[#34C759]/10 text-[#34C759]' :
                m.status === 'Under Repair' ? 'bg-[#FF9500]/10 text-[#FF9500]' :
                m.status === 'In Storage' ? 'bg-[#FF1E1E]/10 text-[#FF1E1E]' :
                'bg-[#86868B]/10 text-[#86868B]'
              }`}>
                {m.status}
              </span>
            </div>
          </td>
        </tr>
      );
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-1">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">{t('audited_elements')}</span>
            <span className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              {stats.totalCount} <span className="text-xs text-[#86868B] font-normal">items</span>
            </span>
            <span className="text-[10px] text-[#86868B] block">{t('across_3_companies')}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-5 shadow-sm flex flex-col justify-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">{t('inventory_status_health')}</span>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#34C759]/10 text-center py-1.5 px-2 rounded-lg border border-[#34C759]/20">
              <span className="text-xs font-bold text-[#34C759] block">{stats.active}</span>
              <span className="text-[9px] font-medium text-[#34C759] uppercase tracking-wide">{t('status_live')}</span>
            </div>
            <div className="bg-[#FF9500]/10 text-center py-1.5 px-2 rounded-lg border border-[#FF9500]/20">
              <span className="text-xs font-bold text-[#FF9500] block">{stats.repair}</span>
              <span className="text-[9px] font-medium text-[#FF9500] uppercase tracking-wide">{t('status_repair')}</span>
            </div>
            <div className="bg-[#FF1E1E]/10 text-center py-1.5 px-2 rounded-lg border border-[#FF1E1E]/20">
              <span className="text-xs font-bold text-[#FF1E1E] block">{stats.storage}</span>
              <span className="text-[9px] font-medium text-[#FF1E1E] uppercase tracking-wide">{t('status_stock')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-5 shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[#1D1D1F] tracking-wider uppercase">{t('it_investments_by_entity')}</h4>
            <p className="text-[11px] text-[#86868B]">{t('total_book_capital_allocation')}</p>
          </div>
          <div className="space-y-4 pt-2">
            {[
              { id: 'TC', label: 'SARL TECHNOCERAM', color: 'bg-[#FF1E1E]', val: stats.companyCost.TC },
              { id: 'LX', label: 'EURL LUXETILE', color: 'bg-slate-900', val: stats.companyCost.LX },
              { id: 'PL', label: 'SARL PORCELENDA', color: 'bg-[#FF9500]', val: stats.companyCost.PL }
            ].map((company) => {
              const pct = (company.val / maxCompanyCost) * 100;
              return (
                <div key={company.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#424245] font-mono">{company.id} <span className="font-sans font-normal text-[#86868B] pr-1">—</span> <span className="font-sans font-medium text-[#86868B]">{company.label}</span></span>
                    <span className="font-bold text-[#1D1D1F] font-mono">{company.val.toLocaleString('fr-FR')} DA</span>
                  </div>
                  <div className="w-full h-2 bg-[#F5F5F7] rounded-full overflow-hidden border border-[#D2D2D7]/40">
                    <div className={`h-full ${company.color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-5 shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[#1D1D1F] tracking-wider uppercase">{t('equipment_type_distribution')}</h4>
            <p className="text-[11px] text-[#86868B]">{t('quantity_layout_hardware_classes')}</p>
          </div>
          <div className="grid grid-cols-4 gap-3 pt-1">
            {materialTypes.map((type) => {
              const count = stats.typeCounts[type] || 0;
              const pct = Math.round((count / (stats.totalCount || 1)) * 100);
              return (
                <div key={type} className="text-center p-2 rounded bg-[#F5F5F7] border border-[#D2D2D7]/50 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#424245] truncate block uppercase">{type}</span>
                  <span className="text-lg font-bold text-[#1D1D1F] font-mono block my-1">{count}</span>
                  <div className="w-full bg-[#D2D2D7] h-1 rounded-full overflow-hidden">
                    <div className="bg-[#FF1E1E] h-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] font-semibold text-[#86868B] block mt-1">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div id="report-print-root" className="bg-white rounded-2xl border border-[#D2D2D7] shadow-sm overflow-hidden">

        {/* Print Title */}
        <div className="hidden print:block p-5 border-b border-[#D2D2D7]">
          <h1 className="text-lg font-bold text-[#1D1D1F]">
            Rapport Inventaire
            {selectedCompany !== 'ALL' && ` — ${selectedCompany}`}
            {selectedDept !== 'ALL' && ` / ${departments.find(d => d.id === selectedDept)?.name ?? ''}`}
            {selectedType !== 'ALL' && ` / ${selectedType}`}
            {selectedStatus !== 'ALL' && ` / ${selectedStatus}`}
          </h1>
          <p className="text-xs text-[#86868B] mt-0.5">
            {filteredMaterials.length} élément(s) — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Controls */}
        <div className="no-print p-5 border-b border-[#F5F5F7] bg-[#F5F5F7]/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#86868B]" />
              <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">{t('configure_sheet_report_filters')}</h4>
            </div>
            <div className="flex items-center gap-2.5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">{t('asset_reference')}</label>
              <input type="text" placeholder={t('search_matching_words')}
                className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 text-[#1D1D1F] placeholder-[#86868B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">{t('company_entity')}</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 text-[#1D1D1F] cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
                <option value="ALL">All Companies (TC, LX, PL)</option>
                <option value="TC">TC (SARL TECHNOCERAM)</option>
                <option value="LX">LX (EURL LUXETILE)</option>
                <option value="PL">PL (SARL PORCELENDA)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">{t('department')}</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 text-[#1D1D1F] cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                <option value="ALL">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name} (#{d.deptNum})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">{t('equipment_type')}</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 text-[#1D1D1F] cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                <option value="ALL">All Equipment Categories</option>
                {materialTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">{t('operational_status')}</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 text-[#1D1D1F] cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="Active">Active (Live in Office)</option>
                <option value="Under Repair">Under Repair</option>
                <option value="In Storage">In Storage (Reserve stock)</option>
                <option value="Retired">Retired / Written-off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Screen table — paginated */}
        <div className="overflow-x-auto print:hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#D2D2D7] text-[10px] font-bold text-[#86868B] uppercase tracking-wider">
                <th className="py-3 px-5">{t('id_codification')}</th>
                <th className="py-3 px-4">{t('asset_name')}</th>
                <th className="py-3 px-4">{t('entity')}</th>
                <th className="py-3 px-4">{t('department_name')}</th>
                <th className="py-3 px-4">{t('utilisateur')}</th>
                <th className="py-3 px-4">{t('serial_number')}</th>
                <th className="py-3 px-4">{t('configuration')}</th>
                <th className="py-3 px-4 text-center">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7] text-xs text-[#424245]">
              {paginatedMaterials.length > 0 ? renderRows(paginatedMaterials) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#86868B]">
                    <div className="space-y-1">
                      <AlertCircle className="w-8 h-8 text-[#86868B]/40 mx-auto" />
                      <p className="font-semibold text-[#1D1D1F]">{t('no_assets_match_filters')}</p>
                      <p className="text-[11px]">{t('refine_filters_above')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Print table — all rows, no pagination bar */}
        <div className="hidden print:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#D2D2D7] text-[10px] font-bold text-[#86868B] uppercase tracking-wider">
                <th className="py-3 px-5">{t('id_codification')}</th>
                <th className="py-3 px-4">{t('asset_name')}</th>
                <th className="py-3 px-4">{t('entity')}</th>
                <th className="py-3 px-4">{t('department_name')}</th>
                <th className="py-3 px-4">{t('utilisateur')}</th>
                <th className="py-3 px-4">{t('serial_number')}</th>
                <th className="py-3 px-4">{t('configuration')}</th>
                <th className="py-3 px-4 text-center">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7] text-xs text-[#424245]">
              {renderRows(filteredMaterials)}
            </tbody>
          </table>
        </div>

        {/* Pagination — screen only */}
        {totalPages > 1 && (
          <div className="no-print flex items-center justify-between px-5 py-3 border-t border-[#F5F5F7] bg-[#F5F5F7]/30">
            <span className="text-[11px] text-[#86868B]">
              Showing <span className="font-semibold text-[#1D1D1F]">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMaterials.length)}</span> of <span className="font-semibold text-[#1D1D1F]">{filteredMaterials.length}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-[#424245] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-[11px] text-[#86868B]">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`min-w-[28px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        currentPage === p
                          ? 'bg-[#FF1E1E] text-white border-[#FF1E1E]'
                          : 'bg-white text-[#424245] border-[#D2D2D7] hover:bg-[#F5F5F7]'
                      }`}>
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-[#424245] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <span className="text-[11px] text-[#86868B]">
              Page <span className="font-semibold text-[#1D1D1F]">{currentPage}</span> of <span className="font-semibold text-[#1D1D1F]">{totalPages}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}