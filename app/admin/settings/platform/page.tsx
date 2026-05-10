import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PlatformSettingsClient from './PlatformSettingsClient';
import { db } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/admin-settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Platform Config — Admin' };

export default async function PlatformSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') redirect('/admin');

  const dbSettings = await db.adminSetting.findMany().catch(() => []);

  const settings: Record<string, { value: any; group: string; label: string }> = {};
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    const dbRecord = dbSettings.find((s: any) => s.key === key);
    settings[key] = {
      value: dbRecord ? JSON.parse(dbRecord.value) : def.value,
      group: def.group,
      label: def.label,
    };
  }

  return <PlatformSettingsClient initialSettings={settings} />;
}