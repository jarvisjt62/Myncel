import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && wo.organizationId !== session.user.organizationId) {
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
    const isSA = session.user.role === 'SUPER_ADMIN';
    if (!isSA && wo.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const isSA = session.user.role === 'SUPER_ADMIN';
    if (!isSA && wo.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.workOrder.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
