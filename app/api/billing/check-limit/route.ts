import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPlanLimit, type PlanId } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

// GET /api/billing/check-limit?resource=machines|users|workOrders
// Returns whether the org can create more of the requested resource
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get('resource') as 'machines' | 'users' | 'workOrders' | null;

    if (!resource || !['machines', 'users', 'workOrders'].includes(resource)) {
      return NextResponse.json({ error: 'Invalid resource. Must be machines, users, or workOrders.' }, { status: 400 });
    }

    const result = await checkPlanLimit(session.user.organizationId, resource);

    return NextResponse.json({
      resource,
      allowed: result.allowed,
      current: result.current,
      limit: result.limit,
      plan: result.plan,
      isUnlimited: result.limit === null,
      percentUsed: result.limit ? Math.round((result.current / result.limit) * 100) : 0,
    });
  } catch (error) {
    console.error('Check limit error:', error);
    return NextResponse.json({ error: 'Failed to check limit' }, { status: 500 });
  }
}