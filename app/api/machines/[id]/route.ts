import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/machines/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const machine = await db.machine.findUnique({
      where: { id: params.id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, woNumber: true, title: true, status: true, priority: true, dueAt: true },
        },
        maintenanceTasks: {
          where: { isActive: true },
          orderBy: { nextDueAt: 'asc' },
          take: 5,
          select: { id: true, title: true, frequency: true, nextDueAt: true, lastCompletedAt: true, priority: true },
        },
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, title: true, severity: true, createdAt: true },
        },
        _count: { select: { workOrders: true, maintenanceTasks: true, alerts: true } },
      },
    });

    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && machine.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(machine);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/machines/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const machine = await db.machine.findUnique({ where: { id: params.id } });
    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const isSA = session.user.role === 'SUPER_ADMIN';
    if (!isSA && machine.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await db.machine.update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.criticality ? { criticality: body.criticality } : {}),
        ...(body.model !== undefined ? { model: body.model } : {}),
        ...(body.manufacturer !== undefined ? { manufacturer: body.manufacturer } : {}),
        ...(body.lastServiceAt ? { lastServiceAt: new Date(body.lastServiceAt) } : {}),
      },
    });

    return NextResponse.json({ success: true, machine: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
// DELETE /api/machines/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const machine = await db.machine.findUnique({ where: { id: params.id } });
    if (!machine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isSA = session.user.role === 'SUPER_ADMIN';
    if (!isSA && machine.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete cascade: alerts, work orders, maintenance tasks, then machine
    await db.alert.deleteMany({ where: { machineId: params.id } });
    await db.workOrder.deleteMany({ where: { machineId: params.id } });
    await db.maintenanceTask.deleteMany({ where: { machineId: params.id } });
    await db.machine.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
