/**
 * /api/work-order-templates/[id]/spawn
 *
 * Creates a new WorkOrder from a template. The user supplies the
 * machineId (required) and optional dueAt + assignedToId + override
 * fields. Everything else is copied from the template.
 *
 * Returns the created WorkOrder. Audit-logs as both
 * WO_TEMPLATE_SPAWNED and WORK_ORDER_CREATED.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkPlanLimit } from '@/lib/plan-limits';
import { guardPermission } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const denied = await guardPermission(session.user.id, 'work_orders.create');
  if (denied) return denied;

  const sessOrgId = (session.user as any).organizationId as string | undefined;
  const role = (session.user as any).role as string | undefined;
  const isPlatformAdmin = role === 'SUPER_ADMIN' || (role === 'ADMIN' && !sessOrgId);

  const { id: templateId } = await params;
  const tpl = await db.workOrderTemplate.findUnique({ where: { id: templateId } });
  if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  // Org boundary check
  if (!isPlatformAdmin && tpl.organizationId !== sessOrgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (tpl.isArchived) {
    return NextResponse.json({ error: 'Cannot spawn from an archived template' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));
  const {
    machineId,
    dueAt,
    assignedToId,
    titleOverride,
    descriptionOverride,
    priorityOverride,
    estimatedMinutesOverride,
  } = body ?? {};

  if (!machineId) {
    return NextResponse.json({ error: 'machineId is required' }, { status: 400 });
  }

  // Resolve effective org from machine, ensuring it belongs to the
  // template's org (or platform admin can spawn cross-org if they
  // really want — but only when the machine's org matches the
  // template's org, never otherwise).
  const machine = await db.machine.findUnique({
    where: { id: machineId },
    select: { id: true, organizationId: true, name: true },
  });
  if (!machine) return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
  if (machine.organizationId !== tpl.organizationId) {
    return NextResponse.json({ error: 'Machine and template must belong to the same organization' }, { status: 400 });
  }
  const effectiveOrgId = tpl.organizationId;

  // Plan limit check
  const limitCheck = await checkPlanLimit(effectiveOrgId, 'workOrders');
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: `Work order limit reached. Your ${limitCheck.plan} plan allows up to ${limitCheck.limit} work orders per month. Please upgrade your plan to create more.`,
      code: 'PLAN_LIMIT_EXCEEDED',
      resource: 'workOrders',
      current: limitCheck.current,
      limit: limitCheck.limit,
      plan: limitCheck.plan,
    }, { status: 403 });
  }

  // Generate a unique WO number — same logic as /api/work-orders POST
  let woNumber = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    const woCount = await db.workOrder.count({ where: { organizationId: effectiveOrgId } });
    const candidate = `WO-${new Date().getFullYear()}-${String(woCount + 1 + attempt).padStart(4, '0')}`;
    const existing = await db.workOrder.findUnique({ where: { woNumber: candidate } });
    if (!existing) { woNumber = candidate; break; }
  }
  if (!woNumber) {
    woNumber = `WO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  }

  const totalCost =
    tpl.laborCost != null || tpl.partsCost != null
      ? (tpl.laborCost ?? 0) + (tpl.partsCost ?? 0)
      : null;

  const orgCurrency = await db.organization.findUnique({
    where: { id: effectiveOrgId },
    select: { currency: true },
  }).then(o => o?.currency ?? tpl.currency ?? 'USD').catch(() => tpl.currency ?? 'USD');

  const resolvedAssignedToId = assignedToId && String(assignedToId).trim() !== ''
    ? String(assignedToId) : null;

  const finalEstMinutes = estimatedMinutesOverride != null && String(estimatedMinutesOverride).trim() !== ''
    ? parseInt(String(estimatedMinutesOverride), 10)
    : tpl.estimatedMinutes;

  const workOrder = await db.workOrder.create({
    data: {
      woNumber,
      title: (titleOverride && String(titleOverride).trim()) || tpl.title,
      description: (descriptionOverride && String(descriptionOverride).trim()) || tpl.description,
      type: tpl.type,
      priority: (priorityOverride as any) || tpl.priority,
      status: 'OPEN',
      dueAt: dueAt ? new Date(dueAt) : null,
      estimatedMinutes: finalEstMinutes,
      laborCost: tpl.laborCost,
      partsCost: tpl.partsCost,
      totalCost,
      currency: orgCurrency,
      notes: tpl.notes,
      assignedToId: resolvedAssignedToId,
      machineId,
      organizationId: effectiveOrgId,
      createdById: session.user.id,
    },
    include: {
      machine: { select: { name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  // Audit + notifications (fire-and-forget)
  logAuditEvent({
    action: 'WO_TEMPLATE_SPAWNED',
    entity: 'WorkOrderTemplate',
    entityId: tpl.id,
    userId: session.user.id,
    organizationId: effectiveOrgId,
    metadata: { woNumber, machineId, templateName: tpl.name },
  }).catch(() => {});

  logAuditEvent({
    action: 'WORK_ORDER_CREATED',
    entity: 'WorkOrder',
    entityId: workOrder.id,
    userId: session.user.id,
    organizationId: effectiveOrgId,
    metadata: { woNumber, fromTemplate: tpl.name },
  }).catch(() => {});

  try {
    const { dispatchNotifications } = await import('@/lib/notifications/dispatch');
    dispatchNotifications(effectiveOrgId, {
      type: 'work_order.created',
      workOrderNumber: workOrder.woNumber,
      title: workOrder.title,
      machineName: workOrder.machine?.name ?? '',
      priority: workOrder.priority,
    }).catch((err: unknown) => console.error('Notification dispatch error:', err));
  } catch (err) {
    console.error('Failed to import dispatch module:', err);
  }

  return NextResponse.json({ success: true, workOrder }, { status: 201 });
}
