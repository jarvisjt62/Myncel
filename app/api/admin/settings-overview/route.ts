import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSuperAdminOrgId, safeQuery } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings-overview?orgId=xxx
// Returns machines, workOrders, alerts, maintenanceTasks counts
// If orgId = 'all' (super admin only) → all client orgs combined
// If orgId = specific id → just that org
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
      // All client orgs (exclude super admin org)
      whereClause = superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {};
    } else if (isSuperAdmin && orgId && orgId !== 'all') {
      // Specific org chosen by super admin
      whereClause = { organizationId: orgId };
    } else {
      // Regular admin sees only their own org
      whereClause = { organizationId: user.organizationId };
    }

    const [machineCount, workOrderCount, alertCount, taskCount] = await Promise.all([
      safeQuery(db.machine.count({ where: whereClause }), 0),
      safeQuery(db.workOrder.count({ where: whereClause }), 0),
      safeQuery(db.alert.count({ where: whereClause }), 0),
      safeQuery(db.maintenanceTask.count({ where: whereClause }), 0),
    ]);

    // If super admin, also return list of all orgs for the dropdown
    let organizations: { id: string; name: string; plan: string; _count: { machines: number; users: number } }[] = [];
    if (isSuperAdmin) {
      organizations = await safeQuery(
        db.organization.findMany({
          where: superAdminOrgId ? { id: { not: superAdminOrgId } } : undefined,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            plan: true,
            _count: { select: { machines: true, users: true } },
          },
        }),
        []
      );
    }

    return NextResponse.json({
      machineCount,
      workOrderCount,
      alertCount,
      taskCount,
      isSuperAdmin,
      organizations,
      selectedOrgId: orgId || (isSuperAdmin ? 'all' : user.organizationId),
    });
  } catch (error) {
    console.error('Settings overview error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}