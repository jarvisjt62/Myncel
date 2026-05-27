import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Force-refresh-all-clients endpoint.
 *
 * Bumps the `platform.appVersion` row in `admin_settings` to a new
 * timestamp-based value. Within ~60 s every connected client (web +
 * Capacitor mobile apps) sees the mismatch on its next /api/version
 * poll, clears local caches, and calls window.location.reload().
 *
 * Three callers are accepted:
 *
 *   A. Super-Admin dashboard click
 *      Auth: NextAuth session with email === admin@myncel.com.
 *
 *   B. Vercel webhook (deployment.succeeded → production)
 *      Auth: x-vercel-signature header verified via HMAC-SHA1 over the
 *      raw body, using env VERCEL_WEBHOOK_SECRET. We additionally check
 *      the payload type === 'deployment.succeeded' AND the deployment
 *      target/environment is production, so preview deploys never
 *      trigger a global refresh.
 *
 *   C. Generic deploy script with shared secret
 *      Auth: x-deploy-secret header equals env DEPLOY_REFRESH_SECRET.
 *      Useful for self-hosted setups, CI runners, etc. Optional — leave
 *      DEPLOY_REFRESH_SECRET unset and only Vercel + SA can fire.
 *
 * Safe to call repeatedly; the bump is idempotent in effect (each call
 * just produces a new token; clients only reload on a token change).
 */
export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Verify Vercel webhook signature. Vercel signs the raw body with
 * HMAC-SHA1 using the secret you choose when creating the webhook,
 * and sends the hex digest in the `x-vercel-signature` header.
 *
 * Docs: https://vercel.com/docs/webhooks/webhooks-api#securing-webhooks
 */
function verifyVercelSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac('sha1', secret).update(rawBody, 'utf8').digest('hex');
  try {
    return safeEqual(expected, signature);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Read the raw body ONCE up front so we can both verify signatures
  // and inspect the JSON payload below.
  const rawBody = await req.text();

  // ─── Path A: SA dashboard click (no body) ───────────────────────────
  const session = await getServerSession(authOptions);
  const isSA = session?.user?.email === 'admin@myncel.com';

  // ─── Path B: Vercel webhook with x-vercel-signature ─────────────────
  const vercelSig = req.headers.get('x-vercel-signature');
  const vercelSecret = process.env.VERCEL_WEBHOOK_SECRET;
  let isVercelWebhook = false;
  let vercelEventType: string | null = null;
  let vercelTarget: string | null = null;

  if (vercelSig && vercelSecret && rawBody) {
    if (verifyVercelSignature(rawBody, vercelSig, vercelSecret)) {
      try {
        const evt = JSON.parse(rawBody) as any;
        vercelEventType = evt?.type ?? null;
        // Vercel puts the deployment target/environment in different shapes
        // across event versions; check both common locations.
        vercelTarget =
          evt?.payload?.deployment?.meta?.githubCommitRef
            ? evt?.payload?.target ?? evt?.payload?.deployment?.target ?? null
            : evt?.payload?.target ?? evt?.payload?.deployment?.target ?? null;
        // Only trigger on a *successful production* deployment event.
        if (
          vercelEventType === 'deployment.succeeded' &&
          (vercelTarget === 'production' || vercelTarget === null /* older payload shape */)
        ) {
          isVercelWebhook = true;
        }
      } catch {
        // Bad JSON body even though signature matched — ignore.
      }
    }
  }

  // ─── Path C: shared-secret header (CI / self-hosted) ────────────────
  const headerSecret = req.headers.get('x-deploy-secret');
  const envSecret = process.env.DEPLOY_REFRESH_SECRET;
  const isSharedSecret =
    !!envSecret && !!headerSecret && safeEqual(headerSecret, envSecret);

  if (!isSA && !isVercelWebhook && !isSharedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // For Vercel webhooks that arrived but for non-matching events
  // (e.g. preview deploys, deployment.created, etc.), acknowledge with
  // 200 so Vercel doesn't keep retrying — but don't bump the version.
  if (vercelSig && vercelSecret && !isVercelWebhook && !isSA && !isSharedSecret) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'event-not-actionable',
      eventType: vercelEventType,
      target: vercelTarget,
    });
  }

  // New version token = epoch-ms + short random suffix so two consecutive
  // bumps within the same millisecond still differ.
  const now = new Date();
  const rand = Math.random().toString(36).slice(2, 6);
  const version = `${now.getTime()}-${rand}`;
  const source = isSA
    ? 'super_admin'
    : isVercelWebhook
    ? 'vercel_webhook'
    : 'deploy_hook';
  const payload = JSON.stringify({
    version,
    bumpedAt: now.toISOString(),
    bumpedBy: source,
  });

  try {
    await db.adminSetting.upsert({
      where: { key: 'platform.appVersion' },
      create: {
        key: 'platform.appVersion',
        value: payload,
        group: 'platform',
        label: 'App version (force-refresh token)',
        updatedBy: isSA ? session?.user?.id ?? null : null,
      },
      update: {
        value: payload,
        updatedBy: isSA ? session?.user?.id ?? null : null,
      },
    });

    if (isSA) {
      await db.auditLog
        .create({
          data: {
            action: 'PLATFORM_FORCE_REFRESH',
            entity: 'AdminSetting',
            changes: { version, bumpedAt: now.toISOString(), source } as any,
            userId: session?.user?.id ?? null,
          },
        })
        .catch(() => {});
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to bump version', detail: err?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    appVersion: version,
    bumpedAt: now.toISOString(),
    source,
  });
}
