'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ScopedExportModal, { ScopeDataset } from './ScopedExportModal';

type Dataset = 'work_orders' | 'machines' | 'alerts' | 'parts';

interface ExportActionsBarProps {
  /** Which resource you are exporting */
  dataset: Dataset;
  /** Optional filter passed to CSV/PDF (e.g. current status filter for work orders) */
  filterParam?: string;
  /** Optional path to a CSV importer page. When provided, an "Import CSV"
   *  item is added to the Export dropdown menu (below a divider) so the
   *  Import button doesn't need its own chip on mobile. */
  importHref?: string;
  /** Which chips to render. Lets parents place the Export button and the
   *  integration chips on different rows for cleaner mobile layouts.
   *  Defaults to 'both' for backwards compatibility. */
  mode?: 'both' | 'export-only' | 'integrations-only';
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
  importHref,
  mode = 'both',
  onIntegrationResult,
}: ExportActionsBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Anchor positions for the portal-rendered dropdowns so they can escape
  // any parent overflow-x-auto clipping rectangle on mobile.
  const exportBtnRef = useRef<HTMLButtonElement | null>(null);
  const sendBtnRef = useRef<HTMLButtonElement | null>(null);
  const [exportMenuPos, setExportMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [sendMenuPos, setSendMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [available, setAvailable] = useState<{ googleSheets: boolean; quickbooks: boolean; slack: boolean }>(() => {
    // Hydrate from sessionStorage so the chips don't pop in on every page nav.
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('myncel.integrationsAvailable');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return { googleSheets: false, quickbooks: false, slack: false };
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
        // Persist for instant render on subsequent page navs in the same session.
        try {
          sessionStorage.setItem('myncel.integrationsAvailable', JSON.stringify({
            googleSheets: isConnected('google_sheets'),
            quickbooks: isConnected('quickbooks'),
            slack: isConnected('slack'),
          }));
        } catch {}
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Close any open menu when clicking outside. We watch both mousedown
  // (desktop) and touchstart (mobile WebView) so dropdowns dismiss
  // reliably on every platform. The portal-rendered Export menu lives
  // under document.body, so we also exclude clicks landing on the
  // menu itself via a data attribute.
  useEffect(() => {
    const onPointerDown = (e: Event) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapRef.current?.contains(target)) return;
      // Allow clicks inside the portal-rendered dropdown
      const el = target as HTMLElement;
      if (el.closest && el.closest('[data-export-menu="1"]')) return;
      setOpenMenu(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, []);

  // Reposition the active dropdown if the user scrolls / resizes while open
  useEffect(() => {
    if (openMenu !== 'download' && openMenu !== 'send') return;
    const update = () => {
      const el = openMenu === 'download' ? exportBtnRef.current : sendBtnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Left-anchor with viewport clamp so the menu is always fully on-screen,
      // regardless of whether the button sits at the left or right edge.
      const menuWidth = 220;
      const margin = 8;
      let left = r.left;
      if (left + menuWidth > window.innerWidth - margin) {
        left = Math.max(margin, r.right - menuWidth);
      }
      if (left < margin) left = margin;
      const pos = { top: r.bottom + 4, left };
      if (openMenu === 'download') setExportMenuPos(pos);
      else setSendMenuPos(pos);
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [openMenu]);

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
    'inline-flex items-center justify-center gap-1.5 text-xs px-3 h-9 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0';

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

  // Whether any "send to" integration is available for this dataset.
  // QuickBooks only applies to work_orders / parts.
  const qbApplies = dataset === 'work_orders' || dataset === 'parts';
  const hasAnySendTarget =
    available.googleSheets || (available.quickbooks && qbApplies) || available.slack;

  return (
    <div
      ref={wrapRef}
      className={
        mode === 'export-only'
          ? 'flex items-center gap-2 flex-shrink-0'
          : mode === 'integrations-only'
          ? 'flex items-center gap-2 flex-shrink-0'
          : 'flex items-center gap-2 flex-shrink-0'
      }
    >
      {/* Combined Download menu — CSV + PDF + (optional) Import in one chip. */}
      {mode !== 'integrations-only' && (<>
      <div className="relative flex-shrink-0">
        <button
          ref={exportBtnRef}
          type="button"
          onClick={() => setOpenMenu(openMenu === 'download' ? null : 'download')}
          disabled={busy === 'csv'}
          className={`${btnBase} border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff]`}
          title="Download report (CSV or PDF)"
          aria-haspopup="menu"
          aria-expanded={openMenu === 'download'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{busy === 'csv' ? 'Saving…' : 'Export'}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {openMenu === 'download' && exportMenuPos && typeof document !== 'undefined' && createPortal(
        <div
          role="menu"
          data-export-menu="1"
          className="fixed z-[60] min-w-[180px] rounded-lg border border-[var(--border)] [background:var(--bg-surface)] shadow-xl overflow-hidden"
          style={{ top: exportMenuPos.top, left: exportMenuPos.left }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpenMenu(null); handleCsvDownload(); }}
            disabled={busy === 'csv'}
            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted,#f3f4f6)] text-[var(--text-primary)] disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="font-medium">CSV</span>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">spreadsheet</span>
          </button>
          <a
            href={downloadUrl('pdf')}
            download
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpenMenu(null)}
            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted,#f3f4f6)] text-[var(--text-primary)] border-t border-[var(--border)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="font-medium">PDF</span>
            <span className="ml-auto text-[10px] text-[var(--text-muted)]">printable</span>
          </a>
          {importHref && (
            <Link
              href={importHref}
              role="menuitem"
              onClick={() => setOpenMenu(null)}
              className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted,#f3f4f6)] text-[var(--text-primary)] border-t-2 border-[var(--border)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="font-medium">Import CSV</span>
              <span className="ml-auto text-[10px] text-[var(--text-muted)]">upload</span>
            </Link>
          )}
        </div>,
        document.body
      )}
      </>)}

      {/* Combined Send-to menu — Sheets / QuickBooks / Slack collapsed into one chip. */}
      {mode !== 'export-only' && hasAnySendTarget && (<>
      <div className="relative flex-shrink-0">
        <button
          ref={sendBtnRef}
          type="button"
          onClick={() => setOpenMenu(openMenu === 'send' ? null : 'send')}
          disabled={busy !== null}
          className={`${btnBase} border border-[var(--border)] text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff]`}
          title="Send to a connected integration"
          aria-haspopup="menu"
          aria-expanded={openMenu === 'send'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>{busy === 'google_sheets' || busy === 'quickbooks' || busy === 'slack' ? 'Sending…' : 'Send to'}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {openMenu === 'send' && sendMenuPos && typeof document !== 'undefined' && createPortal(
        <div
          role="menu"
          data-export-menu="1"
          className="fixed z-[60] min-w-[200px] rounded-lg border border-[var(--border)] [background:var(--bg-surface)] shadow-xl overflow-hidden"
          style={{ top: sendMenuPos.top, left: sendMenuPos.left }}
        >
          {available.googleSheets && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpenMenu(null);
                setScopeModal({
                  integration: 'google_sheets',
                  title: `Export ${DATASET_LABELS[dataset]} to Google Sheets`,
                  description: 'Choose which records to include in the new spreadsheet.',
                  datasets: [dataset],
                  confirmLabel: 'Create spreadsheet',
                });
              }}
              disabled={busy === 'google_sheets'}
              className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted,#f3f4f6)] text-[var(--text-primary)] disabled:opacity-50"
            >
              <span className="w-5 h-5 inline-flex items-center justify-center rounded text-white text-[11px] font-bold" style={{ background: '#0f9d58' }}>📊</span>
              <span className="font-medium">Google Sheets</span>
              <span className="ml-auto text-[10px] text-[var(--text-muted)]">new sheet</span>
            </button>
          )}
          {available.quickbooks && qbApplies && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpenMenu(null);
                setScopeModal(
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
                );
              }}
              disabled={busy === 'quickbooks'}
              className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted,#f3f4f6)] text-[var(--text-primary)] border-t border-[var(--border)] disabled:opacity-50"
            >
              <span className="w-5 h-5 inline-flex items-center justify-center rounded text-white text-[11px] font-bold" style={{ background: '#2ca01c' }}>💰</span>
              <span className="font-medium">QuickBooks</span>
              <span className="ml-auto text-[10px] text-[var(--text-muted)]">{dataset === 'work_orders' ? 'invoices' : 'items'}</span>
            </button>
          )}
          {available.slack && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpenMenu(null);
                setScopeModal({
                  integration: 'slack',
                  title: 'Send Maintenance Digest to Slack',
                  description: 'Optionally filter to specific work orders or alerts. Leave "All records" selected for a full digest.',
                  datasets: dataset === 'alerts' ? ['alerts', 'work_orders'] : ['work_orders', 'alerts'],
                  confirmLabel: 'Send digest',
                });
              }}
              disabled={busy === 'slack'}
              className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--bg-muted,#f3f4f6)] text-[var(--text-primary)] border-t border-[var(--border)] disabled:opacity-50"
            >
              <span className="w-5 h-5 inline-flex items-center justify-center rounded text-white text-[11px] font-bold" style={{ background: '#4a154b' }}>💬</span>
              <span className="font-medium">Slack</span>
              <span className="ml-auto text-[10px] text-[var(--text-muted)]">digest</span>
            </button>
          )}
        </div>,
        document.body
      )}
      </>)}

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
