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

// GET /api/admin/roles — list every role on the platform (system + global + per-org)
// Supports ?scope=system|global|org and ?orgId=...
export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  const orgId = searchParams.get('orgId');

  const where: any = {};
  if (scope === 'system') where.isSystem = true;
  else if (scope === 'global') { where.isGlobal = true; where.isSystem = false; }
  else if (scope === 'org') { where.isSystem = false; where.isGlobal = false; }
  if (orgId) where.organizationId = orgId;

  const roles = await db.role.findMany({
    where,
    orderBy: [{ isSystem: 'desc' }, { isGlobal: 'desc' }, { name: 'asc' }],
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      permissions: { select: { permissionId: true, permission: { select: { id: true, key: true, category: true, label: true } } } },
      _count: { select: { assignments: true } },
    },
  });

  return NextResponse.json({ roles });
}

// POST /api/admin/roles — create a GLOBAL role (available to every org) or
// pass organizationId to create one on behalf of a specific org.
// body: { name, description?, color?, icon?, permissionKeys: string[], organizationId?: string|null, isGlobal?: boolean }
export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { name, description, color, icon, permissionKeys, organizationId, isGlobal } = body ?? {};

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!slug) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });

  // Uniqueness guard (slug unique per-org, or globally when orgId=null)
  const existing = await db.role.findFirst({ where: { slug, organizationId: organizationId ?? null } });
  if (existing) {
    return NextResponse.json({ error: 'A role with that name already exists in this scope' }, { status: 409 });
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
      isGlobal: !!isGlobal && !organizationId,
      organizationId: organizationId ?? null,
      createdById: auth.session!.user.id ?? null,
      permissions: perms.length > 0 ? { create: perms.map(p => ({ permissionId: p.id })) } : undefined,
    },
    include: {
      permissions: { select: { permission: { select: { id: true, key: true, category: true, label: true } } } },
      organization: { select: { id: true, name: true, slug: true } },
      _count: { select: { assignments: true } },
    },
  });

  return NextResponse.json({ role }, { status: 201 });
}
