import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import AdminOrgBillingClient from './AdminOrgBillingClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { orgId: string } }) {
  const org = await db.organization.findUnique({ where: { id: params.orgId } });
  return { title: `${org?.name ?? 'Org'} — Billing Admin` };
}

export default async function AdminOrgBillingPage({ params }: { params: { orgId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') redirect('/admin');

  const org = await db.organization.findUnique({
    where: { id: params.orgId },
    include: {
      _count: { select: { users: true, machines: true, workOrders: true } },
      users: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!org) notFound();

  // Fetch recent audit logs for this organization
  const auditLogs = await db.auditLog.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { user: { select: { name: true, email: true } } },
  });

  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY);

  return (
    <AdminOrgBillingClient
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
        stripeCustomerId: org.stripeCustomerId ?? null,
        stripeSubscriptionId: org.stripeSubscriptionId ?? null,
        stripePriceId: org.stripePriceId ?? null,
        subscriptionStatus: org.subscriptionStatus ?? null,
        currentPeriodEnd: org.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: org.cancelAtPeriodEnd,
        createdAt: org.createdAt.toISOString(),
        userCount: org._count.users,
        machineCount: org._count.machines,
        workOrderCount: org._count.workOrders,
        users: org.users.map(u => ({
          id: u.id,
          name: u.name ?? 'Unknown',
          email: u.email,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
        })),
      }}
      auditLogs={auditLogs.map(l => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId ?? null,
        changes: l.changes ? JSON.stringify(l.changes) : null,
        createdAt: l.createdAt.toISOString(),
        userName: l.user?.name ?? l.user?.email ?? null,
      }))}
      stripeConfigured={stripeConfigured}
    />
  );
}