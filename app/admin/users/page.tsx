import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery } from '@/lib/admin-helpers';
import Link from 'next/link';
import PrepareForReviewButton from './PrepareForReviewButton';
import RemoveUserButton from './RemoveUserButton';

export const dynamic = 'force-dynamic';

const GRACE_DAYS = 14;

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: { role?: string; org?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  // Build the where clause. We always include pending-deletion users
  // in the result set (they still legally exist until the 14-day
  // grace period expires and the cron purges them) but we expose a
  // filter to view "Pending deletion" specifically and we visually
  // distinguish those rows so the super admin can clearly see which
  // accounts are scheduled for permanent removal.
  const where: any = {};
  if (searchParams.role) where.role = searchParams.role as any;
  if (searchParams.status === 'pending-deletion') {
    where.deletionRequestedAt = { not: null };
  } else if (searchParams.status === 'active') {
    where.deletionRequestedAt = null;
  }

  const users = await safeQuery(
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true, plan: true, slug: true } },
      },
    }),
    []
  );

  // Counts for filter chips. Run a single non-filtered query so the
  // chip counts stay correct regardless of the current filter.
  const allUsers = await safeQuery(
    db.user.findMany({
      select: { id: true, role: true, deletionRequestedAt: true },
    }),
    [] as Array<{ id: string; role: string; deletionRequestedAt: Date | null }>
  );

  const roleColors: Record<string, string> = {
    OWNER:      'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ADMIN:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
    TECHNICIAN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEMBER:     'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const planColors: Record<string, string> = {
    TRIAL:        'bg-yellow-500/20 text-yellow-400',
    STARTER:      'bg-blue-500/20 text-blue-400',
    GROWTH:       'bg-emerald-500/20 text-emerald-400',
    PROFESSIONAL: 'bg-purple-500/20 text-purple-400',
    ENTERPRISE:   'bg-orange-500/20 text-orange-400',
  };

  const roleCounts = ['OWNER', 'ADMIN', 'TECHNICIAN', 'OPERATOR', 'EMPLOYEE', 'MEMBER'].reduce<Record<string, number>>(
    (acc, r) => {
      acc[r] = allUsers.filter((u: any) => u.role === r).length;
      return acc;
    },
    {}
  );

  const pendingDeletionCount = allUsers.filter(
    (u: any) => u.deletionRequestedAt
  ).length;
  const activeCount = allUsers.length - pendingDeletionCount;

  function daysUntilPurge(requestedAt: Date | string): number {
    const requested = new Date(requestedAt).getTime();
    const elapsedMs = Date.now() - requested;
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(GRACE_DAYS - elapsedDays));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {allUsers.length} total users across the platform
            {pendingDeletionCount > 0 && (
              <>
                {' '}·{' '}
                <span className="text-amber-400">
                  {pendingDeletionCount} pending deletion
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/users"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!searchParams.role && !searchParams.status ? 'bg-[#635bff] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            All ({allUsers.length})
          </Link>
          <Link href="/admin/users?status=active"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${searchParams.status === 'active' ? 'bg-[#635bff] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            Active ({activeCount})
          </Link>
          <Link href="/admin/users?status=pending-deletion"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${searchParams.status === 'pending-deletion' ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}>
            Pending deletion ({pendingDeletionCount})
          </Link>
          {['OWNER','ADMIN','TECHNICIAN','MEMBER'].map(role => (
            <Link key={role} href={`/admin/users?role=${role}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${searchParams.role === role ? 'bg-[#635bff] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              {role} ({roleCounts[role] ?? 0})
            </Link>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                {['User', 'Role', 'Organization', 'Plan', '2FA', 'Joined', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((user: any) => {
                const isPending = !!user.deletionRequestedAt;
                const daysLeft = isPending
                  ? daysUntilPurge(user.deletionRequestedAt)
                  : null;
                return (
                <tr
                  key={user.id}
                  className={`transition-colors ${isPending ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-[var(--bg-hover)]/50'}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isPending ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-[#635bff]/20 border border-[#635bff]/30 text-[#635bff]'}`}>
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isPending ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text-primary)]'}`}>
                          {user.name || 'Unknown'}
                        </p>
                        <p className="text-[var(--text-secondary)] text-xs">{user.email}</p>
                        {isPending && (
                          <p className="text-amber-400 text-[11px] mt-0.5 font-semibold">
                            Pending deletion · purges in {daysLeft} day{daysLeft === 1 ? '' : 's'}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border w-fit ${roleColors[user.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {user.role}
                      </span>
                      {isPending && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Deletion pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.organization ? (
                      <Link href={`/admin/organizations/${user.organization.id}`}
                        className="text-sm text-[var(--accent)] hover:underline font-medium">
                        {user.organization.name}
                      </Link>
                    ) : <span className="text-[var(--text-secondary)] text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {user.organization?.plan ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${planColors[user.organization.plan]}`}>
                        {user.organization.plan}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${user.twoFactorEnabled ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
                      {user.twoFactorEnabled ? '✓ On' : '✗ Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--text-secondary)] text-xs whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--text-secondary)] text-xs whitespace-nowrap">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {user.organization && (
                        <Link href={`/admin/organizations/${user.organization.id}#users`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white whitespace-nowrap hover:opacity-90 transition-opacity">
                          Manage →
                        </Link>
                      )}
                      <PrepareForReviewButton userId={user.id} userEmail={user.email} />
                      {user.email !== 'admin@myncel.com' && (
                        <RemoveUserButton
                          userId={user.id}
                          userEmail={user.email}
                          userName={user.name || user.email}
                          isPending={isPending}
                        />
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[var(--text-secondary)]">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
