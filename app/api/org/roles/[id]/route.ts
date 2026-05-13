import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

async function requireOrgUser() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, organizationId: true },
  });
  if (!user || !user.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  return { user };
}

// PATCH /api/org/roles/[id] — edit a custom role owned by this org.
// System / global roles are read-only from the org side.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireOrgUser();
  if (auth.error) return auth.error;
  const { user } = auth as { user: NonNullable<Awaited<ReturnType<typeof requireOrgUser>>['user']> };

  if (!(await hasPermission(user.id, 'roles.edit'))) {
    return NextResponse.json({ error: 'Forbidden — missing roles.edit' }, { status: 403 });
  }

  const role = await db.role.findUnique({ where: { id: params.id } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  if (role.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'This role is managed by the platform. Contact support to change it.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, color, icon, permissionKeys } = body ?? {};
  const data: any = {};
  if (name != null) {
    const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (slug) { data.name = String(name).trim(); data.slug = slug; }
  }
  if (description !== undefined) data.description = description;
  if (color !== undefined) data.color = color;
  if (icon !== undefined) data.icon = icon;

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

// DELETE /api/org/roles/[id] — remove a custom role owned by this org
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireOrgUser();
  if (auth.error) return auth.error;
  const { user } = auth as { user: NonNullable<Awaited<ReturnType<typeof requireOrgUser>>['user']> };

  if (!(await hasPermission(user.id, 'roles.delete'))) {
    return NextResponse.json({ error: 'Forbidden — missing roles.delete' }, { status: 403 });
  }

  const role = await db.role.findUnique({ where: { id: params.id } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  if (role.isSystem) return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 400 });
  if (role.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'This role is managed by the platform' }, { status: 403 });
  }

  await db.role.delete({ where: { id: role.id } });
  return NextResponse.json({ ok: true });
}
