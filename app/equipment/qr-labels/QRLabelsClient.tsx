'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';

interface Machine {
  id: string;
  name: string;
  serialNumber: string | null;
  category: string;
  status: string;
  location: string | null;
  manufacturer: string | null;
  model: string | null;
}

// ── Real QR Code generation ──────────────────────────────────────────────
async function generateQRDataUrl(text: string, size: number = 240): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  OPERATIONAL: { bg: '#dcfce7', text: '#166534', label: 'Operational' },
  MAINTENANCE:  { bg: '#fef9c3', text: '#854d0e', label: 'Maintenance' },
  BREAKDOWN:    { bg: '#fee2e2', text: '#991b1b', label: 'Breakdown' },
  RETIRED:      { bg: '#f1f5f9', text: '#475569', label: 'Retired' },
};

/* ─── SHEET TEMPLATES ────────────────────────────────────────────────────
   Each template defines a real-world label sheet using the EXACT mm
   dimensions from the manufacturer's spec sheet. Print at 100% scale
   (no "fit to page") and labels land on the perforations.

   Format spec from Avery / Brother / Dymo official specs.
   ───────────────────────────────────────────────────────────────────── */
type SheetTemplate = {
  id: string;
  label: string;
  description: string;
  pageSize: 'A4' | 'Letter';
  /* page dims in mm */
  pageW: number;
  pageH: number;
  /* outer printable margins in mm */
  marginTop: number;
  marginLeft: number;
  /* label dims in mm */
  labelW: number;
  labelH: number;
  /* gutters (gap between columns/rows) in mm */
  colGap: number;
  rowGap: number;
  /* grid */
  cols: number;
  rows: number;
  /* visual emphasis size — affects QR + font size relative to label */
  size: 'xs' | 'sm' | 'md' | 'lg';
};

