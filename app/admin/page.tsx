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
  ]);

  const userGrowth = newUsersLastMonth > 0 ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100) : null;
  const orgGrowth = newOrgsLastMonth > 0 ? Math.round(((newOrgsThisMonth - newOrgsLastMonth) / newOrgsLastMonth) * 100) : null;
  const paidRate = totalOrgs > 0 ? Math.round((paidOrgs / totalOrgs) * 100) : 0;

  const isPaidPlan = (plan: string) => ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan);

  const planColors: Record<string, string> = {
    TRIAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    STARTER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    GROWTH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PROFESSIONAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ENTERPRISE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  const woStatusColors: Record<string, string> = {
    OPEN: 'bg-blue-500/20 text-blue-400',
    IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400',
    ON_HOLD: 'bg-gray-500/20 text-gray-400',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-[#8892a4] mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/organizations?filter=paid" className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
            💰 {paidOrgs} Paid Client{paidOrgs !== 1 ? 's' : ''}
          </Link>
          {(criticalAlerts > 0 || breakdownMachines > 0) && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold animate-pulse">
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
            color: 'from-[#635bff]/20 to-[#635bff]/5',
            border: 'border-[#635bff]/30',
          },
          {
            label: 'Organizations',
            value: totalOrgs,
            sub: `+${newOrgsThisMonth} this month`,
            growth: orgGrowth,
            icon: '🏢',
            href: '/admin/organizations',
            color: 'from-blue-500/20 to-blue-500/5',
            border: 'border-blue-500/30',
          },
          {
            label: 'Machines Tracked',
            value: totalMachines,
            sub: breakdownMachines > 0 ? `⚠ ${breakdownMachines} in breakdown` : 'All systems healthy',
            icon: '⚙️',
            href: '/admin/machines',
            color: breakdownMachines > 0 ? 'from-red-500/20 to-red-500/5' : 'from-emerald-500/20 to-emerald-500/5',
            border: breakdownMachines > 0 ? 'border-red-500/30' : 'border-emerald-500/30',
          },
          {
            label: 'Active Alerts',
            value: activeAlerts,
            sub: criticalAlerts > 0 ? `🚨 ${criticalAlerts} critical/high` : 'No critical issues',
            icon: '🔔',
            href: '/admin/alerts',
            color: activeAlerts > 0 ? 'from-red-500/20 to-red-500/5' : 'from-emerald-500/20 to-emerald-500/5',
            border: activeAlerts > 0 ? 'border-red-500/30' : 'border-emerald-500/30',
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-xl p-5 hover:scale-[1.02] transition-transform cursor-pointer`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              {stat.growth !== null && stat.growth !== undefined && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.growth >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {stat.growth >= 0 ? '↑' : '↓'} {Math.abs(stat.growth)}%
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</div>
            <div className="text-white/70 text-sm font-medium mt-1">{stat.label}</div>
            <div className="text-[#8892a4] text-xs mt-1">{stat.sub}</div>
          </Link>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Conversion Rate', value: `${paidRate}%`, sub: `${paidOrgs} paid / ${trialOrgs} trial`, color: 'text-emerald-400' },
          { label: 'Open Work Orders', value: openWorkOrders, sub: `${overdueWorkOrders} overdue`, color: overdueWorkOrders > 0 ? 'text-red-400' : 'text-white' },
          { label: 'New Orgs (7d)', value: recentSignups7d, sub: 'Latest signups', color: 'text-[#635bff]' },
          { label: 'Machines Tracked', value: totalMachines, sub: `${breakdownMachines} in breakdown`, color: breakdownMachines > 0 ? 'text-red-400' : 'text-white' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl p-4">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-white text-sm font-medium mt-1">{stat.label}</div>
            <div className="text-[#8892a4] text-xs mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Recent Organizations (2/3 width) */}
        <div className="col-span-1 lg:col-span-2 bg-[#0d1426] border border-[#1e2d4a] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a]">
            <h2 className="text-white font-semibold">Recent Organizations</h2>
            <Link href="/admin/organizations" className="text-[#635bff] text-sm hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-[#1e2d4a]">
            {recentOrgs.map((org) => (
              <div key={org.id} className={`flex items-center justify-between px-6 py-4 hover:bg-[#1e2d4a]/50 transition-colors ${isPaidPlan(org.plan) ? 'border-l-2 border-l-emerald-500' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${isPaidPlan(org.plan) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#1e2d4a] text-[#8892a4]'}`}>
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{org.name}</p>
                      {isPaidPlan(org.plan) && <span className="text-xs">💰</span>}
                    </div>
                    <p className="text-[#8892a4] text-xs">{org.users[0]?.email || 'No owner'} · {org._count.users} users · {org._count.machines} machines</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${planColors[org.plan]}`}>
                  {org.plan}
                </span>
              </div>
            ))}
            {recentOrgs.length === 0 && (
              <div className="px-6 py-8 text-center text-[#8892a4] text-sm">No organizations yet.</div>
            )}
          </div>
        </div>

        {/* Plan Distribution (1/3 width) */}
        <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e2d4a]">
            <h2 className="text-white font-semibold">Plan Distribution</h2>
            <p className="text-[#8892a4] text-xs mt-0.5">{totalOrgs} total organizations</p>
          </div>
          <div className="p-6 space-y-4">
            {['TRIAL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'].map((plan) => {
              const entry = planBreakdown.find(p => p.plan === plan);
              const count = entry?._count._all ?? 0;
              const pct = totalOrgs > 0 ? Math.round((count / totalOrgs) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${planColors[plan]}`}>{plan}</span>
                    <span className="text-white text-sm font-bold">{count}</span>
                  </div>
                  <div className="w-full bg-[#1e2d4a] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        plan === 'TRIAL' ? 'bg-yellow-400' :
                        plan === 'STARTER' ? 'bg-blue-400' :
                        plan === 'GROWTH' ? 'bg-emerald-400' :
                        plan === 'PROFESSIONAL' ? 'bg-purple-400' : 'bg-orange-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-[#1e2d4a]">
              <div className="flex justify-between text-xs">
                <span className="text-[#8892a4]">Paid conversion</span>
                <span className="text-emerald-400 font-bold">{paidRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Recent Work Orders */}
        <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a]">
            <h2 className="text-white font-semibold">Recent Work Orders</h2>
            <Link href="/admin/work-orders" className="text-[#635bff] text-sm hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-[#1e2d4a]">
            {recentWorkOrders.map((wo) => {
              const isOverdue = wo.dueAt && new Date(wo.dueAt) < now && wo.status !== 'COMPLETED' && wo.status !== 'CANCELLED';
              return (
                <div key={wo.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#1e2d4a]/50 transition-colors">
                  <div>
                    <p className="text-white text-sm font-medium truncate max-w-[200px]">{wo.title}</p>
                    <p className="text-[#8892a4] text-xs">{wo.organization?.name} · {wo.machine?.name}</p>
                    {isOverdue && <p className="text-red-400 text-xs font-semibold">⚠ Overdue</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${woStatusColors[wo.status]}`}>
                    {wo.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
            {recentWorkOrders.length === 0 && (
              <div className="px-6 py-8 text-center text-[#8892a4] text-sm">No work orders yet.</div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a]">
            <h2 className="text-white font-semibold">Recent Sign-ups</h2>
            <Link href="/admin/users" className="text-[#635bff] text-sm hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-[#1e2d4a]">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-6 py-3 hover:bg-[#1e2d4a]/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#635bff]/20 border border-[#635bff]/30 flex items-center justify-center text-[#635bff] text-xs font-bold flex-shrink-0">
                  {user.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user.name || 'Unknown'}</p>
                  <p className="text-[#8892a4] text-xs truncate">{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {user.organization && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${planColors[user.organization.plan]}`}>
                      {user.organization.plan}
                    </span>
                  )}
                  <p className="text-[#8892a4] text-xs mt-1">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <div className="px-6 py-8 text-center text-[#8892a4] text-sm">No users yet.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}