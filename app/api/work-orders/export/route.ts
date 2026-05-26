import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';
import { formatCurrency } from '@/app/lib/currency';

// Force Node.js runtime — pdfkit needs Buffer, fs, and the embedded AFM fonts.
// Edge runtime would silently break the format=pdf branch.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/work-orders/export?format=csv|pdf&status=ALL|OPEN|...
 *
 * Streams a CSV download, or an HTML document (ready for "Save as PDF" /
 * wkhtmltopdf conversion) of the organization's work orders.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true, organizationId: true, organization: { select: { name: true, currency: true } } },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const status = searchParams.get('status') || 'ALL';
    const singleId = searchParams.get('id'); // export a single record

    const where: any = { organizationId: user.organizationId };
    if (singleId) {
      where.id = singleId;
    } else if (status && status !== 'ALL') {
      where.status = status;
    }

    const workOrders = await safeQuery(
      db.workOrder.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 5000,
        include: {
          machine: { select: { name: true, location: true } },
          assignedTo: { select: { name: true, email: true } },
        },
      }),
      [] as any[]
    );

    const rows = (workOrders || []).map((wo: any) => ({
      woNumber: wo.woNumber || wo.id.slice(0, 8),
      title: wo.title || '',
      type: wo.type || '',
      priority: wo.priority || '',
      status: wo.status || '',
      machine: wo.machine?.name || '',
      location: wo.machine?.location || '',
      assignedTo: wo.assignedTo?.name || wo.assignedTo?.email || '',
      scheduled: wo.scheduledAt ? new Date(wo.scheduledAt).toISOString().slice(0, 10) : '',
      due: wo.dueAt ? new Date(wo.dueAt).toISOString().slice(0, 10) : '',
      started: wo.startedAt ? new Date(wo.startedAt).toISOString().slice(0, 10) : '',
      completed: wo.completedAt ? new Date(wo.completedAt).toISOString().slice(0, 10) : '',
      estMinutes: wo.estimatedMinutes ?? '',
      actualMinutes: wo.actualMinutes ?? '',
      laborCost: wo.laborCost ?? '',
      partsCost: wo.partsCost ?? '',
      totalCost: wo.totalCost ?? '',
      notes: (wo.notes || '').replace(/\r?\n/g, ' ').slice(0, 500),
    }));

    const orgName = user.organization?.name || 'Myncel';
    const orgCurrency = user.organization?.currency || 'USD';
    const today = new Date().toISOString().slice(0, 10);
    const filterLabel = status === 'ALL' ? 'All' : status.replace('_', ' ');

    if (format === 'csv') {
      const headers = [
        'WO #', 'Title', 'Type', 'Priority', 'Status', 'Machine', 'Location',
        'Assigned To', 'Scheduled', 'Due', 'Started', 'Completed',
        'Est. Minutes', 'Actual Minutes', 'Labor Cost', 'Parts Cost', 'Total Cost', 'Notes'
      ];
      const esc = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const csvLines = [headers.join(',')];
      for (const r of rows) {
        csvLines.push([
          r.woNumber, r.title, r.type, r.priority, r.status, r.machine, r.location,
          r.assignedTo, r.scheduled, r.due, r.started, r.completed,
          r.estMinutes, r.actualMinutes, r.laborCost, r.partsCost, r.totalCost, r.notes
        ].map(esc).join(','));
      }
      const csv = csvLines.join('\n');
      const filename = `work-orders-${filterLabel.toLowerCase().replace(/\s+/g, '-')}-${today}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'pdf') {
      // Real binary PDF — works inside Capacitor WebView (iOS WKWebView ignores
      // window.print(), so the previous HTML-print approach silently failed in the
      // mobile app). The browser/WebView downloads or previews the file natively.
      const { renderTablePdf } = await import('@/lib/pdf/render-table');

      const headers = [
        'WO #', 'Title', 'Type', 'Priority', 'Status', 'Machine', 'Location',
        'Assigned To', 'Due', 'Total Cost',
      ];
      const tableRows = rows.map(r => [
        r.woNumber,
        r.title,
        r.type,
        r.priority,
        r.status,
        r.machine,
        r.location,
        r.assignedTo,
        r.due,
        r.totalCost !== '' && r.totalCost != null ? formatCurrency(Number(r.totalCost), orgCurrency) : '',
      ]);

      const pdfBuffer = await renderTablePdf({
        title: `Work Orders — ${filterLabel}`,
        orgName,
        generatedOn: today,
        recordLabel: 'work orders',
        headers,
        rows: tableRows,
        severityColumnIndex: 3, // Priority
        statusColumnIndex: 4, // Status
      });

      const filename = `work-orders-${filterLabel.toLowerCase().replace(/\s+/g, '-')}-${today}.pdf`;
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(pdfBuffer.length),
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'html') {
      // Return a clean print-ready HTML doc. The client opens it in a new tab
      // and uses "Save as PDF" from the browser's native print dialog.
      const escHtml = (v: any) => {
        if (v === null || v === undefined) return '';
        return String(v)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };
      const priorityColor = (p: string) => {
        switch (p) {
          case 'URGENT':
          case 'CRITICAL': return '#dc2626';
          case 'HIGH': return '#ea580c';
          case 'MEDIUM': return '#d97706';
          case 'LOW': return '#16a34a';
          default: return '#6b7280';
        }
      };
      const statusColor = (s: string) => {
        switch (s) {
          case 'OPEN': return '#2563eb';
          case 'IN_PROGRESS': return '#d97706';
          case 'ON_HOLD': return '#6b7280';
          case 'COMPLETED': return '#16a34a';
          case 'CANCELLED': return '#dc2626';
          default: return '#6b7280';
        }
      };

      const totalCost = rows.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
      const openCount = rows.filter(r => r.status === 'OPEN').length;
      const inProgressCount = rows.filter(r => r.status === 'IN_PROGRESS').length;
      const completedCount = rows.filter(r => r.status === 'COMPLETED').length;

      // Build the binary-PDF download URL — preserves filter params (?status=, ?id=)
      // but swaps format=html for format=pdf so the toolbar's Download button hits
      // the real PDF endpoint that works inside Capacitor / iOS WebView.
      const pdfParams = new URLSearchParams(searchParams);
      pdfParams.set('format', 'pdf');
      const pdfDownloadHref = `/api/work-orders/export?${pdfParams.toString()}`;

      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Work Orders — ${escHtml(orgName)} — ${today}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #0a2540; margin: 0; padding: 24px; background: #fff; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #635bff; padding-bottom: 16px; margin-bottom: 20px; }
  .logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #635bff; }
  .meta { text-align: right; font-size: 11px; color: #4b5563; line-height: 1.5; }
  h1 { font-size: 20px; margin: 0 0 4px 0; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
  .card .label { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; }
  .card .value { font-size: 20px; font-weight: 700; color: #0a2540; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; padding: 8px 6px; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
  td { padding: 8px 6px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 600; color: #fff; }
  .muted { color: #6b7280; }
  footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; display: flex; justify-content: space-between; }
  .report-toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255,255,255,0.96); backdrop-filter: blur(8px); border-bottom: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(15,23,42,0.06); padding-top: max(32px, env(safe-area-inset-top, 0px)); padding-left: max(14px, env(safe-area-inset-left, 0px)); padding-right: max(14px, env(safe-area-inset-right, 0px)); }
  .report-toolbar .back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; background: #f6f9fc; color: #0a2540; border: 1px solid #e6ebf1; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; text-decoration: none; }
  .report-toolbar .back-btn:hover { background: #eef2ff; border-color: #c7d2fe; }
  .report-toolbar .print-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; background: #635bff; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(99,91,255,0.3); }
  body { padding-top: calc(64px + max(32px, env(safe-area-inset-top, 0px))); padding-bottom: max(16px, env(safe-area-inset-bottom, 0px)); padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  @media (max-width: 600px) {
    .report-toolbar .back-btn span.lbl { display: none; }
    .report-toolbar .print-btn span.lbl { display: none; }
    .report-toolbar .print-btn::after { content: 'PDF'; font-weight: 600; font-size: 12px; margin-left: 2px; }
    .report-toolbar .back-btn, .report-toolbar .print-btn { padding: 9px 14px; min-height: 40px; }
    body { font-size: 11px; padding: calc(64px + max(32px, env(safe-area-inset-top, 0px))) 12px 16px 12px; }
    table { font-size: 9px; }
    th, td { padding: 5px 4px; }
  }
  @media print { .no-print { display: none !important; } body { padding: 0 !important; } }
</style>
</head>
<body>
  <div class="report-toolbar no-print">
    <a href="/dashboard" class="back-btn" id="backBtn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      <span class="lbl">Back to Dashboard</span>
    </a>
    <a class="print-btn" id="printBtn" href="${pdfDownloadHref}" download="work-orders-${filterLabel.toLowerCase().replace(/\s+/g, '-')}-${today}.pdf" rel="noopener">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      <span class="lbl">Download PDF</span>
    </a>
  </div>

  <header>
    <div>
      <div class="logo">Myncel</div>
      <h1>Work Orders Report</h1>
      <div class="muted" style="font-size:11px;">${escHtml(orgName)} · Filter: ${escHtml(filterLabel)}</div>
    </div>
    <div class="meta">
      <div><strong>Generated</strong> ${today}</div>
      <div>${rows.length} work order${rows.length === 1 ? '' : 's'}</div>
    </div>
  </header>

  <div class="summary">
    <div class="card"><div class="label">Total</div><div class="value">${rows.length}</div></div>
    <div class="card"><div class="label">Open</div><div class="value" style="color:#2563eb">${openCount}</div></div>
    <div class="card"><div class="label">In Progress</div><div class="value" style="color:#d97706">${inProgressCount}</div></div>
    <div class="card"><div class="label">Completed</div><div class="value" style="color:#16a34a">${completedCount}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>WO #</th><th>Title</th><th>Priority</th><th>Status</th>
        <th>Machine</th><th>Assigned</th><th>Due</th><th>Completed</th>
        <th style="text-align:right">Cost</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? `<tr><td colspan="9" style="text-align:center;padding:40px;color:#6b7280">No work orders found.</td></tr>`
          : rows
              .map(r => `
        <tr>
          <td><strong>${escHtml(r.woNumber)}</strong></td>
          <td>${escHtml(r.title)}</td>
          <td><span class="pill" style="background:${priorityColor(r.priority)}">${escHtml(r.priority)}</span></td>
          <td><span class="pill" style="background:${statusColor(r.status)}">${escHtml(r.status.replace('_', ' '))}</span></td>
          <td>${escHtml(r.machine)}${r.location ? `<div class="muted">${escHtml(r.location)}</div>` : ''}</td>
          <td>${escHtml(r.assignedTo) || '<span class="muted">Unassigned</span>'}</td>
          <td>${escHtml(r.due) || '<span class="muted">—</span>'}</td>
          <td>${escHtml(r.completed) || '<span class="muted">—</span>'}</td>
          <td style="text-align:right">${r.totalCost !== '' ? formatCurrency(Number(r.totalCost), orgCurrency) : '<span class="muted">—</span>'}</td>
        </tr>`)
              .join('')
      }
    </tbody>
  </table>

  <footer>
    <div>Generated by Myncel · myncel.com</div>
    <div>Total cost: <strong>${formatCurrency(totalCost, orgCurrency)}</strong></div>
  </footer>

  <script>
    // Smart back: prefer history if there's a previous entry inside the same
    // origin (regular web flow). Fall back to /dashboard for Capacitor /
    // direct-link / new-tab opens where there is no in-app history.
    (function () {
      var btn = document.getElementById('backBtn');
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        var canGoBack = window.history.length > 1 && document.referrer && document.referrer.indexOf(window.location.origin) === 0;
        if (canGoBack) {
          e.preventDefault();
          window.history.back();
        }
      });
    })();
    // The Print button is a plain <a href download> pointing at format=pdf — no
    // JS needed. This works inside the Capacitor app (WebView treats the response
    // as a download), in mobile Safari / Chrome (download or share-sheet preview),
    // and on desktop browsers (download).
  </script>
</body>
</html>`;

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format. Use csv or pdf.' }, { status: 400 });
  } catch (err: any) {
    console.error('Work order export error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to export' }, { status: 500 });
  }
}
