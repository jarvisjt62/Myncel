'use client';

import '../../components/theme.css';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ThemeProvider, useTheme } from '../../components/ThemeProvider';

// ── Category labels + smart inference ───────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  CNC_MILL: 'CNC Mill', CNC_LATHE: 'CNC Lathe', PRESS: 'Press',
  HYDRAULIC: 'Hydraulic Press', COMPRESSOR: 'Compressor', CONVEYOR: 'Conveyor',
  WELDER: 'Welder', INJECTION_MOLD: 'Injection Mold', ASSEMBLY: 'Assembly', OTHER: 'Machine',
};

function getCategoryLabel(category: string, machineName: string): string {
  if (category !== 'OTHER') return CATEGORY_LABELS[category] || category.replace(/_/g, ' ');
  const name = machineName.toLowerCase();
  if (name.includes('lathe'))   return 'CNC Lathe';
  if (name.includes('mill') || name.includes('milling')) return 'CNC Mill';
  if (name.includes('press brake')) return 'Press Brake';
  if (name.includes('press'))   return 'Hydraulic Press';
  if (name.includes('hydraulic')) return 'Hydraulic Unit';
  if (name.includes('compressor')) return 'Compressor';
  if (name.includes('conveyor')) return 'Conveyor';
  if (name.includes('weld'))    return 'Welder';
  if (name.includes('inject') || name.includes('mold')) return 'Injection Mold';
  if (name.includes('robot'))   return 'Robot';
  if (name.includes('laser'))   return 'Laser Cutter';
  if (name.includes('drill'))   return 'Drill Press';
  return 'Industrial Machine';
}

function getMachineImageUrl(category: string, machineName: string): string {
  const name = machineName.toLowerCase();
  // Specific name matches first
  if (name.includes('press brake') || name.includes('pressbrake'))
    return '/machines/press-brake.png?v=2';
  if (name.includes('injection mold') || name.includes('injection molding') || name.includes('inject'))
    return '/machines/injection-mold.png?v=2';
  if (name.includes('robot') || name.includes('assembly'))
    return '/machines/assembly.png?v=2';
  if (name.includes('weld'))
    return '/machines/welder.png?v=2';
  if (name.includes('lathe'))
    return '/machines/cnc-lathe.png?v=2';
  if (name.includes('mill') || name.includes('milling'))
    return '/machines/cnc-mill.png?v=2';
  if (name.includes('press') || name.includes('hydraulic'))
    return '/machines/press-brake.png?v=2';
  if (name.includes('compressor'))
    return '/machines/compressor.png?v=2';
  if (name.includes('conveyor'))
    return '/machines/conveyor.png?v=2';

  // Category fallbacks
  switch (category) {
    case 'CNC_MILL':
      return '/machines/cnc-mill.png?v=2';
    case 'CNC_LATHE':
      return '/machines/cnc-lathe.png?v=2';
    case 'PRESS':
    case 'HYDRAULIC':
      return '/machines/press-brake.png?v=2';
    case 'COMPRESSOR':
      return '/machines/compressor.png?v=2';
    case 'CONVEYOR':
      return '/machines/conveyor.png?v=2';
    case 'WELDER':
      return '/machines/welder.png?v=2';
    case 'INJECTION_MOLD':
      return '/machines/injection-mold.png?v=2';
    case 'ASSEMBLY':
      return '/machines/assembly.png?v=2';
    default:
      return '/machines/other.png?v=2';
  }
}

