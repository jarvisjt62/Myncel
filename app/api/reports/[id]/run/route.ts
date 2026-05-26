/**
 * POST /api/reports/[id]/run
 *   Run a saved report on demand. Returns the CSV inline as the
 *   response body so the browser can offer it as a download.
 *
 * Query: ?email=1 — also email the result to the report's recipients.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { runSavedReport, runAndEmailSavedReport } from '@/lib/reports/runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Org-scope check: only the org's own users can run.
  const user = await safeQuery(
    () => db.user.findUnique({ where: { id: (session.user as any).id }, select: { organizationId: true } }),
    null,
  );
  if (!user?.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const report = await safeQuery(
    () => db.savedReport.findUnique({ where: { id: params.id }, select: { organizationId: true, name: true } }),
    null,
  );
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (report.organizationId !== user.organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const alsoEmail = url.searchParams.get('email') === '1';

  if (alsoEmail) {
    const result = await runAndEmailSavedReport(params.id);
    return NextResponse.json(result);
  }

  const result = await runSavedReport(params.id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

  return new NextResponse(result.csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'X-Row-Count': String(result.rowCount),
    },
  });
}
