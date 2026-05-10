import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/export?type=equipment|workorders|tasks
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'equipment';

    let csv = '';
    const now = new Date().toISOString().split('T')[0];

    if (type === 'equipment') {
      const machines = await db.machine.findMany({
        where: { organizationId: orgId },
        select: {
          name: true, model: true, manufacturer: true, serialNumber: true,
          location: true, category: true, criticality: true, status: true,
          totalHours: true, lastServiceAt: true, yearInstalled: true,
          createdAt: true,
          _count: { select: { workOrders: true, alerts: true } },
        },
        orderBy: { name: 'asc' },
      });

      csv = 'Name,Model,Manufacturer,Serial Number,Location,Category,Criticality,Status,Total Hours,Last Service,Year Installed,Work Orders,Alerts,Created\n';
      machines.forEach(m => {
        csv += `"${m.name}","${m.model || ''}","${m.manufacturer || ''}","${m.serialNumber || ''}","${m.location || ''}","${m.category}","${m.criticality}","${m.status}",${m.totalHours},"${m.lastServiceAt?.toISOString().split('T')[0] || ''}","${m.yearInstalled || ''}",${m._count.workOrders},${m._count.alerts},"${m.createdAt.toISOString().split('T')[0]}"\n`;
      });
    } else if (type === 'workorders') {
      const workOrders = await db.workOrder.findMany({
        where: { organizationId: orgId },
        select: {
          woNumber: true, title: true, type: true, status: true, priority: true,
          dueAt: true, completedAt: true, laborCost: true, partsCost: true,
          createdAt: true,
          machine: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      csv = 'WO Number,Title,Machine,Type,Status,Priority,Assigned To,Due Date,Completed Date,Labor Cost,Parts Cost,Total Cost,Created\n';
      workOrders.forEach(wo => {
        const totalCost = (wo.laborCost || 0) + (wo.partsCost || 0);
        csv += `"${wo.woNumber}","${wo.title}","${wo.machine?.name || ''}","${wo.type}","${wo.status}","${wo.priority}","${wo.assignedTo?.name || ''}","${wo.dueAt?.toISOString().split('T')[0] || ''}","${wo.completedAt?.toISOString().split('T')[0] || ''}",${wo.laborCost || 0},${wo.partsCost || 0},${totalCost},"${wo.createdAt.toISOString().split('T')[0]}"\n`;
      });
    } else if (type === 'tasks') {
      const tasks = await db.maintenanceTask.findMany({
        where: { organizationId: orgId },
        select: {
          title: true, taskType: true, frequency: true, priority: true,
          isActive: true, nextDueAt: true, lastCompletedAt: true,
          estimatedMinutes: true,
          machine: { select: { name: true } },
        },
        orderBy: { nextDueAt: 'asc' },
      });

      csv = 'Title,Machine,Type,Frequency,Priority,Active,Next Due,Last Completed,Est. Minutes\n';
      tasks.forEach(t => {
        csv += `"${t.title}","${t.machine?.name || ''}","${t.taskType}","${t.frequency}","${t.priority}","${t.isActive ? 'Yes' : 'No'}","${t.nextDueAt?.toISOString().split('T')[0] || ''}","${t.lastCompletedAt?.toISOString().split('T')[0] || ''}",${t.estimatedMinutes || ''}\n`;
      });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}-export-${now}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