const SHEET_TEMPLATES: SheetTemplate[] = [
  {
    id: 'avery-5160',
    label: 'Avery 5160 / 5260 — 30 per page',
    description: '1" × 2⅝" address labels. 30 labels per Letter sheet. Most common label sheet in the US.',
    pageSize: 'Letter', pageW: 215.9, pageH: 279.4,
    marginTop: 12.7, marginLeft: 4.8,
    labelW: 66.7, labelH: 25.4,
    colGap: 3.0, rowGap: 0,
    cols: 3, rows: 10,
    size: 'sm',
  },
  {
    id: 'avery-5163',
    label: 'Avery 5163 / 5263 — 10 per page',
    description: '2" × 4" shipping labels. 10 labels per Letter sheet. Roomy — best for full machine info.',
    pageSize: 'Letter', pageW: 215.9, pageH: 279.4,
    marginTop: 12.7, marginLeft: 4.8,
    labelW: 101.6, labelH: 50.8,
    colGap: 3.0, rowGap: 0,
    cols: 2, rows: 5,
    size: 'lg',
  },
  {
    id: 'avery-5164',
    label: 'Avery 5164 / 5264 — 6 per page',
    description: '3⅓" × 4" shipping labels. 6 labels per Letter sheet. Largest Avery — best for outdoor / large equipment.',
    pageSize: 'Letter', pageW: 215.9, pageH: 279.4,
    marginTop: 12.7, marginLeft: 6.0,
    labelW: 101.6, labelH: 84.7,
    colGap: 3.0, rowGap: 0,
    cols: 2, rows: 3,
    size: 'lg',
  },
  {
    id: 'avery-l7160',
    label: 'Avery L7160 — 21 per page (A4)',
    description: '63.5 × 38.1 mm. 21 labels per A4 sheet. European equivalent of 5160.',
    pageSize: 'A4', pageW: 210, pageH: 297,
    marginTop: 15.1, marginLeft: 7.2,
    labelW: 63.5, labelH: 38.1,
    colGap: 2.5, rowGap: 0,
    cols: 3, rows: 7,
    size: 'sm',
  },
  {
    id: 'avery-l7163',
    label: 'Avery L7163 — 14 per page (A4)',
    description: '99.1 × 38.1 mm. 14 labels per A4 sheet — standard European address-label size.',
    pageSize: 'A4', pageW: 210, pageH: 297,
    marginTop: 15.1, marginLeft: 4.7,
    labelW: 99.1, labelH: 38.1,
    colGap: 2.5, rowGap: 0,
    cols: 2, rows: 7,
    size: 'md',
  },
  {
    id: 'avery-l7165',
    label: 'Avery L7165 — 8 per page (A4)',
    description: '99.1 × 67.7 mm. 8 labels per A4 sheet. Good for medium equipment with full info.',
    pageSize: 'A4', pageW: 210, pageH: 297,
    marginTop: 13.0, marginLeft: 4.7,
    labelW: 99.1, labelH: 67.7,
    colGap: 2.5, rowGap: 0,
    cols: 2, rows: 4,
    size: 'lg',
  },
  {
    id: 'avery-l7167',
    label: 'Avery L7167 — 1 per page (A4)',
    description: '199.6 × 289.1 mm. One huge label per A4 sheet. For very large posted equipment notices.',
    pageSize: 'A4', pageW: 210, pageH: 297,
    marginTop: 4.7, marginLeft: 4.7,
    labelW: 199.6, labelH: 289.1,
    colGap: 0, rowGap: 0,
    cols: 1, rows: 1,
    size: 'lg',
  },
  {
    id: 'thermal-50x80',
    label: 'Thermal label printer — 50 × 80 mm',
    description: 'Single-label thermal printers (Brother QL-820NWB, Dymo LabelWriter, Zebra GK420). One label per "page".',
    pageSize: 'A4', pageW: 50, pageH: 80,
    marginTop: 0, marginLeft: 0,
    labelW: 50, labelH: 80,
    colGap: 0, rowGap: 0,
    cols: 1, rows: 1,
    size: 'sm',
  },
  {
    id: 'thermal-100x150',
    label: 'Thermal printer — 100 × 150 mm',
    description: 'Larger thermal labels (Zebra ZD420, Brother TD-2120N, common shipping-label printers).',
    pageSize: 'A4', pageW: 100, pageH: 150,
    marginTop: 0, marginLeft: 0,
    labelW: 100, labelH: 150,
    colGap: 0, rowGap: 0,
    cols: 1, rows: 1,
    size: 'lg',
  },
];

/* mm → CSS px conversion at 96 dpi screen preview. (Print uses real mm — no conversion.) */
const MM_TO_PX = 3.7795275591;

interface SheetLabelProps {
  machine: Machine;
  qrDataUrl: string;
  template: SheetTemplate;
  showSerial: boolean;
  showLocation: boolean;
  showStatus: boolean;
  showManufacturer: boolean;
  forPrint?: boolean;
}

