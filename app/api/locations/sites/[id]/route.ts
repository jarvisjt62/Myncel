/**
 * GET    /api/locations/sites/[id]
 * PATCH  /api/locations/sites/[id]   — body: { name?, code?, address?, timezone?, notes? }
 * DELETE /api/locations/sites/[id]   — cascades to all child buildings/floors/rooms;
 *                                      machines whose siteId pointed here get SetNull.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

async function checkAccess(req: NextRequest, id: string, requireEdit = false) {
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

  const site = await safeQuery(() => db.site.findUnique({ where: { id } }), null);
  if (!site) return { error: NextResponse.json({ error: 'Site not found' }, { status: 404 }) };
  if (site.organizationId !== u.organizationId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { site, orgId: u.organizationId };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(req, params.id);
  if ('error' in r) return r.error;
  return NextResponse.json({ site: r.site });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(req, params.id, true);
  if ('error' in r) return r.error;

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if ('code' in body) data.code = body.code ? String(body.code).trim() : null;
  if ('address' in body) data.address = body.address ? String(body.address).trim() : null;
  if ('timezone' in body) data.timezone = body.timezone ? String(body.timezone).trim() : null;
  if ('notes' in body) data.notes = body.notes ? String(body.notes) : null;

  try {
    const updated = await db.site.update({ where: { id: params.id }, data });
    return NextResponse.json({ site: updated });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: `That name is already used in this org.` }, { status: 409 });
    }
    console.error('[sites.PATCH]', e);
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const r = await checkAccess(req, params.id, true);
  if ('error' in r) return r.error;

  try {
    await db.site.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[sites.DELETE]', e);
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
  }
}
