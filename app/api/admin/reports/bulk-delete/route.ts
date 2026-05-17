/**
 * POST /api/admin/reports/bulk-delete
 *
 * Super-admin bulk delete across ALL organizations. Unlike the org-scoped
 * /api/work-orders/bulk-delete endpoint, this one does NOT filter by
 * organizationId — the super admin can clear records from any org.
 *
 * Request:  { ids: string[] }   (max 500)
 * Response: { success, deleted, skipped, errors }
 *
 * Auth: SUPER_ADMIN role OR session email === admin@myncel.com.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PLATFORM_ADMIN_EMAIL = 'admin@myncel.com';
const MAX_BULK = 500;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const u = session.user as any;
    const isPlatformAdmin = u.email === PLATFORM_ADMIN_EMAIL || u.role === 'SUPER_ADMIN';
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((x: any) => typeof x === 'string')
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }
    if (ids.length > MAX_BULK) {
      return NextResponse.json(
        { error: `Bulk operations are limited to ${MAX_BULK} records per request` },
        { status: 400 }
      );
    }

    const existing = await db.workOrder.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const existingIds = existing.map(r => r.id);
    const skipped = ids.length - existingIds.length;

    if (existingIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, skipped, errors: [] });
    }

    await db.workOrderPart.deleteMany({ where: { workOrderId: { in: existingIds } } }).catch(() => {});
    const result = await db.workOrder.deleteMany({ where: { id: { in: existingIds } } });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      skipped,
      errors: [],
    });
  } catch (error) {
    console.error('[admin/reports/bulk-delete] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
