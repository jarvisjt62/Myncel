import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * DELETE /api/admin/login-activity/[id]
 *
 * Delete a single login audit row.
 * Restricted to action IN ('LOGIN', 'LOGIN_FAILED') so this endpoint can never
 * delete other audit log rows even if a wrong id is passed.
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

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const row = await db.auditLog.findUnique({
    where: { id: ctx.params.id },
    select: { id: true, action: true },
  });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (row.action !== 'LOGIN' && row.action !== 'LOGIN_FAILED') {
    return NextResponse.json({ error: 'This endpoint only deletes login audit rows' }, { status: 400 });
  }

  await db.auditLog.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}
