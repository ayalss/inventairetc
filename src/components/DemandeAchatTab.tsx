import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShoppingCart, Plus, X, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Calendar, Hash, User, Building2, Search,
  LayoutGrid, Rows3, Download, ArrowUpDown, Undo2, GripVertical, Flame
} from 'lucide-react';
import type { Department, Manager, SubNode } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DemandeAchat {
  id: string;
  daiNumber: string;       // DAI N°
  subNodeId: string;       // who is it for (user/desk)
  subNodeName: string;     // denormalized for display
  departmentId: string;    // derived from subNode → manager → dept
  departmentName: string;
  date: string;            // ISO date string
  status: 'Non traité' | 'En cours' | 'Traité';
  notes?: string;
  createdAt: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DemandeAchatTabProps {
  departments: Department[];
  managers: Manager[];
  subNodes: SubNode[];
  demandes: DemandeAchat[];
  onAddDemande: (d: DemandeAchat) => void;
  onUpdateStatus: (id: string, status: DemandeAchat['status']) => void;
  onDeleteDemande: (id: string) => void;
}

// ─── Constants & helpers ──────────────────────────────────────────────────────

const OVERDUE_DAYS = 3;
const STATUSES: DemandeAchat['status'][] = ['Non traité', 'En cours', 'Traité'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(d: DemandeAchat): boolean {
  if (d.status === 'Traité') return false;
  const ageMs = Date.now() - new Date(d.date).getTime();
  return ageMs > OVERDUE_DAYS * 24 * 60 * 60 * 1000;
}

function getSubNodeDept(
  subNodeId: string,
  subNodes: SubNode[],
  managers: Manager[],
  departments: Department[]
): { departmentId: string; departmentName: string } {
  const node = subNodes.find(n => n.id === subNodeId);
  if (!node) return { departmentId: '', departmentName: '—' };
  const mgr = managers.find(m => m.id === node.managerId);
  if (!mgr) return { departmentId: '', departmentName: '—' };
  const dept = departments.find(d => d.id === mgr.departmentId);
  return { departmentId: dept?.id || '', departmentName: dept?.name || '—' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

function csvEscape(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportCsv(rows: DemandeAchat[]) {
  const headers = ['DAI N°', 'Utilisateur/Bureau', 'Département', 'Date', 'Statut', 'Notes', 'Créé le'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.daiNumber, r.subNodeName, r.departmentName, r.date, r.status, r.notes || '', r.createdAt,
    ].map(csvEscape).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `demandes-achat-${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const STATUS_COLORS: Record<DemandeAchat['status'], string> = {
  'Non traité': 'bg-amber-50 text-amber-700 border-amber-200',
  'En cours':   'bg-blue-50 text-blue-700 border-blue-200',
  'Traité':     'bg-emerald-50 text-emerald-700 border-emerald-200',
};
const STATUS_DOT: Record<DemandeAchat['status'], string> = {
  'Non traité': 'bg-amber-500',
  'En cours':   'bg-blue-500',
  'Traité':     'bg-emerald-500',
};
const STATUS_ICONS: Record<DemandeAchat['status'], React.ReactNode> = {
  'Non traité': <Clock className="w-3 h-3" />,
  'En cours':   <AlertCircle className="w-3 h-3" />,
  'Traité':     <CheckCircle2 className="w-3 h-3" />,
};

// ─── Toast (undo delete) ───────────────────────────────────────────────────────

function UndoToast({
  label,
  onUndo,
  onExpire,
}: { label: string; onUndo: () => void; onExpire: () => void }) {
  const [pct, setPct] = useState(100);
  const DURATION = 5000;

  useEffect(() => {
    const start = Date.now();
    const raf = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setPct(remaining);
      if (elapsed >= DURATION) {
        clearInterval(raf);
        onExpire();
      }
    }, 50);
    return () => clearInterval(raf);
  }, [onExpire]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#1D1D1F] text-white rounded-xl shadow-2xl overflow-hidden min-w-[320px]">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xs font-medium flex-1">
          <strong className="font-mono">{label}</strong> supprimée.
        </span>
        <button
          onClick={onUndo}
          className="flex items-center gap-1.5 text-xs font-bold text-[#FF1E1E] hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Undo2 className="w-3.5 h-3.5" /> Annuler
        </button>
      </div>
      <div className="h-0.5 bg-white/10">
        <div className="h-full bg-[#FF1E1E] transition-[width] duration-75 ease-linear" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Notification Banner ──────────────────────────────────────────────────────

function PendingBanner({
  count,
  onDismiss,
}: { count: number; onDismiss: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mb-6 shadow-sm">
      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="flex-1">
        <strong>{count} demande{count > 1 ? 's' : ''} non traité{count > 1 ? 'es' : 'e'}</strong> en attente de traitement.
      </span>
      <button
        onClick={onDismiss}
        className="ml-auto text-amber-500 hover:text-amber-700 transition-colors cursor-pointer"
        title="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Add Form ─────────────────────────────────────────────────────────────────

function AddDemandeForm({
  departments,
  managers,
  subNodes,
  onAdd,
  onClose,
}: {
  departments: Department[];
  managers: Manager[];
  subNodes: SubNode[];
  onAdd: (d: DemandeAchat) => void;
  onClose: () => void;
}) {
  const [daiNumber, setDaiNumber]   = useState('');
  const [subNodeId, setSubNodeId]   = useState('');
  const [date, setDate]             = useState(today());
  const [notes, setNotes]           = useState('');
  const [search, setSearch]         = useState('');
  const [error, setError]           = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = subNodes.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.officeNum?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!daiNumber.trim()) { setError('Le numéro DAI est obligatoire.'); return; }
    if (!subNodeId)        { setError('Sélectionnez un utilisateur / bureau.'); return; }
    if (!date)             { setError('La date est obligatoire.'); return; }

    const node = subNodes.find(n => n.id === subNodeId)!;
    const { departmentId, departmentName } = getSubNodeDept(subNodeId, subNodes, managers, departments);

    const newDemande: DemandeAchat = {
      id: `DA-${Date.now()}`,
      daiNumber: daiNumber.trim(),
      subNodeId,
      subNodeName: node.name,
      departmentId,
      departmentName,
      date,
      status: 'Non traité',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAdd(newDemande);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#D2D2D7] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-4.5 h-4.5 text-[#FF1E1E]" />
            <h2 className="text-sm font-bold text-[#1D1D1F] tracking-wide">Nouvelle Demande d'Achat</h2>
          </div>
          <button onClick={onClose} className="text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          {/* DAI N° */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> DAI N°
            </label>
            <input
              type="text"
              autoFocus
              value={daiNumber}
              onChange={e => { setDaiNumber(e.target.value); setError(''); }}
              placeholder="ex: DAI-2024-001"
              className="w-full px-3 py-2 text-sm border border-[#D2D2D7] rounded-lg focus:outline-none focus:border-[#FF1E1E] focus:ring-1 focus:ring-[#FF1E1E]/20 transition-all font-mono"
            />
          </div>

          {/* SubNode picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3" /> Utilisateur / Bureau
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868B]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un bureau ou nom..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-[#D2D2D7] rounded-lg focus:outline-none focus:border-[#FF1E1E] focus:ring-1 focus:ring-[#FF1E1E]/20 transition-all mb-1"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border border-[#D2D2D7] rounded-lg divide-y divide-[#F5F5F7]">
              {filtered.length === 0 && (
                <p className="text-xs text-[#86868B] text-center py-4">Aucun résultat</p>
              )}
              {filtered.map(node => {
                const { departmentName } = getSubNodeDept(node.id, subNodes, managers, departments);
                const selected = subNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => { setSubNodeId(node.id); setError(''); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      selected
                        ? 'bg-[#FF1E1E]/8 text-[#FF1E1E] font-semibold'
                        : 'hover:bg-[#F5F5F7] text-[#424245]'
                    }`}
                  >
                    <span className="font-medium">{node.name}</span>
                    <span className="text-[10px] text-[#86868B] font-mono">{departmentName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setError(''); }}
              className="w-full px-3 py-2 text-sm border border-[#D2D2D7] rounded-lg focus:outline-none focus:border-[#FF1E1E] focus:ring-1 focus:ring-[#FF1E1E]/20 transition-all"
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Notes <span className="normal-case font-normal">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Objet de la demande, précisions..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#D2D2D7] rounded-lg focus:outline-none focus:border-[#FF1E1E] focus:ring-1 focus:ring-[#FF1E1E]/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[#F0F0F0] bg-[#F5F5F7]/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#424245] hover:text-[#1D1D1F] border border-[#D2D2D7] rounded-lg hover:bg-[#F5F5F7] transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-bold text-white bg-[#FF1E1E] hover:bg-red-700 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar ────────────────────────────────────────────────────────────────

type SortKey = 'newest' | 'oldest' | 'dai' | 'department';

function Toolbar({
  query, onQuery,
  statusFilter, onStatusFilter,
  deptFilter, onDeptFilter,
  departments,
  sortKey, onSortKey,
  view, onView,
  onExport, exportDisabled,
}: {
  query: string; onQuery: (v: string) => void;
  statusFilter: 'all' | DemandeAchat['status']; onStatusFilter: (v: 'all' | DemandeAchat['status']) => void;
  deptFilter: string; onDeptFilter: (v: string) => void;
  departments: Department[];
  sortKey: SortKey; onSortKey: (v: SortKey) => void;
  view: 'table' | 'kanban'; onView: (v: 'table' | 'kanban') => void;
  onExport: () => void; exportDisabled: boolean;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868B]" />
        <input
          type="text"
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Rechercher DAI, bureau, note..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-[#D2D2D7] rounded-lg bg-white focus:outline-none focus:border-[#FF1E1E] focus:ring-1 focus:ring-[#FF1E1E]/20 transition-all"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-1 bg-white border border-[#D2D2D7] rounded-lg p-0.5 overflow-x-auto">
        {(['all', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => onStatusFilter(s)}
            className={`px-2.5 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === s ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            {s === 'all' ? 'Tous' : s}
          </button>
        ))}
      </div>

      {/* Department filter */}
      <select
        value={deptFilter}
        onChange={e => onDeptFilter(e.target.value)}
        className="px-2.5 py-2 text-xs border border-[#D2D2D7] rounded-lg bg-white text-[#424245] focus:outline-none focus:border-[#FF1E1E] cursor-pointer"
      >
        <option value="all">Tous départements</option>
        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>

      {/* Sort */}
      <div className="relative">
        <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#86868B] pointer-events-none" />
        <select
          value={sortKey}
          onChange={e => onSortKey(e.target.value as SortKey)}
          className="pl-7 pr-2.5 py-2 text-xs border border-[#D2D2D7] rounded-lg bg-white text-[#424245] focus:outline-none focus:border-[#FF1E1E] cursor-pointer appearance-none"
        >
          <option value="newest">Plus récent</option>
          <option value="oldest">Plus ancien</option>
          <option value="dai">DAI N°</option>
          <option value="department">Département</option>
        </select>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-0.5 bg-white border border-[#D2D2D7] rounded-lg p-0.5">
        <button
          onClick={() => onView('table')}
          title="Vue tableau"
          className={`p-1.5 rounded-md transition-all cursor-pointer ${view === 'table' ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
        >
          <Rows3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onView('kanban')}
          title="Vue Kanban"
          className={`p-1.5 rounded-md transition-all cursor-pointer ${view === 'kanban' ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Export */}
      <button
        onClick={onExport}
        disabled={exportDisabled}
        title="Exporter en CSV"
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#424245] border border-[#D2D2D7] rounded-lg hover:bg-[#F5F5F7] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" /> CSV
      </button>
    </div>
  );
}

// ─── Row card (shared table/kanban row content) ───────────────────────────────

function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
      <Flame className="w-2.5 h-2.5" /> En retard
    </span>
  );
}

// ─── Department Table ─────────────────────────────────────────────────────────

function DeptTable({
  dept,
  rows,
  onUpdateStatus,
  onDelete,
}: {
  dept: Department;
  rows: DemandeAchat[];
  onUpdateStatus: (id: string, status: DemandeAchat['status']) => void;
  onDelete: (row: DemandeAchat) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pending = rows.filter(r => r.status !== 'Traité').length;

  return (
    <div className="bg-white rounded-xl border border-[#D2D2D7] overflow-hidden shadow-sm">
      {/* Table header / dept title */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F7]/60 border-b border-[#F0F0F0] cursor-pointer hover:bg-[#F5F5F7] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-[#86868B]" />
          <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wide">{dept.name}</span>
          <span className="text-[9px] font-mono font-bold text-[#86868B] bg-white border border-[#D2D2D7] px-1.5 py-0.5 rounded">
            {dept.deptNum}
          </span>
          {pending > 0 && (
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
              {pending} en attente
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#86868B]">{rows.length} demande{rows.length !== 1 ? 's' : ''}</span>
          {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-[#86868B]" /> : <ChevronUp className="w-3.5 h-3.5 text-[#86868B]" />}
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F9F9F9] border-b border-[#F0F0F0]">
                <th className="text-left px-4 py-2.5 font-semibold text-[#86868B] uppercase tracking-wider w-36">DAI N°</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[#86868B] uppercase tracking-wider">Utilisateur / Bureau</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[#86868B] uppercase tracking-wider w-32">Date</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[#86868B] uppercase tracking-wider w-32">Statut</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[#86868B] uppercase tracking-wider">Notes</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F7]">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-[#F9F9F9] transition-colors group">
                  {/* DAI */}
                  <td className="px-4 py-3 font-mono font-bold text-[#1D1D1F]">{row.daiNumber}</td>

                  {/* SubNode */}
                  <td className="px-4 py-3 text-[#424245] font-medium">{row.subNodeName}</td>

                  {/* Date */}
                  <td className="px-4 py-3 text-[#86868B] font-mono">
                    <div className="flex items-center gap-1.5">
                      {formatDate(row.date)}
                      {isOverdue(row) && <OverdueBadge />}
                    </div>
                  </td>

                  {/* Status selector */}
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      onChange={e => onUpdateStatus(row.id, e.target.value as DemandeAchat['status'])}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-full border cursor-pointer appearance-none pr-5 focus:outline-none transition-colors ${STATUS_COLORS[row.status]}`}
                      style={{ backgroundImage: 'none' }}
                    >
                      <option value="Non traité">Non traité</option>
                      <option value="En cours">En cours</option>
                      <option value="Traité">Traité</option>
                    </select>
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 text-[#86868B] truncate max-w-xs">{row.notes || '—'}</td>

                  {/* Delete */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(row)}
                      className="opacity-0 group-hover:opacity-100 text-[#86868B] hover:text-red-500 transition-all cursor-pointer"
                      title="Supprimer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#86868B] text-xs">
                    Aucune demande pour ce département
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Kanban board ───────────────────────────────────────────────────────────

function KanbanCard({
  row,
  onDelete,
  onDragStart,
}: {
  row: DemandeAchat;
  onDelete: (row: DemandeAchat) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, row.id)}
      className="group bg-white border border-[#D2D2D7] rounded-xl p-3 shadow-sm hover:shadow-md hover:border-[#FF1E1E]/40 transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3 h-3 text-[#D2D2D7] shrink-0" />
          <span className="text-xs font-mono font-bold text-[#1D1D1F] truncate">{row.daiNumber}</span>
        </div>
        <button
          onClick={() => onDelete(row)}
          className="opacity-0 group-hover:opacity-100 text-[#86868B] hover:text-red-500 transition-all cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs font-semibold text-[#424245] mt-2 truncate">{row.subNodeName}</p>
      <p className="text-[10px] text-[#86868B] font-mono mt-0.5">{row.departmentName}</p>
      {row.notes && <p className="text-[10px] text-[#86868B] mt-2 line-clamp-2">{row.notes}</p>}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0F0F0]">
        <span className="text-[9px] text-[#86868B] font-mono">{formatDate(row.date)}</span>
        {isOverdue(row) && <OverdueBadge />}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  rows,
  onDelete,
  onDrop,
  onDragStart,
}: {
  status: DemandeAchat['status'];
  rows: DemandeAchat[];
  onDelete: (row: DemandeAchat) => void;
  onDrop: (status: DemandeAchat['status']) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDrop(status); }}
      className={`flex-1 min-w-[260px] rounded-xl border transition-colors ${
        dragOver ? 'border-[#FF1E1E] bg-[#FF1E1E]/[0.03]' : 'border-[#D2D2D7] bg-[#F5F5F7]/40'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[#D2D2D7]/60">
        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wide">{status}</span>
        <span className="ml-auto text-[10px] font-mono text-[#86868B] bg-white border border-[#D2D2D7] px-1.5 py-0.5 rounded-full">
          {rows.length}
        </span>
      </div>
      <div className="p-2.5 space-y-2 min-h-[120px] max-h-[65vh] overflow-y-auto">
        {rows.map(row => (
          <KanbanCard key={row.id} row={row} onDelete={onDelete} onDragStart={onDragStart} />
        ))}
        {rows.length === 0 && (
          <p className="text-[10px] text-[#86868B] text-center py-6">Déposez une carte ici</p>
        )}
      </div>
    </div>
  );
}

// ─── Department breakdown mini-chart ──────────────────────────────────────────

function DeptBreakdown({ departments, demandes }: { departments: Department[]; demandes: DemandeAchat[] }) {
  const counts = departments
    .map(d => ({ dept: d, count: demandes.filter(x => x.departmentId === d.id).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const max = Math.max(1, ...counts.map(c => c.count));

  if (counts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[#D2D2D7] px-4 py-3.5 shadow-sm">
      <p className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider mb-3">Par département</p>
      <div className="space-y-2">
        {counts.map(({ dept, count }) => (
          <div key={dept.id} className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-[#424245] w-24 truncate shrink-0">{dept.shortCode || dept.name}</span>
            <div className="flex-1 h-1.5 bg-[#F5F5F7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF1E1E] rounded-full transition-all"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-[#1D1D1F] w-5 text-right shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function DemandeAchatTab({
  departments,
  managers,
  subNodes,
  demandes,
  onAddDemande,
  onUpdateStatus,
  onDeleteDemande,
}: DemandeAchatTabProps) {
  const [showForm, setShowForm]       = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const [query, setQuery]             = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DemandeAchat['status']>('all');
  const [deptFilter, setDeptFilter]   = useState('all');
  const [sortKey, setSortKey]         = useState<SortKey>('newest');
  const [view, setView]               = useState<'table' | 'kanban'>('table');

  // Optimistic hide + undo window for deletes
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<DemandeAchat | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingCount = demandes.filter(d => d.status === 'Non traité').length;

  // Show banner again whenever pending count increases (new demande added)
  useEffect(() => {
    if (pendingCount > 0) setBannerDismissed(false);
  }, [pendingCount]);

  // Keyboard shortcut: "n" opens the add form when not typing and no modal is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (!isTyping && !showForm && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setShowForm(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  useEffect(() => () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); }, []);

  const requestDelete = useCallback((row: DemandeAchat) => {
    setHiddenIds(prev => new Set(prev).add(row.id));
    setPendingDelete(row);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = setTimeout(() => {
      onDeleteDemande(row.id);
      setPendingDelete(null);
    }, 5000);
  }, [onDeleteDemande]);

  const undoDelete = useCallback(() => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    if (pendingDelete) {
      setHiddenIds(prev => {
        const next = new Set(prev);
        next.delete(pendingDelete.id);
        return next;
      });
    }
    setPendingDelete(null);
  }, [pendingDelete]);

  const expireDelete = useCallback(() => {
    if (pendingDelete) {
      onDeleteDemande(pendingDelete.id);
    }
    setPendingDelete(null);
  }, [pendingDelete, onDeleteDemande]);

  // Visible set after optimistic-delete filtering
  const visible = useMemo(
    () => demandes.filter(d => !hiddenIds.has(d.id)),
    [demandes, hiddenIds]
  );

  // Search + filter + sort pipeline
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = visible.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (deptFilter !== 'all' && d.departmentId !== deptFilter) return false;
      if (!q) return true;
      return (
        d.daiNumber.toLowerCase().includes(q) ||
        d.subNodeName.toLowerCase().includes(q) ||
        d.departmentName.toLowerCase().includes(q) ||
        (d.notes || '').toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'oldest':     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'dai':        return a.daiNumber.localeCompare(b.daiNumber);
        case 'department': return a.departmentName.localeCompare(b.departmentName);
        case 'newest':
        default:           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [visible, query, statusFilter, deptFilter, sortKey]);

  // Group filtered demandes by department (table view)
  const grouped = departments.map(dept => ({
    dept,
    rows: filtered.filter(d => d.departmentId === dept.id),
  })).filter(g => g.rows.length > 0);

  const unmatched = filtered.filter(d => !departments.find(dept => dept.id === d.departmentId));

  const totalTraite  = demandes.length ? demandes.filter(d => d.status === 'Traité').length : 0;
  const overdueCount = visible.filter(isOverdue).length;

  // Drag & drop status change for kanban
  const draggedIdRef = useRef<string | null>(null);
  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggedIdRef.current = id;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDrop = (dropStatus: DemandeAchat['status']) => {
    const id = draggedIdRef.current;
    if (id) onUpdateStatus(id, dropStatus);
    draggedIdRef.current = null;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-[#1D1D1F] tracking-tight uppercase">
            Demandes d'Achat
          </h1>
          <p className="text-xs text-[#86868B] mt-0.5">
            Suivi des demandes DAI par département
            <span className="hidden sm:inline text-[#D2D2D7]"> · appuyez sur </span>
            <kbd className="hidden sm:inline text-[9px] font-mono bg-[#F5F5F7] border border-[#D2D2D7] rounded px-1 py-0.5">N</kbd>
            <span className="hidden sm:inline"> pour une nouvelle demande</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FF1E1E] hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvelle demande
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: demandes.length,   color: 'text-[#1D1D1F]',   bg: 'bg-white' },
          { label: 'Non traités', value: pendingCount,       color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
          { label: 'Traités',     value: totalTraite,        color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'En retard',   value: overdueCount,       color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-[#D2D2D7] ${s.bg} px-4 py-3 shadow-sm`}>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {departments.length > 0 && demandes.length > 0 && (
        <DeptBreakdown departments={departments} demandes={demandes} />
      )}

      {/* Pending banner */}
      {!bannerDismissed && (
        <PendingBanner count={pendingCount} onDismiss={() => setBannerDismissed(true)} />
      )}

      {/* Toolbar */}
      {demandes.length > 0 && (
        <Toolbar
          query={query} onQuery={setQuery}
          statusFilter={statusFilter} onStatusFilter={setStatusFilter}
          deptFilter={deptFilter} onDeptFilter={setDeptFilter}
          departments={departments}
          sortKey={sortKey} onSortKey={setSortKey}
          view={view} onView={setView}
          onExport={() => exportCsv(filtered)}
          exportDisabled={filtered.length === 0}
        />
      )}

      {/* Content */}
      {demandes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#D2D2D7] rounded-2xl bg-white text-center">
          <ShoppingCart className="w-10 h-10 text-[#D2D2D7] mb-3" />
          <p className="text-sm font-semibold text-[#86868B]">Aucune demande enregistrée</p>
          <p className="text-xs text-[#86868B] mt-1">Cliquez sur <strong>Nouvelle demande</strong> pour commencer.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#D2D2D7] rounded-2xl bg-white text-center">
          <Search className="w-8 h-8 text-[#D2D2D7] mb-3" />
          <p className="text-sm font-semibold text-[#86868B]">Aucun résultat</p>
          <p className="text-xs text-[#86868B] mt-1">Essayez d'ajuster votre recherche ou vos filtres.</p>
        </div>
      ) : view === 'table' ? (
        <div className="space-y-4">
          {grouped.map(({ dept, rows }) => (
            <DeptTable
              key={dept.id}
              dept={dept}
              rows={rows}
              onUpdateStatus={onUpdateStatus}
              onDelete={requestDelete}
            />
          ))}

          {/* Unmatched rows (dept deleted, etc.) */}
          {unmatched.length > 0 && (
            <div className="bg-white rounded-xl border border-[#D2D2D7] overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-[#F5F5F7]/60 border-b border-[#F0F0F0] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#86868B]" />
                <span className="text-xs font-bold text-[#86868B] uppercase tracking-wide">Département inconnu</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-[#F5F5F7]">
                    {unmatched.map(row => (
                      <tr key={row.id} className="hover:bg-[#F9F9F9] group">
                        <td className="px-4 py-3 font-mono font-bold text-[#1D1D1F]">{row.daiNumber}</td>
                        <td className="px-4 py-3 text-[#424245]">{row.subNodeName}</td>
                        <td className="px-4 py-3 text-[#86868B] font-mono">{formatDate(row.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border flex items-center gap-1 w-fit ${STATUS_COLORS[row.status]}`}>
                            {STATUS_ICONS[row.status]} {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => requestDelete(row)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 cursor-pointer transition-all">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Kanban view
        <div className="flex flex-col md:flex-row gap-3">
          {STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              rows={filtered.filter(d => d.status === status)}
              onDelete={requestDelete}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <AddDemandeForm
          departments={departments}
          managers={managers}
          subNodes={subNodes}
          onAdd={onAddDemande}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Undo-delete toast */}
      {pendingDelete && (
        <UndoToast
          label={pendingDelete.daiNumber}
          onUndo={undoDelete}
          onExpire={expireDelete}
        />
      )}
    </div>
  );
}
