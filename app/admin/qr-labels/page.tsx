import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import QRLabelsClient from '@/app/equipment/qr-labels/QRLabelsClient';

export const metadata = {
  title: 'QR Labels — Myncel Admin',
};

export default async function AdminQRLabelsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  // For admin, fetch all machines (or org-specific if organizationId is available)
  const machines = await prisma.machine.findMany({
    where: session.user.organizationId
      ? { organizationId: session.user.organizationId }
      : undefined,
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
  });

  return <QRLabelsClient machines={machines} />;
}