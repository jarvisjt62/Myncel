import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PayPal plan IDs mapped from env vars
const PAYPAL_PLAN_IDS: Record<string, Record<string, string | undefined>> = {
  STARTER:      { monthly: process.env.PAYPAL_PLAN_STARTER_MONTHLY,      yearly: process.env.PAYPAL_PLAN_STARTER_YEARLY },
  GROWTH:       { monthly: process.env.PAYPAL_PLAN_GROWTH_MONTHLY,        yearly: process.env.PAYPAL_PLAN_GROWTH_YEARLY },
  PROFESSIONAL: { monthly: process.env.PAYPAL_PLAN_PROFESSIONAL_MONTHLY,  yearly: process.env.PAYPAL_PLAN_PROFESSIONAL_YEARLY },
  ENTERPRISE:   { monthly: process.env.PAYPAL_PLAN_ENTERPRISE_MONTHLY,    yearly: process.env.PAYPAL_PLAN_ENTERPRISE_YEARLY },
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  STARTER:      { monthly: 49,  yearly: 39 },
  GROWTH:       { monthly: 99,  yearly: 79 },
  PROFESSIONAL: { monthly: 249, yearly: 199 },
};

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret   = process.env.PAYPAL_CLIENT_SECRET!;
  const base     = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error('Failed to get PayPal access token');
  const data = await res.json();
  return data.access_token;
}

async function createPayPalSubscription(
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  accessToken: string
): Promise<{ id: string; approveUrl: string }> {
  const base = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${base}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: 'Myncel',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Failed to create PayPal subscription');
  }

  const data = await res.json();
  const approveUrl = data.links?.find((l: any) => l.rel === 'approve')?.href;
  if (!approveUrl) throw new Error('No PayPal approval URL returned');

  return { id: data.id, approveUrl };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId, billingInterval = 'monthly' } = await req.json();
  if (!planId || planId === 'TRIAL') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Demo mode — PayPal not configured
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return NextResponse.json({ demo: true, message: 'PayPal not configured' });
  }

  const paypalPlanId = PAYPAL_PLAN_IDS[planId]?.[billingInterval];

  // If no pre-created PayPal plan ID, fall back to one-time order approach
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const returnUrl = `${appUrl}/settings/billing?paypal_success=1&plan=${planId}`;
  const cancelUrl = `${appUrl}/settings/billing?paypal_canceled=1`;

  try {
    const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
    });
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    if (paypalPlanId) {
      // Use pre-created PayPal subscription plan
      const accessToken = await getPayPalAccessToken();
      const { approveUrl } = await createPayPalSubscription(paypalPlanId, returnUrl, cancelUrl, accessToken);
      return NextResponse.json({ url: approveUrl });
    } else {
      // Fallback: Create a PayPal one-time payment order (for demo or missing plan IDs)
      const accessToken = await getPayPalAccessToken();
      const base = process.env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

      const price = PLAN_PRICES[planId]?.[billingInterval as 'monthly' | 'yearly'] ?? 0;

      const res = await fetch(`${base}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            description: `Myncel ${planId} Plan (${billingInterval})`,
            amount: {
              currency_code: 'USD',
              value: price.toString(),
            },
            custom_id: `${org.id}:${planId}:${billingInterval}`,
          }],
          application_context: {
            brand_name: 'Myncel',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to create PayPal order');
      }

      const order = await res.json();
      const approveUrl = order.links?.find((l: any) => l.rel === 'approve')?.href;
      if (!approveUrl) throw new Error('No approval URL from PayPal');

      return NextResponse.json({ url: approveUrl });
    }
  } catch (err: any) {
    console.error('PayPal checkout error:', err);
    return NextResponse.json({ error: err.message ?? 'PayPal checkout failed' }, { status: 500 });
  }
}