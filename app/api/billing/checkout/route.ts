import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { stripe, getPlanById } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// POST /api/billing/checkout  — create Stripe checkout session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only OWNER/ADMIN can manage billing
    if (!['OWNER', 'ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { planId, billingInterval = 'monthly' } = await req.json();

    const plan = getPlanById(planId);
    if (!plan || plan.id === 'TRIAL' || plan.id === 'ENTERPRISE') {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const priceId = billingInterval === 'yearly'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly;

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      // Demo mode - return mock success
      return NextResponse.json({
        demo: true,
        message: 'Stripe not configured. Add STRIPE_SECRET_KEY to enable real payments.',
        planId,
        billingInterval,
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || '',
        name: org.name,
        metadata: {
          organizationId: org.id,
          userId: session.user.id || '',
        },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // If already subscribed, create billing portal session instead
    if (org.stripeSubscriptionId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/settings/billing`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/settings/billing?success=true&plan=${planId}`,
      cancel_url: `${baseUrl}/settings/billing?canceled=true`,
      subscription_data: {
        metadata: {
          organizationId: org.id,
          planId,
        },
        trial_period_days: org.stripeSubscriptionId ? undefined : 0, // No trial if upgrading
      },
      allow_promotion_codes: true,
      metadata: {
        organizationId: org.id,
        planId,
        billingInterval,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}