function SheetLabel({
  machine, qrDataUrl, template, showSerial, showLocation, showStatus, showManufacturer, forPrint,
}: SheetLabelProps) {
  const statusInfo = STATUS_COLORS[machine.status] || STATUS_COLORS.OPERATIONAL;
  const sz = template.size;
  // QR & font scale by label size
  const qrSizePx = sz === 'xs' ? 14 : sz === 'sm' ? 18 : sz === 'md' ? 26 : 34; // in mm
  const fsTitle = sz === 'xs' ? 7 : sz === 'sm' ? 8 : sz === 'md' ? 10 : 12;     // in pt
  const fsBody  = sz === 'xs' ? 5 : sz === 'sm' ? 6 : sz === 'md' ? 7  : 8;
  const labelStyle: React.CSSProperties = {
    width: `${template.labelW}mm`,
    height: `${template.labelH}mm`,
    overflow: 'hidden',
    boxSizing: 'border-box',
    padding: '1.5mm',
    border: forPrint ? 'none' : '1px dashed #cbd5e1',
    borderRadius: forPrint ? 0 : '2mm',
    background: '#fff',
    display: 'flex',
    gap: '1.5mm',
    alignItems: 'flex-start',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#0a2540',
  };
  const isLandscape = template.labelW > template.labelH * 1.4;
  return (
    <div className="myncel-label" style={labelStyle}>
      {/* QR */}
      <div style={{ flexShrink: 0, padding: '0.5mm', border: '0.3mm solid #0a2540', borderRadius: '1mm', background: '#fff' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR" style={{ display: 'block', width: `${qrSizePx}mm`, height: `${qrSizePx}mm` }} />
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: `${fsBody}pt`, fontWeight: 800, letterSpacing: '0.05em' }}>MYNCEL</span>
          {showStatus && !isLandscape && (
            <span style={{
              fontSize: `${fsBody - 1}pt`, fontWeight: 700, padding: '0.3mm 1mm',
              borderRadius: '5mm', background: statusInfo.bg, color: statusInfo.text,
              whiteSpace: 'nowrap',
            }}>{statusInfo.label}</span>
          )}
        </div>
        <div style={{ fontSize: `${fsTitle}pt`, fontWeight: 700, lineHeight: 1.1, wordBreak: 'break-word' }}>
          {machine.name}
        </div>
        {showManufacturer && machine.manufacturer && (
          <div style={{ fontSize: `${fsBody}pt`, color: '#546884' }}>
            {machine.manufacturer}{machine.model ? ` · ${machine.model}` : ''}
          </div>
        )}
        {showSerial && machine.serialNumber && (
          <div style={{ fontSize: `${fsBody}pt`, color: '#546884', fontFamily: 'monospace' }}>
            S/N: {machine.serialNumber}
          </div>
        )}
        {showLocation && machine.location && (
          <div style={{ fontSize: `${fsBody}pt`, color: '#546884' }}>📍 {machine.location}</div>
        )}
      </div>
    </div>
  );
}

