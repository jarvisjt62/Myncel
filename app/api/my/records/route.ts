/**
 * GET /api/my/records?dataset=work_orders|machines|alerts|parts
 * Returns a list of records in the caller's own organization, for use in
 * the user-side scoped export modal.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await safeQuery(
    db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    }),
    null
  );
  if (!user?.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const dataset = searchParams.get('dataset') || 'work_orders';
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);
  const orgId = user.organizationId;

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
          meta: { status: r.status, priority: r.priority },
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
          sublabel: `${r.partNumber ? r.partNumber + ' · ' : ''}qty ${r.quantity}/${r.minQuantity} min${r.unitCost != null ? ` · $${r.unitCost}` : ''}${r.supplier ? ` · ${r.supplier}` : ''}`,
          meta: { quantity: r.quantity, unitCost: r.unitCost },
        })),
      });
    }

    return NextResponse.json(
      { error: `Unsupported dataset: ${dataset}` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load records' }, { status: 500 });
  }
}
