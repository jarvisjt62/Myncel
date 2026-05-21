import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import { sendPushToUsers } from '@/lib/notifications/push';
import { filterPushDelivery } from '@/lib/notifications/push-filter';

/**
 * GET /api/cron/notifications
 *
 * Scheduled sweep that runs every 15 minutes (vercel.json) to fire
 * time-based notifications that no synchronous event would otherwise produce:
 *
 *   1. Overdue work orders          (WorkOrder.dueAt < now AND not completed/cancelled,
 *                                    not yet flagged in last 24h)
 *   2. Maintenance tasks coming due  (MaintenanceTask.nextDueAt within next 24h)
 *   3. Maintenance tasks overdue     (MaintenanceTask.nextDueAt < now)
 *   4. Low / out of stock parts      (Part.quantity <= minQuantity)
 *   5. Upcoming remote support       (RemoteSupportSession.startedAt within next hour
 *                                    AND status=SCHEDULED — reminder push)
 *
 * For each finding the sweep:
 *   - Creates an in-app Notification row for every relevant org user
 *   - Sends a push (gated through filterPushDelivery → respects org's
 *     channel toggles and quiet hours)
 *
 * Dedupe: We don't want to fire the same overdue alert every 15 minutes
 * forever, so we look back 24h in the Notification table for an identical
 * (userId, type, relatedId) row and skip if one already exists.
 *
 * Security: Same auth pattern as /api/cron/slack-digest — Bearer CRON_SECRET
 * or vercel-cron user agent or ?token=<secret>.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const APP_URL = process.env.NEXTAUTH_URL || 'https://myncel.com';
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

interface SweepCounts {
  overdueWorkOrders: number;
  maintenanceDue: number;
  maintenanceOverdue: number;
  lowParts: number;
  outParts: number;
  remoteSupportReminders: number;
  notificationsCreated: number;
  pushesSent: number;
  pushesSkipped: number;
}

export async function GET(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────
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
  const counts: SweepCounts = {
    overdueWorkOrders: 0,
    maintenanceDue: 0,
    maintenanceOverdue: 0,
    lowParts: 0,
    outParts: 0,
    remoteSupportReminders: 0,
    notificationsCreated: 0,
    pushesSent: 0,
    pushesSkipped: 0,
  };

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const dedupeAfter = new Date(now.getTime() - DEDUPE_WINDOW_MS);

  // ── 1. OVERDUE WORK ORDERS ─────────────────────────────────────────────
  const overdueWOs = await safeQuery(
    db.workOrder.findMany({
      where: {
        dueAt: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      select: {
        id: true,
        woNumber: true,
        title: true,
        organizationId: true,
        assignedToId: true,
        dueAt: true,
        machine: { select: { name: true } },
      },
    }),
    [] as any[]
  );
  counts.overdueWorkOrders = overdueWOs.length;

  for (const wo of overdueWOs) {
    const daysOverdue = wo.dueAt
      ? Math.floor((now.getTime() - new Date(wo.dueAt).getTime()) / (24 * 60 * 60 * 1000))
      : 0;
    const title = `Overdue: ${wo.woNumber}`;
    const message = `${wo.title}${wo.machine?.name ? ` · ${wo.machine.name}` : ''} — ${daysOverdue} day(s) overdue`;
    const link = `${APP_URL}/dashboard?tab=work-orders`;

    // Recipients: assignee + all org admins/managers
    const recipients = await getNotificationRecipients(wo.organizationId, wo.assignedToId);
    await fanOut({
      recipients,
      organizationId: wo.organizationId,
      type: 'WORK_ORDER_OVERDUE',
      kind: 'work_order.overdue',
      priority: 'HIGH',
      title,
      message,
      link,
      relatedType: 'work_order',
      relatedId: wo.id,
      dedupeAfter,
      counts,
    });
  }

  // ── 2. MAINTENANCE DUE (within next 24h) ───────────────────────────────
  const dueTasks = await safeQuery(
    db.maintenanceTask.findMany({
      where: {
        isActive: true,
        nextDueAt: { gt: now, lte: in24h },
      },
      select: {
        id: true,
        title: true,
        organizationId: true,
        nextDueAt: true,
        machine: { select: { name: true } },
      },
    }),
    [] as any[]
  );
  counts.maintenanceDue = dueTasks.length;

  for (const task of dueTasks) {
    const recipients = await getNotificationRecipients(task.organizationId, null);
    await fanOut({
      recipients,
      organizationId: task.organizationId,
      type: 'MAINTENANCE_DUE',
      kind: 'pm.due',
      priority: 'NORMAL',
      title: `Maintenance due soon: ${task.title}`,
      message: `${task.machine?.name || 'Equipment'} — due ${task.nextDueAt ? new Date(task.nextDueAt).toLocaleString() : 'soon'}`,
      link: `${APP_URL}/dashboard#schedules`,
      relatedType: 'maintenance_task',
      relatedId: task.id,
      dedupeAfter,
      counts,
    });
  }

  // ── 3. MAINTENANCE OVERDUE ─────────────────────────────────────────────
  const overdueTasks = await safeQuery(
    db.maintenanceTask.findMany({
      where: {
        isActive: true,
        nextDueAt: { lt: now },
      },
      select: {
        id: true,
        title: true,
        organizationId: true,
        nextDueAt: true,
        machine: { select: { name: true } },
      },
    }),
    [] as any[]
  );
  counts.maintenanceOverdue = overdueTasks.length;

  for (const task of overdueTasks) {
    const daysOverdue = task.nextDueAt
      ? Math.floor((now.getTime() - new Date(task.nextDueAt).getTime()) / (24 * 60 * 60 * 1000))
      : 0;
    const recipients = await getNotificationRecipients(task.organizationId, null);
    await fanOut({
      recipients,
      organizationId: task.organizationId,
      type: 'MAINTENANCE_OVERDUE',
      kind: 'pm.overdue',
      priority: 'HIGH',
      title: `Overdue: ${task.title}`,
      message: `${task.machine?.name || 'Equipment'} · ${daysOverdue} day(s) overdue`,
      link: `${APP_URL}/dashboard#schedules`,
      relatedType: 'maintenance_task',
      relatedId: task.id,
      dedupeAfter,
      counts,
    });
  }

  // ── 4. LOW / OUT OF STOCK PARTS ────────────────────────────────────────
  const lowParts = await safeQuery(
    db.$queryRawUnsafe<any[]>(
      `SELECT id, name, "partNumber", quantity, "minQuantity", "organizationId"
         FROM parts
        WHERE quantity <= "minQuantity"`
    ),
    [] as any[]
  );

  for (const part of lowParts) {
    const isOut = (part.quantity ?? 0) <= 0;
    if (isOut) counts.outParts++;
    else counts.lowParts++;

    const recipients = await getNotificationRecipients(part.organizationId, null);
    await fanOut({
      recipients,
      organizationId: part.organizationId,
      type: 'PARTS_LOW',
      kind: isOut ? 'parts.out' : 'parts.low',
      priority: isOut ? 'HIGH' : 'NORMAL',
      title: isOut
        ? `Out of stock: ${part.name}`
        : `Low stock: ${part.name}`,
      message: `${part.partNumber ? `[${part.partNumber}] ` : ''}${part.quantity} on hand (reorder at ${part.minQuantity})`,
      link: `${APP_URL}/dashboard?tab=parts`,
      relatedType: 'part',
      relatedId: part.id,
      dedupeAfter,
      counts,
    });
  }

  // ── 5. REMOTE SUPPORT REMINDERS (starting within next hour) ────────────
  const upcomingSessions = await safeQuery(
    db.remoteSupportSession.findMany({
      where: {
        status: 'SCHEDULED',
        startedAt: { gt: now, lte: in1h },
      },
      select: {
        id: true,
        title: true,
        organizationId: true,
        startedAt: true,
        participants: { select: { userId: true } },
      },
    }),
    [] as any[]
  );
  counts.remoteSupportReminders = upcomingSessions.length;

  for (const session of upcomingSessions) {
    const participantIds = session.participants
      .map((p: any) => p.userId)
      .filter((id: string | null): id is string => !!id);
    // Recipients: explicit participants + org admins
    const orgRecipients = await getNotificationRecipients(session.organizationId, null);
    const allIds = Array.from(new Set([...participantIds, ...orgRecipients.userIds]));

    await fanOut({
      recipients: { userIds: allIds, settings: orgRecipients.settings },
      organizationId: session.organizationId,
      type: 'REMOTE_SUPPORT_SCHEDULED',
      kind: 'remote_support.reminder',
      priority: 'NORMAL',
      title: `Remote support starting soon: ${session.title}`,
      message: `Starts at ${session.startedAt ? new Date(session.startedAt).toLocaleTimeString() : 'soon'}`,
      link: `${APP_URL}/remote-support`,
      relatedType: 'remote_support_session',
      relatedId: session.id,
      dedupeAfter,
      counts,
    });
  }

  // Record this run in the AuditLog so /admin/push-debug can show recent
  // sweeps. Best-effort — don't fail the response if this errors.
  try {
    await db.auditLog.create({
      data: {
        action: 'NOTIFICATIONS_CRON_RUN',
        entity: 'CronJob',
        entityId: 'notifications',
        changes: {
          durationMs: Date.now() - startedAt,
          ranAt: now.toISOString(),
          counts,
        } as any,
      },
    });
  } catch { /* swallow */ }

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    ranAt: now.toISOString(),
    counts,
  });
}