export default function QRLabelsClient({ machines }: { machines: Machine[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(machines.map(m => m.id)));
  const [templateId, setTemplateId] = useState<string>('avery-5160');
  const [showSerial, setShowSerial] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [showManufacturer, setShowManufacturer] = useState(true);
  const [appUrl, setAppUrl] = useState(typeof window !== 'undefined' ? window.location.origin : 'https://www.myncel.com');
  // Per-machine quantity (default 1) — useful when you need 5 copies of the same QR
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Skip the first N slots on the first sheet — useful when reusing a partially-used sticker sheet
  const [skipFirst, setSkipFirst] = useState(0);
  const [enlargedQR, setEnlargedQR] = useState<{ machine: Machine; qrDataUrl: string } | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  const template = useMemo(
    () => SHEET_TEMPLATES.find(t => t.id === templateId) ?? SHEET_TEMPLATES[0],
    [templateId]
  );

  const labelsPerSheet = template.cols * template.rows;

  /* Expand selected machines × per-machine quantity → flat array of label-instances */
  const labelInstances = useMemo(() => {
    const list: Machine[] = [];
    machines.filter(m => selectedIds.has(m.id)).forEach(m => {
      const qty = Math.max(1, quantities[m.id] ?? 1);
      for (let i = 0; i < qty; i++) list.push(m);
    });
    return list;
  }, [machines, selectedIds, quantities]);

  // Pad with leading blanks on first sheet if user is reusing a partial sheet
  const paddedInstances = useMemo(() => {
    const skip = Math.max(0, Math.min(skipFirst, labelsPerSheet - 1));
    return [
      ...Array(skip).fill(null) as (Machine | null)[],
      ...labelInstances,
    ];
  }, [labelInstances, skipFirst, labelsPerSheet]);

  const totalLabels = labelInstances.length;
  const sheetCount = Math.max(0, Math.ceil(paddedInstances.length / labelsPerSheet));

  /* Generate QR codes for every visible machine */
  useEffect(() => {
    let cancelled = false;
    const sizes = { xs: 80, sm: 120, md: 200, lg: 300 } as const;
    const px = sizes[template.size];
    const buildQrCodes = async () => {
      const entries = await Promise.all(
        machines.map(async (machine) => {
          const qrUrl = `${appUrl.replace(/\/$/, '')}/equipment/${machine.id}`;
          const dataUrl = await generateQRDataUrl(qrUrl, px);
          return [machine.id, dataUrl] as const;
        })
      );
      if (!cancelled) setQrDataUrls(Object.fromEntries(entries));
    };
    buildQrCodes().catch((err) => console.error('QR generation failed:', err));
    return () => { cancelled = true; };
  }, [machines, appUrl, template.size]);

  const toggleMachine = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const setQty = (id: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, Math.min(99, qty)) }));
  };

  const selectAll   = () => setSelectedIds(new Set(machines.map(m => m.id)));
  const deselectAll = () => setSelectedIds(new Set());

  /* Slice paddedInstances into sheet-sized pages so each sheet renders as
     a CSS-grid of exact mm dimensions matching the chosen sheet. */
  const sheets = useMemo(() => {
    const out: (Machine | null)[][] = [];
    for (let i = 0; i < paddedInstances.length; i += labelsPerSheet) {
      const slice = paddedInstances.slice(i, i + labelsPerSheet);
      while (slice.length < labelsPerSheet) slice.push(null);
      out.push(slice);
    }
    return out;
  }, [paddedInstances, labelsPerSheet]);

  /* Print: open a clean window with mm-precise CSS so the printer
     places labels exactly on the perforations of the sheet. */
  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups for this site to print labels.');
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head>
      <title>QR Labels — ${template.label}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; font-family: system-ui, -apple-system, sans-serif; color: #0a2540; }
        .myncel-label { page-break-inside: avoid; break-inside: avoid; }
        @page { size: ${template.pageSize}; margin: 0; }
        .myncel-sheet {
          width: ${template.pageW}mm;
          height: ${template.pageH}mm;
          padding-top: ${template.marginTop}mm;
          padding-left: ${template.marginLeft}mm;
          padding-right: ${template.marginLeft}mm;
          page-break-after: always;
          break-after: page;
          display: grid;
          grid-template-columns: repeat(${template.cols}, ${template.labelW}mm);
          grid-template-rows: repeat(${template.rows}, ${template.labelH}mm);
          column-gap: ${template.colGap}mm;
          row-gap: ${template.rowGap}mm;
          justify-content: start;
          align-content: start;
        }
        .myncel-sheet:last-child { page-break-after: auto; break-after: auto; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .myncel-label { border: none !important; }
        }
      </style>
    </head><body>${printContent}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  const qrFallback = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="white"/><text x="60" y="62" text-anchor="middle" font-size="10" fill="#64748b">…</text></svg>'
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <Link href="/dashboard#equipment" className="text-sm text-[#635bff] hover:underline">
            ← Back to Equipment
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            QR Label Sheets
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Print scannable QR stickers aligned to standard label sheets (Avery 5160 / 5163 / 5164, A4 equivalents, thermal printers).
          </p>
        </div>
        <button
          onClick={handlePrint}
          disabled={totalLabels === 0}
          className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#635bff', color: 'white' }}
        >
          🖨️ Print {totalLabels} label{totalLabels !== 1 ? 's' : ''} ({sheetCount} sheet{sheetCount !== 1 ? 's' : ''})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Settings panel ─────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Sheet template */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>
              Sheet Template
            </h3>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {SHEET_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {template.description}
            </p>
            <div className="mt-2 text-xs grid grid-cols-2 gap-1" style={{ color: 'var(--text-muted)' }}>
              <span>📄 {template.pageSize}</span>
              <span>🏷️ {labelsPerSheet}/sheet</span>
              <span>📐 {template.labelW}×{template.labelH}mm</span>
              <span>🧩 {template.cols}×{template.rows}</span>
            </div>
          </div>

          {/* Skip slots (partial-sheet reuse) */}
          {labelsPerSheet > 1 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                Skip first slots
              </h3>
              <input
                type="number"
                min={0}
                max={labelsPerSheet - 1}
                value={skipFirst}
                onChange={e => setSkipFirst(Math.max(0, Math.min(labelsPerSheet - 1, parseInt(e.target.value) || 0)))}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40"
                style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                If you have a sticker sheet that already has {skipFirst} labels missing, set this so printing starts at the next available slot.
              </p>
            </div>
          )}

          {/* Label content */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>
              Show on label
            </h3>
            {[
              { label: 'Serial Number',    val: showSerial,       set: setShowSerial },
              { label: 'Location',         val: showLocation,     set: setShowLocation },
              { label: 'Status Badge',     val: showStatus,       set: setShowStatus },
              { label: 'Manufacturer',     val: showManufacturer, set: setShowManufacturer },
            ].map(item => (
              <label key={item.label} className="flex items-center gap-3 py-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => item.set(!item.val)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${item.val ? 'bg-[#635bff]' : ''}`}
                  style={!item.val ? { backgroundColor: 'var(--border)' } : undefined}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${item.val ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
              </label>
            ))}
          </div>

          {/* App URL */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>App URL (for QR)</h3>
            <input
              type="text"
              value={appUrl}
              onChange={e => setAppUrl(e.target.value)}
              placeholder="https://www.myncel.com"
              className="w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/40"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              QR codes link to this URL + /equipment/[id]
            </p>
          </div>

          {/* Machines + per-machine quantity */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Machines ({selectedIds.size}/{machines.length})
              </h3>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-[#635bff] hover:underline">All</button>
                <button onClick={deselectAll} className="text-xs hover:underline" style={{ color: 'var(--text-secondary)' }}>None</button>
              </div>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {machines.map(m => {
                const qty = quantities[m.id] ?? 1;
                const checked = selectedIds.has(m.id);
                return (
                  <div key={m.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMachine(m.id)}
                      className="w-3.5 h-3.5 accent-[#635bff] flex-shrink-0"
                    />
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      m.status === 'OPERATIONAL' ? 'bg-emerald-500' :
                      m.status === 'BREAKDOWN'   ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs truncate flex-1" style={{ color: 'var(--text-primary)' }} title={m.name}>{m.name}</span>
                    {checked && (
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={qty}
                        onChange={e => setQty(m.id, parseInt(e.target.value) || 1)}
                        className="w-12 text-xs text-center rounded px-1 py-0.5"
                        style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        title="Number of label copies"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sheet preview ──────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Preview — {totalLabels} label{totalLabels !== 1 ? 's' : ''} on {sheetCount} sheet{sheetCount !== 1 ? 's' : ''}
              </h2>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {template.pageSize} • {template.cols}×{template.rows} grid
              </div>
            </div>

            {totalLabels === 0 ? (
              <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-secondary)' }}>
                <div className="text-4xl mb-3">🏷️</div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No machines selected</p>
                <p className="text-sm">Pick machines from the left panel to preview the sheet.</p>
              </div>
            ) : (
              <div className="p-4 sm:p-6 overflow-auto" style={{ backgroundColor: '#f1f5f9' }}>
                {/* Hidden print-ready container */}
                <div ref={printRef} style={{ display: 'none' }}>
                  {sheets.map((sheet, sheetIdx) => (
                    <div
                      key={sheetIdx}
                      className="myncel-sheet"
                      style={{
                        width: `${template.pageW}mm`,
                        height: `${template.pageH}mm`,
                        paddingTop: `${template.marginTop}mm`,
                        paddingLeft: `${template.marginLeft}mm`,
                        paddingRight: `${template.marginLeft}mm`,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${template.cols}, ${template.labelW}mm)`,
                        gridTemplateRows: `repeat(${template.rows}, ${template.labelH}mm)`,
                        columnGap: `${template.colGap}mm`,
                        rowGap: `${template.rowGap}mm`,
                        justifyContent: 'start',
                        alignContent: 'start',
                        background: '#fff',
                      }}
                    >
                      {sheet.map((m, idx) =>
                        m ? (
                          <SheetLabel
                            key={`${sheetIdx}-${idx}-${m.id}`}
                            machine={m}
                            qrDataUrl={qrDataUrls[m.id] || qrFallback}
                            template={template}
                            showSerial={showSerial}
                            showLocation={showLocation}
                            showStatus={showStatus}
                            showManufacturer={showManufacturer}
                            forPrint
                          />
                        ) : (
                          <div key={`${sheetIdx}-${idx}-blank`} />
                        )
                      )}
                    </div>
                  ))}
                </div>

                {/* Visible preview — same grid, scaled-to-fit */}
                <div className="space-y-6">
                  {sheets.map((sheet, sheetIdx) => (
                    <div
                      key={sheetIdx}
                      className="bg-white shadow-md mx-auto"
                      style={{
                        width: `${template.pageW * MM_TO_PX * 0.6}px`,
                        height: `${template.pageH * MM_TO_PX * 0.6}px`,
                        paddingTop: `${template.marginTop * MM_TO_PX * 0.6}px`,
                        paddingLeft: `${template.marginLeft * MM_TO_PX * 0.6}px`,
                        paddingRight: `${template.marginLeft * MM_TO_PX * 0.6}px`,
                        display: 'grid',
                        gridTemplateColumns: `repeat(${template.cols}, ${template.labelW * MM_TO_PX * 0.6}px)`,
                        gridTemplateRows: `repeat(${template.rows}, ${template.labelH * MM_TO_PX * 0.6}px)`,
                        columnGap: `${template.colGap * MM_TO_PX * 0.6}px`,
                        rowGap: `${template.rowGap * MM_TO_PX * 0.6}px`,
                        justifyContent: 'start',
                        alignContent: 'start',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 6, right: 8, fontSize: 10,
                        color: '#94a3b8', fontWeight: 500,
                      }}>Sheet {sheetIdx + 1} / {sheets.length}</div>
                      {sheet.map((m, idx) =>
                        m ? (
                          <div
                            key={`${sheetIdx}-${idx}-${m.id}`}
                            onClick={() => setEnlargedQR({ machine: m, qrDataUrl: qrDataUrls[m.id] || qrFallback })}
                            style={{
                              cursor: 'pointer',
                              transform: 'scale(0.6)',
                              transformOrigin: 'top left',
                              width: `${template.labelW}mm`,
                              height: `${template.labelH}mm`,
                            }}
                            title="Click to enlarge"
                          >
                            <SheetLabel
                              machine={m}
                              qrDataUrl={qrDataUrls[m.id] || qrFallback}
                              template={template}
                              showSerial={showSerial}
                              showLocation={showLocation}
                              showStatus={showStatus}
                              showManufacturer={showManufacturer}
                            />
                          </div>
                        ) : (
                          <div
                            key={`${sheetIdx}-${idx}-blank`}
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: '2mm',
                              opacity: 0.4,
                            }}
                          />
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Print tips */}
          <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🖨️ Printing tips</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {[
                { icon: '📄', tip: `Print at 100% scale (NOT "fit to page" or "shrink to fit") so labels land on the perforations.` },
                { icon: '🏷️', tip: `Buy the matching ${template.id.toUpperCase()} sticker sheets — any stationery store sells the Avery line.` },
                { icon: '✅', tip: 'Test one sheet first. Enable "Background graphics" in the print dialog so coloured status badges print.' },
              ].map(t => (
                <div key={t.tip} className="flex gap-2">
                  <span className="flex-shrink-0">{t.icon}</span>
                  <p>{t.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged QR modal */}
      {enlargedQR && (
        <div
          onClick={() => setEnlargedQR(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          className="modal-safe-pad"
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 32,
              maxWidth: 400, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0a2540', margin: 0 }}>{enlargedQR.machine.name}</h3>
              <button
                onClick={() => setEnlargedQR(null)}
                style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >×</button>
            </div>
            <div style={{ display: 'inline-block', padding: 12, background: '#fff', border: '2px solid #e2e8f0', borderRadius: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enlargedQR.qrDataUrl} alt="Enlarged QR" style={{ display: 'block', width: 240, height: 240, imageRendering: 'pixelated' }} />
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
              Scan with any phone camera to open the equipment page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
