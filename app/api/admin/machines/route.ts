import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSuperAdminOrgId, safeQuery } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

// GET /api/admin/machines - List all machines (for platform admin)
// Query params:
// - organizationId: filter by specific organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is platform admin
    const userEmail = (session.user as any).email || session.user.email;
    if (userEmail !== 'admin@myncel.com') {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    // Get super admin org to exclude it
    const superAdminOrgId = await getSuperAdminOrgId();

    // Build where clause
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    } else if (superAdminOrgId) {
      // Exclude super admin org machines if no specific org selected
      where.organizationId = { not: superAdminOrgId };
    }

    const machines = await safeQuery(
      db.machine.findMany({
        where,
        orderBy: [{ organizationId: 'asc' }, { name: 'asc' }],
        include: {
          organization: {
            select: { id: true, name: true },
          },
          _count: {
            select: { workOrders: true, maintenanceTasks: true },
          },
        },
      }),
      []
    );

    return NextResponse.json({ machines });
  } catch (error) {
    console.error('Error fetching machines:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}