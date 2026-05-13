import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery } from '@/lib/admin-helpers';
import AdminRolesClient from './AdminRolesClient';

export const dynamic = 'force-dynamic';

const ENUM_FOR_SLUG: Record<string, string> = {
  owner: 'OWNER', admin: 'ADMIN', technician: 'TECHNICIAN',
  operator: 'OPERATOR', employee: 'EMPLOYEE', member: 'MEMBER',
};

export default async function AdminRolesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin?callbackUrl=/admin/roles');
  if (session.user.email !== 'admin@myncel.com') redirect('/dashboard');

  const [rolesRaw, permissions, organizations, enumCounts] = await Promise.all([
    safeQuery(
      db.role.findMany({
        orderBy: [{ isSystem: 'desc' }, { isGlobal: 'desc' }, { name: 'asc' }],
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          permissions: { select: { permission: { select: { id: true, key: true, category: true, label: true } } } },
          _count: { select: { assignments: true } },
        },
      }),
      []
    ),
    safeQuery(
      db.permission.findMany({ orderBy: [{ category: 'asc' }, { label: 'asc' }] }),
      []
    ),
    safeQuery(
      db.organization.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      []
    ),
    // Legacy-enum counts so system roles show the users who haven't been
    // explicitly assigned via the new UserRoleAssignment table yet.
    safeQuery(
      db.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
      [] as { role: string; _count: { _all: number } }[]
    ),
  ]);

  const enumCountMap = new Map<string, number>(
    (enumCounts as any[]).map(r => [r.role, r._count._all])
  );

  // Blend the two sources:
  //   - For SYSTEM roles, effective members = explicit UserRoleAssignment rows
  //     UNION users whose legacy UserRole enum equals the matching role.
  //   - For non-system roles, member count stays as-is (only explicit assignments).
  // We also count per-org breakdown for system roles if the admin wants it later.
  const roles = (rolesRaw as any[]).map(r => {
    let effective = r._count.assignments;
    if (r.isSystem) {
      const enumVal = ENUM_FOR_SLUG[r.slug];
      const legacy = enumVal ? (enumCountMap.get(enumVal) ?? 0) : 0;
      effective = Math.max(effective, legacy); // never show less than explicit assignments
    }
    return { ...r, _count: { ...r._count, assignments: effective } };
  });

  return (
    <AdminRolesClient
      initialRoles={roles as any}
      permissions={permissions as any}
      organizations={organizations as any}
    />
  );
}
