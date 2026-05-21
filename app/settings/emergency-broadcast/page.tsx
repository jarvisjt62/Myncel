import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EmergencyBroadcastClient from './EmergencyBroadcastClient';

/**
 * Org-scoped Emergency Broadcast page.
 *
 * Available to any user with role = OWNER or ADMIN. Sends a high-priority
 * push + creates an in-app Notification row for every user in the caller's
 * own organization (NOT the whole platform).
 *
 * Backed by POST /api/admin/emergency, which scopes the broadcast by the
 * caller's organizationId.
 *
 * The super-admin equivalent at /admin/emergency hits the same API but is
 * locked to admin@myncel.com and broadcasts to that account's org.
 */

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Emergency Broadcast — Settings',
  robots: { index: false, follow: false },
};

export default async function EmergencyBroadcastPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/signin?callbackUrl=/settings/emergency-broadcast');

  const role = (session.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    redirect('/settings');
  }

  return <EmergencyBroadcastClient />;
}
