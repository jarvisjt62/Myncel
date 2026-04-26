import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';

// Get messages for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const afterId = searchParams.get('afterId') // For polling new messages

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const chatSession = await db.chatSession.findUnique({
      where: { id: sessionId },
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check access - user owns session or is admin
    const isAdmin = session?.user?.email === 'admin@myncel.com'
    const isOwner = chatSession.userId === session?.user?.id

    if (!isAdmin && !isOwner && chatSession.userEmail !== session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    const where: any = { sessionId }
    if (afterId) {
      where.id = { gt: afterId }
    }

    const messages = await db.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    // Mark messages as read if admin is viewing
    if (isAdmin) {
      await db.chatMessage.updateMany({
        where: {
          sessionId,
          senderType: 'USER',
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error getting messages:', error)
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}

// Send a new message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, content } = body

    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: 'Session ID and content required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const chatSession = await db.chatSession.findUnique({
      where: { id: sessionId },
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check access - user owns session or is admin
    const isAdmin = session?.user?.email === 'admin@myncel.com'
    const isOwner = chatSession.userId === session?.user?.id

    if (!isAdmin && !isOwner && chatSession.userEmail !== session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create message
    const message = await db.chatMessage.create({
      data: {
        sessionId,
        content: content.trim(),
        senderType: isAdmin ? 'ADMIN' : 'USER',
        senderName: session?.user?.name || (isAdmin ? 'Support' : 'User'),
      },
    })

    // Update session
    await db.chatSession.update({
      where: { id: sessionId },
      data: {
        updatedAt: new Date(),
        status: isAdmin ? 'IN_PROGRESS' : chatSession.status,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}