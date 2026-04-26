import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';


// Calculate the next due date based on frequency
function calculateNextDueDate(
  frequency: string,
  intervalDays: number | null,
  intervalHours: number | null,
  lastCompletedAt: Date | null,
  totalHours: number
): Date {
  const now = new Date();
  
  // If hour-based, use machine runtime
  if (frequency === 'BY_HOURS' && intervalHours) {
    // For hour-based, we don't set a specific date but track hours
    // Return a date far in the future if hours not reached
    return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year ahead
  }

  // Calculate days to add based on frequency
  let daysToAdd = 30; // default to monthly
  switch (frequency) {
    case 'DAILY':
      daysToAdd = 1;
      break;
    case 'WEEKLY':
      daysToAdd = 7;
      break;
    case 'BIWEEKLY':
      daysToAdd = 14;
      break;
    case 'MONTHLY':
      daysToAdd = 30;
      break;
    case 'QUARTERLY':
      daysToAdd = 90;
      break;
    case 'BIANNUAL':
      daysToAdd = 180;
      break;
    case 'ANNUAL':
      daysToAdd = 365;
      break;
    case 'CUSTOM':
      daysToAdd = intervalDays || 30;
      break;
  }

  // If last completed, calculate from that date
  if (lastCompletedAt) {
    return new Date(lastCompletedAt.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  return new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

// Generate a unique work order number
async function generateWorkOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.workOrder.count({
    where: {
      woNumber: {
        startsWith: `WO-${year}-`,
      },
    },
  });
  return `WO-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Check if user has admin/owner role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !['OWNER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { dryRun = false, taskIds } = body;

    const now = new Date();
    const workOrdersCreated: Array<{
      taskId: string;
      taskTitle: string;
      machineName: string;
      woNumber: string;
    }> = [];
    const tasksSkipped: Array<{ taskId: string; reason: string }> = [];

    // Get maintenance tasks that are due
    const whereClause: Record<string, unknown> = {
      organizationId,
      isActive: true,
      nextDueAt: { lte: now },
    };

    if (taskIds && taskIds.length > 0) {
      whereClause.id = { in: taskIds };
    }

    const dueTasks = await db.maintenanceTask.findMany({
      where: whereClause,
      include: {
        machine: true,
      },
    });

    // Check for existing pending work orders for each task
    for (const task of dueTasks) {
      const existingWO = await db.workOrder.findFirst({
        where: {
          maintenanceTaskId: task.id,
          status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] },
        },
      });

      if (existingWO) {
        tasksSkipped.push({
          taskId: task.id,
          reason: 'Existing pending work order already exists',
        });
        continue;
      }

      if (dryRun) {
        workOrdersCreated.push({
          taskId: task.id,
          taskTitle: task.title,
          machineName: task.machine.name,
          woNumber: '(Preview)',
        });
        continue;
      }

      // Create work order
      const woNumber = await generateWorkOrderNumber();
      const workOrder = await db.workOrder.create({
        data: {
          woNumber,
          title: `PM: ${task.title}`,
          description: task.description || `Preventive maintenance task: ${task.title}`,
          type: 'PREVENTIVE',
          status: 'OPEN',
          priority: task.priority,
          scheduledAt: task.nextDueAt,
          dueAt: task.nextDueAt,
          estimatedMinutes: task.estimatedMinutes,
          machineId: task.machineId,
          organizationId,
          maintenanceTaskId: task.id,
        },
      });

      // Update the task's next due date
      const nextDue = calculateNextDueDate(
        task.frequency,
        task.intervalDays,
        task.intervalHours,
        task.lastCompletedAt,
        task.machine.totalHours
      );

      await db.maintenanceTask.update({
        where: { id: task.id },
        data: { nextDueAt: nextDue },
      });

      // Create alert for the work order
      await db.alert.create({
        data: {
          type: 'MAINTENANCE_DUE',
          title: 'Maintenance Work Order Created',
          message: `Work order ${woNumber} created for ${task.title} on ${task.machine.name}`,
          severity: task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          machineId: task.machineId,
          organizationId,
        },
      });

      workOrdersCreated.push({
        taskId: task.id,
        taskTitle: task.title,
        machineName: task.machine.name,
        woNumber: workOrder.woNumber,
      });
    }

    // Log audit event
    if (!dryRun && workOrdersCreated.length > 0) {
      await logAudit({
        action: 'CREATE',
        entity: 'WorkOrder',
        userId: session.user.id,
        organizationId,
        changes: {
          after: {
            count: workOrdersCreated.length,
            workOrders: workOrdersCreated.map(wo => wo.woNumber),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      dryRun,
      generated: workOrdersCreated.length,
      skipped: tasksSkipped.length,
      workOrders: workOrdersCreated,
      skippedTasks: tasksSkipped,
    });
  } catch (error) {
    console.error('Error generating work orders:', error);
    return NextResponse.json(
      { error: 'Failed to generate work orders' },
      { status: 500 }
    );
  }
}

// GET endpoint to preview what would be generated
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

    const now = new Date();

    // Get maintenance tasks that are due
    const dueTasks = await db.maintenanceTask.findMany({
      where: {
        organizationId,
        isActive: true,
        nextDueAt: { lte: now },
      },
      include: {
        machine: {
          select: { name: true, status: true },
        },
        _count: {
          select: {
            workOrders: {
              where: { status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] } },
            },
          },
        },
      },
    });

    // Filter out tasks with pending work orders
    const tasksNeedingWO = dueTasks.filter(task => task._count.workOrders === 0);

    // Get overdue tasks
    const overdueTasks = dueTasks.filter(
      task => task.nextDueAt && new Date(task.nextDueAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    return NextResponse.json({
      totalDue: dueTasks.length,
      needsWorkOrder: tasksNeedingWO.length,
      hasPendingWO: dueTasks.length - tasksNeedingWO.length,
      overdue: overdueTasks.length,
      tasks: tasksNeedingWO.map(task => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueAt: task.nextDueAt,
        machine: task.machine.name,
        machineStatus: task.machine.status,
        estimatedMinutes: task.estimatedMinutes,
        daysOverdue: task.nextDueAt 
          ? Math.floor((now.getTime() - new Date(task.nextDueAt).getTime()) / (24 * 60 * 60 * 1000))
          : 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching due maintenance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch due maintenance' },
      { status: 500 }
    );
  }
}