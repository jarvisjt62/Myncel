import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/activity - Get recent activity with user attribution
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const activities: any[] = [];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get recent work order changes (last 30 days) - with user attribution
    const recentWOs = await db.workOrder.findMany({
      where: { organizationId: orgId, updatedAt: { gte: thirtyDaysAgo } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true, woNumber: true, title: true, status: true, updatedAt: true,
        machine: { select: { name: true } },
        assignedTo: { select: { name: true, email: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    recentWOs.forEach(wo => {
      const actionUser = wo.assignedTo || wo.createdBy;
      const userName = actionUser?.name || actionUser?.email?.split('@')[0] || null;
      const action = wo.status === 'COMPLETED' ? 'completed' : wo.status === 'IN_PROGRESS' ? 'started' : 'created';
      activities.push({
        id: `wo-${wo.id}`,
        type: 'work_order',
        action,
        title: wo.title,
        description: userName
          ? `${action.charAt(0).toUpperCase() + action.slice(1)} by ${userName}`
          : `Work order ${action}`,
        machineName: wo.machine?.name,
        metadata: { woNumber: wo.woNumber, machine: wo.machine?.name, status: wo.status, user: userName },
        timestamp: wo.updatedAt.toISOString(),
        priority: 'MEDIUM',
        status: wo.status,
        user: userName,
      });
    });

    // Get recent alerts (last 30 days)
    const recentAlerts = await db.alert.findMany({
      where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
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
        description: `${alert.severity} alert ${alert.isResolved ? 'resolved' : 'triggered'}${alert.machine?.name ? ` on ${alert.machine.name}` : ''}`,
        machineName: alert.machine?.name,
        metadata: { machine: alert.machine?.name, severity: alert.severity },
        timestamp: alert.createdAt.toISOString(),
        priority: alert.severity,
        status: alert.isResolved ? 'RESOLVED' : 'ACTIVE',
        user: null,
      });
    });

    // Get recent maintenance completions
    const recentTasks = await db.maintenanceTask.findMany({
      where: {
        organizationId: orgId,
        lastCompletedAt: { gte: thirtyDaysAgo, not: null },
      },
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
          description: `${task.frequency} maintenance completed${task.machine?.name ? ` on ${task.machine.name}` : ''}`,
          machineName: task.machine?.name,
          metadata: { machine: task.machine?.name, frequency: task.frequency },
          timestamp: task.lastCompletedAt.toISOString(),
          priority: 'MEDIUM',
          status: 'COMPLETED',
          user: null,
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