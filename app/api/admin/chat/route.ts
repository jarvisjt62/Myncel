import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';

const ACTIVE_CHAT_STATUSES = ['OPEN', 'IN_PROGRESS'] as const

// Get all chat sessions (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.email !== 'admin@myncel.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const requestedStatuses = searchParams
      .getAll('status')
      .flatMap((value) => value.split(','))
      .map((value) => value.trim().toUpperCase())
      .filter((value) => ['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(value))

    const statuses = requestedStatuses.length > 0 ? requestedStatuses : [...ACTIVE_CHAT_STATUSES]

    const sessions = await db.chatSession.findMany({
      where: {
        status: { in: statuses as any },
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
      take: 50,
    })

    // Count unread user messages for each session and normalize the shape for the admin UI.
    const sessionsWithUnread = await Promise.all(
      sessions.map(async (s) => {
        const unreadCount = await db.chatMessage.count({
          where: {
            sessionId: s.id,
            senderType: 'USER',
            isRead: false,
          },
        })

        const latestMessage = s.messages[0] || null

        return {
          id: s.id,
          userName: s.userName,
          userEmail: s.userEmail,
          subject: s.subject,
          status: s.status,
          updatedAt: s.updatedAt,
          createdAt: s.createdAt,
          lastMessage: latestMessage?.content || null,
          latestMessageId: latestMessage?.id || null,
          latestMessageSenderType: latestMessage?.senderType || null,
          messageCount: s._count.messages,
          unreadCount,
        }
      })
    )

    const totalUnread = sessionsWithUnread.reduce((sum, s) => sum + s.unreadCount, 0)
    const activeCount = sessionsWithUnread.filter((s) => s.status === 'OPEN' || s.status === 'IN_PROGRESS').length

    return NextResponse.json({
      sessions: sessionsWithUnread,
      counts: {
        totalUnread,
        activeCount,
      },
    })
  } catch (error) {
    console.error('Error getting chat sessions:', error)
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 })
  }
}
