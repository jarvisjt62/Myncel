import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import OrgDashboardClient from './OrgDashboardClient';

export const dynamic = 'force-dynamic';

export default async function OrgDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/signin?callbackUrl=/org/dashboard');

  // Get the current user with org info
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          plan: true,
          industry: true,
        },
      },
    },
  });

  if (!user?.organizationId || !user.organization) {
    redirect('/dashboard');
  }

  // Only OWNER and ADMIN can access org dashboard
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const orgId = user.organizationId;
  const now = new Date();

  // Parallel data fetching
  const [
    teamMembers,
    pendingInvites,
    machines,
    openWorkOrders,
    overdueWorkOrders,
    activeAlerts,
    criticalAlerts,
    recentWorkOrders,
    sensorReadings24h,
    breakdownMachines,
  ] = await Promise.all([
    db.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true, name: true, email: true, role: true,
        lastLoginAt: true, createdAt: true,
        workOrders: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          select: { id: true },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    }),
    db.inviteToken.findMany({
      where: { organizationId: orgId, used: false, expires: { gt: now } },
      include: { invitedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.machine.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, status: true, location: true },
      orderBy: { name: 'asc' },
    }),
    db.workOrder.count({
      where: { organizationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
    db.workOrder.count({
      where: {
        organizationId: orgId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueAt: { lt: now },
      },
    }),
    db.alert.count({ where: { organizationId: orgId, isResolved: false } }),
    db.alert.count({ where: { organizationId: orgId, isResolved: false, severity: { in: ['CRITICAL', 'HIGH'] } } }),
    db.workOrder.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        machine: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    db.sensorReading.count({
      where: {
        machine: { organizationId: orgId },
        recordedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    db.machine.count({ where: { organizationId: orgId, status: 'BREAKDOWN' } }),
  ]);

  const serialized = {
    user: { ...user, organization: { ...user.organization } },
    teamMembers: teamMembers.map(m => ({
      ...m,
      lastLoginAt: m.lastLoginAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      activeWorkOrders: m.workOrders.length,
    })),
    pendingInvites: pendingInvites.map(i => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expires: i.expires.toISOString(),
      createdAt: i.createdAt.toISOString(),
      invitedBy: i.invitedBy,
    })),
    machines: machines.map(m => ({ ...m })),
    stats: {
      totalMembers: teamMembers.length,
      openWorkOrders,
      overdueWorkOrders,
      activeAlerts,
      criticalAlerts,
      sensorReadings24h,
      breakdownMachines,
    },
    recentWorkOrders: recentWorkOrders.map(wo => ({
      id: wo.id,
      woNumber: wo.woNumber,
      title: wo.title,
      status: wo.status,
      priority: wo.priority,
      dueAt: wo.dueAt?.toISOString() ?? null,
      machine: wo.machine,
      assignedTo: wo.assignedTo,
      createdAt: wo.createdAt.toISOString(),
    })),
  };

  return <OrgDashboardClient data={serialized} />;
}