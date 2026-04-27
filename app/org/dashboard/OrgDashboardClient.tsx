'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string; name: string | null; email: string; role: string;
  lastLoginAt: string | null; createdAt: string; activeWorkOrders: number;
}
interface PendingInvite {
  id: string; email: string; role: string;
  expires: string; createdAt: string;
  invitedBy: { name: string | null };
}
interface Machine {
  id: string; name: string; status: string; location: string | null;
}
interface WorkOrder {
  id: string; woNumber: string; title: string; status: string;
  priority: string; dueAt: string | null;
  machine: { name: string } | null;
  assignedTo: { name: string | null } | null;
  createdAt: string;
}
interface Stats {
  totalMembers: number; openWorkOrders: number; overdueWorkOrders: number;
  activeAlerts: number; criticalAlerts: number; sensorReadings24h: number;
  breakdownMachines: number;
}

interface OrgData {
  user: { id: string; name: string | null; email: string; role: string; organization: { id: string; name: string; plan: string; industry: string } };
  teamMembers: TeamMember[];
  pendingInvites: PendingInvite[];
  machines: Machine[];
  stats: Stats;
  recentWorkOrders: WorkOrder[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  OWNER:      { bg: 'rgba(249,115,22,0.12)',  color: '#f97316', border: 'rgba(249,115,22,0.3)'  },
  ADMIN:      { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6', border: 'rgba(139,92,246,0.3)'  },
  TECHNICIAN: { bg: 'rgba(99,91,255,0.12)',   color: '#635bff', border: 'rgba(99,91,255,0.3)'   },
  MEMBER:     { bg: 'rgba(148,163,184,0.12)', color: '#64748b', border: 'rgba(148,163,184,0.3)' },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  OPEN:        { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.12)',  color: '#d97706' },
  ON_HOLD:     { bg: 'rgba(148,163,184,0.12)', color: '#64748b' },
  COMPLETED:   { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#635bff', LOW: '#10b981',
};

const MACHINE_STATUS: Record<string, { color: string; dot: string; label: string }> = {
  OPERATIONAL: { color: '#10b981', dot: '#10b981', label: 'Operational' },
  MAINTENANCE:  { color: '#f59e0b', dot: '#f59e0b', label: 'Maintenance' },
  BREAKDOWN:    { color: '#ef4444', dot: '#ef4444', label: 'Breakdown'   },
  IDLE:         { color: '#64748b', dot: '#94a3b8', label: 'Idle'        },
};

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_COLORS[role] ?? ROLE_COLORS.MEMBER;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {role}
    </span>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = 'overview' | 'team' | 'machines' | 'workorders';

export default function OrgDashboardClient({ data }: { data: OrgData }) {
  const { user, teamMembers, pendingInvites, machines, stats, recentWorkOrders } = data;
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('TECHNICIAN');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [localInvites, setLocalInvites] = useState(pendingInvites);

  // Role update state
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteResult({ type: 'error', msg: data.error || 'Failed to send invitation' });
      } else {
        setInviteResult({ type: 'success', msg: `Invitation sent to ${inviteEmail}` });
        setInviteEmail('');
        // Optimistically add to pending list
        setLocalInvites(prev => [{
          id: data.invite?.id || Math.random().toString(),
          email: inviteEmail,
          role: inviteRole,
          expires: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          invitedBy: { name: user.name },
        }, ...prev]);
      }
    } catch {
      setInviteResult({ type: 'error', msg: 'Network error. Please try again.' });
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/team/invite?id=${inviteId}`, { method: 'DELETE' });
      if (res.ok) {
        setLocalInvites(prev => prev.filter(i => i.id !== inviteId));
      }
    } catch { /* silent */ }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdatingRole(memberId);
    try {
      await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });
    } catch { /* silent */ } finally {
      setUpdatingRole(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview',   label: 'Overview',    icon: '📊' },
    { id: 'team',       label: 'Team',        icon: '👥', badge: localInvites.length || undefined },
    { id: 'machines',   label: 'Machines',    icon: '⚙️', badge: stats.breakdownMachines || undefined },
    { id: 'workorders', label: 'Work Orders', icon: '📋', badge: stats.overdueWorkOrders || undefined },
  ];

  return (
    <div style={S.root}>

      {/* ── Topbar ── */}
      <header style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Myncel" style={{ width: 36, height: 36 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {user.organization.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Organization Admin Panel
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,91,255,0.1)', color: '#635bff', border: '1px solid rgba(99,91,255,0.25)', marginLeft: 4 }}>
            {user.organization.plan}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {stats.criticalAlerts > 0 && (
            <Link href="/dashboard" style={S.alertBadge}>
              🚨 {stats.criticalAlerts} Critical Alert{stats.criticalAlerts !== 1 ? 's' : ''}
            </Link>
          )}
          <button onClick={() => setShowInvite(true)} style={S.inviteBtn}>
            + Invite Team Member
          </button>
          <Link href="/dashboard" style={S.dashLink}>← User Dashboard</Link>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <nav style={S.tabNav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...S.tab,
              background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              borderBottom: activeTab === tab.id ? '2px solid #635bff' : '2px solid transparent',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge ? (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, marginLeft: 2 }}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main style={S.main}>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              {[
                { icon: '👥', label: 'Team Members',    value: stats.totalMembers,       color: '#635bff', sub: `${teamMembers.filter(m=>m.role==='TECHNICIAN').length} technicians` },
                { icon: '📋', label: 'Open Work Orders', value: stats.openWorkOrders,     color: '#3b82f6', sub: `${stats.overdueWorkOrders} overdue` },
                { icon: '🔔', label: 'Active Alerts',   value: stats.activeAlerts,        color: stats.activeAlerts > 0 ? '#ef4444' : '#10b981', sub: `${stats.criticalAlerts} critical/high` },
                { icon: '⚡', label: 'Sensor Readings', value: stats.sensorReadings24h,   color: '#10b981', sub: 'last 24 hours' },
                { icon: '⚙️', label: 'Machines',        value: machines.length,           color: '#f59e0b', sub: `${stats.breakdownMachines} breakdown` },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 18px' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Two-column: Team snapshot + Recent WOs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Team Snapshot */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Team Snapshot</span>
                  <button onClick={() => setActiveTab('team')} style={S.viewAllBtn}>View All →</button>
                </div>
                {teamMembers.slice(0, 5).map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99,91,255,0.15)', color: '#635bff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                      {(m.name || m.email).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || m.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.activeWorkOrders} active WOs · {timeAgo(m.lastLoginAt)}</div>
                    </div>
                    <RoleBadge role={m.role} />
                  </div>
                ))}
                {localInvites.length > 0 && (
                  <div style={{ padding: '10px 20px', background: 'var(--bg-page)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      📨 {localInvites.length} pending invite{localInvites.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Recent Work Orders */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Recent Work Orders</span>
                  <button onClick={() => setActiveTab('workorders')} style={S.viewAllBtn}>View All →</button>
                </div>
                {recentWorkOrders.slice(0, 5).map(wo => {
                  const sc = STATUS_COLORS[wo.status] ?? STATUS_COLORS.OPEN;
                  const isOverdue = wo.dueAt && new Date(wo.dueAt) < new Date() && wo.status !== 'COMPLETED';
                  return (
                    <div key={wo.id} style={{ padding: '11px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wo.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {wo.machine?.name} · {wo.assignedTo?.name || 'Unassigned'}
                            {isOverdue && <span style={{ color: '#ef4444', marginLeft: 6, fontWeight: 700 }}>⚠ Overdue</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                          {wo.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontSize: 15 }}>⚡ Quick Actions</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { href: '/work-orders/new',       icon: '➕', label: 'Create Work Order', color: '#635bff' },
                  { href: '/equipment',             icon: '⚙️', label: 'Manage Machines',   color: '#10b981' },
                  { href: '/dashboard',             icon: '🖥️', label: 'Full Dashboard',    color: '#3b82f6' },
                  { href: '/settings/api-keys',     icon: '🔑', label: 'API Keys',           color: '#f59e0b' },
                  { href: '/equipment/qr-labels',   icon: '📱', label: 'Print QR Labels',   color: '#8b5cf6' },
                  { href: '/setup',                 icon: '⚡', label: 'Setup Wizard',       color: '#06b6d4' },
                ].map(a => (
                  <Link key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: 'var(--bg-page)', border: '1px solid var(--border)', textDecoration: 'none', fontSize: 13, fontWeight: 600, color: a.color }}>
                    <span>{a.icon}</span><span>{a.label}</span>
                  </Link>
                ))}
                <button onClick={() => setShowInvite(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#635bff' }}>
                  <span>👤</span><span>Invite Technician</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-5">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', margin: 0 }}>Team Members</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} · {localInvites.length} pending invite{localInvites.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setShowInvite(true)} style={S.inviteBtn}>+ Invite Team Member</button>
            </div>

            {/* Active Members */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>Active Members</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-page)' }}>
                      {['Member', 'Role', 'Active WOs', 'Last Login', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,91,255,0.15)', color: '#635bff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                              {(m.name || m.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name || '(no name)'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            defaultValue={m.role}
                            disabled={m.role === 'OWNER' || updatingRole === m.id}
                            onChange={e => handleRoleChange(m.id, e.target.value)}
                            style={{ fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-primary)', cursor: m.role === 'OWNER' ? 'not-allowed' : 'pointer' }}
                          >
                            <option value="OWNER" disabled>OWNER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="TECHNICIAN">TECHNICIAN</option>
                            <option value="MEMBER">MEMBER</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {m.activeWorkOrders > 0 ? (
                            <span style={{ color: '#635bff' }}>{m.activeWorkOrders} open</span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{timeAgo(m.lastLoginAt)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link href={`/dashboard`} style={{ fontSize: 11, fontWeight: 600, color: '#635bff', textDecoration: 'none', padding: '4px 10px', borderRadius: 6, background: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.2)' }}>
                              View WOs
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Invites */}
            {localInvites.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>📨 Pending Invitations</span>
                </div>
                {localInvites.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        📧
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{inv.email}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Invited by {inv.invitedBy.name || 'Admin'} · expires {new Date(inv.expires).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <RoleBadge role={inv.role} />
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Machines Tab */}
        {activeTab === 'machines' && (
          <div className="space-y-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', margin: 0 }}>Machines</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {machines.length} registered · {stats.breakdownMachines} breakdown
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/equipment/qr-labels" style={{ ...S.inviteBtn, textDecoration: 'none' }}>📱 Print QR Labels</Link>
                <Link href="/equipment" style={{ ...S.dashLink, textDecoration: 'none' }}>Manage →</Link>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {machines.map(m => {
                const s = MACHINE_STATUS[m.status] ?? MACHINE_STATUS.IDLE;
                return (
                  <div key={m.id} style={{ background: 'var(--bg-surface)', border: `1px solid var(--border)`, borderLeft: `3px solid ${s.color}`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{m.name}</div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: s.color, background: `${s.color}18`, padding: '3px 8px', borderRadius: 999 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                        {s.label}
                      </span>
                    </div>
                    {m.location && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {m.location}</div>}
                  </div>
                );
              })}
              {machines.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  No machines registered yet. <Link href="/equipment/new" style={{ color: '#635bff' }}>Add one →</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Work Orders Tab */}
        {activeTab === 'workorders' && (
          <div className="space-y-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', margin: 0 }}>Work Orders</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {stats.openWorkOrders} open · {stats.overdueWorkOrders} overdue
                </p>
              </div>
              <Link href="/work-orders" style={{ ...S.inviteBtn, textDecoration: 'none' }}>View All Work Orders →</Link>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-page)' }}>
                      {['WO #', 'Title', 'Machine', 'Assigned To', 'Priority', 'Status', 'Due Date'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentWorkOrders.map(wo => {
                      const sc = STATUS_COLORS[wo.status] ?? STATUS_COLORS.OPEN;
                      const pc = PRIORITY_COLORS[wo.priority] ?? '#635bff';
                      const isOverdue = wo.dueAt && new Date(wo.dueAt) < new Date() && wo.status !== 'COMPLETED';
                      return (
                        <tr key={wo.id} style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                        >
                          <td style={{ padding: '11px 14px', color: '#635bff', fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{wo.woNumber}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--text-primary)', fontWeight: 600, maxWidth: 200 }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wo.title}</div>
                          </td>
                          <td style={{ padding: '11px 14px', color: 'var(--text-secondary)' }}>{wo.machine?.name || '—'}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--text-secondary)' }}>{wo.assignedTo?.name || <span style={{ color: '#ef4444', fontWeight: 600 }}>Unassigned</span>}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: pc, background: `${pc}18`, padding: '3px 8px', borderRadius: 999 }}>{wo.priority}</span>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, padding: '3px 8px', borderRadius: 6 }}>{wo.status.replace('_', ' ')}</span>
                          </td>
                          <td style={{ padding: '11px 14px', color: isOverdue ? '#ef4444' : 'var(--text-secondary)', fontWeight: isOverdue ? 700 : 400, fontSize: 12 }}>
                            {wo.dueAt ? new Date(wo.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            {isOverdue && ' ⚠'}
                          </td>
                        </tr>
                      );
                    })}
                    {recentWorkOrders.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No work orders yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Invite Modal ── */}
      {showInvite && (
        <div style={S.modalOverlay} onClick={() => setShowInvite(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>
                👤 Invite Team Member
              </h3>
              <button onClick={() => setShowInvite(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
              Send an invitation email with a secure join link. The recipient will set their own password.
            </p>

            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="technician@company.com"
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg-page)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg-page)', color: 'var(--text-primary)' }}
                >
                  <option value="TECHNICIAN">🔧 Technician — View & complete assigned tasks</option>
                  <option value="ADMIN">⚙️ Admin — Manage team, machines & work orders</option>
                  <option value="MEMBER">👤 Member — View dashboards and reports</option>
                </select>
              </div>

              {inviteResult && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: 14,
                  background: inviteResult.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: inviteResult.type === 'success' ? '#059669' : '#b91c1c',
                  border: `1px solid ${inviteResult.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  {inviteResult.type === 'success' ? '✅' : '⚠️'} {inviteResult.msg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInvite(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                  Cancel
                </button>
                <button type="submit" disabled={inviting} style={{ padding: '10px 24px', borderRadius: 10, background: inviting ? '#a5b4fc' : '#635bff', color: '#fff', border: 'none', fontWeight: 700, cursor: inviting ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                  {inviting ? 'Sending…' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .space-y-4 > * + * { margin-top: 16px; }
        .space-y-5 > * + * { margin-top: 20px; }
        .space-y-6 > * + * { margin-top: 24px; }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  root: { minHeight: '100vh', background: 'var(--bg-page)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: 'var(--bg-nav)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' as const, gap: 10, position: 'sticky' as const, top: 0, zIndex: 50 },
  tabNav: { display: 'flex', gap: 0, padding: '0 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', overflowX: 'auto' as const },
  tab: { display: 'flex', alignItems: 'center', gap: 6, padding: '13px 18px', fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' as const, background: 'transparent' },
  main: { padding: '24px', maxWidth: 1400, margin: '0 auto' },
  inviteBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#635bff', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' as const },
  dashLink: { display: 'inline-flex', alignItems: 'center', padding: '9px 16px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, textDecoration: 'none' as const },
  alertBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontWeight: 700, fontSize: 13, textDecoration: 'none' as const, animation: 'pulse 2s infinite' as const },
  viewAllBtn: { fontSize: 12, color: '#635bff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 },
  modalOverlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: 'var(--bg-surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border)' },
};