'use client';

import { useState, useEffect, useRef } from 'react';

type RowDataset = 'work_orders' | 'machines' | 'alerts' | 'parts';

interface RowExportMenuProps {
  dataset: RowDataset;
  recordId: string;
  recordLabel?: string; // displayed in toast messages
  onResult?: (r: {
    success: boolean;
    message: string;
    url?: string;
  }) => void;
}

// Single in-app click state so only one popover is open at a time
let openPopoverId: string | null = null;
const listeners = new Set<(id: string | null) => void>();
function setGlobalOpen(id: string | null) {
  openPopoverId = id;
  listeners.forEach(fn => fn(id));
}

export default function RowExportMenu({
  dataset,
  recordId,
  recordLabel,
  onResult,
}: RowExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [avail, setAvail] = useState({ googleSheets: false, quickbooks: false, slack: false });
  const wrapRef = useRef<HTMLDivElement>(null);
  const uid = useRef<string>(`${dataset}-${recordId}-${Math.random().toString(36).slice(2, 8)}`);

  // Sync with global "only one open at a time"
  useEffect(() => {
    const l = (id: string | null) => setOpen(id === uid.current);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  // Fetch available integrations once (cached at window level)
  useEffect(() => {
    const w = window as any;
    if (w.__myncelIntegrationsCache) {
      setAvail(w.__myncelIntegrationsCache);
      return;
    }
    fetch('/api/integrations')
      .then(r => (r.ok ? r.json() : { integrations: [] }))
      .then(data => {
        const byId: Record<string, any> = {};
        (data.integrations || []).forEach((i: any) => (byId[i.id] = i));
        const isConnected = (id: string) =>
          !!byId[id] &&
          (byId[id].status === 'CONNECTED' ||
            byId[id].status === 'PLATFORM_INHERITED' ||
            byId[id].connected === true);
        const cache = {
          googleSheets: isConnected('google_sheets'),
          quickbooks: isConnected('quickbooks'),
          slack: isConnected('slack'),
        };
        w.__myncelIntegrationsCache = cache;
        setAvail(cache);
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setGlobalOpen(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGlobalOpen(null);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const csvUrl = () => {
    if (dataset === 'work_orders') return `/api/work-orders/export?format=csv&id=${recordId}`;
    return `/api/exports/${dataset}?format=csv&id=${recordId}`;
  };
  const pdfUrl = () => {
    if (dataset === 'work_orders')
      return `/api/work-orders/export?format=pdf&id=${recordId}&autoprint=1`;
    return `/api/exports/${dataset}?format=pdf&id=${recordId}&autoprint=1`;
  };

  const toast = (success: boolean, message: string, url?: string) => {
    onResult?.({ success, message, url });
  };

  const runExport = async (
    integration: 'google_sheets' | 'quickbooks' | 'slack',
    payload: Record<string, any>
  ) => {
    setBusy(integration);
    setGlobalOpen(null);
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
        toast(false, data.error || `Failed to export to ${integration}`);
        return;
      }
      if (integration === 'google_sheets') {
        toast(true, `Exported ${recordLabel || 'record'} to Google Sheets`, data.spreadsheetUrl);
        if (data.spreadsheetUrl) window.open(data.spreadsheetUrl, '_blank', 'noopener');
      } else if (integration === 'quickbooks') {
        toast(
          true,
          data.created > 0
            ? `Created ${data.created} ${data.dataset} in QuickBooks`
            : data.message || 'Nothing to export.',
          data.links?.invoices || data.links?.quickBooksDashboard
        );
      } else {
        toast(true, `Sent to Slack ${data.channel || ''}`);
      }
    } catch {
      toast(false, `Export to ${integration} failed.`);
    } finally {
      setBusy(null);
    }
  };

  const menuItem = (
    icon: string,
    label: string,
    onClick: () => void,
    color?: string,
    disabled = false
  ) => (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
      style={{ color: color || 'var(--text-primary)' }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div ref={wrapRef} className="relative inline-block" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          setGlobalOpen(open ? null : uid.current);
        }}
        disabled={!!busy}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-black/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        title={busy ? 'Exporting…' : 'Export this record'}
        aria-label="Export options"
      >
        {busy ? (
          <svg width="12" height="12" viewBox="0 0 24 24" className="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-48 rounded-lg shadow-xl border z-50 py-1"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Download
          </div>
          <a
            href={csvUrl()}
            onClick={() => setGlobalOpen(null)}
            className="block px-3 py-2 text-xs hover:bg-black/5 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>📥</span>
            <span>CSV</span>
          </a>
          <a
            href={pdfUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setGlobalOpen(null)}
            className="block px-3 py-2 text-xs hover:bg-black/5 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>📄</span>
            <span>PDF</span>
          </a>

          {(avail.googleSheets || avail.quickbooks || avail.slack) && (
            <>
              <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Send to
              </div>
              {avail.googleSheets &&
                menuItem('📊', 'Google Sheets', () => runExport('google_sheets', { dataset, id: recordId }))}
              {avail.quickbooks && dataset === 'work_orders' &&
                menuItem('💰', 'QuickBooks Invoice', () => runExport('quickbooks', { dataset: 'invoices', limit: 1 }))}
              {avail.slack &&
                menuItem('💬', 'Slack Digest', () => runExport('slack', { mode: 'digest' }))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
