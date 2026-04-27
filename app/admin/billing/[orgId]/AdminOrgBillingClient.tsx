'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrgData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  userCount: number;
  machineCount: number;
  workOrderCount: number;
  users: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  changes: string | null;
  createdAt: string;
  userName: string | null;
}

interface Props {
  org: OrgData;
  auditLogs: AuditLogEntry[];
  stripeConfigured: boolean;
}

const PLANS = ['TRIAL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];
const PLAN_COLORS: Record<string, string> = {
  TRIAL: '#f59e0b',
  STARTER: '#6366f1',
  GROWTH: '#10b981',
  PROFESSIONAL: '#8b5cf6',
  ENTERPRISE: '#ec4899',
};
const PLAN_PRICES: Record<string, string> = {
  TRIAL: 'Free',
  STARTER: '$49/mo',
  GROWTH: '$99/mo',
  PROFESSIONAL: '$249/mo',
  ENTERPRISE: 'Custom',
};

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:   { label: 'Active',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    trialing: { label: 'Trial',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    past_due: { label: 'Past Due',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    canceled: { label: 'Canceled',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    unpaid:   { label: 'Unpaid',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    paused:   { label: 'Paused',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  };
  const s = map[status ?? ''] ?? { label: status ?? '—', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: s.color, background: s.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

export default function AdminOrgBillingClient({ org, auditLogs, stripeConfigured }: Props) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(org.plan);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const handlePlanChange = async () => {
    setSaving(true);
    setShowConfirm(false);
    try {
      const res = await fetch(`/api/admin/billing/${org.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update plan');
      showToast('success', `Plan updated to ${selectedPlan} successfully`);
      router.refresh();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Cancel this organization\'s subscription at period end?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/billing/${org.id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      showToast('success', 'Subscription will be canceled at period end');
      router.refresh();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.text}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14 }}>
        <Link href="/admin/billing" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          ← Billing Overview
        </Link>
        <span style={{ color: 'var(--text-secondary)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{org.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {org.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>/{org.slug}</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 12,
              color: PLAN_COLORS[org.plan], background: PLAN_COLORS[org.plan] + '20',
            }}>{org.plan}</span>
            <StatusBadge status={org.subscriptionStatus} />
            {org.cancelAtPeriodEnd && (
              <span style={{
                fontSize: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 600,
                color: '#ef4444', background: 'rgba(239,68,68,0.1)',
              }}>⚠️ Cancels at period end</span>
            )}
          </div>
        </div>
        {org.stripeCustomerId && (
          <a
            href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`}
            target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            🔗 View in Stripe
          </a>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['overview', 'users', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 18px', fontSize: 14, fontWeight: 600, border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, textTransform: 'capitalize',
            }}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'users' ? '👥 Members' : '📋 Activity'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Billing Info Card */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 24,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>
              💳 Billing Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Current Plan', value: <span style={{ fontWeight: 700, color: PLAN_COLORS[org.plan] }}>{org.plan}</span> },
                { label: 'Status', value: <StatusBadge status={org.subscriptionStatus} /> },
                { label: 'Monthly Price', value: PLAN_PRICES[org.plan] },
                { label: 'Period End', value: org.currentPeriodEnd ? new Date(org.currentPeriodEnd).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—' },
                { label: 'Trial Ends', value: org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—' },
                { label: 'Stripe Customer', value: org.stripeCustomerId ? <code style={{ fontSize: 11, background: 'var(--bg-surface-2)', padding: '2px 6px', borderRadius: 4 }}>{org.stripeCustomerId.slice(0, 20)}…</code> : '—' },
                { label: 'Subscription ID', value: org.stripeSubscriptionId ? <code style={{ fontSize: 11, background: 'var(--bg-surface-2)', padding: '2px 6px', borderRadius: 4 }}>{org.stripeSubscriptionId.slice(0, 20)}…</code> : '—' },
                { label: 'Member Since', value: new Date(org.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 24,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                📈 Usage
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Users', value: org.userCount, icon: '👥' },
                  { label: 'Machines', value: org.machineCount, icon: '⚙️' },
                  { label: 'Work Orders', value: org.workOrderCount, icon: '📋' },
                ].map(item => (
                  <div key={item.label} style={{
                    textAlign: 'center', padding: '16px 8px',
                    background: 'var(--bg-surface-2)', borderRadius: 8,
                  }}>
                    <div style={{ fontSize: 22 }}>{item.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Plan Card */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 24,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                🔄 Change Plan
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                Manually override this organization's plan. This bypasses Stripe and directly updates the database.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {PLANS.map(plan => (
                  <label key={plan} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: selectedPlan === plan ? `2px solid ${PLAN_COLORS[plan]}` : '2px solid var(--border)',
                    background: selectedPlan === plan ? PLAN_COLORS[plan] + '10' : 'var(--bg-surface-2)',
                    transition: 'all 0.15s',
                  }}>
                    <input
                      type="radio"
                      name="plan"
                      value={plan}
                      checked={selectedPlan === plan}
                      onChange={() => setSelectedPlan(plan)}
                      style={{ accentColor: PLAN_COLORS[plan] }}
                    />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: selectedPlan === plan ? PLAN_COLORS[plan] : 'var(--text-primary)' }}>
                      {plan}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{PLAN_PRICES[plan]}</span>
                    {plan === org.plan && (
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>current</span>
                    )}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={selectedPlan === org.plan || saving}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                    background: selectedPlan !== org.plan ? 'var(--accent)' : 'var(--bg-surface-2)',
                    color: selectedPlan !== org.plan ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600, fontSize: 14, cursor: selectedPlan !== org.plan ? 'pointer' : 'not-allowed',
                  }}
                >
                  {saving ? 'Saving…' : `Apply ${selectedPlan}`}
                </button>
                {org.subscriptionStatus === 'active' && !org.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={saving}
                    style={{
                      padding: '10px 16px', borderRadius: 8,
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Cancel Sub
                  </button>
                )}
              </div>

              {/* Confirm modal */}
              {showConfirm && (
                <div style={{
                  marginTop: 14, padding: 16, borderRadius: 8,
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 12px', fontWeight: 600 }}>
                    ⚠️ Change {org.name}'s plan from {org.plan} → {selectedPlan}?
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                    This directly updates the database. It won't affect any active Stripe subscription.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handlePlanChange} style={{
                      padding: '7px 16px', borderRadius: 6, border: 'none',
                      background: '#f59e0b', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}>Confirm</button>
                    <button onClick={() => setShowConfirm(false)} style={{
                      padding: '7px 16px', borderRadius: 6, background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'users' && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Members ({org.userCount})
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-2)' }}>
                {['Name', 'Email', 'Role', 'Joined'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {org.users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < org.users.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      color: u.role === 'ADMIN' ? '#8b5cf6' : u.role === 'MANAGER' ? '#6366f1' : '#6b7280',
                      background: u.role === 'ADMIN' ? 'rgba(139,92,246,0.1)' : u.role === 'MANAGER' ? 'rgba(99,102,241,0.1)' : 'rgba(107,114,128,0.1)',
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                </tr>
              ))}
              {org.users.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Activity Log ({auditLogs.length} entries)
            </h2>
          </div>
          <div style={{ padding: '8px 0' }}>
            {auditLogs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                No activity recorded yet.
              </div>
            ) : (
              auditLogs.map((log, i) => (
                <div key={log.id} style={{
                  display: 'flex', gap: 14, padding: '12px 24px',
                  borderBottom: i < auditLogs.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--bg-surface-2)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>
                    {log.action.includes('DELETE') ? '🗑️'
                      : log.action.includes('CREATE') ? '✨'
                      : log.action.includes('UPDATE') ? '✏️'
                      : log.action.includes('LOGIN') ? '🔐'
                      : log.action.includes('BILLING') || log.action.includes('PAYMENT') || log.action.includes('SUBSCRIPTION') ? '💳'
                      : '📋'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                          {log.action}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                          on {log.entity}
                          {log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                        {new Date(log.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {log.userName && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        by {log.userName}
                      </div>
                    )}
                    {log.changes && (
                      <details style={{ marginTop: 6 }}>
                        <summary style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>View changes</summary>
                        <pre style={{
                          marginTop: 6, padding: '8px 12px', borderRadius: 6,
                          background: 'var(--bg-surface-2)', fontSize: 11,
                          color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 120,
                        }}>
                          {JSON.stringify(JSON.parse(log.changes), null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}