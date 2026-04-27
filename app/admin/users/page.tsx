import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery } from '@/lib/admin-helpers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminUsers({ searchParams }: { searchParams: { role?: string; org?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const users = await safeQuery(
    db.user.findMany({
      where: searchParams.role ? { role: searchParams.role as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true, plan: true, slug: true } },
      },
    }),
    []
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

  const roleCounts = ['OWNER', 'ADMIN', 'TECHNICIAN', 'MEMBER'].reduce<Record<string, number>>((acc, r) => {
    acc[r] = users.filter((u: any) => u.role === r).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-[var(--text-secondary)] mt-1">{users.length} total users across the platform</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/users"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!searchParams.role ? 'bg-[#635bff] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            All ({users.length})
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                {['User', 'Role', 'Organization', 'Plan', '2FA', 'Joined', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-[var(--bg-hover)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#635bff]/20 border border-[#635bff]/30 flex items-center justify-center text-[#635bff] text-sm font-bold flex-shrink-0">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{user.name || 'Unknown'}</p>
                        <p className="text-[var(--text-secondary)] text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${roleColors[user.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {user.role}
                    </span>
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
                    {user.organization && (
                      <Link href={`/admin/organizations/${user.organization.id}#users`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white whitespace-nowrap hover:opacity-90 transition-opacity">
                        Manage →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
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