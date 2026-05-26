/**
 * Telematics importer endpoint.
 *
 * Accepts payloads from popular fleet-telematics providers (Geotab, Samsara,
 * Verizon Connect, Motive / KeepTruckin, Fleetio) and re-shapes them into
 * Myncel readings persisted on the matching machine.
 *
 * Auth: same gateway-token model as /api/iot/ingest. Each Machine that
 * represents a vehicle, vessel, or drone gets a Gateway Token (created from
 * the machine detail page). The remote provider's webhook or scheduled
 * pusher includes the token as `Authorization: Bearer <token>` or the
 * `X-Myncel-Device-Token` header.
 *
 * The endpoint accepts either a single payload or an array. The provider is
 * inferred from `?provider=geotab|samsara|verizon|motive|fleetio` query param,
 * or detected heuristically by inspecting payload keys.
 *
 * Big Bet #3 — Vehicle / Vessel / UAV telematics.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_READINGS_PER_REQUEST = 500;

type IncomingRecord = Record<string, unknown>;
type NormalizedReading = {
  type: string;
  value: number;
  unit: string;
  recordedAt: Date;
};

type Provider = 'geotab' | 'samsara' | 'verizon' | 'motive' | 'fleetio' | 'generic';

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

function safeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function safeDate(value: unknown): Date {
  if (!value) return new Date();
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return new Date();
  // Bound to a sensible window: -30 days to +5 minutes.
  const now = Date.now();
  const t = d.getTime();
  if (t < now - 1000 * 60 * 60 * 24 * 30) return new Date();
  if (t > now + 1000 * 60 * 5) return new Date();
  return d;
}

/* ---------- Provider-specific normalization ---------- */

/**
 * Geotab Add-In or MyAdmin SDK pushes objects shaped like:
 * { dateTime, diagnostic: { id|name }, value, unit }
 * or an array of such objects.
 */
function normalizeGeotab(record: IncomingRecord): NormalizedReading | null {
  const diag = record['diagnostic'] as IncomingRecord | undefined;
  const rawType = diag?.['name'] || diag?.['id'] || record['name'] || record['type'];
  const type = cleanType(rawType);
  const value = safeNumber(record['value'] ?? record['data']);
  if (!type || value === null) return null;
  return {
    type,
    value,
    unit: String(record['unit'] || record['unitOfMeasure'] || '').slice(0, 24),
    recordedAt: safeDate(record['dateTime'] || record['timestamp']),
  };
}

/**
 * Samsara webhook for "vehicle stats" arrives as a snapshot, e.g.:
 * { vehicleId, time, gpsOdometerMeters, fuelPercents, engineRpm, engineCoolantTemperatureMilliC, ... }
 * We flatten the known fields into individual readings.
 */
const SAMSARA_FIELD_MAP: Record<string, { type: string; unit: string; scale?: number }> = {
  gpsOdometerMeters: { type: 'odometer', unit: 'km', scale: 1 / 1000 },
  fuelPercents: { type: 'fuel_level', unit: '%' },
  engineRpm: { type: 'engine_rpm', unit: 'rpm' },
  engineSpeedRpm: { type: 'engine_rpm', unit: 'rpm' },
  engineCoolantTemperatureMilliC: { type: 'coolant_temp', unit: 'C', scale: 1 / 1000 },
  obdEngineSecondsTotal: { type: 'engine_runtime', unit: 's' },
  obdOdometerMeters: { type: 'odometer', unit: 'km', scale: 1 / 1000 },
  defLevelPercent: { type: 'def_level', unit: '%' },
  ecuSpeedKilometersPerHour: { type: 'vehicle_speed', unit: 'km/h' },
  batteryMilliVolts: { type: 'battery_voltage', unit: 'V', scale: 1 / 1000 },
};

function normalizeSamsara(record: IncomingRecord): NormalizedReading[] {
  const readings: NormalizedReading[] = [];
  const recordedAt = safeDate(record['time'] || record['timestamp']);
  for (const [field, spec] of Object.entries(SAMSARA_FIELD_MAP)) {
    if (record[field] === undefined || record[field] === null) continue;
    const raw = safeNumber(record[field]);
    if (raw === null) continue;
    const value = spec.scale ? raw * spec.scale : raw;
    readings.push({ type: spec.type, value, unit: spec.unit, recordedAt });
  }
  return readings;
}

/**
 * Verizon Connect / Reveal webhook (legacy Networkfleet).
 * { time, deviceId, signal: { name, value, unit } }
 */
function normalizeVerizon(record: IncomingRecord): NormalizedReading | null {
  const sig = (record['signal'] || record) as IncomingRecord;
  const type = cleanType(sig['name'] || record['name']);
  const value = safeNumber(sig['value'] ?? record['value']);
  if (!type || value === null) return null;
  return {
    type,
    value,
    unit: String(sig['unit'] || record['unit'] || '').slice(0, 24),
    recordedAt: safeDate(record['time'] || record['timestamp']),
  };
}

/**
 * Motive (KeepTruckin) — { vehicle: {...}, current_state: { gps_odometer_km, fuel_percent, ... } }
 */
const MOTIVE_FIELD_MAP: Record<string, { type: string; unit: string }> = {
  gps_odometer_km: { type: 'odometer', unit: 'km' },
  fuel_percent: { type: 'fuel_level', unit: '%' },
  speed_kph: { type: 'vehicle_speed', unit: 'km/h' },
  engine_hours: { type: 'engine_hours', unit: 'h' },
  def_percent: { type: 'def_level', unit: '%' },
};

