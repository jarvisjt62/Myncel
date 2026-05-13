import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery } from '@/lib/admin-helpers';
import AdminPermissionsClient from './AdminPermissionsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPermissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin?callbackUrl=/admin/permissions');
  if (session.user.email !== 'admin@myncel.com') redirect('/dashboard');

  const permissions = await safeQuery(
    db.permission.findMany({
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
      include: { _count: { select: { roles: true } } },
    }),
    []
  );

  return <AdminPermissionsClient initialPermissions={permissions as any} />;
}
