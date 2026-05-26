/**
 * GET    /api/ai/settings/[machineId]  — per-machine settings (or null)
 * PATCH  /api/ai/settings/[machineId]  — upsert per-machine override
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import {
  getEffectiveSettings,
  getOrCreateMachineSettings,
  updateMachineSettings,
} from '@/lib/ai/store';

export const dynamic = 'force-dynamic';

async function requireMachine(machineId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = await safeQuery(
    () =>
      db.user.findUnique({
        where: { id: (session.user as any).id },
        select: { organizationId: true, role: true },
      }),
    null,
  );
  if (!user?.organizationId) return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };

  const machine = await safeQuery(
    () =>
      db.machine.findFirst({
        where: { id: machineId, organizationId: user.organizationId! },
        select: { id: true, name: true, organizationId: true },
      }),
    null,
  );
  if (!machine) return { error: NextResponse.json({ error: 'Machine not found' }, { status: 404 }) };
  return { user, machine };
}

export async function GET(_req: NextRequest, { params }: { params: { machineId: string } }) {
  const r = await requireMachine(params.machineId);
  if ('error' in r) return r.error;

  const machineSettings = await safeQuery(
    () => db.machineAISettings.findUnique({ where: { machineId: params.machineId } }),
    null,
  );
  const effective = await getEffectiveSettings(r.machine!.organizationId, r.machine!.id);

  return NextResponse.json({ settings: machineSettings, effective });
}

const ALLOWED_MODELS = ['STATISTICAL', 'HYBRID', 'LLM_ASSISTED'] as const;
const ALLOWED_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export async function PATCH(req: NextRequest, { params }: { params: { machineId: string } }) {
  const r = await requireMachine(params.machineId);
  if ('error' in r) return r.error;
  const role = (r.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'TECHNICIAN') {
    return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  await getOrCreateMachineSettings(params.machineId);

  const patch: any = {};
  if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
  if (body.model === null || (typeof body.model === 'string' && (ALLOWED_MODELS as readonly string[]).includes(body.model))) {
    patch.model = body.model;
  }
  if (body.sensitivity === null || typeof body.sensitivity === 'number') {
    patch.sensitivity = body.sensitivity === null ? null : Math.max(0, Math.min(100, Math.round(body.sensitivity)));
  }
  if (body.minAlertSeverity === null || (typeof body.minAlertSeverity === 'string' && (ALLOWED_SEVERITIES as readonly string[]).includes(body.minAlertSeverity))) {
    patch.minAlertSeverity = body.minAlertSeverity;
  }
  if (body.forecastHorizonDays === null || typeof body.forecastHorizonDays === 'number') {
    patch.forecastHorizonDays = body.forecastHorizonDays === null ? null : Math.max(1, Math.min(365, Math.round(body.forecastHorizonDays)));
  }
  if (body.thresholds === null || (body.thresholds && typeof body.thresholds === 'object')) {
    patch.thresholds = body.thresholds;
  }
  if (body.notes === null || typeof body.notes === 'string') {
    patch.notes = body.notes || null;
  }

  const updated = await updateMachineSettings(params.machineId, patch);
  const effective = await getEffectiveSettings(r.machine!.organizationId, r.machine!.id);
  return NextResponse.json({ settings: updated, effective });
}
