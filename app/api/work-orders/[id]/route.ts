import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { guardPermission, hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

function canManageWorkOrderRecord(session: any, organizationId: string) {
  const user = session?.user as any;
  return user?.role === 'SUPER_ADMIN' || user?.email === 'admin@myncel.com' || user?.organizationId === organizationId;
}

// GET /api/work-orders/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const wo = await db.workOrder.findUnique({
      where: { id: params.id },
      include: {
        machine: { select: { id: true, name: true, model: true, manufacturer: true, location: true, status: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        parts: { include: { part: { select: { name: true, partNumber: true } } } },
      },
    });

    if (!wo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!canManageWorkOrderRecord(session, wo.organizationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(wo);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/work-orders/[id] - update status, assign, etc.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const wo = await db.workOrder.findUnique({ where: { id: params.id } });
    if (!wo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!canManageWorkOrderRecord(session, wo.organizationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Decide which permission gates this update. We accept the request if
    // the user has the permission matching the specific action they're taking.
    const userId = session.user.id;
    const bodyKeys = Object.keys(body);
    const onlyStatus = bodyKeys.length === 1 && bodyKeys[0] === 'status';
    const onlyAssign = bodyKeys.length === 1 && bodyKeys[0] === 'assignedToId';

    let requiredPerm = 'work_orders.edit';
    if (onlyStatus && (body.status === 'COMPLETED' || body.status === 'DONE' || body.status === 'CLOSED')) {
      requiredPerm = 'work_orders.close';
    } else if (onlyAssign) {
      requiredPerm = 'work_orders.assign';
    }

    const denied = await guardPermission(userId, requiredPerm);
    if (denied) {
      // Graceful fallback: if they have the broader edit perm, allow it anyway.
      if (requiredPerm !== 'work_orders.edit') {
        const hasEdit = await hasPermission(userId, 'work_orders.edit');
        if (!hasEdit) return denied;
      } else {
        return denied;
      }
    }

    const now = new Date();
    const updated = await db.workOrder.update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.status === 'COMPLETED' ? { completedAt: now, actualMinutes: body.actualMinutes ?? wo.estimatedMinutes } : {}),
        ...(body.status === 'IN_PROGRESS' && !wo.startedAt ? { startedAt: now } : {}),
        ...(body.title ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(body.dueAt !== undefined ? { dueAt: body.dueAt ? new Date(body.dueAt) : null } : {}),
        ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId || null } : {}),
        ...(body.priority ? { priority: body.priority } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.completionNotes !== undefined ? { completionNotes: body.completionNotes } : {}),
        ...(body.actualMinutes !== undefined ? { actualMinutes: body.actualMinutes } : {}),
        ...(body.laborCost !== undefined ? { laborCost: body.laborCost } : {}),
        ...(body.partsCost !== undefined ? { partsCost: body.partsCost } : {}),
      },
      include: {
        machine: { select: { name: true } },
        assignedTo: { select: { name: true, email: true } },
      },
    });

    // Dispatch notification when work order is completed
    if (body.status === 'COMPLETED') {
      try {
        const { dispatchNotifications } = await import('@/lib/notifications/dispatch');
        dispatchNotifications(updated.organizationId, {
          type: 'work_order.completed',
          workOrderNumber: updated.woNumber,
          title: updated.title,
          machineName: updated.machine?.name ?? '',
          completedBy: session.user.name ?? session.user.email ?? 'Unknown',
        }).catch((err: unknown) => console.error('Completion notification error:', err));
      } catch (err) {
        console.error('Failed to import dispatch module:', err);
      }
    }

    return NextResponse.json({ success: true, workOrder: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
// DELETE /api/work-orders/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const wo = await db.workOrder.findUnique({ where: { id: params.id } });
    if (!wo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!canManageWorkOrderRecord(session, wo.organizationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const denied = await guardPermission(session.user.id, 'work_orders.delete');
    if (denied) return denied;
    await db.workOrder.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
