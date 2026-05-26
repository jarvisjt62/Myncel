import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import EquipmentDetailClient from './EquipmentDetailClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Equipment — Myncel',
  robots: { index: false },
};

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect('/auth/sign-in');

  const machine = await db.machine
    .findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
      include: {
        site: { select: { id: true, name: true } },
        building: { select: { id: true, name: true } },
        floor: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        _count: {
          select: {
            workOrders: true,
            maintenanceTasks: true,
            alerts: true,
            documents: true,
            sensorReadings: true,
          },
        },
      },
    })
    .catch(() => null);

  if (!machine) notFound();

  // Light-weight serialization (Date → string) so we can pass cleanly to client
  const initial = {
    ...machine,
    createdAt: machine.createdAt.toISOString(),
    updatedAt: machine.updatedAt.toISOString(),
    lastServiceAt: machine.lastServiceAt ? machine.lastServiceAt.toISOString() : null,
  };

  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading equipment…</div>}>
      <EquipmentDetailClient initialMachine={initial as any} />
    </Suspense>
  );
}
