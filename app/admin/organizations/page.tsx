import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery } from '@/lib/admin-helpers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOrganizations({ searchParams }: { searchParams: { filter?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const filter = searchParams.filter;
  const isPaidFilter = filter === 'paid';
  const isTrialFilter = filter === 'trial';
  const isSuspendedFilter = filter === 'suspended';

  const orgs = await safeQuery(
    (db.organization as any).findMany({
      where: isPaidFilter
        ? { plan: { in: ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] } }
        : isTrialFilter
        ? { plan: 'TRIAL' }
        : isSuspendedFilter
        ? { isSuspended: true }
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
  const paidCount = allOrgs.filter((o: any) => ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'].includes(o.plan)).length;
  const trialCount = allOrgs.filter((o: any) => o.plan === 'TRIAL').length;
  const suspendedCount = orgs.filter((o: any) => o.isSuspended).length;

  const planColors: Record<string, string> = {
    TRIAL:        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    STARTER:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
    GROWTH:       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PROFESSIONAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ENTERPRISE:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  const industryLabels: Record<string, string> = {
    METAL_FABRICATION: 'Metal Fab', PLASTICS: 'Plastics',
    FOOD_BEVERAGE: 'Food & Bev', AUTO_PARTS: 'Auto Parts',
    ELECTRONICS: 'Electronics', WOODWORKING: 'Woodworking', OTHER: 'Other',
  };

  const isPaidPlan = (plan: string) => ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Organizations</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {orgs.length} organization{orgs.length !== 1 ? 's' : ''} shown — click any row to manage
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { href: '/admin/organizations', label: `All (${allOrgs.length})`, active: !filter },
            { href: '/admin/organizations?filter=paid', label: `💰 Paid (${paidCount})`, active: isPaidFilter },
            { href: '/admin/organizations?filter=trial', label: `⏳ Trial (${trialCount})`, active: isTrialFilter },
            { href: '/admin/organizations?filter=suspended', label: `🚫 Suspended (${suspendedCount})`, active: isSuspendedFilter },
          ].map(btn => (
            <Link key={btn.href} href={btn.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                btn.active ? 'bg-[#635bff] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}>
              {btn.label}
            </Link>
          ))}
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

      {/* Organizations Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Organization', 'Owner', 'Plan', 'Status', 'Industry', 'Users', 'Machines', 'Work Orders', 'Trial Ends', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orgs.map((org: any) => (
                <tr key={org.id} className={`hover:bg-[var(--bg-hover)]/50 transition-colors ${(org as any).isSuspended ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-sm ${
                        isPaidPlan(org.plan) ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                      }`}>
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{org.name}</p>
                        <p className="text-[var(--text-secondary)] text-xs">/{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {org.users[0] ? (
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">{org.users[0].name}</p>
                        <p className="text-[var(--text-secondary)] text-xs truncate max-w-[130px]">{org.users[0].email}</p>
                      </div>
                    ) : <span className="text-[var(--text-secondary)] text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${planColors[org.plan]}`}>
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(org as any).isSuspended ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Suspended</span>
                    ) : org.subscriptionStatus ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">{org.subscriptionStatus}</span>
                    ) : <span className="text-[var(--text-secondary)] text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[var(--text-secondary)] text-sm">{industryLabels[org.industry] || org.industry}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{org._count.users}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{org._count.machines}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{org._count.workOrders}</span>
                  </td>
                  <td className="px-4 py-3">
                    {org.trialEndsAt ? (
                      <span className={`text-xs ${new Date(org.trialEndsAt) < new Date() ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                        {new Date(org.trialEndsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/organizations/${org.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white whitespace-nowrap hover:opacity-90 transition-opacity">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    No organizations found.
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