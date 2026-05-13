import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery } from '@/lib/admin-helpers';
import AdminRolesClient from './AdminRolesClient';

export const dynamic = 'force-dynamic';

export default async function AdminRolesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin?callbackUrl=/admin/roles');
  if (session.user.email !== 'admin@myncel.com') redirect('/dashboard');

  const [roles, permissions, organizations] = await Promise.all([
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
  ]);

  return (
    <AdminRolesClient
      initialRoles={roles as any}
      permissions={permissions as any}
      organizations={organizations as any}
    />
  );
}
