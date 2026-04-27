import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// GET /api/billing/debug — check billing configuration (admin only)
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

  // Test Stripe connection
  let stripeStatus = 'not configured';
  let stripeError = '';
  let stripeProducts: any[] = [];
  let stripePrices: any[] = [];

  if (stripeKey && stripeKey !== 'sk_test_placeholder') {
    try {
      const [productsRes, pricesRes] = await Promise.all([
        stripe.products.list({ limit: 10 }),
        stripe.prices.list({ active: true, limit: 100 }),
      ]);
      stripeStatus = `✅ connected (${stripeKey.startsWith('sk_live') ? 'LIVE' : 'TEST'})`;
      stripeProducts = productsRes.data.map(p => ({ id: p.id, name: p.name }));
      stripePrices = pricesRes.data.map(p => ({
        id: p.id,
        nickname: p.nickname,
        amount: p.unit_amount ? `$${(p.unit_amount / 100).toFixed(2)}` : 'N/A',
        interval: (p.recurring as any)?.interval || 'one-time',
        metadata: p.metadata,
      }));
    } catch (e: any) {
      stripeStatus = '❌ error';
      stripeError = e.message;
    }
  }

  // Test PayPal connection
  let paypalStatus = 'not configured';
  let paypalError = '';
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
        paypalStatus = `✅ connected (${process.env.PAYPAL_MODE || 'sandbox'})`;
      } else {
        paypalStatus = '❌ error';
        paypalError = data.error_description || data.message || 'Invalid credentials';
      }
    } catch (e: any) {
      paypalStatus = '❌ connection failed';
      paypalError = e.message;
    }
  }

  return NextResponse.json({
    stripe: {
      status: stripeStatus,
      error: stripeError,
      keyPrefix: stripeKey ? stripeKey.substring(0, 12) + '...' : 'not set',
      products: stripeProducts,
      prices: stripePrices,
    },
    paypal: {
      status: paypalStatus,
      error: paypalError,
      mode: process.env.PAYPAL_MODE || 'not set',
      clientIdPrefix: paypalId ? paypalId.substring(0, 12) + '...' : 'not set',
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
  });
}