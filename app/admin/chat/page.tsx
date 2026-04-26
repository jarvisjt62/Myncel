import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminChatClient from './AdminChatClient';

export const dynamic = 'force-dynamic';

// Safe database query wrapper
async function safeQuery<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await query;
  } catch (error) {
    console.error('Database query error:', error);
    return fallback;
  }
}

export default async function AdminChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');
  if (session.user.email !== 'admin@myncel.com') redirect('/dashboard');

  // Get open and in-progress sessions with error handling
  const sessions = await safeQuery(
    db.chatSession.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    []
  );

  // Get unread counts with error handling
  const sessionsWithUnread = await Promise.all(
    sessions.map(async (s) => {
      const unreadCount = await safeQuery(
        db.chatMessage.count({
          where: {
            sessionId: s.id,
            senderType: 'USER',
            isRead: false,
          },
        }),
        0
      );
      return {
        id: s.id,
        userName: s.userName,
        userEmail: s.userEmail,
        subject: s.subject,
        status: s.status,
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
        lastMessage: s.messages[0]?.content || null,
        messageCount: s._count.messages,
        unreadCount,
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-700">Admin</Link>
        <span>/</span>
        <span className="text-gray-900">Live Chat</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Live Chat Support</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage customer support conversations in real-time</p>
      </div>

      <AdminChatClient initialSessions={sessionsWithUnread} />
    </div>
  );
}