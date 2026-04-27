import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/activity - Get recent activity for the dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const activities: any[] = [];

    // Get recent work order changes (last 30 days)
    const recentWOs = await db.workOrder.findMany({
      where: { organizationId: orgId, updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true, woNumber: true, title: true, status: true, updatedAt: true,
        machine: { select: { name: true } },
      },
    });

    recentWOs.forEach(wo => {
      activities.push({
        id: `wo-${wo.id}`,
        type: 'work_order',
        action: wo.status === 'COMPLETED' ? 'completed' : wo.status === 'IN_PROGRESS' ? 'started' : 'created',
        title: wo.title,
        metadata: { woNumber: wo.woNumber, machine: wo.machine?.name, status: wo.status },
        timestamp: wo.updatedAt.toISOString(),
      });
    });

    // Get recent alerts (last 30 days)
    const recentAlerts = await db.alert.findMany({
      where: { organizationId: orgId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, title: true, severity: true, isResolved: true, createdAt: true,
        machine: { select: { name: true } },
      },
    });

    recentAlerts.forEach(alert => {
      activities.push({
        id: `alert-${alert.id}`,
        type: 'alert',
        action: alert.isResolved ? 'resolved' : 'triggered',
        title: alert.title,
        metadata: { machine: alert.machine?.name, severity: alert.severity },
        timestamp: alert.createdAt.toISOString(),
      });
    });

    // Get recent maintenance completions
    const recentTasks = await db.maintenanceTask.findMany({
      where: { organizationId: orgId, lastCompletedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), not: null } },
      orderBy: { lastCompletedAt: 'desc' },
      take: 10,
      select: {
        id: true, title: true, frequency: true, lastCompletedAt: true,
        machine: { select: { name: true } },
      },
    });

    recentTasks.forEach(task => {
      if (task.lastCompletedAt) {
        activities.push({
          id: `task-${task.id}`,
          type: 'maintenance',
          action: 'completed',
          title: task.title,
          metadata: { machine: task.machine?.name, frequency: task.frequency },
          timestamp: task.lastCompletedAt.toISOString(),
        });
      }
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ activities: activities.slice(0, 20) });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
