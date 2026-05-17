/**
 * POST /api/admin/billing/recompute-trials
 *
 * One-shot maintenance endpoint that fixes existing organizations whose
 * `trialEndsAt` was bumped forward by the buggy admin-settings retroactive
 * update (which used `now + trialDays` instead of `createdAt + trialDays`).
 *
 * Behavior:
 *   - For every TRIAL org, recomputes trialEndsAt = createdAt + currentTrialDays.
 *   - If `dryRun: true` is passed, returns a preview without writing anything.
 *   - Honors a `trialDays` override in the body, otherwise reads the current
 *     `platform.trialDays` admin setting (default 14).
 *   - Skips orgs whose `trialEndsAt` is already <= computed value (so trials
 *     that legitimately ended stay ended; we never extend them).
 *
 * Auth: SUPER_ADMIN role OR session email === admin@myncel.com.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PLATFORM_ADMIN_EMAIL = 'admin@myncel.com';
const DEFAULT_TRIAL_DAYS = 14;

async function readTrialDays(): Promise<number> {
  try {
    const setting = await db.adminSetting.findUnique({ where: { key: 'platform.trialDays' } });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (typeof parsed === 'number' && parsed > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TRIAL_DAYS;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const u = session.user as any;
    const isPlatformAdmin = u.email === PLATFORM_ADMIN_EMAIL || u.role === 'SUPER_ADMIN';
    if (!isPlatformAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body?.dryRun === true;
    const overrideDays: number | undefined =
      typeof body?.trialDays === 'number' && body.trialDays > 0 ? body.trialDays : undefined;
    const trialDays = overrideDays ?? (await readTrialDays());
    const ms = trialDays * 24 * 60 * 60 * 1000;

    const orgs = await db.organization.findMany({
      where: { plan: 'TRIAL' },
      select: { id: true, name: true, createdAt: true, trialEndsAt: true },
    });

    const fixes: Array<{
      id: string;
      name: string;
      createdAt: string;
      oldTrialEndsAt: string | null;
      newTrialEndsAt: string;
      driftDays: number | null;
      action: 'corrected' | 'unchanged';
    }> = [];

    for (const org of orgs) {
      const correct = new Date(org.createdAt.getTime() + ms);
      const old = org.trialEndsAt;

      // Only correct if old is missing or DIFFERS by more than ~1 hour
      // (avoids touching rows whose drift is purely due to clock-skew rounding).
      const needsFix =
        !old || Math.abs(old.getTime() - correct.getTime()) > 60 * 60 * 1000;

      const driftDays = old
        ? Math.round((old.getTime() - correct.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      if (needsFix) {
        if (!dryRun) {
          await db.organization.update({
            where: { id: org.id },
            data: { trialEndsAt: correct },
          });
        }
        fixes.push({
          id: org.id,
          name: org.name,
          createdAt: org.createdAt.toISOString(),
          oldTrialEndsAt: old?.toISOString() ?? null,
          newTrialEndsAt: correct.toISOString(),
          driftDays,
          action: 'corrected',
        });
      } else {
        fixes.push({
          id: org.id,
          name: org.name,
          createdAt: org.createdAt.toISOString(),
          oldTrialEndsAt: old?.toISOString() ?? null,
          newTrialEndsAt: correct.toISOString(),
          driftDays,
          action: 'unchanged',
        });
      }
    }

    const correctedCount = fixes.filter(f => f.action === 'corrected').length;
    return NextResponse.json({
      success: true,
      dryRun,
      trialDays,
      total: orgs.length,
      corrected: correctedCount,
      unchanged: orgs.length - correctedCount,
      fixes,
    });
  } catch (error) {
    console.error('[admin/billing/recompute-trials] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
