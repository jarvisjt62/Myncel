'use client';

/**
 * RolesTab — org-scoped roles & permissions management for the user dashboard.
 *
 * Visible to Owners / Admins (the parent gates rendering). Fetches roles + permissions
 * + team members from APIs on mount. Lets the org:
 *   - view system + global + own-org roles
 *   - create/edit/delete its own custom roles
 *   - assign multiple roles per team member
 *
 * Uses the same RoleEditorModal as the platform admin.
 */

import { useState, useEffect, useMemo } from 'react';
import type { PermissionDef, RoleWithMeta } from '../admin/roles/types';
import { roleScope } from '../admin/roles/types';
import RoleEditorModal from '../admin/roles/RoleEditorModal';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string; // legacy enum
  image: string | null;
  roleAssignments: { roleId: string; role: { id: string; name: string; color: string | null; icon: string | null; slug: string } }[];
}

interface Props {
  currentUserRole: string;
  organizationId: string;
}

const SCOPE_BADGE: Record<'system'|'global'|'org', { label: string; cls: string }> = {
  system: { label: 'Built-in', cls: 'bg-purple-500/15 text-purple-500 border-purple-500/30' },
  global: { label: 'Global',   cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  org:    { label: 'Custom',   cls: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
};

export default function RolesTab({ currentUserRole, organizationId }: Props) {
  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const [loading, setLoading]   = useState(true);
  const [roles, setRoles]       = useState<RoleWithMeta[]>([]);
  const [perms, setPerms]       = useState<PermissionDef[]>([]);
  const [team, setTeam]         = useState<TeamMember[]>([]);
  const [editing, setEditing]   = useState<RoleWithMeta | null>(null);
  const [creating, setCreating] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState<string | null>(null);
  const [toast, setToast]       = useState<{ type: 'success'|'error'; text: string } | null>(null);
  const [view, setView]         = useState<'roles' | 'members'>('roles');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rolesRes, permsRes, teamRes] = await Promise.all([
          fetch('/api/org/roles'),
          fetch('/api/permissions/catalog'),
          fetch('/api/team?includeRoles=1'),
        ]);
        if (rolesRes.ok) setRoles((await rolesRes.json()).roles || []);
        if (permsRes.ok) setPerms((await permsRes.json()).permissions || []);
        if (teamRes.ok)  setTeam((await teamRes.json()).members || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function showToast(type: 'success'|'error', text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  }

  function onRoleSaved(role: RoleWithMeta, wasNew: boolean) {
    setRoles(prev => wasNew ? [role, ...prev] : prev.map(x => x.id === role.id ? role : x));
    setEditing(null);
    setCreating(false);
    showToast('success', wasNew ? 'Role created' : 'Role updated');
  }

  async function deleteRole(r: RoleWithMeta) {
    if (r.isSystem || r.isGlobal) return showToast('error', 'This role is managed by the platform and cannot be deleted here.');
    if (r.organizationId !== organizationId) return showToast('error', 'This role does not belong to your org.');
    if (!confirm(`Delete role "${r.name}"? It will be unassigned from any member.`)) return;
    const res = await fetch(`/api/org/roles/${r.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return showToast('error', data.error || 'Failed');
    setRoles(prev => prev.filter(x => x.id !== r.id));
    showToast('success', 'Role deleted');
  }

  const visibleRoles = useMemo(() => roles.filter(r => !r.isDisabled), [roles]);
  const assignTarget = assignMemberId ? team.find(m => m.id === assignMemberId) : null;

  if (loading) {
    return <div className="py-16 text-center text-[var(--text-muted)] text-sm">Loading roles…</div>;
  }

  if (!canManage) {
    return (
      <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-8 text-center">
        <p className="text-[var(--text-secondary)] text-sm">Only Owners and Admins can manage roles and permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* View tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex p-1 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)]">
          <button onClick={() => setView('roles')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === 'roles' ? 'bg-[#635bff] text-white' : 'text-[var(--text-secondary)]'}`}>Roles</button>
          <button onClick={() => setView('members')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === 'members' ? 'bg-[#635bff] text-white' : 'text-[var(--text-secondary)]'}`}>Members</button>
        </div>
        {view === 'roles' && (
          <button onClick={() => setCreating(true)} className="px-4 py-2 rounded-lg bg-[#635bff] text-white text-sm font-semibold hover:bg-[#4f46e5]">+ Create Custom Role</button>
        )}
      </div>

      {view === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleRoles.map(r => {
            const sc = roleScope(r);
            const meta = SCOPE_BADGE[sc];
            const isOwnCustom = sc === 'org' && r.organizationId === organizationId;
            return (
              <div key={r.id} className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg" style={{ backgroundColor: (r.color ?? '#635bff') + '22', color: r.color ?? '#635bff' }}>
                      {r.icon ?? '🔖'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[var(--text-primary)] truncate">{r.name}</span>
                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-full font-semibold border whitespace-nowrap ${meta.cls}`}>{meta.label}</span>
                      </div>
                      {r.description && <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{r.description}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>{r.permissions.length} permission{r.permissions.length === 1 ? '' : 's'}</span>
                  <span>{r._count?.assignments ?? 0} member{(r._count?.assignments ?? 0) === 1 ? '' : 's'}</span>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <button onClick={() => setEditing(r)} className="text-xs font-semibold text-[#635bff] hover:text-[#4f46e5] px-3 py-1.5 rounded-lg bg-[#635bff]/10 hover:bg-[#635bff]/15">
                    Edit
                  </button>
                  {isOwnCustom && (
                    <button onClick={() => deleteRole(r)} className="text-xs font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
                  )}
                  {!isOwnCustom && (
                    <span className="text-[10px] text-[var(--text-muted)] italic">Editing creates an org-scoped copy</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'members' && (
        <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-surface-2)] text-[var(--text-secondary)]">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase">Member</th>
                  <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase hidden md:table-cell">Legacy role</th>
                  <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase">Assigned roles</th>
                  <th className="text-right px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map(m => (
                  <tr key={m.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-surface-2)]">
                    <td className="px-3 sm:px-4 py-3 min-w-[140px]">
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate">{m.name || m.email}</div>
                        <div className="text-xs text-[var(--text-muted)] truncate">{m.email}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-semibold bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-secondary)]">{m.role}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.roleAssignments.length === 0 ? (
                          <span className="text-xs text-[var(--text-muted)]">None assigned</span>
                        ) : m.roleAssignments.map(a => (
                          <span key={a.roleId} className="text-[11px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap" style={{ backgroundColor: (a.role.color ?? '#635bff') + '22', color: a.role.color ?? '#635bff', borderColor: (a.role.color ?? '#635bff') + '55' }}>
                            {a.role.icon} {a.role.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setAssignMemberId(m.id)} className="text-xs font-semibold text-[#635bff] hover:text-[#4f46e5] px-2 py-1 rounded hover:bg-[#635bff]/10">Manage roles</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(editing || creating) && (
        <RoleEditorModal
          role={editing}
          permissions={perms}
          isPlatformAdmin={false}
          forceOrgId={organizationId}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={onRoleSaved}
        />
      )}

      {assignTarget && (
        <AssignRolesModal
          member={assignTarget}
          roles={visibleRoles}
          onClose={() => setAssignMemberId(null)}
          onSaved={(roleIds) => {
            setTeam(prev => prev.map(m => m.id === assignTarget.id ? {
              ...m,
              roleAssignments: roleIds.map(rid => {
                const r = roles.find(x => x.id === rid)!;
                return { roleId: rid, role: { id: r.id, name: r.name, color: r.color, icon: r.icon, slug: r.slug } };
              }),
            } : m));
            setAssignMemberId(null);
            showToast('success', 'Roles updated');
          }}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{toast.text}</div>
      )}
    </div>
  );
}

function AssignRolesModal({ member, roles, onClose, onSaved }: {
  member: TeamMember;
  roles: RoleWithMeta[];
  onClose: () => void;
  onSaved: (roleIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(member.roleAssignments.map(a => a.roleId)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/team/${member.id}/roles`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roleIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSaved(Array.from(selected));
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-md max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl [background:var(--bg-surface)] border border-[var(--border)] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Assign Roles</h2>
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{member.name || member.email}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {roles.map(r => (
            <label key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-surface-2)] cursor-pointer">
              <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="accent-[#635bff]" />
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ backgroundColor: (r.color ?? '#635bff') + '22', color: r.color ?? '#635bff' }}>
                {r.icon ?? '🔖'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[var(--text-primary)] text-sm truncate">{r.name}</div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">{r.permissions.length} permissions</div>
              </div>
            </label>
          ))}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-4 sm:px-6 py-3 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-[#635bff] text-white text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
