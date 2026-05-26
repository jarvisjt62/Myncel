/**
 * GET    /api/reports/[id]      — fetch one
 * PATCH  /api/reports/[id]      — update
 * DELETE /api/reports/[id]      — delete
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { DATASETS, type ReportDataset } from '@/lib/reports/datasets';
import { computeNextRun } from '@/lib/reports/schedule';

export const dynamic = 'force-dynamic';

const VALID_SCHEDULES = new Set(['NEVER', 'DAILY', 'WEEKLY', 'MONTHLY']);
const VALID_FORMATS = new Set(['CSV', 'XLSX', 'PDF']);

async function getOrgReport(reportId: string, sessionUserId: string) {
  const user = await safeQuery(
    () => db.user.findUnique({ where: { id: sessionUserId }, select: { organizationId: true } }),
    null,
  );
  if (!user?.organizationId) return { error: 'No organization', status: 400 } as const;
  const report = await safeQuery(
    () => db.savedReport.findUnique({ where: { id: reportId } }),
    null,
  );
  if (!report) return { error: 'Not found', status: 404 } as const;
  if (report.organizationId !== user.organizationId) return { error: 'Forbidden', status: 403 } as const;
  return { report, organizationId: user.organizationId } as const;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await getOrgReport(params.id, (session.user as any).id);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ report: r.report });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await getOrgReport(params.id, (session.user as any).id);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (typeof body.name === 'string') data.name = body.name.trim();
  if (typeof body.description === 'string') data.description = body.description.trim() || null;
  if (typeof body.dataset === 'string') {
    const ds = body.dataset.toUpperCase() as ReportDataset;
    if (!DATASETS[ds]) return NextResponse.json({ error: `Unknown dataset: ${ds}` }, { status: 400 });
    data.dataset = ds;
  }
  if (body.filters && typeof body.filters === 'object') data.filters = body.filters;
  if (typeof body.schedule === 'string') {
    const s = body.schedule.toUpperCase();
    if (!VALID_SCHEDULES.has(s)) return NextResponse.json({ error: 'Invalid schedule' }, { status: 400 });
    data.schedule = s;
  }
  if (body.hourLocal !== undefined) data.hourLocal = Math.max(0, Math.min(23, parseInt(body.hourLocal, 10) || 8));
  if (typeof body.timezone === 'string') data.timezone = body.timezone;
  if (Array.isArray(body.recipients)) {
    data.recipients = body.recipients.filter((x: any) => typeof x === 'string' && x.includes('@'));
  }
  if (typeof body.format === 'string') {
    const f = body.format.toUpperCase();
    if (!VALID_FORMATS.has(f)) return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    data.format = f;
  }
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

  // If anything affecting the schedule changed, recompute nextRunAt.
  const changedSchedule = data.schedule || data.hourLocal !== undefined || data.timezone || data.isActive !== undefined;
  if (changedSchedule) {
    const newSchedule = data.schedule || r.report.schedule;
    const newHour = data.hourLocal ?? r.report.hourLocal;
    const newTz = data.timezone || r.report.timezone;
    const stillActive = data.isActive ?? r.report.isActive;
    data.nextRunAt = stillActive ? computeNextRun(newSchedule, newHour, newTz) : null;
  }

  const updated = await db.savedReport.update({ where: { id: params.id }, data });
  return NextResponse.json({ report: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await getOrgReport(params.id, (session.user as any).id);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  await db.savedReport.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
