/**
 * /api/debug-push
 *
 * Comprehensive push-notification diagnostic endpoint, mirrors /api/debug-sms.
 * Tells the user EXACTLY why push isn't being delivered for the current
 * signed-in user (the one calling this endpoint).
 *
 *   GET  /api/debug-push                   -> diagnose state (no side effects)
 *   POST /api/debug-push                   -> diagnose + send a test push
 *   POST /api/debug-push  { sendTest:true} -> same as above
 *
 * Checks:
 *   1. User has at least one MobilePushToken row registered
 *   2. FCM env vars are set on the server (FCM_PROJECT_ID, FCM_CLIENT_EMAIL,
 *      FCM_PRIVATE_KEY) — without these, FCM tokens silently no-op
 *   3. Token format is what we expect (Expo prefix vs raw FCM)
 *   4. (sendTest) actually call sendPushToUser with a small test payload
 *      and report whether the underlying provider accepted it
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendPushToUser } from '@/lib/notifications/push';

export const dynamic = 'force-dynamic';

export async function GET() {
  return runDiagnostic(false);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  return runDiagnostic(!!body?.sendTest);
}

async function runDiagnostic(sendTest: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id as string | undefined;
    const orgId = (session.user as any).organizationId as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: 'Session has no user id' }, { status: 400 });
    }

    const report: any = {
      user: { id: userId, email: session.user.email, organizationId: orgId ?? null },
      checks: {},
      blockers: [] as string[],
      actions: [] as string[],
    };

    // 1. Token registration
    const tokens = await db.mobilePushToken.findMany({
      where: { userId },
      select: {
        id: true,
        token: true,
        platform: true,
        deviceName: true,
        appVersion: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    }).catch(() => []);

    report.checks.tokenCount = tokens.length;
    report.checks.tokens = tokens.map(t => ({
      id: t.id,
      platform: t.platform,
      deviceName: t.deviceName,
      appVersion: t.appVersion,
      kind: /^ExponentPushToken\[/.test(t.token) ? 'expo' : 'fcm',
      tokenPreview: `${t.token.slice(0, 16)}…${t.token.slice(-6)}`,
      lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    }));

    if (tokens.length === 0) {
      report.blockers.push('NO_TOKENS_REGISTERED');
      report.actions.push(
        '❌ This account has no mobile-push tokens registered. ' +
        'Open the Capacitor app on your phone, sign in, and grant notification permission. ' +
        'The shell calls POST /api/notifications/devices on first launch — confirm in the app logs that this succeeded.'
      );
    }

    // 2. FCM env vars
    const fcmEnv = {
      FCM_PROJECT_ID: !!process.env.FCM_PROJECT_ID,
      FCM_CLIENT_EMAIL: !!process.env.FCM_CLIENT_EMAIL,
      FCM_PRIVATE_KEY: !!process.env.FCM_PRIVATE_KEY,
    };
    const fcmConfigured = fcmEnv.FCM_PROJECT_ID && fcmEnv.FCM_CLIENT_EMAIL && fcmEnv.FCM_PRIVATE_KEY;
    report.checks.fcmEnv = fcmEnv;
    report.checks.fcmConfigured = fcmConfigured;

    const hasFcmTokens = tokens.some(t => !/^ExponentPushToken\[/.test(t.token));
    if (hasFcmTokens && !fcmConfigured) {
      report.blockers.push('FCM_ENV_MISSING');
      report.actions.push(
        '❌ You have FCM (Capacitor) tokens registered but the server is missing FCM credentials. ' +
        'Set these env vars in Vercel and redeploy: FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY ' +
        '(get them from Firebase console → Project settings → Service accounts → Generate new private key).'
      );
    }

    // 3. Optional live send test
    if (sendTest && tokens.length > 0) {
      try {
        await sendPushToUser(userId, {
          title: '🔔 Myncel push test',
          body: `Diagnostic test from ${new Date().toLocaleTimeString()} — if you can read this, push is working.`,
          link: '/dashboard',
          kind: 'debug.test',
        });
        report.actions.push(
          '✅ sendPushToUser() called without error. Check your phone — the notification should arrive within a few seconds. ' +
          'If nothing arrives but this returned success, the message was queued successfully but the device did not receive it. ' +
          'Common causes: device offline, notification permission denied on device, FCM token expired (uninstall+reinstall app to re-register), ' +
          'or notification channel disabled in Android system settings.'
        );
        report.testResult = { dispatched: true };
      } catch (err: any) {
        report.actions.push(`❌ sendPushToUser threw: ${err?.message || String(err)}`);
        report.testResult = { dispatched: false, error: String(err) };
      }
    } else if (sendTest) {
      report.actions.push('⚠️ Test send skipped: no tokens to send to.');
    }

    // Summary
    report.summary = {
      ready: tokens.length > 0 && (!hasFcmTokens || fcmConfigured),
      blockers: report.blockers,
    };
    if (report.summary.ready) {
      report.actions.push('✅ All preconditions look good. If pushes still don\'t arrive when work orders are created, see the server logs for [dispatch] PUSH lines.');
    }

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || 'Unknown error',
      stack: error?.stack,
    }, { status: 500 });
  }
}
