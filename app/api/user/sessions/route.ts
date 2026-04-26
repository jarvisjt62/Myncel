import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSessions, revokeSession, revokeOtherSessions } from '@/lib/session-manager';
import { logAuditEvent } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

// GET - Get all sessions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                         req.cookies.get('__Secure-next-auth.session-token')?.value || '';

    const sessions = await getUserSessions(session.user.id, sessionToken);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 });
  }
}

// DELETE - Revoke sessions
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, revokeAll } = await req.json();

    const sessionToken = req.cookies.get('next-auth.session-token')?.value || 
                         req.cookies.get('__Secure-next-auth.session-token')?.value || '';

    if (revokeAll) {
      const count = await revokeOtherSessions(session.user.id, sessionToken);
      
      await logAuditEvent({
        action: 'SESSION_REVOKED',
        entity: 'Session',
        userId: session.user.id,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        metadata: { revokedCount: count, revokeAll: true },
      });

      return NextResponse.json({ success: true, message: `Revoked ${count} sessions` });
    }

    if (sessionId) {
      const success = await revokeSession(sessionId, session.user.id);
      
      if (!success) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Session revoked' });
    }

    return NextResponse.json({ error: 'Session ID or revokeAll required' }, { status: 400 });
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}