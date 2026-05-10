import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_BATCH_SIZE = 100;
const MAX_READING_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const MAX_FUTURE_SKEW_MS = 1000 * 60 * 5; // 5 minutes

type IncomingReading = {
  type?: unknown;
  value?: unknown;
  unit?: unknown;
  recordedAt?: unknown;
};

function hashDeviceToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return req.headers.get('x-myncel-device-token')?.trim() || '';
}

function cleanType(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function cleanUnit(value: unknown) {
  return String(value || '').trim().slice(0, 24);
}

function parseRecordedAt(value: unknown) {
  if (!value) return new Date();

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;

  const now = Date.now();
  const time = parsed.getTime();

  if (time < now - MAX_READING_AGE_MS) return null;
  if (time > now + MAX_FUTURE_SKEW_MS) return null;

  return parsed;
}

function normalizeReadings(body: any): { readings?: { type: string; value: number; unit: string; recordedAt: Date }[]; error?: string } {
  const rawReadings: IncomingReading[] = Array.isArray(body?.readings)
    ? body.readings
    : body?.type !== undefined || body?.value !== undefined
      ? [body]
      : [];

  if (rawReadings.length === 0) return { error: 'At least one reading is required' };
  if (rawReadings.length > MAX_BATCH_SIZE) return { error: `Maximum batch size is ${MAX_BATCH_SIZE} readings` };

  const readings: { type: string; value: number; unit: string; recordedAt: Date }[] = [];

  for (let index = 0; index < rawReadings.length; index += 1) {
    const reading = rawReadings[index];
    const type = cleanType(reading.type);
    const unit = cleanUnit(reading.unit);
    const value = Number(reading.value);
    const recordedAt = parseRecordedAt(reading.recordedAt);

    if (!type) return { error: `readings[${index}].type is required` };
    if (!unit) return { error: `readings[${index}].unit is required` };
    if (!Number.isFinite(value)) return { error: `readings[${index}].value must be a finite number` };
    if (!recordedAt) return { error: `readings[${index}].recordedAt is invalid or outside the allowed time window` };

    readings.push({ type, value, unit, recordedAt });
  }

  return { readings };
}

// POST /api/iot/ingest
// Auth:
//   Authorization: Bearer <deviceToken>
//   or x-myncel-device-token: <deviceToken>
// Body:
//   { readings: [{ type, value, unit, recordedAt? }] }
//   or { type, value, unit, recordedAt? }
export async function POST(req: NextRequest) {
  try {
    const rawToken = getBearerToken(req);
    if (!rawToken) return NextResponse.json({ error: 'Missing device token' }, { status: 401 });

    const tokenHash = hashDeviceToken(rawToken);
    const deviceToken = await db.machineDeviceToken.findUnique({
      where: { tokenHash },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            organizationId: true,
            status: true,
          },
        },
      },
    });

    if (!deviceToken || !deviceToken.isActive || deviceToken.revokedAt) {
      return NextResponse.json({ error: 'Invalid or revoked device token' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const { readings, error } = normalizeReadings(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    await db.sensorReading.createMany({
      data: readings!.map(reading => ({
        type: reading.type,
        value: reading.value,
        unit: reading.unit,
        recordedAt: reading.recordedAt,
        machineId: deviceToken.machineId,
      })),
    });

    await db.machineDeviceToken.update({
      where: { id: deviceToken.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      accepted: readings!.length,
      machineId: deviceToken.machineId,
      machineName: deviceToken.machine.name,
      tokenId: deviceToken.id,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('IoT telemetry ingest error:', error);
    return NextResponse.json({ error: 'Failed to ingest telemetry' }, { status: 500 });
  }
}