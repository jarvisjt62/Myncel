'use client';

import '../../components/theme.css';
import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from '../../components/ThemeProvider';

const SECRET = 'myncel-simulate-2024';

interface HMIOrg {
  id: string;
  name: string;
}

interface HMIMachine {
  id: string;
  name: string;
  status: string;
  criticality: string;
  category: string;
  location: string | null;
  totalHours: number;
  organizationId: string;
  organization: HMIOrg | null;
  _count: { workOrders: number; alerts: number };
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; label: string; glow: string; textColor: string }> = {
  OPERATIONAL: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', dot: 'bg-emerald-400', label: 'OPERATIONAL', glow: 'shadow-emerald-500/20', textColor: '#34d399' },
  MAINTENANCE:  { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/40',  dot: 'bg-yellow-400',  label: 'MAINTENANCE',  glow: 'shadow-yellow-500/20',  textColor: '#fbbf24' },
  BREAKDOWN:    { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/50',     dot: 'bg-red-400',     label: 'BREAKDOWN',    glow: 'shadow-red-500/30',    textColor: '#f87171' },
  RETIRED:      { color: 'text-gray-500',    bg: 'bg-gray-500/5',     border: 'border-gray-500/20',    dot: 'bg-gray-500',    label: 'RETIRED',      glow: '',                     textColor: '#6b7280' },
};

// ── Category display labels ─────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  CNC_MILL:       'CNC Mill',
  CNC_LATHE:      'CNC Lathe',
  PRESS:          'Press',
  HYDRAULIC:      'Hydraulic Press',
  COMPRESSOR:     'Compressor',
  CONVEYOR:       'Conveyor',
  WELDER:         'Welder',
  INJECTION_MOLD: 'Injection Mold',
  ASSEMBLY:       'Assembly',
  OTHER:          'Machine',
};

// Infer a smart display label for OTHER category machines from their name
function getCategoryLabel(category: string, machineName: string): string {
  if (category !== 'OTHER') return CATEGORY_LABELS[category] || category.replace(/_/g, ' ');
  const name = machineName.toLowerCase();
  if (name.includes('lathe'))              return 'CNC Lathe';
  if (name.includes('mill') || name.includes('milling')) return 'CNC Mill';
  if (name.includes('press brake') || name.includes('pressbrake')) return 'Press Brake';
  if (name.includes('press'))             return 'Hydraulic Press';
  if (name.includes('hydraulic'))         return 'Hydraulic Unit';
  if (name.includes('compressor'))        return 'Compressor';
  if (name.includes('conveyor'))          return 'Conveyor';
  if (name.includes('weld'))              return 'Welder';
  if (name.includes('injection') || name.includes('molding') || name.includes('mold')) return 'Injection Mold';
  if (name.includes('robot'))             return 'Robot';
  if (name.includes('grind'))             return 'Grinder';
  if (name.includes('drill'))             return 'Drill Press';
  if (name.includes('saw') || name.includes('cut')) return 'Cutting Machine';
  if (name.includes('punch'))             return 'Punch Press';
  if (name.includes('laser'))             return 'Laser Cutter';
  if (name.includes('plasma'))            return 'Plasma Cutter';
  if (name.includes('pump'))              return 'Pump';
  if (name.includes('fan') || name.includes('ventil')) return 'Ventilation';
  if (name.includes('generat'))           return 'Generator';
  if (name.includes('boiler'))            return 'Boiler';
  if (name.includes('furnace') || name.includes('oven')) return 'Furnace';
  if (name.includes('assem'))             return 'Assembly Station';
  return 'Industrial Machine';
}

// ── Real machine photo URLs per category/name ────────────────────────────────
function getMachineImageUrl(category: string, machineName: string): string {
  const name = machineName.toLowerCase();
  // Specific name matches first
  if (name.includes('press brake') || name.includes('pressbrake'))
    return '/machines/press-brake.png?v=4';
  if (name.includes('injection mold') || name.includes('injection molding') || name.includes('inject'))
    return '/machines/injection-mold.png?v=4';
  if (name.includes('robot') || name.includes('assembly'))
    return '/machines/assembly.png?v=4';
  if (name.includes('weld'))
    return '/machines/welder.png?v=4';
  if (name.includes('lathe'))
    return '/machines/cnc-lathe.png?v=4';
  if (name.includes('mill') || name.includes('milling'))
    return '/machines/cnc-mill.png?v=4';
  if (name.includes('press') || name.includes('hydraulic'))
    return '/machines/press-brake.png?v=4';
  if (name.includes('compressor'))
    return '/machines/compressor.png?v=4';
  if (name.includes('conveyor'))
    return '/machines/conveyor.png?v=4';

  // Category fallbacks
  switch (category) {
    case 'CNC_MILL':
      return '/machines/cnc-mill.png?v=4';
    case 'CNC_LATHE':
      return '/machines/cnc-lathe.png?v=4';
    case 'PRESS':
    case 'HYDRAULIC':
      return '/machines/press-brake.png?v=4';
    case 'COMPRESSOR':
      return '/machines/compressor.png?v=4';
    case 'CONVEYOR':
      return '/machines/conveyor.png?v=4';
    case 'WELDER':
      return '/machines/welder.png?v=4';
    case 'INJECTION_MOLD':
      return '/machines/injection-mold.png?v=4';
    case 'ASSEMBLY':
      return '/machines/assembly.png?v=4';
    default:
      return '/machines/other.png?v=4';
  }
}

// ── Get category-specific live readout labels ────────────────────────────────
function getCategoryReadouts(category: string, machineName: string, rpm: number, load: number, pressure: number) {
  const name = machineName.toLowerCase();
  if (category === 'CNC_MILL' || category === 'CNC_LATHE' || name.includes('lathe') || name.includes('mill')) {
    return [
      { label: 'SPINDLE', value: `${rpm.toFixed(0)}`,                              unit: 'RPM'    },
      { label: 'FEED',    value: `${(rpm * 0.14).toFixed(0)}`,                     unit: 'mm/min' },
      { label: 'Z POS',   value: `${-(rpm * 0.065 + load * 0.3).toFixed(1)}`,      unit: 'mm'     },
      { label: 'PART Ø',  value: `${(50 + load * 0.35).toFixed(1)}`,               unit: 'mm'     },
    ];
  }
  if (category === 'PRESS' || category === 'HYDRAULIC' || name.includes('press') || name.includes('hydraulic')) {
    return [
      { label: 'FORCE',  value: `${(pressure * 9.2).toFixed(0)}`,  unit: 'kN'   },
      { label: 'STROKE', value: `${(load * 2.5).toFixed(0)}`,      unit: 'mm'   },
      { label: 'PRESS',  value: `${pressure.toFixed(1)}`,          unit: 'bar'  },
      { label: 'CYCLES', value: `${(rpm * 0.1).toFixed(0)}`,       unit: '/min' },
    ];
  }
  if (category === 'COMPRESSOR' || name.includes('compressor')) {
    return [
      { label: 'TANK',  value: `${(pressure * 1.15).toFixed(1)}`, unit: 'PSI' },
      { label: 'FLOW',  value: `${(load * 0.85).toFixed(1)}`,     unit: 'cfm' },
      { label: 'RPM',   value: `${rpm.toFixed(0)}`,               unit: 'RPM' },
      { label: 'LOAD',  value: `${load.toFixed(0)}`,              unit: '%'   },
    ];
  }
  if (category === 'CONVEYOR' || name.includes('conveyor')) {
    return [
      { label: 'SPEED', value: `${(rpm * 0.00028).toFixed(3)}`,   unit: 'm/s'  },
      { label: 'PARTS', value: `${(load * 0.5).toFixed(0)}`,      unit: '/min' },
      { label: 'LOAD',  value: `${load.toFixed(0)}`,              unit: '%'    },
      { label: 'TEMP',  value: `${(40 + load * 0.2).toFixed(0)}`, unit: '°C'  },
    ];
  }
  if (category === 'WELDER' || name.includes('weld')) {
    return [
      { label: 'VOLTAGE', value: `${(20 + load * 0.08).toFixed(1)}`, unit: 'V'     },
      { label: 'WIRE',    value: `${(rpm * 0.004).toFixed(1)}`,       unit: 'm/min' },
      { label: 'CURRENT', value: `${(load * 2.2).toFixed(0)}`,        unit: 'A'     },
      { label: 'DUTY',    value: `${load.toFixed(0)}`,                unit: '%'     },
    ];
  }
  if (category === 'INJECTION_MOLD' || name.includes('inject') || name.includes('mold')) {
    return [
      { label: 'CLAMP',  value: `${(pressure * 4.8).toFixed(0)}`,   unit: 'T'    },
      { label: 'BARREL', value: `${(180 + load * 0.7).toFixed(0)}`, unit: '°C'   },
      { label: 'INJECT', value: `${(rpm * 0.06).toFixed(0)}`,       unit: 'mm/s' },
      { label: 'CYCLE',  value: `${(20 - load * 0.08).toFixed(1)}`, unit: 's'    },
    ];
  }
  if (category === 'ASSEMBLY' || name.includes('robot') || name.includes('assembly')) {
    return [
      { label: 'AXIS J1', value: `${(load * 1.8).toFixed(1)}`,     unit: '°'    },
      { label: 'AXIS J2', value: `${(pressure * 0.9).toFixed(1)}`, unit: '°'    },
      { label: 'REACH',   value: `${(load * 0.8).toFixed(0)}`,     unit: 'mm'   },
      { label: 'SPEED',   value: `${(rpm * 0.05).toFixed(0)}`,     unit: 'mm/s' },
    ];
  }
  return [
    { label: 'RPM',      value: `${rpm.toFixed(0)}`,           unit: 'RPM' },
    { label: 'LOAD',     value: `${load.toFixed(0)}`,          unit: '%'   },
    { label: 'PRESSURE', value: `${pressure.toFixed(0)}`,      unit: 'PSI' },
    { label: 'OUTPUT',   value: `${(load * 0.95).toFixed(0)}`, unit: '%'   },
  ];
}

// ── Machine Image Component ───────────────────────────────────────────────────
function MachineImage({ category, machineName, status, className = '', liveData, compact = false }: {
  category: string; machineName: string; status: string; className?: string;
  liveData?: { temp: number; load: number; rpm: number; pressure: number };
  compact?: boolean;
}) {
  const imgUrl = getMachineImageUrl(category, machineName);
  const isBreakdown = status === 'BREAKDOWN';
  const isMaintenance = status === 'MAINTENANCE';
  const isOp = status === 'OPERATIONAL';
  const readouts = liveData && isOp
    ? getCategoryReadouts(category, machineName, liveData.rpm, liveData.load, liveData.pressure)
    : [];

  const tempColor = liveData && liveData.temp > 90 ? '#f87171' : liveData && liveData.temp > 78 ? '#fbbf24' : '#34d399';
  const loadColor = liveData && liveData.load > 90 ? '#ef4444' : liveData && liveData.load > 70 ? '#fbbf24' : '#635bff';

  return (
    <div className={`relative overflow-hidden ${className}`}
      style={{ background: '#0a1628' }}>

      {/* SCADA image — object-contain, transparent bg so no letterbox */}
      <img
        src={imgUrl}
        alt={machineName}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
          filter: isBreakdown
            ? 'grayscale(0.4) brightness(0.65) sepia(0.3) saturate(2) hue-rotate(-10deg)'
            : isMaintenance
            ? 'grayscale(0.2) brightness(0.8) sepia(0.1)'
            : 'brightness(1.0) saturate(1.1)',
          transition: 'filter 0.5s ease',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80';
        }}
      />

      {/* Live data overlay — only OPERATIONAL */}
      {liveData && isOp && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: compact ? 4 : 8,
        }}>
          {/* TOP ROW: TEMP left, RPM right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(0,12,28,0.85)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 4, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: tempColor, boxShadow: `0 0 5px ${tempColor}`, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ color: '#67e8f9', fontSize: compact ? 8 : 9, fontFamily: 'monospace' }}>TEMP</span>
              <span style={{ color: tempColor, fontSize: compact ? 10 : 12, fontFamily: 'monospace', fontWeight: 800 }}>{liveData.temp.toFixed(0)}°C</span>
            </div>
            <div style={{ background: 'rgba(0,12,28,0.85)', border: '1px solid rgba(0,210,255,0.4)', borderRadius: 4, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#67e8f9', fontSize: compact ? 8 : 9, fontFamily: 'monospace' }}>RPM</span>
              <span style={{ color: '#93c5fd', fontSize: compact ? 10 : 12, fontFamily: 'monospace', fontWeight: 800 }}>{liveData.rpm.toFixed(0)}</span>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 4 readouts grid — only in non-compact (detail panel) */}
            {!compact && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                {readouts.map((r, i) => (
                  <div key={i} style={{
                    background: 'rgba(0,12,28,0.88)', border: '1px solid rgba(0,210,255,0.3)',
                    borderRadius: 4, padding: '3px 8px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ color: '#67e8f9', fontSize: 9, fontFamily: 'monospace', opacity: 0.85 }}>{r.label}</span>
                    <span style={{ color: '#e2f8ff', fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>
                      {r.value}
                      <span style={{ color: '#67e8f9', fontSize: 8, marginLeft: 2, opacity: 0.75 }}>{r.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* LOAD bar */}
            <div style={{ background: 'rgba(0,12,28,0.88)', border: '1px solid rgba(0,210,255,0.3)', borderRadius: 4, padding: compact ? '2px 6px' : '4px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ color: '#67e8f9', fontSize: compact ? 8 : 9, fontFamily: 'monospace' }}>LOAD</span>
                <span style={{ color: loadColor, fontSize: compact ? 10 : 11, fontFamily: 'monospace', fontWeight: 800 }}>{liveData.load.toFixed(0)}%</span>
                <span style={{ color: '#67e8f9', fontSize: compact ? 8 : 9, fontFamily: 'monospace', opacity: 0.8 }}>PSI {liveData.pressure.toFixed(0)}</span>
              </div>
              <div style={{ width: '100%', height: compact ? 3 : 4, background: 'rgba(100,116,139,0.3)', borderRadius: 2 }}>
                <div style={{
                  width: `${liveData.load}%`, height: '100%', borderRadius: 2,
                  background: loadColor,
                  boxShadow: `0 0 6px ${loadColor}`,
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BREAKDOWN overlay */}
      {isBreakdown && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(127,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="animate-pulse" style={{ color: '#fca5a5', fontSize: 12, fontWeight: 800, fontFamily: 'monospace', background: 'rgba(100,0,0,0.85)', padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.7)' }}>⚠ FAULT DETECTED</span>
        </div>
      )}
      {/* MAINTENANCE overlay */}
      {isMaintenance && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(80,60,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fde68a', fontSize: 12, fontWeight: 700, fontFamily: 'monospace', background: 'rgba(80,55,0,0.85)', padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(251,191,36,0.6)' }}>🔧 IN MAINTENANCE</span>
        </div>
      )}
    </div>
  );
}

// Org badge colour palette — cycles through distinct colours per org name
const ORG_COLOURS = [
  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30' },
  { text: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30'   },
  { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
  { text: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/30'   },
  { text: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/30'   },
  { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'  },
  { text: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30' },
  { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30'   },
];

// Stable colour assignment based on org name hash
function getOrgColour(orgName: string) {
  let hash = 0;
  for (let i = 0; i < orgName.length; i++) hash = (hash * 31 + orgName.charCodeAt(i)) & 0xffffffff;
  return ORG_COLOURS[Math.abs(hash) % ORG_COLOURS.length];
}

// ── SVG Gauge ─────────────────────────────────────────────────────────────────
function RadialGauge({ value, max, label, unit, color, size = 80 }: {
  value: number; max: number; label: string; unit: string; color: string; size?: number;
}) {
  const pct = Math.min(1, Math.max(0, value / max));
  const r = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const startAngle = -210;
  const sweepAngle = 240;
  const angle = startAngle + pct * sweepAngle;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcX = (deg: number) => cx + r * Math.cos(toRad(deg));
  const arcY = (deg: number) => cy + r * Math.sin(toRad(deg));
  const largeArc = pct * sweepAngle > 180 ? 1 : 0;

  const trackPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(startAngle + sweepAngle)} ${arcY(startAngle + sweepAngle)}`;
  const fillPath = pct > 0
    ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(angle)} ${arcY(angle)}`
    : '';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={trackPath} fill="none" stroke="var(--gauge-track)" strokeWidth="6" strokeLinecap="round" />
        {fillPath && <path d={fillPath} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />}
        <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700" fontFamily="monospace">
          {value.toFixed(0)}{unit}
        </text>
      </svg>
      <span className="text-[9px] uppercase tracking-widest -mt-1" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 80; const h = 24;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}


// ── Toast Notification ────────────────────────────────────────────────────────
function AdminToast({ msg, type, onDone }: { msg: string; type: 'success' | 'error' | 'info'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
           : type === 'error'   ? 'bg-red-500/20 border-red-500/40 text-red-300'
           :                      'bg-blue-500/20 border-blue-500/40 text-blue-300';
  return (
    <div className={`fixed bottom-4 right-4 z-[200] px-4 py-3 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-sm flex items-center gap-2 ${bg}`}>
      <span>{type === 'success' ? '[OK]' : type === 'error' ? '[ERR]' : '[i]'}</span>
      <span>{msg}</span>
    </div>
  );
}

// ── Org Badge ─────────────────────────────────────────────────────────────────
function OrgBadge({ name, size = 'sm' }: { name: string; size?: 'xs' | 'sm' }) {
  const c = getOrgColour(name);
  const cls = size === 'xs'
    ? `text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${c.text} ${c.bg} ${c.border}`
    : `text-[10px] px-2 py-0.5 rounded-lg font-semibold border ${c.text} ${c.bg} ${c.border}`;
  return <span className={cls}>{name}</span>;
}

// ── Machine Detail Panel ───────────────────────────────────────────────────────
function MachineDetailPanel({ machine, onClose, onSim, onStatusChange }: {
  machine: HMIMachine;
  onClose: () => void;
  onSim: (scenario: string) => void;
  onStatusChange: (machineId: string, newStatus: string) => void;
}) {
  const { isDark } = useTheme();
  const svgBase    = isDark ? '#1e2d4a' : '#dde8f5';
  const svgSurface = isDark ? '#162035' : '#c8daf0';
  const svgPanel   = isDark ? '#0d1426' : '#b0c8e8';
  const svgStroke  = isDark ? '#2d3f5e' : '#94b8d8';

  const [currentStatus, setCurrentStatus] = useState(machine.status);
  const [cmdLoading, setCmdLoading]       = useState<string | null>(null);
  const [cmdLog,     setCmdLog]           = useState<{ ts: string; text: string; ok: boolean }[]>([]);
  const [toast,      setToast]            = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const currentCfg  = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.OPERATIONAL;
  const isOp        = currentStatus === 'OPERATIONAL';
  const isBreakdown = currentStatus === 'BREAKDOWN';

  const [temp, setTemp] = useState(isBreakdown ? 102 : 72);
  const [load, setLoad] = useState(isOp ? 60 : 0);
  const [rpmCard, setRpmCard] = useState(isOp ? 1800 : 0);
  const [pressureCard, setPressureCard] = useState(isOp ? 65 : 0);
  const [rpm, setRpm] = useState(isOp ? 1800 : 0);
  const [pressure, setPressure] = useState(isOp ? 65 : 0);
  const [vibration, setVibration] = useState(isBreakdown ? 8.5 : 0.5);
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [loadHistory, setLoadHistory] = useState<number[]>([]);

  const live = currentStatus === 'OPERATIONAL';

  useEffect(() => {
    if (!live) { setLoad(0); setRpm(0); setPressure(0); setVibration(0); return; }
    const iv = setInterval(() => {
      setTemp(t => { const v = Math.max(55, Math.min(98, t + (Math.random() - 0.5) * 3)); setTempHistory(h => [...h.slice(-19), v]); return v; });
      setLoad(l => { const v = Math.max(20, Math.min(99, l + (Math.random() - 0.5) * 6)); setLoadHistory(h => [...h.slice(-19), v]); return v; });
      setRpm(r => Math.max(800, Math.min(3200, r + (Math.random() - 0.5) * 100)));
      setPressure(p => Math.max(40, Math.min(100, p + (Math.random() - 0.5) * 4)));
      setVibration(v => Math.max(0, Math.min(5, v + (Math.random() - 0.5) * 0.2)));
    }, 1000);
    return () => clearInterval(iv);
  }, [live]);

  const logCmd = (text: string, ok: boolean) => {
    const ts = new Date().toLocaleTimeString();
    setCmdLog(l => [{ ts, text, ok }, ...l.slice(0, 9)]);
  };

  const sendCommand = async (command: string, label: string) => {
    setCmdLoading(command);
    try {
      const res = await fetch(`/api/machines/${machine.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (!res.ok) {
        logCmd(`${label} -> FAILED: ${data.error || res.statusText}`, false);
        setToast({ msg: `Failed: ${data.error || 'Unknown error'}`, type: 'error' });
      } else {
        const newStatus = data.newStatus as string;
        setCurrentStatus(newStatus);
        logCmd(`${label} -> ${newStatus} OK`, true);
        let msg = '';
        if (command === 'REQUEST_MAINTENANCE') {
          msg = `Maintenance requested. WO ${data.workOrder?.woNumber || ''} created. Status -> MAINTENANCE`;
        } else if (command === 'EMERGENCY_STOP') {
          msg = `Emergency Stop! Status -> BREAKDOWN. Alert & WO created.`;
        } else if (command === 'START') {
          msg = `Machine started. Status -> OPERATIONAL`;
        } else if (command === 'PAUSE') {
          msg = `Machine paused. Status -> MAINTENANCE`;
        } else if (command === 'STOP') {
          msg = `Machine stopped (parked). Status -> MAINTENANCE — press START to resume.`;
        } else {
          msg = `Command sent.`;
        }
        setToast({ msg, type: command === 'EMERGENCY_STOP' ? 'error' : 'success' });
        onStatusChange(machine.id, newStatus);
      }
    } catch (err) {
      logCmd(`${label} -> NETWORK ERROR`, false);
      setToast({ msg: 'Network error — please try again', type: 'error' });
    }
    setCmdLoading(null);
  };

  const orgName = machine.organization?.name || 'Unknown Org';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      {toast && <AdminToast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div className="[background:var(--bg-surface-2)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-5 border-b border-[var(--border)] flex items-center justify-between ${currentCfg.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${currentCfg.dot} ${isOp ? 'animate-pulse' : isBreakdown ? 'animate-ping' : ''}`}/>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{machine.name}</h2>
                {/* Organization badge in header */}
                <OrgBadge name={orgName} size="sm" />
              </div>
              <p className="text-[var(--text-secondary)] text-xs mt-0.5">
                {getCategoryLabel(machine.category, machine.name)} &middot; {machine.location || 'No location'} &middot; {machine.totalHours.toLocaleString()}h runtime
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentCfg.bg} ${currentCfg.border} ${currentCfg.color}`}>{currentCfg.label}</span>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Machine SCADA Image — full width, prominent */}
          <div className={`rounded-xl border ${currentCfg.border} overflow-hidden`} style={{ background: '#0a1628' }}>
            <MachineImage category={machine.category} machineName={machine.name} status={currentStatus} className="w-full h-96" liveData={isOp ? { temp, load, rpm, pressure } : undefined} />
          </div>

          <div className="grid md:grid-cols-3 gap-5">
          {/* Machine Info */}
          <div className={`rounded-xl border ${currentCfg.border} ${currentCfg.bg} p-4 flex flex-col gap-3`}>
            {isBreakdown && (
              <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <p className="text-red-400 text-xs font-bold animate-pulse">BREAKDOWN DETECTED</p>
                <p className="text-red-400/70 text-[10px] mt-1">Immediate attention required</p>
              </div>
            )}
            {currentStatus === 'MAINTENANCE' && (
              <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                <p className="text-yellow-400 text-xs font-bold">IN MAINTENANCE</p>
                <p className="text-yellow-400/70 text-[10px] mt-1">Scheduled service in progress</p>
              </div>
            )}
            <div className="w-full space-y-1.5">
              {[
                { l: 'Organization', v: orgName, isOrg: true },
                { l: 'Criticality',  v: machine.criticality, isOrg: false },
                { l: 'Work Orders',  v: machine._count.workOrders, isOrg: false },
                { l: 'Active Alerts', v: machine._count.alerts, isOrg: false },
                { l: 'Current Status', v: currentStatus, isOrg: false },
              ].map(f => (
                <div key={f.l} className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-muted)]">{f.l}</span>
                  {f.isOrg
                    ? <OrgBadge name={String(f.v)} size="xs" />
                    : <span style={{ color: 'var(--text-primary)' }} className="font-medium">{f.v}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Live Gauges */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Live Sensor Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center">
                <RadialGauge value={temp} max={120} label="TEMP" unit="°" color={temp > 95 ? '#ef4444' : temp > 80 ? '#fbbf24' : '#34d399'} size={80}/>
                <Sparkline data={tempHistory} color={temp > 95 ? '#ef4444' : '#34d399'}/>
              </div>
              <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center">
                <RadialGauge value={load} max={100} label="LOAD" unit="%" color={load > 90 ? '#ef4444' : '#635bff'} size={80}/>
                <Sparkline data={loadHistory} color="#635bff"/>
              </div>
              <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center">
                <RadialGauge value={rpm} max={4000} label="RPM" unit="" color="#60a5fa" size={80}/>
              </div>
              <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center">
                <RadialGauge value={vibration} max={10} label="VIB" unit="g" color={vibration > 5 ? '#ef4444' : vibration > 3 ? '#fbbf24' : '#a78bfa'} size={80}/>
              </div>
            </div>
            {/* Pressure bar */}
            <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-3">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[var(--text-muted)] uppercase tracking-wide">Pressure</span>
                <span style={{ color: 'var(--text-primary)' }} className="font-mono font-bold">{pressure.toFixed(1)} PSI</span>
              </div>
              <div className="w-full bg-[var(--bar-bg)] rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pressure}%`, backgroundColor: pressure > 85 ? '#ef4444' : pressure > 70 ? '#fbbf24' : '#635bff', boxShadow: `0 0 6px ${pressure > 85 ? '#ef4444' : '#635bff'}` }}/>
              </div>
            </div>
            {!live && (
              <div className="rounded-lg px-3 py-2 text-[10px] text-center border" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                Sensor data paused — machine not operational
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Operator Controls</h3>
            <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">

              {/* START */}
              <button
                onClick={() => sendCommand('START', 'START')}
                disabled={cmdLoading !== null || currentStatus === 'OPERATIONAL'}
                className="w-full px-3 py-2.5 text-left text-xs font-semibold border border-emerald-500/40 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {cmdLoading === 'START' && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
                {'>>'} START MACHINE
                {currentStatus === 'OPERATIONAL' && <span className="ml-auto text-[9px] opacity-50">(running)</span>}
              </button>

              {/* PAUSE */}
              <button
                onClick={() => sendCommand('PAUSE', 'PAUSE')}
                disabled={cmdLoading !== null || currentStatus !== 'OPERATIONAL'}
                className="w-full px-3 py-2.5 text-left text-xs font-semibold border border-yellow-500/40 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {cmdLoading === 'PAUSE' && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
                {'||'} PAUSE MACHINE
              </button>

              {/* STOP */}
              <button
                onClick={() => sendCommand('STOP', 'STOP')}
                disabled={cmdLoading !== null || currentStatus !== 'OPERATIONAL'}
                className="w-full px-3 py-2.5 text-left text-xs font-semibold border border-gray-500/40 rounded-lg hover:bg-gray-500/20 text-gray-300 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {cmdLoading === 'STOP' && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
                {'[.]'} STOP MACHINE
                   {currentStatus === 'MAINTENANCE' && <span className="ml-auto text-[9px] opacity-50">(stopped)</span>}
              </button>

              {/* REQUEST MAINTENANCE */}
              <button
                onClick={() => sendCommand('REQUEST_MAINTENANCE', 'REQUEST MAINTENANCE')}
                disabled={cmdLoading !== null || currentStatus === 'MAINTENANCE'}
                className="w-full px-3 py-2.5 text-left text-xs font-semibold border border-blue-500/40 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {cmdLoading === 'REQUEST_MAINTENANCE' && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
                [W] REQUEST MAINTENANCE
                {currentStatus === 'MAINTENANCE' && <span className="ml-auto text-[9px] opacity-50">(active)</span>}
              </button>

              {/* EMERGENCY STOP */}
              <button
                onClick={() => {
                  if (confirm(`EMERGENCY STOP\n\nThis will set ${machine.name} to BREAKDOWN status and create a critical alert and work order.\n\nProceed?`)) {
                    sendCommand('EMERGENCY_STOP', 'EMERGENCY STOP');
                  }
                }}
                disabled={cmdLoading !== null || currentStatus === 'BREAKDOWN'}
                className="w-full px-3 py-2.5 text-center text-xs font-bold border border-red-500/60 rounded-lg hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {cmdLoading === 'EMERGENCY_STOP' && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
                [!!] EMERGENCY STOP
                {currentStatus === 'BREAKDOWN' && <span className="text-[9px] opacity-50">(triggered)</span>}
              </button>
            </div>

            {/* Command log */}
            {cmdLog.length > 0 && (
              <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-3">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Command Log</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {cmdLog.map((l, i) => (
                    <p key={i} className={`text-[10px] font-mono ${l.ok ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                      <span className="opacity-50">[{l.ts}]</span> {l.text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <a href="/admin/machines" className="block w-full text-center px-3 py-2 text-xs font-semibold text-[#635bff] border border-[#635bff]/30 rounded-lg hover:bg-[#635bff]/10 transition-colors">
              Open Machine Record &rarr;
            </a>

            <p className="text-[9px] text-center text-[var(--text-ultralow)]">
              Status changes sync to both dashboards in real time
            </p>
          </div>
          </div>{/* end inner 3-col grid */}
        </div>{/* end p-5 space-y-5 */}
      </div>
    </div>
  );
}

// ── Machine Card ───────────────────────────────────────────────────────────────
function MachineCard({ machine, onSelect }: { machine: HMIMachine; onSelect: () => void }) {
  const { isDark } = useTheme();
  const svgBase    = isDark ? '#1e2d4a' : '#dde8f5';
  const svgSurface = isDark ? '#162035' : '#c8daf0';
  const svgPanel   = isDark ? '#0d1426' : '#b0c8e8';
  const svgStroke  = isDark ? '#2d3f5e' : '#94b8d8';
  const cfg = STATUS_CONFIG[machine.status] || STATUS_CONFIG.OPERATIONAL;
  const isBreakdown = machine.status === 'BREAKDOWN';
  const isMaintenance = machine.status === 'MAINTENANCE';
  const isOp = machine.status === 'OPERATIONAL';
  const [pulse, setPulse] = useState(false);
  const [temp, setTemp] = useState(isBreakdown ? 102 : 72);
  const [load, setLoad] = useState(isOp ? 60 : 0);
  const [rpmCard, setRpmCard] = useState(isOp ? 1800 : 0);
  const [pressureCard, setPressureCard] = useState(isOp ? 65 : 0);

  useEffect(() => {
    if (isBreakdown) {
      const iv = setInterval(() => setPulse(p => !p), 700);
      return () => clearInterval(iv);
    }
  }, [isBreakdown]);

  useEffect(() => {
    if (!isOp) return;
    const iv = setInterval(() => {
      setTemp(t => Math.max(55, Math.min(98, t + (Math.random() - 0.5) * 2)));
      setLoad(l => Math.max(20, Math.min(99, l + (Math.random() - 0.5) * 5)));
      setRpmCard(r => Math.max(800, Math.min(3200, r + (Math.random() - 0.5) * 80)));
      setPressureCard(p => Math.max(40, Math.min(100, p + (Math.random() - 0.5) * 3)));
    }, 1500);
    return () => clearInterval(iv);
  }, [isOp]);

  const orgName = machine.organization?.name || 'Unknown';

  return (
    <div
      onClick={onSelect}
      className={`relative border rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg overflow-hidden ${cfg.border} ${cfg.bg} ${isBreakdown ? `shadow-md shadow-red-500/20 ${pulse ? 'border-red-400' : 'border-red-500/60'}` : ''}`}
    >
      <div className={`h-1 w-full ${isOp ? 'bg-emerald-500' : isBreakdown ? 'bg-red-500' : isMaintenance ? 'bg-yellow-500' : 'bg-gray-500'}`}
        style={{ boxShadow: isOp ? '0 0 8px #10b981' : isBreakdown ? '0 0 8px #ef4444' : '' }}
      />

      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${isBreakdown ? 'animate-ping' : isMaintenance ? 'animate-pulse' : ''}`}/>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide truncate">{getCategoryLabel(machine.category, machine.name)}</span>
          </div>
          {machine._count.alerts > 0 && (
            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
              {machine._count.alerts}!
            </span>
          )}
        </div>

        <div style={{ background: '#0a1628', borderRadius: 8, overflow: 'hidden' }} className="mb-2"><MachineImage category={machine.category} machineName={machine.name} status={machine.status} className="w-full h-40" liveData={isOp ? { temp, load, rpm: rpmCard, pressure: pressureCard } : undefined} compact={true} /></div>

        <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold text-xs mb-0.5 truncate">{machine.name}</h3>
        <p className="text-[var(--text-muted)] text-[10px] mb-1.5 truncate">{machine.location || '—'}</p>

        {/* Org badge on card */}
        <div className="mb-1.5">
          <OrgBadge name={orgName} size="xs" />
        </div>

        <div className={`text-[9px] font-bold ${cfg.color} mb-2 uppercase tracking-wider`}>{cfg.label}</div>

        {isOp && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-[var(--text-muted)]">TEMP</span>
              <span className={`text-[9px] font-mono font-bold ${temp > 90 ? 'text-red-400' : temp > 78 ? 'text-yellow-400' : 'text-emerald-400'}`}>{temp.toFixed(0)}°C</span>
            </div>
            <div className="w-full bg-[var(--bar-bg)] rounded-full h-1">
              <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${load}%`, backgroundColor: load > 90 ? '#ef4444' : load > 70 ? '#fbbf24' : '#635bff' }}/>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-[var(--text-muted)]">LOAD</span>
              <span className="text-[var(--text-secondary)] font-mono">{load.toFixed(0)}%</span>
            </div>
          </div>
        )}
        {isBreakdown && (
          <div className="text-center py-1">
            <span className="text-red-400 text-[9px] font-bold animate-pulse">102°C FAULT DETECTED</span>
          </div>
        )}
        {isMaintenance && (
          <div className="text-center py-1">
            <span className="text-yellow-400 text-[9px] font-medium">Service in progress</span>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-[var(--card-border-b)] flex justify-between items-center">
          <span className="text-[9px] text-[var(--text-ultralow)]">{machine.totalHours.toLocaleString()}h</span>
          <span className="text-[9px] text-[var(--text-ultralow)]">WO:{machine._count.workOrders}</span>
        </div>
      </div>
    </div>
  );
}

// ── Org Overview Panel ─────────────────────────────────────────────────────────
function OrgOverviewPanel({ machines }: { machines: HMIMachine[] }) {
  // Group machines by org
  const groups = machines.reduce((acc, m) => {
    const name = m.organization?.name || 'Unknown';
    if (!acc[name]) acc[name] = { name, total: 0, operational: 0, maintenance: 0, breakdown: 0 };
    acc[name].total++;
    if (m.status === 'OPERATIONAL') acc[name].operational++;
    else if (m.status === 'MAINTENANCE') acc[name].maintenance++;
    else if (m.status === 'BREAKDOWN') acc[name].breakdown++;
    return acc;
  }, {} as Record<string, { name: string; total: number; operational: number; maintenance: number; breakdown: number }>);

  const sorted = Object.values(groups).sort((a, b) => b.total - a.total);

  if (sorted.length === 0) return null;

  return (
    <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-3">
        Organizations ({sorted.length})
      </h3>
      <div className="space-y-2.5">
        {sorted.map(g => {
          const c = getOrgColour(g.name);
          const availPct = g.total > 0 ? Math.round((g.operational / g.total) * 100) : 0;
          return (
            <div key={g.name} className={`rounded-lg border p-2.5 ${c.bg} ${c.border}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold truncate ${c.text}`}>{g.name}</span>
                <span className="text-[9px] text-[var(--text-muted)] ml-1 flex-shrink-0">{g.total} machine{g.total !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {g.operational > 0 && (
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-medium">
                    {g.operational} Op
                  </span>
                )}
                {g.maintenance > 0 && (
                  <span className="text-[9px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-1.5 py-0.5 rounded font-medium">
                    {g.maintenance} Maint
                  </span>
                )}
                {g.breakdown > 0 && (
                  <span className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded font-medium animate-pulse">
                    {g.breakdown} Down
                  </span>
                )}
              </div>
              {/* Availability mini-bar */}
              <div className="mt-2">
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-[var(--text-muted)]">Availability</span>
                  <span className={availPct >= 80 ? 'text-emerald-400' : availPct >= 50 ? 'text-yellow-400' : 'text-red-400'}>{availPct}%</span>
                </div>
                <div className="w-full bg-[var(--bar-bg)] rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-700"
                    style={{
                      width: `${availPct}%`,
                      backgroundColor: availPct >= 80 ? '#34d399' : availPct >= 50 ? '#fbbf24' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main HMI Page ──────────────────────────────────────────────────────────────
function HMIPageInner() {
  const [machines, setMachines] = useState<HMIMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HMIMachine | null>(null);
  const [simRunning, setSimRunning] = useState<string | null>(null);
  const [simLog, setSimLog] = useState<{ time: string; text: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterOrg, setFilterOrg] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMachines = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/hmi-data');
      if (res.ok) {
        const data = await res.json();
        setMachines(data.machines || []);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error('HMI fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMachines(); }, [fetchMachines]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchMachines, 5000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchMachines]);

  // When operator changes machine status — update local state immediately + schedule refresh
  const handleStatusChange = useCallback((machineId: string, newStatus: string) => {
    setMachines(prev => prev.map(m =>
      m.id === machineId ? { ...m, status: newStatus } : m
    ));
    setSelected(prev => prev && prev.id === machineId ? { ...prev, status: newStatus } : prev);
    setTimeout(() => fetchMachines(), 1500);
  }, [fetchMachines]);

  const runSim = async (scenario: string) => {
    setSimRunning(scenario);
    try {
      const res = await fetch('/api/admin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: SECRET, scenario }),
      });
      const data = await res.json();
      const results: string[] = data.results || [data.error || 'Unknown'];
      results.forEach(r => {
        setSimLog(prev => [{ time: new Date().toLocaleTimeString(), text: r, type: data.error ? 'error' : 'success' }, ...prev.slice(0, 19)]);
      });
      await fetchMachines();
    } catch (e) {
      setSimLog(prev => [{ time: new Date().toLocaleTimeString(), text: `Error: ${e}`, type: 'error' }, ...prev]);
    }
    setSimRunning(null);
  };

  // Derive unique org names from machines list
  const orgNames = Array.from(new Set(machines.map(m => m.organization?.name || 'Unknown'))).sort();

  // Apply both status and org filters
  const filtered = machines
    .filter(m => filterStatus === 'ALL' || m.status === filterStatus)
    .filter(m => filterOrg === 'ALL' || (m.organization?.name || 'Unknown') === filterOrg);

  const operational = machines.filter(m => m.status === 'OPERATIONAL').length;
  const breakdown = machines.filter(m => m.status === 'BREAKDOWN').length;
  const maintenance = machines.filter(m => m.status === 'MAINTENANCE').length;
  const oee = machines.length > 0 ? Math.round((operational / machines.length) * 100) : 0;

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"/>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>HMI Plant Floor Monitor</h1>
          </div>
          <p className="text-[var(--text-secondary)] mt-0.5 text-xs">Live equipment visualization — auto-refresh 5s · Last: {lastRefresh ? lastRefresh.toLocaleTimeString() : '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(a => !a)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${autoRefresh ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button onClick={() => fetchMachines(true)} disabled={refreshing} className="px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-50 flex items-center gap-1.5 transition-opacity">
            {refreshing ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <>&#x27f3;</>} Refresh
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Equipment', value: machines.length, color: 'text-[var(--text-primary)]' },
          { label: 'Operational', value: operational, color: 'text-emerald-400' },
          { label: 'Maintenance', value: maintenance, color: 'text-yellow-400' },
          { label: 'Breakdown', value: breakdown, color: 'text-red-400' },
          { label: 'Availability', value: `${oee}%`, color: oee >= 90 ? 'text-emerald-400' : oee >= 70 ? 'text-yellow-400' : 'text-red-400' },
        ].map(k => (
          <div key={k.label} className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[var(--text-secondary)] text-[10px] mt-0.5 uppercase tracking-wide">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Status Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'OPERATIONAL', 'MAINTENANCE', 'BREAKDOWN', 'RETIRED'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${filterStatus === s ? (s === 'OPERATIONAL' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : s === 'BREAKDOWN' ? 'bg-red-500/20 border-red-500/40 text-red-400' : s === 'MAINTENANCE' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-[#635bff]/20 border-[#635bff]/40 text-[#635bff]') : 'bg-transparent border-[#2d3f5e] text-[var(--text-muted)] hover:border-[#635bff]/40 hover:text-[var(--text-secondary)]'}`}>
            {s === 'ALL' ? `All (${machines.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${machines.filter(m => m.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Org Filter pills — only shown when there are multiple orgs */}
      {orgNames.length > 1 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold mr-1">Org:</span>
          <button
            onClick={() => setFilterOrg('ALL')}
            className={`text-xs px-3 py-1 rounded-full font-semibold border transition-colors ${filterOrg === 'ALL' ? 'bg-[#635bff]/20 border-[#635bff]/40 text-[#635bff]' : 'bg-transparent border-[#2d3f5e] text-[var(--text-muted)] hover:border-[#635bff]/40 hover:text-[var(--text-secondary)]'}`}
          >
            All orgs ({machines.length})
          </button>
          {orgNames.map(name => {
            const c = getOrgColour(name);
            const count = machines.filter(m => (m.organization?.name || 'Unknown') === name).length;
            const isActive = filterOrg === name;
            return (
              <button
                key={name}
                onClick={() => setFilterOrg(name)}
                className={`text-xs px-3 py-1 rounded-full font-semibold border transition-colors ${isActive ? `${c.bg} ${c.border} ${c.text}` : 'bg-transparent border-[#2d3f5e] text-[var(--text-muted)] hover:border-[#635bff]/40 hover:text-[var(--text-secondary)]'}`}
              >
                {name} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Machine Grid */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Equipment Status Grid — Click any machine to open HMI panel
            {filterOrg !== 'ALL' && <span className="ml-2 normal-case font-normal">· Filtered: {filterOrg}</span>}
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl h-44 animate-pulse"/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-10 text-center">
              <p className="text-[var(--text-secondary)] text-sm">No machines found for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(m => <MachineCard key={m.id} machine={m} onSelect={() => setSelected(m)}/>)}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Org Overview — shown when multiple orgs exist */}
          {orgNames.length > 1 && <OrgOverviewPanel machines={machines} />}

          {/* Simulation Controls */}
          <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-3">Simulation Controls</h3>
            <div className="space-y-2">
              {[
                { id: 'breakdown', label: 'Trigger Breakdown', color: 'border-red-500/40 hover:bg-red-500/10 text-red-300' },
                { id: 'maintenance_due', label: 'Maintenance Overdue', color: 'border-yellow-500/40 hover:bg-yellow-500/10 text-yellow-300' },
                { id: 'low_parts', label: 'Low Parts Alert', color: 'border-orange-500/40 hover:bg-orange-500/10 text-orange-300' },
                { id: 'work_order_progress', label: 'Start Work Orders', color: 'border-blue-500/40 hover:bg-blue-500/10 text-blue-300' },
                { id: 'complete_work_order', label: 'Complete Work Order', color: 'border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300' },
                { id: 'random', label: 'Random Events', color: 'border-purple-500/40 hover:bg-purple-500/10 text-purple-300' },
                { id: 'reset', label: 'Reset Everything', color: 'border-gray-500/40 hover:bg-gray-500/10 text-gray-300' },
              ].map(btn => (
                <button key={btn.id} onClick={() => runSim(btn.id)} disabled={!!simRunning}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold border rounded-lg transition-all disabled:opacity-40 ${btn.color}`}>
                  {simRunning === btn.id ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      Running...
                    </span>
                  ) : btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Log */}
          <div className="[background:var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest">Event Log</h3>
              {simLog.length > 0 && <button onClick={() => setSimLog([])} className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Clear</button>}
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {simLog.length === 0 ? <p className="text-[var(--text-secondary)] text-xs italic">No events. Run a simulation.</p>
                : simLog.map((log, i) => (
                  <div key={i} className={`text-xs rounded px-2 py-1 ${log.type === 'error' ? 'bg-red-500/10 text-red-400' : log.type === 'info' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <span className="opacity-50 mr-1">{log.time}</span>{log.text}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Machine Detail Modal */}
      {selected && (
        <MachineDetailPanel
          machine={selected}
          onClose={() => setSelected(null)}
          onSim={runSim}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default function AdminHMIPage() {
  return <HMIPageInner />;
}