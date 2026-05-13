import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

async function requireOrgUser() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, organizationId: true },
  });
  if (!user || !user.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  return { user };
}

// GET /api/org/roles — list roles visible to this org:
//   - all system roles (base)
//   - all non-disabled global roles
//   - custom roles belonging to this org
export async function GET() {
  const auth = await requireOrgUser();
  if (auth.error) return auth.error;

  const { organizationId } = auth.user!;

  const roles = await db.role.findMany({
    where: {
      isDisabled: false,
      OR: [
        { isSystem: true },
        { isGlobal: true },
        { organizationId },
      ],
    },
    orderBy: [{ isSystem: 'desc' }, { isGlobal: 'desc' }, { name: 'asc' }],
    include: {
      permissions: { select: { permission: { select: { id: true, key: true, category: true, label: true } } } },
      _count: { select: { assignments: true } },
    },
  });

  return NextResponse.json({ roles });
}

// POST /api/org/roles — create a custom role scoped to this org
// body: { name, description?, color?, icon?, permissionKeys: string[] }
export async function POST(req: NextRequest) {
  const auth = await requireOrgUser();
  if (auth.error) return auth.error;

  const { user } = auth as { user: NonNullable<Awaited<ReturnType<typeof requireOrgUser>>['user']> };

  // Need permission (Owner/Admin have it by default via system role seed)
  if (!(await hasPermission(user.id, 'roles.create'))) {
    return NextResponse.json({ error: 'Forbidden — missing roles.create' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, description, color, icon, permissionKeys } = body ?? {};
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!slug) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });

  const existing = await db.role.findFirst({ where: { slug, organizationId: user.organizationId } });
  if (existing) {
    return NextResponse.json({ error: 'A role with that name already exists in your org' }, { status: 409 });
  }

  const perms = Array.isArray(permissionKeys)
    ? await db.permission.findMany({ where: { key: { in: permissionKeys } }, select: { id: true } })
    : [];

  const role = await db.role.create({
    data: {
      name: String(name).trim(),
      slug,
      description: description ?? null,
      color: color ?? null,
      icon: icon ?? null,
      isSystem: false,
      isGlobal: false,
      organizationId: user.organizationId,
      createdById: user.id,
      permissions: perms.length > 0 ? { create: perms.map(p => ({ permissionId: p.id })) } : undefined,
    },
    include: {
      permissions: { include: { permission: true } },
    },
  });

  return NextResponse.json({ role }, { status: 201 });
}