/* ───────────────────────── helpers ─────────────────────────────────────── */

interface Recipients {
  userIds: string[];
  settings: any | null;
}

/**
 * Returns the set of users in `organizationId` who should receive a notification,
 * plus the org's NotificationSetting row.
 *
 * If `assigneeId` is provided, the assignee is always included. Otherwise we
 * default to admins+managers of the org. We deliberately keep this list small
 * — broadcasting to every employee on every overdue WO is noisy.
 */
async function getNotificationRecipients(
  organizationId: string,
  assigneeId: string | null
): Promise<Recipients> {
  const [setting, users] = await Promise.all([
    safeQuery(
      db.notificationSetting.findFirst({ where: { organizationId } }),
      null
    ),
    safeQuery(
      db.user.findMany({
        where: {
          organizationId,
          OR: [
            assigneeId ? { id: assigneeId } : undefined,
            { role: { in: ['OWNER', 'ADMIN'] as any } },
          ].filter(Boolean) as any,
        },
        select: { id: true },
      }),
      [] as { id: string }[]
    ),
  ]);

  const ids = Array.from(new Set(users.map(u => u.id)));
  return { userIds: ids, settings: setting };
}

interface FanOutArgs {
  recipients: Recipients;
  organizationId: string;
  type:
    | 'WORK_ORDER_OVERDUE'
    | 'MAINTENANCE_DUE'
    | 'MAINTENANCE_OVERDUE'
    | 'PARTS_LOW'
    | 'REMOTE_SUPPORT_SCHEDULED';
  kind: string; // for filterPushDelivery
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  title: string;
  message: string;
  link: string;
  relatedType: string;
  relatedId: string;
  dedupeAfter: Date;
  counts: SweepCounts;
}

