/**
 * GET    /api/locations/sites          — list sites in current org
 * POST   /api/locations/sites          — create a site
 * Body: { name, code?, address?, timezone?, notes? }
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = await getOrgId((session.user as any).id);
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const sites = await safeQuery(
    () =>
      db.site.findMany({
        where: { organizationId: orgId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { buildings: true, machines: true } } },
      }),
    [],
  );

  return NextResponse.json({ sites });
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
  const name = String(body?.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  try {
    const site = await db.site.create({
      data: {
        organizationId: orgId,
        name,
        code: body?.code ? String(body.code).trim() : null,
        address: body?.address ? String(body.address).trim() : null,
        timezone: body?.timezone ? String(body.timezone).trim() : null,
        notes: body?.notes ? String(body.notes) : null,
      },
    });
    return NextResponse.json({ site });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: `A site named "${name}" already exists.` }, { status: 409 });
    }
    console.error('[locations.sites.POST]', e);
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}
