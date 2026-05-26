/**
 * Multi-step approval workflow engine.
 *
 * Public API:
 *   - findApplicablePolicy(orgId, trigger, wo)        → ApprovalPolicy | null
 *   - openApprovalRequest({ workOrderId, trigger, requestedTransition, requestedById })
 *   - canUserActOnStep(userId, request, step)         → bool
 *   - submitDecision({ requestId, userId, decision, comment })
 *   - cancelApprovalRequest(requestId, byUserId)
 *
 * Walking the policy:
 *   - Steps are walked in `order` ascending.
 *   - For each step we accept either (a) any user holding `requiredPermission`
 *     or (b) any user listed in `approverUserIds`.
 *   - If `requireAll` is true, every named approverUserId must approve before
 *     advancing. If false (default), one approval advances the step.
 *
 * Final-step approval re-applies `requestedTransition` to the work order
 * (e.g. "IN_PROGRESS" or "COMPLETED") and stamps `completedAt` / `startedAt`
 * exactly the way the WorkOrder PATCH route does.
 *
 * Rejection at any step rolls the WO back to `previousStatus` and marks the
 * request REJECTED with the rejecter's comment.
 */

import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import type {
  ApprovalPolicy,
  ApprovalPolicyStep,
  ApprovalRequest,
  ApprovalDecision,
  WorkOrder,
} from '@prisma/client';

export type FullPolicy = ApprovalPolicy & { steps: ApprovalPolicyStep[] };
export type FullRequest = ApprovalRequest & {
  policy: FullPolicy;
  decisions: ApprovalDecision[];
};

/** Coerce a Json field to a string array safely. */
function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return [];
}

/**
 * Find the highest-priority active policy that matches a given (org, trigger,
 * work-order) combination. "Match" = priority + type filters pass AND the
 * work order's running totalCost is at or above minTotalCost.
 *
 * If multiple policies match, we return the one with the largest minTotalCost
 * (most specific) — admins can build a tier ladder by varying threshold.
 */
export async function findApplicablePolicy(
  organizationId: string,
  trigger: 'PRE_START' | 'PRE_CLOSE' | 'VENDOR_QUOTE',
  wo: Pick<WorkOrder, 'priority' | 'type' | 'totalCost' | 'partsCost' | 'laborCost'>,
): Promise<FullPolicy | null> {
  const policies = await db.approvalPolicy.findMany({
    where: { organizationId, trigger, isActive: true },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { minTotalCost: 'desc' },
  });

  const totalCost =
    typeof wo.totalCost === 'number'
      ? wo.totalCost
      : (wo.partsCost ?? 0) + (wo.laborCost ?? 0);

  for (const p of policies) {
    if (p.steps.length === 0) continue; // a policy with no steps is a no-op
    const prios = asStringArray(p.matchPriorities);
    const types = asStringArray(p.matchTypes);
    if (prios.length > 0 && !prios.includes(wo.priority)) continue;
    if (types.length > 0 && !types.includes(wo.type)) continue;
    if (totalCost < (p.minTotalCost ?? 0)) continue;
    return p as FullPolicy;
  }
  return null;
}

/**
 * Open a new ApprovalRequest. The caller is responsible for transitioning
 * the WO to PENDING_APPROVAL after this returns.
 */
export async function openApprovalRequest(args: {
  workOrderId: string;
  trigger: 'PRE_START' | 'PRE_CLOSE' | 'VENDOR_QUOTE';
  requestedTransition: string;
  previousStatus: string;
  requestedById: string | null;
}): Promise<{ ok: true; request: FullRequest } | { ok: false; reason: string }> {
  const wo = await db.workOrder.findUnique({ where: { id: args.workOrderId } });
  if (!wo) return { ok: false, reason: 'Work order not found' };

  // Reject if there is already a PENDING request open against this WO.
  const existing = await db.approvalRequest.findFirst({
    where: { workOrderId: wo.id, status: 'PENDING' },
  });
  if (existing) {
    return { ok: false, reason: 'There is already an open approval request for this work order' };
  }

  const policy = await findApplicablePolicy(wo.organizationId, args.trigger, wo);
  if (!policy) return { ok: false, reason: 'No matching approval policy' };

  const created = await db.approvalRequest.create({
    data: {
      workOrderId: wo.id,
      organizationId: wo.organizationId,
      policyId: policy.id,
      trigger: args.trigger,
      status: 'PENDING',
      currentStepOrder: policy.steps[0]!.order,
      requestedTransition: args.requestedTransition,
      previousStatus: args.previousStatus,
      requestedById: args.requestedById,
    },
    include: {
      policy: { include: { steps: { orderBy: { order: 'asc' } } } },
      decisions: true,
    },
  });
  return { ok: true, request: created as FullRequest };
}

export async function canUserActOnStep(
  userId: string,
  step: ApprovalPolicyStep,
): Promise<boolean> {
  if (step.requiredPermission && step.requiredPermission.length > 0) {
    if (await hasPermission(userId, step.requiredPermission)) return true;
  }
  const named = asStringArray(step.approverUserIds);
  if (named.includes(userId)) return true;
  return false;
}

