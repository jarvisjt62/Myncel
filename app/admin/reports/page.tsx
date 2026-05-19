import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';
import AdminReportsClient from './AdminReportsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReports() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const superAdminOrgId = await getSuperAdminOrgId();
  const excludeOrgData = superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {};

  // Fetch all organizations with their work orders and machines for reporting
  const organizations = await safeQuery(
    db.organization.findMany({
      where: superAdminOrgId ? { id: { not: superAdminOrgId } } : {},
      orderBy: { name: 'asc' },
      include: {
        machines: {
          select: { id: true, name: true, status: true, criticality: true },
        },
        workOrders: {
          select: {
            id: true,
            woNumber: true,
            title: true,
            status: true,
            priority: true,
            type: true,
            laborCost: true,
            partsCost: true,
            totalCost: true,
            currency: true,
            completedAt: true,
            createdAt: true,
          },
        },
        _count: { select: { machines: true, workOrders: true, users: true } },
      },
    }),
    []
  );

  // Serialize dates
  const serialized = organizations.map(org => ({
    ...org,
    workOrders: org.workOrders.map(wo => ({
      ...wo,
      completedAt: wo.completedAt?.toISOString() ?? null,
      createdAt: wo.createdAt.toISOString(),
    })),
  }));

  return <AdminReportsClient organizations={serialized as any} />;
}