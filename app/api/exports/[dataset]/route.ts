import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, safeQuery } from '@/lib/db';

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
          where: { organizationId: user.organizationId },
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
          where: { organizationId: user.organizationId },
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
    } else {
      return NextResponse.json(
        { error: `Unsupported dataset: ${dataset}. Use 'machines' or 'alerts'.` },
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

    if (format === 'pdf' || format === 'html') {
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
      } else {
        // alerts
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
      }

      const displayHeaders = dataset === 'alerts'
        ? ['Title', 'Severity', 'Status', 'Type', 'Machine', 'Message', 'Created', 'Resolved']
        : headers;

      const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
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
  .print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 20px; background: #635bff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(99,91,255,0.3); }
  @media print { .no-print { display: none !important; } body { padding: 0; } }
</style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
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
    if (window.location.search.includes('autoprint=1')) {
      setTimeout(() => window.print(), 500);
    }
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
