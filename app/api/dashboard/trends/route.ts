import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/trends - Get month-over-month KPI trends
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const now = new Date();

    // Current month boundaries
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Previous month boundaries
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Current month stats
    const [
      currentWOs,
      prevWOs,
      currentAlerts,
      prevAlerts,
      currentTasks,
      prevTasks,
      currentCost,
      prevCost,
    ] = await Promise.all([
      // Work orders created this month
      db.workOrder.count({
        where: { organizationId: orgId, createdAt: { gte: currentMonthStart, lte: currentMonthEnd } },
      }),
      // Work orders created last month
      db.workOrder.count({
        where: { organizationId: orgId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
      // Alerts this month
      db.alert.count({
        where: { organizationId: orgId, createdAt: { gte: currentMonthStart, lte: currentMonthEnd } },
      }),
      // Alerts last month
      db.alert.count({
        where: { organizationId: orgId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
      // Maintenance tasks completed this month
      db.maintenanceTask.count({
        where: { organizationId: orgId, lastCompletedAt: { gte: currentMonthStart, lte: currentMonthEnd } },
      }),
      // Maintenance tasks completed last month
      db.maintenanceTask.count({
        where: { organizationId: orgId, lastCompletedAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
      // Cost this month
      db.workOrder.aggregate({
        where: { organizationId: orgId, completedAt: { gte: currentMonthStart, lte: currentMonthEnd } },
        _sum: { totalCost: true, laborCost: true, partsCost: true },
      }),
      // Cost last month
      db.workOrder.aggregate({
        where: { organizationId: orgId, completedAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { totalCost: true, laborCost: true, partsCost: true },
      }),
    ]);

    const calcTrend = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    const currentCostTotal =
      (currentCost._sum.totalCost || 0) ||
      (currentCost._sum.laborCost || 0) + (currentCost._sum.partsCost || 0);
    const prevCostTotal =
      (prevCost._sum.totalCost || 0) ||
      (prevCost._sum.laborCost || 0) + (prevCost._sum.partsCost || 0);

    return NextResponse.json({
      trends: {
        workOrders: {
          current: currentWOs,
          previous: prevWOs,
          change: calcTrend(currentWOs, prevWOs),
          direction: currentWOs >= prevWOs ? 'up' : 'down',
        },
        alerts: {
          current: currentAlerts,
          previous: prevAlerts,
          change: calcTrend(currentAlerts, prevAlerts),
          direction: currentAlerts >= prevAlerts ? 'up' : 'down',
        },
        maintenanceTasks: {
          current: currentTasks,
          previous: prevTasks,
          change: calcTrend(currentTasks, prevTasks),
          direction: currentTasks >= prevTasks ? 'up' : 'down',
        },
        cost: {
          current: currentCostTotal,
          previous: prevCostTotal,
          change: calcTrend(Math.round(currentCostTotal), Math.round(prevCostTotal)),
          direction: currentCostTotal >= prevCostTotal ? 'up' : 'down',
        },
      },
    });
  } catch (error) {
    console.error('Trends fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}