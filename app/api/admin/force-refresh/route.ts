import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Super-Admin "Force refresh all clients" endpoint.
 *
 * Bumps the `platform.appVersion` row in `admin_settings` to a new
 * timestamp-based value. Within ~60 s every connected client (web +
 * Capacitor mobile apps) will see the mismatch on its next /api/version
 * poll, clear local caches, and call window.location.reload().
 *
 * Safe to call repeatedly. Auth is restricted to admin@myncel.com.
 *
 * Also exposed as a programmatic endpoint for the deploy hook so a
 * normal Vercel push automatically clears stale clients without any
 * manual SA action. The deploy hook authenticates with a shared secret
 * via the `x-deploy-secret` header (env: DEPLOY_REFRESH_SECRET).
 */
export async function POST(req: NextRequest) {
  // Path A: SA dashboard click
  const session = await getServerSession(authOptions);
  const isSA = session?.user?.email === 'admin@myncel.com';

  // Path B: deploy hook with shared secret
  const headerSecret = req.headers.get('x-deploy-secret');
  const envSecret = process.env.DEPLOY_REFRESH_SECRET;
  const isDeployHook = !!envSecret && !!headerSecret && headerSecret === envSecret;

  if (!isSA && !isDeployHook) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // New version = ISO timestamp + short random suffix so two consecutive
  // bumps within the same millisecond still differ.
  const now = new Date();
  const rand = Math.random().toString(36).slice(2, 6);
  const version = `${now.getTime()}-${rand}`;
  const payload = JSON.stringify({
    version,
    bumpedAt: now.toISOString(),
    bumpedBy: isSA ? 'super_admin' : 'deploy_hook',
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
            changes: { version, bumpedAt: now.toISOString() } as any,
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
    source: isSA ? 'super_admin' : 'deploy_hook',
  });
}
