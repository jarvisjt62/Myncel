import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSuperAdminOrgId } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

// GET /api/admin/machines/[id] - Platform-admin machine detail across organizations
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.email !== 'admin@myncel.com') {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 });
    }

    const superAdminOrgId = await getSuperAdminOrgId();

    const machine = await db.machine.findFirst({
      where: {
        id: params.id,
        ...(superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            woNumber: true,
            title: true,
            description: true,
            type: true,
            status: true,
            priority: true,
            dueAt: true,
            completedAt: true,
            createdAt: true,
            updatedAt: true,
            machineId: true,
            organizationId: true,
          },
        },
        maintenanceTasks: {
          orderBy: [
            { lastCompletedAt: 'desc' },
            { nextDueAt: 'asc' },
          ],
          take: 10,
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
            priority: true,
            isActive: true,
            nextDueAt: true,
            lastCompletedAt: true,
            createdAt: true,
            updatedAt: true,
            machineId: true,
            organizationId: true,
          },
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            severity: true,
            isResolved: true,
            isRead: true,
            createdAt: true,
            resolvedAt: true,
            machineId: true,
            organizationId: true,
          },
        },
        machineDeviceTokens: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            tokenPrefix: true,
            isActive: true,
            lastSeenAt: true,
            revokedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            workOrders: true,
            maintenanceTasks: true,
            alerts: true,
          },
        },
      },
    });

    if (!machine) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error fetching admin machine detail:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}