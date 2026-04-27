import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { stripe, getPlanById } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// Plan prices in cents for on-the-fly Stripe price creation
const PLAN_PRICES_CENTS: Record<string, { monthly: number; yearly: number; monthlyLabel: string; yearlyLabel: string }> = {
  STARTER:      { monthly: 4900,   yearly: 46800,  monthlyLabel: '$49/month',    yearlyLabel: '$468/year ($39/mo)' },
  GROWTH:       { monthly: 9900,   yearly: 94800,  monthlyLabel: '$99/month',    yearlyLabel: '$948/year ($79/mo)' },
  PROFESSIONAL: { monthly: 24900,  yearly: 238800, monthlyLabel: '$249/month',   yearlyLabel: '$2,388/year ($199/mo)' },
};

// Cache for dynamically created price IDs (in-memory, resets on cold start)
const priceIdCache: Record<string, string> = {};

async function getOrCreateStripePrice(planId: string, interval: 'monthly' | 'yearly'): Promise<string> {
  const cacheKey = `${planId}_${interval}`;

  // 1. Check env vars first
  const envKey = interval === 'yearly'
    ? `STRIPE_${planId}_YEARLY_PRICE_ID`
    : `STRIPE_${planId}_MONTHLY_PRICE_ID`;
  const envPriceId = process.env[envKey];
  if (envPriceId) return envPriceId;

  // 2. Check in-memory cache
  if (priceIdCache[cacheKey]) return priceIdCache[cacheKey];

  // 3. Search existing prices in Stripe
  const plan = getPlanById(planId);
  const nickname = `${plan.name} ${interval === 'yearly' ? 'Yearly' : 'Monthly'}`;

  const existingPrices = await stripe.prices.list({
    active: true,
    limit: 100,
  });

  const existing = existingPrices.data.find(p =>
    p.nickname === nickname ||
    (p.metadata?.planId === planId && p.metadata?.interval === interval)
  );

  if (existing) {
    priceIdCache[cacheKey] = existing.id;
    return existing.id;
  }

  // 4. Create product if needed
  let productId = process.env.STRIPE_PRODUCT_ID;
  if (!productId) {
    const products = await stripe.products.list({ limit: 10 });
    const existingProduct = products.data.find(p => p.name === 'Myncel CMMS' || p.metadata?.app === 'myncel');
    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      const newProduct = await stripe.products.create({
        name: 'Myncel CMMS',
        description: 'Computerized Maintenance Management System',
        metadata: { app: 'myncel' },
      });
      productId = newProduct.id;
    }
  }

  // 5. Create the price
  const prices = PLAN_PRICES_CENTS[planId];
  if (!prices) throw new Error(`No price config for plan ${planId}`);

  const amount = interval === 'yearly' ? prices.yearly : prices.monthly;
  const stripeInterval = interval === 'yearly' ? 'year' : 'month';

  const newPrice = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: 'usd',
    recurring: { interval: stripeInterval },
    nickname,
    metadata: { planId, interval, app: 'myncel' },
  });

  priceIdCache[cacheKey] = newPrice.id;
  console.log(`[Stripe] Created price ${newPrice.id} for ${planId} ${interval}`);
  return newPrice.id;
}

// POST /api/billing/checkout — create Stripe checkout session
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

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
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

    const baseUrl = process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const appUrl = baseUrl.replace(/\/$/, '');

    // If already subscribed, open billing portal instead
    if (org.stripeSubscriptionId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/settings/billing`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    // Get or auto-create Stripe price ID
    const priceId = await getOrCreateStripePrice(planId, billingInterval as 'monthly' | 'yearly');

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/settings/billing?success=true&plan=${planId}`,
      cancel_url: `${appUrl}/settings/billing?canceled=true`,
      subscription_data: {
        metadata: { organizationId: org.id, planId },
      },
      allow_promotion_codes: true,
      metadata: { organizationId: org.id, planId, billingInterval },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to create checkout session',
    }, { status: 500 });
  }
}