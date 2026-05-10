import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function isAdmin(role: string, email: string, orgId?: string) {
  return role === 'SUPER_ADMIN' || (role === 'ADMIN' && !orgId) || email === 'admin@myncel.com';
}

function generateRoomName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const rand = crypto.randomBytes(6).toString('hex');
  return `myncel-${slug}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role as string;
    const email = session.user.email as string;
    const orgId = (session.user as any).organizationId as string | undefined;
    if (!isAdmin(role, email, orgId) && role !== 'ADMIN') return NextResponse.json({ error: 'Only admins can create support sessions' }, { status: 403 });
    const body = await req.json();
    const { title, description, organizationId, machineId, workOrderId } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!organizationId) return NextResponse.json({ error: 'Organization is required' }, { status: 400 });
    const roomName = generateRoomName(title);
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const supportSession = await db.remoteSupportSession.create({
      data: { title: title.trim(), description: description?.trim() || null, organizationId, machineId: machineId || null, workOrderId: workOrderId || null, createdById: session.user.id, roomName, inviteToken, inviteExpiresAt, status: 'SCHEDULED' },
      include: { organization: { select: { name: true } }, machine: { select: { name: true, model: true } }, workOrder: { select: { woNumber: true, title: true } }, createdBy: { select: { name: true, email: true } }, participants: true, auditLogs: { orderBy: { createdAt: 'asc' } } },
    });
    await db.supportAuditLog.create({ data: { sessionId: supportSession.id, actorName: session.user.name || session.user.email || 'Admin', action: 'SESSION_CREATED', detail: `Session "${title}" created` } });
    return NextResponse.json(supportSession, { status: 201 });
  } catch (err) { console.error('[remote-support POST]', err); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role as string;
    const email = session.user.email as string;
    const orgId = (session.user as any).organizationId as string | undefined;
    const adminUser = isAdmin(role, email, orgId);
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const orgFilter = searchParams.get('organizationId');
    const where: any = {};
    if (adminUser) { if (orgFilter) where.organizationId = orgFilter; }
    else { if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 }); where.organizationId = orgId; }
    if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter;
    const sessions = await db.remoteSupportSession.findMany({ where, orderBy: { createdAt: 'desc' }, include: { organization: { select: { name: true } }, machine: { select: { name: true } }, workOrder: { select: { woNumber: true, title: true } }, createdBy: { select: { name: true, email: true } }, participants: { select: { displayName: true, role: true, joinedAt: true, leftAt: true } }, _count: { select: { auditLogs: true } } } });
    return NextResponse.json(sessions);
  } catch (err) { console.error('[remote-support GET]', err); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
