'use client';

import { useState, useMemo } from 'react';
import type { PermissionDef, RoleOrg, RoleWithMeta } from './types';
import { groupByCategory } from './types';

const EMOJI_CHOICES = ['🔖','👑','🛡️','🔧','🏭','👤','👁️','⭐','🎯','🚨','📊','💼','🔐','⚙️','📋','🧰','🦺','🚀'];
const COLOR_CHOICES = ['#635bff','#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#6b7280','#14b8a6','#8b5cf6'];

interface Props {
  role: RoleWithMeta | null;            // null = creating
  permissions: PermissionDef[];
  organizations?: RoleOrg[];             // optional, platform-admin only
  isPlatformAdmin: boolean;
  /** Force this role to be created scoped to an org (user-dashboard use case) */
  forceOrgId?: string | null;
  onClose: () => void;
  onSaved: (role: RoleWithMeta, wasNew: boolean) => void;
}

export default function RoleEditorModal({
  role, permissions, organizations = [], isPlatformAdmin, forceOrgId, onClose, onSaved,
}: Props) {
  const isNew = !role;
  const [name, setName]       = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [color, setColor]     = useState(role?.color ?? '#635bff');
  const [icon, setIcon]       = useState(role?.icon ?? '🔖');
  const [isGlobal, setIsGlobal] = useState(role?.isGlobal ?? (isPlatformAdmin && !forceOrgId));
  const [orgId, setOrgId]     = useState<string>(role?.organizationId ?? forceOrgId ?? '');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    new Set(role?.permissions.map(p => p.permission.key) ?? [])
  );
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const byCategory = useMemo(() => groupByCategory(permissions), [permissions]);

  // When is this modal read-only?
  //   - Editing a system role AND not platform admin (org users can only view).
  //   - Editing a role not owned by the current org (global / other-org) from the org side.
  //   - Never read-only for platform admin.
  const isSystemRole = !isNew && role!.isSystem;
  const isOwnOrgRole = !isNew && role!.organizationId && role!.organizationId === forceOrgId;
  const isReadOnly = !isNew && !isPlatformAdmin && !isOwnOrgRole; // covers system + global + other-org
  const readOnlyMeta = isReadOnly || (isSystemRole && !isPlatformAdmin);

  function toggleKey(k: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }
  function toggleCategory(cat: string) {
    const cats = byCategory[cat].map(p => p.key);
    const allOn = cats.every(k => selectedKeys.has(k));
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (allOn) cats.forEach(k => next.delete(k));
      else cats.forEach(k => next.add(k));
      return next;
    });
  }

  async function handleSave() {
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        color, icon,
        permissionKeys: Array.from(selectedKeys),
      };
      let url: string;
      let method: 'POST' | 'PATCH';
      if (isNew) {
        if (isPlatformAdmin) {
          url = '/api/admin/roles';
          method = 'POST';
          payload.isGlobal = isGlobal && !orgId;
          payload.organizationId = orgId || null;
        } else {
          url = '/api/org/roles';
          method = 'POST';
        }
      } else {
        // editing
        const canUseAdminApi = isPlatformAdmin;
        url = canUseAdminApi ? `/api/admin/roles/${role!.id}` : `/api/org/roles/${role!.id}`;
        method = 'PATCH';
      }
      const res = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSaved(data.role as RoleWithMeta, isNew);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl [background:var(--bg-surface)] shadow-2xl border border-[var(--border)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--border)]">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">
              {isNew ? 'Create Role' : `${isReadOnly ? 'View' : 'Edit'} Role: ${role!.name}`}
            </h2>
            {!isNew && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {role!.isSystem ? 'Built-in system role' : role!.isGlobal ? 'Global role — visible to every org' : role!.organization ? `Org: ${role!.organization.name}` : 'Org role'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {isReadOnly && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
              <strong>View-only.</strong> This role is managed by the platform and cannot be edited from your organization. Contact support if changes are needed.
            </div>
          )}
          {/* Basic fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Name</label>
              <input
                value={name} onChange={e => setName(e.target.value)} disabled={readOnlyMeta || (!isNew && role!.isSystem)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#635bff] disabled:opacity-60"
                placeholder="e.g. Senior Technician"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Icon</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_CHOICES.map(e => (
                  <button key={e} type="button" disabled={readOnlyMeta} onClick={() => !readOnlyMeta && setIcon(e)} className={`w-8 h-8 rounded-lg border text-lg transition-colors ${icon === e ? 'border-[#635bff] bg-[#635bff]/15' : 'border-[var(--border)] hover:border-[#635bff]/50'} disabled:opacity-60 disabled:cursor-not-allowed`}>{e}</button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Description</label>
              <textarea
                value={description ?? ''} onChange={e => setDescription(e.target.value)} disabled={readOnlyMeta}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#635bff] disabled:opacity-60"
                placeholder="What can people with this role do?"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Badge Color</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_CHOICES.map(c => (
                  <button key={c} type="button" disabled={readOnlyMeta} onClick={() => !readOnlyMeta && setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 ring-2 ring-offset-2 ring-[#635bff]' : 'border-transparent'} disabled:opacity-60 disabled:cursor-not-allowed`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            {isPlatformAdmin && isNew && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Scope</label>
                <select
                  value={orgId ? `org:${orgId}` : (isGlobal ? 'global' : 'global')}
                  onChange={e => {
                    const v = e.target.value;
                    if (v.startsWith('org:')) { setOrgId(v.slice(4)); setIsGlobal(false); }
                    else { setOrgId(''); setIsGlobal(true); }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#635bff]"
                >
                  <option value="global">🌐 Global — available to every org</option>
                  {organizations.map(o => (
                    <option key={o.id} value={`org:${o.id}`}>🏢 {o.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: color + '22', color }}>{icon}</div>
            <div className="min-w-0">
              <div className="font-semibold text-[var(--text-primary)] truncate">{name || 'New role preview'}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">{selectedKeys.size} permission{selectedKeys.size === 1 ? '' : 's'} selected</div>
            </div>
          </div>

          {/* Permission picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Permissions</h3>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedKeys(new Set(permissions.map(p => p.key)))} className="text-xs text-[#635bff] hover:text-[#4f46e5] font-semibold">Select all</button>
                  <button type="button" onClick={() => setSelectedKeys(new Set())} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold">Clear</button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(byCategory).map(([cat, perms]) => {
                const allOn = perms.every(p => selectedKeys.has(p.key));
                const someOn = perms.some(p => selectedKeys.has(p.key));
                return (
                  <div key={cat} className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <button type="button" onClick={() => toggleCategory(cat)} className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-2)]/70 transition-colors">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{cat}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${allOn ? 'bg-emerald-500/15 text-emerald-500' : someOn ? 'bg-amber-500/15 text-amber-500' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>
                        {perms.filter(p => selectedKeys.has(p.key)).length} / {perms.length}
                      </span>
                    </button>
                    <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {perms.map(p => (
                        <label key={p.key} className={`flex items-start gap-2 px-2 py-1.5 rounded text-sm ${isReadOnly ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[var(--bg-surface-2)] cursor-pointer'}`}>
                          <input type="checkbox" checked={selectedKeys.has(p.key)} onChange={() => !isReadOnly && toggleKey(p.key)} disabled={isReadOnly} className="mt-0.5 accent-[#635bff]" />
                          <div className="min-w-0">
                            <div className="text-[var(--text-primary)] truncate">{p.label}</div>
                            <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">{p.key}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-[#635bff] text-white text-sm font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : isNew ? 'Create Role' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
