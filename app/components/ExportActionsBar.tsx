'use client';

import { useState, useRef, useEffect } from 'react';
import ScopedExportModal, { ScopeDataset } from './ScopedExportModal';

type Dataset = 'work_orders' | 'machines' | 'alerts' | 'parts';

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
  parts: 'Parts',
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
  // Scope picker modal — user picks specific records (or "All") before running the export
  const [scopeModal, setScopeModal] = useState<
    | null
    | {
        integration: 'google_sheets' | 'quickbooks' | 'slack';
        title: string;
        description?: string;
        datasets: ScopeDataset[];
        qbDataset?: 'invoices' | 'items' | 'vendors';
        confirmLabel: string;
      }
  >(null);
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
  // format=pdf returns a real binary PDF (works inside Capacitor WebView).
  const downloadUrl = (format: 'csv' | 'pdf') => {
    if (dataset === 'work_orders') {
      const q = new URLSearchParams();
      q.set('format', format);
      if (filterParam) q.set('status', filterParam);
      return `/api/work-orders/export?${q.toString()}`;
    }
    const q = new URLSearchParams();
    q.set('format', format);
    q.set('dataset', dataset);
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
    'inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap';

  // Robust CSV download that works everywhere — including mobile browsers
  // and the Capacitor / Expo WebView, where a plain <a download="..."> is
  // often ignored and the browser just navigates to a page showing the raw
  // CSV text. Fetching the response as a Blob and triggering a synthetic
  // anchor click reliably saves the file on every platform.
  const handleCsvDownload = async () => {
    if (busy) return;
    try {
      setBusy('csv');
      const res = await fetch(downloadUrl('csv'), { credentials: 'include' });
      if (!res.ok) throw new Error(`CSV export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Try to read filename from Content-Disposition; fall back to a sane default.
      const disp = res.headers.get('Content-Disposition') || '';
      const m = /filename="?([^";]+)"?/i.exec(disp);
      const filename = m?.[1] || `${dataset}-${new Date().toISOString().slice(0, 10)}.csv`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoke after a short delay so the browser has time to start the save.
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast(`CSV downloaded: ${filename}`, true);
    } catch (err: any) {
      toast(err?.message || 'Failed to download CSV', false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={wrapRef} className="flex items-center gap-1.5 flex-wrap">
      {/* CSV download — fetches as Blob so it works in every mobile WebView */}
      <button
        type="button"
        onClick={handleCsvDownload}
        disabled={busy === 'csv'}
        className={`${btnBase} border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff]`}
        title="Download as CSV"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{busy === 'csv' ? 'Saving…' : 'CSV'}</span>
      </button>

      {/* PDF (real binary download — works inside Capacitor WebView, mobile Safari, desktop)
          target="_blank" so Capacitor hands the link to the system browser where
          downloads are reliable. download attr makes regular browsers save directly. */}
      <a
        href={downloadUrl('pdf')}
        download
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff]`}
        title="Download PDF report"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span>PDF</span>
      </a>

      {/* Google Sheets */}
      {available.googleSheets && (
        <button
          type="button"
          onClick={() => setScopeModal({
            integration: 'google_sheets',
            title: `Export ${DATASET_LABELS[dataset]} to Google Sheets`,
            description: 'Choose which records to include in the new spreadsheet.',
            datasets: [dataset],
            confirmLabel: 'Create spreadsheet',
          })}
          disabled={busy === 'google_sheets'}
          className={`${btnBase} text-white`}
          style={{ background: '#0f9d58' }}
          title={`Create a new Google Sheet with your ${DATASET_LABELS[dataset].toLowerCase()}`}
        >
          <span>📊</span>
          <span>{busy === 'google_sheets' ? 'Exporting…' : 'Sheets'}</span>
        </button>
      )}

      {/* QuickBooks */}
      {available.quickbooks && (dataset === 'work_orders' || dataset === 'parts') && (
        <button
          type="button"
          onClick={() => setScopeModal(
            dataset === 'work_orders'
              ? {
                  integration: 'quickbooks',
                  title: 'Create QuickBooks Invoices',
                  description: 'Choose which completed work orders to invoice in QuickBooks.',
                  datasets: ['work_orders'],
                  qbDataset: 'invoices',
                  confirmLabel: 'Create invoices',
                }
              : {
                  integration: 'quickbooks',
                  title: 'Sync Parts → QuickBooks Items',
                  description: 'Choose which inventory parts to sync as QuickBooks items.',
                  datasets: ['parts'],
                  qbDataset: 'items',
                  confirmLabel: 'Sync items',
                }
          )}
          disabled={busy === 'quickbooks'}
          className={`${btnBase} text-white`}
          style={{ background: '#2ca01c' }}
          title={dataset === 'work_orders' ? 'Create QuickBooks invoices from completed work orders' : 'Sync parts inventory as QuickBooks items'}
        >
          <span>💰</span>
          <span>{busy === 'quickbooks' ? 'Creating…' : 'QuickBooks'}</span>
        </button>
      )}

      {/* Slack digest */}
      {available.slack && (
        <button
          type="button"
          onClick={() => setScopeModal({
            integration: 'slack',
            title: 'Send Maintenance Digest to Slack',
            description: 'Optionally filter to specific work orders or alerts. Leave "All records" selected for a full digest.',
            datasets: dataset === 'alerts' ? ['alerts', 'work_orders'] : ['work_orders', 'alerts'],
            confirmLabel: 'Send digest',
          })}
          disabled={busy === 'slack'}
          className={`${btnBase} text-white`}
          style={{ background: '#4a154b' }}
          title="Send a maintenance digest to Slack"
        >
          <span>💬</span>
          <span>{busy === 'slack' ? 'Sending…' : 'Slack'}</span>
        </button>
      )}

      {/* Scope picker modal */}
      {scopeModal && (
        <ScopedExportModal
          open
          mode="user"
          title={scopeModal.title}
          description={scopeModal.description}
          datasets={scopeModal.datasets}
          confirmLabel={scopeModal.confirmLabel}
          loading={busy !== null}
          onClose={() => setScopeModal(null)}
          onConfirm={async ({ dataset: chosenDataset, ids, allSelected }) => {
            const integration = scopeModal.integration;
            const payload: Record<string, any> = {};
            if (integration === 'quickbooks') {
              payload.dataset = scopeModal.qbDataset || 'invoices';
            } else if (integration === 'slack') {
              payload.mode = 'digest';
            } else {
              payload.dataset = chosenDataset;
            }
            if (!allSelected && ids && ids.length > 0) {
              payload.ids = ids;
            }
            await runIntegrationExport(integration, payload);
            setScopeModal(null);
          }}
        />
      )}
    </div>
  );
}
