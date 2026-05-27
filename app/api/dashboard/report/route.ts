import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { formatCurrency } from '@/app/lib/currency';

export const dynamic = 'force-dynamic';

// ── Server-side maintenance-report HTML renderer ─────────────────────
// Used by GET /api/dashboard/report?format=html so the printable
// report can be served as a regular HTML document the user can open
// in a new tab (works in browsers AND Capacitor — Capacitor hands
// _blank links to the system browser via its default link policy).
function buildReportHTML(data: any): string {
  const s = data.summary;
  const now = new Date(data.generatedAt).toLocaleString();
  const completionRate = s.totalWorkOrders > 0
    ? Math.round((s.completedWorkOrders / s.totalWorkOrders) * 100)
    : 0;

  const esc = (str: any) => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Maintenance Report - ${esc(data.organization)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #1a1a2e; background: white; padding: 24px; }
    @page { size: A4; margin: 20mm; }
    h1 { font-size: 22px; font-weight: 700; color: #635bff; margin-bottom: 4px; }
    h2 { font-size: 13px; font-weight: 600; color: #635bff; border-bottom: 2px solid #635bff; padding-bottom: 4px; margin: 20px 0 10px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; gap: 12px; }
    .org { font-size: 14px; color: #6b7280; margin-top: 2px; }
    .meta { text-align: right; color: #6b7280; font-size: 10px; line-height: 1.6; }
    .toolbar { background: #f3f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .toolbar button { background: #635bff; color: white; border: none; border-radius: 6px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .toolbar a { color: #635bff; text-decoration: none; font-size: 12px; font-weight: 600; padding: 8px 14px; border: 1px solid #c7d2fe; border-radius: 6px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8px; }
    @media (max-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .header { flex-direction: column; } .meta { text-align: left; } }
    .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
    .kpi-value { font-size: 22px; font-weight: 700; color: #1a1a2e; }
    .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-top: 2px; }
    .kpi.highlight .kpi-value { color: #635bff; }
    .kpi.red .kpi-value { color: #dc2626; }
    .kpi.green .kpi-value { color: #059669; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -8px; padding: 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 9px; text-transform: uppercase; }
    td { padding: 5px 8px; border: 1px solid #e5e7eb; color: #374151; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-gray { background: #f3f4f6; color: #374151; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 9px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    @media print { body { padding: 0; } .toolbar { display: none; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">🖨️ Print / Save as PDF</button>
    <a href="/dashboard">← Back to Dashboard</a>
  </div>
  <div class="header">
    <div>
      <h1>Maintenance Report</h1>
      <div class="org">${esc(data.organization)}</div>
    </div>
    <div class="meta">
      <div>Generated: ${esc(now)}</div>
      <div>Period: Last ${esc(data.period.days)} days</div>
      <div>${esc(new Date(data.period.startDate).toLocaleDateString())} – ${esc(new Date(data.period.endDate).toLocaleDateString())}</div>
    </div>
  </div>

  <h2>Executive Summary</h2>
  <div class="kpi-grid">
    <div class="kpi highlight"><div class="kpi-value">${s.totalMachines}</div><div class="kpi-label">Total Equipment</div></div>
    <div class="kpi ${s.criticalMachines > 0 ? 'red' : 'green'}"><div class="kpi-value">${s.operationalMachines}</div><div class="kpi-label">Operational</div></div>
    <div class="kpi"><div class="kpi-value">${s.completedWorkOrders}</div><div class="kpi-label">WOs Completed</div></div>
    <div class="kpi ${s.overdueWorkOrders > 0 ? 'red' : ''}"><div class="kpi-value">${s.overdueWorkOrders}</div><div class="kpi-label">Overdue WOs</div></div>
  </div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-value">${esc(formatCurrency(s.totalMaintenanceCost, data.currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 }))}</div><div class="kpi-label">Maint. Cost</div></div>
    <div class="kpi"><div class="kpi-value">${completionRate}%</div><div class="kpi-label">Completion Rate</div></div>
    <div class="kpi ${s.criticalAlerts > 0 ? 'red' : ''}"><div class="kpi-value">${s.unresolvedAlerts}</div><div class="kpi-label">Open Alerts</div></div>
    <div class="kpi"><div class="kpi-value">${s.avgCompletionTimeMinutes > 0 ? Math.round(s.avgCompletionTimeMinutes / 60) + 'h' : '—'}</div><div class="kpi-label">Avg. WO Duration</div></div>
  </div>

  <h2>Equipment Status</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Machine</th><th>Model</th><th>Location</th><th>Status</th><th>Criticality</th><th>Last Service</th><th>WOs</th></tr></thead>
    <tbody>
      ${data.machines.map((m: any) => `
        <tr>
          <td><strong>${esc(m.name)}</strong></td>
          <td>${esc(m.model)}</td>
          <td>${esc(m.location)}</td>
          <td><span class="badge ${m.status === 'OPERATIONAL' ? 'badge-green' : m.status === 'CRITICAL' ? 'badge-red' : 'badge-yellow'}">${esc(m.status)}</span></td>
          <td>${esc(m.criticality)}</td>
          <td>${esc(m.lastService)}</td>
          <td>${esc(m.workOrders)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table></div>

  <h2>Work Orders (Last ${esc(data.period.days)} Days)</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>WO#</th><th>Title</th><th>Machine</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Created</th><th>Cost</th></tr></thead>
    <tbody>
      ${data.workOrders.slice(0, 30).map((wo: any) => `
        <tr>
          <td>${esc(wo.woNumber)}</td>
          <td>${esc(wo.title)}</td>
          <td>${esc(wo.machine)}</td>
          <td><span class="badge ${wo.status === 'COMPLETED' ? 'badge-green' : wo.status === 'IN_PROGRESS' ? 'badge-blue' : wo.status === 'OPEN' ? 'badge-gray' : 'badge-yellow'}">${esc(String(wo.status).replace('_', ' '))}</span></td>
          <td><span class="badge ${wo.priority === 'CRITICAL' ? 'badge-red' : wo.priority === 'HIGH' ? 'badge-yellow' : 'badge-gray'}">${esc(wo.priority)}</span></td>
          <td>${esc(wo.assignedTo)}</td>
          <td>${esc(wo.created)}</td>
          <td>${wo.cost > 0 ? esc(formatCurrency(wo.cost, data.currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 })) : '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table></div>

  <h2>Upcoming Maintenance Schedule</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Task</th><th>Machine</th><th>Frequency</th><th>Priority</th><th>Next Due</th><th>Last Completed</th></tr></thead>
    <tbody>
      ${data.upcomingMaintenance.map((t: any) => `
        <tr>
          <td>${esc(t.title)}</td>
          <td>${esc(t.machine)}</td>
          <td>${esc(t.frequency)}</td>
          <td>${esc(t.priority)}</td>
          <td>${esc(t.nextDue)}</td>
          <td>${esc(t.lastCompleted)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table></div>

  ${data.recentAlerts.length > 0 ? `
  <h2>Recent Alerts</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Title</th><th>Machine</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>
      ${data.recentAlerts.map((a: any) => `
        <tr>
          <td>${esc(a.title)}</td>
          <td>${esc(a.machine)}</td>
          <td><span class="badge ${a.severity === 'CRITICAL' ? 'badge-red' : a.severity === 'HIGH' ? 'badge-yellow' : 'badge-gray'}">${esc(a.severity)}</span></td>
          <td><span class="badge ${a.status === 'Resolved' ? 'badge-green' : 'badge-red'}">${esc(a.status)}</span></td>
          <td>${esc(a.date)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table></div>` : ''}

  <div class="footer">
    <span>Generated by Myncel CMMS</span>
    <span>${esc(data.organization)} · ${esc(now)}</span>
  </div>
</body>
</html>`;
}

// GET /api/dashboard/report - Generate maintenance report data
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const period = searchParams.get('period') || '30'; // days

    const daysBack = parseInt(period);
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch all report data in parallel
    const [org, machines, workOrders, completedWOs, maintenanceTasks, alerts] = await Promise.all([
      db.organization.findUnique({ where: { id: orgId }, select: { name: true, currency: true } }),
      db.machine.findMany({
        where: { organizationId: orgId },
        select: {
          id: true, name: true, model: true, location: true, status: true, criticality: true, lastServiceAt: true,
          _count: { select: { workOrders: true, maintenanceTasks: true } },
        },
        orderBy: { name: 'asc' },
      }),
      db.workOrder.findMany({
        where: { organizationId: orgId, createdAt: { gte: startDate } },
        select: {
          id: true, woNumber: true, title: true, status: true, priority: true, type: true,
          createdAt: true, completedAt: true, dueAt: true, totalCost: true, laborCost: true, partsCost: true,
          machine: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.workOrder.findMany({
        where: { organizationId: orgId, status: 'COMPLETED', completedAt: { gte: startDate } },
        select: { totalCost: true, laborCost: true, partsCost: true, actualMinutes: true, estimatedMinutes: true },
      }),
      db.maintenanceTask.findMany({
        where: { organizationId: orgId, nextDueAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        select: {
          id: true, title: true, frequency: true, priority: true, nextDueAt: true, lastCompletedAt: true,
          machine: { select: { name: true } },
        },
        orderBy: { nextDueAt: 'asc' },
      }),
      db.alert.findMany({
        where: { organizationId: orgId, createdAt: { gte: startDate } },
        select: { id: true, title: true, severity: true, isResolved: true, createdAt: true, machine: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate summary stats
    const totalCost = completedWOs.reduce((sum, wo) => {
      return sum + (wo.totalCost || (wo.laborCost || 0) + (wo.partsCost || 0));
    }, 0);

    const avgCompletionTime = completedWOs
      .filter(wo => wo.actualMinutes)
      .reduce((sum, wo, _, arr) => sum + (wo.actualMinutes! / arr.length), 0);

    const openWOs = workOrders.filter(wo => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS');
    const overdueWOs = workOrders.filter(wo => wo.dueAt && new Date(wo.dueAt) < new Date() && wo.status !== 'COMPLETED');
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && !a.isResolved);

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: { days: daysBack, startDate: startDate.toISOString(), endDate: new Date().toISOString() },
      organization: org?.name || 'Your Organization',
      currency: org?.currency || 'USD',
      summary: {
        totalMachines: machines.length,
        operationalMachines: machines.filter(m => m.status === 'OPERATIONAL').length,
        criticalMachines: machines.filter(m => m.status === 'BREAKDOWN').length,
        totalWorkOrders: workOrders.length,
        completedWorkOrders: workOrders.filter(wo => wo.status === 'COMPLETED').length,
        openWorkOrders: openWOs.length,
        overdueWorkOrders: overdueWOs.length,
        totalMaintenanceCost: Math.round(totalCost * 100) / 100,
        avgCompletionTimeMinutes: Math.round(avgCompletionTime),
        totalAlerts: alerts.length,
        unresolvedAlerts: alerts.filter(a => !a.isResolved).length,
        criticalAlerts: criticalAlerts.length,
      },
      machines: machines.map(m => ({
        name: m.name,
        model: m.model || '—',
        location: m.location || '—',
        status: m.status,
        criticality: m.criticality,
        lastService: m.lastServiceAt ? new Date(m.lastServiceAt).toLocaleDateString() : 'Never',
        workOrders: m._count.workOrders,
        maintenanceTasks: m._count.maintenanceTasks,
      })),
      workOrders: workOrders.slice(0, 50).map(wo => ({
        woNumber: wo.woNumber,
        title: wo.title,
        machine: wo.machine?.name || '—',
        status: wo.status,
        priority: wo.priority,
        type: wo.type,
        assignedTo: wo.assignedTo?.name || 'Unassigned',
        created: new Date(wo.createdAt).toLocaleDateString(),
        completed: wo.completedAt ? new Date(wo.completedAt).toLocaleDateString() : '—',
        cost: wo.totalCost || (wo.laborCost || 0) + (wo.partsCost || 0),
      })),
      upcomingMaintenance: maintenanceTasks.slice(0, 20).map(t => ({
        title: t.title,
        machine: t.machine?.name || '—',
        frequency: t.frequency,
        priority: t.priority,
        nextDue: t.nextDueAt ? new Date(t.nextDueAt).toLocaleDateString() : '—',
        lastCompleted: t.lastCompletedAt ? new Date(t.lastCompletedAt).toLocaleDateString() : 'Never',
      })),
      recentAlerts: alerts.slice(0, 20).map(a => ({
        title: a.title,
        machine: a.machine?.name || '—',
        severity: a.severity,
        status: a.isResolved ? 'Resolved' : 'Active',
        date: new Date(a.createdAt).toLocaleDateString(),
      })),
    };

    if (format === 'csv') {
      // Generate CSV report
      const lines: string[] = [];
      lines.push(`Maintenance Report - ${reportData.organization}`);
      lines.push(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`);
      lines.push(`Period: Last ${daysBack} days`);
      lines.push('');
      lines.push('SUMMARY');
      lines.push(`Total Machines,${reportData.summary.totalMachines}`);
      lines.push(`Operational,${reportData.summary.operationalMachines}`);
      lines.push(`Critical,${reportData.summary.criticalMachines}`);
      lines.push(`Total Work Orders,${reportData.summary.totalWorkOrders}`);
      lines.push(`Completed,${reportData.summary.completedWorkOrders}`);
      lines.push(`Open,${reportData.summary.openWorkOrders}`);
      lines.push(`Overdue,${reportData.summary.overdueWorkOrders}`);
      lines.push(`Total Cost,${reportData.currency} ${reportData.summary.totalMaintenanceCost}`);
      lines.push(`Unresolved Alerts,${reportData.summary.unresolvedAlerts}`);
      lines.push('');
      lines.push('WORK ORDERS');
      lines.push(`WO#,Title,Machine,Status,Priority,Assigned To,Created,Completed,Cost (${reportData.currency})`);
      reportData.workOrders.forEach(wo => {
        lines.push(`${wo.woNumber},"${wo.title}","${wo.machine}",${wo.status},${wo.priority},"${wo.assignedTo}",${wo.created},${wo.completed},${wo.cost}`);
      });
      lines.push('');
      lines.push('UPCOMING MAINTENANCE');
      lines.push('Task,Machine,Frequency,Priority,Next Due,Last Completed');
      reportData.upcomingMaintenance.forEach(t => {
        lines.push(`"${t.title}","${t.machine}",${t.frequency},${t.priority},${t.nextDue},${t.lastCompleted}`);
      });

      const csv = lines.join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="maintenance_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'html') {
      // Server-rendered printable HTML. The toolbar inside the page
      // gives the user a Print button AND a "Back to Dashboard" link
      // — essential because in Capacitor the system browser tab has
      // no obvious way back to the app.
      const html = buildReportHTML(reportData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}