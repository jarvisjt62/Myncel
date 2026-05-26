import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

// Force Node.js runtime — pdfkit needs Buffer, fs, and the embedded AFM fonts.
// Edge runtime would silently break the format=pdf branch.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/exports/[dataset]?format=csv|pdf
 *
 * Unified CSV / print-ready PDF exporter for machines and alerts.
 * Work orders have their own richer endpoint at /api/work-orders/export.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { dataset: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await safeQuery(
      db.user.findUnique({
        where: { email: session.user.email! },
        select: {
          id: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      }),
      null
    );

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const singleId = searchParams.get('id'); // export a single record
    const dataset = params.dataset;

    const orgName = user.organization?.name || 'Myncel';
    const today = new Date().toISOString().slice(0, 10);

    let title = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (dataset === 'machines') {
      title = 'Machines';
      const machines = await safeQuery(
        db.machine.findMany({
          where: {
            organizationId: user.organizationId,
            ...(singleId ? { id: singleId } : {}),
          },
          orderBy: { name: 'asc' },
          take: 5000,
        }),
        [] as any[]
      );
      headers = [
        'Name', 'Category', 'Manufacturer', 'Model', 'Serial Number',
        'Location', 'Status', 'Criticality', 'Year Installed',
        'Total Hours', 'Last Service',
      ];
      rows = (machines || []).map((m: any) => [
        m.name || '',
        m.category || '',
        m.manufacturer || '',
        m.model || '',
        m.serialNumber || '',
        m.location || '',
        m.status || '',
        m.criticality || '',
        m.yearInstalled ?? '',
        m.totalHours ?? '',
        m.lastServiceAt ? new Date(m.lastServiceAt).toISOString().slice(0, 10) : '',
      ]);
    } else if (dataset === 'alerts') {
      title = 'Alerts';
      const alerts = await safeQuery(
        db.alert.findMany({
          where: {
            organizationId: user.organizationId,
            ...(singleId ? { id: singleId } : {}),
          },
          orderBy: [{ isResolved: 'asc' }, { createdAt: 'desc' }],
          take: 5000,
          include: { machine: { select: { name: true, location: true } } },
        }),
        [] as any[]
      );
      headers = [
        'Title', 'Severity', 'Status', 'Type', 'Machine', 'Location',
        'Message', 'Created', 'Resolved',
      ];
      rows = (alerts || []).map((a: any) => [
        a.title || '',
        a.severity || '',
        a.isResolved ? 'Resolved' : 'Open',
        a.type || '',
        a.machine?.name || '',
        a.machine?.location || '',
        (a.message || '').replace(/\r?\n/g, ' ').slice(0, 500),
        a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : '',
        a.resolvedAt ? new Date(a.resolvedAt).toISOString().slice(0, 10) : '',
      ]);
    } else if (dataset === 'parts') {
      title = 'Parts Inventory';
      const parts = await safeQuery(
        db.part.findMany({
          where: {
            organizationId: user.organizationId,
            ...(singleId ? { id: singleId } : {}),
          },
          orderBy: { name: 'asc' },
          take: 5000,
        }),
        [] as any[]
      );
      headers = [
        'Name', 'Part Number', 'Description', 'Quantity', 'Min Quantity',
        'Unit Cost', 'Supplier', 'Location', 'Status',
      ];
      rows = (parts || []).map((p: any) => [
        p.name || '',
        p.partNumber || '',
        (p.description || '').replace(/\r?\n/g, ' ').slice(0, 300),
        p.quantity ?? 0,
        p.minQuantity ?? 0,
        p.unitCost != null ? Number(p.unitCost).toFixed(2) : '',
        p.supplier || '',
        p.location || '',
        (p.quantity ?? 0) <= 0
          ? 'Out of Stock'
          : (p.quantity ?? 0) <= (p.minQuantity ?? 0)
          ? 'Low Stock'
          : 'In Stock',
      ]);
    } else {
      return NextResponse.json(
        { error: `Unsupported dataset: ${dataset}. Use 'machines', 'alerts', or 'parts'.` },
        { status: 400 }
      );
    }

    if (format === 'csv') {
      const esc = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines = [headers.join(',')];
      for (const r of rows) lines.push(r.map(esc).join(','));
      const csv = lines.join('\n');
      const filename = `${dataset}-${today}.csv`;
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

      const recordLabel = dataset; // 'machines' | 'alerts' | 'parts'
      // Surface severity / status as colored pills in the PDF where applicable.
      let severityColumnIndex: number | undefined;
      let statusColumnIndex: number | undefined;
      if (dataset === 'alerts') {
        severityColumnIndex = headers.indexOf('Severity');
        statusColumnIndex = headers.indexOf('Status');
      } else if (dataset === 'machines') {
        statusColumnIndex = headers.indexOf('Status');
      } else if (dataset === 'parts') {
        statusColumnIndex = headers.indexOf('Status');
      }

      const pdfBuffer = await renderTablePdf({
        title,
        orgName,
        generatedOn: today,
        recordLabel,
        headers,
        rows,
        severityColumnIndex: severityColumnIndex !== undefined && severityColumnIndex >= 0 ? severityColumnIndex : undefined,
        statusColumnIndex: statusColumnIndex !== undefined && statusColumnIndex >= 0 ? statusColumnIndex : undefined,
      });

      const filename = `${dataset}-${today}.pdf`;
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
      const escHtml = (v: any) =>
        v === null || v === undefined
          ? ''
          : String(v)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');

      // Color helpers
      const severityColor = (s: string) => {
        switch (s) {
          case 'CRITICAL': return '#dc2626';
          case 'HIGH': return '#ea580c';
          case 'MEDIUM': return '#d97706';
          case 'LOW': return '#16a34a';
          default: return '#6b7280';
        }
      };
      const statusBg = (s: string) => {
        if (!s) return '#9ca3af';
        const up = s.toUpperCase();
        if (up === 'OPERATIONAL' || up === 'RUNNING' || up === 'RESOLVED') return '#16a34a';
        if (up === 'MAINTENANCE' || up === 'DEGRADED' || up === 'WARNING') return '#d97706';
        if (up === 'OFFLINE' || up === 'CRITICAL' || up === 'OPEN') return '#dc2626';
        return '#6b7280';
      };

      // Render table rows with inline styled pills where applicable
      let tbody = '';
      if (rows.length === 0) {
        tbody = `<tr><td colspan="${headers.length}" style="text-align:center;padding:40px;color:#6b7280">No ${dataset} found.</td></tr>`;
      } else if (dataset === 'machines') {
        tbody = rows
          .map(
            r => `<tr>
              <td><strong>${escHtml(r[0])}</strong></td>
              <td>${escHtml(r[1])}</td>
              <td>${escHtml(r[2])}</td>
              <td>${escHtml(r[3])}</td>
              <td>${escHtml(r[4])}</td>
              <td>${escHtml(r[5])}</td>
              <td><span class="pill" style="background:${statusBg(String(r[6]))}">${escHtml(r[6])}</span></td>
              <td><span class="pill" style="background:${severityColor(String(r[7]))}">${escHtml(r[7])}</span></td>
              <td>${escHtml(r[8]) || '<span class="muted">—</span>'}</td>
              <td>${r[9] !== '' ? Number(r[9]).toFixed(1) + ' hrs' : '<span class="muted">—</span>'}</td>
              <td>${escHtml(r[10]) || '<span class="muted">—</span>'}</td>
            </tr>`
          )
          .join('');
      } else if (dataset === 'alerts') {
        tbody = rows
          .map(
            r => `<tr>
              <td><strong>${escHtml(r[0])}</strong></td>
              <td><span class="pill" style="background:${severityColor(String(r[1]))}">${escHtml(r[1])}</span></td>
              <td><span class="pill" style="background:${statusBg(String(r[2]))}">${escHtml(r[2])}</span></td>
              <td>${escHtml(r[3])}</td>
              <td>${escHtml(r[4])}${r[5] ? `<div class="muted">${escHtml(r[5])}</div>` : ''}</td>
              <td>${escHtml(r[6])}</td>
              <td>${escHtml(r[7]) || '<span class="muted">—</span>'}</td>
              <td>${escHtml(r[8]) || '<span class="muted">—</span>'}</td>
            </tr>`
          )
          .join('');
      } else {
        // parts
        tbody = rows
          .map(
            r => `<tr>
              <td><strong>${escHtml(r[0])}</strong></td>
              <td>${escHtml(r[1]) || '<span class="muted">—</span>'}</td>
              <td>${escHtml(r[2]) || '<span class="muted">—</span>'}</td>
              <td style="text-align:right">${escHtml(r[3])}</td>
              <td style="text-align:right">${escHtml(r[4])}</td>
              <td style="text-align:right">${r[5] !== '' ? '$' + escHtml(r[5]) : '<span class="muted">—</span>'}</td>
              <td>${escHtml(r[6]) || '<span class="muted">—</span>'}</td>
              <td>${escHtml(r[7]) || '<span class="muted">—</span>'}</td>
              <td><span class="pill" style="background:${statusBg(String(r[8]))}">${escHtml(r[8])}</span></td>
            </tr>`
          )
          .join('');
      }

      const displayHeaders = dataset === 'alerts'
        ? ['Title', 'Severity', 'Status', 'Type', 'Machine', 'Message', 'Created', 'Resolved']
        : headers;

      // Build the binary-PDF download URL — preserves any filter params (e.g. ?id=...)
      // but swaps format=html for format=pdf so the toolbar's Download button hits the
      // real PDF endpoint that works inside Capacitor / iOS WebView.
      const pdfParams = new URLSearchParams(searchParams);
      pdfParams.set('format', 'pdf');
      const pdfDownloadHref = `/api/exports/${dataset}?${pdfParams.toString()}`;

      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${escHtml(title)} — ${escHtml(orgName)} — ${today}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #0a2540; margin: 0; padding: 24px; background: #fff; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #635bff; padding-bottom: 16px; margin-bottom: 20px; }
  .logo { font-size: 28px; font-weight: 800; color: #635bff; letter-spacing: -0.5px; }
  .meta { text-align: right; font-size: 11px; color: #4b5563; line-height: 1.5; }
  h1 { font-size: 20px; margin: 0 0 4px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; padding: 8px 6px; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
  td { padding: 8px 6px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 600; color: #fff; }
  .muted { color: #6b7280; }
  footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; display: flex; justify-content: space-between; }
  .report-toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255,255,255,0.96); backdrop-filter: blur(8px); border-bottom: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(15,23,42,0.06); }
  .report-toolbar .back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; background: #f6f9fc; color: #0a2540; border: 1px solid #e6ebf1; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; text-decoration: none; }
  .report-toolbar .back-btn:hover { background: #eef2ff; border-color: #c7d2fe; }
  .report-toolbar .print-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; background: #635bff; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(99,91,255,0.3); }
  /* Hard-floor 32px on top so the toolbar never sits behind a phone status bar.
     Samsung One UI / older Android Chrome both report env(safe-area-inset-top)=0
     even when the URL bar / status bar are drawing over the page, so we can't
     rely on env() alone. The max() picks whichever is bigger. */
  .report-toolbar { padding-top: max(32px, env(safe-area-inset-top, 0px)); padding-left: max(14px, env(safe-area-inset-left, 0px)); padding-right: max(14px, env(safe-area-inset-right, 0px)); }
  body { padding-top: calc(64px + max(32px, env(safe-area-inset-top, 0px))); padding-bottom: max(16px, env(safe-area-inset-bottom, 0px)); padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  @media (max-width: 600px) {
    .report-toolbar .back-btn span.lbl { display: none; }
    /* Replace the long label with a short one on narrow screens via CSS pseudo */
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
    <a class="print-btn" id="printBtn" href="${pdfDownloadHref}" download="${escHtml(dataset)}-${today}.pdf" rel="noopener">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      <span class="lbl">Download PDF</span>
    </a>
  </div>
  <header>
    <div>
      <div class="logo">Myncel</div>
      <h1>${escHtml(title)} Report</h1>
      <div class="muted" style="font-size:11px;">${escHtml(orgName)}</div>
    </div>
    <div class="meta">
      <div><strong>Generated</strong> ${today}</div>
      <div>${rows.length} ${dataset}</div>
    </div>
  </header>
  <table>
    <thead>
      <tr>${displayHeaders.map(h => `<th>${escHtml(h)}</th>`).join('')}</tr>
    </thead>
    <tbody>${tbody}</tbody>
  </table>
  <footer>
    <div>Generated by Myncel · myncel.com</div>
    <div>${rows.length} record${rows.length === 1 ? '' : 's'}</div>
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
        // else: anchor href="/dashboard" handles it natively
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
    console.error('Generic export error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to export' }, { status: 500 });
  }
}
