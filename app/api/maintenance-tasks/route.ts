import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { guardPermission } from '@/lib/permissions';
import { dispatchNotifications } from '@/lib/notifications/dispatch';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const denied = await guardPermission((session.user as any).id, 'schedules.create');
    if (denied) return denied;

    const body = await req.json();
    const { title, description, machineId, taskType, frequency, priority, estimatedMinutes } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!machineId) {
      return NextResponse.json({ error: 'Machine selection is required' }, { status: 400 });
    }

    // Calculate next due date based on frequency
    const now = new Date();
    const frequencyDays: Record<string, number> = {
      DAILY: 1,
      WEEKLY: 7,
      BIWEEKLY: 14,
      MONTHLY: 30,
      QUARTERLY: 90,
      BIANNUAL: 180,
      ANNUAL: 365,
    };
    const nextDueAt = new Date(now.getTime() + (frequencyDays[frequency] || 30) * 24 * 60 * 60 * 1000);

    const task = await db.maintenanceTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        taskType: taskType || 'PREVENTIVE',
        frequency: frequency || 'MONTHLY',
        priority: priority || 'MEDIUM',
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        nextDueAt,
        machineId,
        organizationId: session.user.organizationId,
      },
      include: {
        machine: { select: { name: true } },
      },
    });

    // Fire-and-forget notifications (SMS/email/in-app/slack/webhooks)
    dispatchNotifications(session.user.organizationId, {
      type: 'schedule.task_assigned',
      taskTitle: task.title,
      machineName: task.machine?.name || 'Unknown machine',
      frequency: task.frequency,
      nextDueAt: task.nextDueAt ? task.nextDueAt.toISOString().slice(0, 10) : undefined,
      priority: task.priority,
    }).catch(err => console.error('[maintenance-tasks] dispatch failed', err));

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error('Create maintenance task error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || 'Failed to create maintenance task' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await db.maintenanceTask.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { nextDueAt: 'asc' },
      include: {
        machine: { select: { name: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get maintenance tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance tasks' }, { status: 500 });
  }
}