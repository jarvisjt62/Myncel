'use client';

import { useState } from 'react';
import { formatCurrency } from '@/app/lib/currency';

type ExportType = 'equipment' | 'workorders' | 'tasks';

function CSVExportButton({ type, label }: { type: ExportType; label: string }) {
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

  // ── CSV download as a real <a> link ─────────────────────────────────
  // The previous fetch + blob + a.click() pattern is silently broken in
  // the Capacitor Android WebView (the WebView ignores [download] on
  // dynamically-created <a> elements). A plain anchor with [download]
  // works reliably:
  //   • On the web, the browser triggers a normal download (the API
  //     route already sets Content-Disposition: attachment).
  //   • In Capacitor, the click interceptor in app/layout.tsx sees the
  //     [download] attribute and hands the URL off to the system
  //     browser via window.open(_, '_blank'), where the existing
  //     myncel.com session cookie completes the download.
  const today = new Date().toISOString().split('T')[0];
  const href = `/api/dashboard/export?type=${type}`;
  const filename = `${type}_export_${today}.csv`;

  return (
    <a
      href={href}
      download={filename}
      target="_blank"
      rel="noopener"
      title={`Export ${label} as CSV`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-surface-2)] hover:border-[#635bff] hover:text-[#635bff] transition-all no-underline"
    >
      {icons[type]}
      {label}
    </a>
  );
}

export default function ExportButtons() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('30');
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
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center modal-safe-pad"
          style={{
            // Belt-and-braces: hard-floor the safe-area padding so the
            // modal panel can never sit under the Samsung / Sony status
            // bar (which can be ~48px on devices with camera cutouts) or
            // under the bottom gesture nav, even if env() returns 0.
            // We anchor to top on mobile (items-start) so the panel
            // always sits below the safe-area zone deterministically.
            paddingTop: 'max(56px, var(--safe-area-top, 0px), calc(env(safe-area-inset-top, 0px) + 16px))',
            paddingBottom: 'max(24px, var(--safe-area-bottom, 0px), env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(8px, var(--safe-area-left, 0px), env(safe-area-inset-left, 0px))',
            paddingRight: 'max(8px, var(--safe-area-right, 0px), env(safe-area-inset-right, 0px))',
          }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReportModal(false)} />
          <div
            className="relative rounded-2xl [background:var(--bg-surface)] shadow-2xl w-full max-w-2xl overflow-y-auto border border-[var(--border)] overscroll-contain"
            style={{
              // Hard cap at 100% of the AVAILABLE area (which is already
              // viewport minus the wrapper's safe-area padding above).
              maxHeight: '100%',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-2 p-4 sm:p-5 border-b border-[var(--border)] sticky top-0 [background:var(--bg-surface)] z-10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-[#635bff]/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">Maintenance Report</h2>
                  <p className="text-xs text-[var(--text-muted)] truncate">Summary report with KPIs, equipment, and work orders</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div
              className="p-5"
              style={{
                paddingBottom: 'calc(1.25rem + var(--safe-area-bottom, 0px))',
              }}
            >
              {/* Period Selector */}
              <div className="flex items-center flex-wrap gap-2 mb-5">
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
                <div className="ml-auto flex flex-wrap gap-2">
                  {/* CSV — direct anchor link. The API sets Content-Disposition
                      so the browser downloads the file. The [download] attribute
                      makes our Capacitor click interceptor route the URL through
                      the system browser (where the cookie session lets the
                      download complete reliably on Samsung / Sony). */}
                  <a
                    href={`/api/dashboard/report?format=csv&period=${reportPeriod}`}
                    download={`maintenance_report_${new Date().toISOString().split('T')[0]}.csv`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:border-[#635bff] hover:text-[#635bff] transition-all no-underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/></svg>
                    CSV
                  </a>
                  {/* Print / PDF — opens a server-rendered HTML page with a
                      built-in toolbar (Print, Back to Dashboard). target=_blank
                      makes Capacitor open it in the system browser, where the
                      browser's native back button + the page's "Back to
                      Dashboard" link both return the user to the app. */}
                  <a
                    href={`/api/dashboard/report?format=html&period=${reportPeriod}`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#635bff] text-white rounded-lg hover:bg-[#4f46e5] transition-all no-underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    Print / PDF
                  </a>
                </div>
              </div>

              {loadingPreview ? (
                <div className="space-y-3 animate-pulse">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-16 bg-[var(--bg-surface-2)] rounded-xl" />)}
                  </div>
                  <div className="h-40 bg-[var(--bg-surface-2)] rounded-xl" />
                </div>
              ) : reportData ? (
                <div className="space-y-5">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Equipment', value: reportData.summary.totalMachines, sub: `${reportData.summary.operationalMachines} operational`, color: 'text-[#635bff]' },
                      { label: 'WOs Completed', value: reportData.summary.completedWorkOrders, sub: `of ${reportData.summary.totalWorkOrders} total`, color: 'text-emerald-600' },
                      { label: 'Overdue', value: reportData.summary.overdueWorkOrders, sub: 'work orders', color: reportData.summary.overdueWorkOrders > 0 ? 'text-red-600' : 'text-emerald-600' },
                      { label: 'Cost', value: formatCurrency(reportData.summary.totalMaintenanceCost, reportData.currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), sub: 'maintenance spend', color: 'text-[var(--text-primary)]' },
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
                      <div className="rounded-lg border border-[var(--border)] overflow-x-auto">
                        <table className="w-full min-w-[560px] text-xs">
                          <thead>
                            <tr className="bg-[var(--bg-surface-2)]">
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">WO#</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">Title</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">Machine</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">Status</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {reportData.workOrders.slice(0, 10).map((wo: any) => (
                              <tr key={wo.woNumber} className="hover:bg-[var(--bg-surface-2)]">
                                <td className="px-3 py-2 font-mono text-[var(--text-muted)] whitespace-nowrap">{wo.woNumber}</td>
                                <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{wo.title}</td>
                                <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">{wo.machine}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getBadgeClass(wo.status, 'status')}`}>
                                    {wo.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">
                                  {wo.cost > 0 ? formatCurrency(wo.cost, reportData.currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}
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
                      <div className="rounded-lg border border-[var(--border)] overflow-x-auto">
                        <table className="w-full min-w-[520px] text-xs">
                          <thead>
                            <tr className="bg-[var(--bg-surface-2)]">
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">Task</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">Machine</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">Next Due</th>
                              <th className="px-3 py-2 text-left text-[var(--text-muted)] font-semibold whitespace-nowrap">Priority</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {reportData.upcomingMaintenance.slice(0, 8).map((t: any, i: number) => (
                              <tr key={i} className="hover:bg-[var(--bg-surface-2)]">
                                <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{t.title}</td>
                                <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">{t.machine}</td>
                                <td className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap">{t.nextDue}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
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