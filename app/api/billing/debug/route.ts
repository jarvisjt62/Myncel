import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// GET /api/billing/debug - check billing configuration (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  const paypalId  = process.env.PAYPAL_CLIENT_ID || '';
  const paypalSecret = process.env.PAYPAL_CLIENT_SECRET || '';
  const nextAuthUrl = process.env.NEXTAUTH_URL || '';
  const vercelUrl = process.env.VERCEL_URL || '';

  // Test Stripe connection with detailed error info
  let stripeStatus = 'not configured';
  let stripeError = '';
  let stripeErrorType = '';
  let stripeErrorCode = '';
  let stripeErrorDetail = '';
  let stripeProducts: any[] = [];
  let stripePrices: any[] = [];
  let stripeBalanceTest = '';

  if (stripeKey && stripeKey !== 'sk_test_placeholder') {
    try {
      // First test: retrieve balance (simplest API call)
      const balance = await stripe.balance.retrieve();
      stripeBalanceTest = `OK - Available: ${balance.available?.[0]?.amount || 0} ${balance.available?.[0]?.currency || 'usd'}`;
      
      const [productsRes, pricesRes] = await Promise.all([
        stripe.products.list({ limit: 10 }),
        stripe.prices.list({ active: true, limit: 100 }),
      ]);
      stripeStatus = `connected (${stripeKey.startsWith('sk_live') ? 'LIVE' : 'TEST'})`;
      stripeProducts = productsRes.data.map(p => ({ id: p.id, name: p.name }));
      stripePrices = pricesRes.data.map(p => ({
        id: p.id,
        nickname: p.nickname,
        amount: p.unit_amount ? `$${(p.unit_amount / 100).toFixed(2)}` : 'N/A',
        interval: (p.recurring as any)?.interval || 'one-time',
        metadata: p.metadata,
      }));
    } catch (e: any) {
      stripeStatus = 'error';
      stripeError = e.message || 'Unknown error';
      stripeErrorType = e.type || 'unknown';
      stripeErrorCode = e.code || 'unknown';
      stripeErrorDetail = JSON.stringify({
        raw: e.raw?.message || null,
        statusCode: e.statusCode || null,
        requestId: e.requestId || null,
        headers: e.headers ? Object.keys(e.headers) : null,
      });
    }
  } else {
    stripeStatus = stripeKey ? 'placeholder key (demo mode)' : 'not configured';
  }

  // Test PayPal connection with detailed error
  let paypalStatus = 'not configured';
  let paypalError = '';
  let paypalErrorDetail = '';
  let paypalTokenPreview = '';
  
  if (paypalId && paypalSecret) {
    try {
      const base = process.env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
      
      const res = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${paypalId}:${paypalSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        paypalStatus = `connected (${process.env.PAYPAL_MODE || 'sandbox'})`;
        paypalTokenPreview = data.access_token.substring(0, 20) + '...';
      } else {
        paypalStatus = 'error';
        paypalError = data.error_description || data.message || 'Invalid credentials';
        paypalErrorDetail = JSON.stringify(data);
      }
    } catch (e: any) {
      paypalStatus = 'connection failed';
      paypalError = e.message;
      paypalErrorDetail = e.cause ? JSON.stringify(e.cause) : 'no cause';
    }
  }

  // Test creating a minimal checkout session (without completing it)
  let checkoutTest = 'not tested';
  let checkoutTestError = '';
  
  if (stripeKey && stripeKey !== 'sk_test_placeholder') {
    try {
      // Try to create a test checkout session with minimal data
      const testSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: 100,
            product_data: { name: 'Test Product' },
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: 'https://myncel.com/test',
        cancel_url: 'https://myncel.com/test',
      });
      checkoutTest = `OK - Session created: ${testSession.id.substring(0, 20)}...`;
    } catch (e: any) {
      checkoutTest = 'failed';
      checkoutTestError = `${e.message} (type: ${e.type}, code: ${e.code})`;
    }
  }

  return NextResponse.json({
    stripe: {
      status: stripeStatus,
      error: stripeError,
      errorType: stripeErrorType,
      errorCode: stripeErrorCode,
      errorDetail: stripeErrorDetail,
      balanceTest: stripeBalanceTest,
      keyPrefix: stripeKey ? stripeKey.substring(0, 12) + '...' : 'not set',
      products: stripeProducts,
      prices: stripePrices,
    },
    paypal: {
      status: paypalStatus,
      error: paypalError,
      errorDetail: paypalErrorDetail,
      tokenPreview: paypalTokenPreview,
      mode: process.env.PAYPAL_MODE || 'not set',
      clientIdPrefix: paypalId ? paypalId.substring(0, 12) + '...' : 'not set',
    },
    checkoutTest: {
      status: checkoutTest,
      error: checkoutTestError,
    },
    urls: {
      nextAuthUrl: nextAuthUrl || 'not set',
      vercelUrl: vercelUrl || 'not set',
      effectiveAppUrl: nextAuthUrl || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000'),
    },
    stripePriceIds: {
      STARTER_MONTHLY:      process.env.STRIPE_STARTER_MONTHLY_PRICE_ID      || 'not set (will auto-create on first checkout)',
      STARTER_YEARLY:       process.env.STRIPE_STARTER_YEARLY_PRICE_ID       || 'not set (will auto-create on first checkout)',
      GROWTH_MONTHLY:       process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID       || 'not set (will auto-create on first checkout)',
      GROWTH_YEARLY:        process.env.STRIPE_GROWTH_YEARLY_PRICE_ID        || 'not set (will auto-create on first checkout)',
      PROFESSIONAL_MONTHLY: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'not set (will auto-create on first checkout)',
      PROFESSIONAL_YEARLY:  process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID  || 'not set (will auto-create on first checkout)',
    },
    paypalPlanIds: {
      STARTER_MONTHLY:      process.env.PAYPAL_PLAN_STARTER_MONTHLY      || 'P-3T080796KC459101ENHX253Q (hardcoded)',
      STARTER_YEARLY:       process.env.PAYPAL_PLAN_STARTER_YEARLY       || 'P-2RC008460A028212ANHX26VQ (hardcoded)',
      GROWTH_MONTHLY:       process.env.PAYPAL_PLAN_GROWTH_MONTHLY       || 'P-5YB75678CD3921447NHX3AYI (hardcoded)',
      GROWTH_YEARLY:        process.env.PAYPAL_PLAN_GROWTH_YEARLY        || 'P-6MX930997R0660345NHX3BBI (hardcoded)',
      PROFESSIONAL_MONTHLY: process.env.PAYPAL_PLAN_PROFESSIONAL_MONTHLY || 'P-76199362801260619NHX3BNQ (hardcoded)',
      PROFESSIONAL_YEARLY:  process.env.PAYPAL_PLAN_PROFESSIONAL_YEARLY  || 'P-39035905PM763664WNHX3B2Q (hardcoded)',
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}