/**
 * GET /api/admin/reports/snapshot
 *
 * Super-admin live snapshot of every organization's report records.
 * Mirrors the server-component query in `app/admin/reports/page.tsx` so that
 * the AdminReportsClient can poll for fresh data on a 15-second interval and
 * stay in sync with org changes in real time.
 *
 * Auth: SUPER_ADMIN role OR session email === admin@myncel.com.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

const PLATFORM_ADMIN_EMAIL = 'admin@myncel.com';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const u = session.user as any;
    const isPlatformAdmin = u.email === PLATFORM_ADMIN_EMAIL || u.role === 'SUPER_ADMIN';
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const superAdminOrgId = await getSuperAdminOrgId();

    const organizations = await safeQuery(
      db.organization.findMany({
        where: superAdminOrgId ? { id: { not: superAdminOrgId } } : {},
        orderBy: { name: 'asc' },
        include: {
          machines: {
            select: { id: true, name: true, status: true, criticality: true },
          },
          workOrders: {
            select: {
              id: true,
              woNumber: true,
              title: true,
              status: true,
              priority: true,
              type: true,
              laborCost: true,
              partsCost: true,
              totalCost: true,
              currency: true,
              completedAt: true,
              createdAt: true,
            },
          },
          _count: { select: { machines: true, workOrders: true, users: true } },
        },
      }),
      []
    );

    const serialized = organizations.map(org => ({
      ...org,
      workOrders: org.workOrders.map(wo => ({
        ...wo,
        completedAt: wo.completedAt?.toISOString() ?? null,
        createdAt: wo.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json(
      { organizations: serialized, syncedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[admin/reports/snapshot] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