function MachineImage({ category, machineName, status, className = '', liveData }: {
  category: string; machineName: string; status: string; className?: string;
  liveData?: { temp: number; load: number; rpm: number; pressure: number };
}) {
  const imgUrl = getMachineImageUrl(category, machineName);
  const isBreakdown = status === 'BREAKDOWN';
  const isMaintenance = status === 'MAINTENANCE';
  const isOp = status === 'OPERATIONAL';
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`} style={{ background: '#0a1628' }}>
      <img src={imgUrl} alt={machineName} className="w-full h-full object-cover"
        style={{
          filter: isBreakdown ? 'grayscale(0.4) brightness(0.7) sepia(0.3) saturate(2) hue-rotate(-10deg)'
            : isMaintenance ? 'grayscale(0.2) brightness(0.85) sepia(0.2)'
            : 'brightness(1.0) saturate(1.15)',
          transition: 'filter 0.5s ease',
        }}
        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80'; }}
      />

      {/* Live sensor HUD overlay */}
      {liveData && isOp && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1.5 left-1.5 bg-black/70 border border-cyan-500/40 rounded px-1.5 py-0.5 flex items-center gap-1">
            <span style={{ color: liveData.temp > 90 ? '#f87171' : liveData.temp > 78 ? '#fbbf24' : '#34d399', fontSize: 9, fontFamily: 'monospace', fontWeight: 700 }}>
              {liveData.temp.toFixed(0)}°C
            </span>
            <span style={{ color: '#67e8f9', fontSize: 8, opacity: 0.7 }}>TEMP</span>
          </div>
          <div className="absolute top-1.5 right-1.5 bg-black/70 border border-cyan-500/40 rounded px-1.5 py-0.5 flex items-center gap-1">
            <span style={{ color: '#93c5fd', fontSize: 9, fontFamily: 'monospace', fontWeight: 700 }}>
              {liveData.rpm.toFixed(0)}
            </span>
            <span style={{ color: '#67e8f9', fontSize: 8, opacity: 0.7 }}>RPM</span>
          </div>
          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/70 border border-cyan-500/30 rounded px-1.5 py-1">
            <div className="flex justify-between items-center mb-0.5">
              <span style={{ color: '#67e8f9', fontSize: 8, opacity: 0.8 }}>LOAD</span>
              <span style={{ color: liveData.load > 90 ? '#f87171' : '#a78bfa', fontSize: 9, fontFamily: 'monospace', fontWeight: 700 }}>{liveData.load.toFixed(0)}%</span>
              <span style={{ color: '#67e8f9', fontSize: 8, opacity: 0.8 }}>PSI {liveData.pressure.toFixed(0)}</span>
            </div>
            <div style={{ width: '100%', height: 3, backgroundColor: 'rgba(100,116,139,0.4)', borderRadius: 2 }}>
              <div style={{ width: `${liveData.load}%`, height: 3, borderRadius: 2, backgroundColor: liveData.load > 90 ? '#ef4444' : liveData.load > 70 ? '#fbbf24' : '#635bff', boxShadow: `0 0 4px ${liveData.load > 90 ? '#ef4444' : '#635bff'}`, transition: 'width 0.7s ease' }} />
            </div>
          </div>
        </div>
      )}

      {isBreakdown && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/40">
          <span className="text-red-300 text-[10px] font-bold bg-red-900/80 px-2 py-1 rounded animate-pulse">⚠ FAULT</span>
        </div>
      )}
      {isMaintenance && (
        <div className="absolute inset-0 flex items-center justify-center bg-yellow-900/30">
          <span className="text-yellow-300 text-[10px] font-bold bg-yellow-900/70 px-2 py-1 rounded">🔧 MAINT</span>
        </div>
      )}
    </div>
  );
}


interface MachineOrg { id: string; name: string; }
interface Alert { id: string; title: string; severity: string; type: string; }
interface Machine {
  id: string; name: string; status: string; criticality: string; category: string;
  location: string | null; totalHours: number; model: string | null; manufacturer: string | null;
  organizationId: string;
  organization: MachineOrg | null;
  _count: { workOrders: number; alerts: number; maintenanceTasks: number };
  alerts: Alert[];
}

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; dot: string; label: string; barColor: string }> = {
  OPERATIONAL: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', dot: 'bg-emerald-400', label: 'OPERATIONAL', barColor: '#10b981' },
  MAINTENANCE:  { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/40',  dot: 'bg-yellow-400',  label: 'MAINTENANCE',  barColor: '#f59e0b' },
  BREAKDOWN:    { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/50',     dot: 'bg-red-400',     label: 'BREAKDOWN',    barColor: '#ef4444' },
  RETIRED:      { color: 'text-gray-500',    bg: 'bg-gray-500/5',     border: 'border-gray-500/20',    dot: 'bg-gray-500',    label: 'RETIRED',      barColor: '#6b7280' },
};

// Stable colour per org name
const ORG_COLOURS = [
  { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  { text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30'   },
  { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { text: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/30'   },
  { text: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/30'   },
  { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30'  },
  { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  { text: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30'   },
];

function getOrgColour(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return ORG_COLOURS[Math.abs(hash) % ORG_COLOURS.length];
}

function OrgBadge({ name, size = 'sm' }: { name: string; size?: 'xs' | 'sm' }) {
  const c = getOrgColour(name);
  const cls = size === 'xs'
    ? `text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${c.text} ${c.bg} ${c.border}`
    : `text-[10px] px-2 py-0.5 rounded-lg font-semibold border ${c.text} ${c.bg} ${c.border}`;
  return <span className={cls}>{name}</span>;
}

// ── Toast Notification ─────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error' | 'info'; onDone: () => void }) {
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

// ── Radial Gauge ──────────────────────────────────────────────────────────────
function Gauge({ value, max, label, unit, color, size = 72 }: {
  value: number; max: number; label: string; unit: string; color: string; size?: number;
}) {
  const pct = Math.min(1, Math.max(0, value / max));
  const r = (size - 14) / 2;
  const cx = size / 2; const cy = size / 2 + 5;
  const start = -210; const sweep = 240;
  const angle = start + pct * sweep;
  const toR = (d: number) => (d * Math.PI) / 180;
  const ax = (d: number) => cx + r * Math.cos(toR(d));
  const ay = (d: number) => cy + r * Math.sin(toR(d));
  const la = pct * sweep > 180 ? 1 : 0;
  const track = `M ${ax(start)} ${ay(start)} A ${r} ${r} 0 1 1 ${ax(start + sweep)} ${ay(start + sweep)}`;
  const fill = pct > 0 ? `M ${ax(start)} ${ay(start)} A ${r} ${r} 0 ${la} 1 ${ax(angle)} ${ay(angle)}` : '';
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path d={track} fill="none" stroke="var(--gauge-track)" strokeWidth="5" strokeLinecap="round"/>
        {fill && <path d={fill} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${color})` }}/>}
        <text x={cx} y={cy + 3} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="700" fontFamily="monospace">{value.toFixed(0)}{unit}</text>
      </svg>
      <span className="text-[8px] uppercase tracking-widest -mt-1.5" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

