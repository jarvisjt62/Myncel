import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { orgId } = params;
  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  // If Stripe is configured and org has a subscription, cancel via Stripe
  if (process.env.STRIPE_SECRET_KEY && org.stripeSubscriptionId) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia' as any,
    });
    await stripe.subscriptions.update(org.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Update DB
  await db.organization.update({
    where: { id: orgId },
    data: { cancelAtPeriodEnd: true },
  });

  await db.auditLog.create({
    data: {
      action: 'SUBSCRIPTION_CANCEL_REQUESTED',
      entity: 'Organization',
      entityId: orgId,
      changes: { cancelAtPeriodEnd: true } as any,
      organizationId: orgId,
      userId: session.user.id ?? null,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}