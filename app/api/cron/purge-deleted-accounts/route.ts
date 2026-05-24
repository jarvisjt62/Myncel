import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/purge-deleted-accounts
 *
 * Hard-deletes any user accounts that have been in the deletion grace
 * period for more than 14 days. Required to satisfy Apple's
 * Guideline 5.1.1(v) that deletion is permanent (not just temporary
 * deactivation).
 *
 * Schedule: daily at 03:00 UTC (vercel.json crons entry).
 *
 * Auth: same pattern as the other cron jobs — Bearer CRON_SECRET,
 * vercel-cron user-agent, or ?token=<CRON_SECRET>.
 *
 * Behavior:
 *   - Find users where deletionRequestedAt < now() - 14d.
 *   - For each user, prisma.user.delete() — Prisma cascades through
 *     onDelete: Cascade relations (sessions, accounts, push tokens,
 *     password resets, etc.). Other relations (work orders authored,
 *     audit logs) keep historical records but lose the FK pointer
 *     (their fields go null) — this preserves the org's history
 *     without retaining the user's PII.
 *   - Returns a summary of how many users were purged.
 */

const GRACE_DAYS = 14;

export async function GET(req: NextRequest) {
  // ---- Auth (matches /api/cron/notifications) -----------------
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

  // ---- Find expired pending deletions --------------------------
  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000);

  const expired = await prisma.user.findMany({
    where: {
      deletionRequestedAt: { lt: cutoff, not: null },
    },
    select: { id: true, email: true, deletionRequestedAt: true },
  });

  // ---- Purge ---------------------------------------------------
  const purged: { id: string; email: string }[] = [];
  const failed: { id: string; email: string; error: string }[] = [];

  for (const u of expired) {
    try {
      // Best-effort: null FKs that may not yet have been migrated to
      // ON DELETE SET NULL. Without this the prisma.user.delete()
      // call below throws on users who authored a WorkOrder or
      // created a RemoteSupportSession, leaving them stuck in the
      // pending-deletion state past their grace window.
      await prisma.workOrder.updateMany({
        where: { assignedToId: u.id },
        data: { assignedToId: null },
      }).catch(() => {});
      await prisma.workOrder.updateMany({
        where: { createdById: u.id },
        data: { createdById: null },
      }).catch(() => {});
      await prisma.remoteSupportSession.updateMany({
        where: { createdById: u.id },
        data: { createdById: null },
      }).catch(() => {});

      await prisma.user.delete({ where: { id: u.id } });
      purged.push({ id: u.id, email: u.email });
    } catch (err: any) {
      // Most likely cause: a relation without onDelete: Cascade still
      // references this user. Surface the failure so we can fix the
      // schema or null the FK manually; do NOT silently leave the
      // pending row in place because that would extend the grace
      // period indefinitely.
      failed.push({
        id: u.id,
        email: u.email,
        error: err?.message || 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    ok: true,
    cutoff: cutoff.toISOString(),
    found: expired.length,
    purged: purged.length,
    failed: failed.length,
    failures: failed,
  });
}