/**
 * Apply a decision to the current step. If APPROVED and this is the last
 * step (or the step is satisfied), advance / finalize. If REJECTED, mark
 * the entire request rejected and roll the WO back.
 */
export async function submitDecision(args: {
  requestId: string;
  userId: string;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
}): Promise<{ ok: true; request: FullRequest } | { ok: false; reason: string }> {
  const req = await db.approvalRequest.findUnique({
    where: { id: args.requestId },
    include: {
      policy: { include: { steps: { orderBy: { order: 'asc' } } } },
      decisions: true,
    },
  });
  if (!req) return { ok: false, reason: 'Request not found' };
  if (req.status !== 'PENDING') {
    return { ok: false, reason: `Request is already ${req.status.toLowerCase()}` };
  }

  const step = req.policy.steps.find((s) => s.order === req.currentStepOrder);
  if (!step) return { ok: false, reason: 'Step not found' };

  if (!(await canUserActOnStep(args.userId, step))) {
    return { ok: false, reason: 'You are not authorised to approve this step' };
  }

  // Block double-decision from the same user on the same step.
  const already = req.decisions.find(
    (d) => d.stepOrder === step.order && d.userId === args.userId,
  );
  if (already) return { ok: false, reason: 'You already decided on this step' };

  await db.approvalDecision.create({
    data: {
      requestId: req.id,
      stepOrder: step.order,
      decision: args.decision,
      comment: args.comment ?? null,
      userId: args.userId,
    },
  });

  if (args.decision === 'REJECTED') {
    // Rollback: WO returns to its previousStatus, request marked REJECTED.
    await db.$transaction([
      db.approvalRequest.update({
        where: { id: req.id },
        data: { status: 'REJECTED', decidedAt: new Date() },
      }),
      db.workOrder.update({
        where: { id: req.workOrderId },
        // previousStatus is stored as a string; cast through unknown to enum.
        data: { status: req.previousStatus as never },
      }),
    ]);
    return reload(req.id);
  }

  // APPROVED → check if step is satisfied.
  const stepDecisions = await db.approvalDecision.findMany({
    where: { requestId: req.id, stepOrder: step.order, decision: 'APPROVED' },
  });

  let stepSatisfied = false;
  if (step.requireAll) {
    const named = asStringArray(step.approverUserIds);
    if (named.length === 0) {
      // requireAll is meaningless without a named list — fall back to any.
      stepSatisfied = true;
    } else {
      const approverIds = new Set(stepDecisions.map((d) => d.userId).filter(Boolean) as string[]);
      stepSatisfied = named.every((uid) => approverIds.has(uid));
    }
  } else {
    stepSatisfied = stepDecisions.length >= 1;
  }

  if (!stepSatisfied) return reload(req.id); // wait for more approvers

  // Step satisfied — advance to next step or finalise.
  const next = req.policy.steps.find((s) => s.order > step.order);
  if (next) {
    await db.approvalRequest.update({
      where: { id: req.id },
      data: { currentStepOrder: next.order },
    });
    return reload(req.id);
  }

  // No next step → final approval. Apply the requested transition.
  const now = new Date();
  const target = req.requestedTransition;
  await db.$transaction([
    db.approvalRequest.update({
      where: { id: req.id },
      data: { status: 'APPROVED', decidedAt: now },
    }),
    db.workOrder.update({
      where: { id: req.workOrderId },
      data: {
        status: target as never,
        ...(target === 'IN_PROGRESS' ? { startedAt: now } : {}),
        ...(target === 'COMPLETED' ? { completedAt: now } : {}),
      },
    }),
  ]);
  return reload(req.id);
}

export async function cancelApprovalRequest(
  requestId: string,
  byUserId: string | null,
): Promise<{ ok: true; request: FullRequest } | { ok: false; reason: string }> {
  const req = await db.approvalRequest.findUnique({ where: { id: requestId } });
  if (!req) return { ok: false, reason: 'Request not found' };
  if (req.status !== 'PENDING') return { ok: false, reason: 'Request already finalised' };

  await db.$transaction([
    db.approvalRequest.update({
      where: { id: req.id },
      data: { status: 'CANCELLED', decidedAt: new Date() },
    }),
    db.workOrder.update({
      where: { id: req.workOrderId },
      data: { status: req.previousStatus as never },
    }),
    ...(byUserId
      ? [
          db.approvalDecision.create({
            data: {
              requestId: req.id,
              stepOrder: req.currentStepOrder,
              decision: 'REJECTED',
              comment: 'Request cancelled by requester',
              userId: byUserId,
            },
          }),
        ]
      : []),
  ]);
  return reload(req.id);
}

async function reload(
  id: string,
): Promise<{ ok: true; request: FullRequest }> {
  const fresh = await db.approvalRequest.findUnique({
    where: { id },
    include: {
      policy: { include: { steps: { orderBy: { order: 'asc' } } } },
      decisions: { orderBy: { decidedAt: 'asc' } },
    },
  });
  return { ok: true, request: fresh as FullRequest };
}
