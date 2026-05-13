'use client';

import { useState, useMemo } from 'react';
import type { PermissionDef, RoleWithMeta, RoleOrg, ScopeFilter } from './types';
import { roleScope } from './types';
import RoleEditorModal from './RoleEditorModal';

interface Props {
  initialRoles: RoleWithMeta[];
  permissions: PermissionDef[];
  organizations: RoleOrg[];
}

const SCOPE_LABEL: Record<'system' | 'global' | 'org', { label: string; cls: string }> = {
  system: { label: 'System',  cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  global: { label: 'Global',  cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  org:    { label: 'Org',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

export default function AdminRolesClient({ initialRoles, permissions, organizations }: Props) {
  const [roles, setRoles] = useState<RoleWithMeta[]>(initialRoles);
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<RoleWithMeta | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = useMemo(() => {
    return roles.filter(r => {
      if (scope !== 'all' && roleScope(r) !== scope) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [r.name, r.slug, r.description ?? '', r.organization?.name ?? ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [roles, scope, search]);

  const counts = useMemo(() => ({
    system: roles.filter(r => r.isSystem).length,
    global: roles.filter(r => !r.isSystem && r.isGlobal).length,
    org:    roles.filter(r => !r.isSystem && !r.isGlobal).length,
  }), [roles]);

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  }

  async function handleToggleDisable(r: RoleWithMeta) {
    const res = await fetch(`/api/admin/roles/${r.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isDisabled: !r.isDisabled }),
    });
    const data = await res.json();
    if (!res.ok) return showToast('error', data.error || 'Failed');
    setRoles(prev => prev.map(x => x.id === r.id ? { ...x, isDisabled: !x.isDisabled } : x));
    showToast('success', !r.isDisabled ? 'Role disabled' : 'Role re-enabled');
  }

  async function handleDelete(r: RoleWithMeta) {
    if (r.isSystem) return showToast('error', 'System roles cannot be deleted');
    if (!confirm(`Delete role "${r.name}"? This will unassign it from all members.`)) return;
    const res = await fetch(`/api/admin/roles/${r.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return showToast('error', data.error || 'Failed');
    setRoles(prev => prev.filter(x => x.id !== r.id));
    showToast('success', 'Role deleted');
  }

  function onSaved(role: RoleWithMeta, wasNew: boolean) {
    setRoles(prev => wasNew ? [role, ...prev] : prev.map(x => x.id === role.id ? role : x));
    showToast('success', wasNew ? 'Role created' : 'Role updated');
    setEditing(null);
    setCreating(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Roles &amp; Permissions</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            Manage system, global and organization-specific roles across the platform.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-[#635bff] text-white text-sm font-semibold hover:bg-[#4f46e5] transition-colors"
        >
          + Create Global Role
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={roles.length} accent="text-[var(--text-primary)]" />
        <StatCard label="System"  value={counts.system} accent="text-purple-400" />
        <StatCard label="Global"  value={counts.global} accent="text-blue-400" />
        <StatCard label="Org-level" value={counts.org} accent="text-emerald-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {(['all','system','global','org'] as ScopeFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                scope === s
                  ? 'bg-[#635bff] text-white border-transparent'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
              }`}
            >
              {s === 'all' ? 'All' : SCOPE_LABEL[s].label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search roles…"
          className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#635bff]"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
              <tr>
                <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase">Role</th>
                <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase hidden md:table-cell">Scope</th>
                <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase hidden lg:table-cell">Organization</th>
                <th className="text-center px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase">Perms</th>
                <th className="text-center px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase hidden sm:table-cell">Members</th>
                <th className="text-right px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">No roles match the filters.</td></tr>
              ) : filtered.map(r => {
                const sc = roleScope(r);
                const meta = SCOPE_LABEL[sc];
                return (
                  <tr key={r.id} className={`border-t border-[var(--border)] hover:bg-[var(--bg-surface-2)] transition-colors ${r.isDisabled ? 'opacity-50' : ''}`}>
                    <td className="px-3 sm:px-4 py-3 min-w-[160px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ backgroundColor: (r.color ?? '#635bff') + '22', color: r.color ?? '#635bff' }}>
                          {r.icon ?? '🔖'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--text-primary)] truncate">{r.name}</div>
                          <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">{r.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ${meta.cls}`}>{meta.label}</span>
                      {r.isDisabled && <span className="ml-1 text-[10px] uppercase px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">Disabled</span>}
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden lg:table-cell text-[var(--text-secondary)] text-xs">
                      {r.organization?.name ?? (r.isGlobal ? 'All organizations' : r.isSystem ? 'Platform default' : '—')}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center font-semibold text-[var(--text-primary)]">{r.permissions.length}</td>
                    <td className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell text-[var(--text-secondary)]">{r._count.assignments}</td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(r)} className="text-xs font-semibold text-[#635bff] hover:text-[#4f46e5] px-2 py-1 rounded hover:bg-[#635bff]/10 transition-colors">View / Edit</button>
                      {!r.isSystem && (
                        <>
                          <button onClick={() => handleToggleDisable(r)} className="hidden sm:inline-block ml-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-[var(--bg-surface-2)] transition-colors">
                            {r.isDisabled ? 'Enable' : 'Disable'}
                          </button>
                          <button onClick={() => handleDelete(r)} className="hidden sm:inline-block ml-1 text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || creating) && (
        <RoleEditorModal
          role={editing}
          permissions={permissions}
          organizations={organizations}
          isPlatformAdmin={true}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={onSaved}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-4">
      <p className="text-xs uppercase font-semibold text-[var(--text-muted)] tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}
