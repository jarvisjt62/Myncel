import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Map Stripe price IDs to plan IDs
function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '_']: 'STARTER',
    [process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '_']: 'STARTER',
    [process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || '_']: 'GROWTH',
    [process.env.STRIPE_GROWTH_YEARLY_PRICE_ID || '_']: 'GROWTH',
    [process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '_']: 'PROFESSIONAL',
    [process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || '_']: 'PROFESSIONAL',
    [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '_']: 'ENTERPRISE',
    [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '_']: 'ENTERPRISE',
  };
  return priceMap[priceId] || 'STARTER';
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ received: true });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object;
        if (checkoutSession.mode === 'subscription') {
          const subscriptionId = checkoutSession.subscription as string;
          const organizationId = checkoutSession.metadata?.organizationId;
          const planId = checkoutSession.metadata?.planId;

          if (!organizationId) break;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = (subscription as any).items?.data[0]?.price?.id;
          const resolvedPlanId = planId || getPlanFromPriceId(priceId);

          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              plan: resolvedPlanId as any,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              subscriptionStatus: subscription.status,
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = invoice.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        const priceId = (subscription as any).items?.data[0]?.price?.id;
        const planId = getPlanFromPriceId(priceId);

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: planId as any,
            subscriptionStatus: 'active',
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: 'past_due' },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        const priceId = subscription.items?.data[0]?.price?.id;
        const planId = getPlanFromPriceId(priceId);

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: planId as any,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: 'TRIAL' as any,
            stripeSubscriptionId: null,
            stripePriceId: null,
            subscriptionStatus: 'canceled',
            cancelAtPeriodEnd: false,
          },
        });
        break;
      }

      // ===== ACH Direct Debit Events =====

      case 'charge.pending': {
        // ACH charge is pending (waiting for bank to process)
        const charge = event.data.object;
        const customerId = charge.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: 'ach_pending' },
        });

        await prisma.auditLog.create({
          data: {
            action: 'ACH_CHARGE_PENDING',
            entity: 'Organization',
            entityId: org.id,
            changes: { chargeId: charge.id, amount: charge.amount },
            userId: null,
          },
        }).catch(() => {});
        break;
      }

      case 'charge.succeeded': {
        // ACH charge cleared successfully
        const charge = event.data.object;
        const customerId = charge.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        // Update ACH bank account status if applicable
        const achData = org.achBankAccount ? JSON.parse(org.achBankAccount) : null;
        if (achData) {
          achData.status = 'verified';
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: 'active',
              achBankAccount: JSON.stringify(achData),
            },
          });
        } else {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: 'active' },
          });
        }

        await prisma.auditLog.create({
          data: {
            action: 'ACH_CHARGE_SUCCEEDED',
            entity: 'Organization',
            entityId: org.id,
            changes: { chargeId: charge.id, amount: charge.amount },
            userId: null,
          },
        }).catch(() => {});
        break;
      }

      case 'charge.failed': {
        // ACH charge failed (insufficient funds, closed account, etc.)
        const charge = event.data.object;
        const customerId = charge.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: 'ach_failed' },
        });

        await prisma.auditLog.create({
          data: {
            action: 'ACH_CHARGE_FAILED',
            entity: 'Organization',
            entityId: org.id,
            changes: { chargeId: charge.id, failureCode: charge.failure_code, failureMessage: charge.failure_message },
            userId: null,
          },
        }).catch(() => {});
        break;
      }

      case 'customer.source.activated': {
        // Bank account verified via micro-deposits
        const bankAccount = event.data.object;
        const customerId = bankAccount.customer as string;

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        const achData = org.achBankAccount ? JSON.parse(org.achBankAccount) : {};
        achData.status = 'verified';
        achData.bankAccountId = bankAccount.id;

        await prisma.organization.update({
          where: { id: org.id },
          data: { achBankAccount: JSON.stringify(achData) },
        });

        await prisma.auditLog.create({
          data: {
            action: 'ACH_BANK_ACCOUNT_VERIFIED',
            entity: 'Organization',
            entityId: org.id,
            changes: { bankAccountId: bankAccount.id },
            userId: null,
          },
        }).catch(() => {});
        break;
      }

      case 'customer.subscription.trial_will_end': {
        console.log('Trial ending soon for subscription:', event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}