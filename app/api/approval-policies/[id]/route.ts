/**
 * GET    /api/approval-policies/[id]
 * PATCH  /api/approval-policies/[id]
 * DELETE /api/approval-policies/[id]
 *
 * PATCH replaces the steps array atomically when `steps` is provided.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const VALID_TRIGGERS = new Set(['PRE_START', 'PRE_CLOSE', 'VENDOR_QUOTE']);
const VALID_PRIORITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
const VALID_TYPES = new Set(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'PROJECT']);

async function loadPolicy(id: string, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!user?.organizationId) return { error: 'No organization', status: 400 as const };
  const policy = await db.approvalPolicy.findUnique({
    where: { id },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
  if (!policy) return { error: 'Not found', status: 404 as const };
  if (policy.organizationId !== user.organizationId) {
    return { error: 'Forbidden', status: 403 as const };
  }
  return { policy };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await loadPolicy(params.id, (session.user as any).id);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ policy: r.policy });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!(await hasPermission(userId, 'work_orders.manage_approvals'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const r = await loadPolicy(params.id, userId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (typeof body?.name === 'string' && body.name.trim().length > 0) {
    data.name = body.name.trim();
  }
  if (body?.description !== undefined) {
    data.description = typeof body.description === 'string' ? body.description : null;
  }
  if (typeof body?.trigger === 'string' && VALID_TRIGGERS.has(body.trigger)) {
    data.trigger = body.trigger;
  }
  if (Array.isArray(body?.matchPriorities)) {
    data.matchPriorities = body.matchPriorities.filter(
      (p: unknown) => typeof p === 'string' && VALID_PRIORITIES.has(p),
    );
  }
  if (Array.isArray(body?.matchTypes)) {
    data.matchTypes = body.matchTypes.filter(
      (t: unknown) => typeof t === 'string' && VALID_TYPES.has(t),
    );
  }
  if (body?.minTotalCost !== undefined) {
    const n = Number(body.minTotalCost);
    if (!Number.isNaN(n) && n >= 0) data.minTotalCost = n;
  }
  if (body?.isActive !== undefined) data.isActive = Boolean(body.isActive);

  // If steps provided, replace them in a transaction.
  let stepsReplacement: any[] | null = null;
  if (Array.isArray(body?.steps)) {
    if (body.steps.length === 0) {
      return NextResponse.json({ error: 'At least one step is required' }, { status: 400 });
    }
    if (body.steps.length > 10) {
      return NextResponse.json({ error: 'Maximum of 10 steps per policy' }, { status: 400 });
    }
    stepsReplacement = body.steps.map((s: any, idx: number) => ({
      order: idx + 1,
      name: String(s?.name ?? `Step ${idx + 1}`).slice(0, 120),
      requiredPermission: typeof s?.requiredPermission === 'string' ? s.requiredPermission : '',
      approverUserIds: Array.isArray(s?.approverUserIds)
        ? s.approverUserIds.filter((u: unknown) => typeof u === 'string')
        : [],
      requireAll: Boolean(s?.requireAll),
    }));
    for (const s of stepsReplacement) {
      if (!s.requiredPermission && s.approverUserIds.length === 0) {
        return NextResponse.json(
          { error: `Step "${s.name}" needs either a required permission or at least one named approver` },
          { status: 400 },
        );
      }
    }
  }

  if (stepsReplacement) {
    await db.$transaction([
      db.approvalPolicyStep.deleteMany({ where: { policyId: params.id } }),
      db.approvalPolicy.update({
        where: { id: params.id },
        data: {
          ...data,
          steps: { create: stepsReplacement },
        },
      }),
    ]);
  } else if (Object.keys(data).length > 0) {
    await db.approvalPolicy.update({ where: { id: params.id }, data });
  }

  const fresh = await db.approvalPolicy.findUnique({
    where: { id: params.id },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json({ policy: fresh });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!(await hasPermission(userId, 'work_orders.manage_approvals'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const r = await loadPolicy(params.id, userId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });

  // Block delete if there are PENDING requests bound to this policy.
  const pending = await db.approvalRequest.count({
    where: { policyId: params.id, status: 'PENDING' },
  });
  if (pending > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${pending} pending approval request(s) reference this policy` },
      { status: 409 },
    );
  }

  await db.approvalPolicy.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