// ── SVG Machine Visual ─────────────────────────────────────────────────────────
function MachineVisual({ category, status, size = 'md' }: { category: string; status: string; size?: 'sm' | 'md' | 'lg' }) {
  const { isDark } = useTheme();
  const isB = status === 'BREAKDOWN';
  const isM = status === 'MAINTENANCE';
  const isOp = status === 'OPERATIONAL';
  const mc = isB ? '#ef4444' : isM ? '#f59e0b' : '#635bff';
  const gl = isB ? '#ef444450' : isM ? '#f59e0b50' : '#635bff40';
  const svgClass = size === 'lg' ? 'w-full h-40' : size === 'sm' ? 'w-full h-14' : 'w-full h-24';
  const svgBase    = isDark ? '#1e2d4a' : '#dde8f5';
  const svgSurface = isDark ? '#162035' : '#c8daf0';
  const svgPanel   = isDark ? '#0d1426' : '#b0c8e8';
  const svgDark    = isDark ? '#1a2840' : '#ccdcee';
  const svgStroke  = isDark ? '#2d3f5e' : '#94b8d8';

  if (category === 'CNC_MILL' || category === 'CNC_LATHE') return (
    <svg viewBox="0 0 100 80" className={svgClass}>
      <rect x="10" y="55" width="80" height="16" rx="2" fill={svgBase} stroke={svgStroke} strokeWidth="1"/>
      <rect x="20" y="20" width="18" height="36" rx="2" fill={svgSurface} stroke={mc} strokeWidth="0.8"/>
      <rect x="15" y="48" width="70" height="7" rx="2" fill={svgDark} stroke={svgStroke} strokeWidth="0.8"/>
      <rect x="28" y="14" width="28" height="14" rx="2" fill={svgBase} stroke={mc} strokeWidth="1.2" style={{ filter: isOp ? `drop-shadow(0 0 4px ${gl})` : undefined }}/>
      <rect x="38" y="28" width="8" height="18" rx="1" fill={mc} opacity="0.8"/>
      <rect x="68" y="22" width="14" height="22" rx="2" fill={svgPanel} stroke={svgStroke} strokeWidth="0.8"/>
      <circle cx="75" cy="28" r="2" fill={isOp ? '#34d399' : isB ? '#ef4444' : '#f59e0b'}/>
      {isB && <><line x1="40" y1="16" x2="50" y2="26" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/><line x1="50" y1="16" x2="40" y2="26" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/></>}
    </svg>
  );

  if (category === 'CONVEYOR') return (
    <svg viewBox="0 0 100 80" className={svgClass}>
      <rect x="8" y="36" width="84" height="10" rx="2" fill={svgDark} stroke={mc} strokeWidth="1"/>
      {[12,28,44,60,76,88].map((x,i) => <circle key={i} cx={x} cy="41" r="5" fill={svgSurface} stroke={mc} strokeWidth="0.8"/>)}
      <rect x="78" y="20" width="16" height="14" rx="2" fill={svgPanel} stroke={mc} strokeWidth="1" style={{ filter: isOp ? `drop-shadow(0 0 3px ${gl})` : undefined }}/>
      <rect x="15" y="46" width="5" height="18" rx="1" fill={svgSurface} stroke={svgStroke} strokeWidth="0.8"/>
      <rect x="80" y="46" width="5" height="18" rx="1" fill={svgSurface} stroke={svgStroke} strokeWidth="0.8"/>
      {isOp && [20,45,65].map((x,i) => <rect key={i} x={x} y="28" width="10" height="8" rx="1" fill={mc} opacity="0.5"/>)}
      <circle cx="10" cy="41" r="3" fill={isOp ? '#34d399' : isB ? '#ef4444' : '#f59e0b'}/>
    </svg>
  );

  if (category === 'PRESS' || category === 'HYDRAULIC') return (
    <svg viewBox="0 0 100 80" className={svgClass}>
      <rect x="15" y="10" width="12" height="60" rx="2" fill={svgSurface} stroke={mc} strokeWidth="0.8"/>
      <rect x="73" y="10" width="12" height="60" rx="2" fill={svgSurface} stroke={mc} strokeWidth="0.8"/>
      <rect x="15" y="10" width="70" height="10" rx="2" fill={svgBase} stroke={mc} strokeWidth="1"/>
      <rect x="32" y={isOp ? "24" : "38"} width="36" height="16" rx="2" fill={mc} opacity="0.8" style={{ filter: `drop-shadow(0 0 5px ${gl})` }}/>
      <rect x="20" y="65" width="60" height="7" rx="2" fill={svgBase} stroke={svgStroke} strokeWidth="0.8"/>
      <circle cx="84" cy="16" r="3" fill={isOp ? '#34d399' : isB ? '#ef4444' : '#f59e0b'}/>
    </svg>
  );

  if (category === 'WELDER') return (
    <svg viewBox="0 0 100 80" className={svgClass}>
      <rect x="20" y="20" width="35" height="45" rx="3" fill={svgSurface} stroke={mc} strokeWidth="1"/>
      <rect x="22" y="22" width="31" height="20" rx="2" fill={svgPanel} stroke={svgStroke} strokeWidth="0.5"/>
      <circle cx="70" cy="35" r="15" fill={svgBase} stroke={svgStroke} strokeWidth="1"/>
      <circle cx="70" cy="35" r="8" fill={svgSurface} stroke={mc} strokeWidth="0.8"/>
      <line x1="22" y1="55" x2="8" y2="68" stroke={mc} strokeWidth="2.5" strokeLinecap="round"/>
      {isOp && <circle cx="8" cy="68" r="3" fill="#fbbf24" opacity="0.9" style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}/>}
      <circle cx="55" cy="28" r="3" fill={isOp ? '#34d399' : isB ? '#ef4444' : '#f59e0b'}/>
    </svg>
  );

  if (category === 'COMPRESSOR') return (
    <svg viewBox="0 0 100 80" className={svgClass}>
      <ellipse cx="55" cy="50" rx="30" ry="18" fill={svgSurface} stroke={mc} strokeWidth="1.2"/>
      <rect x="10" y="35" width="22" height="22" rx="3" fill={svgBase} stroke={mc} strokeWidth="1"/>
      <circle cx="21" cy="46" r="7" fill={svgSurface} stroke={mc} strokeWidth="1"/>
      <circle cx="21" cy="46" r="3" fill={mc} opacity="0.6"/>
      <circle cx="85" cy="42" r="3" fill={isOp ? '#34d399' : isB ? '#ef4444' : '#f59e0b'}/>
    </svg>
  );

  if (category === 'INJECTION_MOLD') return (
    <svg viewBox="0 0 100 80" className={svgClass}>
      <rect x="10" y="40" width="38" height="28" rx="2" fill={svgSurface} stroke={mc} strokeWidth="1"/>
      <rect x="52" y="40" width="38" height="28" rx="2" fill={svgBase} stroke={mc} strokeWidth="1"/>
      <rect x="10" y="38" width="80" height="4" rx="1" fill={mc} opacity="0.6"/>
      <rect x="35" y="10" width="30" height="30" rx="2" fill={svgPanel} stroke={mc} strokeWidth="1"/>
      <circle cx="82" cy="46" r="3" fill={isOp ? '#34d399' : isB ? '#ef4444' : '#f59e0b'}/>
    </svg>
  );

  // Default
  return (
    <svg viewBox="0 0 100 80" className={svgClass}>
      <rect x="15" y="15" width="70" height="50" rx="4" fill={svgSurface} stroke={mc} strokeWidth="1.2" style={{ filter: isOp ? `drop-shadow(0 0 5px ${gl})` : undefined }}/>
      <rect x="22" y="22" width="56" height="25" rx="2" fill={svgPanel} stroke={svgStroke} strokeWidth="0.5"/>
      <circle cx="35" cy="52" r="5" fill="none" stroke={mc} strokeWidth="1.2"/>
      <circle cx="65" cy="52" r="5" fill="none" stroke={mc} strokeWidth="1.2"/>
      <circle cx="85" cy="20" r="3.5" fill={isOp ? '#34d399' : isB ? '#ef4444' : '#f59e0b'} style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}/>
      {isB && <><line x1="38" y1="38" x2="46" y2="46" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><line x1="46" y1="38" x2="38" y2="46" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></>}
    </svg>
  );
}

