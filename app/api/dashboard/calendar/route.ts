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
    const monthParam = searchParams.get('month'); // legacy format: YYYY-MM, or numeric "1"-"12"
    const yearParam = searchParams.get('year');   // optional separate year, e.g. ?year=2026&month=5

    let startDate: Date, endDate: Date;
    let yearNum: number | null = null;
    let monthNum: number | null = null; // 1-12

    if (monthParam) {
      if (monthParam.includes('-')) {
        // "YYYY-MM"
        const [yStr, mStr] = monthParam.split('-');
        const y = Number(yStr);
        const m = Number(mStr);
        if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
          yearNum = y;
          monthNum = m;
        }
      } else {
        // numeric "1"-"12" with optional separate year
        const m = Number(monthParam);
        const y = yearParam ? Number(yearParam) : new Date().getFullYear();
        if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
          yearNum = y;
          monthNum = m;
        }
      }
    }

    if (yearNum === null || monthNum === null) {
      const now = new Date();
      yearNum = now.getFullYear();
      monthNum = now.getMonth() + 1;
    }

    startDate = new Date(yearNum, monthNum - 1, 1);
    endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    // Final guard against any invalid date math
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      yearNum = now.getFullYear();
      monthNum = now.getMonth() + 1;
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
      const d = wo.dueAt || wo.createdAt;
      if (!d || Number.isNaN(new Date(d).getTime())) return;
      const dateKey = new Date(d).toISOString().split('T')[0];
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
      if (task.nextDueAt && !Number.isNaN(new Date(task.nextDueAt).getTime())) {
        const dateKey = new Date(task.nextDueAt).toISOString().split('T')[0];
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
      month: `${yearNum}-${String(monthNum).padStart(2, '0')}`,
      year: yearNum,
      monthIndex: monthNum,
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
