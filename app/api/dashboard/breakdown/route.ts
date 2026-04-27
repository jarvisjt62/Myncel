import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/dashboard/breakdown - Log a machine breakdown
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const userId = (session.user as any).id;
    const body = await req.json();

    const { machineId, description, severity = 'HIGH', estimatedDowntime } = body;

    if (!machineId || !description) {
      return NextResponse.json({ error: 'Machine and description are required' }, { status: 400 });
    }

    // Generate WO number
    const count = await db.workOrder.count({ where: { organizationId: orgId } });
    const woNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Create an EMERGENCY work order for the breakdown
    const workOrder = await db.workOrder.create({
      data: {
        woNumber,
        title: `Breakdown: ${description.slice(0, 80)}`,
        description,
        type: 'EMERGENCY',
        priority: severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
        machineId,
        organizationId: orgId,
        createdById: userId || undefined,
        estimatedMinutes: estimatedDowntime ? parseInt(estimatedDowntime) * 60 : undefined,
      },
    });

    // Also create a MACHINE_BREAKDOWN alert
    await db.alert.create({
      data: {
        type: 'MACHINE_BREAKDOWN',
        title: 'Machine Breakdown Reported',
        message: description,
        severity: severity as any,
        machineId,
        organizationId: orgId,
      },
    });

    // Update machine status to reflect the breakdown
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      await db.machine.update({
        where: { id: machineId },
        data: { status: 'BREAKDOWN' },
      });
    }

    return NextResponse.json({ workOrder, message: 'Breakdown logged successfully' });
  } catch (error) {
    console.error('Breakdown log error:', error);
    return NextResponse.json({ error: 'Failed to log breakdown' }, { status: 500 });
  }
}