import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

/**
 * GET /api/admin/push-debug
 *
 * Returns observability data for the push notification pipeline:
 *   - device tokens registered (counts + recent rows)
 *   - recent push attempts (from AuditLog action='PUSH_ATTEMPT')
 *   - recent emergency broadcasts (action='EMERGENCY_BROADCAST')
 *   - recent cron sweeps (action='NOTIFICATIONS_CRON_RUN' if logged, else falls
 *     back to counting Notifications created in last hour)
 *   - environment configuration sanity check (does FCM look set up?)
 *
 * Auth: super-admin only (admin@myncel.com).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalTokens,
    iosTokens,
    androidTokens,
    recentTokens,
    recentAttempts,
    recentEmergencies,
    recentCronRuns,
    notificationsLastHour,
    notificationsLastDay,
  ] = await Promise.all([
    safeQuery(db.mobilePushToken.count(), 0),
    safeQuery(db.mobilePushToken.count({ where: { platform: 'ios' } }), 0),
    safeQuery(db.mobilePushToken.count({ where: { platform: 'android' } }), 0),
    safeQuery(
      db.mobilePushToken.findMany({
        orderBy: { lastUsedAt: 'desc' },
        take: 25,
        select: {
          id: true, platform: true, deviceName: true, appVersion: true,
          createdAt: true, lastUsedAt: true,
          user: { select: { email: true, name: true, organizationId: true } },
          token: true,
        },
      }),
      []
    ),
    safeQuery(
      db.auditLog.findMany({
        where: { action: 'PUSH_ATTEMPT' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, action: true, entity: true, entityId: true,
          userId: true, organizationId: true, changes: true, createdAt: true,
        },
      }),
      []
    ),
    safeQuery(
      db.auditLog.findMany({
        where: { action: 'EMERGENCY_BROADCAST' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, userId: true, organizationId: true, changes: true, createdAt: true,
          user: { select: { email: true, name: true } },
          organization: { select: { name: true } },
        },
      }),
      []
    ),
    safeQuery(
      db.auditLog.findMany({
        where: { action: 'NOTIFICATIONS_CRON_RUN' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, changes: true, createdAt: true },
      }),
      []
    ),
    safeQuery(
      db.notification.count({ where: { createdAt: { gte: oneHourAgo } } }),
      0
    ),
    safeQuery(
      db.notification.count({ where: { createdAt: { gte: oneDayAgo } } }),
      0
    ),
  ]);

  // Sanity checks on env vars (don't leak values, just say configured/not)
  const config = {
    FCM_PROJECT_ID: !!process.env.FCM_PROJECT_ID,
    FCM_CLIENT_EMAIL: !!process.env.FCM_CLIENT_EMAIL,
    FCM_PRIVATE_KEY: !!process.env.FCM_PRIVATE_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
  };
  const fcmReady = config.FCM_PROJECT_ID && config.FCM_CLIENT_EMAIL && config.FCM_PRIVATE_KEY;

  // Mask tokens — only show last 8 chars to admin
  const tokens = (recentTokens as any[]).map(t => ({
    ...t,
    tokenSuffix: t.token ? `…${t.token.slice(-8)}` : null,
    token: undefined,
  }));

  return NextResponse.json({
    now: now.toISOString(),
    counts: {
      totalTokens,
      iosTokens,
      androidTokens,
      notificationsLastHour,
      notificationsLastDay,
    },
    config,
    fcmReady,
    tokens,
    recentAttempts,
    recentEmergencies,
    recentCronRuns,
  });
}
