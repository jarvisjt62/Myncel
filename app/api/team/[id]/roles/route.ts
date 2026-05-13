import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

/**
 * POST /api/team/[id]/roles
 *   body: { roleIds: string[] }  — full set of role IDs to assign (replaces current)
 *
 * Only team members in the same org can be managed. Platform admin can manage
 * anyone. Requires team.edit_roles permission.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const actor = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, organizationId: true },
  });
  if (!actor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const target = await db.user.findUnique({
    where: { id: params.id },
    select: { id: true, organizationId: true },
  });
  if (!target) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

  const isPlatformAdmin = actor.email === 'admin@myncel.com';
  if (!isPlatformAdmin && actor.organizationId !== target.organizationId) {
    return NextResponse.json({ error: 'Forbidden — different organizations' }, { status: 403 });
  }
  if (!isPlatformAdmin && !(await hasPermission(actor.id, 'team.edit_roles'))) {
    return NextResponse.json({ error: 'Forbidden — missing team.edit_roles' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { roleIds } = body ?? {};
  if (!Array.isArray(roleIds)) {
    return NextResponse.json({ error: 'roleIds[] required' }, { status: 400 });
  }

  // Validate all requested roles are visible to the target's org
  const roles = await db.role.findMany({
    where: {
      id: { in: roleIds },
      isDisabled: false,
      OR: [
        { isSystem: true },
        { isGlobal: true },
        { organizationId: target.organizationId },
      ],
    },
    select: { id: true },
  });
  const validIds = new Set(roles.map(r => r.id));

  // Replace assignments atomically
  await db.$transaction([
    db.userRoleAssignment.deleteMany({ where: { userId: target.id } }),
    db.userRoleAssignment.createMany({
      data: Array.from(validIds).map(roleId => ({
        userId: target.id,
        roleId,
        assignedBy: actor.id,
      })),
      skipDuplicates: true,
    }),
  ]);

  const assignments = await db.userRoleAssignment.findMany({
    where: { userId: target.id },
    include: { role: { select: { id: true, name: true, slug: true, color: true, icon: true } } },
  });

  return NextResponse.json({ ok: true, assignments });
}
