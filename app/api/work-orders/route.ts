import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId as string | undefined;
    const role = (session.user as any).role as string;
    const userEmail = session.user.email as string;
    let isPlatformAdmin = role === 'SUPER_ADMIN' || (role === 'ADMIN' && !orgId) || userEmail === 'admin@myncel.com';

    if (!isPlatformAdmin && role === 'ADMIN' && orgId) {
      const superAdminOrg = await db.organization.findFirst({
        where: { users: { some: { email: 'admin@myncel.com' } } },
        select: { id: true },
      });
      if (superAdminOrg && superAdminOrg.id === orgId) isPlatformAdmin = true;
    }

    const body = await req.json();
    const { title, description, machineId, type, priority, dueAt, estimatedMinutes } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!machineId) {
      return NextResponse.json({ error: 'Machine selection is required' }, { status: 400 });
    }

    // For platform admins, derive org from the machine
    let effectiveOrgId = orgId;
    if (isPlatformAdmin && machineId) {
      const machine = await db.machine.findUnique({ where: { id: machineId }, select: { organizationId: true } });
      if (machine) effectiveOrgId = machine.organizationId;
    }
    if (!effectiveOrgId) {
      return NextResponse.json({ error: 'Cannot determine organization' }, { status: 400 });
    }

    // Generate WO number
    const woCount = await db.workOrder.count({ where: { organizationId: effectiveOrgId } });
    const woNumber = `WO-${new Date().getFullYear()}-${String(woCount + 1).padStart(4, '0')}`;

    const workOrder = await db.workOrder.create({
      data: {
        woNumber,
        title: title.trim(),
        description: description?.trim() || null,
        type: type || 'PREVENTIVE',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        dueAt: dueAt ? new Date(dueAt) : null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        machineId,
        organizationId: effectiveOrgId,
        createdById: session.user.id,
      },
      include: {
        machine: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, workOrder }, { status: 201 });
  } catch (error) {
    console.error('Create work order error:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workOrders = await db.workOrder.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        machine: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    });

    return NextResponse.json({ workOrders });
  } catch (error) {
    console.error('Get work orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}