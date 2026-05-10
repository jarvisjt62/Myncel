import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasFeature, FEATURE_MINIMUM_PLAN, getUpgradeMessage, PLAN_RESOURCE_LIMITS, getEffectivePlan, type PlanId } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

// GET /api/billing/plan-features — returns which features are available for the org's plan
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await db.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        plan: true,
        trialEndsAt: true,
        _count: {
          select: {
            machines: true,
            users: true,
            workOrders: true,
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Use effective plan — if trial is expired, features will be restricted
    const rawPlan = org.plan as string;
    const plan = getEffectivePlan(rawPlan, org.trialEndsAt) as PlanId;
    const limits = PLAN_RESOURCE_LIMITS[plan] || PLAN_RESOURCE_LIMITS['TRIAL_RESTRICTED'];

    // Build feature availability map
    const featureAvailability: Record<string, { allowed: boolean; requiredPlan: string | null; upgradeMessage: string }> = {};
    for (const [featureKey, requiredPlan] of Object.entries(FEATURE_MINIMUM_PLAN)) {
      featureAvailability[featureKey] = {
        allowed: hasFeature(plan, featureKey),
        requiredPlan,
        upgradeMessage: hasFeature(plan, featureKey) ? '' : getUpgradeMessage(featureKey),
      };
    }

    return NextResponse.json({
      plan,
      limits,
      usage: {
        machines: org._count.machines,
        users: org._count.users,
        workOrders: org._count.workOrders,
      },
      features: featureAvailability,
    });
  } catch (error) {
    console.error('Plan features GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch plan features' }, { status: 500 });
  }
}