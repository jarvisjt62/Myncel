import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET    /api/admin/push-debug/devices/[id] → full details of one device token
 * DELETE /api/admin/push-debug/devices/[id] → remove one device token
 *
 * Auth: super-admin only.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (session.user.email !== 'admin@myncel.com') {
    return { error: NextResponse.json({ error: 'Forbidden — super-admin only' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const row = await db.mobilePushToken.findUnique({
    where: { id: ctx.params.id },
    include: {
      user: { select: { email: true, name: true, organizationId: true, role: true } },
    },
  });

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    platform: row.platform,
    deviceName: row.deviceName ?? null,
    appVersion: row.appVersion ?? null,
    token: row.token,                        // full token — admin only
    tokenSuffix: `…${row.token.slice(-12)}`,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    user: row.user,
    userId: row.userId,
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const row = await db.mobilePushToken.findUnique({
    where: { id: ctx.params.id },
    select: { id: true, userId: true, platform: true },
  });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.mobilePushToken.delete({ where: { id: row.id } });

  try {
    await db.auditLog.create({
      data: {
        action: 'PUSH_TOKEN_DELETED',
        entity: 'MobilePushToken',
        entityId: row.id,
        userId: (session.user as any).id ?? null,
        changes: { targetUserId: row.userId, platform: row.platform } as any,
      },
    });
  } catch { /* swallow */ }

  return NextResponse.json({ ok: true });
}
