import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import QRLabelsClient from './QRLabelsClient';

export const metadata = {
  title: 'QR Labels — Myncel CMMS',
  description: 'Print QR code stickers for your equipment.',
};

export default async function QRLabelsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const machines = await prisma.machine.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, serialNumber: true, category: true, status: true, location: true, manufacturer: true, model: true },
    orderBy: { name: 'asc' },
  });

  return <QRLabelsClient machines={machines} />;
}