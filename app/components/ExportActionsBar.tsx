'use client';

import { useState, useRef, useEffect } from 'react';

type Dataset = 'work_orders' | 'machines' | 'alerts';

interface ExportActionsBarProps {
  /** Which resource you are exporting */
  dataset: Dataset;
  /** Optional filter passed to CSV/PDF (e.g. current status filter for work orders) */
  filterParam?: string;
  /** Called after successful integration export so parent can toast / refresh */
  onIntegrationResult?: (result: {
    integration: 'google_sheets' | 'quickbooks' | 'slack';
    success: boolean;
    message: string;
    url?: string;
  }) => void;
}

const DATASET_LABELS: Record<Dataset, string> = {
  work_orders: 'Work Orders',
  machines: 'Machines',
  alerts: 'Alerts',
};

export default function ExportActionsBar({
  dataset,
  filterParam,
  onIntegrationResult,
}: ExportActionsBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [available, setAvailable] = useState<{ googleSheets: boolean; quickbooks: boolean; slack: boolean }>({
    googleSheets: false,
    quickbooks: false,
    slack: false,
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fetch which integrations are connected so we only show relevant buttons
  useEffect(() => {
    let cancelled = false;
    fetch('/api/integrations')
      .then(r => (r.ok ? r.json() : { integrations: [] }))
      .then(data => {
        if (cancelled) return;
        const byId: Record<string, any> = {};
        (data.integrations || []).forEach((i: any) => {
          byId[i.id] = i;
        });
        const isConnected = (id: string) =>
          !!byId[id] &&
          (byId[id].status === 'CONNECTED' ||
            byId[id].status === 'PLATFORM_INHERITED' ||
            byId[id].connected === true);
        setAvailable({
          googleSheets: isConnected('google_sheets'),
          quickbooks: isConnected('quickbooks'),
          slack: isConnected('slack'),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Close any open menu when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toast = (msg: string, ok = true) => {
    onIntegrationResult?.({
      integration: 'google_sheets',
      success: ok,
      message: msg,
    });
  };

  // === CSV / PDF (local file downloads) ===
  // Work orders have their own dedicated endpoint with rich formatting.
  // Machines & alerts use a shared simple endpoint.
  const downloadUrl = (format: 'csv' | 'pdf') => {
    if (dataset === 'work_orders') {
      const q = new URLSearchParams();
      q.set('format', format);
      if (filterParam) q.set('status', filterParam);
      if (format === 'pdf') q.set('autoprint', '1');
      return `/api/work-orders/export?${q.toString()}`;
    }
    const q = new URLSearchParams();
    q.set('format', format);
    q.set('dataset', dataset);
    if (format === 'pdf') q.set('autoprint', '1');
    return `/api/exports/${dataset}?${q.toString()}`;
  };

  // === Integration exports ===
  const runIntegrationExport = async (
    integration: 'google_sheets' | 'quickbooks' | 'slack',
    payload: Record<string, any>
  ) => {
    setBusy(integration);
    setOpenMenu(null);
    try {
      const endpoint =
        integration === 'google_sheets'
          ? '/api/integrations/google-sheets/export'
          : integration === 'quickbooks'
          ? '/api/integrations/quickbooks/export'
          : '/api/integrations/slack/send';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onIntegrationResult?.({
          integration,
          success: false,
          message: data.error || `Failed to export to ${integration}`,
        });
        return;
      }

      if (integration === 'google_sheets') {
        onIntegrationResult?.({
          integration,
          success: true,
          message: `Exported ${data.rowCount} ${DATASET_LABELS[dataset].toLowerCase()} to Google Sheets`,
          url: data.spreadsheetUrl,
        });
        if (data.spreadsheetUrl) window.open(data.spreadsheetUrl, '_blank', 'noopener');
      } else if (integration === 'quickbooks') {
        onIntegrationResult?.({
          integration,
          success: true,
          message:
            data.created > 0
              ? `Created ${data.created} ${data.dataset} in QuickBooks (${data.companyInfo?.name || 'sandbox'})`
              : data.message || 'Nothing to export.',
          url:
            data.links?.[
              data.dataset === 'invoices'
                ? 'invoices'
                : data.dataset === 'vendors'
                ? 'vendors'
                : 'items'
            ] || data.links?.quickBooksDashboard,
        });
      } else if (integration === 'slack') {
        onIntegrationResult?.({
          integration,
          success: true,
          message: `Digest sent to Slack ${data.channel}${data.team ? ` in ${data.team}` : ''}`,
        });
      }
    } catch (err) {
      onIntegrationResult?.({
        integration,
        success: false,
        message: `Export to ${integration} failed. Please try again.`,
      });
    } finally {
      setBusy(null);
    }
  };

  const btnBase =
    'inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50';

  return (
    <div ref={wrapRef} className="flex items-center gap-2 flex-wrap">
      {/* CSV download */}
      <a
        href={downloadUrl('csv')}
        className={`${btnBase} border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff]`}
        title="Download as CSV"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        CSV
      </a>

      {/* PDF (print-ready HTML) */}
      <a
        href={downloadUrl('pdf')}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff]`}
        title="Open print-ready PDF in a new tab"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        PDF
      </a>

      {/* Google Sheets */}
      {available.googleSheets && (
        <button
          type="button"
          onClick={() => runIntegrationExport('google_sheets', { dataset })}
          disabled={busy === 'google_sheets'}
          className={`${btnBase} text-white`}
          style={{ background: '#0f9d58' }}
          title={`Create a new Google Sheet with your ${DATASET_LABELS[dataset].toLowerCase()}`}
        >
          <span>📊</span>
          {busy === 'google_sheets' ? 'Exporting…' : 'Sheets'}
        </button>
      )}

      {/* QuickBooks (only relevant for work orders → invoices) */}
      {available.quickbooks && dataset === 'work_orders' && (
        <button
          type="button"
          onClick={() => runIntegrationExport('quickbooks', { dataset: 'invoices' })}
          disabled={busy === 'quickbooks'}
          className={`${btnBase} text-white`}
          style={{ background: '#2ca01c' }}
          title="Create QuickBooks invoices from completed work orders"
        >
          <span>💰</span>
          {busy === 'quickbooks' ? 'Creating…' : 'QuickBooks'}
        </button>
      )}

      {/* Slack digest */}
      {available.slack && (
        <button
          type="button"
          onClick={() => runIntegrationExport('slack', { mode: 'digest' })}
          disabled={busy === 'slack'}
          className={`${btnBase} text-white`}
          style={{ background: '#4a154b' }}
          title="Send a maintenance digest to Slack"
        >
          <span>💬</span>
          {busy === 'slack' ? 'Sending…' : 'Slack'}
        </button>
      )}
    </div>
  );
}
