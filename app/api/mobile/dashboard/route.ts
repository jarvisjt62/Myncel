import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUser } from '@/lib/mobile-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mobile/dashboard
 * Header: Authorization: Bearer <token>
 *
 * Returns a summarised dashboard payload tailored for the mobile app:
 *   - counts (machines, open work orders, overdue tasks, unread alerts)
 *   - recent work orders, upcoming maintenance, latest alerts
 */
export async function GET(req: NextRequest) {
  const user = await getMobileUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!user.organizationId) {
    return NextResponse.json({
      counts: {
        machines: 0,
        openWorkOrders: 0,
        overdueTasks: 0,
        unreadAlerts: 0,
      },
      recentWorkOrders: [],
      upcomingTasks: [],
      recentAlerts: [],
    })
  }

  const orgId = user.organizationId
  const now = new Date()

  try {
    const [
      machinesCount,
      openWorkOrdersCount,
      overdueTasksCount,
      unreadAlertsCount,
      recentWorkOrders,
      upcomingTasks,
      recentAlerts,
    ] = await Promise.all([
      db.machine.count({ where: { organizationId: orgId } }).catch(() => 0),
      db.workOrder
        .count({
          where: {
            organizationId: orgId,
            status: { in: ['OPEN', 'IN_PROGRESS'] as any },
          },
        })
        .catch(() => 0),
      db.maintenanceTask
        .count({
          where: {
            organizationId: orgId,
            isActive: true,
            nextDueAt: { lt: now },
          },
        })
        .catch(() => 0),
      db.alert
        .count({
          where: {
            organizationId: orgId,
            isRead: false,
          },
        })
        .catch(() => 0),
      db.workOrder
        .findMany({
          where: { organizationId: orgId },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          include: {
            machine: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        })
        .catch(() => []),
      db.maintenanceTask
        .findMany({
          where: {
            organizationId: orgId,
            isActive: true,
          },
          orderBy: { nextDueAt: 'asc' },
          take: 5,
          include: {
            machine: { select: { id: true, name: true } },
          },
        })
        .catch(() => []),
      db.alert
        .findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            machine: { select: { id: true, name: true } },
          },
        })
        .catch(() => []),
    ])

    return NextResponse.json({
      counts: {
        machines: machinesCount,
        openWorkOrders: openWorkOrdersCount,
        overdueTasks: overdueTasksCount,
        unreadAlerts: unreadAlertsCount,
      },
      recentWorkOrders,
      upcomingTasks,
      recentAlerts,
    })
  } catch (err) {
    console.error('[mobile/dashboard] error:', err)
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}
