/**
 * /api/admin/reports/[id]
 *
 * Super-admin per-record control of a single work-order / report row.
 *   - PATCH:  update title / status / priority / type / laborCost / partsCost / totalCost
 *   - DELETE: remove the work order (and its WorkOrderPart rows defensively)
 *
 * Auth: SUPER_ADMIN role OR session email === admin@myncel.com.
 * Cross-org records are fully accessible to the super admin (by design).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PLATFORM_ADMIN_EMAIL = 'admin@myncel.com';

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: 'Unauthorized', status: 401 } as const;
  const u = session.user as any;
  const isPlatformAdmin = u.email === PLATFORM_ADMIN_EMAIL || u.role === 'SUPER_ADMIN';
  if (!isPlatformAdmin) return { error: 'Forbidden', status: 403 } as const;
  return { user: u } as const;
}

const ALLOWED_FIELDS = new Set([
  'title',
  'status',
  'priority',
  'type',
  'laborCost',
  'partsCost',
  'totalCost',
]);

function sanitizePatch(body: any) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!ALLOWED_FIELDS.has(k)) continue;
    if (k === 'laborCost' || k === 'partsCost' || k === 'totalCost') {
      const n = typeof v === 'number' ? v : parseFloat(v as string);
      if (!Number.isFinite(n)) continue;
      out[k] = n;
    } else if (typeof v === 'string' && v.trim()) {
      out[k] = v.trim();
    }
  }
  return out;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireSuperAdmin();
    if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const id = params.id;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const data = sanitizePatch(body);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const existing = await db.workOrder.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await db.workOrder.update({
      where: { id },
      data,
      select: {
        id: true,
        woNumber: true,
        title: true,
        status: true,
        priority: true,
        type: true,
        laborCost: true,
        partsCost: true,
        totalCost: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      workOrder: {
        ...updated,
        completedAt: updated.completedAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[admin/reports/[id]] PATCH error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guard = await requireSuperAdmin();
    if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const id = params.id;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const existing = await db.workOrder.findUnique({ where: { id }, select: { id: true, woNumber: true } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Defensive: clear pivot rows even though schema cascades.
    await db.workOrderPart.deleteMany({ where: { workOrderId: id } }).catch(() => {});
    await db.workOrder.delete({ where: { id } });

    return NextResponse.json({ success: true, deleted: 1, woNumber: existing.woNumber });
  } catch (error) {
    console.error('[admin/reports/[id]] DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
