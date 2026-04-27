import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import OrgControlClient from './OrgControlClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { orgId: string } }) {
  const org = await db.organization.findUnique({ where: { id: params.orgId } });
  return { title: `${org?.name ?? 'Org'} — Admin Control` };
}

export default async function AdminOrgControlPage({ params }: { params: { orgId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') redirect('/admin');

  const org = await db.organization.findUnique({
    where: { id: params.orgId },
    include: {
      _count: { select: { users: true, machines: true, workOrders: true, alerts: true, parts: true } },
      users: {
        select: { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true, twoFactorEnabled: true, failedLoginAttempts: true },
        orderBy: { createdAt: 'asc' },
      },
      machines: {
        select: { id: true, name: true, status: true, category: true, location: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      workOrders: {
        select: { id: true, woNumber: true, title: true, status: true, priority: true, createdAt: true, completedAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      alerts: {
        select: { id: true, type: true, title: true, severity: true, isResolved: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      integrations: {
        select: { id: true, type: true, name: true, status: true, createdAt: true },
      },
      webhooks: {
        select: { id: true, name: true, url: true, isActive: true, failureCount: true, lastTriggeredAt: true },
      },
    },
  });

  if (!org) notFound();

  const auditLogs = await db.auditLog.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  }).catch(() => []);

  return (
    <OrgControlClient
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        industry: org.industry,
        size: org.size,
        plan: org.plan,
        trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
        stripeCustomerId: org.stripeCustomerId ?? null,
        stripeSubscriptionId: org.stripeSubscriptionId ?? null,
        subscriptionStatus: org.subscriptionStatus ?? null,
        currentPeriodEnd: org.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: org.cancelAtPeriodEnd,
        isActive: (org as any).isActive ?? true,
        isSuspended: (org as any).isSuspended ?? false,
        adminNotes: (org as any).adminNotes ?? null,
        suspendedReason: (org as any).suspendedReason ?? null,
        suspendedAt: (org as any).suspendedAt?.toISOString() ?? null,
        createdAt: org.createdAt.toISOString(),
        counts: org._count,
        users: org.users.map(u => ({
          id: u.id,
          name: u.name ?? 'Unknown',
          email: u.email,
          role: u.role,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          twoFactorEnabled: u.twoFactorEnabled,
          failedLoginAttempts: u.failedLoginAttempts,
        })),
        machines: org.machines.map(m => ({
          id: m.id,
          name: m.name,
          status: m.status,
          category: m.category,
          location: m.location ?? null,
          createdAt: m.createdAt.toISOString(),
        })),
        workOrders: org.workOrders.map(w => ({
          id: w.id,
          woNumber: w.woNumber,
          title: w.title,
          status: w.status,
          priority: w.priority,
          createdAt: w.createdAt.toISOString(),
          completedAt: w.completedAt?.toISOString() ?? null,
        })),
        alerts: org.alerts.map(a => ({
          id: a.id,
          type: a.type,
          title: a.title,
          severity: a.severity,
          isResolved: a.isResolved,
          createdAt: a.createdAt.toISOString(),
        })),
        integrations: org.integrations.map(i => ({
          id: i.id,
          type: i.type,
          name: i.name,
          status: i.status,
          createdAt: i.createdAt.toISOString(),
        })),
        webhooks: org.webhooks.map(w => ({
          id: w.id,
          name: w.name,
          url: w.url,
          isActive: w.isActive,
          failureCount: w.failureCount,
          lastTriggeredAt: w.lastTriggeredAt?.toISOString() ?? null,
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
    />
  );
}