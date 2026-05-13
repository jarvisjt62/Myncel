import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkPlanLimit } from '@/lib/plan-limits';
import { guardPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = await guardPermission(session.user.id, 'work_orders.create');
    if (denied) return denied;

    const orgId = (session.user as any).organizationId as string | undefined;
    const role = (session.user as any).role as string;
    const userEmail = session.user.email as string;
    let isPlatformAdmin = role === 'SUPER_ADMIN' || (role === 'ADMIN' && !orgId) || userEmail === 'admin@myncel.com';

    if (!isPlatformAdmin && role === 'ADMIN' && orgId) {
      const superAdminOrg = await db.organization.findFirst({
        where: { users: { some: { email: 'admin@myncel.com' } } },
        select: { id: true },
      });
      if (superAdminOrg && superAdminOrg.id === orgId) isPlatformAdmin = true;
    }

    const body = await req.json();
    const {
      title,
      description,
      machineId,
      type,
      priority,
      dueAt,
      estimatedMinutes,
      assignedToId,
      laborCost,
      partsCost,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!machineId) {
      return NextResponse.json({ error: 'Machine selection is required' }, { status: 400 });
    }

    // For platform admins, derive org from the machine
    let effectiveOrgId = orgId;
    if (isPlatformAdmin && machineId) {
      const machine = await db.machine.findUnique({ where: { id: machineId }, select: { organizationId: true } });
      if (machine) effectiveOrgId = machine.organizationId;
    }
    if (!effectiveOrgId) {
      return NextResponse.json({ error: 'Cannot determine organization' }, { status: 400 });
    }

    // Check plan limit for work orders
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

    // Generate a unique WO number (retry up to 10 times to avoid race conditions)
    let woNumber = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const woCount = await db.workOrder.count({ where: { organizationId: effectiveOrgId } });
      const candidate = `WO-${new Date().getFullYear()}-${String(woCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await db.workOrder.findUnique({ where: { woNumber: candidate } });
      if (!existing) {
        woNumber = candidate;
        break;
      }
    }
    if (!woNumber) {
      // Fallback: use timestamp to guarantee uniqueness
      woNumber = `WO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    }

    // Safely parse numeric fields
    const parsedEstMinutes = estimatedMinutes && String(estimatedMinutes).trim() !== ''
      ? parseInt(String(estimatedMinutes), 10)
      : null;
    const parsedLaborCost = laborCost && String(laborCost).trim() !== ''
      ? parseFloat(String(laborCost))
      : null;
    const parsedPartsCost = partsCost && String(partsCost).trim() !== ''
      ? parseFloat(String(partsCost))
      : null;

    // Compute total cost if either cost is provided
    const totalCost =
      parsedLaborCost !== null || parsedPartsCost !== null
        ? (parsedLaborCost ?? 0) + (parsedPartsCost ?? 0)
        : null;

    // Safely resolve assignedToId — ignore empty string
    const resolvedAssignedToId = assignedToId && String(assignedToId).trim() !== ''
      ? String(assignedToId)
      : null;

    const workOrder = await db.workOrder.create({
      data: {
        woNumber,
        title: title.trim(),
        description: description?.trim() || null,
        type: type || 'PREVENTIVE',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        dueAt: dueAt ? new Date(dueAt) : null,
        estimatedMinutes: parsedEstMinutes,
        laborCost: parsedLaborCost,
        partsCost: parsedPartsCost,
        totalCost,
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

    // Dispatch notifications asynchronously (don't block the response)
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
  } catch (error) {
    console.error('Create work order error:', error);
    // Return the actual error message to help with debugging
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || 'Failed to create work order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedOrgId = searchParams.get('organizationId') || undefined;
    const orgId = (session.user as any).organizationId as string | undefined;
    const role = (session.user as any).role as string | undefined;
    const userEmail = session.user.email as string | undefined;

    let isPlatformAdmin = role === 'SUPER_ADMIN' || (role === 'ADMIN' && !orgId) || userEmail === 'admin@myncel.com';
    if (!isPlatformAdmin && role === 'ADMIN' && orgId) {
      const superAdminOrg = await db.organization.findFirst({
        where: { users: { some: { email: 'admin@myncel.com' } } },
        select: { id: true },
      });
      if (superAdminOrg && superAdminOrg.id === orgId) isPlatformAdmin = true;
    }

    let effectiveOrgId = orgId;
    if (isPlatformAdmin && requestedOrgId) {
      effectiveOrgId = requestedOrgId;
    } else if (requestedOrgId && requestedOrgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!effectiveOrgId) {
      return NextResponse.json({ error: 'Organization is required' }, { status: 400 });
    }

    const workOrders = await db.workOrder.findMany({
      where: { organizationId: effectiveOrgId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        machine: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ workOrders });
  } catch (error) {
    console.error('Get work orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}

