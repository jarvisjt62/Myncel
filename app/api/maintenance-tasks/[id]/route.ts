import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/maintenance-tasks/[id] - mark done or update
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const task = await db.maintenanceTask.findUnique({ where: { id: params.id } });

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    const isSA = session.user.role === 'SUPER_ADMIN';
    if (!isSA && task.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate next due date based on frequency
    const now = new Date();
    let nextDue: Date | null = null;
    if (body.markDone) {
      const freq = task.frequency;
      const intervalDays = task.intervalDays;
      const days = intervalDays ? intervalDays : (freq === 'DAILY' ? 1 : freq === 'WEEKLY' ? 7 : freq === 'BIWEEKLY' ? 14
        : freq === 'MONTHLY' ? 30 : freq === 'QUARTERLY' ? 90
        : freq === 'BIANNUAL' ? 180 : freq === 'ANNUAL' ? 365 : 30);
      nextDue = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    const updated = await db.maintenanceTask.update({
      where: { id: params.id },
      data: {
        ...(body.markDone ? { lastCompletedAt: now, nextDueAt: nextDue } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
      include: { machine: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/maintenance-tasks/[id] - delete a task
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const task = await db.maintenanceTask.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const isSA = session.user.role === 'SUPER_ADMIN';
    if (!isSA && task.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.maintenanceTask.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET /api/maintenance-tasks/[id] - get a single task
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const task = await db.maintenanceTask.findUnique({
      where: { id: params.id },
      include: { machine: { select: { name: true, model: true, location: true } } },
    });

    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && task.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}