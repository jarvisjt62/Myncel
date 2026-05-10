import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// VERSION: 2026-04-27-v5 (New PayPal account plan IDs)

// PayPal live plan IDs — hardcoded + env var overrides
// Updated with plan IDs from NEW PayPal Business Account (April 2026)
const PAYPAL_PLAN_IDS: Record<string, Record<string, string | undefined>> = {
  STARTER: {
    monthly: process.env.PAYPAL_PLAN_STARTER_MONTHLY || 'P-8R953147RX554382BNHYLPKQ',
    yearly:  process.env.PAYPAL_PLAN_STARTER_YEARLY  || 'P-5AE1536429100932DNHYLPRY',
  },
  GROWTH: {
    monthly: process.env.PAYPAL_PLAN_GROWTH_MONTHLY  || 'P-4WN450418T625682YNHYLP2I',
    yearly:  process.env.PAYPAL_PLAN_GROWTH_YEARLY   || 'P-8H1163236C743953ENHYLQBA',
  },
  PROFESSIONAL: {
    monthly: process.env.PAYPAL_PLAN_PROFESSIONAL_MONTHLY || 'P-5MW1238075860725TNHYLQIA',
    yearly:  process.env.PAYPAL_PLAN_PROFESSIONAL_YEARLY  || 'P-2M071923KF098105PNHYLQOY',
  },
  ENTERPRISE: {
    monthly: process.env.PAYPAL_PLAN_ENTERPRISE_MONTHLY,
    yearly:  process.env.PAYPAL_PLAN_ENTERPRISE_YEARLY,
  },
};

function getAppUrl(): string {
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
  // Trim credentials to remove any accidental whitespace/newlines
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const secret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();

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

// GET endpoint to verify deployed version and plan IDs
export async function GET(req: NextRequest) {
  return NextResponse.json({
    version: '2026-04-27-v5',
    mode: process.env.PAYPAL_MODE || 'sandbox',
    planIds: {
      STARTER: {
        monthly: PAYPAL_PLAN_IDS.STARTER?.monthly,
        yearly: PAYPAL_PLAN_IDS.STARTER?.yearly,
      },
      GROWTH: {
        monthly: PAYPAL_PLAN_IDS.GROWTH?.monthly,
        yearly: PAYPAL_PLAN_IDS.GROWTH?.yearly,
      },
      PROFESSIONAL: {
        monthly: PAYPAL_PLAN_IDS.PROFESSIONAL?.monthly,
        yearly: PAYPAL_PLAN_IDS.PROFESSIONAL?.yearly,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`\n========== PayPal Request ${requestId} ==========`);
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      console.log(`[${requestId}] ERROR: Unauthorized`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['OWNER', 'ADMIN'].includes(session.user.role || '')) {
      console.log(`[${requestId}] ERROR: Insufficient permissions`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const requestBody = await req.json();
    const { planId, billingInterval = 'monthly' } = requestBody;
    
    console.log(`[${requestId}] Incoming request body:`, JSON.stringify(requestBody));
    console.log(`[${requestId}] Parsed - planId: "${planId}", billingInterval: "${billingInterval}"`);

    if (!planId || planId === 'TRIAL' || planId === 'ENTERPRISE') {
      console.log(`[${requestId}] ERROR: Invalid plan`);
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.log(`[${requestId}] ERROR: PayPal not configured`);
      return NextResponse.json({
        demo: true,
        message: 'PayPal not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to enable.',
      });
    }

    const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
    });
    if (!org) {
      console.log(`[${requestId}] ERROR: Organization not found`);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const appUrl = getAppUrl();
    const returnUrl = `${appUrl}/settings/billing?paypal_success=1&plan=${planId}`;
    const cancelUrl = `${appUrl}/settings/billing?paypal_canceled=1`;

    const paypalPlanId = PAYPAL_PLAN_IDS[planId]?.[billingInterval];
    console.log(`[${requestId}] Plan lookup: PAYPAL_PLAN_IDS["${planId}"]["${billingInterval}"] = "${paypalPlanId}"`);
    console.log(`[${requestId}] Full PAYPAL_PLAN_IDS object:`, JSON.stringify(PAYPAL_PLAN_IDS));
    
    if (!paypalPlanId) {
      console.log(`[${requestId}] ERROR: PayPal plan not configured`);
      return NextResponse.json({
        error: `PayPal plan not configured for ${planId} (${billingInterval}).`,
      }, { status: 400 });
    }

    console.log(`[${requestId}] Mode: ${process.env.PAYPAL_MODE || 'sandbox'}`);
    console.log(`[${requestId}] Base URL: ${getPayPalBase()}`);

    const accessToken = await getPayPalAccessToken();
    console.log(`[${requestId}] Access token obtained successfully`);

    // Build the subscription request
    const subscriptionRequestBody = {
      plan_id: paypalPlanId,
      custom_id: `${org.id}:${planId}`,
      application_context: {
        brand_name: 'Myncel',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    console.log(`[${requestId}] Subscription request body:`, JSON.stringify(subscriptionRequestBody, null, 2));

    const paypalRes = await fetch(`${getPayPalBase()}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(subscriptionRequestBody),
    });

    const responseData = await paypalRes.json();
    console.log(`[${requestId}] PayPal response status: ${paypalRes.status}`);
    console.log(`[${requestId}] PayPal response:`, JSON.stringify(responseData, null, 2));

    if (!paypalRes.ok) {
      console.error(`[${requestId}] ERROR: PayPal subscription creation failed`);
      const errorMessage = responseData.message ||
                           responseData.details?.[0]?.description ||
                           responseData.details?.[0]?.issue ||
                           'Failed to create PayPal subscription';
      return NextResponse.json({
        error: `PayPal Error: ${errorMessage}`,
        requestId,
        planId,
        billingInterval,
        paypalPlanId,
        paypalResponse: responseData,
      }, { status: 500 });
    }

    const approveUrl = responseData.links?.find((l: any) => l.rel === 'approve')?.href;
    if (!approveUrl) {
      console.error(`[${requestId}] ERROR: No approval URL returned`);
      return NextResponse.json({ error: 'No PayPal approval URL returned' }, { status: 500 });
    }

    console.log(`[${requestId}] SUCCESS: Subscription created, approve URL: ${approveUrl}`);
    return NextResponse.json({ 
      url: approveUrl,
      // Debug info
      debug: {
        requestId,
        planId,
        billingInterval,
        paypalPlanId,
        subscriptionId: responseData.id,
      }
    });

  } catch (err: any) {
    console.error(`[${requestId}] EXCEPTION:`, err);
    return NextResponse.json({
      error: err.message || 'PayPal checkout failed',
      requestId,
    }, { status: 500 });
  }
}