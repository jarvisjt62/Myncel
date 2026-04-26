import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import UserHMIClient from './UserHMIClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'HMI Monitor — Myncel',
  robots: { index: false },
};

export default async function UserHMIPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/signin');
  if (!session.user.organizationId) redirect('/onboarding');

  const orgId = session.user.organizationId;

  const machines = await db.machine.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      status: true,
      criticality: true,
      category: true,
      location: true,
      totalHours: true,
      model: true,
      manufacturer: true,
      organizationId: true,
      organization: {
        select: { id: true, name: true },
      },
      _count: { select: { workOrders: true, alerts: true, maintenanceTasks: true } },
      alerts: {
        where: { isResolved: false },
        orderBy: { severity: 'desc' },
        take: 3,
        select: { id: true, title: true, severity: true, type: true },
      },
    },
  });

  // Derive the actual organization name from the machines (or fall back to session)
  // This ensures the nav bar shows the correct customer org name, not any cached session value
  const orgFromDB = machines.length > 0
    ? (machines[0].organization?.name ?? session.user.organizationName ?? 'Your Organization')
    : (session.user.organizationName ?? 'Your Organization');

  return (
    <UserHMIClient
      user={{
        name: session.user.name ?? 'User',
        organizationName: orgFromDB,
      }}
      initialMachines={machines}
    />
  );
}