import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';
import AdminMachinesClient from './AdminMachinesClient';

export const dynamic = 'force-dynamic';

export default async function AdminMachines() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  // Exclude super admin's own org — only show real registered user organizations
  const superAdminOrgId = await getSuperAdminOrgId();
  const excludeOrgData = superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {};

  const machines = await safeQuery(
    db.machine.findMany({
      where: excludeOrgData,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true, plan: true } },
        _count: { select: { workOrders: true, alerts: true, maintenanceTasks: true } },
      },
    }),
    []
  );

  // Serialize dates for client component
  const serialized = machines.map(m => ({
    ...m,
    totalHours: Number(m.totalHours),
    lastServiceAt: m.lastServiceAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return <AdminMachinesClient machines={serialized as any} />;
}