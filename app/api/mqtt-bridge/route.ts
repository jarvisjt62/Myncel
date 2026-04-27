import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

/**
 * MQTT Bridge — POST /api/mqtt-bridge
 *
 * Accepts MQTT-style payloads from IoT gateways (Node-RED, Mosquitto bridge, etc.)
 * and forwards them to the standard /api/iot pipeline.
 *
 * Supported payload formats:
 *
 * 1. Single reading (MQTT-style topic + value):
 *    { "topic": "factory/machineId/temperature", "value": 72.5 }
 *
 * 2. Explicit payload (same as /api/iot):
 *    { "machineId": "...", "sensorType": "temperature", "value": 72.5, "unit": "°C" }
 *
 * 3. Batch array (either format):
 *    [ {...}, {...}, {...} ]
 *
 * Auth: X-API-Key header (same as /api/iot)
 */

interface MqttPayload {
  topic?: string;           // "factory/{machineId}/{sensorType}"
  machineId?: string;
  sensorType?: string;
  value: number;
  unit?: string;
  timestamp?: string;
  // Common MQTT bridge fields
  payload?: string | number; // some bridges wrap the value
  msg?: { payload: string | number };
}

const UNIT_MAP: Record<string, string> = {
  temperature:   '°C',
  vibration:     'mm/s',
  pressure:      'PSI',
  current:       'A',
  oil_level:     '%',
  runtime_hours: 'hrs',
  humidity:      '%',
  rpm:           'RPM',
  voltage:       'V',
  power:         'kW',
};

