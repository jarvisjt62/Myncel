import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Run all queries in parallel for efficiency
    const [
      workOrdersCompleted,
      workOrdersCreated,
      avgCompletionTime,
      workOrdersByStatus,
      workOrdersByPriority,
      workOrdersByType,
      maintenanceTasksCompleted,
      machinesStats,
      partsLowStock,
      alertsByType,
      laborCosts,
      partsCosts,
      recentActivity,
    ] = await Promise.all([
      // Work orders completed in period
      db.workOrder.count({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: { gte: startDate },
        },
      }),

      // Work orders created in period
      db.workOrder.count({
        where: {
          organizationId,
          createdAt: { gte: startDate },
        },
      }),

      // Average completion time (in hours)
      db.workOrder.aggregate({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: { gte: startDate },
          startedAt: { not: null },
        },
        _avg: {
          actualMinutes: true,
        },
      }),

      // Work orders by status
      db.workOrder.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { id: true },
      }),

      // Work orders by priority
      db.workOrder.groupBy({
        by: ['priority'],
        where: { organizationId },
        _count: { id: true },
      }),

      // Work orders by type
      db.workOrder.groupBy({
        by: ['type'],
        where: { organizationId },
        _count: { id: true },
      }),

      // Maintenance tasks completed
      db.maintenanceTask.count({
        where: {
          organizationId,
          lastCompletedAt: { gte: startDate },
        },
      }),

      // Machine statistics
      db.machine.aggregate({
        where: { organizationId },
        _count: { id: true },
        _sum: { totalHours: true },
      }),

      // Parts with low stock
      db.part.count({
        where: {
          organizationId,
          quantity: { lte: db.part.fields.minQuantity },
        },
      }),

      // Alerts by type
      db.alert.groupBy({
        by: ['type'],
        where: {
          organizationId,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // Total labor costs
      db.workOrder.aggregate({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: { gte: startDate },
        },
        _sum: { laborCost: true },
      }),

      // Total parts costs
      db.workOrder.aggregate({
        where: {
          organizationId,
          status: 'COMPLETED',
          completedAt: { gte: startDate },
        },
        _sum: { partsCost: true },
      }),

      // Recent activity (last 10 work orders)
      db.workOrder.findMany({
        where: { organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          woNumber: true,
          title: true,
          status: true,
          updatedAt: true,
          machine: {
            select: { name: true },
          },
          assignedTo: {
            select: { name: true },
          },
        },
      }),
    ]);

    // Calculate metrics
    const totalMachines = machinesStats._count.id || 0;
    const totalHours = machinesStats._sum.totalHours || 0;
    const avgHoursPerMachine = totalMachines > 0 ? totalHours / totalMachines : 0;

    // Work order trends (by week for the period)
    const workOrderTrends = await getWorkOrderTrends(organizationId, startDate);

    // Machine reliability score (based on breakdown alerts vs operational machines)
    const operationalMachines = await db.machine.count({
      where: {
        organizationId,
        status: 'OPERATIONAL',
      },
    });
    const reliabilityScore = totalMachines > 0 
      ? Math.round((operationalMachines / totalMachines) * 100) 
      : 100;

    // PM compliance rate
    const totalMaintenanceTasks = await db.maintenanceTask.count({
      where: {
        organizationId,
        isActive: true,
        nextDueAt: { lte: now },
      },
    });
    const completedOnTime = await db.maintenanceTask.count({
      where: {
        organizationId,
        isActive: true,
        nextDueAt: { lte: now },
        lastCompletedAt: { gte: startDate },
      },
    });
    const pmComplianceRate = totalMaintenanceTasks > 0 
      ? Math.round((completedOnTime / totalMaintenanceTasks) * 100) 
      : 100;

    return NextResponse.json({
      period,
      startDate,
      endDate: now,
      summary: {
        workOrdersCompleted,
        workOrdersCreated,
        avgCompletionTimeHours: avgCompletionTime._avg.actualMinutes 
          ? Math.round(avgCompletionTime._avg.actualMinutes / 60) 
          : null,
        maintenanceTasksCompleted,
        totalLaborCost: laborCosts._sum.laborCost || 0,
        totalPartsCost: partsCosts._sum.partsCost || 0,
        totalCost: (laborCosts._sum.laborCost || 0) + (partsCosts._sum.partsCost || 0),
      },
      machines: {
        total: totalMachines,
        totalRuntimeHours: totalHours,
        avgHoursPerMachine,
        operational: operationalMachines,
        reliabilityScore,
      },
      maintenance: {
        tasksCompleted: maintenanceTasksCompleted,
        pmComplianceRate,
      },
      inventory: {
        lowStockParts: partsLowStock,
      },
      workOrders: {
        byStatus: workOrdersByStatus.map(s => ({
          status: s.status,
          count: s._count.id,
        })),
        byPriority: workOrdersByPriority.map(p => ({
          priority: p.priority,
          count: p._count.id,
        })),
        byType: workOrdersByType.map(t => ({
          type: t.type,
          count: t._count.id,
        })),
        trends: workOrderTrends,
      },
      alerts: {
        byType: alertsByType.map(a => ({
          type: a.type,
          count: a._count.id,
        })),
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper function to get work order trends by week
async function getWorkOrderTrends(organizationId: string, startDate: Date) {
  const workOrders = await db.$queryRaw<{ week: Date; created: bigint; completed: bigint }[]>`
    WITH RECURSIVE weeks AS (
      SELECT date_trunc('week', ${startDate}) as week
      UNION ALL
      SELECT week + interval '1 week'
      FROM weeks
      WHERE week < date_trunc('week', CURRENT_DATE)
    )
    SELECT 
      w.week,
      COALESCE(created.count, 0) as created,
      COALESCE(completed.count, 0) as completed
    FROM weeks w
    LEFT JOIN (
      SELECT date_trunc('week', "createdAt") as week, COUNT(*) as count
      FROM work_orders
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= ${startDate}
      GROUP BY date_trunc('week', "createdAt")
    ) created ON w.week = created.week
    LEFT JOIN (
      SELECT date_trunc('week', "completedAt") as week, COUNT(*) as count
      FROM work_orders
      WHERE "organizationId" = ${organizationId}
        AND "completedAt" >= ${startDate}
        AND status = 'COMPLETED'
      GROUP BY date_trunc('week', "completedAt")
    ) completed ON w.week = completed.week
    ORDER BY w.week ASC
  `;

  return workOrders.map(wo => ({
    week: wo.week,
    created: Number(wo.created),
    completed: Number(wo.completed),
  }));
}