// ── Machine Card ───────────────────────────────────────────────────────────────
function MachineCard({ machine, onClick }: { machine: Machine; onClick: () => void }) {
  const cfg = STATUS_CFG[machine.status] || STATUS_CFG.OPERATIONAL;
  const isOp = machine.status === 'OPERATIONAL';
  const isB  = machine.status === 'BREAKDOWN';
  const isM  = machine.status === 'MAINTENANCE';
  const [pulse, setPulse] = useState(false);
  const [temp, setTemp]         = useState(isB ? 102 : 72);
  const [load, setLoad]         = useState(isOp ? 60 : 0);
  const [rpmCard, setRpmCard]   = useState(isOp ? 1800 : 0);
  const [pressCard, setPressCard] = useState(isOp ? 65 : 0);

  useEffect(() => {
    if (!isB) return;
    const iv = setInterval(() => setPulse(p => !p), 700);
    return () => clearInterval(iv);
  }, [isB]);

  useEffect(() => {
    if (!isOp) return;
    const iv = setInterval(() => {
      setTemp(t => Math.max(55, Math.min(98, t + (Math.random() - 0.5) * 2)));
      setLoad(l => Math.max(20, Math.min(99, l + (Math.random() - 0.5) * 5)));
      setRpmCard(r => Math.max(800, Math.min(3200, r + (Math.random() - 0.5) * 80)));
      setPressCard(p => Math.max(40, Math.min(100, p + (Math.random() - 0.5) * 3)));
    }, 1500);
    return () => clearInterval(iv);
  }, [isOp]);

  const orgName = machine.organization?.name || 'Unknown';

  return (
    <div
      onClick={onClick}
      className={`relative border rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg overflow-hidden ${cfg.border} ${cfg.bg} ${isB ? `shadow-md shadow-red-500/20 ${pulse ? 'border-red-400' : 'border-red-500/60'}` : ''}`}
    >
      {/* Status top bar */}
      <div
        className={`h-1 w-full ${isOp ? 'bg-emerald-500' : isB ? 'bg-red-500' : isM ? 'bg-yellow-500' : 'bg-gray-500'}`}
        style={{ boxShadow: isOp ? '0 0 6px #10b981' : isB ? '0 0 6px #ef4444' : '' }}
      />

      <div className="p-2.5">
        {/* Category + alert badge */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${isB ? 'animate-ping' : isM ? 'animate-pulse' : ''}`}/>
            <span className="text-[9px] uppercase tracking-wide truncate" style={{ color: 'var(--text-muted)' }}>{getCategoryLabel(machine.category, machine.name)}</span>
          </div>
          {machine._count.alerts > 0 && (
            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
              {machine._count.alerts}!
            </span>
          )}
        </div>

        {/* Machine SCADA Image */}
        <div className="w-full h-40 mb-1.5 rounded-lg overflow-hidden">
          <MachineImage category={machine.category} machineName={machine.name} status={machine.status} className="w-full h-full" liveData={isOp ? { temp, load, rpm: rpmCard, pressure: pressCard } : undefined} />
        </div>

        {/* Name */}
        <h3 className="font-semibold text-xs mb-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{machine.name}</h3>

        {/* Location */}
        <p className="text-[9px] mb-1 truncate" style={{ color: 'var(--text-muted)' }}>{machine.location || '—'}</p>

        {/* Org badge */}
        <div className="mb-1.5">
          <OrgBadge name={orgName} size="xs" />
        </div>

        {/* Status label */}
        <div className={`text-[9px] font-bold ${cfg.color} mb-1.5 uppercase tracking-wider`}>{cfg.label}</div>

        {/* Live sensor mini-bars */}
        {isOp && (
          <div className="space-y-0.5">
            <div className="flex justify-between items-center">
              <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>TEMP</span>
              <span className={`text-[8px] font-mono font-bold ${temp > 90 ? 'text-red-400' : temp > 78 ? 'text-yellow-400' : 'text-emerald-400'}`}>{temp.toFixed(0)}°C</span>
            </div>
            <div className="w-full rounded-full h-1" style={{ backgroundColor: 'var(--bar-bg)' }}>
              <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${load}%`, backgroundColor: load > 90 ? '#ef4444' : load > 70 ? '#fbbf24' : '#635bff' }}/>
            </div>
            <div className="flex justify-between text-[8px]">
              <span style={{ color: 'var(--text-muted)' }}>LOAD</span>
              <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{load.toFixed(0)}%</span>
            </div>
          </div>
        )}
        {isB && <p className="text-red-400 text-[9px] font-bold text-center animate-pulse mt-1">⚠ FAULT</p>}
        {isM && <p className="text-yellow-400 text-[9px] text-center mt-1">🔧 Servicing</p>}

        <div className="mt-2 pt-1.5 flex justify-between" style={{ borderTop: '1px solid var(--card-border-b)' }}>
          <span className="text-[8px]" style={{ color: 'var(--text-ultralow)' }}>{machine.totalHours.toLocaleString()}h</span>
          <span className="text-[8px]" style={{ color: 'var(--text-ultralow)' }}>WO:{machine._count.workOrders}</span>
        </div>
      </div>
    </div>
  );
}

