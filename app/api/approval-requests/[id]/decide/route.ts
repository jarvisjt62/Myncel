/**
 * POST /api/approval-requests/[id]/decide
 *
 * Body: { decision: "APPROVED" | "REJECTED", comment?: string }
 *
 * Submits the calling user's decision on the current step. The engine
 * decides whether to advance, finalise, or roll back.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { submitDecision } from '@/lib/approvals/engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;

  // Org check.
  const user = await db.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const r = await db.approvalRequest.findUnique({
    where: { id: params.id },
    select: { organizationId: true },
  });
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (r.organizationId !== user.organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const decision = String(body?.decision ?? '');
  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    return NextResponse.json({ error: 'decision must be APPROVED or REJECTED' }, { status: 400 });
  }
  const comment = typeof body?.comment === 'string' ? body.comment.slice(0, 2000) : undefined;

  const result = await submitDecision({
    requestId: params.id,
    userId,
    decision,
    comment,
  });
  if ('reason' in result) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  // Fire notification on terminal states.
  if (result.request.status === 'APPROVED' || result.request.status === 'REJECTED') {
    try {
      const { notifyApprovalDecided } = await import('@/lib/approvals/notify');
      notifyApprovalDecided(result.request.id).catch((e: unknown) =>
        console.error('[approvals] notify decided error:', e),
      );
    } catch (e) {
      console.error('[approvals] notify import error:', e);
    }
  }

  return NextResponse.json({ ok: true, request: result.request });
}
