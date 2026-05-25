import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * DELETE /api/admin/push-debug/devices
 *
 * Bulk-delete `MobilePushToken` rows.
 *
 * Query params:
 *   ?all=1                  → wipe the entire table
 *   ?platform=ios|android   → wipe rows for one platform
 *   ?userId=...             → wipe rows for one user
 *
 * Body (alternative): JSON `{ ids: string[] }` to delete specific rows.
 *
 * Auth: super-admin only.
 *
 * Note: deleting the token row only removes the registration. The user keeps
 * their account. Their next app launch will register a fresh token.
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

export async function DELETE(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const url = new URL(req.url);
  const all = url.searchParams.get('all') === '1';
  const platform = url.searchParams.get('platform');
  const userId = url.searchParams.get('userId');

  let body: any = null;
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      body = await req.json();
    }
  } catch { /* ignore */ }

  let where: any = null;
  let scopeLabel = '';

  if (all) {
    where = {};
    scopeLabel = 'all_devices';
  } else if (Array.isArray(body?.ids) && body.ids.length > 0) {
    where = { id: { in: body.ids as string[] } };
    scopeLabel = `ids=${body.ids.length}`;
  } else if (platform === 'ios' || platform === 'android') {
    where = { platform };
    scopeLabel = `platform=${platform}`;
  } else if (userId) {
    where = { userId };
    scopeLabel = `userId=${userId}`;
  } else {
    return NextResponse.json(
      { error: 'No scope specified. Use ?all=1, ?platform=ios|android, ?userId=…, or POST { ids: [...] }.' },
      { status: 400 }
    );
  }

  const result = await db.mobilePushToken.deleteMany({ where });

  // Best-effort audit log
  try {
    await db.auditLog.create({
      data: {
        action: 'PUSH_TOKENS_DELETED',
        entity: 'MobilePushToken',
        userId: (session.user as any).id ?? null,
        changes: { scope: scopeLabel, deletedCount: result.count } as any,
      },
    });
  } catch { /* swallow */ }

  return NextResponse.json({ ok: true, deletedCount: result.count, scope: scopeLabel });
}
