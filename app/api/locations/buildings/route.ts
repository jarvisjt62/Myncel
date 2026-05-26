/**
 * GET    /api/locations/buildings?siteId=...    — list buildings (optionally filtered by site)
 * POST   /api/locations/buildings               — body: { siteId, name, code?, notes? }
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

  const siteId = req.nextUrl.searchParams.get('siteId') || undefined;

  const buildings = await safeQuery(
    () =>
      db.building.findMany({
        where: { organizationId: orgId, ...(siteId ? { siteId } : {}) },
        orderBy: { name: 'asc' },
        include: {
          site: { select: { id: true, name: true } },
          _count: { select: { floors: true, machines: true } },
        },
      }),
    [],
  );

  return NextResponse.json({ buildings });
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
  const siteId = String(body?.siteId ?? '').trim();
  const name = String(body?.name ?? '').trim();
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  // Verify site belongs to org
  const site = await safeQuery(() => db.site.findUnique({ where: { id: siteId } }), null);
  if (!site || site.organizationId !== orgId) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  try {
    const building = await db.building.create({
      data: {
        organizationId: orgId,
        siteId,
        name,
        code: body?.code ? String(body.code).trim() : null,
        notes: body?.notes ? String(body.notes) : null,
      },
    });
    return NextResponse.json({ building });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: `A building named "${name}" already exists in this site.` }, { status: 409 });
    }
    console.error('[locations.buildings.POST]', e);
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 });
  }
}
