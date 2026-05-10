import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role as string;
    const email = session.user.email as string;
    const orgId = (session.user as any).organizationId as string | undefined;
    const isAdmin = role === 'SUPER_ADMIN' || (role === 'ADMIN' && !orgId) || email === 'admin@myncel.com';
    const existing = await db.remoteSupportSession.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!isAdmin && orgId !== existing.organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const now = new Date();
    await db.remoteSupportParticipant.updateMany({ where: { sessionId: params.id, leftAt: null }, data: { leftAt: now } });
    const updated = await db.remoteSupportSession.update({ where: { id: params.id }, data: { status: 'ENDED', endedAt: now, ...(body.notes !== undefined ? { notes: body.notes } : {}), ...(body.recordingUrl !== undefined ? { recordingUrl: body.recordingUrl } : {}) }, include: { organization: { select: { name: true } }, machine: { select: { id: true, name: true } }, workOrder: { select: { id: true, woNumber: true, title: true } }, createdBy: { select: { name: true, email: true } }, participants: true, auditLogs: { orderBy: { createdAt: 'asc' } } } });
    await db.supportAuditLog.create({ data: { sessionId: params.id, actorName: session.user.name || session.user.email || 'Admin', action: 'SESSION_ENDED', detail: `Session ended at ${now.toISOString()}` } });
    return NextResponse.json(updated);
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