function normalizeMotive(record: IncomingRecord): NormalizedReading[] {
  const readings: NormalizedReading[] = [];
  const state = (record['current_state'] || record) as IncomingRecord;
  const recordedAt = safeDate(state['recorded_at'] || record['recorded_at']);
  for (const [field, spec] of Object.entries(MOTIVE_FIELD_MAP)) {
    if (state[field] === undefined || state[field] === null) continue;
    const raw = safeNumber(state[field]);
    if (raw === null) continue;
    readings.push({ type: spec.type, value: raw, unit: spec.unit, recordedAt });
  }
  return readings;
}

/**
 * Fleetio meter-reading API:
 * { meter_entry: { value, units, meter_type, recorded_at } }
 */
function normalizeFleetio(record: IncomingRecord): NormalizedReading | null {
  const entry = (record['meter_entry'] || record) as IncomingRecord;
  const type = cleanType(entry['meter_type'] || 'odometer');
  const value = safeNumber(entry['value']);
  if (!type || value === null) return null;
  return {
    type,
    value,
    unit: String(entry['units'] || '').slice(0, 24),
    recordedAt: safeDate(entry['recorded_at']),
  };
}

/**
 * Generic shape — { type, value, unit, recordedAt } — same as /api/iot/ingest.
 */
function normalizeGeneric(record: IncomingRecord): NormalizedReading | null {
  const type = cleanType(record['type']);
  const value = safeNumber(record['value']);
  if (!type || value === null) return null;
  return {
    type,
    value,
    unit: String(record['unit'] || '').slice(0, 24),
    recordedAt: safeDate(record['recordedAt'] || record['timestamp']),
  };
}

function detectProvider(req: NextRequest, body: unknown): Provider {
  const fromQuery = (req.nextUrl.searchParams.get('provider') || '').toLowerCase();
  if (['geotab', 'samsara', 'verizon', 'motive', 'fleetio', 'generic'].includes(fromQuery)) {
    return fromQuery as Provider;
  }
  if (Array.isArray(body) && body.length > 0) return detectProvider(req, body[0]);
  if (body && typeof body === 'object') {
    const r = body as IncomingRecord;
    if (r['diagnostic']) return 'geotab';
    if (r['gpsOdometerMeters'] !== undefined || r['engineRpm'] !== undefined) return 'samsara';
    if (r['signal'] !== undefined) return 'verizon';
    if (r['current_state'] !== undefined) return 'motive';
    if (r['meter_entry'] !== undefined) return 'fleetio';
  }
  return 'generic';
}

function normalize(provider: Provider, record: IncomingRecord): NormalizedReading[] {
  if (provider === 'geotab') {
    const r = normalizeGeotab(record);
    return r ? [r] : [];
  }
  if (provider === 'samsara') return normalizeSamsara(record);
  if (provider === 'verizon') {
    const r = normalizeVerizon(record);
    return r ? [r] : [];
  }
  if (provider === 'motive') return normalizeMotive(record);
  if (provider === 'fleetio') {
    const r = normalizeFleetio(record);
    return r ? [r] : [];
  }
  const r = normalizeGeneric(record);
  return r ? [r] : [];
}

export async function POST(req: NextRequest) {
  const rawToken = getBearerToken(req);
  if (!rawToken) {
    return NextResponse.json({ error: 'Missing device token' }, { status: 401 });
  }

  const tokenHash = hashDeviceToken(rawToken);
  const deviceToken = await db.machineDeviceToken.findUnique({ where: { tokenHash } });
  if (!deviceToken || deviceToken.revokedAt) {
    return NextResponse.json({ error: 'Invalid or revoked device token' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const provider = detectProvider(req, body);
  const records: IncomingRecord[] = Array.isArray(body)
    ? (body as IncomingRecord[])
    : [body as IncomingRecord];

  const readings: NormalizedReading[] = [];
  for (const record of records) {
    if (!record || typeof record !== 'object') continue;
    const norm = normalize(provider, record);
    for (const r of norm) {
      readings.push(r);
      if (readings.length >= MAX_READINGS_PER_REQUEST) break;
    }
    if (readings.length >= MAX_READINGS_PER_REQUEST) break;
  }

  if (readings.length === 0) {
    return NextResponse.json({
      provider,
      accepted: 0,
      message: 'No readings could be normalized from the payload',
    }, { status: 400 });
  }

  await db.sensorReading.createMany({
    data: readings.map(r => ({
      machineId: deviceToken.machineId,
      type: r.type,
      value: r.value,
      unit: r.unit,
      recordedAt: r.recordedAt,
    })),
    skipDuplicates: true,
  });

  await db.machineDeviceToken.update({
    where: { id: deviceToken.id },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({
    provider,
    machineId: deviceToken.machineId,
    accepted: readings.length,
  }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({
    name: 'Myncel telematics importer',
    description: 'POST normalized telematics readings here. Authenticated with a Machine Gateway Token.',
    providers: ['geotab', 'samsara', 'verizon', 'motive', 'fleetio', 'generic'],
    auth: 'Authorization: Bearer <gateway_token> OR X-Myncel-Device-Token: <gateway_token>',
    docsUrl: '/docs/telematics',
  });
}
