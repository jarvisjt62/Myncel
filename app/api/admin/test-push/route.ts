import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { sendPushToUser } from '@/lib/notifications/push';

/**
 * POST /api/admin/test-push
 *
 * Super-admin–only utility to send a one-off test push to verify the
 * delivery pipeline end-to-end. Bypasses all channel toggles and quiet
 * hours (it's a debugging tool, not a production notification).
 *
 * Body: { userId?: string, email?: string, title?: string, body?: string, link?: string }
 *
 * If neither userId nor email is supplied, defaults to the caller (so a
 * super admin can self-test by simply POSTing an empty body if they have
 * a registered device).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  userId?: string;
  email?: string;
  title?: string;
  body?: string;
  link?: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 });
  }

  let body: Body = {};
  try { body = (await req.json()) as Body; } catch { /* allow empty body */ }

  // Resolve target user
  let targetUserId: string | null = null;
  let targetEmail: string | null = null;
  if (body.userId) {
    const u = await safeQuery(
      db.user.findUnique({ where: { id: body.userId }, select: { id: true, email: true } }),
      null
    );
    if (!u) return NextResponse.json({ error: 'User not found by id' }, { status: 404 });
    targetUserId = u.id; targetEmail = u.email;
  } else if (body.email) {
    const u = await safeQuery(
      db.user.findUnique({ where: { email: body.email }, select: { id: true, email: true } }),
      null
    );
    if (!u) return NextResponse.json({ error: 'User not found by email' }, { status: 404 });
    targetUserId = u.id; targetEmail = u.email;
  } else {
    targetUserId = session.user.id ?? null;
    targetEmail = session.user.email ?? null;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'Could not resolve a target user' }, { status: 400 });
  }

  // Count tokens before sending so we can tell the caller how many devices we tried.
  const tokens = await safeQuery(
    db.mobilePushToken.findMany({
      where: { userId: targetUserId },
      select: { id: true, platform: true, deviceName: true, token: true },
    }),
    []
  );

  if (!tokens.length) {
    return NextResponse.json({
      ok: false,
      targetUserId,
      targetEmail,
      reason: 'no_tokens_registered',
      message: 'This user has no mobile push tokens registered yet. They need to install the app and grant push permission first.',
    }, { status: 200 });
  }

  const title = body.title?.slice(0, 120) || '🧪 Myncel test push';
  const msg   = body.body?.slice(0, 240)  || `Test push from ${session.user.email} at ${new Date().toLocaleString()}.`;

  await sendPushToUser(targetUserId, {
    title,
    body: msg,
    link: body.link || '/dashboard',
    kind: 'TEST_PUSH',
  });

  return NextResponse.json({
    ok: true,
    targetUserId,
    targetEmail,
    tokenCount: tokens.length,
    tokens: tokens.map(t => ({
      id: t.id,
      platform: t.platform,
      deviceName: t.deviceName,
      tokenSuffix: t.token ? `…${t.token.slice(-8)}` : null,
    })),
    message: `Push dispatched to ${tokens.length} device(s). Check the activity log below in 5–10 seconds for delivery results.`,
  });
}
