import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/calendar?month=2024-01
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // format: YYYY-MM
    
    let startDate: Date, endDate: Date;
    
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get work orders due in the month
    const workOrders = await db.workOrder.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { dueAt: { gte: startDate, lte: endDate } },
          { createdAt: { gte: startDate, lte: endDate } },
        ],
      },
      select: {
        id: true, woNumber: true, title: true, status: true, priority: true,
        dueAt: true, createdAt: true,
        machine: { select: { name: true } },
      },
    });

    // Get maintenance tasks due in the month
    const tasks = await db.maintenanceTask.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
        nextDueAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true, title: true, frequency: true, priority: true,
        nextDueAt: true,
        machine: { select: { name: true } },
      },
    });

    // Group events by date
    const eventsByDate: Record<string, { workOrders: any[]; tasks: any[] }> = {};

    workOrders.forEach(wo => {
      const dateKey = (wo.dueAt || wo.createdAt).toISOString().split('T')[0];
      if (!eventsByDate[dateKey]) eventsByDate[dateKey] = { workOrders: [], tasks: [] };
      eventsByDate[dateKey].workOrders.push({
        id: wo.id,
        woNumber: wo.woNumber,
        title: wo.title,
        status: wo.status,
        priority: wo.priority,
        machine: wo.machine?.name,
        type: 'work_order',
      });
    });

    tasks.forEach(task => {
      if (task.nextDueAt) {
        const dateKey = task.nextDueAt.toISOString().split('T')[0];
        if (!eventsByDate[dateKey]) eventsByDate[dateKey] = { workOrders: [], tasks: [] };
        eventsByDate[dateKey].tasks.push({
          id: task.id,
          title: task.title,
          frequency: task.frequency,
          priority: task.priority,
          machine: task.machine?.name,
          type: 'maintenance',
        });
      }
    });

    return NextResponse.json({ 
      month: monthParam || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      eventsByDate,
      stats: {
        totalWorkOrders: workOrders.length,
        totalTasks: tasks.length,
      }
    });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}
