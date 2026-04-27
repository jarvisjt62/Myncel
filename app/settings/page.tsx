import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'OWNER';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your account and organization settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          <Link href="/settings" className="block px-4 py-3 rounded-lg bg-[#635bff] text-white font-medium">
            Profile
          </Link>
          <Link href="/settings/security" className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors">
            Security
          </Link>
          <Link href="/settings/team" className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors">
            Team
          </Link>
          <Link href="/settings/notifications" className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors">
            Notifications
          </Link>
          <Link href="/settings/integrations" className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors">
            Integrations
          </Link>
          {isAdmin && (
            <Link href="/settings/billing" className="block px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors">
              Billing
            </Link>
          )}
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Profile Settings</h2>
            <p className="text-[var(--text-secondary)]">Manage your personal profile information.</p>
            <div className="mt-4">
              <a href="/settings/security" className="text-[#635bff] hover:underline text-sm">
                Manage account security →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}