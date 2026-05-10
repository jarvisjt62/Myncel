import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSuperAdminOrgId } from '@/lib/admin-helpers';

export const dynamic = 'force-dynamic';

const SECRET = 'myncel-simulate-2024';

// POST /api/admin/simulate - simulate real-time machine events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.secret !== SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scenario = body.scenario || 'random';
    const targetMachineId = body.machineId;
    const targetOrgId = body.organizationId;

    // Get org and machines (skip super admin org)
    const superAdminOrgId = await getSuperAdminOrgId();
    const orgWhere = superAdminOrgId ? { id: { not: superAdminOrgId } } : {};
    
    // Determine target organization
    const org = targetOrgId
      ? await db.organization.findUnique({ where: { id: targetOrgId } })
      : await db.organization.findFirst({ where: orgWhere, orderBy: { createdAt: 'asc' } });
      
    if (!org) return NextResponse.json({ error: 'No organization found. Please register a user account first.' }, { status: 404 });

    // Fetch machines for the organization
    let machines = await db.machine.findMany({ 
      where: { organizationId: org.id }, 
      include: { organization: { select: { name: true } } }
    });
    
    if (machines.length === 0) return NextResponse.json({ error: 'No machines found in this organization' }, { status: 404 });

    const explicitlySelectedMachine = targetMachineId ? machines.find(m => m.id === targetMachineId) : null;
    if (targetMachineId && !explicitlySelectedMachine) {
      return NextResponse.json({ error: 'Selected machine was not found in the selected organization' }, { status: 400 });
    }

    const results: string[] = [];
    const affectedMachines: { id: string; name: string; status: string }[] = [];

    // Helper to pick target machine
    const pickMachine = (specificId?: string) => {
      if (specificId) {
        const found = machines.find(m => m.id === specificId);
        if (found) return found;
      }
      // Random pick
      return machines[Math.floor(Math.random() * machines.length)];
    };

    if (scenario === 'breakdown' || scenario === 'random') {
      // Simulate a machine breakdown
      const machine = pickMachine(targetMachineId);
      await db.machine.update({ where: { id: machine.id }, data: { status: 'BREAKDOWN' } });
      affectedMachines.push({ id: machine.id, name: machine.name, status: 'BREAKDOWN' });

      // Create emergency work order
      const wo = await db.workOrder.create({
        data: {
          woNumber: `WO-EMG-${Date.now().toString().slice(-6)}`,
          title: `EMERGENCY: ${machine.name} breakdown`,
          description: `Machine ${machine.name} has stopped working and requires immediate attention. Production line halted.`,
          type: 'EMERGENCY',
          status: 'OPEN',
          priority: 'CRITICAL',
          organizationId: org.id,
          machineId: machine.id,
          dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        },
      });

      // Create critical alert
      await db.alert.create({
        data: {
          type: 'SENSOR_THRESHOLD',
          title: `🚨 Machine Breakdown: ${machine.name}`,
          message: `${machine.name} has experienced a critical failure and is no longer operational. Emergency work order ${wo.woNumber} created.`,
          severity: 'CRITICAL',
          organizationId: org.id,
          machineId: machine.id,
        },
      });

      results.push(`✅ Breakdown: ${machine.name} → BREAKDOWN, WO ${wo.woNumber} created`);
    }

    if (scenario === 'maintenance_due' || scenario === 'random') {
      // Simulate maintenance becoming overdue
      const task = await db.maintenanceTask.findFirst({
        where: { organizationId: org.id, isActive: true },
      });

      if (task) {
        const maintenanceMachine = pickMachine(targetMachineId);
        await db.alert.create({
          data: {
            type: 'MAINTENANCE_OVERDUE',
            title: `⚠️ Maintenance Overdue: ${task.title}`,
            message: `Scheduled maintenance task "${task.title}" for ${maintenanceMachine.name} is overdue. Please schedule immediately to prevent equipment damage.`,
            severity: 'HIGH',
            organizationId: org.id,
            machineId: maintenanceMachine.id,
          },
        });
        results.push(`✅ Maintenance overdue alert created for: ${task.title} (${maintenanceMachine.name})`);
      } else {
        results.push(`ℹ️ No maintenance tasks found - skipping maintenance_due`);
      }
    }

    if (scenario === 'low_parts' || scenario === 'random') {
      // Simulate low parts inventory
      const part = await db.part.findFirst({ where: { organizationId: org.id } });
      if (part) {
        await db.part.update({ where: { id: part.id }, data: { quantity: 1 } });
        await db.alert.create({
          data: {
            type: 'LOW_PARTS',
            title: `📦 Low Stock: ${part.name}`,
            message: `Part "${part.name}" (${part.partNumber}) is critically low — only 1 unit remaining. Reorder immediately to avoid production delays.`,
            severity: 'MEDIUM',
            organizationId: org.id,
          },
        });
        results.push(`✅ Low parts alert for: ${part.name}`);
      } else {
        results.push(`ℹ️ No parts found - skipping low_parts`);
      }
    }

    if (scenario === 'work_order_progress') {
      // Move open work orders forward for the selected equipment when provided
      const openWOs = await db.workOrder.findMany({
        where: {
          organizationId: org.id,
          status: 'OPEN',
          ...(targetMachineId ? { machineId: targetMachineId } : {}),
        },
        include: { machine: true },
        take: targetMachineId ? 1 : 2,
      });
      if (openWOs.length > 0) {
        for (const wo of openWOs) {
          await db.workOrder.update({
            where: { id: wo.id },
            data: { status: 'IN_PROGRESS', startedAt: new Date() },
          });
          results.push(`✅ WO ${wo.woNumber} for ${wo.machine?.name || 'selected equipment'} moved to IN_PROGRESS`);
        }
      } else {
        const machineName = explicitlySelectedMachine?.name ? ` for ${explicitlySelectedMachine.name}` : '';
        results.push(`ℹ️ No open work orders found${machineName} - run breakdown first`);
      }
    }

    if (scenario === 'complete_work_order') {
      // Complete an in-progress work order and fix the selected equipment when provided
      let inProgressWO = await db.workOrder.findFirst({
        where: {
          organizationId: org.id,
          status: 'IN_PROGRESS',
          ...(targetMachineId ? { machineId: targetMachineId } : {}),
        },
        include: { machine: true },
      });
      
      // If no in-progress, try to complete any open work order
      if (!inProgressWO) {
        inProgressWO = await db.workOrder.findFirst({
          where: {
            organizationId: org.id,
            status: 'OPEN',
            ...(targetMachineId ? { machineId: targetMachineId } : {}),
          },
          include: { machine: true },
        });
      }
      
      if (inProgressWO && inProgressWO.machine) {
        await db.workOrder.update({
          where: { id: inProgressWO.id },
          data: { status: 'COMPLETED', completedAt: new Date(), startedAt: inProgressWO.startedAt || new Date(), actualMinutes: Math.floor(Math.random() * 120) + 30 },
        });
        await db.machine.update({ where: { id: inProgressWO.machineId! }, data: { status: 'OPERATIONAL', lastServiceAt: new Date() } });
        affectedMachines.push({ id: inProgressWO.machineId!, name: inProgressWO.machine.name, status: 'OPERATIONAL' });
        results.push(`✅ WO ${inProgressWO.woNumber} COMPLETED, ${inProgressWO.machine.name} → OPERATIONAL`);
      } else {
        const machineName = explicitlySelectedMachine?.name ? ` for ${explicitlySelectedMachine.name}` : '';
        results.push(`ℹ️ No work orders to complete${machineName} - run breakdown first`);
      }
    }

    if (scenario === 'reset') {
      // Reset selected equipment when provided; otherwise reset the whole organization
      const machineWhere = targetMachineId
        ? { organizationId: org.id, id: targetMachineId }
        : { organizationId: org.id };
      const alertWhere = targetMachineId
        ? { organizationId: org.id, machineId: targetMachineId }
        : { organizationId: org.id };

      const updateResult = await db.machine.updateMany({ where: machineWhere, data: { status: 'OPERATIONAL' } });
      const alertResult = await db.alert.updateMany({ where: alertWhere, data: { isResolved: true, resolvedAt: new Date() } });

      if (explicitlySelectedMachine) {
        affectedMachines.push({ id: explicitlySelectedMachine.id, name: explicitlySelectedMachine.name, status: 'OPERATIONAL' });
        results.push(`✅ ${explicitlySelectedMachine.name} reset to OPERATIONAL, ${alertResult.count} related alerts resolved`);
      } else {
        results.push(`✅ ${updateResult.count} machines reset to OPERATIONAL, ${alertResult.count} alerts resolved`);
      }
    }

    // Get updated machine statuses for response
    const updatedMachines = await db.machine.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({ 
      success: true, 
      scenario, 
      results,
      organization: { id: org.id, name: org.name },
      targetMachine: targetMachineId ? machines.find(m => m.id === targetMachineId)?.name : null,
      affectedMachines,
      machines: updatedMachines,
    });
  } catch (error) {
    console.error('Simulate API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET - list available scenarios
export async function GET() {
  return NextResponse.json({
    scenarios: [
      { id: 'breakdown', description: 'Simulate a machine breakdown (creates emergency WO + critical alert)' },
      { id: 'maintenance_due', description: 'Create a maintenance overdue alert' },
      { id: 'low_parts', description: 'Set a part to low stock and create alert' },
      { id: 'work_order_progress', description: 'Move open work orders to IN_PROGRESS' },
      { id: 'complete_work_order', description: 'Complete an in-progress work order and restore machine' },
      { id: 'random', description: 'Run breakdown + maintenance_due + low_parts together' },
      { id: 'reset', description: 'Reset all machines to OPERATIONAL and resolve all alerts' },
    ],
    usage: 'POST with { secret: "myncel-simulate-2024", scenario: "<id>", organizationId?: "<org-id>", machineId?: "<machine-id>" }',
  });
}