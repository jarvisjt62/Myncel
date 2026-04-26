import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSuperAdminOrgId, safeQuery } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

// GET /api/admin/organizations - List all organizations (for admin test panel)
export async function GET() {
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

    // Get super admin org to exclude it
    const superAdminOrgId = await getSuperAdminOrgId();

    // Fetch all organizations except super admin org
    const organizations = await safeQuery(
      db.organization.findMany({
        where: superAdminOrgId ? { id: { not: superAdminOrgId } } : undefined,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          plan: true,
          industry: true,
          createdAt: true,
          _count: {
            select: {
              machines: true,
              users: true,
              workOrders: true,
            },
          },
        },
      }),
      []
    );

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}