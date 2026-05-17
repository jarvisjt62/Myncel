import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import { BILLING_PLANS, getPlanById } from '@/lib/stripe';
import BillingClient from './BillingClient';
import { DEFAULT_SETTINGS } from '@/lib/admin-settings';
import { getEffectivePlan } from '@/lib/plan-limits';

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

  // Read admin gateway settings server-side so they're correct on first render
  const gatewayKeys = [
    'payment.stripe.enabled',
    'payment.paypal.enabled',
    'payment.ach.enabled',
    'payment.applepay.enabled',
    'payment.googlepay.enabled',
  ];
  const dbGateways = await prisma.adminSetting.findMany({
    where: { key: { in: gatewayKeys } },
  }).catch(() => []);
  const gatewayDefaults: Record<string, boolean> = {
    'payment.stripe.enabled': true,
    'payment.paypal.enabled': true,
    'payment.ach.enabled': true,
    'payment.applepay.enabled': true,
    'payment.googlepay.enabled': true,
  };
  const gwMap: Record<string, boolean> = { ...gatewayDefaults };
  for (const s of dbGateways) {
    try { gwMap[s.key] = JSON.parse(s.value); } catch {}
  }
  const activeGateways = {
    stripe:    gwMap['payment.stripe.enabled'],
    paypal:    gwMap['payment.paypal.enabled'],
    ach:       gwMap['payment.ach.enabled'],
    applePay:  gwMap['payment.applepay.enabled'],
    googlePay: gwMap['payment.googlepay.enabled'],
  };

  const now = new Date();

  // ── Trial-end self-correction ──────────────────────────────────────────────
  // The legitimate trial-end is `createdAt + platform.trialDays`. If the stored
  // value drifted forward (e.g. from a buggy retroactive update that used "now"
  // instead of "createdAt"), recompute it on read AND persist the fix so other
  // surfaces (admin dashboards, /api/billing) stay consistent.
  let trialEndsAt: Date | null = org.trialEndsAt;
  if (org.plan === 'TRIAL' || org.plan === 'TRIAL_RESTRICTED') {
    const trialDaysSetting = await prisma.adminSetting
      .findUnique({ where: { key: 'platform.trialDays' } })
      .catch(() => null);
    let trialDays = (DEFAULT_SETTINGS as any)['platform.trialDays']?.value ?? 14;
    if (trialDaysSetting?.value) {
      try {
        const parsed = JSON.parse(trialDaysSetting.value);
        if (typeof parsed === 'number' && parsed > 0) trialDays = parsed;
      } catch {}
    }
    const correctEnd = new Date(org.createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
    // Only correct if the stored value is MORE than 1 day later than correct.
    // (Drifting backward is fine — could be a manual admin extension cancellation.)
    if (!trialEndsAt || trialEndsAt.getTime() - correctEnd.getTime() > 24 * 60 * 60 * 1000) {
      trialEndsAt = correctEnd;
      // Persist so the next read is already clean (best-effort, non-blocking).
      prisma.organization
        .update({ where: { id: org.id }, data: { trialEndsAt: correctEnd } })
        .catch(err => console.error('[billing] auto-correct trialEndsAt failed:', err));
    }
  }

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isTrialExpired = (org.plan === 'TRIAL' || org.plan === 'TRIAL_RESTRICTED') && trialEndsAt ? trialEndsAt < now : false;
  // effectivePlan: active TRIAL → 'GROWTH', expired TRIAL → 'TRIAL_RESTRICTED', others unchanged
  const effectivePlan = getEffectivePlan(org.plan, trialEndsAt ?? null);

  return (
    <BillingClient
      orgId={org.id}
      orgName={org.name}
      plan={org.plan}
      effectivePlan={effectivePlan}
      planData={getPlanById(org.plan)}
      trialEndsAt={trialEndsAt?.toISOString() || null}
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
      initialGateways={activeGateways}
    />
  );
}