/**
 * GET    /api/approval-requests/[id]   — full detail for one request
 * POST   /api/approval-requests/[id]/decide  is in ./decide/route.ts
 * DELETE /api/approval-requests/[id]   — cancel a pending request (requester or admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { cancelApprovalRequest } from '@/lib/approvals/engine';

export const dynamic = 'force-dynamic';

async function load(id: string, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!user?.organizationId) return { error: 'No organization', status: 400 as const };
  const r = await db.approvalRequest.findUnique({
    where: { id },
    include: {
      policy: { include: { steps: { orderBy: { order: 'asc' } } } },
      decisions: { orderBy: { decidedAt: 'asc' }, include: { user: { select: { id: true, name: true, email: true } } } },
      workOrder: { select: { id: true, woNumber: true, title: true, status: true, priority: true, totalCost: true, currency: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!r) return { error: 'Not found', status: 404 as const };
  if (r.organizationId !== user.organizationId) return { error: 'Forbidden', status: 403 as const };
  return { request: r };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await load(params.id, (session.user as any).id);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ request: r.request });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const r = await load(params.id, userId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });

  // Only the requester or someone with manage_approvals can cancel.
  const isRequester = r.request.requestedById === userId;
  const canManage = await hasPermission(userId, 'work_orders.manage_approvals');
  if (!isRequester && !canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await cancelApprovalRequest(params.id, userId);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, request: result.request });
}
