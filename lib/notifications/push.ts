/**
 * lib/notifications/push.ts
 *
 * Server-side fan-out of push notifications to a user's registered devices.
 * Currently supports two delivery backends, picked automatically per token:
 *
 *   - Expo Push API     → tokens that look like  ExponentPushToken[xxx]
 *                         (legacy mobile shell built with Expo)
 *   - FCM HTTP v1       → all other tokens, treated as raw FCM device tokens
 *                         (used by Capacitor on Android and iOS via APNs proxy)
 *
 * To enable FCM v1 in production set:
 *   FCM_PROJECT_ID
 *   FCM_CLIENT_EMAIL
 *   FCM_PRIVATE_KEY     (newlines as \n)
 *
 * In development without those env vars, FCM dispatches no-op (logs only),
 * so calling sendPushToUser() is always safe.
 */

import { db } from '@/lib/db';
import { logPushAttempt, tokenSuffix } from './push-log';

export interface PushPayload {
  title: string;
  body: string;
  /** Deep-link path inside the app, e.g. /dashboard?tab=alerts&id=123 */
  link?: string;
  /** Logical category — passed through as data so the client can route. */
  kind?: string;
  /** Arbitrary extra data delivered to the client. */
  data?: Record<string, string>;
}

const EXPO_RE = /^ExponentPushToken\[/;

export async function sendPushToUser(userId: string, p: PushPayload): Promise<void> {
  if (!userId) return;
  const tokens = await db.mobilePushToken
    .findMany({ where: { userId }, select: { token: true, platform: true } })
    .catch(() => []);
  if (!tokens.length) return;

  const expoTokens: string[] = [];
  const fcmTokens: { token: string; platform: 'ios' | 'android' }[] = [];
  for (const t of tokens) {
    if (EXPO_RE.test(t.token)) expoTokens.push(t.token);
    else fcmTokens.push({ token: t.token, platform: (t.platform as 'ios' | 'android') });
  }

  await Promise.allSettled([
    expoTokens.length ? sendViaExpo(expoTokens, p, userId) : Promise.resolve(),
    fcmTokens.length  ? sendViaFcm(fcmTokens, p, userId)   : Promise.resolve(),
  ]);
}

export async function sendPushToUsers(userIds: string[], p: PushPayload): Promise<void> {
  await Promise.allSettled(userIds.map(id => sendPushToUser(id, p)));
}

/* ─────────────────────────── Expo ─────────────────────────── */

async function sendViaExpo(tokens: string[], p: PushPayload, userId?: string): Promise<void> {
  try {
    const messages = tokens.map(to => ({
      to,
      sound: 'default',
      title: p.title,
      body: p.body,
      data: { link: p.link, kind: p.kind, ...(p.data ?? {}) },
      priority: 'high',
      channelId: 'myncel-default',
    }));
    const r = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify(messages),
    }).catch(e => { console.warn('[push/expo] dispatch failed', e); return null; });
    const ok = !!(r && r.ok);
    await Promise.allSettled(tokens.map(t => logPushAttempt({
      channel: 'expo',
      outcome: ok ? 'sent' : 'error',
      tokenSuffix: tokenSuffix(t),
      userId: userId ?? null,
      title: p.title,
      body: p.body,
      kind: p.kind ?? null,
      status: r?.status ?? null,
    })));
  } catch (e) {
    console.warn('[push/expo] error', e);
  }
}

/* ─────────────────────────── FCM v1 ───────────────────────── */

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getFcmAccessToken(): Promise<string | null> {
  const projectId   = process.env.FCM_PROJECT_ID;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey  = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) return cachedAccessToken.token;

  // Sign a JWT for Google service-account exchange.
  const jwt = await import('jsonwebtoken');
  const assertion = jwt.sign(
    {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    privateKey,
    { algorithm: 'RS256' }
  );

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!resp.ok) {
    console.warn('[push/fcm] token exchange failed', resp.status, await resp.text().catch(() => ''));
    return null;
  }
  const data = await resp.json();
  cachedAccessToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) };
  return cachedAccessToken.token;
}

async function sendViaFcm(targets: { token: string; platform: 'ios' | 'android' }[], p: PushPayload, userId?: string): Promise<void> {
  const projectId = process.env.FCM_PROJECT_ID;
  const accessToken = await getFcmAccessToken();
  if (!projectId || !accessToken) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[push/fcm] skipping — FCM env vars not configured. Payload:', p.title);
    }
    await Promise.allSettled(targets.map(t => logPushAttempt({
      channel: 'fcm',
      outcome: 'skipped_no_config',
      tokenSuffix: tokenSuffix(t.token),
      platform: t.platform,
      userId: userId ?? null,
      title: p.title,
      body: p.body,
      kind: p.kind ?? null,
      errorText: 'FCM_PROJECT_ID or service account env vars missing',
    })));
    return;
  }

  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const dataStr: Record<string, string> = {
    ...(p.kind ? { kind: p.kind } : {}),
    ...(p.link ? { link: p.link } : {}),
    ...Object.fromEntries(Object.entries(p.data ?? {}).map(([k, v]) => [k, String(v)])),
  };

  await Promise.allSettled(targets.map(async ({ token, platform }) => {
    const message: any = {
      token,
      notification: { title: p.title, body: p.body },
      data: dataStr,
      android: {
        notification: {
          channel_id: 'myncel-default',
          icon: 'ic_stat_myncel',
          color: '#635bff',
          default_sound: true,
          default_vibrate_timings: true,
        },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1, 'mutable-content': 1 },
        },
      },
    };
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        // 404 / NOT_FOUND / UNREGISTERED → token is dead; clean it up.
        if (r.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/i.test(text)) {
          await db.mobilePushToken.deleteMany({ where: { token } }).catch(() => {});
          await logPushAttempt({
            channel: 'fcm', outcome: 'token_dead',
            tokenSuffix: tokenSuffix(token), platform, userId: userId ?? null,
            title: p.title, body: p.body, kind: p.kind ?? null,
            status: r.status, errorText: text,
          });
        } else {
          console.warn('[push/fcm] send error', r.status, text);
          await logPushAttempt({
            channel: 'fcm', outcome: 'error',
            tokenSuffix: tokenSuffix(token), platform, userId: userId ?? null,
            title: p.title, body: p.body, kind: p.kind ?? null,
            status: r.status, errorText: text,
          });
        }
      } else {
        await logPushAttempt({
          channel: 'fcm', outcome: 'sent',
          tokenSuffix: tokenSuffix(token), platform, userId: userId ?? null,
          title: p.title, body: p.body, kind: p.kind ?? null,
          status: r.status,
        });
      }
    } catch (e: any) {
      console.warn('[push/fcm] network error', e);
      await logPushAttempt({
        channel: 'fcm', outcome: 'error',
        tokenSuffix: tokenSuffix(token), platform, userId: userId ?? null,
        title: p.title, body: p.body, kind: p.kind ?? null,
        errorText: String(e?.message ?? e).slice(0, 200),
      });
    }
  }));
}
