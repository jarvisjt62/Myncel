import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import AdminQRLabelsClient from './AdminQRLabelsClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'QR Labels — Myncel Admin',
};

export default async function AdminQRLabelsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  // Fetch all organizations with their machines
  const organizations = await db.organization.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      machines: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          category: true,
          status: true,
          location: true,
          manufacturer: true,
          model: true,
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return <AdminQRLabelsClient organizations={organizations} />;
}