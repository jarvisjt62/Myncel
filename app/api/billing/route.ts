import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { stripe, BILLING_PLANS, getPlanById } from '@/lib/stripe';
import { getEffectivePlan } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

// GET /api/billing  —  fetch current billing status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
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

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const planData = getPlanById(org.plan);
    const now = new Date();

    // Trial-end self-correction (same logic as app/settings/billing/page.tsx).
    // Recomputes trialEndsAt = createdAt + platform.trialDays if the stored
    // value drifted forward by more than 1 day (e.g. from a buggy retroactive
    // admin-settings update).
    let trialEndsAt: Date | null = org.trialEndsAt;
    if (org.plan === 'TRIAL' || org.plan === 'TRIAL_RESTRICTED') {
      let trialDays = 14;
      try {
        const setting = await prisma.adminSetting.findUnique({ where: { key: 'platform.trialDays' } });
        if (setting?.value) {
          const parsed = JSON.parse(setting.value);
          if (typeof parsed === 'number' && parsed > 0) trialDays = parsed;
        }
      } catch {}
      const correctEnd = new Date(org.createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
      if (!trialEndsAt || trialEndsAt.getTime() - correctEnd.getTime() > 24 * 60 * 60 * 1000) {
        trialEndsAt = correctEnd;
        prisma.organization
          .update({ where: { id: org.id }, data: { trialEndsAt: correctEnd } })
          .catch(err => console.error('[api/billing] auto-correct trialEndsAt failed:', err));
      }
    }

    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const isTrialExpired = org.plan === 'TRIAL' && trialEndsAt && trialEndsAt < now;
    const effectivePlan = getEffectivePlan(org.plan, trialEndsAt);

    return NextResponse.json({
      plan: org.plan,
      effectivePlan,
      planData,
      trialEndsAt,
      trialDaysLeft,
      isTrialExpired,
      subscriptionStatus: org.subscriptionStatus,
      currentPeriodEnd: org.currentPeriodEnd,
      cancelAtPeriodEnd: org.cancelAtPeriodEnd,
      hasStripe: !!org.stripeCustomerId,
      usage: {
        machines: org._count.machines,
        users: org._count.users,
        workOrders: org._count.workOrders,
      },
      plans: BILLING_PLANS,
    });
  } catch (error) {
    console.error('Billing GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 });
  }
}