/**
 * GET    /api/locations/rooms/[id]
 * PATCH  /api/locations/rooms/[id]   — body: { name?, code?, notes? }
 * DELETE /api/locations/rooms/[id]   — machines whose roomId pointed here get SetNull.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

async function checkAccess(id: string, requireEdit = false) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const userId = (session.user as any).id as string;
  if (requireEdit && !(await hasPermission(userId, 'machines.edit'))) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const u = await safeQuery(
    () => db.user.findUnique({ where: { id: userId }, select: { organizationId: true } }),
    null,
  );
  if (!u?.organizationId) return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };

  const room = await safeQuery(() => db.room.findUnique({ where: { id } }), null);
  if (!room) return { error: NextResponse.json({ error: 'Room not found' }, { status: 404 }) };
  if (room.organizationId !== u.organizationId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { room, orgId: u.organizationId };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(params.id);
  if ('error' in r) return r.error;
  return NextResponse.json({ room: r.room });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(params.id, true);
  if ('error' in r) return r.error;

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if ('code' in body) data.code = body.code ? String(body.code).trim() : null;
  if ('notes' in body) data.notes = body.notes ? String(body.notes) : null;

  try {
    const updated = await db.room.update({ where: { id: params.id }, data });
    return NextResponse.json({ room: updated });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: `That name is already used on this floor.` }, { status: 409 });
    }
    console.error('[rooms.PATCH]', e);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(params.id, true);
  if ('error' in r) return r.error;

  try {
    await db.room.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[rooms.DELETE]', e);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
