import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';
import AdminSchedulesClient from './AdminSchedulesClient';

export const dynamic = 'force-dynamic';

export default async function AdminSchedules() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  // Exclude super admin's own org — only show real registered user organizations
  const superAdminOrgId = await getSuperAdminOrgId();
  const excludeOrgData = superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {};

  const tasks = await safeQuery(
    db.maintenanceTask.findMany({
      where: excludeOrgData,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        machine: { select: { name: true } },
        organization: { select: { name: true, plan: true } },
      },
    }),
    []
  );

  // Serialize dates for client component
  const serialized = tasks.map(t => ({
    ...t,
    nextDueAt: t.nextDueAt?.toISOString() ?? null,
    lastCompletedAt: t.lastCompletedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <AdminSchedulesClient tasks={serialized as any} />;
}