import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/machines/[id]/command
 * Body: { command: string }
 *
 * Supported commands:
 *   START, AUTO_MODE, MOTOR_ON  → status = OPERATIONAL
 *   PAUSE, STOP, RESET, MOTOR_OFF → status = MAINTENANCE  (paused/held for inspection)
 *   REQUEST_MAINTENANCE            → status = MAINTENANCE + create work order
 *   EMERGENCY_STOP                 → status = BREAKDOWN    + create CRITICAL alert + create CRITICAL work order
 *   DRAIN, HOME_AXES, RETRACT, GAS_ON, PURGE, GRIPPER, HEATER_ON → no status change (momentary operations)
 */
function normalizeHmiCommand(command: unknown): string {
  const raw = String(command || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

  const aliases: Record<string, string> = {
    AUTO: 'AUTO_MODE',
    AUTO_RUN: 'AUTO_MODE',
    E_STOP: 'EMERGENCY_STOP',
    ESTOP: 'EMERGENCY_STOP',
    EMERGENCY: 'EMERGENCY_STOP',
    EMERGENCY_STOP_MACHINE: 'EMERGENCY_STOP',
    REQUEST_SERVICE: 'REQUEST_MAINTENANCE',
    MAINTENANCE_REQUEST: 'REQUEST_MAINTENANCE',
  };

  return aliases[raw] || raw;
}

async function generateUniqueWorkOrderNumber(prefix = 'WO') {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const timePart = Date.now().toString().slice(-7);
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    const candidate = `${prefix}-${year}-${timePart}-${randomPart}`;
    const existing = await db.workOrder.findUnique({ where: { woNumber: candidate } });

    if (!existing) return candidate;
  }

  return `${prefix}-${year}-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

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
    const requestedCommand = body?.command;
    const command = normalizeHmiCommand(requestedCommand);

    if (!command) return NextResponse.json({ error: 'command is required' }, { status: 400 });

    let newStatus: string | null = null;
    let logMessage = '';
    let workOrder: any = null;
    let alert: any = null;
    const sideEffectErrors: string[] = [];

    switch (command) {
      case 'START': {
        newStatus = 'OPERATIONAL';
        logMessage = `Machine started by operator via HMI`;
        break;
      }

      case 'AUTO_MODE': {
        newStatus = 'OPERATIONAL';
        logMessage = `Machine switched to automatic mode by operator via HMI`;
        break;
      }

      case 'RESET': {
        newStatus = 'MAINTENANCE';
        logMessage = `Machine reset/cleared by operator via HMI`;
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

      case 'MOTOR_ON': {
        // Start the motor — similar to START command
        newStatus = 'OPERATIONAL';
        logMessage = `Motor started by operator via HMI`;
        break;
      }

      case 'MOTOR_OFF': {
        // Stop the motor — similar to STOP command
        newStatus = 'MAINTENANCE';
        logMessage = `Motor stopped by operator via HMI`;
        break;
      }

      case 'DRAIN': {
        // Drain operation for compressors/pumps — typically doesn't change status
        // but we log it and keep the machine running
        logMessage = `Drain operation executed by operator via HMI`;
        // No status change needed for drain - it's a momentary operation
        break;
      }

      case 'HOME_AXES': {
        // Home/zero axes for CNC machines, robots - no status change
        logMessage = `Axes homed/zeroed by operator via HMI`;
        break;
      }

      case 'RETRACT': {
        // Retract operation for press brakes, etc - no status change
        logMessage = `Retract operation executed by operator via HMI`;
        break;
      }

      case 'GAS_ON': {
        // Turn on gas flow for welders, laser cutters - no status change
        logMessage = `Gas flow enabled by operator via HMI`;
        break;
      }

      case 'PURGE': {
        // Purge operation for injection molding - no status change
        logMessage = `Purge operation executed by operator via HMI`;
        break;
      }

      case 'GRIPPER': {
        // Gripper control for robots - no status change
        logMessage = `Gripper toggled by operator via HMI`;
        break;
      }

      case 'HEATER_ON': {
        // Heater for injection molding - no status change
        logMessage = `Heater enabled by operator via HMI`;
        break;
      }

      case 'REQUEST_MAINTENANCE': {
        newStatus = 'MAINTENANCE';
        logMessage = `Maintenance requested by operator via HMI`;

        // Create a work order for the maintenance request.
        // This is a secondary side effect: if it fails, the status change should still succeed.
        try {
          const woNumber = await generateUniqueWorkOrderNumber('WO-HMI');
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
        } catch (sideEffectError) {
          console.error('[HMI Command] Maintenance work order side effect failed:', sideEffectError);
          sideEffectErrors.push(`Maintenance work order was not created: ${sideEffectError instanceof Error ? sideEffectError.message : String(sideEffectError)}`);
        }
        break;
      }

      case 'EMERGENCY_STOP': {
        newStatus = 'BREAKDOWN';
        logMessage = `EMERGENCY STOP triggered by operator via HMI`;

        // Create a CRITICAL alert.
        // This is a secondary side effect: if it fails, the E-STOP status change should still succeed.
        try {
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
        } catch (sideEffectError) {
          console.error('[HMI Command] Emergency alert side effect failed:', sideEffectError);
          sideEffectErrors.push(`Emergency alert was not created: ${sideEffectError instanceof Error ? sideEffectError.message : String(sideEffectError)}`);
        }

        // Create a CRITICAL work order.
        // This is also a secondary side effect and must not make a successful E-STOP look failed.
        try {
          const woNumber = await generateUniqueWorkOrderNumber('WO-EMG');
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
        } catch (sideEffectError) {
          console.error('[HMI Command] Emergency work order side effect failed:', sideEffectError);
          sideEffectErrors.push(`Emergency work order was not created: ${sideEffectError instanceof Error ? sideEffectError.message : String(sideEffectError)}`);
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown command: ${command}` }, { status: 400 });
    }

    // Update machine status (only if status should change)
    const updated = await db.machine.update({
      where: { id: params.id },
      data: newStatus ? { status: newStatus as any } : {},
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
      requestedCommand,
      previousStatus: machine.status,
      newStatus,
      machine: updated,
      workOrder: workOrder || null,
      alert: alert || null,
      sideEffectErrors,
      message: sideEffectErrors.length
        ? `${logMessage}. Status was updated successfully, but one or more follow-up records could not be created.`
        : logMessage,
    });
  } catch (error) {
    console.error('HMI command error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}