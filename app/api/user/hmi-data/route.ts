import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/user/hmi-data
// Returns machines for the current user's organization with full HMI data
// (status, alerts, counts, model/manufacturer, org name for the Machine panel)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session.user as any).organizationId;
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const machines = await db.machine.findMany({
      where: { organizationId: orgId },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        status: true,
        criticality: true,
        category: true,
        location: true,
        totalHours: true,
        model: true,
        manufacturer: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true },
        },
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, title: true, severity: true, type: true },
        },
        _count: {
          select: {
            workOrders: true,
            alerts: { where: { isResolved: false } },
            maintenanceTasks: { where: { isActive: true } },
          },
        },
      },
    });

    // Sort: BREAKDOWN first, then MAINTENANCE, then OPERATIONAL, then RETIRED
    const order = ['BREAKDOWN', 'MAINTENANCE', 'OPERATIONAL', 'RETIRED'];
    const sorted = [...machines].sort(
      (a, b) => order.indexOf(a.status) - order.indexOf(b.status)
    );

    return NextResponse.json({ machines: sorted });
  } catch (error) {
    console.error('User HMI data error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}