/**
 * lib/reports/runner.ts
 *
 * Execute a SavedReport: query the dataset, serialise to CSV, and
 * optionally email the result to the recipient list.
 */

import { db, safeQuery } from '@/lib/db';
import { DATASETS, rowsToCsv, type ReportDataset, type DatasetFilters } from './datasets';
import { sendEmail } from '@/lib/email';

export interface RunReportResult {
  success: boolean;
  csv: string;
  rowCount: number;
  filename: string;
  error?: string;
}

export async function runSavedReport(reportId: string): Promise<RunReportResult> {
  const report = await safeQuery(
    db.savedReport.findUnique({
      where: { id: reportId },
      include: { organization: { select: { name: true } } },
    }),
    null,
  );

  if (!report) {
    return { success: false, csv: '', rowCount: 0, filename: '', error: 'Report not found' };
  }

  const dataset = DATASETS[report.dataset as ReportDataset];
  if (!dataset) {
    return { success: false, csv: '', rowCount: 0, filename: '', error: `Unknown dataset: ${report.dataset}` };
  }

  let rows: Awaited<ReturnType<typeof dataset.run>> = [];
  try {
    rows = await dataset.run(report.organizationId, (report.filters as DatasetFilters) || {});
  } catch (err: any) {
    const msg = err?.message || String(err);
    await safeQuery(
      db.savedReport.update({
        where: { id: reportId },
        data: { lastRunAt: new Date(), lastRunOk: false, lastError: msg },
      }),
      null,
    );
    return { success: false, csv: '', rowCount: 0, filename: '', error: msg };
  }

  const csv = rowsToCsv(dataset.columns, rows);

  const safeName = (report.name || 'report').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 60);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${safeName}-${stamp}.csv`;

  await safeQuery(
    db.savedReport.update({
      where: { id: reportId },
      data: {
        lastRunAt: new Date(),
        lastRunOk: true,
        lastRunRows: rows.length,
        lastError: null,
      },
    }),
    null,
  );

  return { success: true, csv, rowCount: rows.length, filename };
}

/**
 * Run + email to the report's recipient list. Used by the cron.
 */
export async function runAndEmailSavedReport(reportId: string): Promise<{
  success: boolean;
  rowCount: number;
  emailedTo: string[];
  error?: string;
}> {
  const report = await safeQuery(
    db.savedReport.findUnique({
      where: { id: reportId },
      include: { organization: { select: { name: true } } },
    }),
    null,
  );
  if (!report) return { success: false, rowCount: 0, emailedTo: [], error: 'Report not found' };

  const result = await runSavedReport(reportId);
  if (!result.success) {
    return { success: false, rowCount: 0, emailedTo: [], error: result.error };
  }

  const recipients: string[] = Array.isArray(report.recipients)
    ? (report.recipients as string[]).filter(r => typeof r === 'string' && r.includes('@'))
    : [];

  if (!recipients.length) {
    return { success: true, rowCount: result.rowCount, emailedTo: [] };
  }

  const orgName = (report as any).organization?.name || 'Myncel';
  const subject = `[${orgName}] ${report.name} — ${result.rowCount} row${result.rowCount === 1 ? '' : 's'}`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;line-height:1.5">
      <h2 style="color:#0a2540;margin-top:0">${escapeHtml(report.name)}</h2>
      <p>Your scheduled <strong>${escapeHtml(report.dataset)}</strong> report ran successfully on
        <strong>${new Date().toUTCString()}</strong>.</p>
      <p>The CSV is attached. <strong>${result.rowCount}</strong> row${result.rowCount === 1 ? '' : 's'} matched your filters.</p>
      ${report.description ? `<p style="color:#6b7280;font-size:14px;border-left:3px solid #635bff;padding-left:12px;margin:16px 0">${escapeHtml(report.description)}</p>` : ''}
      <p style="margin-top:24px">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.myncel.com'}/reports/${report.id}"
           style="background:#635bff;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">
          Open in Myncel
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#6b7280;font-size:12px">You received this email because you are a recipient of the
        "<strong>${escapeHtml(report.name)}</strong>" saved report in your Myncel workspace. To change recipients
        or pause the schedule, visit /reports.</p>
    </div>`;

  await sendEmail({
    to: recipients,
    subject,
    html,
    attachments: [
      { filename: result.filename, content: result.csv, contentType: 'text/csv' },
    ],
  });

  return { success: true, rowCount: result.rowCount, emailedTo: recipients };
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
