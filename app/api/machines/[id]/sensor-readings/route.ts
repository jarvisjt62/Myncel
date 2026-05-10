import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/machines/[id]/sensor-readings
 *
 * Returns the latest sensor readings for a machine — one entry per sensor type —
 * plus the last 20 readings for each type for sparkline charts.
 *
 * Used by the HMI to show real gateway data instead of simulation.
 *
 * Auth: user or admin session that belongs to the same organization as the machine.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId as string | undefined;
    const role = (session.user as any).role as string | undefined;
    const isSuperAdmin =
      role === 'SUPER_ADMIN' || session.user.email === 'admin@myncel.com';

    // Verify machine belongs to org
    const machine = await db.machine.findUnique({
      where: { id: params.id },
      select: { id: true, organizationId: true, name: true, status: true },
    });

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    if (!isSuperAdmin && machine.organizationId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the most recent 50 readings (last ~5 minutes at 1 reading/6s typical)
    const recent = await db.sensorReading.findMany({
      where: { machineId: params.id },
      orderBy: { recordedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        type: true,
        value: true,
        unit: true,
        recordedAt: true,
      },
    });

    // Build a map of type → [latest, ...history] and latest single value
    const byType: Record<
      string,
      { latest: number; unit: string; recordedAt: string; history: number[] }
    > = {};

    // Process from oldest to newest (we fetched newest-first, so reverse for history order)
    const chronological = [...recent].reverse();

    for (const r of chronological) {
      if (!byType[r.type]) {
        byType[r.type] = {
          latest: r.value,
          unit: r.unit,
          recordedAt: r.recordedAt.toISOString(),
          history: [],
        };
      }
      byType[r.type].latest = r.value;
      byType[r.type].unit = r.unit;
      byType[r.type].recordedAt = r.recordedAt.toISOString();
      byType[r.type].history = [...byType[r.type].history.slice(-19), r.value];
    }

    // Map sensor types to HMI liveData fields
    // temp: temperature
    // load: load, current, vibration (scaled)
    // rpm: rpm, spindle_speed, speed, cycle_count (scaled)
    // pressure: pressure, hydraulic_pressure, oil_pressure
    const temp =
      byType['temperature']?.latest ??
      byType['temp']?.latest ??
      null;

    const load =
      byType['load']?.latest ??
      byType['motor_load']?.latest ??
      (byType['current']?.latest != null
        ? Math.min(99, (byType['current'].latest / 50) * 100)
        : null) ??
      (byType['vibration']?.latest != null
        ? Math.min(99, byType['vibration'].latest * 10)
        : null) ??
      null;

    const rpm =
      byType['rpm']?.latest ??
      byType['spindle_speed']?.latest ??
      byType['speed']?.latest ??
      byType['motor_speed']?.latest ??
      null;

    const pressure =
      byType['pressure']?.latest ??
      byType['hydraulic_pressure']?.latest ??
      byType['oil_pressure']?.latest ??
      byType['air_pressure']?.latest ??
      null;

    // Check if we have readings from the last 2 minutes (gateway is live)
    const mostRecent = recent[0];
    const isLive =
      mostRecent != null &&
      Date.now() - new Date(mostRecent.recordedAt).getTime() < 2 * 60 * 1000;

    return NextResponse.json({
      machineId: params.id,
      machineName: machine.name,
      machineStatus: machine.status,
      isLive,
      lastReadingAt: mostRecent?.recordedAt?.toISOString() ?? null,
      liveData: {
        temp,
        load,
        rpm,
        pressure,
      },
      // Per-type detail for advanced display
      sensors: byType,
    });
  } catch (error) {
    console.error('Sensor readings error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}