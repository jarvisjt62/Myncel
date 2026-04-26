import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/machines/[id]/command
 * Body: { command: 'START' | 'PAUSE' | 'STOP' | 'REQUEST_MAINTENANCE' | 'EMERGENCY_STOP' }
 *
 * Maps HMI operator commands to DB status changes + side effects:
 *   START              → status = OPERATIONAL
 *   PAUSE              → status = MAINTENANCE  (paused/held for inspection)
 *   STOP               → status = MAINTENANCE  (safely stopped/parked — START becomes available)
 *   REQUEST_MAINTENANCE → status = MAINTENANCE + create work order
 *   EMERGENCY_STOP     → status = BREAKDOWN    + create CRITICAL alert + create CRITICAL work order
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session.user as any).organizationId as string | undefined;
    const role = (session.user as any).role as string;
    const userEmail = (session.user as any).email as string || session.user.email as string;

    // Debug log to trace session data
    console.log('[HMI Command] Session data:', {
      userId: session.user.id,
      userEmail,
      role,
      orgId,
      machineId: params.id,
    });

    // Platform admin check:
    // 1. SUPER_ADMIN role
    // 2. ADMIN role with no org
    // 3. admin@myncel.com (platform admin who may have an org assigned)
    // 4. ADMIN role whose org is the super-admin org (detected below)
    let isPlatformAdmin =
      role === 'SUPER_ADMIN' ||
      (role === 'ADMIN' && !orgId) ||
      userEmail === 'admin@myncel.com';

    // If still not confirmed as platform admin, check if their org is the super-admin org
    if (!isPlatformAdmin && role === 'ADMIN' && orgId) {
      const superAdminOrg = await db.organization.findFirst({
        where: { users: { some: { email: 'admin@myncel.com' } } },
        select: { id: true },
      });
      if (superAdminOrg && superAdminOrg.id === orgId) {
        isPlatformAdmin = true;
      }
    }

    console.log('[HMI Command] isPlatformAdmin:', isPlatformAdmin);

    const machine = await db.machine.findUnique({ where: { id: params.id } });
    if (!machine) return NextResponse.json({ error: 'Machine not found' }, { status: 404 });

    console.log('[HMI Command] machine.organizationId:', machine.organizationId, '| user orgId:', orgId);

    if (!isPlatformAdmin && machine.organizationId !== orgId) {
      console.log('[HMI Command] FORBIDDEN — machine org does not match user org');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const effectiveOrgId = isPlatformAdmin ? machine.organizationId : orgId;
    const body = await req.json();
    const { command } = body;

    if (!command) return NextResponse.json({ error: 'command is required' }, { status: 400 });

    let newStatus: string | null = null;
    let logMessage = '';
    let workOrder: any = null;
    let alert: any = null;

    switch (command) {
      case 'START': {
        newStatus = 'OPERATIONAL';
        logMessage = `Machine started by operator via HMI`;
        break;
      }

      case 'PAUSE': {
        // Pausing puts machine into MAINTENANCE hold (safe state)
        newStatus = 'MAINTENANCE';
        logMessage = `Machine paused (held) by operator via HMI`;
        break;
      }

      case 'STOP': {
        // Graceful stop — machine goes to MAINTENANCE (safely stopped/parked).
        // This allows START to become enabled again.
        newStatus = 'MAINTENANCE';
        logMessage = `Machine stopped (parked) by operator via HMI`;
        break;
      }

      case 'REQUEST_MAINTENANCE': {
        newStatus = 'MAINTENANCE';
        logMessage = `Maintenance requested by operator via HMI`;

        // Create a work order for the maintenance request
        const woCount = await db.workOrder.count({ where: { organizationId: effectiveOrgId } });
        const woNumber = `WO-${new Date().getFullYear()}-${String(woCount + 1).padStart(4, '0')}`;
        workOrder = await db.workOrder.create({
          data: {
            woNumber,
            title: `Maintenance Request — ${machine.name}`,
            description: `Operator requested maintenance from HMI dashboard. Machine status changed to MAINTENANCE.`,
            type: 'CORRECTIVE',
            priority: machine.status === 'BREAKDOWN' ? 'CRITICAL' : 'HIGH',
            status: 'OPEN',
            machineId: machine.id,
            organizationId: effectiveOrgId,
            createdById: session.user.id,
          },
        });
        break;
      }

      case 'EMERGENCY_STOP': {
        newStatus = 'BREAKDOWN';
        logMessage = `EMERGENCY STOP triggered by operator via HMI`;

        // Create a CRITICAL alert
        alert = await db.alert.create({
          data: {
            type: 'MACHINE_BREAKDOWN',
            title: `🚨 EMERGENCY STOP — ${machine.name}`,
            message: `Emergency stop was triggered from the HMI operator panel. Machine ${machine.name} (${machine.category}) has been set to BREAKDOWN status. Immediate inspection required.`,
            severity: 'CRITICAL',
            machineId: machine.id,
            organizationId: effectiveOrgId,
          },
        });

        // Create a CRITICAL work order
        const woCount = await db.workOrder.count({ where: { organizationId: effectiveOrgId } });
        const woNumber = `WO-${new Date().getFullYear()}-${String(woCount + 1).padStart(4, '0')}`;
        workOrder = await db.workOrder.create({
          data: {
            woNumber,
            title: `EMERGENCY — ${machine.name} Emergency Stop`,
            description: `Emergency stop triggered from HMI operator panel. Machine ${machine.name} requires immediate inspection and clearance before restart.`,
            type: 'CORRECTIVE',
            priority: 'CRITICAL',
            status: 'OPEN',
            machineId: machine.id,
            organizationId: effectiveOrgId,
            createdById: session.user.id,
          },
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown command: ${command}` }, { status: 400 });
    }

    // Update machine status
    const updated = await db.machine.update({
      where: { id: params.id },
      data: { status: newStatus as any },
      include: {
        _count: { select: { workOrders: true, alerts: true, maintenanceTasks: true } },
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, title: true, severity: true, type: true },
        },
      },
    });

    console.log('[HMI Command] Success:', command, '->', newStatus);

    return NextResponse.json({
      success: true,
      command,
      previousStatus: machine.status,
      newStatus,
      machine: updated,
      workOrder: workOrder || null,
      alert: alert || null,
      message: logMessage,
    });
  } catch (error) {
    console.error('HMI command error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}