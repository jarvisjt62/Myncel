/**
 * GET    /api/ai/settings           — current org's AI defaults (or fallback)
 * PATCH  /api/ai/settings           — update org defaults (OWNER/ADMIN only)
 *
 * The org settings row is auto-created on first read so the UI always
 * has something to render.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { getOrCreateOrgSettings, updateOrgSettings } from '@/lib/ai/store';

export const dynamic = 'force-dynamic';

async function requireOrg() {
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
  if (!user?.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  return { user };
}

export async function GET() {
  const r = await requireOrg();
  if ('error' in r) return r.error;
  const settings = await getOrCreateOrgSettings(r.user!.organizationId!);
  return NextResponse.json({ settings });
}

const ALLOWED_MODELS = ['STATISTICAL', 'HYBRID', 'LLM_ASSISTED'] as const;
const ALLOWED_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export async function PATCH(req: NextRequest) {
  const r = await requireOrg();
  if ('error' in r) return r.error;
  const role = (r.user as any).role;
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Owner or Admin required' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch: any = {};
  if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
  if (typeof body.model === 'string' && (ALLOWED_MODELS as readonly string[]).includes(body.model)) {
    patch.model = body.model;
  }
  if (typeof body.sensitivity === 'number') {
    patch.sensitivity = Math.max(0, Math.min(100, Math.round(body.sensitivity)));
  }
  if (typeof body.minAlertSeverity === 'string' && (ALLOWED_SEVERITIES as readonly string[]).includes(body.minAlertSeverity)) {
    patch.minAlertSeverity = body.minAlertSeverity;
  }
  if (typeof body.forecastHorizonDays === 'number') {
    patch.forecastHorizonDays = Math.max(1, Math.min(365, Math.round(body.forecastHorizonDays)));
  }
  if (typeof body.autoCreateWorkOrders === 'boolean') patch.autoCreateWorkOrders = body.autoCreateWorkOrders;
  if (body.quietHoursStart === null || (typeof body.quietHoursStart === 'number' && body.quietHoursStart >= 0 && body.quietHoursStart <= 23)) {
    patch.quietHoursStart = body.quietHoursStart;
  }
  if (body.quietHoursEnd === null || (typeof body.quietHoursEnd === 'number' && body.quietHoursEnd >= 0 && body.quietHoursEnd <= 23)) {
    patch.quietHoursEnd = body.quietHoursEnd;
  }
  if (body.alertChannelOverride === null || typeof body.alertChannelOverride === 'string') {
    patch.alertChannelOverride = body.alertChannelOverride || null;
  }
  if (body.customInstructions === null || typeof body.customInstructions === 'string') {
    patch.customInstructions = body.customInstructions || null;
  }

  const updated = await updateOrgSettings(r.user!.organizationId!, patch);
  return NextResponse.json({ settings: updated });
}
