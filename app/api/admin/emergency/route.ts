import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { sendPushToUsers } from '@/lib/notifications/push';
import { filterPushDelivery } from '@/lib/notifications/push-filter';

/**
 * POST /api/admin/emergency
 *
 * Admin-only EMERGENCY broadcast. Sends a high-priority push + creates an
 * in-app Notification row for every user in the caller's organization.
 *
 * EMERGENCY pushes BYPASS quiet hours (see filterPushDelivery). They still
 * respect the master `pushEnabled` toggle and the per-org `pushEmergency`
 * channel toggle (which defaults to true).
 *
 * Body:
 *   { title: string, message: string, link?: string }
 *
 * Auth:
 *   - Must be logged in
 *   - User.role must be OWNER or ADMIN
 *   - Targets that user's organization
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXTAUTH_URL || 'https://myncel.com';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const me = await safeQuery(
    db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, organizationId: true },
    }),
    null
  );
  if (!me || !me.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 });
  }
  if (me.role !== 'OWNER' && me.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || '').trim();
  const message = String(body?.message || '').trim();
  const link = body?.link ? String(body.link) : `${APP_URL}/dashboard`;

  if (!title || title.length > 120) {
    return NextResponse.json({ error: 'title required (max 120 chars)' }, { status: 400 });
  }
  if (!message || message.length > 500) {
    return NextResponse.json({ error: 'message required (max 500 chars)' }, { status: 400 });
  }

  // Recipients: everyone in the org
  const users = await safeQuery(
    db.user.findMany({
      where: { organizationId: me.organizationId },
      select: { id: true },
    }),
    [] as { id: string }[]
  );
  if (!users.length) {
    return NextResponse.json({ ok: true, recipientCount: 0 });
  }

  const userIds = users.map(u => u.id);
  const setting = await safeQuery(
    db.notificationSetting.findFirst({ where: { organizationId: me.organizationId } }),
    null
  );

  // 1. Persist in-app Notification for each user (URGENT priority)
  let createdCount = 0;
  try {
    const result = await db.notification.createMany({
      data: userIds.map(uid => ({
        userId: uid,
        type: 'EMERGENCY' as any,
        title,
        message,
        priority: 'URGENT' as any,
        link,
        relatedType: 'emergency_broadcast',
        relatedId: `${me.organizationId}:${Date.now()}`,
      })),
      skipDuplicates: true,
    });
    createdCount = result.count;
  } catch (err) {
    console.error('[admin/emergency] createMany failed:', err);
  }

  // 2. Push fan-out — EMERGENCY bypasses quiet hours by design
  let pushSent = 0;
  let pushSkipped = 0;
  const decision = filterPushDelivery('emergency', setting);
  if (decision.allow) {
    try {
      await sendPushToUsers(userIds, {
        title: `🚨 ${title}`,
        body: message,
        link,
        kind: 'emergency',
        data: { priority: 'urgent', emergency: 'true' },
      });
      pushSent = userIds.length;
    } catch (err) {
      console.error('[admin/emergency] push failed:', err);
    }
  } else {
    pushSkipped = userIds.length;
    console.log(`[admin/emergency] PUSH SKIPPED: ${decision.reason}`);
  }

  // 3. Audit log
  try {
    await db.auditLog.create({
      data: {
        action: 'EMERGENCY_BROADCAST',
        entity: 'Notification',
        entityId: me.organizationId,
        changes: {
          title,
          message,
          link,
          recipientCount: userIds.length,
          notificationsCreated: createdCount,
          pushesSent: pushSent,
          pushesSkipped: pushSkipped,
          pushSkipReason: decision.allow ? null : decision.reason,
        },
        userId: me.id,
        organizationId: me.organizationId,
      },
    });
  } catch (err) {
    console.error('[admin/emergency] audit failed:', err);
  }

  return NextResponse.json({
    ok: true,
    recipientCount: userIds.length,
    notificationsCreated: createdCount,
    pushesSent: pushSent,
    pushesSkipped: pushSkipped,
    pushSkipReason: decision.allow ? null : decision.reason,
  });
}
