import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/report - Generate maintenance report data
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const period = searchParams.get('period') || '30'; // days

    const daysBack = parseInt(period);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch all report data in parallel
    const [org, machines, workOrders, completedWOs, maintenanceTasks, alerts] = await Promise.all([
      db.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
      db.machine.findMany({
        where: { organizationId: orgId },
        select: {
          id: true, name: true, model: true, location: true, status: true, criticality: true, lastServiceAt: true,
          _count: { select: { workOrders: true, maintenanceTasks: true } },
        },
        orderBy: { name: 'asc' },
      }),
      db.workOrder.findMany({
        where: { organizationId: orgId, createdAt: { gte: startDate } },
        select: {
          id: true, woNumber: true, title: true, status: true, priority: true, type: true,
          createdAt: true, completedAt: true, dueAt: true, totalCost: true, laborCost: true, partsCost: true,
          machine: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.workOrder.findMany({
        where: { organizationId: orgId, status: 'COMPLETED', completedAt: { gte: startDate } },
        select: { totalCost: true, laborCost: true, partsCost: true, actualMinutes: true, estimatedMinutes: true },
      }),
      db.maintenanceTask.findMany({
        where: { organizationId: orgId, nextDueAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        select: {
          id: true, title: true, frequency: true, priority: true, nextDueAt: true, lastCompletedAt: true,
          machine: { select: { name: true } },
        },
        orderBy: { nextDueAt: 'asc' },
      }),
      db.alert.findMany({
        where: { organizationId: orgId, createdAt: { gte: startDate } },
        select: { id: true, title: true, severity: true, isResolved: true, createdAt: true, machine: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate summary stats
    const totalCost = completedWOs.reduce((sum, wo) => {
      return sum + (wo.totalCost || (wo.laborCost || 0) + (wo.partsCost || 0));
    }, 0);

    const avgCompletionTime = completedWOs
      .filter(wo => wo.actualMinutes)
      .reduce((sum, wo, _, arr) => sum + (wo.actualMinutes! / arr.length), 0);

    const openWOs = workOrders.filter(wo => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS');
    const overdueWOs = workOrders.filter(wo => wo.dueAt && new Date(wo.dueAt) < new Date() && wo.status !== 'COMPLETED');
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && !a.isResolved);

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: { days: daysBack, startDate: startDate.toISOString(), endDate: new Date().toISOString() },
      organization: org?.name || 'Your Organization',
      summary: {
        totalMachines: machines.length,
        operationalMachines: machines.filter(m => m.status === 'OPERATIONAL').length,
        criticalMachines: machines.filter(m => m.status === 'BREAKDOWN').length,
        totalWorkOrders: workOrders.length,
        completedWorkOrders: workOrders.filter(wo => wo.status === 'COMPLETED').length,
        openWorkOrders: openWOs.length,
        overdueWorkOrders: overdueWOs.length,
        totalMaintenanceCost: Math.round(totalCost * 100) / 100,
        avgCompletionTimeMinutes: Math.round(avgCompletionTime),
        totalAlerts: alerts.length,
        unresolvedAlerts: alerts.filter(a => !a.isResolved).length,
        criticalAlerts: criticalAlerts.length,
      },
      machines: machines.map(m => ({
        name: m.name,
        model: m.model || '—',
        location: m.location || '—',
        status: m.status,
        criticality: m.criticality,
        lastService: m.lastServiceAt ? new Date(m.lastServiceAt).toLocaleDateString() : 'Never',
        workOrders: m._count.workOrders,
        maintenanceTasks: m._count.maintenanceTasks,
      })),
      workOrders: workOrders.slice(0, 50).map(wo => ({
        woNumber: wo.woNumber,
        title: wo.title,
        machine: wo.machine?.name || '—',
        status: wo.status,
        priority: wo.priority,
        type: wo.type,
        assignedTo: wo.assignedTo?.name || 'Unassigned',
        created: new Date(wo.createdAt).toLocaleDateString(),
        completed: wo.completedAt ? new Date(wo.completedAt).toLocaleDateString() : '—',
        cost: wo.totalCost || (wo.laborCost || 0) + (wo.partsCost || 0),
      })),
      upcomingMaintenance: maintenanceTasks.slice(0, 20).map(t => ({
        title: t.title,
        machine: t.machine?.name || '—',
        frequency: t.frequency,
        priority: t.priority,
        nextDue: t.nextDueAt ? new Date(t.nextDueAt).toLocaleDateString() : '—',
        lastCompleted: t.lastCompletedAt ? new Date(t.lastCompletedAt).toLocaleDateString() : 'Never',
      })),
      recentAlerts: alerts.slice(0, 20).map(a => ({
        title: a.title,
        machine: a.machine?.name || '—',
        severity: a.severity,
        status: a.isResolved ? 'Resolved' : 'Active',
        date: new Date(a.createdAt).toLocaleDateString(),
      })),
    };

    if (format === 'csv') {
      // Generate CSV report
      const lines: string[] = [];
      lines.push(`Maintenance Report - ${reportData.organization}`);
      lines.push(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`);
      lines.push(`Period: Last ${daysBack} days`);
      lines.push('');
      lines.push('SUMMARY');
      lines.push(`Total Machines,${reportData.summary.totalMachines}`);
      lines.push(`Operational,${reportData.summary.operationalMachines}`);
      lines.push(`Critical,${reportData.summary.criticalMachines}`);
      lines.push(`Total Work Orders,${reportData.summary.totalWorkOrders}`);
      lines.push(`Completed,${reportData.summary.completedWorkOrders}`);
      lines.push(`Open,${reportData.summary.openWorkOrders}`);
      lines.push(`Overdue,${reportData.summary.overdueWorkOrders}`);
      lines.push(`Total Cost,$${reportData.summary.totalMaintenanceCost}`);
      lines.push(`Unresolved Alerts,${reportData.summary.unresolvedAlerts}`);
      lines.push('');
      lines.push('WORK ORDERS');
      lines.push('WO#,Title,Machine,Status,Priority,Assigned To,Created,Completed,Cost');
      reportData.workOrders.forEach(wo => {
        lines.push(`${wo.woNumber},"${wo.title}","${wo.machine}",${wo.status},${wo.priority},"${wo.assignedTo}",${wo.created},${wo.completed},$${wo.cost}`);
      });
      lines.push('');
      lines.push('UPCOMING MAINTENANCE');
      lines.push('Task,Machine,Frequency,Priority,Next Due,Last Completed');
      reportData.upcomingMaintenance.forEach(t => {
        lines.push(`"${t.title}","${t.machine}",${t.frequency},${t.priority},${t.nextDue},${t.lastCompleted}`);
      });

      const csv = lines.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="maintenance_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}