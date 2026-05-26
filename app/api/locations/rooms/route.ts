/**
 * GET    /api/locations/rooms?floorId=...    — list rooms (optionally filtered by floor)
 * POST   /api/locations/rooms                — body: { floorId, name, code?, notes? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

async function getOrgId(userId: string): Promise<string | null> {
  const u = await safeQuery(
    () => db.user.findUnique({ where: { id: userId }, select: { organizationId: true } }),
    null,
  );
  return u?.organizationId ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = await getOrgId((session.user as any).id);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const floorId = req.nextUrl.searchParams.get('floorId') || undefined;

  const rooms = await safeQuery(
    () =>
      db.room.findMany({
        where: { organizationId: orgId, ...(floorId ? { floorId } : {}) },
        orderBy: { name: 'asc' },
        include: {
          floor: { select: { id: true, name: true } },
          building: { select: { id: true, name: true } },
          site: { select: { id: true, name: true } },
          _count: { select: { machines: true } },
        },
      }),
    [],
  );

  return NextResponse.json({ rooms });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  if (!(await hasPermission(userId, 'machines.edit'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const floorId = String(body?.floorId ?? '').trim();
  const name = String(body?.name ?? '').trim();
  if (!floorId) return NextResponse.json({ error: 'floorId is required' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const floor = await safeQuery(() => db.floor.findUnique({ where: { id: floorId } }), null);
  if (!floor || floor.organizationId !== orgId) {
    return NextResponse.json({ error: 'Floor not found' }, { status: 404 });
  }

  try {
    const room = await db.room.create({
      data: {
        organizationId: orgId,
        floorId,
        buildingId: floor.buildingId,
        siteId: floor.siteId,
        name,
        code: body?.code ? String(body.code).trim() : null,
        notes: body?.notes ? String(body.notes) : null,
      },
    });
    return NextResponse.json({ room });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: `A room named "${name}" already exists on this floor.` }, { status: 409 });
    }
    console.error('[locations.rooms.POST]', e);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
