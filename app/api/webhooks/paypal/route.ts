import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PayPal webhook handler for subscription events
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers = req.headers;

    // Verify webhook signature (production)
    const paypalAuthAlgo = headers.get('PAYPAL-AUTH-ALGO');
    const paypalCertUrl = headers.get('PAYPAL-CERT-URL');
    const paypalTransmissionId = headers.get('PAYPAL-TRANSMISSION-ID');
    const paypalTransmissionSig = headers.get('PAYPAL-TRANSMISSION-SIG');
    const paypalTransmissionTime = headers.get('PAYPAL-TRANSMISSION-TIME');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // In production, verify the webhook signature using PayPal's API
    // For now, we log and process (signature verification can be added later)
    if (!webhookId) {
      console.warn('PAYPAL_WEBHOOK_ID not configured - skipping signature verification');
    }

    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      console.error('PayPal webhook: invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const eventType = event.event_type;
    console.log(`PayPal webhook: ${eventType}`);

    const resource = event.resource || {};

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // Subscription was activated
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        const customerId = resource.subscriber?.payer_id;

        // Find org by PayPal subscription ID stored in custom_id or metadata
        const customId = resource.custom_id;

        if (customId) {
          // custom_id format: "orgId:planId" (e.g., "clx12345:STARTER")
          const [orgId, resolvedPlan] = customId.split(':');

          await db.organization.update({
            where: { id: orgId || customId },
            data: {
              plan: (resolvedPlan || 'STARTER') as any,
              subscriptionStatus: 'active',
              paypalSubscriptionId: subscriptionId,
            },
          }).catch(() => {});

          await db.auditLog.create({
            data: {
              action: 'PAYPAL_SUBSCRIPTION_ACTIVATED',
              entity: 'Organization',
              entityId: customId,
              changes: { subscriptionId, planId, plan: resolvedPlan },
              userId: null,
            },
          }).catch(() => {});
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = resource.id;
        const customId = resource.custom_id;

        if (customId) {
          const [orgId] = customId.split(':');
          await db.organization.update({
            where: { id: orgId || customId },
            data: {
              plan: 'TRIAL' as any,
              subscriptionStatus: 'canceled',
              paypalSubscriptionId: null,
            },
          }).catch(() => {});

          await db.auditLog.create({
            data: {
              action: 'PAYPAL_SUBSCRIPTION_CANCELLED',
              entity: 'Organization',
              entityId: orgId || customId,
              changes: { subscriptionId },
              userId: null,
            },
          }).catch(() => {});
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subscriptionId = resource.id;
        const customId = resource.custom_id;

        if (customId) {
          const [orgId] = customId.split(':');
          await db.organization.update({
            where: { id: orgId || customId },
            data: { subscriptionStatus: 'suspended' },
          }).catch(() => {});
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const subscriptionId = resource.id;
        const customId = resource.custom_id;

        if (customId) {
          const [orgId] = customId.split(':');
          await db.organization.update({
            where: { id: orgId || customId },
            data: {
              plan: 'TRIAL',
              subscriptionStatus: 'expired',
              paypalSubscriptionId: null,
            },
          }).catch(() => {});
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.RENEWED': {
        const subscriptionId = resource.id;
        const customId = resource.custom_id;

        if (customId) {
          const [orgId] = customId.split(':');
          await db.organization.update({
            where: { id: orgId || customId },
            data: { subscriptionStatus: 'active' },
          }).catch(() => {});
        }
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        // A payment was successfully collected
        const saleId = resource.id;
        const amount = resource.amount?.total;
        const currency = resource.amount?.currency;

        await db.auditLog.create({
          data: {
            action: 'PAYPAL_PAYMENT_COMPLETED',
            entity: 'Payment',
            entityId: saleId,
            changes: { amount, currency, saleId },
            userId: null,
          },
        }).catch(() => {});
        break;
      }

      case 'PAYMENT.SALE.REFUNDED': {
        const saleId = resource.id;
        await db.auditLog.create({
          data: {
            action: 'PAYPAL_PAYMENT_REFUNDED',
            entity: 'Payment',
            entityId: saleId,
            changes: { saleId },
            userId: null,
          },
        }).catch(() => {});
        break;
      }

      case 'PAYMENT.SALE.REVERSED': {
        const saleId = resource.id;
        await db.auditLog.create({
          data: {
            action: 'PAYPAL_PAYMENT_REVERSED',
            entity: 'Payment',
            entityId: saleId,
            changes: { saleId },
            userId: null,
          },
        }).catch(() => {});
        break;
      }

      default:
        console.log(`PayPal webhook: unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}