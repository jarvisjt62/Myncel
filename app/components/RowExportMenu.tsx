'use client';

import { useState, useEffect, useRef } from 'react';

type RowDataset = 'work_orders' | 'machines' | 'alerts' | 'parts';

interface RowExportMenuProps {
  dataset: RowDataset;
  recordId: string;
  recordLabel?: string;
  onResult?: (r: { success: boolean; message: string; url?: string }) => void;
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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const uid = useRef<string>(
    `${dataset}-${recordId}-${Math.random().toString(36).slice(2, 8)}`
  );

  // ── Global "only one open" sync ───────────────────────────────────────────
  useEffect(() => {
    const l = (id: string | null) => setOpen(id === uid.current);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  // ── Smart positioning: fixed coords, opens UP when near bottom ───────────
  useEffect(() => {
    if (!open || !btnRef.current) {
      setMenuPos(null);
      return;
    }

    const calculate = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const menuH = menuRef.current?.offsetHeight || 220; // approx before first paint
      const menuW = 192; // w-48 = 12rem

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuH + 12;

      const top = openUp
        ? rect.top - menuH - 4  // open above button
        : rect.bottom + 4;      // open below button

      // Right-align to button, clamped to viewport
      const left = Math.min(
        rect.right - menuW,
        window.innerWidth - menuW - 8
      );

      setMenuPos({ top: Math.max(8, top), left: Math.max(8, left) });
    };

    calculate();
    requestAnimationFrame(calculate); // re-calc after DOM paint for real height

    window.addEventListener('scroll', calculate, true);
    window.addEventListener('resize', calculate);
    return () => {
      window.removeEventListener('scroll', calculate, true);
      window.removeEventListener('resize', calculate);
    };
  }, [open]);

  // ── Fetch integration availability (cached) ───────────────────────────────
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

  // ── Close on outside click or Escape ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setGlobalOpen(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setGlobalOpen(null); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // ── URL helpers ───────────────────────────────────────────────────────────
  const csvUrl = () =>
    dataset === 'work_orders'
      ? `/api/work-orders/export?format=csv&id=${recordId}`
      : `/api/exports/${dataset}?format=csv&id=${recordId}`;

  const pdfUrl = () =>
    dataset === 'work_orders'
      ? `/api/work-orders/export?format=pdf&id=${recordId}&autoprint=1`
      : `/api/exports/${dataset}?format=pdf&id=${recordId}&autoprint=1`;

  // ── Integration export ────────────────────────────────────────────────────
  const toast = (success: boolean, message: string, url?: string) =>
    onResult?.({ success, message, url });

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

  // ── Menu item helper ──────────────────────────────────────────────────────
  const menuItem = (
    icon: string,
    label: string,
    onClick: () => void,
    color?: string,
    disabled = false
  ) => (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
      style={{ color: color || 'var(--text-primary)' }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className="relative inline-block" onClick={e => e.stopPropagation()}>
      {/* Trigger button */}
      <button
        ref={btnRef}
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

      {/*
        Dropdown uses `position: fixed` with calculated coordinates so it is
        NEVER clipped by a parent overflow:hidden or scroll container.
        Position is recalculated on every open + scroll + resize so it always
        stays anchored to the trigger button.
        Opens UPWARD automatically when there isn't enough space below.
      */}
      {open && menuPos && (
        <div
          ref={menuRef}
          className="fixed w-48 rounded-lg shadow-xl border z-[9999] py-1"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Download section ── */}
          <div
            className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Download
          </div>

          <button
            type="button"
            onClick={async () => {
              setGlobalOpen(null);
              try {
                const res = await fetch(csvUrl(), { credentials: 'include' });
                if (!res.ok) throw new Error(`CSV failed (${res.status})`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const disp = res.headers.get('Content-Disposition') || '';
                const m = /filename="?([^";]+)"?/i.exec(disp);
                const filename = m?.[1] || `${dataset}-${recordId}.csv`;
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 4000);
              } catch (err: any) {
                onResult?.({ success: false, message: err?.message || 'CSV download failed' });
              }
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/5 w-full text-left"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>📥</span>
            <span>CSV</span>
          </button>

          <a
            href={pdfUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setGlobalOpen(null)}
            className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/5"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>📄</span>
            <span>PDF</span>
          </a>

          {/* ── Send to integrations ── */}
          {(avail.googleSheets || avail.quickbooks || avail.slack) && (
            <>
              <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
              <div
                className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Send to
              </div>
              {avail.googleSheets &&
                menuItem('📊', 'Google Sheets', () =>
                  runExport('google_sheets', { dataset, id: recordId })
                )}
              {avail.quickbooks && dataset === 'work_orders' &&
                menuItem('💰', 'QuickBooks Invoice', () =>
                  runExport('quickbooks', { dataset: 'invoices', limit: 1 })
                )}
              {avail.slack &&
                menuItem('💬', 'Slack Digest', () =>
                  runExport('slack', { mode: 'digest' })
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
