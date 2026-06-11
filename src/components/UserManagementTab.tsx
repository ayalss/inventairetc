import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, RefreshCw, CheckCircle2, XCircle, Monitor,
  ChevronLeft, ChevronRight, Search, UserPlus, Ban,
  Unlock, Trash2, Users, Eye, EyeOff, Crown, User, UserCheck,
  Pencil, Save, X
} from 'lucide-react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface UserRow {
  email: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
}

interface AuditLog {
  id: number;
  user_email: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function parseUA(ua: string | null): string {
  if (!ua) return 'Unknown';
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'Chrome';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/Edg/.test(ua)) return 'Edge';
  if (/curl/.test(ua)) return 'cURL';
  return 'Other';
}

function ActionBadge({ action }: { action: string }) {
  switch (action) {
    case 'LOGIN_SUCCESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Success
        </span>
      );
    case 'LOGIN_FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-900/40 text-red-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
          <XCircle className="w-3 h-3 text-red-400" />
          Failed
        </span>
      );
    case 'USER_CREATED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-900/40 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
          <UserCheck className="w-3 h-3 text-blue-400" />
          Created
        </span>
      );
    case 'USER_BLOCKED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-900/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          <Ban className="w-3 h-3 text-amber-400" />
          Blocked
        </span>
      );
    case 'USER_UNBLOCKED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-950/40 border border-teal-900/40 text-teal-400 text-[10px] font-bold uppercase tracking-wider">
          <Unlock className="w-3 h-3 text-teal-400" />
          Unblocked
        </span>
      );
    case 'USER_DELETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-900/40 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
          <Trash2 className="w-3 h-3 text-rose-400" />
          Deleted
        </span>
      );
    case 'USER_CREATE_FAILED':
    case 'USER_CREATE_ERROR':
    case 'USER_BLOCK_ERROR':
    case 'USER_DELETE_ERROR':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/20 border border-rose-900/30 text-red-400 text-[10px] font-bold uppercase tracking-wider">
          <ShieldAlert className="w-3 h-3 text-red-400" />
          Admin Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/40 border border-slate-700/40 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
          {action.replace(/_/g, ' ')}
        </span>
      );
  }
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-[#FF1E1E] text-[10px] font-bold uppercase tracking-wider">
      <Crown className="w-2.5 h-2.5" /> Admin
    </span>
  );
  if (role === 'manager') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
      <Users className="w-2.5 h-2.5" /> Manager
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
      <User className="w-2.5 h-2.5" /> User
    </span>
  );
}

// ─────────────────────────────────────────────
// EDIT USER MODAL
// ─────────────────────────────────────────────

interface EditUserModalProps {
  user: UserRow;
  adminEmail: string | null;
  onClose: () => void;
  onSaved: (updated: UserRow) => void;
}

