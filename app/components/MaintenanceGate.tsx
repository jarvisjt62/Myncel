import { db } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/admin-settings';
import Link from 'next/link';

async function getSetting(key: string): Promise<any> {
  try {
    const rec = await db.adminSetting.findUnique({ where: { key } });
    if (rec) return JSON.parse(rec.value);
  } catch {}
  return DEFAULT_SETTINGS[key]?.value;
}

export default async function MaintenanceGate({
  userRole,
  children,
}: {
  userRole: string;
  children: React.ReactNode;
}) {
  // Admins (SUPER_ADMIN) are always allowed in so they can toggle it off
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  if (isSuperAdmin) return <>{children}</>;

  const maintenanceMode = await getSetting('platform.maintenanceMode');
  if (maintenanceMode === true) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#e6ebf1] p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Scheduled Maintenance</h1>
          <p className="text-[#425466] text-sm mb-6">
            The platform is currently undergoing maintenance. We'll be back shortly. Thank you for your patience.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/status" className="text-[#635bff] text-sm font-medium hover:underline">Check system status</Link>
            <Link href="/api/auth/signout" className="text-[#8898aa] text-xs hover:text-[#425466]">Sign out</Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}