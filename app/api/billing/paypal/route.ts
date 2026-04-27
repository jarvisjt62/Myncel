import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PayPal live plan IDs — hardcoded + env var overrides
// Updated with correct plan IDs from PayPal Dashboard (April 2026)
const PAYPAL_PLAN_IDS: Record<string, Record<string, string | undefined>> = {
  STARTER: {
    monthly: process.env.PAYPAL_PLAN_STARTER_MONTHLY || 'P-3Td0b7bkEcA59j01EtHrXZ5JQ',
    yearly:  process.env.PAYPAL_PLAN_STARTER_YEARLY  || 'P-2RD0884sqN0282jZ4NHX24VQ',
  },
  GROWTH: {
    monthly: process.env.PAYPAL_PLAN_GROWTH_MONTHLY  || 'P-5YB75t7dFjCh53z1dex7NhSXAYl',
    yearly:  process.env.PAYPAL_PLAN_GROWTH_YEARLY   || 'P-cRX530q97f86sBQJsA5NHX3BBI',
  },
  PROFESSIONAL: {
    monthly: process.env.PAYPAL_PLAN_PROFESSIONAL_MONTHLY || 'P-7619036280j12g05LpHtX1BRQ',
    yearly:  process.env.PAYPAL_PLAN_PROFESSIONAL_YEARLY  || 'P-39Q15WQ5FPR363q6xBNHXSBZQ',
  },
  ENTERPRISE: {
    monthly: process.env.PAYPAL_PLAN_ENTERPRISE_MONTHLY,
    yearly:  process.env.PAYPAL_PLAN_ENTERPRISE_YEARLY,
  },
};

function getAppUrl(): string {
  // Priority: NEXTAUTH_URL (must be production URL) > VERCEL_URL > localhost
  const url = process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return url.replace(/\/$/, '');
}

function getPayPalBase(): string {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;

  const res = await fetch(`${getPayPalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`PayPal auth failed: ${err.error_description || 'Invalid credentials'}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function createPayPalSubscription(
  paypalPlanId: string,
  returnUrl: string,
  cancelUrl: string,
  accessToken: string,
  orgId: string,
  planId: string,
): Promise<string> {
  console.log('[PayPal] Creating subscription for plan:', paypalPlanId);
  
  const res = await fetch(`${getPayPalBase()}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      plan_id: paypalPlanId,
      custom_id: `${orgId}:${planId}`,
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
    console.error('[PayPal] Subscription creation failed:', JSON.stringify(err, null, 2));
    throw new Error(err.message || err.details?.[0]?.description || 'Failed to create PayPal subscription');
  }

  const data = await res.json();
  console.log('[PayPal] Subscription created:', data.id);
  const approveUrl = data.links?.find((l: any) => l.rel === 'approve')?.href;
  if (!approveUrl) throw new Error('No PayPal approval URL returned');
  return approveUrl;
}

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

    if (!planId || planId === 'TRIAL' || planId === 'ENTERPRISE') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Demo mode — PayPal not configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json({
        demo: true,
        message: 'PayPal not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to enable.',
      });
    }

    const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
    });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const appUrl = getAppUrl();
    const returnUrl = `${appUrl}/settings/billing?paypal_success=1&plan=${planId}`;
    const cancelUrl = `${appUrl}/settings/billing?paypal_canceled=1`;

    const paypalPlanId = PAYPAL_PLAN_IDS[planId]?.[billingInterval];
    if (!paypalPlanId) {
      return NextResponse.json({
        error: `PayPal plan not configured for ${planId} (${billingInterval}).`,
      }, { status: 400 });
    }

    console.log("[PayPal] Checkout request - Plan:", planId, "Interval:", billingInterval, "PayPal Plan ID:", paypalPlanId);
      console.log("[PayPal] Mode:", process.env.PAYPAL_MODE || "sandbox");
      console.log("[PayPal] Base URL:", getPayPalBase());

      const accessToken = await getPayPalAccessToken();
    const approveUrl = await createPayPalSubscription(
      paypalPlanId,
      returnUrl,
      cancelUrl,
      accessToken,
      org.id,
      planId,
    );

    return NextResponse.json({ url: approveUrl });

  } catch (err: any) {
    console.error('PayPal checkout error:', err);
    return NextResponse.json({
      error: err.message || 'PayPal checkout failed',
    }, { status: 500 });
  }
}