import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';

// Create a new chat session or get existing open session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userName, userEmail, subject } = body

    // Try to get existing session
    const session = await getServerSession(authOptions)
    
    // Check for existing open session for this user
    if (session?.user?.id) {
      const existingSession = await db.chatSession.findFirst({
        where: {
          userId: session.user.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50,
          },
        },
      })

      if (existingSession) {
        return NextResponse.json({ session: existingSession })
      }
    }

    // Create new session
    const chatSession = await db.chatSession.create({
      data: {
        userName: userName || session?.user?.name || 'Guest',
        userEmail: userEmail || session?.user?.email,
        userId: session?.user?.id,
        subject,
        status: 'OPEN',
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json({ session: chatSession }, { status: 201 })
  } catch (error) {
    console.error('Error creating chat session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

// Get current user's chat session
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ session: null })
    }

    const chatSession = await db.chatSession.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ session: chatSession })
  } catch (error) {
    console.error('Error getting chat session:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}

// Close a chat session
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, status } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const updatedSession = await db.chatSession.update({
      where: { id: sessionId },
      data: {
        status: status || 'CLOSED',
        closedAt: new Date(),
      },
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error closing chat session:', error)
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 })
  }
}
