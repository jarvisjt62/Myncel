/**
 * lib/notifications/push-log.ts
 *
 * Lightweight helper to record push attempts as AuditLog rows so the
 * /admin/push-debug observability page can show recent activity, errors,
 * and token cleanup events without us having to add a new table.
 *
 * We pack everything into AuditLog.changes (JSON) so the schema stays put.
 */

import { db } from '@/lib/db';

export type PushChannel = 'expo' | 'fcm';
export type PushOutcome = 'sent' | 'error' | 'token_dead' | 'skipped_no_config';

export interface PushAttemptLog {
  channel: PushChannel;
  outcome: PushOutcome;
  /** APNs/FCM token (we store last 8 chars only — full token is sensitive) */
  tokenSuffix?: string | null;
  platform?: 'ios' | 'android' | null;
  userId?: string | null;
  organizationId?: string | null;
  title?: string | null;
  body?: string | null;
  kind?: string | null;
  /** HTTP status from FCM/Expo response */
  status?: number | null;
  /** First ~200 chars of response body if it failed */
  errorText?: string | null;
}

/**
 * Persist a single push attempt as AuditLog(action='PUSH_ATTEMPT').
 *
 * Best-effort — never throws. We never want a logging failure to block a
 * real notification from going out.
 */
export async function logPushAttempt(entry: PushAttemptLog): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: 'PUSH_ATTEMPT',
        entity: 'MobilePushToken',
        entityId: entry.tokenSuffix ?? null,
        userId: entry.userId ?? null,
        organizationId: entry.organizationId ?? null,
        changes: {
          channel: entry.channel,
          outcome: entry.outcome,
          platform: entry.platform ?? null,
          title: entry.title ? entry.title.slice(0, 120) : null,
          body: entry.body ? entry.body.slice(0, 200) : null,
          kind: entry.kind ?? null,
          status: entry.status ?? null,
          errorText: entry.errorText ? entry.errorText.slice(0, 240) : null,
        } as any,
      },
    });
  } catch {
    /* swallow — logging must not crash sends */
  }
}

/** Helper to safely take only the last 8 chars of a push token. */
export function tokenSuffix(token: string | null | undefined): string | null {
  if (!token) return null;
  return token.length <= 8 ? token : `…${token.slice(-8)}`;
}