// ── Machine Detail Panel ───────────────────────────────────────────────────────
function MachinePanel({
  machine,
  onClose,
  onStatusChange,
}: {
  machine: Machine;
  onClose: () => void;
  onStatusChange: (machineId: string, newStatus: string, updatedMachine?: Partial<Machine>) => void;
}) {
  const cfg = STATUS_CFG[machine.status] || STATUS_CFG.OPERATIONAL;
  const isOp = machine.status === 'OPERATIONAL';
  const isB  = machine.status === 'BREAKDOWN';

  const [currentStatus, setCurrentStatus] = useState(machine.status);
  const [temp, setTemp]         = useState(isB ? 102 : 72);
  const [load, setLoad]         = useState(isOp ? 60 : 0);
  const [rpm,  setRpm]          = useState(isOp ? 1800 : 0);
  const [pressure, setPressure] = useState(isOp ? 65 : 0);
  const [vibration, setVibration] = useState(isB ? 8.5 : 0.5);
  const [tempHist, setTempHist] = useState<number[]>([]);
  const [loadHist, setLoadHist] = useState<number[]>([]);
  const [cmdLog, setCmdLog]     = useState<{ ts: string; text: string; ok: boolean }[]>([]);
  const [loading, setLoading]   = useState<string | null>(null);
  const [toast, setToast]       = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const currentCfg = STATUS_CFG[currentStatus] || STATUS_CFG.OPERATIONAL;
  const live = currentStatus === 'OPERATIONAL';

  // Live sensor simulation when machine is OPERATIONAL
  useEffect(() => {
    if (!live) {
      setLoad(0); setRpm(0); setVibration(0); setPressure(0);
      return;
    }
    const iv = setInterval(() => {
      setTemp(t => { const v = Math.max(55, Math.min(98, t + (Math.random() - 0.5) * 3)); setTempHist(h => [...h.slice(-19), v]); return v; });
      setLoad(l => { const v = Math.max(20, Math.min(99, l + (Math.random() - 0.5) * 6)); setLoadHist(h => [...h.slice(-19), v]); return v; });
      setRpm(r => Math.max(800, Math.min(3200, r + (Math.random() - 0.5) * 120)));
      setPressure(p => Math.max(40, Math.min(100, p + (Math.random() - 0.5) * 4)));
      setVibration(v => Math.max(0, Math.min(5, v + (Math.random() - 0.5) * 0.2)));
    }, 1000);
    return () => clearInterval(iv);
  }, [live]);

  const logCmd = (text: string, ok: boolean) => {
    const ts = new Date().toLocaleTimeString();
    setCmdLog(l => [{ ts, text, ok }, ...l.slice(0, 9)]);
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
  };

  const sendCommand = async (command: string, label: string) => {
    setLoading(command);
    try {
      const res = await fetch(`/api/machines/${machine.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (!res.ok) {
        logCmd(`${label} → FAILED: ${data.error || res.statusText}`, false);
        showToast(`Failed: ${data.error || 'Unknown error'}`, 'error');
      } else {
        const newStatus = data.newStatus;
        setCurrentStatus(newStatus);
        logCmd(`${label} → ${newStatus} ✓`, true);
        const msg = command === 'REQUEST_MAINTENANCE'
          ? `✅ Maintenance requested. WO ${data.workOrder?.woNumber} created. Status → MAINTENANCE`
          : command === 'EMERGENCY_STOP'
          ? `🚨 Emergency Stop! Status → BREAKDOWN. Alert & WO created.`
          : command === 'START'
          ? `▶ Machine started. Status → OPERATIONAL`
          : command === 'PAUSE'
          ? `⏸ Machine paused. Status → MAINTENANCE`
          : command === 'STOP'
          ? `⏹ Machine stopped (parked). Status → MAINTENANCE — press START to resume.`
          : `Command sent.`;
        showToast(msg, command === 'EMERGENCY_STOP' ? 'error' : 'success');
        onStatusChange(machine.id, newStatus, data.machine);
      }
    } catch (err) {
      logCmd(`${label} → ERROR`, false);
      showToast('Network error — please try again', 'error');
    }
    setLoading(null);
  };

  const Spark = ({ data, color }: { data: number[]; color: string }) => {
    if (data.length < 2) return <div className="h-5 w-20 rounded" style={{ opacity: 0.2, backgroundColor: 'var(--bar-bg)' }}/>;
    const w = 80; const h = 20;
    const mn = Math.min(...data); const mx = Math.max(...data); const rng = mx - mn || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(' ');
    return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>;
  };

  const orgName = machine.organization?.name || 'Unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-3" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      <div
        className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border"
        style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 flex items-center justify-between ${currentCfg.bg}`} style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${currentCfg.dot} ${currentStatus === 'OPERATIONAL' ? 'animate-pulse' : currentStatus === 'BREAKDOWN' ? 'animate-ping' : ''}`}/>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{machine.name}</h2>
                <OrgBadge name={orgName} size="sm" />
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{getCategoryLabel(machine.category, machine.name)} · {machine.location || '—'} · {machine.totalHours.toLocaleString()}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentCfg.bg} ${currentCfg.border} ${currentCfg.color}`}>{currentCfg.label}</span>
            <button onClick={onClose} className="text-xl leading-none w-8 h-8 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>&times;</button>
          </div>
        </div>

        {/* Full-width SCADA image at top of detail panel */}
        <div className={`mx-4 mt-0 rounded-xl border overflow-hidden ${currentCfg.border}`} style={{ background: '#0a1628' }}>
          <MachineImage category={machine.category} machineName={machine.name} status={currentStatus} className="w-full h-64" liveData={live ? { temp, load, rpm, pressure } : undefined} />
        </div>

        <div className="p-4 grid md:grid-cols-3 gap-4">
          {/* Visual column */}
          <div className={`rounded-xl border ${currentCfg.border} ${currentCfg.bg} p-4 flex flex-col items-center gap-3`}>
            {currentStatus === 'BREAKDOWN' && (
              <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                <p className="text-red-400 text-xs font-bold animate-pulse">⚠ BREAKDOWN</p>
                <p className="text-red-400/60 text-[10px] mt-0.5">Contact maintenance immediately</p>
              </div>
            )}
            {currentStatus === 'MAINTENANCE' && (
              <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
                <p className="text-yellow-400 text-xs font-bold">🔧 MAINTENANCE</p>
                <p className="text-yellow-400/60 text-[10px] mt-0.5">Service in progress</p>
              </div>
            )}
            {machine.alerts.length > 0 && (
              <div className="w-full space-y-1">
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Active Alerts</p>
                {machine.alerts.map(a => (
                  <div key={a.id} className="bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                    <p className="text-[10px] text-red-400 font-medium truncate">{a.title}</p>
                    <p className="text-[9px] text-red-400/60">{a.severity}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="w-full space-y-1.5">
              {[
                { l: 'Organization', v: orgName, isOrg: true },
                { l: 'Model',        v: machine.model || '—', isOrg: false },
                { l: 'Manufacturer', v: machine.manufacturer || '—', isOrg: false },
                { l: 'Criticality',  v: machine.criticality, isOrg: false },
                { l: 'Work Orders',  v: machine._count.workOrders, isOrg: false },
              ].map(f => (
                <div key={f.l} className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{f.l}</span>
                  {f.isOrg
                    ? <OrgBadge name={String(f.v)} size="xs" />
                    : <span className="font-medium truncate max-w-[100px] text-right" style={{ color: 'var(--text-secondary)' }}>{f.v}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Gauges column */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Live Telemetry</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { gauge: <Gauge value={temp} max={120} label="TEMP" unit="°" color={temp > 95 ? '#ef4444' : temp > 80 ? '#fbbf24' : '#34d399'} size={72}/>, spark: <Spark data={tempHist} color={temp > 90 ? '#ef4444' : '#34d399'}/> },
                { gauge: <Gauge value={load} max={100} label="LOAD" unit="%" color={load > 88 ? '#ef4444' : '#635bff'} size={72}/>, spark: <Spark data={loadHist} color="#635bff"/> },
              ].map((g, i) => (
                <div key={i} className="rounded-xl p-2 flex flex-col items-center gap-1 border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  {g.gauge}{g.spark}
                </div>
              ))}
              {[
                <Gauge key="rpm" value={rpm} max={4000} label="RPM" unit="" color="#60a5fa" size={72}/>,
                <Gauge key="vib" value={vibration} max={10} label="VIB" unit="g" color={vibration > 5 ? '#ef4444' : vibration > 2.5 ? '#fbbf24' : '#a78bfa'} size={72}/>,
              ].map((g, i) => (
                <div key={i} className="rounded-xl p-2 flex flex-col items-center border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  {g}
                </div>
              ))}
            </div>

            <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Machine State</p>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${currentCfg.dot} ${currentStatus === 'OPERATIONAL' ? 'animate-pulse' : ''}`}/>
                <span className={`text-xs font-bold ${currentCfg.color}`}>{currentStatus}</span>
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{machine.totalHours.toLocaleString()} total runtime hours</p>
              <div className="mt-2 w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--bar-bg)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (machine.totalHours / 10000) * 100)}%`, backgroundColor: '#635bff' }}/>
              </div>
              <p className="text-[9px] mt-1" style={{ color: 'var(--text-ultralow)' }}>{Math.min(100, Math.round((machine.totalHours / 10000) * 100))}% of 10,000h service interval</p>
            </div>

            {!live && (
              <div className="rounded-lg px-3 py-2 text-[10px] text-center" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', borderColor: 'var(--border)', border: '1px solid' }}>
                Sensor data paused — machine not operational
              </div>
            )}
          </div>

          {/* Controls column */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Operator Panel</h3>
            <div className="rounded-xl p-3 space-y-2 border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>

              {/* START */}
              <button
                onClick={() => sendCommand('START', '▶ START')}
                disabled={loading !== null || currentStatus === 'OPERATIONAL'}
                className="w-full px-3 py-2 text-left text-xs font-semibold border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {loading === 'START' ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : null}
                ▶ START MACHINE
                {currentStatus === 'OPERATIONAL' && <span className="ml-auto text-[9px] opacity-50">(running)</span>}
              </button>

              {/* PAUSE */}
              <button
                onClick={() => sendCommand('PAUSE', '⏸ PAUSE')}
                disabled={loading !== null || currentStatus !== 'OPERATIONAL'}
                className="w-full px-3 py-2 text-left text-xs font-semibold border border-yellow-500/30 rounded-lg hover:bg-yellow-500/10 text-yellow-400 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {loading === 'PAUSE' ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : null}
                ⏸ PAUSE MACHINE
              </button>

              {/* STOP */}
              <button
                onClick={() => sendCommand('STOP', '⏹ STOP')}
                disabled={loading !== null || currentStatus !== 'OPERATIONAL'}
                className="w-full px-3 py-2 text-left text-xs font-semibold border border-gray-500/30 rounded-lg hover:bg-gray-500/10 transition-colors disabled:opacity-40 flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {loading === 'STOP' ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : null}
                ⏹ STOP MACHINE
                {currentStatus === 'MAINTENANCE' && <span className="ml-auto text-[9px] opacity-50">(stopped)</span>}
              </button>

              {/* REQUEST MAINTENANCE */}
              <button
                onClick={() => sendCommand('REQUEST_MAINTENANCE', '🔧 REQUEST MAINTENANCE')}
                disabled={loading !== null || currentStatus === 'MAINTENANCE'}
                className="w-full px-3 py-2 text-left text-xs font-semibold border border-blue-500/30 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                {loading === 'REQUEST_MAINTENANCE' ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : null}
                🔧 REQUEST MAINTENANCE
                {currentStatus === 'MAINTENANCE' && <span className="ml-auto text-[9px] opacity-50">(active)</span>}
              </button>

              {/* EMERGENCY STOP */}
              <button
                onClick={() => {
                  if (confirm(`⚠️ EMERGENCY STOP\n\nThis will set ${machine.name} to BREAKDOWN status and create a critical alert and work order.\n\nProceed?`)) {
                    sendCommand('EMERGENCY_STOP', '🚨 EMERGENCY STOP');
                  }
                }}
                disabled={loading !== null || currentStatus === 'BREAKDOWN'}
                className="w-full px-3 py-2.5 text-center text-xs font-bold border border-red-500/60 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading === 'EMERGENCY_STOP' ? <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : null}
                🚨 EMERGENCY STOP
                {currentStatus === 'BREAKDOWN' && <span className="text-[9px] opacity-50">(triggered)</span>}
              </button>
            </div>

            {/* Command Log */}
            {cmdLog.length > 0 && (
              <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Command Log</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {cmdLog.map((l, i) => (
                    <p key={i} className={`text-[10px] font-mono ${l.ok ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                      <span className="opacity-50">[{l.ts}]</span> {l.text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[9px] text-center" style={{ color: 'var(--text-ultralow)' }}>
              Status changes sync to both dashboards in real time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function UserHMIClientInner({ user, initialMachines }: {
  user: { name: string; organizationName: string };
  initialMachines: Machine[];
}) {
  const [machines, setMachines] = useState(initialMachines);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch('/api/user/hmi-data');
      if (res.ok) {
        const data = await res.json();
        setMachines(data.machines || []);
        setLastRefresh(new Date());
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchMachines, 8000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchMachines]);

  // When operator changes a machine status, update local state immediately
  const handleStatusChange = useCallback((machineId: string, newStatus: string, updatedMachine?: Partial<Machine>) => {
    setMachines(prev => prev.map(m =>
      m.id === machineId
        ? { ...m, status: newStatus, ...(updatedMachine ? { _count: (updatedMachine as Machine)._count ?? m._count, alerts: (updatedMachine as Machine).alerts ?? m.alerts } : {}) }
        : m
    ));
    setSelected(prev => prev && prev.id === machineId ? { ...prev, status: newStatus } : prev);
    setTimeout(fetchMachines, 1500);
  }, [fetchMachines]);

  const filtered = filter === 'ALL' ? machines : machines.filter(m => m.status === filter);
  const op = machines.filter(m => m.status === 'OPERATIONAL').length;
  const bd = machines.filter(m => m.status === 'BREAKDOWN').length;
  const mt = machines.filter(m => m.status === 'MAINTENANCE').length;
  const oee = machines.length > 0 ? Math.round((op / machines.length) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)', transition: 'background-color 0.2s, color 0.2s' }}>
      {/* Top nav bar */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-nav)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>← Dashboard</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>HMI Plant Monitor</span>
          </div>
          <span className="hidden sm:block" style={{ color: 'var(--text-muted)' }}>·</span>
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>{user.organizationName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMachines}
            className="px-2 py-1 rounded text-xs font-semibold border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            ⟳ Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`px-2 py-1 rounded text-xs font-semibold border transition-colors ${autoRefresh ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}
          >
            {autoRefresh ? '🟢 Live' : '⚫ Paused'}
          </button>
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-ultralow)' }}>
            {lastRefresh ? `Updated: ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-7xl mx-auto">

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: 'Total Equipment', v: machines.length, c: 'var(--text-primary)' },
            { l: 'Operational',     v: op,              c: '#34d399' },
            { l: 'Maintenance',     v: mt,              c: '#fbbf24' },
            { l: 'Breakdown',       v: bd,              c: '#f87171' },
            { l: 'Availability',    v: `${oee}%`,       c: oee >= 90 ? '#34d399' : oee >= 70 ? '#fbbf24' : '#f87171' },
          ].map(k => (
            <div key={k.l} className="rounded-xl p-3 text-center border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="text-2xl font-bold" style={{ color: k.c }}>{k.v}</div>
              <div className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { s: 'ALL',         l: `All (${machines.length})` },
            { s: 'OPERATIONAL', l: `Operational (${op})` },
            { s: 'MAINTENANCE', l: `Maintenance (${mt})` },
            { s: 'BREAKDOWN',   l: `Breakdown (${bd})` },
          ].map(f => (
            <button key={f.s} onClick={() => setFilter(f.s)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                filter === f.s
                  ? f.s === 'OPERATIONAL' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : f.s === 'BREAKDOWN'   ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : f.s === 'MAINTENANCE' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                  : 'bg-[#635bff]/20 border-[#635bff]/40 text-[#635bff]'
                  : ''
              }`}
              style={filter !== f.s ? { backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' } : {}}
            >
              {f.l}
            </button>
          ))}
        </div>

        <p className="text-xs" style={{ color: 'var(--text-ultralow)' }}>Click any machine card to open the HMI control panel with live sensor data and operator controls.</p>

        {/* Machine grid */}
        {filtered.length === 0 ? (
          <div className="rounded-xl p-12 text-center border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No machines found. Add machines in the Equipment tab.</p>
            <Link href="/dashboard" className="mt-3 inline-block text-xs text-[#635bff] hover:underline">← Back to Dashboard</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(m => <MachineCard key={m.id} machine={m} onClick={() => setSelected(m)}/>)}
          </div>
        )}

        {/* Breakdown alert banner */}
        {bd > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping flex-shrink-0"/>
            <div>
              <p className="text-red-400 font-bold text-sm">{bd} machine{bd !== 1 ? 's' : ''} in BREAKDOWN</p>
              <p className="text-red-400/60 text-xs">Click on the affected machine to request maintenance or view details.</p>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <MachinePanel
          machine={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default function UserHMIClient(props: {
  user: { name: string; organizationName: string };
  initialMachines: Machine[];
}) {
  return (
    <ThemeProvider themeClass="dash-theme" defaultTheme="light" storageKey="myncel-dashboard-theme" style={{ minHeight: '100vh' }}>
      <UserHMIClientInner {...props} />
    </ThemeProvider>
  );
}