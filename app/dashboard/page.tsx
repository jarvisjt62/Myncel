import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard — Myncel',
  robots: { index: false },
};

async function getDashboardData(organizationId: string) {
  try {
    const [machines, workOrders, maintenanceTasks, alerts, parts, orgUsers] = await Promise.all([
      db.machine.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { workOrders: true, maintenanceTasks: true } },
        },
      }).catch(() => []),
      db.workOrder.findMany({
        where: { organizationId },
        orderBy: [{ createdAt: 'desc' }],
        take: 100,
        include: {
          machine: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
      }).catch(() => []),
      db.maintenanceTask.findMany({
        where: {
          organizationId,
          nextDueAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { nextDueAt: 'asc' },
        take: 5,
        include: { machine: { select: { name: true } } },
      }).catch(() => []),
      db.alert.findMany({
        where: { organizationId, isResolved: false },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        include: { machine: { select: { name: true } } },
      }).catch(() => []),
      db.part.findMany({
        where: { organizationId },
        orderBy: { quantity: 'asc' },
        take: 5,
      }).then(parts => parts.filter(p => p.quantity <= p.minQuantity)).catch(() => []),
      db.user.findMany({
        where: { organizationId },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      }).catch(() => []),
    ]);

    // Compute summary stats
    const criticalMachines = machines.filter((m) => m.status === 'BREAKDOWN').length;
    const warningMachines = machines.filter((m) => m.status === 'MAINTENANCE').length;
    const overdueWOs = workOrders.filter(
      (wo) => wo.dueAt && new Date(wo.dueAt) < new Date() && wo.status !== 'COMPLETED'
    ).length;
    const openWOs = workOrders.filter((w) => w.status === 'OPEN').length;
    const inProgressWOs = workOrders.filter((w) => w.status === 'IN_PROGRESS').length;

    // Total maintenance cost this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    let monthCost = 0;
    try {
      const completedThisMonth = await db.workOrder.findMany({
        where: {
          organizationId,
          status: 'COMPLETED',
          updatedAt: { gte: startOfMonth },
        },
        select: { totalCost: true },
      });
      monthCost = completedThisMonth.reduce((sum, wo) => sum + (wo.totalCost ?? 0), 0);
    } catch {
      // Ignore error for month cost calculation
    }

    return {
      machines,
      workOrders,
      maintenanceTasks,
      alerts,
      orgUsers,
      stats: {
        totalMachines: machines.length,
        criticalMachines,
        warningMachines,
        openWorkOrders: openWOs + inProgressWOs,
        overdueWorkOrders: overdueWOs,
        upcomingTasks: maintenanceTasks.length,
        unresolvedAlerts: alerts.length,
        monthMaintenanceCost: monthCost,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty data structure on error
    return {
      machines: [],
      workOrders: [],
      maintenanceTasks: [],
      alerts: [],
      orgUsers: [],
      parts: [],
      stats: {
        totalMachines: 0,
        criticalMachines: 0,
        warningMachines: 0,
        openWorkOrders: 0,
        overdueWorkOrders: 0,
        upcomingTasks: 0,
        unresolvedAlerts: 0,
        monthMaintenanceCost: 0,
      },
    };
  }
}

export default async function DashboardPage() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error('Error getting session:', error);
    redirect('/signin?error=session');
  }

  if (!session?.user) {
    redirect('/signin');
  }

  // Redirect admin users to admin dashboard
  if (session.user.email === 'admin@myncel.com') {
    redirect('/admin');
  }

  if (!session.user.organizationId) {
    redirect('/onboarding');
  }

  const data = await getDashboardData(session.user.organizationId);

  return (
    <DashboardClient
      user={{
        name: session.user.name ?? 'User',
        email: session.user.email ?? '',
        role: session.user.role ?? 'MEMBER',
        organizationName: session.user.organizationName ?? 'Your Organization',
      }}
      data={data}
    />
  );
}