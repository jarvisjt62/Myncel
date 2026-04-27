import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/sensors?machineId=xxx - Get sensor readings for IoT chart
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const machineId = searchParams.get('machineId');
    const sensorType = searchParams.get('type'); // optional filter
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!machineId) {
      return NextResponse.json({ error: 'machineId is required' }, { status: 400 });
    }

    // Verify machine belongs to org
    const machine = await db.machine.findFirst({
      where: { id: machineId, organizationId: session.user.organizationId },
      select: { id: true, name: true, totalHours: true, status: true },
    });

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    // Fetch sensor readings
    const readings = await db.sensorReading.findMany({
      where: {
        machineId,
        ...(sensorType ? { type: sensorType } : {}),
      },
      orderBy: { recordedAt: 'asc' },
      take: limit,
    });

    // Group readings by sensor type
    const groupedByType: Record<string, any[]> = {};
    readings.forEach(r => {
      if (!groupedByType[r.type]) groupedByType[r.type] = [];
      groupedByType[r.type].push({
        value: r.value,
        unit: r.unit,
        timestamp: r.recordedAt.toISOString(),
      });
    });

    // Get available sensor types
    const sensorTypes = Object.keys(groupedByType);

    return NextResponse.json({
      machineId,
      machineName: machine.name,
      totalHours: machine.totalHours,
      status: machine.status,
      hasData: readings.length > 0,
      sensorTypes,
      readings: groupedByType,
      latestReadings: sensorTypes.map(type => {
        const typeReadings = groupedByType[type];
        const latest = typeReadings[typeReadings.length - 1];
        return { type, ...latest };
      }),
    });
  } catch (error) {
    console.error('Sensor data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sensor data' }, { status: 500 });
  }
}