import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';

// Force dynamic rendering to avoid caching
export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get super admin org ID to exclude from stats
  const superAdminOrgId = await getSuperAdminOrgId();
  const excludeOrg = superAdminOrgId ? { id: { not: superAdminOrgId } } : {};
  const excludeOrgData = superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {};

  // Run all queries with error handling — all exclude super admin org
  const [
    totalUsers,
    totalOrgs,
    totalMachines,
    totalAlerts,
    paidOrgs,
    trialOrgs,
    newUsersThisMonth,
    newOrgsThisMonth,
    newUsersLastMonth,
    newOrgsLastMonth,
    activeAlerts,
    criticalAlerts,
    recentUsers,
    recentOrgs,
    planBreakdown,
    recentWorkOrders,
    openWorkOrders,
    overdueWorkOrders,
    breakdownMachines,
    recentSignups7d,
    totalSensorReadings,
    sensorReadings24h,
    totalApiKeys,
    breakdownAlerts,
    mqttReadings,
  ] = await Promise.all([
    safeQuery(db.user.count({ where: superAdminOrgId ? { organizationId: { not: superAdminOrgId }, email: { not: 'admin@myncel.com' } } : {} }), 0),
    safeQuery(db.organization.count({ where: excludeOrg }), 0),
    safeQuery(db.machine.count({ where: excludeOrgData }), 0),
    safeQuery(db.alert.count({ where: { isResolved: false, ...excludeOrgData } }), 0),
    safeQuery(db.organization.count({ where: { plan: { in: ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] }, ...excludeOrg } }), 0),
    safeQuery(db.organization.count({ where: { plan: 'TRIAL', ...excludeOrg } }), 0),
    safeQuery(db.user.count({ where: { createdAt: { gte: startOfMonth }, ...(superAdminOrgId ? { organizationId: { not: superAdminOrgId }, email: { not: 'admin@myncel.com' } } : {}) } }), 0),
    safeQuery(db.organization.count({ where: { createdAt: { gte: startOfMonth }, ...excludeOrg } }), 0),
    safeQuery(db.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, ...(superAdminOrgId ? { organizationId: { not: superAdminOrgId }, email: { not: 'admin@myncel.com' } } : {}) } }), 0),
    safeQuery(db.organization.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, ...excludeOrg } }), 0),
    safeQuery(db.alert.count({ where: { isResolved: false, ...excludeOrgData } }), 0),
    safeQuery(db.alert.count({ where: { isResolved: false, severity: { in: ['CRITICAL', 'HIGH'] }, ...excludeOrgData } }), 0),
    safeQuery(db.user.findMany({
      where: superAdminOrgId ? { email: { not: 'admin@myncel.com' }, organizationId: { not: superAdminOrgId } } : {},
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { organization: { select: { name: true, plan: true } } },
    }), []),
    safeQuery(db.organization.findMany({
      where: excludeOrg,
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        _count: { select: { users: true, machines: true, workOrders: true } },
        users: { where: { role: 'OWNER' }, select: { email: true, name: true }, take: 1 },
      },
    }), []),
    safeQuery(db.organization.groupBy({ by: ['plan'], where: excludeOrg, _count: { _all: true }, orderBy: { _count: { plan: 'desc' } } }), []),
    safeQuery(db.workOrder.findMany({
      where: excludeOrgData,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        machine: { select: { name: true } },
        organization: { select: { name: true } },
      },
    }), []),
    safeQuery(db.workOrder.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, ...excludeOrgData } }), 0),
    safeQuery(db.workOrder.count({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueAt: { lt: now },
        ...excludeOrgData,
      },
    }), 0),
    safeQuery(db.machine.count({ where: { status: 'BREAKDOWN', ...excludeOrgData } }), 0),
    safeQuery(db.organization.count({ where: { createdAt: { gte: last7Days }, ...excludeOrg } }), 0),
    safeQuery(db.sensorReading.count({}), 0),
    safeQuery(db.sensorReading.count({ where: { recordedAt: { gte: new Date(Date.now() - 24*60*60*1000) } } }), 0),
    safeQuery(db.integration.count({ where: { type: 'ZAPIER', status: 'CONNECTED' } }), 0),
    safeQuery(db.alert.count({ where: { type: 'MACHINE_BREAKDOWN', isResolved: false } }), 0),
    safeQuery(db.sensorReading.count({ where: { recordedAt: { gte: new Date(Date.now() - 60*60*1000) } } }), 0),
  ]);

  const userGrowth = newUsersLastMonth > 0 ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100) : null;
  const orgGrowth = newOrgsLastMonth > 0 ? Math.round(((newOrgsThisMonth - newOrgsLastMonth) / newOrgsLastMonth) * 100) : null;
  const paidRate = totalOrgs > 0 ? Math.round((paidOrgs / totalOrgs) * 100) : 0;

  const isPaidPlan = (plan: string) => ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Platform Overview
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/organizations?filter=paid"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}
          >
            💰 {paidOrgs} Paid Client{paidOrgs !== 1 ? 's' : ''}
          </Link>
          {(criticalAlerts > 0 || breakdownMachines > 0) && (
            <div
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg animate-pulse"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
            >
              🚨 {criticalAlerts} Critical Alert{criticalAlerts !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Users',
            value: totalUsers,
            sub: `+${newUsersThisMonth} this month`,
            growth: userGrowth,
            icon: '👥',
            href: '/admin/users',
            accentColor: '#635bff',
            accentAlpha: 'rgba(99,91,255,0.12)',
            accentBorder: 'rgba(99,91,255,0.3)',
          },
          {
            label: 'Organizations',
            value: totalOrgs,
            sub: `+${newOrgsThisMonth} this month`,
            growth: orgGrowth,
            icon: '🏢',
            href: '/admin/organizations',
            accentColor: '#3b82f6',
            accentAlpha: 'rgba(59,130,246,0.12)',
            accentBorder: 'rgba(59,130,246,0.3)',
          },
          {
            label: 'Machines Tracked',
            value: totalMachines,
            sub: breakdownMachines > 0 ? `⚠ ${breakdownMachines} in breakdown` : 'All systems healthy',
            icon: '⚙️',
            href: '/admin/machines',
            accentColor: breakdownMachines > 0 ? '#ef4444' : '#10b981',
            accentAlpha: breakdownMachines > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            accentBorder: breakdownMachines > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
          },
          {
            label: 'Active Alerts',
            value: activeAlerts,
            sub: criticalAlerts > 0 ? `🚨 ${criticalAlerts} critical/high` : 'No critical issues',
            icon: '🔔',
            href: '/admin/alerts',
            accentColor: activeAlerts > 0 ? '#ef4444' : '#10b981',
            accentAlpha: activeAlerts > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            accentBorder: activeAlerts > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl p-5 hover:scale-[1.02] transition-transform cursor-pointer block"
            style={{
              background: stat.accentAlpha,
              border: `1px solid ${stat.accentBorder}`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              {stat.growth !== null && stat.growth !== undefined && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: stat.growth >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: stat.growth >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {stat.growth >= 0 ? '↑' : '↓'} {Math.abs(stat.growth)}%
                </span>
              )}
            </div>
            <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{stat.label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{stat.sub}</div>
          </Link>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Conversion Rate', value: `${paidRate}%`, sub: `${paidOrgs} paid / ${trialOrgs} trial`, color: '#10b981' },
          { label: 'Open Work Orders', value: openWorkOrders, sub: `${overdueWorkOrders} overdue`, color: overdueWorkOrders > 0 ? '#ef4444' : 'var(--text-primary)' },
          { label: 'New Orgs (7d)', value: recentSignups7d, sub: 'Latest signups', color: '#635bff' },
          { label: 'Machines Down', value: breakdownMachines, sub: `${breakdownAlerts} breakdown alert${breakdownAlerts !== 1 ? 's' : ''}`, color: breakdownMachines > 0 ? '#ef4444' : 'var(--text-primary)' },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{stat.label}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── IoT & Integration Stats ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>🔌 IoT & Integration</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Sensor data, API connections, and device activity</p>
          </div>
          <Link href="/docs/api" className="text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,91,255,0.1)', color: '#635bff', border: '1px solid rgba(99,91,255,0.3)' }}>
            📖 API Docs →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y" style={{ borderColor: 'var(--border)' }}>
          {[
            {
              label: 'Total Sensor Readings',
              value: totalSensorReadings.toLocaleString(),
              sub: 'All time',
              icon: '📊',
              color: '#635bff',
            },
            {
              label: 'Readings (24h)',
              value: sensorReadings24h.toLocaleString(),
              sub: `${mqttReadings} in last hour`,
              icon: '⚡',
              color: '#10b981',
            },
            {
              label: 'Connected API Keys',
              value: totalApiKeys.toLocaleString(),
              sub: 'Active integrations',
              icon: '🔑',
              color: '#f59e0b',
            },
            {
              label: 'Breakdown Alerts',
              value: breakdownAlerts.toLocaleString(),
              sub: 'Machine breakdowns',
              icon: '🚨',
              color: breakdownAlerts > 0 ? '#ef4444' : '#10b981',
            },
          ].map((stat) => (
            <div key={stat.label} className="p-5" style={{ borderColor: 'var(--border)' }}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{stat.label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature Quick Links ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>🛠 Feature Quick Links</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>All platform features at a glance</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {[
            { href: '/dashboard/iot-simulator',   icon: '🧪', label: 'IoT Simulator',   desc: 'Simulate sensor data',       color: '#635bff' },
            { href: '/equipment/qr-labels',        icon: '📱', label: 'QR Labels',       desc: 'Print machine QR codes',     color: '#10b981' },
            { href: '/docs/api',                   icon: '📖', label: 'API Docs',        desc: 'REST API reference',         color: '#3b82f6' },
            { href: '/settings/api-keys',          icon: '🔑', label: 'API Keys',        desc: 'Manage API integrations',    color: '#f59e0b' },
            { href: '/setup',                      icon: '⚡', label: 'Setup Wizard',    desc: 'Connect equipment',          color: '#8b5cf6' },
            { href: '/docs/iot-guides',            icon: '🔧', label: 'Wiring Guides',   desc: 'ESP32, RPi, Node-RED',       color: '#ef4444' },
            { href: '/docs/protocols',             icon: '📡', label: 'Protocols',       desc: 'OPC-UA, Modbus, Cloud',      color: '#06b6d4' },
            { href: '/admin/hmi',                  icon: '🖥️', label: 'HMI Monitor',    desc: 'Live machine dashboards',    color: '#10b981' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl p-4 flex items-start gap-3 transition-all hover:scale-[1.02]"
              style={{
                background: 'var(--bg-page)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: item.color }}>{item.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Recent Organizations (2/3 width) */}
        <div className="col-span-1 lg:col-span-2 rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Organizations</h2>
            <Link href="/admin/organizations" className="text-sm hover:underline" style={{ color: '#635bff' }}>View all →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-black/[0.02]"
                style={{
                  borderLeft: isPaidPlan(org.plan) ? '2px solid #10b981' : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: isPaidPlan(org.plan) ? 'rgba(16,185,129,0.15)' : 'var(--bg-hover)',
                      color: isPaidPlan(org.plan) ? '#10b981' : 'var(--text-secondary)',
                      border: isPaidPlan(org.plan) ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
                    }}
                  >
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                      {isPaidPlan(org.plan) && <span className="text-xs">💰</span>}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {org.users[0]?.email || 'No owner'} · {org._count.users} users · {org._count.machines} machines
                    </p>
                  </div>
                </div>
                <PlanBadge plan={org.plan} />
              </div>
            ))}
            {recentOrgs.length === 0 && (
              <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                No organizations yet.
              </div>
            )}
          </div>
        </div>

        {/* Plan Distribution (1/3 width) */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Plan Distribution</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{totalOrgs} total organizations</p>
          </div>
          <div className="p-6 space-y-4">
            {(['TRIAL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] as const).map((plan) => {
              const entry = planBreakdown.find(p => p.plan === plan);
              const count = entry?._count._all ?? 0;
              const pct = totalOrgs > 0 ? Math.round((count / totalOrgs) * 100) : 0;
              const barColors: Record<string, string> = {
                TRIAL: '#eab308',
                STARTER: '#3b82f6',
                GROWTH: '#10b981',
                PROFESSIONAL: '#8b5cf6',
                ENTERPRISE: '#f97316',
              };
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <PlanBadge plan={plan} />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg-hover)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barColors[plan] }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Paid conversion</span>
                <span className="font-bold" style={{ color: '#10b981' }}>{paidRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Recent Work Orders */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Work Orders</h2>
            <Link href="/admin/work-orders" className="text-sm hover:underline" style={{ color: '#635bff' }}>View all →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentWorkOrders.map((wo) => {
              const isOverdue = wo.dueAt && new Date(wo.dueAt) < now && wo.status !== 'COMPLETED' && wo.status !== 'CANCELLED';
              return (
                <div
                  key={wo.id}
                  className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-black/[0.02]"
                >
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                      {wo.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {wo.organization?.name} · {wo.machine?.name}
                    </p>
                    {isOverdue && <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>⚠ Overdue</p>}
                  </div>
                  <WoStatusBadge status={wo.status} />
                </div>
              );
            })}
            {recentWorkOrders.length === 0 && (
              <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                No work orders yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Sign-ups</h2>
            <Link href="/admin/users" className="text-sm hover:underline" style={{ color: '#635bff' }}>View all →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-black/[0.02]"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(99,91,255,0.15)', border: '1px solid rgba(99,91,255,0.3)', color: '#635bff' }}
                >
                  {user.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.name || 'Unknown'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {user.organization && <PlanBadge plan={user.organization.plan} />}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                No users yet.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    TRIAL:        { bg: 'rgba(234,179,8,0.15)',    color: '#ca8a04',  border: 'rgba(234,179,8,0.3)' },
    STARTER:      { bg: 'rgba(59,130,246,0.15)',   color: '#3b82f6',  border: 'rgba(59,130,246,0.3)' },
    GROWTH:       { bg: 'rgba(16,185,129,0.15)',   color: '#10b981',  border: 'rgba(16,185,129,0.3)' },
    PROFESSIONAL: { bg: 'rgba(139,92,246,0.15)',   color: '#8b5cf6',  border: 'rgba(139,92,246,0.3)' },
    ENTERPRISE:   { bg: 'rgba(249,115,22,0.15)',   color: '#f97316',  border: 'rgba(249,115,22,0.3)' },
  };
  const s = styles[plan] ?? { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: 'rgba(148,163,184,0.3)' };
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {plan}
    </span>
  );
}

function WoStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    OPEN:        { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
    IN_PROGRESS: { bg: 'rgba(234,179,8,0.15)',   color: '#ca8a04' },
    ON_HOLD:     { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
    COMPLETED:   { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
    CANCELLED:   { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
  };
  const s = styles[status] ?? { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' };
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded"
      style={{ background: s.bg, color: s.color }}
    >
      {status.replace('_', ' ')}
    </span>
  );
}