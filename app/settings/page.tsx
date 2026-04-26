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
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[#0a2540]">Settings</h1>
          <p className="text-[#425466] mt-1">Manage your account and organization settings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-1">
            <Link href="/settings" className="block px-4 py-3 rounded-lg bg-[#635bff] text-white font-medium">
              Profile
            </Link>
            <Link href="/settings/security" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Security
            </Link>
            <Link href="/settings/team" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Team
            </Link>
            <Link href="/settings/notifications" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Notifications
            </Link>
            <Link href="/settings/integrations" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Integrations
            </Link>
            {isAdmin && (
              <Link href="/settings/billing" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
                Billing
              </Link>
            )}
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6">
              <h2 className="text-lg font-semibold text-[#0a2540] mb-4">Profile Settings</h2>
              <p className="text-[#425466]">Manage your personal profile information.</p>
              <div className="mt-4">
                <a href="/settings/security" className="text-[#635bff] hover:underline text-sm">
                  Manage account security →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}