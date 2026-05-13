import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const PLATFORM_ADMIN = 'admin@myncel.com';

type Ctx = { params: { id: string } };

// DELETE /api/admin/permissions/[id] — only custom (non-seeded) permissions can be removed
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.email !== PLATFORM_ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const perm = await db.permission.findUnique({ where: { id: params.id } });
  if (!perm) return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
  if (!perm.isCustom) {
    return NextResponse.json({ error: 'Seeded permissions cannot be deleted' }, { status: 400 });
  }
  await db.permission.delete({ where: { id: perm.id } });
  return NextResponse.json({ ok: true });
}
