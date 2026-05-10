import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SEED_SECRET = 'myncel-seed-2024-secure';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.secret !== SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = 'cmoaf76en000111ly1vgdj46g';
    const kellyId = 'cmoaf76fj000311ly9ghwe9fp';
    const results: Record<string, any> = {};

    // Get all machines
    const machines = await db.machine.findMany({ where: { organizationId: orgId } });
    const machineMap: Record<string, string> = {};
    for (const m of machines) machineMap[m.name] = m.id;

    // ── Add more work orders ──────────────────────────────────────────────────
    const existingCount = await db.workOrder.count({ where: { organizationId: orgId } });
    const now = new Date();
    const woResults: string[] = [];

    if (existingCount < 10) {
      const additionalWOs = [
        { title: 'Emergency Repair - Coolant Leak', type: 'CORRECTIVE' as const, priority: 'CRITICAL' as const, status: 'OPEN' as const, estimatedMinutes: 180, daysOffset: 0, machine: 'CNC Lathe #1' },
        { title: 'Tool Change & Calibration', type: 'PROJECT' as const, priority: 'LOW' as const, status: 'OPEN' as const, estimatedMinutes: 60, daysOffset: 10, machine: 'CNC Milling Machine #1' },
        { title: 'Drive Belt Replacement', type: 'CORRECTIVE' as const, priority: 'HIGH' as const, status: 'ON_HOLD' as const, estimatedMinutes: 150, daysOffset: 1, machine: 'CNC Lathe #1' },
        { title: 'Annual Compliance Inspection', type: 'INSPECTION' as const, priority: 'CRITICAL' as const, status: 'OPEN' as const, estimatedMinutes: 480, daysOffset: 30, machine: 'Laser Cutting Machine' },
        { title: 'Laser Lens Cleaning', type: 'PREVENTIVE' as const, priority: 'HIGH' as const, status: 'COMPLETED' as const, estimatedMinutes: 45, daysOffset: -5, machine: 'Laser Cutting Machine', laborCost: 95, partsCost: 30 },
        { title: 'Air Filter Replacement', type: 'PREVENTIVE' as const, priority: 'MEDIUM' as const, status: 'OPEN' as const, estimatedMinutes: 30, daysOffset: 3, machine: 'Industrial Air Compressor' },
        { title: 'Robot Cell Programming Update', type: 'PROJECT' as const, priority: 'LOW' as const, status: 'OPEN' as const, estimatedMinutes: 180, daysOffset: 14, machine: 'Welding Robot Cell' },
        { title: 'Crane Annual Safety Inspection', type: 'INSPECTION' as const, priority: 'CRITICAL' as const, status: 'OPEN' as const, estimatedMinutes: 240, daysOffset: 7, machine: 'Overhead Crane 5T' },
        { title: 'Compressor Oil & Filter Service', type: 'PREVENTIVE' as const, priority: 'HIGH' as const, status: 'IN_PROGRESS' as const, estimatedMinutes: 90, daysOffset: 2, machine: 'Industrial Air Compressor' },
        { title: 'Injection Mold Cavity Cleaning', type: 'PREVENTIVE' as const, priority: 'MEDIUM' as const, status: 'OPEN' as const, estimatedMinutes: 120, daysOffset: 6, machine: 'Injection Molding Machine' },
      ];

      for (let i = 0; i < additionalWOs.length; i++) {
        const tmpl = additionalWOs[i];
        const machineId = machineMap[tmpl.machine] || machines[0].id;
        const woNumber = `WO-2024-${String(existingCount + i + 1).padStart(4, '0')}`;

        // Check not already existing
        const exists = await db.workOrder.findFirst({ where: { woNumber } });
        if (exists) { woResults.push(`${woNumber} already exists`); continue; }

        await db.workOrder.create({
          data: {
            woNumber,
            title: tmpl.title,
            description: `${tmpl.title} for ${tmpl.machine}. Per PM schedule.`,
            type: tmpl.type,
            priority: tmpl.priority,
            status: tmpl.status,
            estimatedMinutes: tmpl.estimatedMinutes,
            laborCost: (tmpl as any).laborCost ?? null,
            partsCost: (tmpl as any).partsCost ?? null,
            dueAt: new Date(now.getTime() + tmpl.daysOffset * 24 * 60 * 60 * 1000),
            completedAt: tmpl.status === 'COMPLETED' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
            machineId,
            organizationId: orgId,
            createdById: kellyId,
          },
        });
        woResults.push(`${woNumber} - ${tmpl.title} created`);
      }
    } else {
      woResults.push(`${existingCount} work orders already exist — no additions needed`);
    }
    results.workOrders = woResults;

    // ── Add remaining parts if < 8 ────────────────────────────────────────────
    const partCount = await db.part.count({ where: { organizationId: orgId } });
    const partResults: string[] = [];

    if (partCount < 8) {
      const allParts = [
        { name: 'Spindle Bearing 6205', partNumber: 'BRG-6205-2RS', quantity: 8, minQuantity: 3, unitCost: 24.99, supplier: 'SKF Bearings', location: 'Shelf A-1', description: 'Deep groove ball bearing for spindle applications' },
        { name: 'Hydraulic Filter HF-200', partNumber: 'HF-200-10M', quantity: 5, minQuantity: 2, unitCost: 45.00, supplier: 'Parker Hannifin', location: 'Shelf B-2', description: '10-micron hydraulic return line filter' },
        { name: 'V-Belt B68', partNumber: 'BELT-B68', quantity: 2, minQuantity: 4, unitCost: 18.50, supplier: 'Gates Belts', location: 'Shelf A-3', description: 'Classical V-belt B section 68 inch (LOW STOCK)' },
        { name: 'Coolant Concentrate 5L', partNumber: 'COOL-5L-SYNTH', quantity: 12, minQuantity: 4, unitCost: 32.00, supplier: 'Master Chemical', location: 'Storage Room', description: 'Semi-synthetic metalworking coolant concentrate' },
        { name: 'Servo Motor Drive 5.5kW', partNumber: 'SMD-5500-AC', quantity: 1, minQuantity: 1, unitCost: 890.00, supplier: 'Siemens', location: 'Electrical Cabinet', description: 'AC servo drive 5.5kW for CNC axis control' },
        { name: 'Pneumatic Cylinder 63x200', partNumber: 'PC-63200-DS', quantity: 3, minQuantity: 2, unitCost: 67.50, supplier: 'SMC Pneumatics', location: 'Shelf C-1', description: 'Double-acting pneumatic cylinder 63mm bore x 200mm stroke' },
        { name: 'Oil Seal 40x62x10', partNumber: 'SEAL-406210', quantity: 10, minQuantity: 5, unitCost: 8.75, supplier: 'NOK Seals', location: 'Shelf A-2', description: 'Rotary shaft oil seal 40mm ID x 62mm OD x 10mm' },
        { name: 'Cutting Insert APMT 1604', partNumber: 'APMT-1604-TM', quantity: 0, minQuantity: 10, unitCost: 12.50, supplier: 'Sandvik Coromant', location: 'Tool Crib', description: 'Indexable milling insert APMT 1604 PDER (OUT OF STOCK)' },
      ];

      for (const p of allParts) {
        const exists = await db.part.findFirst({ where: { partNumber: p.partNumber, organizationId: orgId } });
        if (exists) { partResults.push(`${p.name} already exists`); continue; }
        await db.part.create({ data: { ...p, organizationId: orgId } });
        partResults.push(`${p.name} (qty: ${p.quantity}) created`);
      }
    } else {
      partResults.push(`${partCount} parts already exist`);
    }
    results.parts = partResults;

    // ── Add alerts if < 5 ─────────────────────────────────────────────────────
    const alertCount = await db.alert.count({ where: { organizationId: orgId } });
    const alertResults: string[] = [];

    if (alertCount < 5) {
      const mCNC = machineMap['CNC Milling Machine #1'];
      const mLaser = machineMap['Laser Cutting Machine'];
      const mHydraulic = machineMap['Hydraulic Press Brake'];

      const alerts = [
        { title: 'Low Coolant Level', message: 'CNC Milling Machine coolant reservoir is below 20%. Refill required within 24 hours.', type: 'SENSOR_THRESHOLD' as const, severity: 'MEDIUM' as const, isRead: false, machineId: mCNC },
        { title: 'Parts Stock Out - Cutting Inserts', message: 'Cutting Insert APMT-1604-TM stock is at 0 units. Production may be affected.', type: 'LOW_PARTS' as const, severity: 'CRITICAL' as const, isRead: false, machineId: undefined },
        { title: 'Maintenance Overdue', message: 'Laser Cutting Machine weekly lubrication is 3 days overdue. Schedule immediately.', type: 'MAINTENANCE_OVERDUE' as const, severity: 'HIGH' as const, isRead: false, machineId: mLaser },
        { title: 'Work Order Completed', message: 'WO-2024-0004 Hydraulic Fluid Change has been marked complete.', type: 'WORK_ORDER_ASSIGNED' as const, severity: 'LOW' as const, isRead: true, machineId: mHydraulic },
        { title: 'V-Belt Low Stock', message: 'V-Belt B68 stock (2 units) is below minimum level (4 units). Reorder recommended.', type: 'LOW_PARTS' as const, severity: 'MEDIUM' as const, isRead: false, machineId: undefined },
      ];

      for (const a of alerts) {
        const exists = await db.alert.findFirst({ where: { title: a.title, organizationId: orgId } });
        if (exists) { alertResults.push(`${a.title} already exists`); continue; }
        await db.alert.create({
          data: {
            title: a.title,
            message: a.message,
            type: a.type,
            severity: a.severity,
            isRead: a.isRead,
            organizationId: orgId,
            ...(a.machineId ? { machineId: a.machineId } : {}),
          },
        });
        alertResults.push(`${a.title} created`);
      }
    } else {
      alertResults.push(`${alertCount} alerts already exist`);
    }
    results.alerts = alertResults;

    // ── Add notifications if < 5 ──────────────────────────────────────────────
    const notifCount = await db.notification.count({ where: { userId: kellyId } });
    const notifResults: string[] = [];

    if (notifCount < 5) {
      const notifs = [
        { type: 'WORK_ORDER_ASSIGNED' as const, title: 'New Work Order Assigned', message: 'WO-2024-0002 Spindle Bearing Inspection has been assigned to you.', priority: 'HIGH' as const, isRead: false },
        { type: 'MAINTENANCE_DUE' as const, title: 'Maintenance Due Soon', message: 'Monthly Belt & Filter Check for CNC Milling Machine #1 is due in 14 days.', priority: 'NORMAL' as const, isRead: false },
        { type: 'PARTS_LOW' as const, title: 'Parts Stock Alert', message: 'V-Belt B68 is below minimum stock level. Consider reordering.', priority: 'HIGH' as const, isRead: false },
        { type: 'WORK_ORDER_COMPLETED' as const, title: 'Work Order Completed', message: 'WO-2024-0004 Hydraulic Fluid Change has been completed successfully.', priority: 'NORMAL' as const, isRead: true },
        { type: 'MACHINE_ALERT' as const, title: 'Machine Under Maintenance', message: 'Laser Cutting Machine has been placed under maintenance mode.', priority: 'URGENT' as const, isRead: false },
      ];

      for (const n of notifs) {
        const exists = await db.notification.findFirst({ where: { title: n.title, userId: kellyId } });
        if (exists) { notifResults.push(`${n.title} already exists`); continue; }
        await db.notification.create({ data: { ...n, userId: kellyId } });
        notifResults.push(`${n.title} created`);
      }
    } else {
      notifResults.push(`${notifCount} notifications already exist`);
    }
    results.notifications = notifResults;

    // ── Summary counts ────────────────────────────────────────────────────────
    results.finalCounts = {
      machines: await db.machine.count({ where: { organizationId: orgId } }),
      workOrders: await db.workOrder.count({ where: { organizationId: orgId } }),
      maintenanceTasks: await db.maintenanceTask.count({ where: { organizationId: orgId } }),
      parts: await db.part.count({ where: { organizationId: orgId } }),
      alerts: await db.alert.count({ where: { organizationId: orgId } }),
      notifications: await db.notification.count({ where: { userId: kellyId } }),
    };

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error('Add more data error:', error);
    return NextResponse.json(
      { error: 'Failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with secret' });
}