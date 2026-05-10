import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import AdminIoTSimulatorClient from './AdminIoTSimulatorClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'IoT Simulator — Myncel Admin',
};

export default async function AdminIoTSimulatorPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  // Fetch all organizations for the admin selector
  const organizations = await db.organization.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      machines: {
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return <AdminIoTSimulatorClient organizations={organizations} />;
}