/**
 * GET  /api/reports             — list saved reports for current org
 * POST /api/reports             — create a saved report
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await safeQuery(
    () => db.user.findUnique({ where: { id: (session.user as any).id }, select: { organizationId: true } }),
    null,
  );
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const reports = await safeQuery(
    () => db.savedReport.findMany({
      where: { organizationId: user.organizationId! },
      orderBy: { updatedAt: 'desc' },
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
    [],
  );

  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await safeQuery(
    () => db.user.findUnique({ where: { id: (session.user as any).id }, select: { id: true, organizationId: true } }),
    null,
  );
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const dataset = String(body.dataset || '').toUpperCase() as ReportDataset;
  const description = body.description ? String(body.description).trim() : null;
  const filters = body.filters && typeof body.filters === 'object' ? body.filters : {};
  const schedule = String(body.schedule || 'NEVER').toUpperCase();
  const hourLocal = Math.max(0, Math.min(23, parseInt(body.hourLocal ?? 8, 10) || 8));
  const timezone = String(body.timezone || 'UTC');
  const recipients = Array.isArray(body.recipients) ? body.recipients.filter((r: any) => typeof r === 'string' && r.includes('@')) : [];
  const format = String(body.format || 'CSV').toUpperCase();

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!DATASETS[dataset]) return NextResponse.json({ error: `Unknown dataset: ${dataset}` }, { status: 400 });
  if (!VALID_SCHEDULES.has(schedule)) return NextResponse.json({ error: 'Invalid schedule' }, { status: 400 });
  if (!VALID_FORMATS.has(format)) return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

  const nextRunAt = computeNextRun(schedule as any, hourLocal, timezone);

  const report = await db.savedReport.create({
    data: {
      organizationId: user.organizationId,
      ownerId: user.id,
      name,
      description,
      dataset: dataset as any,
      filters,
      schedule: schedule as any,
      hourLocal,
      timezone,
      recipients,
      format: format as any,
      nextRunAt,
    },
  });

  return NextResponse.json({ report });
}
