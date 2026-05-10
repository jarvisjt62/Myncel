import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';
import AdminWorkOrdersClient from './AdminWorkOrdersClient';

export const dynamic = 'force-dynamic';

export default async function AdminWorkOrders() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  // Exclude super admin's own org — only show real registered user organizations
  const superAdminOrgId = await getSuperAdminOrgId();
  const excludeOrgData = superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {};

  const workOrders = await safeQuery(
    db.workOrder.findMany({
      where: excludeOrgData,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        machine: { select: { name: true } },
        organization: { select: { name: true, plan: true } },
        assignedTo: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    []
  );

  // Serialize dates for client component
  const serialized = workOrders.map(wo => ({
    ...wo,
    dueAt: wo.dueAt?.toISOString() ?? null,
    completedAt: wo.completedAt?.toISOString() ?? null,
    startedAt: wo.startedAt?.toISOString() ?? null,
    createdAt: wo.createdAt.toISOString(),
    updatedAt: wo.updatedAt.toISOString(),
  }));

  return <AdminWorkOrdersClient workOrders={serialized as any} />;
}