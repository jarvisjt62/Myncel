/**
 * GET  /api/approval-policies   — list policies for current org
 * POST /api/approval-policies   — create a policy
 *
 * A policy gates work-order transitions. See lib/approvals/engine.ts.
 *
 * POST body shape:
 *   {
 *     name: string;
 *     description?: string;
 *     trigger: "PRE_START" | "PRE_CLOSE" | "VENDOR_QUOTE";
 *     matchPriorities?: string[]; // e.g. ["CRITICAL","HIGH"]
 *     matchTypes?: string[];      // e.g. ["EMERGENCY"]
 *     minTotalCost?: number;
 *     isActive?: boolean;
 *     steps: Array<{
 *       order: number;
 *       name: string;
 *       requiredPermission?: string;
 *       approverUserIds?: string[];
 *       requireAll?: boolean;
 *     }>;
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const VALID_TRIGGERS = new Set(['PRE_START', 'PRE_CLOSE', 'VENDOR_QUOTE']);
const VALID_PRIORITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
const VALID_TYPES = new Set(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'PROJECT']);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await safeQuery(
    () => db.user.findUnique({ where: { id: (session.user as any).id }, select: { organizationId: true } }),
    null,
  );
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const policies = await safeQuery(
    () =>
      db.approvalPolicy.findMany({
        where: { organizationId: user.organizationId! },
        orderBy: [{ trigger: 'asc' }, { minTotalCost: 'desc' }, { name: 'asc' }],
        include: { steps: { orderBy: { order: 'asc' } } },
      }),
    [],
  );

  return NextResponse.json({ policies });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  if (!(await hasPermission(userId, 'work_orders.manage_approvals'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim();
  const trigger = String(body?.trigger ?? '');
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!VALID_TRIGGERS.has(trigger)) return NextResponse.json({ error: 'Invalid trigger' }, { status: 400 });

  const matchPriorities = Array.isArray(body?.matchPriorities)
    ? body.matchPriorities.filter((p: unknown) => typeof p === 'string' && VALID_PRIORITIES.has(p))
    : [];
  const matchTypes = Array.isArray(body?.matchTypes)
    ? body.matchTypes.filter((t: unknown) => typeof t === 'string' && VALID_TYPES.has(t))
    : [];
  const minTotalCost = Number(body?.minTotalCost) || 0;
  const isActive = body?.isActive !== false;

  const stepsIn = Array.isArray(body?.steps) ? body.steps : [];
  if (stepsIn.length === 0) {
    return NextResponse.json({ error: 'At least one step is required' }, { status: 400 });
  }
  if (stepsIn.length > 10) {
    return NextResponse.json({ error: 'Maximum of 10 steps per policy' }, { status: 400 });
  }

  // Re-number steps 1..N just in case the client sent gaps.
  const steps = stepsIn.map((s: any, idx: number) => ({
    order: idx + 1,
    name: String(s?.name ?? `Step ${idx + 1}`).slice(0, 120),
    requiredPermission: typeof s?.requiredPermission === 'string' ? s.requiredPermission : '',
    approverUserIds: Array.isArray(s?.approverUserIds)
      ? s.approverUserIds.filter((u: unknown) => typeof u === 'string')
      : [],
    requireAll: Boolean(s?.requireAll),
  }));

  // Each step must specify either a permission OR at least one user.
  for (const s of steps) {
    if (!s.requiredPermission && s.approverUserIds.length === 0) {
      return NextResponse.json(
        { error: `Step "${s.name}" needs either a required permission or at least one named approver` },
        { status: 400 },
      );
    }
  }

  const created = await db.approvalPolicy.create({
    data: {
      name,
      description: typeof body?.description === 'string' ? body.description : null,
      trigger: trigger as any,
      matchPriorities,
      matchTypes,
      minTotalCost,
      isActive,
      organizationId: user.organizationId,
      steps: {
        create: steps.map((s) => ({
          order: s.order,
          name: s.name,
          requiredPermission: s.requiredPermission,
          approverUserIds: s.approverUserIds,
          requireAll: s.requireAll,
        })),
      },
    },
    include: { steps: { orderBy: { order: 'asc' } } },
  });

  return NextResponse.json({ policy: created });
}
