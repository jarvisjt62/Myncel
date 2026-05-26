/**
 * GET    /api/locations/floors?buildingId=...    — list floors (optionally filtered by building)
 * POST   /api/locations/floors                   — body: { buildingId, name, level?, notes? }
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

  const buildingId = req.nextUrl.searchParams.get('buildingId') || undefined;

  const floors = await safeQuery(
    () =>
      db.floor.findMany({
        where: { organizationId: orgId, ...(buildingId ? { buildingId } : {}) },
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
        include: {
          building: { select: { id: true, name: true, site: { select: { id: true, name: true } } } },
          _count: { select: { rooms: true, machines: true } },
        },
      }),
    [],
  );

  return NextResponse.json({ floors });
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
  const buildingId = String(body?.buildingId ?? '').trim();
  const name = String(body?.name ?? '').trim();
  if (!buildingId) return NextResponse.json({ error: 'buildingId is required' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const building = await safeQuery(() => db.building.findUnique({ where: { id: buildingId } }), null);
  if (!building || building.organizationId !== orgId) {
    return NextResponse.json({ error: 'Building not found' }, { status: 404 });
  }

  try {
    const floor = await db.floor.create({
      data: {
        organizationId: orgId,
        buildingId,
        siteId: building.siteId,
        name,
        level: body?.level !== undefined && body?.level !== null && body?.level !== ''
          ? Number(body.level)
          : null,
        notes: body?.notes ? String(body.notes) : null,
      },
    });
    return NextResponse.json({ floor });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: `A floor named "${name}" already exists in this building.` }, { status: 409 });
    }
    console.error('[locations.floors.POST]', e);
    return NextResponse.json({ error: 'Failed to create floor' }, { status: 500 });
  }
}
