import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';

/**
 * IoT Sensor Data Ingestion API
 *
 * Accepts sensor readings from IoT devices and updates machine runtime tracking.
 * Authentication: API key in Authorization header or X-API-Key header.
 *
 * POST /api/iot
 * Body: { machineId, sensorType, value, unit, timestamp? }
 *       OR array of the above for batch ingestion
 *
 * Sensor types:
 *   - temperature (°C or °F)
 *   - vibration (mm/s or g)
 *   - runtime_hours (hours)
 *   - cycle_count (count)
 *   - pressure (PSI or bar)
 *   - current (A)
 *   - oil_level (%)
 *   - humidity (%)
 *   - custom
 *
 * GET /api/iot?machineId=xxx — fetch recent sensor readings
 */

const VALID_SENSOR_TYPES = [
  'temperature',
  'vibration',
  'runtime_hours',
  'cycle_count',
  'pressure',
  'current',
  'oil_level',
  'humidity',
  'custom',
] as const;

type SensorType = typeof VALID_SENSOR_TYPES[number];

interface SensorReadingInput {
  machineId: string;
  sensorId?: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

// GET — fetch sensor readings for a machine
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const machineId = searchParams.get('machineId');
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    // Validate API key via Zapier integration
    const orgId = await validateApiKey(apiKey);
    if (!orgId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    if (!machineId) {
      return NextResponse.json({ error: 'machineId is required' }, { status: 400 });
    }

    // Verify machine belongs to organization
    const machine = await safeQuery(
      db.machine.findFirst({
        where: { id: machineId, organizationId: orgId },
        select: {
          id: true,
          name: true,
          totalHours: true,
          lastServiceAt: true,
          status: true,
        },
      }),
      null
    );

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    // Fetch recent sensor readings from DB
    const readings = await safeQuery(
      db.sensorReading.findMany({
        where: { machineId },
        orderBy: { recordedAt: 'desc' },
        take: 50,
      }),
      []
    );

    return NextResponse.json({
      machineId,
      machineName: machine.name,
      totalHours: machine.totalHours,
      lastServiceAt: machine.lastServiceAt,
      status: machine.status,
      recentReadings: readings,
    });
  } catch (error) {
    console.error('IoT GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — ingest sensor readings
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required. Include X-API-Key header.' }, { status: 401 });
    }

    // Validate API key
    const orgId = await validateApiKey(apiKey);
    if (!orgId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await req.json();

    // Support both single reading and batch
    const readings: SensorReadingInput[] = Array.isArray(body) ? body : [body];

    if (readings.length === 0) {
      return NextResponse.json({ error: 'No readings provided' }, { status: 400 });
    }

    if (readings.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 readings per request' }, { status: 400 });
    }

    const results: Array<{ machineId: string; status: string; error?: string }> = [];

    for (const reading of readings) {
      const result = await processReading(orgId, reading);
      results.push(result);
    }

    const successful = results.filter(r => r.status === 'ok').length;
    const failed = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      processed: readings.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('IoT POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processReading(
  orgId: string,
  reading: SensorReadingInput
): Promise<{ machineId: string; status: string; error?: string }> {
  try {
    const { machineId, sensorType, value, unit, timestamp } = reading;

    if (!machineId || !sensorType || value === undefined) {
      return { machineId: machineId || 'unknown', status: 'error', error: 'machineId, sensorType, and value are required' };
    }

    if (!VALID_SENSOR_TYPES.includes(sensorType)) {
      return { machineId, status: 'error', error: `Invalid sensorType. Must be one of: ${VALID_SENSOR_TYPES.join(', ')}` };
    }

    // Verify machine belongs to org
    const machine = await safeQuery(
      db.machine.findFirst({
        where: { id: machineId, organizationId: orgId },
        select: { id: true, name: true, totalHours: true },
      }),
      null
    );

    if (!machine) {
      return { machineId, status: 'error', error: 'Machine not found' };
    }

    const ts = timestamp ? new Date(timestamp) : new Date();

    // Update machine totalHours for runtime_hours sensor readings
    if (sensorType === 'runtime_hours') {
      await safeQuery(
        db.machine.update({
          where: { id: machineId },
          data: {
            totalHours: value,
            updatedAt: new Date(),
          },
        }),
        null
      );
    }

    // Store the reading in the SensorReading DB table
    await safeQuery(
      db.sensorReading.create({
        data: {
          type: sensorType,
          value,
          unit,
          recordedAt: ts,
          machineId,
        },
      }),
      null
    );

    // Check alert thresholds
    await checkAlertThresholds(orgId, machineId, machine.name, sensorType, value, unit);

    return { machineId, status: 'ok' };
  } catch (err) {
    console.error('Error processing reading:', err);
    return { machineId: reading.machineId || 'unknown', status: 'error', error: String(err) };
  }
}

async function validateApiKey(apiKey: string): Promise<string | null> {
  try {
    const integration = await safeQuery(
      db.integration.findFirst({
        where: {
          apiKey,
          type: { in: ['ZAPIER'] },
          status: 'CONNECTED',
        },
        select: { organizationId: true },
      }),
      null
    );

    if (integration?.organizationId) {
      return integration.organizationId;
    }

    return null;
  } catch {
    return null;
  }
}

// Alert threshold defaults per sensor type
const ALERT_THRESHOLDS: Record<string, { critical: number; high: number; operator: 'gt' | 'lt' }> = {
  temperature: { critical: 90, high: 75, operator: 'gt' },   // °C
  vibration:   { critical: 10, high: 7,  operator: 'gt' },   // mm/s
  pressure:    { critical: 150, high: 120, operator: 'gt' },  // PSI
  current:     { critical: 50, high: 40, operator: 'gt' },   // Amps
  oil_level:   { critical: 10, high: 20, operator: 'lt' },   // % — low is bad
};

async function checkAlertThresholds(
  orgId: string,
  machineId: string,
  machineName: string,
  sensorType: string,
  value: number,
  unit: string
): Promise<void> {
  const threshold = ALERT_THRESHOLDS[sensorType];
  if (!threshold) return;

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
    const alertMessage = `${sensorType.replace(/_/g, ' ')} sensor reading of ${value}${unit} on ${machineName} ${direction} ${exceeds ? 'critical' : 'warning'} threshold (${thresholdValue}${unit})`;

    // Create an alert in the database
    await safeQuery(
      db.alert.create({
        data: {
          type: 'SENSOR_THRESHOLD',
          title: `${severity}: ${sensorType.replace(/_/g, ' ')} alert on ${machineName}`,
          message: alertMessage,
          severity: severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
          isRead: false,
          isResolved: false,
          machineId,
          organizationId: orgId,
        },
      }),
      null
    );

    // Dispatch notifications
    try {
      const { dispatchNotifications } = await import('@/lib/notifications/dispatch');
      await dispatchNotifications(orgId, {
        type: 'alert.triggered',
        alertTitle: `${sensorType.replace(/_/g, ' ')} threshold exceeded`,
        machineName,
        severity,
        message: alertMessage,
      });
    } catch (err) {
      console.error('Failed to dispatch IoT alert notification:', err);
    }
  }
}