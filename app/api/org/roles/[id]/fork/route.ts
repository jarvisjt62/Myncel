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

/**
 * POST /api/org/roles/[id]/fork
 *
 * Forks a built-in (system) or global role into the current org's namespace,
 * carrying over its current permissions. The resulting role is fully editable
 * by the org. If the org already has a forked copy of the same source role
 * (matched by slug), that fork is returned instead of creating a duplicate.
 *
 * Body (optional): { name?, description?, color?, icon?, permissionKeys? }
 *   - When provided, those fields seed the fork; otherwise they are copied
 *     from the source role.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireOrgUser();
  if (auth.error) return auth.error;
  const { user } = auth as { user: NonNullable<Awaited<ReturnType<typeof requireOrgUser>>['user']> };

  if (!(await hasPermission(user.id, 'roles.create'))) {
    return NextResponse.json({ error: 'Forbidden — missing roles.create' }, { status: 403 });
  }

  const source = await db.role.findUnique({
    where: { id: params.id },
    include: { permissions: { select: { permission: { select: { id: true, key: true } } } } },
  });
  if (!source) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  // Only system / global roles are forkable; org-scoped roles should be edited directly.
  if (!source.isSystem && !source.isGlobal) {
    return NextResponse.json({ error: 'This role is already org-scoped — edit it directly.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, color, icon, permissionKeys } = body ?? {};

  const finalName = (typeof name === 'string' && name.trim()) ? name.trim() : source.name;
  const slug = finalName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!slug) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });

  // If org already has a fork with this slug, just update it instead of duplicating.
  const existing = await db.role.findFirst({ where: { slug, organizationId: user.organizationId } });
  if (existing) {
    const updateData: any = {
      name: finalName,
      description: description !== undefined ? description : source.description,
      color: color !== undefined ? color : source.color,
      icon: icon !== undefined ? icon : source.icon,
    };
    if (Array.isArray(permissionKeys)) {
      const perms = await db.permission.findMany({ where: { key: { in: permissionKeys } }, select: { id: true } });
      await db.rolePermission.deleteMany({ where: { roleId: existing.id } });
      if (perms.length > 0) {
        await db.rolePermission.createMany({ data: perms.map(p => ({ roleId: existing.id, permissionId: p.id })) });
      }
    }
    const updated = await db.role.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        permissions: { select: { permission: { select: { id: true, key: true, category: true, label: true } } } },
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { assignments: true } },
      },
    });
    return NextResponse.json({ role: updated, forked: false, updated: true });
  }

  // Determine permissions to copy
  const sourceKeys = source.permissions.map(p => p.permission.key);
  const finalKeys: string[] = Array.isArray(permissionKeys) ? permissionKeys : sourceKeys;
  const perms = await db.permission.findMany({ where: { key: { in: finalKeys } }, select: { id: true } });

  const fork = await db.role.create({
    data: {
      name: finalName,
      slug,
      description: description !== undefined ? description : source.description,
      color: color !== undefined ? color : source.color,
      icon: icon !== undefined ? icon : source.icon,
      isSystem: false,
      isGlobal: false,
      organizationId: user.organizationId,
      createdById: user.id,
      permissions: {
        create: perms.map(p => ({ permissionId: p.id })),
      },
    },
    include: {
      permissions: { select: { permission: { select: { id: true, key: true, category: true, label: true } } } },
      organization: { select: { id: true, name: true, slug: true } },
      _count: { select: { assignments: true } },
    },
  });

  return NextResponse.json({ role: fork, forked: true });
}
