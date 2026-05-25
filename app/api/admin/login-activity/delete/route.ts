import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * DELETE /api/admin/login-activity
 *
 * Bulk-delete login audit rows.
 *
 * Query / body params:
 *   ?all=1                  → wipe all login events (LOGIN + LOGIN_FAILED)
 *   ?status=success         → wipe only successful logins
 *   ?status=failed          → wipe only failed logins
 *   ?olderThanDays=30       → wipe events older than N days
 *   body { ids: string[] }  → wipe specific audit log ids
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

export async function DELETE(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const url = new URL(req.url);
  const all = url.searchParams.get('all') === '1';
  const status = url.searchParams.get('status');
  const olderThanDays = url.searchParams.get('olderThanDays');

  let body: any = null;
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      body = await req.json();
    }
  } catch { /* ignore */ }

  // Always scope to login events only — never let this endpoint delete other audit rows.
  const baseAction = { in: ['LOGIN', 'LOGIN_FAILED'] };
  let where: any = null;
  let scopeLabel = '';

  if (Array.isArray(body?.ids) && body.ids.length > 0) {
    where = { id: { in: body.ids as string[] }, action: baseAction };
    scopeLabel = `ids=${body.ids.length}`;
  } else if (all) {
    where = { action: baseAction };
    scopeLabel = 'all_login_events';
  } else if (status === 'success') {
    where = { action: 'LOGIN' };
    scopeLabel = 'all_successful';
  } else if (status === 'failed') {
    where = { action: 'LOGIN_FAILED' };
    scopeLabel = 'all_failed';
  } else if (olderThanDays) {
    const days = parseInt(olderThanDays, 10);
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ error: 'olderThanDays must be a positive integer' }, { status: 400 });
    }
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    where = { action: baseAction, createdAt: { lt: cutoff } };
    scopeLabel = `olderThan_${days}d`;
  } else {
    return NextResponse.json(
      { error: 'No scope. Use ?all=1, ?status=success|failed, ?olderThanDays=N, or POST { ids: [...] }.' },
      { status: 400 }
    );
  }

  const result = await db.auditLog.deleteMany({ where });

  // Best-effort meta-audit — log the cleanup itself
  try {
    await db.auditLog.create({
      data: {
        action: 'LOGIN_AUDIT_PURGE',
        entity: 'AuditLog',
        userId: (session.user as any).id ?? null,
        changes: { scope: scopeLabel, deletedCount: result.count } as any,
      },
    });
  } catch { /* swallow */ }

  return NextResponse.json({ ok: true, deletedCount: result.count, scope: scopeLabel });
}