function parseMqttPayload(raw: MqttPayload): {
  machineId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp?: string;
} | null {
  // Extract value — handle nested .payload or .msg.payload
  let value: number = raw.value;
  if (value === undefined || value === null) {
    const nested = raw.payload ?? raw.msg?.payload;
    if (nested !== undefined) value = parseFloat(String(nested));
  }
  if (isNaN(value)) return null;

  // If topic is provided, parse machineId + sensorType from it
  if (raw.topic) {
    // Support formats:
    //   factory/{machineId}/{sensorType}
    //   myncel/{machineId}/{sensorType}
    //   {machineId}/{sensorType}
    const parts = raw.topic.replace(/^(factory|myncel|sensors)\//, '').split('/');
    if (parts.length >= 2) {
      const machineId  = parts[0];
      const sensorType = parts[1];
      const unit       = raw.unit || UNIT_MAP[sensorType] || '';
      return { machineId, sensorType, value, unit, timestamp: raw.timestamp };
    }
  }

  // Explicit fields
  if (raw.machineId && raw.sensorType) {
    return {
      machineId:  raw.machineId,
      sensorType: raw.sensorType,
      value,
      unit: raw.unit || UNIT_MAP[raw.sensorType] || '',
      timestamp: raw.timestamp,
    };
  }

  return null;
}

async function validateApiKey(key: string): Promise<string | null> {
  if (!key) return null;
  const integration = await prisma.integration.findFirst({
    where: {
      apiKey: key,
      type: 'ZAPIER',
      status: 'CONNECTED',
    },
    select: { organizationId: true },
  });
  return integration?.organizationId ?? null;
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const apiKey = req.headers.get('x-api-key') ||
                   req.headers.get('X-API-Key') ||
                   req.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing X-API-Key header' }, { status: 401 });
    }

    const organizationId = await validateApiKey(apiKey);
    if (!organizationId) {
      return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 });
    }

    // Parse body — accept single object or array
    const body = await req.json();
    const rawItems: MqttPayload[] = Array.isArray(body) ? body : [body];

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }
    if (rawItems.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 readings per request' }, { status: 400 });
    }

    // Parse all readings
    const parsed = rawItems.map(parseMqttPayload).filter(Boolean) as {
      machineId: string; sensorType: string; value: number; unit: string; timestamp?: string;
    }[];

    if (parsed.length === 0) {
      return NextResponse.json({
        error: 'No valid readings. Provide either "topic" (factory/machineId/sensorType) or "machineId" + "sensorType" fields.',
      }, { status: 400 });
    }

    // Validate machine IDs belong to this organization
    const machineIds = Array.from(new Set(parsed.map(r => r.machineId)));
    const machines = await prisma.machine.findMany({
      where: { id: { in: machineIds }, organizationId },
      select: { id: true, name: true },
    });
    const validMachineIds = new Set(machines.map(m => m.id));

    const validReadings = parsed.filter(r => validMachineIds.has(r.machineId));
    const rejectedCount = parsed.length - validReadings.length;

    if (validReadings.length === 0) {
      return NextResponse.json({
        error: 'No valid machine IDs found in your organization.',
        hint: 'Check that machineId values match IDs from your Myncel dashboard.',
      }, { status: 400 });
    }

    // Store sensor readings
    const now = new Date();
    const sensorReadings = await prisma.sensorReading.createMany({
      data: validReadings.map(r => ({
        machineId:  r.machineId,
        type:       r.sensorType,
        value:      r.value,
        unit:       r.unit,
        recordedAt: r.timestamp ? new Date(r.timestamp) : now,
      })),
    });

    // Update machine lastSeenAt
    await prisma.machine.updateMany({
      where: { id: { in: Array.from(validMachineIds) } },
      data:  { updatedAt: now },
    });

    // Check thresholds and create alerts
    const THRESHOLDS: Record<string, { warning: number; critical: number; direction: 'high' | 'low' }> = {
      temperature:   { warning: 75,  critical: 90,  direction: 'high' },
      vibration:     { warning: 7,   critical: 10,  direction: 'high' },
      pressure:      { warning: 120, critical: 150, direction: 'high' },
      current:       { warning: 40,  critical: 50,  direction: 'high' },
      oil_level:     { warning: 20,  critical: 10,  direction: 'low'  },
      humidity:      { warning: 65,  critical: 80,  direction: 'high' },
    };

    let alertsCreated = 0;
    for (const r of validReadings) {
      const thresh = THRESHOLDS[r.sensorType];
      if (!thresh) continue;

      const isCritical = thresh.direction === 'high'
        ? r.value >= thresh.critical
        : r.value <= thresh.critical;
      const isWarning = !isCritical && (thresh.direction === 'high'
        ? r.value >= thresh.warning
        : r.value <= thresh.warning);

      if (isCritical || isWarning) {
        const machine = machines.find(m => m.id === r.machineId);
        const recent = await prisma.alert.findFirst({
          where: {
            machineId: r.machineId,
            createdAt: { gte: new Date(now.getTime() - 10 * 60 * 1000) },
            title:     { contains: r.sensorType },
          },
        });

        if (!recent) {
          await prisma.alert.create({
            data: {
              machineId:      r.machineId,
              organizationId,
              type:           'SENSOR_THRESHOLD',
              severity:       isCritical ? 'CRITICAL' : 'HIGH',
              title:          `${isCritical ? '🚨 Critical' : '⚠️ Warning'}: ${r.sensorType} on ${machine?.name}`,
              message:        `${r.sensorType} reading of ${r.value}${r.unit} via MQTT bridge ${isCritical ? 'exceeded critical' : 'exceeded warning'} threshold (${isCritical ? thresh.critical : thresh.warning}${r.unit})`,
            },
          });
          alertsCreated++;
        }
      }
    }

    // Update Integration last sync timestamp
    await prisma.integration.updateMany({
      where: { apiKey, type: 'ZAPIER' },
      data: { lastSyncAt: now },
    });

    return NextResponse.json({
      success:       true,
      accepted:      validReadings.length,
      rejected:      rejectedCount,
      alertsCreated,
      stored:        sensorReadings.count,
      via:           'mqtt-bridge',
    });

  } catch (error: any) {
    console.error('[MQTT Bridge] Error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 });
  }
}

// GET: health check + usage docs
export async function GET() {
  return NextResponse.json({
    service:     'Myncel MQTT Bridge',
    version:     '1.0.0',
    status:      'online',
    description: 'Accepts MQTT-style payloads and forwards to the Myncel IoT pipeline.',
    endpoints: {
      bridge: 'POST /api/mqtt-bridge',
      direct: 'POST /api/iot',
    },
    authentication: 'X-API-Key header — generate keys at /settings/api-keys',
    payloadFormats: {
      topicBased: {
        description: 'Parse machineId + sensorType from MQTT topic path',
        example: {
          topic: 'factory/{machineId}/{sensorType}',
          value: 72.5,
        },
      },
      explicit: {
        description: 'Provide machineId and sensorType directly',
        example: {
          machineId:  'clx123...',
          sensorType: 'temperature',
          value:      72.5,
          unit:       '°C',
        },
      },
      batch: {
        description: 'Array of up to 100 readings in either format',
        example: [
          { topic: 'factory/m1/temperature', value: 72.5 },
          { topic: 'factory/m1/vibration',   value: 2.3  },
        ],
      },
    },
    topicPrefixes: ['factory/', 'myncel/', 'sensors/', '(none)'],
    supportedSensors: Object.keys(UNIT_MAP),
  });
}

