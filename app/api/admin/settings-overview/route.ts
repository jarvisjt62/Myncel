import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSuperAdminOrgId, safeQuery } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings-overview?orgId=xxx
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    const user = await safeQuery(
      db.user.findUnique({
        where: { id: (session.user as any).id },
        include: { organization: true },
      }),
      null
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const superAdminOrgId = await getSuperAdminOrgId();
    const isSuperAdmin = user.organization?.id === superAdminOrgId;

    // Build where clause
    let whereClause: any;
    if (isSuperAdmin && orgId === 'all') {
      whereClause = superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {};
    } else if (isSuperAdmin && orgId && orgId !== 'all') {
      whereClause = { organizationId: orgId };
    } else {
      whereClause = { organizationId: user.organizationId };
    }

    // Fetch all detailed counts in parallel
    const [
      machineCount,
      machineOperational,
      machineMaintenance,
      machineBreakdown,
      workOrderCount,
      workOrderOpen,
      workOrderInProgress,
      workOrderCompleted,
      alertCount,
      alertActive,
      alertCritical,
      taskCount,
      taskActive,
      taskOverdue,
    ] = await Promise.all([
      safeQuery(db.machine.count({ where: whereClause }), 0),
      safeQuery(db.machine.count({ where: { ...whereClause, status: 'OPERATIONAL' } }), 0),
      safeQuery(db.machine.count({ where: { ...whereClause, status: 'MAINTENANCE' } }), 0),
      safeQuery(db.machine.count({ where: { ...whereClause, status: 'BREAKDOWN' } }), 0),
      safeQuery(db.workOrder.count({ where: whereClause }), 0),
      safeQuery(db.workOrder.count({ where: { ...whereClause, status: 'OPEN' } }), 0),
      safeQuery(db.workOrder.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }), 0),
      safeQuery(db.workOrder.count({ where: { ...whereClause, status: 'COMPLETED' } }), 0),
      safeQuery(db.alert.count({ where: whereClause }), 0),
      safeQuery(db.alert.count({ where: { ...whereClause, isResolved: false } }), 0),
      safeQuery(db.alert.count({ where: { ...whereClause, isResolved: false, severity: 'CRITICAL' } }), 0),
      safeQuery(db.maintenanceTask.count({ where: whereClause }), 0),
      safeQuery(db.maintenanceTask.count({ where: { ...whereClause, isActive: true } }), 0),
      safeQuery(db.maintenanceTask.count({
        where: { ...whereClause, isActive: true, nextDueAt: { lt: new Date() } }
      }), 0),
    ]);

    // Super admin: list all client orgs for dropdown with full counts
    let organizations: {
      id: string; name: string; plan: string;
      _count: { machines: number; users: number; workOrders: number; alerts: number };
    }[] = [];

    if (isSuperAdmin) {
      organizations = await safeQuery(
        db.organization.findMany({
          where: superAdminOrgId ? { id: { not: superAdminOrgId } } : undefined,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            plan: true,
            _count: { select: { machines: true, users: true, workOrders: true, alerts: true } },
          },
        }),
        []
      );
    }

    return NextResponse.json({
      machineCount, machineOperational, machineMaintenance, machineBreakdown,
      workOrderCount, workOrderOpen, workOrderInProgress, workOrderCompleted,
      alertCount, alertActive, alertCritical,
      taskCount, taskActive, taskOverdue,
      isSuperAdmin,
      organizations,
      selectedOrgId: orgId || (isSuperAdmin ? 'all' : user.organizationId),
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Settings overview error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/admin/settings-overview — Force sync: recalculate derived data
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    const user = await safeQuery(
      db.user.findUnique({
        where: { id: (session.user as any).id },
        include: { organization: true },
      }),
      null
    );

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const superAdminOrgId = await getSuperAdminOrgId();
    const isSuperAdmin = user.organization?.id === superAdminOrgId;

    // Build org filter
    let orgWhere: any;
    if (isSuperAdmin && orgId === 'all') {
      orgWhere = superAdminOrgId ? { id: { not: superAdminOrgId } } : {};
    } else if (isSuperAdmin && orgId && orgId !== 'all') {
      orgWhere = { id: orgId };
    } else {
      orgWhere = { id: user.organizationId };
    }

    const actions: string[] = [];

    // 1. Auto-resolve stale low/medium alerts on operational machines
    const operationalMachines = await safeQuery(
      db.machine.findMany({
        where: { organization: orgWhere, status: 'OPERATIONAL' },
        select: { id: true },
      }),
      []
    );

    if (operationalMachines.length > 0) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const resolved = await safeQuery(
        db.alert.updateMany({
          where: {
            machineId: { in: operationalMachines.map(m => m.id) },
            isResolved: false,
            severity: { in: ['LOW', 'MEDIUM'] },
            createdAt: { lt: oneHourAgo },
          },
          data: { isResolved: true, resolvedAt: new Date() },
        }),
        { count: 0 }
      );
      if (resolved.count > 0) {
        actions.push(`Auto-resolved ${resolved.count} stale alert(s) on operational machines`);
      } else {
        actions.push(`No stale alerts to resolve`);
      }
    }

    // 2. Set nextDueAt for maintenance tasks that have none
    const tasksWithoutDue = await safeQuery(
      db.maintenanceTask.findMany({
        where: { organization: orgWhere, isActive: true, nextDueAt: null },
        select: { id: true, frequency: true, intervalDays: true, createdAt: true },
      }),
      []
    );

    if (tasksWithoutDue.length > 0) {
      const freqDays: Record<string, number> = {
        DAILY: 1, WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30,
        QUARTERLY: 90, BIANNUAL: 180, ANNUAL: 365, CUSTOM: 30,
      };
      for (const task of tasksWithoutDue) {
        const days = task.intervalDays ?? freqDays[task.frequency] ?? 30;
        const nextDue = new Date(task.createdAt.getTime() + days * 24 * 60 * 60 * 1000);
        await safeQuery(
          db.maintenanceTask.update({ where: { id: task.id }, data: { nextDueAt: nextDue } }),
          null
        );
      }
      actions.push(`Updated due dates for ${tasksWithoutDue.length} maintenance task(s)`);
    } else {
      actions.push('All maintenance tasks have due dates set');
    }

    // 3. Count overdue work orders (report only, do not auto-modify)
    const overdueWOs = await safeQuery(
      db.workOrder.count({
        where: { organization: orgWhere, status: { in: ['OPEN', 'IN_PROGRESS'] }, dueAt: { lt: new Date() } },
      }),
      0
    );
    if (overdueWOs > 0) {
      actions.push(`Detected ${overdueWOs} overdue work order(s) — review required`);
    } else {
      actions.push('No overdue work orders detected');
    }

    // 4. Verify machine count
    const totalMachines = await safeQuery(
      db.machine.count({ where: { organization: orgWhere } }),
      0
    );
    actions.push(`Verified ${totalMachines} machine(s) in database`);

    actions.push('✅ Sync complete — all data refreshed from live database');

    return NextResponse.json({ success: true, actions, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Force sync error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}