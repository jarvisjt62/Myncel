import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { excludeSuperAdminOrg } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

// GET /api/admin/hmi-data - lightweight machine status for HMI display (excludes super admin org)
export async function GET() {
  try {
    const orgFilter = await excludeSuperAdminOrg();

    const machines = await db.machine.findMany({
      where: orgFilter,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      take: 100,
      select: {
        id: true,
        name: true,
        status: true,
        criticality: true,
        category: true,
        location: true,
        totalHours: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            workOrders: true,
            alerts: {
              where: { isResolved: false },
            },
          },
        },
      },
    });

    // Sort: BREAKDOWN first, then MAINTENANCE, then OPERATIONAL, then RETIRED
    const order = ['BREAKDOWN', 'MAINTENANCE', 'OPERATIONAL', 'RETIRED'];
    const sorted = [...machines].sort(
      (a, b) => order.indexOf(a.status) - order.indexOf(b.status)
    );

    // Aggregate stats
    const stats = {
      total: machines.length,
      operational: machines.filter(m => m.status === 'OPERATIONAL').length,
      maintenance: machines.filter(m => m.status === 'MAINTENANCE').length,
      breakdown: machines.filter(m => m.status === 'BREAKDOWN').length,
      retired: machines.filter(m => m.status === 'RETIRED').length,
      totalActiveAlerts: machines.reduce((sum, m) => sum + m._count.alerts, 0),
    };

    // Group by organization for overview
    const orgGroups = sorted.reduce((acc, m) => {
      const orgName = m.organization?.name || 'Unknown';
      if (!acc[orgName]) acc[orgName] = { name: orgName, id: m.organizationId, count: 0, breakdown: 0, maintenance: 0 };
      acc[orgName].count++;
      if (m.status === 'BREAKDOWN') acc[orgName].breakdown++;
      if (m.status === 'MAINTENANCE') acc[orgName].maintenance++;
      return acc;
    }, {} as Record<string, { name: string; id: string; count: number; breakdown: number; maintenance: number }>);

    return NextResponse.json({ machines: sorted, stats, orgGroups: Object.values(orgGroups) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}