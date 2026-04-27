import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface SensorReadingInput {
  machineId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp?: string;
}

// Alert thresholds (same as /api/iot)
const ALERT_THRESHOLDS: Record<string, { critical: number; high: number; operator: 'gt' | 'lt' }> = {
  temperature: { critical: 90,  high: 75,  operator: 'gt' },
  vibration:   { critical: 10,  high: 7,   operator: 'gt' },
  pressure:    { critical: 150, high: 120, operator: 'gt' },
  current:     { critical: 50,  high: 40,  operator: 'gt' },
  oil_level:   { critical: 10,  high: 20,  operator: 'lt' },
};

// POST — accept batch sensor readings from the simulator UI
// Auth: session-based (no API key needed — this is a UI tool)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { readings }: { readings: SensorReadingInput[] } = body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json({ error: 'readings array is required' }, { status: 400 });
    }

    if (readings.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 readings per request' }, { status: 400 });
    }

    const orgId = session.user.organizationId;
    const results: Array<{ sensorType: string; value: number; status: string; alertCreated?: boolean }> = [];

    for (const reading of readings) {
      const { machineId, sensorType, value, unit, timestamp } = reading;

      if (!machineId || !sensorType || value === undefined) {
        results.push({ sensorType: sensorType || 'unknown', value: value ?? 0, status: 'error' });
        continue;
      }

      // Verify machine belongs to this org
      const machine = await db.machine.findFirst({
        where: { id: machineId, organizationId: orgId },
        select: { id: true, name: true },
      });

      if (!machine) {
        results.push({ sensorType, value, status: 'error' });
        continue;
      }

      const ts = timestamp ? new Date(timestamp) : new Date();

      // Store the reading
      await db.sensorReading.create({
        data: {
          type: sensorType,
          value,
          unit,
          recordedAt: ts,
          machineId,
        },
      });

      // Update totalHours for runtime_hours sensor
      if (sensorType === 'runtime_hours') {
        await db.machine.update({
          where: { id: machineId },
          data: { totalHours: value, updatedAt: new Date() },
        });
      }

      // Check alert thresholds and create alerts if needed
      let alertCreated = false;
      const threshold = ALERT_THRESHOLDS[sensorType];
      if (threshold) {
        const exceeds = threshold.operator === 'gt'
          ? value >= threshold.critical
          : value <= threshold.critical;
        const warning = threshold.operator === 'gt'
          ? (value >= threshold.high && value < threshold.critical)
          : (value <= threshold.high && value > threshold.critical);

        if (exceeds || warning) {
          const severity = exceeds ? 'CRITICAL' : 'HIGH';
          const direction = threshold.operator === 'gt' ? 'exceeds' : 'is below';
          const thresholdValue = exceeds ? threshold.critical : threshold.high;

          // Avoid duplicate alerts — only create if no unresolved alert for this sensor in last 10 min
          const recentAlert = await db.alert.findFirst({
            where: {
              machineId,
              organizationId: orgId,
              isResolved: false,
              title: { contains: sensorType.replace(/_/g, ' ') },
              createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
            },
          });

          if (!recentAlert) {
            await db.alert.create({
              data: {
                type: 'SENSOR_THRESHOLD',
                title: `${severity}: ${sensorType.replace(/_/g, ' ')} alert on ${machine.name}`,
                message: `Simulator: ${sensorType.replace(/_/g, ' ')} reading of ${value}${unit} on ${machine.name} ${direction} ${exceeds ? 'critical' : 'warning'} threshold (${thresholdValue}${unit})`,
                severity: severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
                isRead: false,
                isResolved: false,
                machineId,
                organizationId: orgId,
              },
            });
            alertCreated = true;
          }
        }
      }

      results.push({ sensorType, value, status: 'ok', alertCreated });
    }

    const successful = results.filter(r => r.status === 'ok').length;
    const alertsCreated = results.filter(r => r.alertCreated).length;

    return NextResponse.json({
      success: true,
      processed: readings.length,
      successful,
      failed: readings.length - successful,
      alertsCreated,
      results,
    });
  } catch (error) {
    console.error('Simulator POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET — return simulator stats (last N readings for this org)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const machineId = searchParams.get('machineId');

    const where = machineId
      ? { machineId, machine: { organizationId: session.user.organizationId } }
      : { machine: { organizationId: session.user.organizationId } };

    const readings = await db.sensorReading.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: 100,
      include: { machine: { select: { name: true } } },
    });

    return NextResponse.json({ readings });
  } catch (error) {
    console.error('Simulator GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}