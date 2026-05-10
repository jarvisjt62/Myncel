import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { BILLING_PLANS } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planId, billingInterval, accountHolderName, routingNumber, accountNumber, accountType } = body;

    if (!planId || !accountHolderName || !routingNumber || !accountNumber || !accountType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (routingNumber.length !== 9) {
      return NextResponse.json({ error: 'Routing number must be exactly 9 digits' }, { status: 400 });
    }

    if (accountNumber.length < 4) {
      return NextResponse.json({ error: 'Account number must be at least 4 digits' }, { status: 400 });
    }

    if (!['checking', 'savings'].includes(accountType)) {
      return NextResponse.json({ error: 'Account type must be checking or savings' }, { status: 400 });
    }

    const orgId = session.user.organizationId;

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey === 'sk_test_placeholder') {
      // Demo mode — store masked info and return success
      await db.organization.update({
        where: { id: orgId },
        data: {
          achBankAccount: JSON.stringify({
            last4: accountNumber.slice(-4),
            accountType,
            accountHolderName,
            status: 'demo_pending',
          }),
          subscriptionStatus: 'ach_pending',
        },
      });

      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Demo mode: ACH debit authorized. Configure STRIPE_SECRET_KEY to enable real ACH processing.',
        last4: accountNumber.slice(-4),
      });
    }

    // Production: Use Stripe ACH Direct Debit
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    // Find the plan
    const plan = BILLING_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create or get Stripe customer
    let org = await db.organization.findUnique({
      where: { id: orgId },
      select: { stripeCustomerId: true, name: true },
    });

    let customerId = org?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org?.name || session.user.organizationName || 'Unknown',
        email: session.user.email || undefined,
        metadata: { organizationId: orgId },
      });
      customerId = customer.id;
      await db.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create a bank account token
    const token = await stripe.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name: accountHolderName,
        account_holder_type: 'individual',
        routing_number: routingNumber,
        account_number: accountNumber,
      },
    });

    // Attach bank account to customer as a payment method
    const bankAccount = await stripe.customers.createSource(customerId, {
      source: token.id,
    });

    // Store masked bank info and update subscription status
    await db.organization.update({
      where: { id: orgId },
      data: {
        achBankAccount: JSON.stringify({
          last4: accountNumber.slice(-4),
          accountType,
          accountHolderName,
          bankAccountId: bankAccount.id,
          status: 'pending_verification',
        }),
        subscriptionStatus: 'ach_pending',
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'ACH_PAYMENT_AUTHORIZED',
        entity: 'Organization',
        entityId: orgId,
        changes: {
          planId,
          billingInterval,
          last4: accountNumber.slice(-4),
          accountType,
        },
        userId: session.user.id,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'ACH debit authorization submitted. Micro-deposits will be sent to verify your bank account within 1-2 business days. Your subscription will be activated once verification is complete.',
      last4: accountNumber.slice(-4),
      status: 'pending_verification',
    });
  } catch (error: any) {
    console.error('ACH payment error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to process ACH payment',
    }, { status: 500 });
  }
}