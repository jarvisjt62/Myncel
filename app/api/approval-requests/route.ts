/**
 * GET /api/approval-requests
 *   - ?mine=1   → only requests the current user can act on (or requested)
 *   - ?status=PENDING|APPROVED|REJECTED|CANCELLED   filter
 *   - ?workOrderId=…   for a specific WO
 *
 * Response: { requests: FullRequest[] }  (always within current org)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const VALID_STATUS = new Set(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const user = await safeQuery(
    () => db.user.findUnique({ where: { id: userId }, select: { organizationId: true } }),
    null,
  );
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const url = new URL(req.url);
  const mine = url.searchParams.get('mine') === '1';
  const statusParam = url.searchParams.get('status');
  const workOrderId = url.searchParams.get('workOrderId');

  const where: any = { organizationId: user.organizationId };
  if (statusParam && VALID_STATUS.has(statusParam)) where.status = statusParam;
  if (workOrderId) where.workOrderId = workOrderId;

  const all = await safeQuery(
    () =>
      db.approvalRequest.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          policy: { include: { steps: { orderBy: { order: 'asc' } } } },
          decisions: { orderBy: { decidedAt: 'asc' }, include: { user: { select: { id: true, name: true, email: true } } } },
          workOrder: { select: { id: true, woNumber: true, title: true, status: true, priority: true, totalCost: true, currency: true } },
          requestedBy: { select: { id: true, name: true, email: true } },
        },
        take: 200,
      }),
    [],
  );

  let requests = all ?? [];
  if (mine) {
    // "Mine" = I requested it OR I can act on the current step (perm or named).
    const filtered: any[] = [];
    for (const r of requests) {
      if (r.requestedById === userId) {
        filtered.push(r);
        continue;
      }
      if (r.status !== 'PENDING') continue;
      const step = r.policy.steps.find((s: any) => s.order === r.currentStepOrder);
      if (!step) continue;
      if (step.requiredPermission && (await hasPermission(userId, step.requiredPermission))) {
        filtered.push(r);
        continue;
      }
      const named: string[] = Array.isArray(step.approverUserIds) ? (step.approverUserIds as string[]) : [];
      if (named.includes(userId)) filtered.push(r);
    }
    requests = filtered;
  }

  return NextResponse.json({ requests });
}
