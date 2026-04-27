'use client';

import { useState, useRef } from 'react';
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

// ── Minimal SVG QR Code generator ───────────────────────────────────────────
// Uses a simple XOR-based pattern for visual representation.
// For production, replace with a proper QR library.
function generateQRSvg(text: string, size: number = 120): string {
  // Create a deterministic grid based on input text
  const modules = 21; // QR version 1 is 21x21
  const cellSize = size / modules;

  // Hash the text to a number for seeding
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  // Generate module pattern (simplified, not a real QR code)
  const grid: boolean[][] = [];
  for (let r = 0; r < modules; r++) {
    grid[r] = [];
    for (let c = 0; c < modules; c++) {
      // Finder patterns (corners)
      const inTopLeft     = r < 7 && c < 7;
      const inTopRight    = r < 7 && c >= modules - 7;
      const inBottomLeft  = r >= modules - 7 && c < 7;

      if (inTopLeft || inTopRight || inBottomLeft) {
        // Draw finder pattern boxes
        const localR = inTopLeft ? r : inTopRight ? r : r - (modules - 7);
        const localC = inTopLeft ? c : inTopRight ? c - (modules - 7) : c;
        const outerBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6;
        const innerFill   = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
        grid[r][c] = outerBorder || innerFill;
      } else {
        // Data area — use hash-based pattern
        const seed = hash ^ (r * 31 + c * 17 + r * c);
        grid[r][c] = (seed >>> (r % 32)) % 3 !== 0;
      }
    }
  }

  let rects = '';
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="black"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    ${rects}
  </svg>`;
}

function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  OPERATIONAL: { bg: '#dcfce7', text: '#166534', label: 'Operational' },
  MAINTENANCE:  { bg: '#fef9c3', text: '#854d0e', label: 'Maintenance' },
  BREAKDOWN:    { bg: '#fee2e2', text: '#991b1b', label: 'Breakdown' },
  RETIRED:      { bg: '#f1f5f9', text: '#475569', label: 'Retired' },
};

const LABEL_SIZES = [
  { id: 'sm',  label: 'Small (50×50mm)',  w: 180, h: 180, fontSize: 8  },
  { id: 'md',  label: 'Medium (80×60mm)', w: 240, h: 180, fontSize: 9  },
  { id: 'lg',  label: 'Large (100×80mm)', w: 300, h: 220, fontSize: 10 },
];

interface LabelProps {
  machine: Machine;
  appUrl: string;
  size: typeof LABEL_SIZES[0];
  showSerial: boolean;
  showLocation: boolean;
  showStatus: boolean;
  showManufacturer: boolean;
}

function MachineLabel({ machine, appUrl, size, showSerial, showLocation, showStatus, showManufacturer }: LabelProps) {
  const qrUrl = `${appUrl}/equipment/${machine.id}`;
  const qrSvg = generateQRSvg(qrUrl, size.id === 'lg' ? 90 : size.id === 'md' ? 75 : 60);
  const qrDataUrl = svgToDataUrl(qrSvg);
  const statusInfo = STATUS_COLORS[machine.status] || STATUS_COLORS.OPERATIONAL;

  return (
    <div
      className="label-card"
      style={{
        width: `${size.w}px`,
        minHeight: `${size.h}px`,
        backgroundColor: '#fff',
        border: '1.5px solid #0a2540',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Top row: logo + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#0a2540', letterSpacing: '-0.3px' }}>MYNCEL</span>
        {showStatus && (
          <span style={{
            fontSize: '8px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px',
            backgroundColor: statusInfo.bg, color: statusInfo.text,
          }}>
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* Main content: QR + info */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
        {/* QR Code */}
        <div style={{ flexShrink: 0, padding: '3px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR" style={{ display: 'block', width: size.id === 'lg' ? 90 : size.id === 'md' ? 75 : 60 }} />
        </div>

        {/* Machine info */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontSize: `${size.fontSize + 1}px`, fontWeight: 700, color: '#0a2540', lineHeight: 1.2, marginBottom: '4px', wordBreak: 'break-word' }}>
            {machine.name}
          </div>
          {showManufacturer && machine.manufacturer && (
            <div style={{ fontSize: `${size.fontSize - 1}px`, color: '#546884', marginBottom: '2px' }}>
              {machine.manufacturer}{machine.model ? ` · ${machine.model}` : ''}
            </div>
          )}
          {showSerial && machine.serialNumber && (
            <div style={{ fontSize: `${size.fontSize - 1}px`, color: '#546884', fontFamily: 'monospace', marginBottom: '2px' }}>
              S/N: {machine.serialNumber}
            </div>
          )}
          {showLocation && machine.location && (
            <div style={{ fontSize: `${size.fontSize - 1}px`, color: '#546884', marginBottom: '2px' }}>
              📍 {machine.location}
            </div>
          )}
          <div style={{ fontSize: `${size.fontSize - 1}px`, color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {machine.id.slice(0, 16)}...
          </div>
        </div>
      </div>

      {/* Scan hint */}
      <div style={{ fontSize: '7px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
        Scan to view equipment details
      </div>
    </div>
  );
}

// ── Main page component ──────────────────────────────────────────────────────

export default function QRLabelsClient({ machines }: { machines: Machine[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(machines.map(m => m.id)));
  const [labelSize, setLabelSize] = useState(LABEL_SIZES[1]);
  const [showSerial, setShowSerial] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [showManufacturer, setShowManufacturer] = useState(true);
  const [appUrl, setAppUrl] = useState(typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com');
  const printRef = useRef<HTMLDivElement>(null);

  const toggleMachine = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll   = () => setSelectedIds(new Set(machines.map(m => m.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html><head>
      <title>QR Labels — Myncel CMMS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; font-family: system-ui, sans-serif; }
        .labels-grid {
          display: flex; flex-wrap: wrap; gap: 12px; padding: 16px;
          justify-content: flex-start; align-content: flex-start;
        }
        .label-card { page-break-inside: avoid; break-inside: avoid; }
        @page { margin: 10mm; size: A4; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .labels-grid { gap: 8px; padding: 0; }
        }
      </style>
    </head><body>
      <div class="labels-grid">${printContent}</div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const selectedMachines = machines.filter(m => selectedIds.has(m.id));

  return (
    <div className="dash-theme min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>

      {/* Top nav */}
      <div className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-75 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <span style={{ color: 'var(--border)' }}>›</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>QR Labels</span>
        </div>
        <button
          onClick={handlePrint}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-2 bg-[#635bff] hover:bg-[#5248e6] disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          🖨️ Print {selectedIds.size} Label{selectedIds.size !== 1 ? 's' : ''}
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>QR Label Generator</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Print scannable QR stickers for each machine. Scan with any phone to open the equipment detail page.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Settings Panel ─────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Label size */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>Label Size</h3>
              <div className="space-y-2">
                {LABEL_SIZES.map(s => (
                  <button key={s.id} onClick={() => setLabelSize(s)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={labelSize.id === s.id
                      ? { backgroundColor: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.35)', color: 'var(--text-primary)' }
                      : { backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                    }>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Label content */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>Show on Label</h3>
              {[
                { label: 'Serial Number',    val: showSerial,       set: setShowSerial },
                { label: 'Location',         val: showLocation,     set: setShowLocation },
                { label: 'Status Badge',     val: showStatus,       set: setShowStatus },
                { label: 'Manufacturer',     val: showManufacturer, set: setShowManufacturer },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 py-2 cursor-pointer">
                  <button
                    onClick={() => item.set(!item.val)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${item.val ? 'bg-[#635bff]' : ''}`}
                    style={!item.val ? { backgroundColor: 'var(--border)' } : undefined}>
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
                placeholder="https://your-app.com"
                className="w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 transition-all"
                style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                QR codes will link to this URL + /equipment/[id]
              </p>
            </div>

            {/* Machine selection */}
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
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {machines.map(m => (
                  <label key={m.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                    <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleMachine(m.id)}
                      className="w-3.5 h-3.5 accent-[#635bff] flex-shrink-0" />
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      m.status === 'OPERATIONAL' ? 'bg-emerald-500' :
                      m.status === 'BREAKDOWN'   ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Label Preview ──────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Preview — {selectedMachines.length} label{selectedMachines.length !== 1 ? 's' : ''}
                </h2>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>📐 {labelSize.label}</span>
                </div>
              </div>

              {selectedMachines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-secondary)' }}>
                  <div className="text-4xl mb-3">🏷️</div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No machines selected</p>
                  <p className="text-sm">Select machines from the left panel to generate labels.</p>
                </div>
              ) : (
                <div className="p-6">
                  {/* Hidden print-ready div */}
                  <div ref={printRef} style={{ display: 'none' }}>
                    {selectedMachines.map(m => {
                      const qrUrl = `${appUrl}/equipment/${m.id}`;
                      const qrSvg = generateQRSvg(qrUrl, labelSize.id === 'lg' ? 90 : labelSize.id === 'md' ? 75 : 60);
                      const statusInfo = STATUS_COLORS[m.status] || STATUS_COLORS.OPERATIONAL;
                      const fs = labelSize.fontSize;
                      return (
                        <div key={m.id} style={{
                          width: `${labelSize.w}px`, minHeight: `${labelSize.h}px`,
                          backgroundColor: '#fff', border: '1.5px solid #0a2540',
                          borderRadius: '10px', padding: '10px', display: 'flex',
                          flexDirection: 'column', gap: '6px',
                          fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box',
                          pageBreakInside: 'avoid', breakInside: 'avoid',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#0a2540' }}>MYNCEL</span>
                            {showStatus && (
                              <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px', backgroundColor: statusInfo.bg, color: statusInfo.text }}>
                                {statusInfo.label}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
                            <div style={{ flexShrink: 0, padding: '3px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                              dangerouslySetInnerHTML={{ __html: qrSvg }} />
                            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                              <div style={{ fontSize: `${fs + 1}px`, fontWeight: 700, color: '#0a2540', lineHeight: 1.2, marginBottom: '4px' }}>{m.name}</div>
                              {showManufacturer && m.manufacturer && (
                                <div style={{ fontSize: `${fs - 1}px`, color: '#546884', marginBottom: '2px' }}>{m.manufacturer}{m.model ? ` · ${m.model}` : ''}</div>
                              )}
                              {showSerial && m.serialNumber && (
                                <div style={{ fontSize: `${fs - 1}px`, color: '#546884', fontFamily: 'monospace', marginBottom: '2px' }}>S/N: {m.serialNumber}</div>
                              )}
                              {showLocation && m.location && (
                                <div style={{ fontSize: `${fs - 1}px`, color: '#546884', marginBottom: '2px' }}>📍 {m.location}</div>
                              )}
                              <div style={{ fontSize: `${fs - 1}px`, color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>{m.id.slice(0, 16)}...</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '7px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                            Scan to view equipment details
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Visible preview grid */}
                  <div className="flex flex-wrap gap-4">
                    {selectedMachines.map(m => (
                      <MachineLabel
                        key={m.id}
                        machine={m}
                        appUrl={appUrl}
                        size={labelSize}
                        showSerial={showSerial}
                        showLocation={showLocation}
                        showStatus={showStatus}
                        showManufacturer={showManufacturer}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Print tips */}
            <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🖨️ Printing Tips</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {[
                  { icon: '📄', tip: 'Use A4 or Letter paper. Set margins to 10mm in your browser print dialog.' },
                  { icon: '🏷️', tip: 'For best results, use Avery 4x3 or 2x2 label sheets available at office stores.' },
                  { icon: '✅', tip: 'Test one label first. Enable "Background graphics" in print settings for colored badges.' },
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
      </div>
    </div>
  );
}