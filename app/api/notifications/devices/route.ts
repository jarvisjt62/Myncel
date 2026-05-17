/**
 * /api/notifications/devices
 *
 * Used by the Capacitor mobile shell (or a desktop browser running as a PWA)
 * to register / unregister the FCM / APNs / Web-Push token for the current
 * signed-in user. The mobile shell calls this from a normal web fetch so the
 * Next-Auth session cookie is what authenticates — no separate mobile JWT.
 *
 * The legacy /api/mobile/push-token endpoint stays for the older Expo-based
 * client; this one is used by the Capacitor build.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const token = String(body?.token || '').trim();
  const platformRaw = String(body?.platform || '').toLowerCase();
  const platform = platformRaw === 'ios' || platformRaw === 'android' ? platformRaw : 'android';
  const deviceName = body?.deviceName ? String(body.deviceName) : null;
  const appVersion = body?.appVersion ? String(body.appVersion) : null;

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    const record = await db.mobilePushToken.upsert({
      where: { token },
      update: {
        userId: session.user.id,
        platform,
        deviceName,
        appVersion,
        lastUsedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        token,
        platform,
        deviceName,
        appVersion,
      },
    });
    return NextResponse.json({ ok: true, id: record.id });
  } catch (err) {
    console.error('[notifications/devices] register error:', err);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }
  await db.mobilePushToken
    .deleteMany({ where: { userId: session.user.id, token } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}
