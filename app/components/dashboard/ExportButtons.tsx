'use client';

import { useState } from 'react';

type ExportType = 'equipment' | 'workorders' | 'tasks';

function CSVExportButton({ type, label }: { type: ExportType; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const icons: Record<ExportType, React.ReactNode> = {
    equipment: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    workorders: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    tasks: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/export?type=${type}`);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Export failed');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      title={`Export ${label} as CSV`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-surface-2)] hover:border-[#635bff] hover:text-[#635bff] transition-all disabled:opacity-50"
    >
      {loading ? (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icons[type]}
      {error ? <span className="text-red-500">{error}</span> : label}
    </button>
  );
}

export default function ExportButtons() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('30');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingCSV, setGeneratingCSV] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchReportData = async (period: string) => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/dashboard/report?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch {/* ignore */}
    finally { setLoadingPreview(false); }
  };

  const openReportModal = () => {
    setShowReportModal(true);
    fetchReportData(reportPeriod);
  };

  const handlePeriodChange = (period: string) => {
    setReportPeriod(period);
    fetchReportData(period);
  };

  const downloadCSVReport = async () => {
    setGeneratingCSV(true);
    try {
      const res = await fetch(`/api/dashboard/report?format=csv&period=${reportPeriod}`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {/* ignore */}
    finally { setGeneratingCSV(false); }
  };

  const downloadPDFReport = async () => {
    if (!reportData) return;
    setGeneratingPDF(true);
    try {
      // Build HTML for PDF
      const html = buildReportHTML(reportData);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            // printWindow.close(); // Let user close after print
          }, 500);
        };
      }
    } catch {/* ignore */}
    finally { setGeneratingPDF(false); }
  };

  const buildReportHTML = (data: any) => {
    const s = data.summary;
    const now = new Date(data.generatedAt).toLocaleString();
    const completionRate = s.totalWorkOrders > 0
      ? Math.round((s.completedWorkOrders / s.totalWorkOrders) * 100)
      : 0;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Maintenance Report - ${data.organization}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; color: #1a1a2e; background: white; padding: 24px; }
    @page { size: A4; margin: 20mm; }
    h1 { font-size: 22px; font-weight: 700; color: #635bff; margin-bottom: 4px; }
    h2 { font-size: 13px; font-weight: 600; color: #635bff; border-bottom: 2px solid #635bff; padding-bottom: 4px; margin: 20px 0 10px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
    .org { font-size: 14px; color: #6b7280; margin-top: 2px; }
    .meta { text-align: right; color: #6b7280; font-size: 10px; line-height: 1.6; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8px; }
    .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
    .kpi-value { font-size: 22px; font-weight: 700; color: #1a1a2e; }
    .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-top: 2px; }
    .kpi.highlight .kpi-value { color: #635bff; }
    .kpi.red .kpi-value { color: #dc2626; }
    .kpi.green .kpi-value { color: #059669; }
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
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 9px; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Maintenance Report</h1>
      <div class="org">${data.organization}</div>
    </div>
    <div class="meta">
      <div>Generated: ${now}</div>
      <div>Period: Last ${data.period.days} days</div>
      <div>${new Date(data.period.startDate).toLocaleDateString()} – ${new Date(data.period.endDate).toLocaleDateString()}</div>
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
    <div class="kpi"><div class="kpi-value">$${s.totalMaintenanceCost.toLocaleString()}</div><div class="kpi-label">Maint. Cost</div></div>
    <div class="kpi"><div class="kpi-value">${completionRate}%</div><div class="kpi-label">Completion Rate</div></div>
    <div class="kpi ${s.criticalAlerts > 0 ? 'red' : ''}"><div class="kpi-value">${s.unresolvedAlerts}</div><div class="kpi-label">Open Alerts</div></div>
    <div class="kpi"><div class="kpi-value">${s.avgCompletionTimeMinutes > 0 ? Math.round(s.avgCompletionTimeMinutes / 60) + 'h' : '—'}</div><div class="kpi-label">Avg. WO Duration</div></div>
  </div>

  <h2>Equipment Status</h2>
  <table>
    <thead><tr><th>Machine</th><th>Model</th><th>Location</th><th>Status</th><th>Criticality</th><th>Last Service</th><th>WOs</th></tr></thead>
    <tbody>
      ${data.machines.map((m: any) => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.model}</td>
          <td>${m.location}</td>
          <td><span class="badge ${m.status === 'OPERATIONAL' ? 'badge-green' : m.status === 'CRITICAL' ? 'badge-red' : 'badge-yellow'}">${m.status}</span></td>
          <td>${m.criticality}</td>
          <td>${m.lastService}</td>
          <td>${m.workOrders}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Work Orders (Last ${data.period.days} Days)</h2>
  <table>
    <thead><tr><th>WO#</th><th>Title</th><th>Machine</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Created</th><th>Cost</th></tr></thead>
    <tbody>
      ${data.workOrders.slice(0, 30).map((wo: any) => `
        <tr>
          <td class="font-mono">${wo.woNumber}</td>
          <td>${wo.title}</td>
          <td>${wo.machine}</td>
          <td><span class="badge ${wo.status === 'COMPLETED' ? 'badge-green' : wo.status === 'IN_PROGRESS' ? 'badge-blue' : wo.status === 'OPEN' ? 'badge-gray' : 'badge-yellow'}">${wo.status.replace('_', ' ')}</span></td>
          <td><span class="badge ${wo.priority === 'CRITICAL' ? 'badge-red' : wo.priority === 'HIGH' ? 'badge-yellow' : 'badge-gray'}">${wo.priority}</span></td>
          <td>${wo.assignedTo}</td>
          <td>${wo.created}</td>
          <td>${wo.cost > 0 ? '$' + wo.cost.toFixed(0) : '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Upcoming Maintenance Schedule</h2>
  <table>
    <thead><tr><th>Task</th><th>Machine</th><th>Frequency</th><th>Priority</th><th>Next Due</th><th>Last Completed</th></tr></thead>
    <tbody>
      ${data.upcomingMaintenance.map((t: any) => `
        <tr>
          <td>${t.title}</td>
          <td>${t.machine}</td>
          <td>${t.frequency}</td>
          <td>${t.priority}</td>
          <td>${t.nextDue}</td>
          <td>${t.lastCompleted}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${data.recentAlerts.length > 0 ? `
  <h2>Recent Alerts</h2>
  <table>
    <thead><tr><th>Title</th><th>Machine</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>
      ${data.recentAlerts.map((a: any) => `
        <tr>
          <td>${a.title}</td>
          <td>${a.machine}</td>
          <td><span class="badge ${a.severity === 'CRITICAL' ? 'badge-red' : a.severity === 'HIGH' ? 'badge-yellow' : 'badge-gray'}">${a.severity}</span></td>
          <td><span class="badge ${a.status === 'Resolved' ? 'badge-green' : 'badge-red'}">${a.status}</span></td>
          <td>${a.date}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>` : ''}

  <div class="footer">
    <span>Generated by Myncel CMMS</span>
    <span>${data.organization} · ${now}</span>
  </div>
</body>
</html>`;
  };

  const getBadgeClass = (val: string, type: string) => {
    if (type === 'status') {
      if (val === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
      if (val === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700';
      if (val === 'OPEN') return 'bg-gray-100 text-gray-600';
      return 'bg-amber-100 text-amber-700';
    }
    if (type === 'severity' || type === 'priority') {
      if (val === 'CRITICAL') return 'bg-red-100 text-red-700';
      if (val === 'HIGH') return 'bg-orange-100 text-orange-700';
      if (val === 'MEDIUM') return 'bg-amber-100 text-amber-700';
      return 'bg-gray-100 text-gray-600';
    }
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <>
      <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export & Reports
          </h3>
        </div>

        {/* CSV Quick Exports */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">CSV Export</p>
          <div className="flex flex-wrap gap-2">
            <CSVExportButton type="equipment" label="Equipment" />
            <CSVExportButton type="workorders" label="Work Orders" />
            <CSVExportButton type="tasks" label="Tasks" />
          </div>
        </div>

        {/* Maintenance Report */}
        <div className="pt-3 border-t border-[var(--border)]">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Full Reports</p>
          <button
            onClick={openReportModal}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#635bff]/30 bg-[#635bff]/5 text-[#635bff] hover:bg-[#635bff]/10 transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Maintenance Report
            <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Maintenance Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReportModal(false)} />
          <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 [background:var(--bg-surface)] z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#635bff]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Maintenance Report</h2>
                  <p className="text-xs text-[var(--text-muted)]">Summary report with KPIs, equipment, and work orders</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              {/* Period Selector */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs text-[var(--text-muted)] font-medium">Period:</span>
                {[
                  { label: '7 days', value: '7' },
                  { label: '30 days', value: '30' },
                  { label: '90 days', value: '90' },
                ].map(p => (
                  <button
                    key={p.value}
                    onClick={() => handlePeriodChange(p.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-all ${
                      reportPeriod === p.value
                        ? 'bg-[#635bff] text-white border-[#635bff]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={downloadCSVReport}
                    disabled={generatingCSV || !reportData}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:border-[#635bff] hover:text-[#635bff] transition-all disabled:opacity-50"
                  >
                    {generatingCSV ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/></svg>
                    )}
                    CSV
                  </button>
                  <button
                    onClick={downloadPDFReport}
                    disabled={generatingPDF || !reportData}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#635bff] text-white rounded-lg hover:bg-[#4f46e5] transition-all disabled:opacity-50"
                  >
                    {generatingPDF ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    )}
                    Print / PDF
                  </button>
                </div>
              </div>

              {loadingPreview ? (
                <div className="space-y-3 animate-pulse">
                  <div className="grid grid-cols-4 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-16 bg-[var(--bg-surface-2)] rounded-xl" />)}
                  </div>
                  <div className="h-40 bg-[var(--bg-surface-2)] rounded-xl" />
                </div>
              ) : reportData ? (
                <div className="space-y-5">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Equipment', value: reportData.summary.totalMachines, sub: `${reportData.summary.operationalMachines} operational`, color: 'text-[#635bff]' },
                      { label: 'WOs Completed', value: reportData.summary.completedWorkOrders, sub: `of ${reportData.summary.totalWorkOrders} total`, color: 'text-emerald-600' },
                      { label: 'Overdue', value: reportData.summary.overdueWorkOrders, sub: 'work orders', color: reportData.summary.overdueWorkOrders > 0 ? 'text-red-600' : 'text-emerald-600' },
                      { label: 'Cost', value: `$${reportData.summary.totalMaintenanceCost.toLocaleString()}`, sub: 'maintenance spend', color: 'text-[var(--text-primary)]' },
                    ].map(kpi => (
                      <div key={kpi.label} className="rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] p-3 text-center">
                        <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mt-0.5">{kpi.label}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Work Orders Table */}
                  {reportData.workOrders.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Recent Work Orders</h4>
                      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[var(--bg-surface-2)]">
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">WO#</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">Title</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">Machine</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">Status</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {reportData.workOrders.slice(0, 10).map((wo: any) => (
                              <tr key={wo.woNumber} className="hover:bg-[var(--bg-surface-2)]">
                                <td className="px-3 py-2 font-mono text-[var(--text-muted)]">{wo.woNumber}</td>
                                <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{wo.title}</td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">{wo.machine}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getBadgeClass(wo.status, 'status')}`}>
                                    {wo.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">
                                  {wo.cost > 0 ? `$${wo.cost.toFixed(0)}` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Maintenance */}
                  {reportData.upcomingMaintenance.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Upcoming Maintenance</h4>
                      <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[var(--bg-surface-2)]">
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">Task</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">Machine</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">Next Due</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold">Priority</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {reportData.upcomingMaintenance.slice(0, 8).map((t: any, i: number) => (
                              <tr key={i} className="hover:bg-[var(--bg-surface-2)]">
                                <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{t.title}</td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">{t.machine}</td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">{t.nextDue}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getBadgeClass(t.priority, 'priority')}`}>
                                    {t.priority}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-[var(--text-muted)] py-8">Failed to load report data</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}