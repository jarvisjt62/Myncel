import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import { BILLING_PLANS, getPlanById } from '@/lib/stripe';
import BillingClient from './BillingClient';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const isAdmin = ['OWNER', 'ADMIN'].includes(session.user.role || '');
  if (!isAdmin) redirect('/settings');

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId! },
    select: {
      id: true,
      name: true,
      plan: true,
      trialEndsAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      createdAt: true,
      _count: {
        select: {
          machines: true,
          users: true,
          workOrders: true,
        },
      },
    },
  });

  if (!org) redirect('/settings');

  const now = new Date();
  const trialDaysLeft = org.trialEndsAt
    ? Math.max(0, Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isTrialExpired = org.plan === 'TRIAL' && org.trialEndsAt ? org.trialEndsAt < now : false;

  return (
    <BillingClient
      orgId={org.id}
      orgName={org.name}
      plan={org.plan}
      planData={getPlanById(org.plan)}
      trialEndsAt={org.trialEndsAt?.toISOString() || null}
      trialDaysLeft={trialDaysLeft}
      isTrialExpired={isTrialExpired}
      subscriptionStatus={org.subscriptionStatus}
      currentPeriodEnd={org.currentPeriodEnd?.toISOString() || null}
      cancelAtPeriodEnd={org.cancelAtPeriodEnd}
      hasStripe={!!org.stripeCustomerId}
      usage={{
        machines: org._count.machines,
        users: org._count.users,
        workOrders: org._count.workOrders,
      }}
      plans={BILLING_PLANS as any}
      userRole={session.user.role || ''}
      stripeConfigured={!!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder')}
    />
  );
}