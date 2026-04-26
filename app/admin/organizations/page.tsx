import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizations({ searchParams }: { searchParams: { filter?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const filter = searchParams.filter;
  const isPaidFilter = filter === 'paid';
  const isTrialFilter = filter === 'trial';

  const orgs = await safeQuery(
    db.organization.findMany({
      where: isPaidFilter
        ? { plan: { in: ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] } }
        : isTrialFilter
        ? { plan: 'TRIAL' }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, machines: true, workOrders: true, maintenanceTasks: true } },
        users: { select: { name: true, email: true, role: true }, where: { role: 'OWNER' }, take: 1 },
      },
    }),
    []
  );

  const allOrgs = await safeQuery(
    db.organization.findMany({ select: { plan: true } }),
    []
  );
  const paidCount = allOrgs.filter(o => ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'].includes(o.plan)).length;
  const trialCount = allOrgs.filter(o => o.plan === 'TRIAL').length;

  const planColors: Record<string, string> = {
    TRIAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    STARTER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    GROWTH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PROFESSIONAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ENTERPRISE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  const industryLabels: Record<string, string> = {
    METAL_FABRICATION: 'Metal Fab',
    PLASTICS: 'Plastics',
    FOOD_BEVERAGE: 'Food & Bev',
    AUTO_PARTS: 'Auto Parts',
    ELECTRONICS: 'Electronics',
    WOODWORKING: 'Woodworking',
    OTHER: 'Other',
  };

  const isPaidPlan = (plan: string) => ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Organizations</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {isPaidFilter ? `${paidCount} paying clients` : `${orgs.length} total organizations`} on the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin/organizations"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!isPaidFilter ? 'bg-[#635bff] text-[var(--text-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            All ({allOrgs.length})
          </a>
          <a
            href="/admin/organizations?filter=paid"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isPaidFilter ? 'bg-[#635bff] text-[var(--text-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            💰 Paid ({paidCount})
          </a>
          <a
            href="/admin/organizations?filter=trial"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'trial' ? 'bg-[#635bff] text-[var(--text-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Trial ({trialCount})
          </a>
        </div>
      </div>

      {/* Plan Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {['TRIAL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'].map((plan) => {
          const count = allOrgs.filter(o => o.plan === plan).length;
          return (
            <div key={plan} className={`border rounded-xl p-4 ${planColors[plan]}`}>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{count}</div>
              <div className="text-xs mt-1 opacity-80 font-medium">{plan}</div>
              {isPaidPlan(plan) && <div className="text-xs mt-0.5 opacity-50">💰 Paid</div>}
            </div>
          );
        })}
      </div>

      {/* Paid Clients Highlight */}
      {!isPaidFilter && paidCount > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span>💰</span>
            </div>
            <div>
              <p className="text-emerald-400 font-semibold">{paidCount} Paying Client{paidCount !== 1 ? 's' : ''}</p>
              <p className="text-[var(--text-secondary)] text-xs">These organizations are on paid plans</p>
            </div>
          </div>
          <a href="/admin/organizations?filter=paid" className="text-emerald-400 text-sm font-semibold hover:underline">
            View paid clients →
          </a>
        </div>
      )}

      {/* Organizations Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Organization</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Owner</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Plan</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Industry</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Users</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Machines</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Work Orders</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Trial Ends</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {orgs.map((org) => (
                <tr key={org.id} className={`hover:bg-[var(--bg-hover)]/50 transition-colors ${isPaidPlan(org.plan) ? 'border-l-2 border-l-emerald-500/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-sm ${isPaidPlan(org.plan) ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}>
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{org.name}</p>
                          {isPaidPlan(org.plan) && <span className="text-xs text-emerald-400">💰</span>}
                        </div>
                        <p className="text-[var(--text-secondary)] text-xs">/{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {org.users[0] ? (
                      <div>
                        <p className="text-sm">{org.users[0].name}</p>
                        <p className="text-[var(--text-secondary)] text-xs truncate max-w-[150px]">{org.users[0].email}</p>
                      </div>
                    ) : <span className="text-[var(--text-secondary)] text-sm">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${planColors[org.plan]}`}>
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[var(--text-secondary)] text-sm">{industryLabels[org.industry] || org.industry}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{org._count.users}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{org._count.machines}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{org._count.workOrders}</span>
                  </td>
                  <td className="px-6 py-4">
                    {org.trialEndsAt ? (
                      <span className={`text-xs ${new Date(org.trialEndsAt) < new Date() ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                        {new Date(org.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    {isPaidFilter ? 'No paying clients yet.' : 'No organizations found.'}
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