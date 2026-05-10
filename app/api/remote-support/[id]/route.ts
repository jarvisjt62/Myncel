import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isAdmin(role: string, email: string, orgId?: string) {
  return role === 'SUPER_ADMIN' || (role === 'ADMIN' && !orgId) || email === 'admin@myncel.com';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role as string;
    const email = session.user.email as string;
    const orgId = (session.user as any).organizationId as string | undefined;
    const adminUser = isAdmin(role, email, orgId);
    const s = await db.remoteSupportSession.findUnique({ where: { id: params.id }, include: { organization: { select: { name: true, plan: true } }, machine: { select: { id: true, name: true, model: true, status: true, criticality: true, imageUrl: true } }, workOrder: { select: { id: true, woNumber: true, title: true, status: true, priority: true } }, createdBy: { select: { name: true, email: true } }, participants: { orderBy: { joinedAt: 'asc' } }, auditLogs: { orderBy: { createdAt: 'asc' } } } });
    if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!adminUser && orgId !== s.organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json(s);
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role as string;
    const email = session.user.email as string;
    const orgId = (session.user as any).organizationId as string | undefined;
    const adminUser = isAdmin(role, email, orgId);
    const existing = await db.remoteSupportSession.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!adminUser && orgId !== existing.organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const data: any = {};
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes;
    if (body.status !== undefined) data.status = body.status;
    if (body.recordingUrl !== undefined) data.recordingUrl = body.recordingUrl;
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.status === 'ACTIVE' && existing.status !== 'ACTIVE') data.startedAt = new Date();
    if (body.status === 'ENDED' && !existing.endedAt) data.endedAt = new Date();
    const updated = await db.remoteSupportSession.update({ where: { id: params.id }, data, include: { organization: { select: { name: true } }, machine: { select: { id: true, name: true, model: true } }, workOrder: { select: { id: true, woNumber: true, title: true } }, createdBy: { select: { name: true, email: true } }, participants: true, auditLogs: { orderBy: { createdAt: 'asc' } } } });
    if (body.notes !== undefined || body.adminNotes !== undefined) await db.supportAuditLog.create({ data: { sessionId: params.id, actorName: session.user.name || session.user.email || 'Admin', action: 'NOTES_UPDATED', detail: 'Session notes updated' } });
    return NextResponse.json(updated);
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role as string;
    const email = session.user.email as string;
    const orgId = (session.user as any).organizationId as string | undefined;
    if (!isAdmin(role, email, orgId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await db.remoteSupportSession.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
