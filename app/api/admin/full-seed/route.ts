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

    const results: Record<string, any> = {};

    // ── 1. Get or create organization for kellytron ──────────────────────────
    let org = await db.organization.findFirst({
      where: { users: { some: { email: 'kellytron@yahoo.com' } } },
    });

    if (!org) {
      org = await db.organization.create({
        data: {
          name: 'Acme Manufacturing Co.',
          slug: 'acme-manufacturing',
          industry: 'METAL_FABRICATION',
          size: 'MIDSIZE',
          plan: 'PROFESSIONAL',
        },
      });

      // Link kellytron to the new organization
      await db.user.update({
        where: { email: 'kellytron@yahoo.com' },
        data: { organizationId: org.id },
      });

      results.orgCreated = org.name;
    } else {
      results.orgExisting = org.name;
    }

    const orgId = org.id;
    results.orgId = orgId;

    // ── 2. Seed machines ──────────────────────────────────────────────────────
    const machineData = [
      {
        name: 'CNC Milling Machine #1',
        model: 'Haas VF-2',
        serialNumber: 'HAAS-VF2-001',
        manufacturer: 'Haas Automation',
        location: 'Production Floor A',
        category: 'CNC_MILL' as const,
        status: 'OPERATIONAL' as const,
        criticality: 'HIGH' as const,
        totalHours: 4250,
        yearInstalled: 2019,
        notes: 'Vertical machining center with 30" x 16" x 20" travels. Main production machine.',
      },
      {
        name: 'CNC Lathe #1',
        model: 'Mazak QT-200',
        serialNumber: 'MAZAK-QT200-002',
        manufacturer: 'Mazak',
        location: 'Production Floor A',
        category: 'CNC_LATHE' as const,
        status: 'OPERATIONAL' as const,
        criticality: 'HIGH' as const,
        totalHours: 3800,
        yearInstalled: 2020,
        notes: 'Turning center with bar feeder. Used for shaft and bearing work.',
      },
      {
        name: 'Hydraulic Press Brake',
        model: 'Trumpf TruBend 5170',
        serialNumber: 'TRUMPF-TB5170-003',
        manufacturer: 'Trumpf',
        location: 'Workshop',
        category: 'PRESS' as const,
        status: 'OPERATIONAL' as const,
        criticality: 'MEDIUM' as const,
        totalHours: 2100,
        yearInstalled: 2021,
        notes: '170-ton press brake with 4m bending length.',
      },
      {
        name: 'Laser Cutting Machine',
        model: 'Trumpf TruLaser 3030',
        serialNumber: 'TRUMPF-TL3030-004',
        manufacturer: 'Trumpf',
        location: 'Production Floor B',
        category: 'OTHER' as const,
        status: 'MAINTENANCE' as const,
        criticality: 'HIGH' as const,
        totalHours: 5600,
        yearInstalled: 2018,
        notes: '3kW fiber laser cutter. Currently under scheduled maintenance.',
      },
      {
        name: 'Injection Molding Machine',
        model: 'Engel e-victory 50',
        serialNumber: 'ENGEL-EV50-005',
        manufacturer: 'Engel',
        location: 'Production Floor B',
        category: 'INJECTION_MOLD' as const,
        status: 'OPERATIONAL' as const,
        criticality: 'MEDIUM' as const,
        totalHours: 1900,
        yearInstalled: 2022,
        notes: '50-ton hydraulic injection molder for plastic components.',
      },
      {
        name: 'Industrial Air Compressor',
        model: 'Atlas Copco GA37',
        serialNumber: 'ATLAS-GA37-006',
        manufacturer: 'Atlas Copco',
        location: 'Utility Room',
        category: 'COMPRESSOR' as const,
        status: 'OPERATIONAL' as const,
        criticality: 'HIGH' as const,
        totalHours: 8200,
        yearInstalled: 2017,
        notes: '37kW rotary screw air compressor. Feeds all pneumatic equipment.',
      },
      {
        name: 'Welding Robot Cell',
        model: 'FANUC ARC Mate 120iD',
        serialNumber: 'FANUC-AM120-007',
        manufacturer: 'FANUC',
        location: 'Welding Bay',
        category: 'WELDER' as const,
        status: 'OPERATIONAL' as const,
        criticality: 'MEDIUM' as const,
        totalHours: 3200,
        yearInstalled: 2020,
        notes: 'Automated MIG welding cell.',
      },
      {
        name: 'Overhead Crane 5T',
        model: 'Demag KBK 5000',
        serialNumber: 'DEMAG-KBK5T-008',
        manufacturer: 'Demag',
        location: 'Main Floor',
        category: 'ASSEMBLY' as const,
        status: 'OPERATIONAL' as const,
        criticality: 'HIGH' as const,
        totalHours: 6100,
        yearInstalled: 2016,
        notes: '5-ton overhead bridge crane. Annual inspection due next month.',
      },
    ];

    const machines: any[] = [];
    const machineResults: string[] = [];

    for (const m of machineData) {
      const existing = await db.machine.findFirst({
        where: { serialNumber: m.serialNumber, organizationId: orgId },
      });
      if (existing) {
        machines.push(existing);
        machineResults.push(`${m.name} (already exists)`);
      } else {
        const created = await db.machine.create({
          data: { ...m, organizationId: orgId },
        });
        machines.push(created);
        machineResults.push(`${m.name} created`);
      }
    }
    results.machines = machineResults;

    // ── 3. Seed maintenance tasks ─────────────────────────────────────────────
    const maintenanceResults: string[] = [];
    const now = new Date();

    for (const machine of machines.slice(0, 5)) {
      const existing = await db.maintenanceTask.findFirst({
        where: { machineId: machine.id },
      });
      if (existing) {
        maintenanceResults.push(`${machine.name} tasks (already exist)`);
        continue;
      }

      // Weekly task - 2 days overdue
      await db.maintenanceTask.create({
        data: {
          title: 'Weekly Lubrication & Inspection',
          frequency: 'WEEKLY',
          taskType: 'INSPECTION',
          priority: 'MEDIUM',
          estimatedMinutes: 60,
          nextDueAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          lastCompletedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
          isActive: true,
          machineId: machine.id,
          organizationId: orgId,
        },
      });

      // Monthly task - upcoming in 14 days
      await db.maintenanceTask.create({
        data: {
          title: 'Monthly Belt & Filter Check',
          frequency: 'MONTHLY',
          taskType: 'PREVENTIVE',
          priority: 'HIGH',
          estimatedMinutes: 120,
          nextDueAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          lastCompletedAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
          isActive: true,
          machineId: machine.id,
          organizationId: orgId,
        },
      });

      maintenanceResults.push(`${machine.name} tasks created`);
    }
    results.maintenanceTasks = maintenanceResults;

    // ── 4. Seed work orders ───────────────────────────────────────────────────
    const woResults: string[] = [];
    const existingWoCount = await db.workOrder.count({ where: { organizationId: orgId } });

    if (existingWoCount === 0) {
      const woTemplates = [
        { title: 'Monthly Preventive Maintenance', type: 'PREVENTIVE' as const, priority: 'MEDIUM' as const, status: 'OPEN' as const, estimatedMinutes: 120, daysOffset: 5, machineIdx: 0 },
        { title: 'Spindle Bearing Inspection', type: 'PREVENTIVE' as const, priority: 'HIGH' as const, status: 'IN_PROGRESS' as const, estimatedMinutes: 240, daysOffset: 2, machineIdx: 0 },
        { title: 'Emergency Repair - Coolant Leak', type: 'CORRECTIVE' as const, priority: 'CRITICAL' as const, status: 'OPEN' as const, estimatedMinutes: 180, daysOffset: 0, machineIdx: 1 },
        { title: 'Hydraulic Fluid Change', type: 'PREVENTIVE' as const, priority: 'MEDIUM' as const, status: 'COMPLETED' as const, estimatedMinutes: 90, daysOffset: -3, machineIdx: 2, laborCost: 180, partsCost: 65 },
        { title: 'Tool Change & Calibration', type: 'PROJECT' as const, priority: 'LOW' as const, status: 'OPEN' as const, estimatedMinutes: 60, daysOffset: 10, machineIdx: 0 },
        { title: 'Drive Belt Replacement', type: 'CORRECTIVE' as const, priority: 'HIGH' as const, status: 'ON_HOLD' as const, estimatedMinutes: 150, daysOffset: 1, machineIdx: 1 },
        { title: 'Annual Compliance Inspection', type: 'INSPECTION' as const, priority: 'CRITICAL' as const, status: 'OPEN' as const, estimatedMinutes: 480, daysOffset: 30, machineIdx: 3 },
        { title: 'Laser Lens Cleaning', type: 'PREVENTIVE' as const, priority: 'HIGH' as const, status: 'COMPLETED' as const, estimatedMinutes: 45, daysOffset: -5, machineIdx: 3, laborCost: 95, partsCost: 30 },
        { title: 'Air Filter Replacement', type: 'PREVENTIVE' as const, priority: 'MEDIUM' as const, status: 'OPEN' as const, estimatedMinutes: 30, daysOffset: 3, machineIdx: 5 },
        { title: 'Robot Cell Programming Update', type: 'PROJECT' as const, priority: 'LOW' as const, status: 'OPEN' as const, estimatedMinutes: 180, daysOffset: 14, machineIdx: 6 },
      ];

      for (let i = 0; i < woTemplates.length; i++) {
        const tmpl = woTemplates[i];
        const machine = machines[tmpl.machineIdx] || machines[0];
        const woNumber = `WO-2024-${String(i + 1).padStart(4, '0')}`;

        await db.workOrder.create({
          data: {
            woNumber,
            title: tmpl.title,
            description: `${tmpl.title} for ${machine.name}. Scheduled per PM program.`,
            type: tmpl.type,
            priority: tmpl.priority,
            status: tmpl.status,
            estimatedMinutes: tmpl.estimatedMinutes,
            laborCost: (tmpl as any).laborCost ?? null,
            partsCost: (tmpl as any).partsCost ?? null,
            dueAt: new Date(now.getTime() + tmpl.daysOffset * 24 * 60 * 60 * 1000),
            completedAt: tmpl.status === 'COMPLETED' ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
            machineId: machine.id,
            organizationId: orgId,
            createdById: 'cmoaf76fj000311ly9ghwe9fp',
          },
        });
        woResults.push(`${woNumber} - ${tmpl.title}`);
      }
    } else {
      woResults.push(`${existingWoCount} work orders already exist`);
    }
    results.workOrders = woResults;

    // ── 5. Seed parts / inventory ─────────────────────────────────────────────
    const partResults: string[] = [];
    const existingPartCount = await db.part.count({ where: { organizationId: orgId } });

    if (existingPartCount === 0) {
      const partData = [
        { name: 'Spindle Bearing 6205', partNumber: 'BRG-6205-2RS', quantity: 8, minQuantity: 3, unitCost: 24.99, supplier: 'SKF Bearings', location: 'Shelf A-1', description: 'Deep groove ball bearing for spindle applications' },
        { name: 'Hydraulic Filter HF-200', partNumber: 'HF-200-10M', quantity: 5, minQuantity: 2, unitCost: 45.00, supplier: 'Parker Hannifin', location: 'Shelf B-2', description: '10-micron hydraulic return line filter' },
        { name: 'V-Belt B68', partNumber: 'BELT-B68', quantity: 2, minQuantity: 4, unitCost: 18.50, supplier: 'Gates Belts', location: 'Shelf A-3', description: 'Classical V-belt B section 68 inch (LOW STOCK)' },
        { name: 'Coolant Concentrate 5L', partNumber: 'COOL-5L-SYNTH', quantity: 12, minQuantity: 4, unitCost: 32.00, supplier: 'Master Chemical', location: 'Storage Room', description: 'Semi-synthetic metalworking coolant concentrate' },
        { name: 'Servo Motor Drive 5.5kW', partNumber: 'SMD-5500-AC', quantity: 1, minQuantity: 1, unitCost: 890.00, supplier: 'Siemens', location: 'Electrical Cabinet', description: 'AC servo drive 5.5kW for CNC axis control' },
        { name: 'Pneumatic Cylinder 63x200', partNumber: 'PC-63200-DS', quantity: 3, minQuantity: 2, unitCost: 67.50, supplier: 'SMC Pneumatics', location: 'Shelf C-1', description: 'Double-acting pneumatic cylinder 63mm bore x 200mm stroke' },
        { name: 'Oil Seal 40x62x10', partNumber: 'SEAL-406210', quantity: 10, minQuantity: 5, unitCost: 8.75, supplier: 'NOK Seals', location: 'Shelf A-2', description: 'Rotary shaft oil seal 40mm ID x 62mm OD x 10mm' },
        { name: 'Cutting Insert APMT 1604', partNumber: 'APMT-1604-TM', quantity: 0, minQuantity: 10, unitCost: 12.50, supplier: 'Sandvik Coromant', location: 'Tool Crib', description: 'Indexable milling insert APMT 1604 PDER (OUT OF STOCK)' },
      ];

      for (const p of partData) {
        await db.part.create({ data: { ...p, organizationId: orgId } });
        partResults.push(`${p.name} (qty: ${p.quantity})`);
      }
    } else {
      partResults.push(`${existingPartCount} parts already exist`);
    }
    results.parts = partResults;

    // ── 6. Seed alerts ────────────────────────────────────────────────────────
    const alertResults: string[] = [];
    const existingAlertCount = await db.alert.count({ where: { organizationId: orgId } });

    if (existingAlertCount === 0) {
      const alertData = [
        {
          title: 'Low Coolant Level',
          message: 'CNC Milling Machine coolant reservoir is below 20%. Refill required within 24 hours.',
          type: 'SENSOR_THRESHOLD' as const,
          severity: 'MEDIUM' as const,
          isRead: false,
          machineId: machines[0]?.id ?? null,
        },
        {
          title: 'Parts Stock Out - Cutting Inserts',
          message: 'Cutting Insert APMT-1604-TM stock is at 0 units. Production may be affected.',
          type: 'LOW_PARTS' as const,
          severity: 'CRITICAL' as const,
          isRead: false,
          machineId: null,
        },
        {
          title: 'Maintenance Overdue',
          message: 'Laser Cutting Machine weekly lubrication is 3 days overdue. Schedule immediately.',
          type: 'MAINTENANCE_OVERDUE' as const,
          severity: 'HIGH' as const,
          isRead: false,
          machineId: machines[3]?.id ?? null,
        },
        {
          title: 'Work Order Completed',
          message: 'WO-2024-0004 Hydraulic Fluid Change has been marked complete.',
          type: 'WORK_ORDER_ASSIGNED' as const,
          severity: 'LOW' as const,
          isRead: true,
          machineId: machines[2]?.id ?? null,
        },
        {
          title: 'V-Belt Low Stock',
          message: 'V-Belt B68 stock (2 units) is below minimum level (4 units). Reorder recommended.',
          type: 'LOW_PARTS' as const,
          severity: 'MEDIUM' as const,
          isRead: false,
          machineId: null,
        },
      ];

      for (const a of alertData) {
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
        alertResults.push(a.title);
      }
    } else {
      alertResults.push(`${existingAlertCount} alerts already exist`);
    }
    results.alerts = alertResults;

    // ── 7. Seed notifications for kellytron ────────────────────────────────────
    const notifResults: string[] = [];
    const existingNotifCount = await db.notification.count({
      where: { userId: 'cmoaf76fj000311ly9ghwe9fp' },
    });

    if (existingNotifCount === 0) {
      const notifData = [
        { type: 'WORK_ORDER_ASSIGNED' as const, title: 'New Work Order Assigned', message: 'WO-2024-0002 Spindle Bearing Inspection has been assigned to you.', priority: 'HIGH' as const, isRead: false },
        { type: 'MAINTENANCE_DUE' as const, title: 'Maintenance Due Soon', message: 'Monthly Belt & Filter Check for CNC Milling Machine #1 is due in 14 days.', priority: 'NORMAL' as const, isRead: false },
        { type: 'PARTS_LOW' as const, title: 'Parts Stock Alert', message: 'V-Belt B68 is below minimum stock level. Consider reordering.', priority: 'HIGH' as const, isRead: false },
        { type: 'WORK_ORDER_COMPLETED' as const, title: 'Work Order Completed', message: 'WO-2024-0004 Hydraulic Fluid Change has been completed successfully.', priority: 'NORMAL' as const, isRead: true },
        { type: 'MACHINE_ALERT' as const, title: 'Machine Under Maintenance', message: 'Laser Cutting Machine has been placed under maintenance mode.', priority: 'URGENT' as const, isRead: false },
      ];

      for (const n of notifData) {
        await db.notification.create({
          data: { ...n, userId: 'cmoaf76fj000311ly9ghwe9fp' },
        });
        notifResults.push(n.title);
      }
    } else {
      notifResults.push(`${existingNotifCount} notifications already exist`);
    }
    results.notifications = notifResults;

    return NextResponse.json({
      success: true,
      message: 'Full test data seeded successfully!',
      organization: org.name,
      orgId,
      results,
    });

  } catch (error) {
    console.error('Full seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with secret to seed data' });
}