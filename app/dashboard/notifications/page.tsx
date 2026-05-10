import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notifications — Myncel',
  robots: { index: false },
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/signin');

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }).catch(() => []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <NotificationsClient
      initialNotifications={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: n.priority,
        link: n.link,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      }))}
      unreadCount={unreadCount}
      user={{
        name: session.user.name ?? 'User',
        email: session.user.email ?? '',
        organizationName: session.user.organizationName ?? '',
      }}
    />
  );
}