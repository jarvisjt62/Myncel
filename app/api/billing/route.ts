import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { stripe, BILLING_PLANS, getPlanById } from '@/lib/stripe';

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
    const trialDaysLeft = org.trialEndsAt
      ? Math.max(0, Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const isTrialExpired = org.plan === 'TRIAL' && org.trialEndsAt && org.trialEndsAt < now;

    return NextResponse.json({
      plan: org.plan,
      planData,
      trialEndsAt: org.trialEndsAt,
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