import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH /api/dashboard/calendar/reschedule - Reschedule a work order or maintenance task
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const body = await req.json();
    const { id, type, newDate } = body;

    if (!id || !type || !newDate) {
      return NextResponse.json({ error: 'id, type, and newDate are required' }, { status: 400 });
    }

    const parsedDate = new Date(newDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (type === 'work_order') {
      const wo = await db.workOrder.findFirst({ where: { id, organizationId: orgId } });
      if (!wo) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

      const updated = await db.workOrder.update({
        where: { id },
        data: { dueAt: parsedDate },
      });
      return NextResponse.json({ success: true, item: updated, type });
    }

    if (type === 'maintenance') {
      const task = await db.maintenanceTask.findFirst({ where: { id, organizationId: orgId } });
      if (!task) return NextResponse.json({ error: 'Maintenance task not found' }, { status: 404 });

      const updated = await db.maintenanceTask.update({
        where: { id },
        data: { nextDueAt: parsedDate },
      });
      return NextResponse.json({ success: true, item: updated, type });
    }

    return NextResponse.json({ error: 'Invalid type. Must be work_order or maintenance' }, { status: 400 });
  } catch (error) {
    console.error('Reschedule error:', error);
    return NextResponse.json({ error: 'Failed to reschedule' }, { status: 500 });
  }
}