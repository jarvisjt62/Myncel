import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { displayName, role: participantRole, guestToken } = body;
    let actorName = displayName || 'Guest';
    let userId: string | null = null;
    if (session?.user?.id) { userId = session.user.id; actorName = session.user.name || session.user.email || displayName || 'Participant'; }
    else if (!guestToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supportSession = await db.remoteSupportSession.findUnique({ where: { id: params.id } });
    if (!supportSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (supportSession.status === 'ENDED' || supportSession.status === 'CANCELLED') return NextResponse.json({ error: 'Session is no longer active' }, { status: 400 });
    if (!session?.user?.id) {
      if (supportSession.inviteToken !== guestToken) return NextResponse.json({ error: 'Invalid invite token' }, { status: 403 });
      if (supportSession.inviteExpiresAt && new Date() > supportSession.inviteExpiresAt) return NextResponse.json({ error: 'Invite link has expired' }, { status: 403 });
    }
    const participant = await db.remoteSupportParticipant.create({ data: { sessionId: params.id, userId: userId || undefined, displayName: actorName, role: participantRole || (session?.user ? 'user' : 'guest') } });
    if (supportSession.status === 'SCHEDULED') await db.remoteSupportSession.update({ where: { id: params.id }, data: { status: 'ACTIVE', startedAt: new Date() } });
    await db.supportAuditLog.create({ data: { sessionId: params.id, actorName, action: 'PARTICIPANT_JOINED', detail: `${actorName} joined the session` } });
    return NextResponse.json(participant);
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