async function fanOut(args: FanOutArgs): Promise<void> {
  const { recipients, type, priority, title, message, link, relatedType, relatedId, dedupeAfter, counts, kind, settings: _ } = args as any;
  if (!recipients.userIds.length) return;

  // Dedupe: skip users who already got this exact notification in the last 24h
  const recent = await safeQuery(
    db.notification.findMany({
      where: {
        userId: { in: recipients.userIds },
        type: type as any,
        relatedId,
        createdAt: { gt: dedupeAfter },
      },
      select: { userId: true },
    }),
    [] as { userId: string }[]
  );
  const skip = new Set(recent.map(r => r.userId));
  const fresh = recipients.userIds.filter((id: string) => !skip.has(id));
  if (!fresh.length) return;

  // Create in-app rows
  try {
    await db.notification.createMany({
      data: fresh.map((userId: string) => ({
        userId,
        type: type as any,
        title,
        message,
        priority: priority as any,
        link,
        relatedType,
        relatedId,
      })),
      skipDuplicates: true,
    });
    counts.notificationsCreated += fresh.length;
  } catch (err) {
    console.error('[cron/notifications] createMany failed:', err);
  }

  // Push fan-out, gated by filterPushDelivery
  const decision = filterPushDelivery(kind, recipients.settings);
  if (!decision.allow) {
    counts.pushesSkipped += fresh.length;
    return;
  }

  try {
    await sendPushToUsers(fresh, { title, body: message, link, kind });
    counts.pushesSent += fresh.length;
  } catch (err) {
    console.error('[cron/notifications] push failed:', err);
  }
}
