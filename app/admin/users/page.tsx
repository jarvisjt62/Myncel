import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const users = await safeQuery(
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true, plan: true, slug: true } },
      },
    }),
    []
  );

  const roleColors: Record<string, string> = {
    OWNER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    TECHNICIAN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEMBER: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const planColors: Record<string, string> = {
    TRIAL: 'bg-yellow-500/20 text-yellow-400',
    STARTER: 'bg-blue-500/20 text-blue-400',
    GROWTH: 'bg-emerald-500/20 text-emerald-400',
    PROFESSIONAL: 'bg-purple-500/20 text-purple-400',
    ENTERPRISE: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-[var(--text-secondary)] mt-1">{users.length} total users across the platform</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Organization</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Plan</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--bg-hover)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#635bff]/20 border border-[#635bff]/30 flex items-center justify-center text-[#635bff] text-sm font-bold flex-shrink-0">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name || 'Unknown'}</p>
                        <p className="text-[var(--text-secondary)] text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${roleColors[user.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{user.organization?.name || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {user.organization?.plan ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${planColors[user.organization.plan]}`}>
                        {user.organization.plan}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[var(--text-secondary)] text-sm">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {user.emailVerified ? (
                      <span className="text-xs text-emerald-400">✓ Verified</span>
                    ) : (
                      <span className="text-xs text-[var(--text-secondary)]">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}