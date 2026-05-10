import { NextRequest, NextResponse } from 'next/server';

function getPayPalBase(): string {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken(): Promise<{ token: string; debug: any }> {
  // Trim credentials to remove any accidental whitespace/newlines
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const secret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  const baseUrl = getPayPalBase();

  const debug = {
    clientIdLength: clientId?.length || 0,
    clientIdPrefix: clientId ? clientId.substring(0, 8) + '...' : 'NOT SET',
    secretLength: secret?.length || 0,
    secretPrefix: secret ? secret.substring(0, 4) + '...' : 'NOT SET',
    baseUrl,
    mode: process.env.PAYPAL_MODE || 'sandbox',
  };

  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();

  if (!res.ok) {
    // Return debug info even on failure to help troubleshoot
    const errorDetails = {
      error: `PayPal auth failed: ${data.error_description || data.error || JSON.stringify(data)}`,
      debug,
      response: data,
    };
    throw new Error(JSON.stringify(errorDetails));
  }

  return { token: data.access_token, debug };
}

async function getPlanDetails(planId: string, accessToken: string): Promise<any> {
  const res = await fetch(`${getPayPalBase()}/v1/billing/plans/${planId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function testSubscriptionCreation(planId: string, accessToken: string): Promise<any> {
  const requestBody = {
    plan_id: planId,
    application_context: {
      brand_name: 'Myncel',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: 'https://www.myncel.com/settings/billing?paypal_success=1',
      cancel_url: 'https://www.myncel.com/settings/billing?paypal_canceled=1',
    },
  };

  console.log('[PayPal Debug] Testing subscription with body:', JSON.stringify(requestBody, null, 2));

  const res = await fetch(`${getPayPalBase()}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');
    const test = searchParams.get('test');
    const getProduct = searchParams.get('product');

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json({ error: 'PayPal not configured' });
    }

    const result: any = {
      mode: process.env.PAYPAL_MODE || 'sandbox',
      baseUrl: getPayPalBase(),
      clientIdPrefix: process.env.PAYPAL_CLIENT_ID?.substring(0, 10) + '...',
      clientIdLength: process.env.PAYPAL_CLIENT_ID?.length || 0,
      clientIdLastChar: process.env.PAYPAL_CLIENT_ID?.slice(-1) || 'NOT SET',
      clientIdLastCharCode: process.env.PAYPAL_CLIENT_ID?.charCodeAt(process.env.PAYPAL_CLIENT_ID.length - 1) || 0,
      secretLastCharCode: process.env.PAYPAL_CLIENT_SECRET?.charCodeAt(process.env.PAYPAL_CLIENT_SECRET.length - 1) || 0,
      secretLength: process.env.PAYPAL_CLIENT_SECRET?.length || 0,
      secretFirstChar: process.env.PAYPAL_CLIENT_SECRET?.[0] || 'NOT SET',
      secretLastChar: process.env.PAYPAL_CLIENT_SECRET?.slice(-1) || 'NOT SET',
      hasWhitespace: {
        clientIdStart: process.env.PAYPAL_CLIENT_ID?.startsWith(' ') || false,
        clientIdEnd: process.env.PAYPAL_CLIENT_ID?.endsWith(' ') || false,
        secretStart: process.env.PAYPAL_CLIENT_SECRET?.startsWith(' ') || false,
        secretEnd: process.env.PAYPAL_CLIENT_SECRET?.endsWith(' ') || false,
      },
    };

    let authResult;
    try {
      authResult = await getPayPalAccessToken();
      result.authSuccess = true;
      result.authDebug = authResult.debug;
    } catch (authErr: any) {
      result.authSuccess = false;
      try {
        result.authError = JSON.parse(authErr.message);
      } catch {
        result.authError = authErr.message;
      }
      return NextResponse.json(result, { status: 200 });
    }
    const accessToken = authResult.token;

    // Get product details
    if (getProduct === 'true') {
      const productId = 'PROD-5D74937259975394C';
      const productRes = await fetch(`${getPayPalBase()}/v1/catalogs/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const productData = await productRes.json();
      result.product = { status: productRes.status, ok: productRes.ok, data: productData };
    }

    // Test plan IDs - Updated with new PayPal account plan IDs
    const planIdsToTest = planId ? [planId] : [
      'P-8R953147RX554382BNHYLPKQ', // STARTER monthly
      'P-5AE1536429100932DNHYLPRY', // STARTER yearly
      'P-4WN450418T625682YNHYLP2I', // GROWTH monthly
    ];

    result.plans = {};

    for (const pid of planIdsToTest) {
      const planDetails = await getPlanDetails(pid, accessToken);
      result.plans[pid] = planDetails;

      // If test=true, also try creating a subscription
      if (test === 'true' && planDetails.ok) {
        const subTest = await testSubscriptionCreation(pid, accessToken);
        result.plans[pid].subscriptionTest = subTest;
      }
    }

    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    console.error('[PayPal Debug] Error:', err);
    return NextResponse.json({
      error: err.message,
      stack: err.stack,
    }, { status: 500 });
  }
}