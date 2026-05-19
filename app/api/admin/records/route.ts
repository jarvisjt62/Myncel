/**
 * GET /api/admin/records?orgId=...&dataset=work_orders|machines|alerts|parts
 * Returns a list of records belonging to `orgId` so the platform admin can pick
 * which ones to export / send / sync.
 * Platform-admin only (admin@myncel.com).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db';
import { getPlatformAdminContext } from '@/lib/admin-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { isAdmin } = await getPlatformAdminContext();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden — platform admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const dataset = searchParams.get('dataset') || 'work_orders';

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);

  try {
    if (dataset === 'work_orders') {
      const rows = await safeQuery(
        db.workOrder.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            woNumber: true,
            title: true,
            status: true,
            priority: true,
            dueAt: true,
            totalCost: true,
          },
        }),
        []
      );
      return NextResponse.json({
        dataset,
        records: (rows || []).map((r: any) => ({
          id: r.id,
          label: r.woNumber ? `${r.woNumber} — ${r.title}` : r.title,
          sublabel: `${r.status} · ${r.priority}${r.dueAt ? ` · due ${new Date(r.dueAt).toLocaleDateString()}` : ''}`,
          meta: { status: r.status, priority: r.priority, totalCost: r.totalCost },
        })),
      });
    }

    if (dataset === 'machines') {
      const rows = await safeQuery(
        db.machine.findMany({
          where: { organizationId: orgId },
          orderBy: { name: 'asc' },
          take: limit,
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
            manufacturer: true,
            model: true,
            location: true,
          },
        }),
        []
      );
      return NextResponse.json({
        dataset,
        records: (rows || []).map((r: any) => ({
          id: r.id,
          label: r.name,
          sublabel: [r.category, r.manufacturer, r.model, r.location].filter(Boolean).join(' · '),
          meta: { status: r.status },
        })),
      });
    }

    if (dataset === 'alerts') {
      const rows = await safeQuery(
        db.alert.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            severity: true,
            isResolved: true,
            createdAt: true,
            machine: { select: { name: true } },
          },
        }),
        []
      );
      return NextResponse.json({
        dataset,
        records: (rows || []).map((r: any) => ({
          id: r.id,
          label: r.title,
          sublabel: `${r.severity}${r.isResolved ? ' · resolved' : ' · open'}${r.machine?.name ? ` · ${r.machine.name}` : ''} · ${new Date(r.createdAt).toLocaleDateString()}`,
          meta: { severity: r.severity, isResolved: r.isResolved },
        })),
      });
    }

    if (dataset === 'parts') {
      const rows = await safeQuery(
        db.part.findMany({
          where: { organizationId: orgId },
          orderBy: { name: 'asc' },
          take: limit,
          select: {
            id: true,
            name: true,
            partNumber: true,
            quantity: true,
            minQuantity: true,
            unitCost: true,
            currency: true,
            supplier: true,
          },
        }),
        []
      );
      return NextResponse.json({
        dataset,
        records: (rows || []).map((r: any) => ({
          id: r.id,
          label: r.name,
          sublabel: `${r.partNumber ? r.partNumber + ' · ' : ''}qty ${r.quantity}/${r.minQuantity} min${r.unitCost != null ? ` · ${r.currency || 'USD'} ${r.unitCost}` : ''}${r.supplier ? ` · ${r.supplier}` : ''}`,
          meta: { quantity: r.quantity, unitCost: r.unitCost, currency: r.currency || 'USD' },
        })),
      });
    }

    return NextResponse.json(
      { error: `Unsupported dataset: ${dataset}. Use 'work_orders', 'machines', 'alerts', or 'parts'.` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load records' }, { status: 500 });
  }
}
