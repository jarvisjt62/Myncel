import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';

// Get single chat session with all messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user || session.user.email !== 'admin@myncel.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chatSession = await db.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Mark user messages as read
    await db.chatMessage.updateMany({
      where: {
        sessionId: id,
        senderType: 'USER',
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ session: chatSession })
  } catch (error) {
    console.error('Error getting chat session:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}

// Update chat session status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!session?.user || session.user.email !== 'admin@myncel.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData: any = { status }
    if (status === 'CLOSED') {
      updateData.closedAt = new Date()
    }

    const chatSession = await db.chatSession.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ session: chatSession })
  } catch (error) {
    console.error('Error updating chat session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}