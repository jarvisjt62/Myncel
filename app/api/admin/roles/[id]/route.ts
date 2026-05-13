import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const PLATFORM_ADMIN = 'admin@myncel.com';

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (session.user.email !== PLATFORM_ADMIN) {
    return { error: NextResponse.json({ error: 'Forbidden — Platform admin only' }, { status: 403 }) };
  }
  return { session };
}

type Ctx = { params: { id: string } };

// PATCH /api/admin/roles/[id] — edit or override any role (even org-owned ones).
// Accepts: name?, description?, color?, icon?, permissionKeys?, isDisabled?
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  const role = await db.role.findUnique({ where: { id: params.id } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { name, description, color, icon, permissionKeys, isDisabled } = body ?? {};

  // System roles: only permissions + isDisabled can be changed (name/slug are frozen)
  const data: any = {};
  if (!role.isSystem) {
    if (name != null) {
      const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (slug) { data.name = String(name).trim(); data.slug = slug; }
    }
    if (description !== undefined) data.description = description;
    if (color !== undefined) data.color = color;
    if (icon !== undefined) data.icon = icon;
  }
  if (typeof isDisabled === 'boolean') data.isDisabled = isDisabled;

  if (Array.isArray(permissionKeys)) {
    const perms = await db.permission.findMany({ where: { key: { in: permissionKeys } }, select: { id: true } });
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (perms.length > 0) {
      await db.rolePermission.createMany({ data: perms.map(p => ({ roleId: role.id, permissionId: p.id })) });
    }
  }

  const updated = await db.role.update({
    where: { id: role.id },
    data,
    include: {
      permissions: { select: { permission: { select: { id: true, key: true, category: true, label: true } } } },
      organization: { select: { id: true, name: true, slug: true } },
      _count: { select: { assignments: true } },
    },
  });

  return NextResponse.json({ role: updated });
}

// DELETE /api/admin/roles/[id] — platform admin can delete any non-system role,
// including org-owned ones (override capability).
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  const role = await db.role.findUnique({ where: { id: params.id } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  if (role.isSystem) {
    return NextResponse.json({ error: 'System roles cannot be deleted. Disable it instead.' }, { status: 400 });
  }

  await db.role.delete({ where: { id: role.id } });
  return NextResponse.json({ ok: true });
}
