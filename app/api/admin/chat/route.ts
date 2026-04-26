import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';

// Get all chat sessions (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.email !== 'admin@myncel.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status && ['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      where.status = status
    }

    const sessions = await db.chatSession.findMany({
      where,
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

    // Count unread messages for each session
    const sessionsWithUnread = await Promise.all(
      sessions.map(async (s) => {
        const unreadCount = await db.chatMessage.count({
          where: {
            sessionId: s.id,
            senderType: 'USER',
            isRead: false,
          },
        })
        return {
          ...s,
          unreadCount,
        }
      })
    )

    return NextResponse.json({ sessions: sessionsWithUnread })
  } catch (error) {
    console.error('Error getting chat sessions:', error)
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 })
  }
}