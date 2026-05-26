/**
 * GET /api/machines/[id]/parts-used
 *
 * Aggregates parts consumed by completed/in-progress work orders for this
 * machine. Returns an array of:
 *   { partId, name, partNumber, totalQuantity, totalCost, unitCostLast,
 *     workOrderCount, currency, lastUsedAt }
 * sorted by totalCost desc.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const m = await safeQuery(
    () =>
      db.machine.findFirst({
        where: { id: params.id, organizationId: session.user.organizationId },
        select: { id: true },
      }),
    null,
  );
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // All WorkOrderPart rows for work orders on this machine
  const rows = await safeQuery(
    () =>
      db.workOrderPart.findMany({
        where: { workOrder: { machineId: params.id } },
        include: {
          part: { select: { id: true, name: true, partNumber: true, currency: true } },
          workOrder: { select: { id: true, woNumber: true, completedAt: true, createdAt: true, status: true } },
        },
      }),
    [],
  );

  const map = new Map<
    string,
    {
      partId: string;
      name: string;
      partNumber: string | null;
      totalQuantity: number;
      totalCost: number;
      unitCostLast: number | null;
      workOrderIds: Set<string>;
      currency: string | null;
      lastUsedAt: string | null;
    }
  >();

  for (const r of rows || []) {
    const id = r.partId;
    const cur = map.get(id) ?? {
      partId: id,
      name: r.part?.name || '(deleted part)',
      partNumber: r.part?.partNumber ?? null,
      totalQuantity: 0,
      totalCost: 0,
      unitCostLast: null,
      workOrderIds: new Set<string>(),
      currency: r.part?.currency ?? null,
      lastUsedAt: null,
    };
    cur.totalQuantity += r.quantity || 0;
    if (typeof r.unitCost === 'number') {
      cur.totalCost += (r.quantity || 0) * r.unitCost;
      cur.unitCostLast = r.unitCost;
    }
    cur.workOrderIds.add(r.workOrderId);
    const at = r.workOrder?.completedAt?.toISOString() || r.workOrder?.createdAt?.toISOString() || null;
    if (at && (!cur.lastUsedAt || at > cur.lastUsedAt)) cur.lastUsedAt = at;
    map.set(id, cur);
  }

  const list = Array.from(map.values())
    .map((p) => ({ ...p, workOrderCount: p.workOrderIds.size, workOrderIds: undefined as any }))
    .sort((a, b) => b.totalCost - a.totalCost);

  return NextResponse.json({ parts: list });
}
