import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { stripe, getPlanById } from '@/lib/stripe';
import { stripeFetchApi } from '@/lib/stripe-fetch';

export const dynamic = 'force-dynamic';

// Stripe Payment Links - Pre-created in Stripe Dashboard
// These bypass the need for API calls to create checkout sessions
const STRIPE_PAYMENT_LINKS: Record<string, Record<string, string>> = {
  STARTER: {
    monthly: 'https://buy.stripe.com/9B614n7oAeJDghR6T01kA00',
    yearly: 'https://buy.stripe.com/8x214ncIU30Vc1B5OW1kA01',
  },
  GROWTH: {
    monthly: 'https://buy.stripe.com/9B65kD5gs7hb8Pp9181kA02',
    yearly: 'https://buy.stripe.com/7sY9ATbEQatnfdNgtA1kA03',
  },
  PROFESSIONAL: {
    monthly: 'https://buy.stripe.com/00wbJ124g0SN1mXb9g1kA04',
    yearly: 'https://buy.stripe.com/dRm14nfV65934z9els1kA05',
  },
};

// Helper function to retry Stripe operations with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isRetryable =
        error.type === 'StripeConnectionError' ||
        error.code === 'ECONNRESET' ||
        error.code === 'EPIPE' ||
        error.message?.includes('connection to Stripe');
      
      if (!isRetryable || attempt === maxRetries) {
        console.error(`[Stripe] ${operationName} failed after ${attempt} attempts:`, error.message);
        throw error;
      }
      
      // Exponential backoff: 500ms, 1s, 2s
      const delay = Math.pow(2, attempt - 1) * 500;
      console.warn(`[Stripe] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// POST /api/billing/checkout — redirect to Stripe Payment Link
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

    // Check if we have a Payment Link for this plan
    const paymentLink = STRIPE_PAYMENT_LINKS[planId]?.[billingInterval];
    if (!paymentLink) {
      return NextResponse.json({ error: 'Payment link not configured for this plan' }, { status: 400 });
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

    const baseUrl = process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const appUrl = baseUrl.replace(/\/$/, '');

    // If already subscribed, try to open billing portal
    if (org.stripeSubscriptionId) {
      try {
        // Need to ensure customer exists for billing portal
        let customerId = org.stripeCustomerId;
        
        if (!customerId) {
          // Create customer first
          const customer = await withRetry(
            () => stripe.customers.create({
              email: session.user.email || '',
              name: org.name,
              metadata: {
                organizationId: org.id,
                userId: session.user.id || '',
              },
            }),
            'customers.create'
          );
          customerId = customer.id;
          await prisma.organization.update({
            where: { id: org.id },
            data: { stripeCustomerId: customerId },
          });
        }

        const portalSession = await withRetry(
          () => stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${appUrl}/settings/billing`,
          }),
          'billingPortal.sessions.create'
        );
        return NextResponse.json({ url: portalSession.url });
      } catch (portalError: any) {
        console.warn('[Stripe] Billing portal failed, redirecting to payment link:', portalError.message);
        // Fall through to payment link redirect
      }
    }

    // Return the Payment Link URL - this bypasses all Stripe API connectivity issues
    // The payment link is pre-created in Stripe Dashboard and handles checkout directly
    console.log(`[Stripe] Redirecting to Payment Link for ${planId} ${billingInterval}: ${paymentLink}`);
    return NextResponse.json({ url: paymentLink });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to process checkout request',
    }, { status: 500 });
  }
}