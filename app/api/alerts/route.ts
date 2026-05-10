import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/alerts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isSuperAdmin = (session.user as any).role === 'SUPER_ADMIN';
    const alerts = await db.alert.findMany({
      where: isSuperAdmin ? {} : { organizationId: (session.user as any).organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { machine: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ alerts });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/alerts — create a new alert
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    if (!orgId && !isPlatformAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, message, severity, machineId } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'type, title, message are required' }, { status: 400 });
    }

    // Verify machine belongs to org (if provided), and derive orgId for platform admins
    let effectiveOrgId = orgId;
    if (machineId) {
      const machine = await db.machine.findUnique({ where: { id: machineId } });
      if (!machine) return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
      if (!isPlatformAdmin && machine.organizationId !== orgId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (isPlatformAdmin) effectiveOrgId = machine.organizationId;
    }

    if (!effectiveOrgId) {
      return NextResponse.json({ error: 'Cannot determine organization' }, { status: 400 });
    }

    const alert = await db.alert.create({
      data: {
        type: type,
        title: title,
        message: message,
        severity: severity || 'MEDIUM',
        machineId: machineId || null,
        organizationId: effectiveOrgId,
      },
    });

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (error) {
    console.error('Create alert error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}