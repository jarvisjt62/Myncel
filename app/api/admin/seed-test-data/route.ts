import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Helper to check authorization (either session or secret key)
async function isAuthorized(req: NextRequest): Promise<{ authorized: boolean; email?: string }> {
  // Check for secret key first (for admin operations)
  const body = await req.clone().json().catch(() => ({}));
  const validSecret = process.env.ADMIN_SETUP_SECRET || 'myncel-admin-setup-secret-2024';
  if (body.secretKey === validSecret) {
    return { authorized: true };
  }
  
  // Fall back to session check
  const session = await getServerSession(authOptions);
  if (session?.user?.email === 'admin@myncel.com') {
    return { authorized: true, email: session.user.email };
  }
  
  return { authorized: false };
}

// Sample equipment data for manufacturing
const SAMPLE_EQUIPMENT = [
  {
    name: 'CNC Milling Machine',
    model: 'Haas VF-2',
    serialNumber: 'TEST-HAAS-001',
    location: 'Production Floor A',
    manufacturer: 'Haas Automation',
    notes: 'Vertical machining center with 30" x 16" x 20" travels',
  },
  {
    name: 'CNC Lathe',
    model: 'Mazak QT-200',
    serialNumber: 'TEST-MAZAK-002',
    location: 'Production Floor A',
    manufacturer: 'Mazak',
    notes: 'Turning center with bar feeder',
  },
  {
    name: 'Injection Molding Machine',
    model: 'Engel e-victory 50',
    serialNumber: 'TEST-ENGEL-003',
    location: 'Production Floor B',
    manufacturer: 'Engel',
    notes: '50-ton hydraulic injection molder',
  },
  {
    name: 'Hydraulic Press Brake',
    model: 'Trumpf TruBend 5170',
    serialNumber: 'TEST-TRUMPF-004',
    location: 'Workshop',
    manufacturer: 'Trumpf',
    notes: '170-ton press brake with 4m bending length',
  },
  {
    name: 'Laser Cutting Machine',
    model: 'Trumpf TruLaser 3030',
    serialNumber: 'TEST-TRUMPF-005',
    location: 'Production Floor A',
    manufacturer: 'Trumpf',
    notes: '3kW fiber laser cutter, 3000x1500mm table',
  },
];

const SAMPLE_WORK_ORDERS = [
  {
    title: 'Monthly Preventive Maintenance',
    description: 'Routine monthly inspection and lubrication of all moving parts.',
    type: 'PREVENTIVE' as const,
    priority: 'MEDIUM' as const,
    estimatedMinutes: 120,
  },
  {
    title: 'Spindle Bearing Inspection',
    description: 'Inspect spindle bearings for wear and noise.',
    type: 'PREVENTIVE' as const,
    priority: 'HIGH' as const,
    estimatedMinutes: 240,
  },
  {
    title: 'Emergency Repair - Coolant Leak',
    description: 'Coolant leak detected near spindle area.',
    type: 'CORRECTIVE' as const,
    priority: 'CRITICAL' as const,
    estimatedMinutes: 180,
  },
];

// POST /api/admin/seed-test-data - Seed test equipment and work orders
export async function POST(req: NextRequest) {
  try {
    const { authorized } = await isAuthorized(req);
    
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify organization exists
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const results = {
      equipment: [] as string[],
      workOrders: [] as string[],
      schedules: [] as string[],
    };

    // Create equipment (Machine model)
    for (const equip of SAMPLE_EQUIPMENT) {
      const existing = await db.machine.findFirst({
        where: { serialNumber: equip.serialNumber, organizationId: organizationId },
      });

      if (existing) {
        results.equipment.push(`${equip.name} (already exists)`);
        continue;
      }

      const created = await db.machine.create({
        data: {
          ...equip,
          organizationId,
        },
      });

      results.equipment.push(`${created.name} (${created.model})`);

      // Create a work order for this equipment
      const woTemplate = SAMPLE_WORK_ORDERS[Math.floor(Math.random() * SAMPLE_WORK_ORDERS.length)];
      const woCount = await db.workOrder.count({ where: { organizationId } });
      const woNumber = `WO-${new Date().getFullYear()}-${String(woCount + 1).padStart(4, '0')}-${Date.now()}`;

      await db.workOrder.create({
        data: {
          woNumber,
          title: woTemplate.title,
          description: woTemplate.description,
          type: woTemplate.type,
          priority: woTemplate.priority,
          status: 'OPEN',
          estimatedMinutes: woTemplate.estimatedMinutes,
          dueAt: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          machineId: created.id,
          organizationId,
        },
      });

      results.workOrders.push(`${woNumber} - ${woTemplate.title}`);
    }

    // Create maintenance schedules (MaintenanceTask model)
    const machines = await db.machine.findMany({
      where: { organizationId },
      take: 3,
    });

    for (const machine of machines) {
      const existing = await db.maintenanceTask.findFirst({
        where: { machineId: machine.id },
      });

      if (existing) continue;

      await db.maintenanceTask.create({
        data: {
          title: `Weekly Maintenance - ${machine.name}`,
          frequency: 'WEEKLY',
          nextDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          machineId: machine.id,
          organizationId,
        },
      });

      results.schedules.push(`Weekly schedule for ${machine.name}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Test data seeded successfully',
      organization: organization.name,
      results,
    });
  } catch (error) {
    console.error('Seed test data error:', error);
    return NextResponse.json(
      { error: 'Failed to seed test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/seed-test-data - Get list of organizations for seeding
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users
    if (!session?.user || session.user.email !== 'admin@myncel.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizations = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            machines: true,
            workOrders: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Get organizations error:', error);
    return NextResponse.json({ error: 'Failed to get organizations' }, { status: 500 });
  }
}