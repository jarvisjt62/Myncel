import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_PLANS = ['TRIAL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.email !== 'admin@myncel.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { orgId } = params;
  const body = await req.json();
  const { plan } = body;

  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const previousPlan = org.plan;

  await db.organization.update({
    where: { id: orgId },
    data: {
      plan: plan as any,
      // If moving to TRIAL, reset status; otherwise mark active
      subscriptionStatus: plan === 'TRIAL' ? 'trialing' : org.subscriptionStatus ?? 'active',
    },
  });

  // Log the plan change
  await db.auditLog.create({
    data: {
      action: 'BILLING_PLAN_CHANGED',
      entity: 'Organization',
      entityId: orgId,
      changes: { previousPlan, newPlan: plan } as any,
      organizationId: orgId,
      userId: session.user.id ?? null,
    },
  }).catch(() => {}); // Non-fatal

  return NextResponse.json({ success: true, plan });
}