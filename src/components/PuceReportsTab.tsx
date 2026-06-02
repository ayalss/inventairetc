import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Puce, Department, SubNode, Manager } from '../types';
import { Download, Printer, Filter, Smartphone, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

interface PuceReportsTabProps {
  puces: Puce[];
  departments: Department[];
  subNodes: SubNode[];
  managers: Manager[];
}

export default function PuceReportsTab({ puces, departments, subNodes, managers }: PuceReportsTabProps) {
  const { t } = useTranslation();

  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const filteredPuces = useMemo(() => {
    return puces.filter(p => {
      const subNode = subNodes.find(s => s.id === p.assignedNodeId);
      const manager = subNode ? managers.find(m => m.id === subNode.managerId) : null;
      
      const matchCompany = selectedCompany === 'ALL' || (manager && manager.company === selectedCompany);
      const matchDept = selectedDept === 'ALL' || (manager && manager.departmentId === selectedDept);
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const text = `${p.serialNumber} ${p.phoneNumber} ${p.pukCode} ${subNode?.name ?? ''}`.toLowerCase();
      const matchSearch = text.includes(searchTerm.toLowerCase());
      return matchCompany && matchDept && matchStatus && matchSearch;
    });
  }, [puces, subNodes, managers, selectedCompany, selectedDept, departments, selectedStatus, searchTerm]);


  const stats = useMemo(() => {
    const totalCount = filteredPuces.length;
    const totalCredit = filteredPuces.reduce((acc, p) => acc + Number(p.monthlyCredit), 0);
    const active = filteredPuces.filter(p => p.status === 'Active').length;
    const suspended = filteredPuces.filter(p => p.status === 'Suspended').length;
    return { totalCount, totalCredit, active, suspended };
  }, [filteredPuces]);

  const handleCSVExport = () => {
    setExportingCSV(true);

    setTimeout(() => {
      try {
        const data = filteredPuces.map(p => {
          const subNodeName = subNodes.find(s => s.id === p.assignedNodeId)?.name ?? '—';

          return {
            Serial_Number: p.serialNumber,
            Phone_Number: p.phoneNumber,
            PUK_Code: p.pukCode,
            Monthly_Credit: p.monthlyCredit,
            Status: p.status,
            Sub_Node: subNodeName
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);

        // Auto width columns
        worksheet['!cols'] = [
          { wch: 20 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 25 }
        ];

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          'Puces Report'
        );

        XLSX.writeFile(
          workbook,
          `Puces_Report_${selectedCompany}_${selectedDept}.xlsx`
        );

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

          body * {
            visibility: hidden;
          }

          #report-print-root,
          #report-print-root * {
            visibility: visible;
          }

          #report-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }

          th, td {
            border: 1px solid #ccc;
            padding: 6px;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
          }

          .no-print {
            display: none !important;
          }
        }
      `;

      document.head.appendChild(style);
    }

    setTimeout(() => {
      setExportingPDF(false);
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-1">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Puces */}
        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">{t('total_items')}</span>
            <span className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              {stats.totalCount} <span className="text-xs text-[#86868B] font-normal">puces</span>
            </span>
            <span className="text-[10px] text-[#86868B] block">SIM Cards tracked</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Monthly Credit */}
        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">Monthly Credits</span>
            <span className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              {stats.totalCredit.toLocaleString('fr-FR')} <span className="text-xs text-[#86868B] font-normal">DA</span>
            </span>
            <span className="text-[10px] text-[#86868B] block">Total allocation</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Status */}
        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-5 shadow-sm flex flex-col justify-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Puce Status Health</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#34C759]/10 text-center py-1.5 px-2 rounded-lg border border-[#34C759]/20">
              <span className="text-xs font-bold text-[#34C759] block">{stats.active}</span>
              <span className="text-[9px] font-medium text-[#34C759] uppercase tracking-wide">Active</span>
            </div>
            <div className="bg-[#FF9500]/10 text-center py-1.5 px-2 rounded-lg border border-[#FF9500]/20">
              <span className="text-xs font-bold text-[#FF9500] block">{stats.suspended}</span>
              <span className="text-[9px] font-medium text-[#FF9500] uppercase tracking-wide">Suspended</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Sub Nodes Count */}
        <div className="bg-white rounded-2xl border border-[#D2D2D7] p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">Sub Nodes</span>
            <span className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
              {subNodes.length}
            </span>
            <span className="text-[10px] text-[#86868B] block">Assigned locations</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
 id="report-print-root"
 
 className="bg-white rounded-2xl border border-[#D2D2D7] shadow-sm overflow-hidden"
> 
{/* Print Title — only visible when printing */}
<div className="hidden print:block p-5 border-b border-[#D2D2D7]">
  <h1 className="text-lg font-bold text-[#1D1D1F]">
    Rapport Puces (SIM Cards)
    {selectedCompany !== 'ALL' && ` — ${selectedCompany}`}
    {selectedDept !== 'ALL' && ` / ${departments.find(d => d.id === selectedDept)?.name ?? ''}`}
    {selectedStatus !== 'ALL' && ` / ${selectedStatus}`}
  </h1>
  <p className="text-xs text-[#86868B] mt-0.5">
    {filteredPuces.length} puce(s) — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">Search</label>
              <input type="text" placeholder="S/N, Phone, PUK..."
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
              <label className="text-[10px] font-bold text-[#86868B] block uppercase tracking-wider mb-1.5">Status</label>
              <select className="w-full text-xs bg-[#F5F5F7] border border-[#D2D2D7]/60 rounded-lg px-3 py-2 text-[#1D1D1F] cursor-pointer focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1E1E]"
                value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-[#D2D2D7] text-[10px] font-bold text-[#86868B] uppercase tracking-wider">
                <th className="py-3 px-5">Serial Number</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">PUK Code</th>
                <th className="py-3 px-4">Monthly Credit</th>
                <th className="py-3 px-4">Sub Node / Location</th>
                <th className="py-3 px-4 text-center">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7] text-xs text-[#424245]">
              {filteredPuces.length > 0 ? filteredPuces.map((p) => {
                const subNode = subNodes.find(s => s.id === p.assignedNodeId);
                return (
                  <tr key={p.id} className="hover:bg-[#F5F5F7]/30 transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-[#1D1D1F] tracking-wider">{p.serialNumber}</td>
                    <td className="py-3 px-4 font-semibold text-[#1D1D1F]">{p.phoneNumber}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{p.pukCode}</td>
                    <td className="py-3 px-4 font-bold text-[#1D1D1F]">
                      {p.monthlyCredit.toLocaleString('fr-FR')} <span className="font-normal text-[#86868B]">DA</span>
                    </td>
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
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          p.status === 'Active' ? 'bg-[#34C759]/10 text-[#34C759]' :
                          p.status === 'Suspended' ? 'bg-[#FF9500]/10 text-[#FF9500]' :
                          'bg-[#86868B]/10 text-[#86868B]'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#86868B]">
                    <div className="space-y-1">
                      <AlertCircle className="w-8 h-8 text-[#86868B]/40 mx-auto" />
                      <p className="font-semibold text-[#1D1D1F]">No puces match the filters</p>
                      <p className="text-[11px]">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
      </div>
    </div>
  );
}
