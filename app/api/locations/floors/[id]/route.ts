/**
 * GET    /api/locations/floors/[id]
 * PATCH  /api/locations/floors/[id]   — body: { name?, level?, notes? }
 * DELETE /api/locations/floors/[id]   — cascades down to rooms.
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

  const floor = await safeQuery(() => db.floor.findUnique({ where: { id } }), null);
  if (!floor) return { error: NextResponse.json({ error: 'Floor not found' }, { status: 404 }) };
  if (floor.organizationId !== u.organizationId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { floor, orgId: u.organizationId };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(params.id);
  if ('error' in r) return r.error;
  return NextResponse.json({ floor: r.floor });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(params.id, true);
  if ('error' in r) return r.error;

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if ('level' in body) {
    data.level = body.level === null || body.level === '' ? null : Number(body.level);
  }
  if ('notes' in body) data.notes = body.notes ? String(body.notes) : null;

  try {
    const updated = await db.floor.update({ where: { id: params.id }, data });
    return NextResponse.json({ floor: updated });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: `That name is already used in this building.` }, { status: 409 });
    }
    console.error('[floors.PATCH]', e);
    return NextResponse.json({ error: 'Failed to update floor' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(params.id, true);
  if ('error' in r) return r.error;

  try {
    await db.floor.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[floors.DELETE]', e);
    return NextResponse.json({ error: 'Failed to delete floor' }, { status: 500 });
  }
}
