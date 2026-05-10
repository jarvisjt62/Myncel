import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Billing Overview — Admin' };

const PLAN_COLORS: Record<string, string> = {
  TRIAL:        '#f59e0b',
  STARTER:      '#6366f1',
  GROWTH:       '#10b981',
  PROFESSIONAL: '#8b5cf6',
  ENTERPRISE:   '#ec4899',
};

const PLAN_PRICES: Record<string, number> = {
  TRIAL: 0,
  STARTER: 49,
  GROWTH: 99,
  PROFESSIONAL: 249,
  ENTERPRISE: 0,
};

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:            { label: 'Active',      color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    trialing:          { label: 'Trial',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    past_due:          { label: 'Past Due',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    canceled:          { label: 'Canceled',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    incomplete:        { label: 'Incomplete',  color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    incomplete_expired:{ label: 'Expired',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    unpaid:            { label: 'Unpaid',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    paused:            { label: 'Paused',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  };
  const s = map[status ?? 'trialing'] ?? { label: status ?? '—', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: s.color, background: s.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

export default async function AdminBillingPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') redirect('/admin');

  // Fetch all organizations with counts
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, machines: true, workOrders: true } },
    },
  });

  // Aggregate stats
  const totalOrgs = orgs.length;
  const planDist = orgs.reduce<Record<string, number>>((acc, o) => {
    acc[o.plan] = (acc[o.plan] ?? 0) + 1;
    return acc;
  }, {});
  const activeSubscriptions = orgs.filter(o => o.subscriptionStatus === 'active').length;
  const trialOrgs = orgs.filter(o => o.subscriptionStatus === 'trialing' || o.plan === 'TRIAL').length;
  const pastDueOrgs = orgs.filter(o => o.subscriptionStatus === 'past_due').length;
  const canceledOrgs = orgs.filter(o => o.subscriptionStatus === 'canceled').length;

  // Estimated MRR (monthly recurring revenue)
  const mrr = orgs.reduce((sum, o) => {
    if (o.subscriptionStatus === 'active') {
      return sum + (PLAN_PRICES[o.plan] ?? 0);
    }
    return sum;
  }, 0);

  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          💳 Billing Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 15 }}>
          Manage subscriptions, plans, and billing activities across all organizations.
        </p>
        {!stripeConfigured && (
          <div style={{
            marginTop: 12, padding: '10px 16px', borderRadius: 8,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠️ <strong>Demo Mode</strong> — Stripe is not configured. Add{' '}
            <code style={{ background: 'rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: 4 }}>
              STRIPE_SECRET_KEY
            </code>{' '}
            to environment variables to enable live billing.
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Organizations', value: totalOrgs, icon: '🏢', color: '#6366f1' },
          { label: 'Active Subscriptions', value: activeSubscriptions, icon: '✅', color: '#10b981' },
          { label: 'On Trial', value: trialOrgs, icon: '⏳', color: '#f59e0b' },
          { label: 'Past Due', value: pastDueOrgs, icon: '⚠️', color: '#ef4444' },
          { label: 'Canceled', value: canceledOrgs, icon: '🚫', color: '#6b7280' },
          { label: 'Est. MRR', value: `$${mrr.toLocaleString()}`, icon: '💰', color: '#8b5cf6' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 32 }}>
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>
            Plan Distribution
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['TRIAL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] as const).map(plan => {
              const count = planDist[plan] ?? 0;
              const pct = totalOrgs > 0 ? Math.round((count / totalOrgs) * 100) : 0;
              return (
                <div key={plan}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{plan}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-surface-2)' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${pct}%`, background: PLAN_COLORS[plan],
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px' }}>
            Recent Organizations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orgs.slice(0, 6).map(org => (
              <Link key={org.id} href={`/admin/billing/${org.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-surface-2)',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: PLAN_COLORS[org.plan] + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>
                    🏢
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {org.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {org._count.users} users · {org._count.machines} machines
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      color: PLAN_COLORS[org.plan],
                      background: PLAN_COLORS[org.plan] + '20',
                    }}>{org.plan}</span>
                    <StatusBadge status={org.subscriptionStatus} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Full Organizations Table */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            All Organizations — Billing Status
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{totalOrgs} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-2)' }}>
                {['Organization', 'Plan', 'Status', 'Users', 'Machines', 'Work Orders', 'Current Period End', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map((org, i) => (
                <tr key={org.id} style={{
                  borderBottom: i < orgs.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{org.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>/{org.slug}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                      color: PLAN_COLORS[org.plan], background: PLAN_COLORS[org.plan] + '20',
                    }}>{org.plan}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={org.subscriptionStatus} />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-primary)', textAlign: 'center' }}>
                    {org._count.users}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-primary)', textAlign: 'center' }}>
                    {org._count.machines}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--text-primary)', textAlign: 'center' }}>
                    {org._count.workOrders}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {org.currentPeriodEnd
                      ? new Date(org.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : org.trialEndsAt
                        ? `Trial ends ${new Date(org.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : '—'
                    }
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/admin/billing/${org.id}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '5px 12px', borderRadius: 6,
                      background: 'var(--accent)', color: '#fff',
                      fontSize: 12, fontWeight: 600, textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No organizations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}