function EditUserModal({ user, adminEmail, onClose, onSaved }: EditUserModalProps) {
  const [role, setRole] = useState(user.role);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { role };
      if (newPassword.trim()) body.password = newPassword.trim();

      const res = await fetch(`/api/users/${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminEmail ? { 'x-admin-email': adminEmail } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user.');
      onSaved({ ...user, role });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="bg-white border border-[#D2D2D7] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-[#D2D2D7] flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider">Edit Identity</h3>
              <p className="text-[10px] text-[#86868B] font-mono mt-0.5 truncate max-w-[220px]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#86868B] hover:text-slate-900 hover:bg-[#F5F5F7] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-500 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">
            Security Clearance Role
          </label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-slate-400 transition-colors cursor-pointer font-medium"
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* New password (optional) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">
            New Password <span className="normal-case font-medium text-[#86868B]">(leave blank to keep current)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-3 pr-9 py-2.5 bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-slate-400 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-slate-950 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Save className="w-3.5 h-3.5" />
            }
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#424245] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

interface UserManagementTabProps {
  adminEmail: string | null;
}

export default function UserManagementTab({ adminEmail }: UserManagementTabProps) {
  const [activeSection, setActiveSection] = useState<'users' | 'logs'>('users');

  // ── Users state ──
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // ── Edit modal state ──
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  // ── Create user form ──
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Audit logs state ──
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'LOGINS' | 'USER_ACTIONS' | 'ERRORS'>('ALL');

  // ─────────────────────────────────────────────
  // FETCH USERS
  // ─────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setUsersError(err.message || 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────
  // FETCH AUDIT LOGS
  // ─────────────────────────────────────────────

  const fetchLogs = useCallback(async (currentPage: number) => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetch(`/api/audit-logs?limit=${PAGE_SIZE}&offset=${currentPage * PAGE_SIZE}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setLogsError(err.message || 'Failed to load logs.');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { if (activeSection === 'logs') fetchLogs(page); }, [activeSection, page, fetchLogs]);

  // ─────────────────────────────────────────────
  // CREATE USER
  // ─────────────────────────────────────────────

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminEmail ? { 'x-admin-email': adminEmail } : {})
        },
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword.trim(), role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user.');
      setNewEmail(''); setNewPassword(''); setNewRole('user');
      setShowCreateForm(false);
      await fetchUsers();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // BLOCK / UNBLOCK
  // ─────────────────────────────────────────────

  const handleToggleBlock = async (email: string, currentlyBlocked: boolean) => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}/block`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminEmail ? { 'x-admin-email': adminEmail } : {})
        },
        body: JSON.stringify({ is_blocked: !currentlyBlocked }),
      });
      if (!res.ok) throw new Error('Failed to update user.');
      setUsers(prev => prev.map(u => u.email === email ? { ...u, is_blocked: !currentlyBlocked } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ─────────────────────────────────────────────
  // DELETE USER
  // ─────────────────────────────────────────────

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          ...(adminEmail ? { 'x-admin-email': adminEmail } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to delete user.');
      setUsers(prev => prev.filter(u => u.email !== email));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ─────────────────────────────────────────────
  // FILTERED LOGS
  // ─────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filteredLogs = logs.filter(log => {
    let matchCategory = true;
    if (filterCategory === 'LOGINS') {
      matchCategory = log.action === 'LOGIN_SUCCESS' || log.action === 'LOGIN_FAILED';
    } else if (filterCategory === 'USER_ACTIONS') {
      matchCategory = ['USER_CREATED', 'USER_BLOCKED', 'USER_UNBLOCKED', 'USER_DELETED'].includes(log.action);
    } else if (filterCategory === 'ERRORS') {
      matchCategory = log.action.endsWith('_FAILED') || log.action.endsWith('_ERROR') || log.action === 'LOGIN_FAILED';
    }

    const q = search.toLowerCase();
    const matchSearch = !q ||
      (log.user_email || '').toLowerCase().includes(q) ||
      (log.details    || '').toLowerCase().includes(q) ||
      (log.ip_address || '').toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);

    return matchCategory && matchSearch;
  });

  const successCount = logs.filter(l => l.action === 'LOGIN_SUCCESS').length;
  const failedCount  = logs.filter(l => l.action === 'LOGIN_FAILED').length;

  return (
    <div className="space-y-6">

      {/* ── Edit Modal ── */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          adminEmail={adminEmail}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUsers(prev => prev.map(u => u.email === updated.email ? updated : u));
            setEditingUser(null);
          }}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#1D1D1F] uppercase tracking-[0.12em]">Security & User Management</h2>
            <p className="text-[10px] text-[#86868B] font-mono tracking-wider uppercase mt-0.5">
              Secure identity registry · System audits · Access logging
            </p>
          </div>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex items-center gap-1 bg-white border border-[#D2D2D7] rounded-xl p-1 w-fit shadow-xs">
        {([
          { key: 'users', label: 'Users & Roles', Icon: Users },
          { key: 'logs',  label: 'Audits & Logs', Icon: ShieldAlert },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveSection(key);
              setPage(0);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === key
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-[#86868B] hover:text-slate-900 hover:bg-[#F5F5F7]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          USERS SECTION
      ══════════════════════════════════════════ */}
      {activeSection === 'users' && (
        <div className="space-y-4">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#86868B] font-mono font-medium">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
            <button
              onClick={() => { setShowCreateForm(v => !v); setCreateError(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register User
            </button>
          </div>

          {/* Create user form */}
          {showCreateForm && (
            <div className="bg-white border border-[#D2D2D7] rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-[#1D1D1F] uppercase tracking-wider">Register New Identity</h3>
              <form onSubmit={handleCreateUser} className="space-y-3">
                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-500 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" /> {createError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="identity@technoceram-dz.com"
                      required
                      className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-slate-400 transition-colors font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Credentials Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-3 pr-8 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-slate-400 transition-colors font-mono"
                      />
                      <button type="button" onClick={() => setShowNewPassword(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-slate-950 transition-colors cursor-pointer">
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">Security Clearance Role</label>
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-slate-400 transition-colors cursor-pointer font-medium"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={createLoading}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-xs">
                    {createLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                    Create Identity
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#424245] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users table */}
          {/* 5-col → 6-col: added Actions column space */}
          <div className="bg-white border border-[#D2D2D7] rounded-2xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-[1fr_100px_90px_130px_110px] gap-4 px-5 py-3 bg-[#F5F5F7] border-b border-[#D2D2D7]">
              {['Email Address', 'Clearance Level', 'Account Status', 'Date Created', 'Actions'].map(h => (
                <span key={h} className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12 gap-2">
                <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                <p className="text-xs text-[#86868B] font-mono">Synchronizing directories...</p>
              </div>
            ) : usersError ? (
              <div className="flex items-center justify-center py-12 gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-xs text-red-500 font-mono">{usersError}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-xs text-[#86868B] font-mono">No accounts indexed.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {users.map(user => (
                  <div key={user.email} className="grid grid-cols-[1fr_100px_90px_130px_110px] gap-4 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors items-center">

                    {/* Email */}
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${user.is_blocked ? 'text-[#86868B] line-through' : 'text-[#1D1D1F]'}`}>
                        {user.email}
                      </p>
                    </div>

                    {/* Role */}
                    <div><RoleBadge role={user.role} /></div>

                    {/* Status */}
                    <div>
                      {user.is_blocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                          <Ban className="w-2.5 h-2.5" /> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      )}
                    </div>

                    {/* Created */}
                    <div>
                      <span className="text-[11px] font-mono text-[#86868B]">
                        {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Actions: Edit + Block/Unblock + Delete */}
                    <div className="flex items-center gap-1.5">
                      {/* Edit */}
                      <button
                        onClick={() => setEditingUser(user)}
                        title="Edit user"
                        className="p-1.5 rounded-lg border border-[#D2D2D7] text-[#86868B] hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Block / Unblock */}
                      <button
                        onClick={() => handleToggleBlock(user.email, user.is_blocked)}
                        title={user.is_blocked ? 'Unblock user' : 'Block user'}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          user.is_blocked
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                        }`}
                      >
                        {user.is_blocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(user.email)}
                        title="Delete user"
                        className="p-1.5 rounded-lg border border-[#D2D2D7] text-[#86868B] hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          AUDIT LOGS SECTION
      ══════════════════════════════════════════ */}
      {activeSection === 'logs' && (
        <div className="space-y-4">

          {/* Stats overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#D2D2D7] rounded-2xl p-4 space-y-1 shadow-xs">
              <p className="text-[10px] text-[#86868B] font-mono uppercase tracking-wider font-semibold">Total Indexed Events</p>
              <p className="text-2xl font-black text-[#1D1D1F] font-mono">{total}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-1 shadow-xs">
              <p className="text-[10px] text-emerald-600 font-mono uppercase tracking-wider font-semibold">Active Logins</p>
              <p className="text-2xl font-black text-emerald-600 font-mono">{successCount}</p>
            </div>
            <div className="bg-white border border-red-200 rounded-2xl p-4 space-y-1 shadow-xs">
              <p className="text-[10px] text-red-500 font-mono uppercase tracking-wider font-semibold">Failed Verification Attempts</p>
              <p className="text-2xl font-black text-red-500 font-mono">{failedCount}</p>
            </div>
          </div>

          {/* Filters controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search audit trail by actor, IP, details..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D2D2D7] rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-slate-400 transition-colors font-medium"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-[#D2D2D7] rounded-xl p-1 shadow-xs shrink-0">
              {([
                { key: 'ALL', label: 'All Events' },
                { key: 'LOGINS', label: 'Logins' },
                { key: 'USER_ACTIONS', label: 'User Admin' },
                { key: 'ERRORS', label: 'Errors' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilterCategory(key);
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    filterCategory === key
                      ? 'bg-slate-950 text-white'
                      : 'text-[#86868B] hover:text-slate-900 hover:bg-[#F5F5F7]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => fetchLogs(page)} disabled={logsLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs justify-center">
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Logs table */}
          <div className="bg-white border border-[#D2D2D7] rounded-2xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-[1fr_130px_125px_90px_160px] gap-4 px-5 py-3 bg-[#F5F5F7] border-b border-[#D2D2D7]">
              {['Indexed Actor', 'Audit Event', 'Network Location', 'Agent type', 'Logged Timestamp'].map(h => (
                <span key={h} className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-12 gap-2">
                <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                <p className="text-xs text-[#86868B] font-mono">Synchronizing security entries...</p>
              </div>
            ) : logsError ? (
              <div className="flex items-center justify-center py-12 gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-xs text-red-500 font-mono">{logsError}</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-xs text-[#86868B] font-mono">No actions matched search configuration.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {filteredLogs.map(log => (
                  <div key={log.id} className="grid grid-cols-[1fr_130px_125px_90px_160px] gap-4 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors items-center">

                    {/* Actor Details */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1D1D1F] truncate">
                        {log.user_email || <span className="text-[#86868B] italic">anonymous</span>}
                      </p>
                      {log.details && <p className="text-[10px] text-[#86868B] truncate mt-0.5 font-medium">{log.details}</p>}
                    </div>

                    {/* Action Badge */}
                    <div><ActionBadge action={log.action} /></div>

                    {/* IP Address */}
                    <div>
                      <span className="text-[11px] font-mono text-[#1D1D1F] bg-[#F5F5F7] px-2 py-0.5 rounded-md border border-[#D2D2D7]">
                        {log.ip_address || '—'}
                      </span>
                    </div>

                    {/* Browser Info */}
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-[#86868B] shrink-0" />
                      <span className="text-[11px] text-[#86868B] font-medium">{parseUA(log.user_agent)}</span>
                    </div>

                    {/* Timestamp */}
                    <div>
                      <span className="text-[11px] font-mono text-[#86868B]">{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#86868B] font-mono">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg border border-[#D2D2D7] text-[#86868B] hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-[#1D1D1F] font-semibold px-2">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border border-[#D2D2D7] text-[#86868B] hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
