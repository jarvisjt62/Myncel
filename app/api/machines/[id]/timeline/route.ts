/**
 * GET /api/machines/[id]/timeline
 *
 * Returns a merged chronological feed for this machine — work orders
 * (created + status transitions), alerts, and (where present) audit logs.
 * Today this is a simple union with stable shapes:
 *
 *   { kind: 'work_order_created' | 'work_order_completed' | 'alert' | 'document_added',
 *     at: ISO string, title, summary, refId, refType, severity? }
 *
 * Sorted descending by `at`. Capped at 200 events.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Event = {
  kind: 'work_order_created' | 'work_order_completed' | 'alert' | 'document_added';
  at: string;
  title: string;
  summary: string;
  refId: string;
  refType: 'work_order' | 'alert' | 'document';
  severity?: 'info' | 'warn' | 'crit';
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify org ownership
  const m = await safeQuery(
    () =>
      db.machine.findFirst({
        where: { id: params.id, organizationId: session.user.organizationId },
        select: { id: true, name: true },
      }),
    null,
  );
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [workOrders, alerts, documents] = await Promise.all([
    safeQuery(
      () =>
        db.workOrder.findMany({
          where: { machineId: params.id },
          orderBy: { createdAt: 'desc' },
          take: 80,
          select: {
            id: true,
            woNumber: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
            completedAt: true,
            type: true,
            assignedTo: { select: { name: true } },
          },
        }),
      [],
    ),
    safeQuery(
      () =>
        db.alert.findMany({
          where: { machineId: params.id },
          orderBy: { createdAt: 'desc' },
          take: 80,
          select: { id: true, title: true, message: true, severity: true, createdAt: true, isResolved: true },
        }),
      [],
    ),
    safeQuery(
      () =>
        db.machineDocument.findMany({
          where: { machineId: params.id },
          orderBy: { createdAt: 'desc' },
          take: 40,
          select: {
            id: true,
            name: true,
            kind: true,
            createdAt: true,
            uploadedBy: { select: { name: true, email: true } },
          },
        }),
      [],
    ),
  ]);

  const events: Event[] = [];

  for (const w of workOrders || []) {
    events.push({
      kind: 'work_order_created',
      at: w.createdAt.toISOString(),
      title: `Work order opened: ${w.title}`,
      summary: `${w.woNumber || ''} · ${w.type} · ${w.priority}${w.assignedTo?.name ? ` · ${w.assignedTo.name}` : ''}`,
      refId: w.id,
      refType: 'work_order',
      severity: w.priority === 'CRITICAL' || w.priority === 'HIGH' ? 'warn' : 'info',
    });
    if (w.completedAt) {
      events.push({
        kind: 'work_order_completed',
        at: w.completedAt.toISOString(),
        title: `Work order completed: ${w.title}`,
        summary: `${w.woNumber || ''} · ${w.type}${w.assignedTo?.name ? ` · ${w.assignedTo.name}` : ''}`,
        refId: w.id,
        refType: 'work_order',
        severity: 'info',
      });
    }
  }

  for (const a of alerts || []) {
    events.push({
      kind: 'alert',
      at: a.createdAt.toISOString(),
      title: a.title,
      summary: a.message?.slice(0, 200) ?? '',
      refId: a.id,
      refType: 'alert',
      severity: a.severity === 'HIGH' || a.severity === 'CRITICAL' ? 'crit' : a.severity === 'MEDIUM' ? 'warn' : 'info',
    });
  }

  for (const d of documents || []) {
    events.push({
      kind: 'document_added',
      at: d.createdAt.toISOString(),
      title: `Document attached: ${d.name}`,
      summary: `${d.kind}${d.uploadedBy?.name ? ` · uploaded by ${d.uploadedBy.name}` : ''}`,
      refId: d.id,
      refType: 'document',
      severity: 'info',
    });
  }

  events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return NextResponse.json({ events: events.slice(0, 200) });
}
