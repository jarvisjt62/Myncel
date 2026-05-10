import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { safeQuery, getSuperAdminOrgId } from '@/lib/admin-helpers';
import AdminAlertsClient from './AdminAlertsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAlerts() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  // Exclude super admin's own org — only show real registered user organizations
  const superAdminOrgId = await getSuperAdminOrgId();
  const excludeOrgData = superAdminOrgId ? { organizationId: { not: superAdminOrgId } } : {};

  const alerts = await safeQuery(
    db.alert.findMany({
      where: excludeOrgData,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        machine: { select: { name: true } },
        organization: { select: { name: true, plan: true } },
      },
    }),
    []
  );

  // Serialize dates for client component
  const serialized = alerts.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    resolvedAt: a.resolvedAt?.toISOString() ?? null,
  }));

  return <AdminAlertsClient alerts={serialized as any} />;
}