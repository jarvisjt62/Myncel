/**
 * GET /api/cron/saved-reports
 *
 * Vercel cron — fires every 15 minutes. Runs every active saved
 * report whose nextRunAt <= now(), emails the result to its
 * recipient list, and re-computes nextRunAt for the following slot.
 *
 * Auth: same model as the other crons — Bearer ${CRON_SECRET} or
 * ?token=<secret>, plus a User-Agent containing "vercel-cron".
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import { runAndEmailSavedReport } from '@/lib/reports/runner';
import { computeNextRun } from '@/lib/reports/schedule';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') || '';
  const userAgent = req.headers.get('user-agent') || '';
  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get('token') || '';

  const isVercelCron = userAgent.includes('vercel-cron');
  const hasValidBearer = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const hasValidToken = cronSecret && tokenParam === cronSecret;

  if (!isVercelCron && !hasValidBearer && !hasValidToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const now = new Date();

  const due = await safeQuery(
    () => db.savedReport.findMany({
      where: {
        isActive: true,
        schedule: { not: 'NEVER' },
        nextRunAt: { not: null, lte: now },
      },
      select: {
        id: true,
        name: true,
        schedule: true,
        hourLocal: true,
        timezone: true,
        organizationId: true,
      },
      take: 100, // safety cap per cron tick
    }),
    [],
  );

  const results: any[] = [];
  for (const r of due as any[]) {
    try {
      const out = await runAndEmailSavedReport(r.id);
      const nextRunAt = computeNextRun(r.schedule, r.hourLocal, r.timezone);
      await safeQuery(
        () => db.savedReport.update({
          where: { id: r.id },
          data: { nextRunAt },
        }),
        null,
      );
      results.push({
        id: r.id,
        name: r.name,
        success: out.success,
        rowCount: out.rowCount,
        emailedTo: out.emailedTo.length,
        nextRunAt: nextRunAt?.toISOString() || null,
        error: out.error,
      });
    } catch (err: any) {
      console.error('[cron/saved-reports] error', r.id, err);
      results.push({ id: r.id, name: r.name, success: false, error: err?.message || String(err) });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: due.length,
    fired: results.length,
    durationMs: Date.now() - startedAt,
    results,
  });
}
