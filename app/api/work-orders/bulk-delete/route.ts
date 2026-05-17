/**
 * /api/work-orders/bulk-delete
 *
 * Bulk-delete work-order records from the Reports tab.
 *
 * Request:  POST { ids: string[] }
 * Response: { success: boolean, deleted: number, skipped: number, errors: string[] }
 *
 * Permission gates (in order):
 *   1. The user must have `reports.bulk` (the bulk-action permission added in
 *      Round 8). Without it, no record is touched.
 *   2. The user must have `reports.delete` (or `work_orders.delete` as a
 *      legacy fallback) to actually remove records.
 *   3. Cross-org records are silently skipped — a request that targets ids
 *      from a different org never affects them.
 *
 * Platform admin (admin@myncel.com) and SUPER_ADMIN role bypass all gates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const PLATFORM_ADMIN_EMAIL = 'admin@myncel.com';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const userId: string = user.id;
    const userOrgId: string | null = user.organizationId ?? null;
    const isPlatformAdmin = user.email === PLATFORM_ADMIN_EMAIL || user.role === 'SUPER_ADMIN';

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: any) => typeof x === 'string') : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }
    if (ids.length > 500) {
      return NextResponse.json({ error: 'Bulk operations are limited to 500 records per request' }, { status: 400 });
    }

    // Permission gates (skipped for platform admin)
    if (!isPlatformAdmin) {
      const canBulk = await hasPermission(userId, 'reports.bulk');
      if (!canBulk) {
        return NextResponse.json({ error: 'Forbidden — missing reports.bulk permission' }, { status: 403 });
      }
      const canDelete =
        (await hasPermission(userId, 'reports.delete')) ||
        (await hasPermission(userId, 'work_orders.delete'));
      if (!canDelete) {
        return NextResponse.json({ error: 'Forbidden — missing reports.delete permission' }, { status: 403 });
      }
    }

    // Fetch the records first so we can scope to the caller's org and skip
    // anything they shouldn't touch. Platform admin sees all orgs.
    const candidates = await db.workOrder.findMany({
      where: { id: { in: ids } },
      select: { id: true, organizationId: true, woNumber: true },
    });

    const targetable = isPlatformAdmin
      ? candidates
      : candidates.filter(wo => wo.organizationId === userOrgId);

    const targetIds = targetable.map(wo => wo.id);
    const skipped = ids.length - targetIds.length;

    if (targetIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, skipped, errors: [] });
    }

    // Cascade-friendly delete: clear pivot rows first, then the records.
    // (Prisma cascades may already handle this depending on schema; the
    // explicit deleteMany is defensive.)
    await db.workOrderPart.deleteMany({ where: { workOrderId: { in: targetIds } } }).catch(() => {});
    const result = await db.workOrder.deleteMany({ where: { id: { in: targetIds } } });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      skipped,
      errors: [],
    });
  } catch (error) {
    console.error('[work-orders/bulk-delete] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
