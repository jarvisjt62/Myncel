/**
 * lib/notifications/push-filter.ts
 *
 * Helpers that decide whether a push notification should actually be delivered
 * given the org's NotificationSetting row. Used by both the existing event
 * dispatcher (lib/notifications/dispatch.ts) and the new cron sweep
 * (/api/cron/notifications) and the admin emergency endpoint
 * (/api/admin/emergency).
 *
 *   - shouldSendPushForKind(kind, settings)  → channel toggle check
 *   - isInQuietHours(settings, now?)         → time-window check
 *   - filterPushDelivery(kind, settings)     → combined { allow, reason }
 *
 * Quiet hours NEVER apply to EMERGENCY pushes — those always go through.
 */

import type { NotificationSetting } from '@prisma/client';

export type PushKind =
  | 'work_order.created'
  | 'work_order.completed'
  | 'work_order.assigned'
  | 'work_order.overdue'
  | 'alert.triggered'
  | 'pm.overdue'
  | 'pm.due'
  | 'schedule.task_assigned'
  | 'schedule.task_reminder'
  | 'equipment.added'
  | 'parts.low'
  | 'parts.out'
  | 'remote_support.scheduled'
  | 'remote_support.reminder'
  | 'emergency';

export interface PushFilterDecision {
  allow: boolean;
  reason: string;
}

/**
 * Channel-toggle check. Returns true if the user has opted in to receive this
 * KIND of push at all (independent of quiet hours).
 *
 * If `settings` is null we default to "allow" — opt-out is explicit.
 */
export function shouldSendPushForKind(
  kind: PushKind | string,
  settings: NotificationSetting | null | undefined
): boolean {
  if (!settings) return true;
  if (settings.pushEnabled === false) return false;

  switch (kind) {
    case 'emergency':
      return settings.pushEmergency !== false;

    case 'work_order.created':
    case 'work_order.completed':
    case 'work_order.assigned':
    case 'work_order.overdue':
      return settings.pushWorkOrders !== false;

    case 'alert.triggered':
      return settings.pushAlerts !== false;

    case 'pm.overdue':
    case 'pm.due':
    case 'schedule.task_assigned':
    case 'schedule.task_reminder':
      return settings.pushMaintenance !== false;

    case 'parts.low':
    case 'parts.out':
      return settings.pushParts !== false;

    case 'remote_support.scheduled':
    case 'remote_support.reminder':
      return settings.pushRemoteSupport !== false;

    case 'equipment.added':
      return settings.pushAlerts !== false;

    default:
      // Unknown kinds (e.g. system-announcement, mention) fall through to
      // the master pushEnabled toggle, which we already checked above.
      return true;
  }
}

/**
 * Returns true if "now" falls inside the org's configured quiet-hours window.
 * Window can wrap midnight (e.g. 22:00 → 07:00).
 *
 * Times are interpreted in `settings.quietHoursTimezone` (IANA), defaulting
 * to America/New_York if missing.
 */
export function isInQuietHours(
  settings: NotificationSetting | null | undefined,
  now: Date = new Date()
): boolean {
  if (!settings) return false;
  if (!settings.quietHoursEnabled) return false;
  if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;

  const tz = settings.quietHoursTimezone || 'America/New_York';

  // Get HH:MM in the configured timezone using Intl.
  let hhmm: string;
  try {
    hhmm = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);
  } catch {
    // Bad timezone string — treat as not in quiet hours, never block.
    return false;
  }
  // Intl can yield "24:05" at midnight on some runtimes — normalize.
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10) % 24;
  const m = parseInt(mStr, 10);
  const nowMin = h * 60 + m;

  const startMin = parseHHMM(settings.quietHoursStart);
  const endMin = parseHHMM(settings.quietHoursEnd);
  if (startMin == null || endMin == null) return false;

  if (startMin === endMin) return false; // zero-length window

  if (startMin < endMin) {
    // Same-day window, e.g. 13:00 → 14:00
    return nowMin >= startMin && nowMin < endMin;
  } else {
    // Wraps midnight, e.g. 22:00 → 07:00
    return nowMin >= startMin || nowMin < endMin;
  }
}

function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Combined check. EMERGENCY always bypasses quiet hours and channel toggles
 * (except the master `pushEnabled` switch).
 */
export function filterPushDelivery(
  kind: PushKind | string,
  settings: NotificationSetting | null | undefined,
  now: Date = new Date()
): PushFilterDecision {
  if (kind === 'emergency') {
    if (settings && settings.pushEnabled === false) {
      return { allow: false, reason: 'master push disabled' };
    }
    return { allow: true, reason: 'emergency bypasses quiet hours' };
  }

  if (!shouldSendPushForKind(kind, settings)) {
    return { allow: false, reason: `channel toggle off for kind="${kind}"` };
  }

  if (isInQuietHours(settings, now)) {
    return { allow: false, reason: 'in quiet hours' };
  }

  return { allow: true, reason: 'ok' };
}
