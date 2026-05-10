import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SettingsPageClient from './SettingsPageClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'OWNER';

  return (
    <SettingsPageClient
      isAdmin={isAdmin}
      user={{
        name: session.user.name ?? '',
        email: session.user.email ?? '',
      }}
    />
  );
}