'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface HMISchematicProps {
  category: string;
  machineName: string;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  liveData?: { temp: number; load: number; rpm: number; pressure: number };
  compact?: boolean;
  isDark?: boolean;
  machineId?: string;
  onCommand?: (command: string, label: string) => void;
}

// ─── Shared theme helper ──────────────────────────────────────────────────────
function useThemeColors(isDark: boolean) {
  return {
    bg:            isDark ? '#0a1628' : 'transparent',
    gridColor:     isDark ? '#1e3a5f' : '#c8d8ea',
    headerBg:      isDark ? '#0f172a' : '#dbeafe',
    panelBg:       isDark ? '#0f172a' : '#f0f7ff',
    panelBorder:   isDark ? '#1e3a5f' : '#bfdbfe',
    textPrimary:   isDark ? '#67e8f9' : '#1e40af',
    textSecondary: isDark ? '#94a3b8' : '#334155',
    tabBg:         isDark ? '#1e3a5f' : '#dbeafe',
    tabActiveBg:   isDark ? '#0891b2' : '#3b82f6',
    machineBlue:   isDark ? '#0891b2' : '#2563eb',
    machineBlueStroke: isDark ? '#22d3ee' : '#60a5fa',
    metalFill:     isDark ? '#374151' : '#94a3b8',
    metalStroke:   isDark ? '#6b7280' : '#64748b',
    darkSurface:   isDark ? '#1e3a5f' : '#dbeafe',
  };
}

// ─── Shared Grid Pattern ──────────────────────────────────────────────────────
function GridDefs({ id, color, size = 40 }: { id: string; color: string; size?: number }) {
  return (
    <defs>
      <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
        <path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke={color} strokeWidth="0.5"/>
      </pattern>
    </defs>
  );
}

// ─── Status colors ─────────────────────────────────────────────────────────────
function statusColor(s: string) {
  if (s === 'OPERATIONAL') return '#22c55e';
  if (s === 'BREAKDOWN')   return '#ef4444';
  return '#f59e0b';
}
function tempColor(t: number)  { return t > 90 ? '#ef4444' : t > 75 ? '#f59e0b' : '#22c55e'; }
function loadColor(l: number)  { return l > 90 ? '#ef4444' : l > 70 ? '#f59e0b' : '#635bff'; }

// ─── Live Data Panel (SVG) ────────────────────────────────────────────────────
function DataPanel({
  x, y, w = 205, items, panelBg, panelBorder, textPrimary, textSecondary, load
}: {
  x: number; y: number; w?: number;
  items: { label: string; value: string; unit: string; color: string }[];
  panelBg: string; panelBorder: string; textPrimary: string; textSecondary: string;
  load: number;
}) {
  const lc = loadColor(load);
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={w} height={items.length * 36 + 30} fill={panelBg} stroke={panelBorder} strokeWidth="2" rx="8" opacity="0.97"/>
      <text x={w / 2} y="22" fill={textPrimary} fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
      {items.map((item, i) => (
        <g key={item.label} transform={`translate(10, ${38 + i * 36})`}>
          <text x="0" y="0" fill={textSecondary} fontSize="9" fontFamily="monospace">{item.label}</text>
          <text x={w - 16} y="0" fill={item.color} fontSize="15" textAnchor="end" fontFamily="monospace" fontWeight="bold">{item.value}</text>
          <text x={w - 16} y="14" fill={textSecondary} fontSize="8" textAnchor="end" fontFamily="monospace">{item.unit}</text>
          {item.label === 'LOAD' && (
            <>
              <rect x="0" y="18" width={w - 26} height="5" fill="#1e3a5f" rx="2" opacity="0.4"/>
              <rect x="0" y="18" width={(w - 26) * (load / 100)} height="5" fill={lc} rx="2"/>
            </>
          )}
        </g>
      ))}
    </g>
  );
}

// ─── CNC Lathe Schematic ──────────────────────────────────────────────────────
function CNCLatheSchematic({ rpm, feed, xPos, zPos, temp: t, load: l, pressure, status, isDark, compact, onCommand }: any) {
  const c = useThemeColors(isDark);
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (status !== 'OPERATIONAL') return;
    const iv = setInterval(() => setAngle(a => (a + Math.max(1, rpm / 60)) % 360), 16);
    return () => clearInterval(iv);
  }, [rpm, status]);

  if (compact) return (
    <svg viewBox="0 0 400 160" className="w-full h-full">
      <GridDefs id="cl-cg" color={c.gridColor} size={20}/>
      {c.bg !== 'transparent' && <rect width="400" height="160" fill={c.bg}/>}
      <rect width="400" height="160" fill="url(#cl-cg)" opacity="0.6"/>
      <text x="8" y="18" fill={c.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="72" y="18" fill={c.textSecondary} fontSize="9" fontFamily="monospace">CNC LATHE</text>
      {/* Spindle Housing */}
      <rect x="28" y="42" width="82" height="72" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2" rx="4" opacity="0.9"/>
      <text x="69" y="82" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">SPINDLE</text>
      <text x="69" y="96" fill="#a5f3fc" fontSize="8" textAnchor="middle" fontFamily="monospace">{Math.round(rpm)}</text>
      {/* Chuck */}
      <g transform="translate(142,78)">
        <circle r="26" fill={c.darkSurface} stroke="#fbbf24" strokeWidth="3"/>
        <g transform={`rotate(${angle})`}>
          <line x1="0" y1="-20" x2="0" y2="20" stroke="#fbbf24" strokeWidth="2.5"/>
          <line x1="-20" y1="0" x2="20" y2="0" stroke="#fbbf24" strokeWidth="2.5"/>
        </g>
        <rect x="-7" y="-30" width="14" height="60" fill="#22c55e" rx="2"/>
      </g>
      {/* Turret */}
      <rect x="196" y="38" width="36" height="78" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="2" rx="2"/>
      <polygon points="232,78 268,72 268,84" fill="#635bff"/>
      {status === 'OPERATIONAL' && (
        <circle cx="172" cy="78" r="9" fill="#f97316" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="0.5s" repeatCount="indefinite"/>
        </circle>
      )}
      {/* Info box */}
      <rect x="285" y="8" width="110" height="64" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="1" rx="4" opacity="0.95"/>
      <text x="340" y="23" textAnchor="middle" fill={c.textPrimary} fontSize="8" fontWeight="bold" fontFamily="monospace">LIVE</text>
      <text x="292" y="36" fill={c.textSecondary} fontSize="7" fontFamily="monospace">RPM: <tspan fill="#fbbf24" fontWeight="bold">{Math.round(rpm)}</tspan></text>
      <text x="292" y="48" fill={c.textSecondary} fontSize="7" fontFamily="monospace">LOAD: <tspan fill={loadColor(l)} fontWeight="bold">{l.toFixed(0)}%</tspan></text>
      <text x="292" y="60" fill={c.textSecondary} fontSize="7" fontFamily="monospace">TEMP: <tspan fill={tempColor(t)} fontWeight="bold">{t.toFixed(0)}°C</tspan></text>
      <circle cx="388" cy="14" r="6" fill={statusColor(status)}>
        {status === 'OPERATIONAL' && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>}
      </circle>
      {status === 'BREAKDOWN' && <rect width="400" height="160" fill="rgba(239,68,68,0.15)"/>}
      {status === 'MAINTENANCE' && <rect width="400" height="160" fill="rgba(245,158,11,0.1)"/>}
    </svg>
  );

  return (
    <svg viewBox="0 0 800 400" className="w-full h-full">
      <GridDefs id="cl-fg" color={c.gridColor}/>
      {c.bg !== 'transparent' && <rect width="800" height="400" fill={c.bg}/>}
      <rect width="800" height="400" fill="url(#cl-fg)" opacity="0.6"/>
      {/* Header */}
      <rect width="800" height="44" fill={c.headerBg} opacity="0.97"/>
      <text x="18" y="29" fill={c.textPrimary} fontSize="17" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="112" y="29" fill={c.textSecondary} fontSize="13" fontFamily="monospace">CNC LATHE HMI</text>
      <circle cx="658" cy="22" r="5" fill={statusColor(status)}/>
      <text x="776" y="27" fill={statusColor(status)} fontSize="12" textAnchor="end" fontFamily="monospace" fontWeight="bold">{status}</text>
      {/* Buttons */}
      <g transform="translate(18,52)">
        {[{l:'MOTOR ON',c:'#fbbf24',t:'#1e3a5f',cmd:'START'},{l:'SPINDLE ON',c:'#fbbf24',t:'#1e3a5f',cmd:'START'},{l:'AUTO',c:'#3b82f6',t:'white',cmd:'START'},{l:'MANUAL',c:'#06b6d4',t:'white',cmd:'PAUSE'},{l:'CYCLE',c:'#22c55e',t:'white',cmd:'START'}].map((b,i) => (
          <g key={b.l} transform={`translate(${i*85},0)`} style={{cursor:'pointer'}} onClick={() => onCommand?.(b.cmd, b.l)}>
            <rect width="78" height="28" fill={b.c} rx="4" opacity="0.9"/>
            <text x="39" y="18" fill={b.t} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{b.l}</text>
          </g>
        ))}
      </g>
      {/* Bed */}
      <rect x="50" y="295" width="500" height="28" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="2" rx="2"/>
      {/* Spindle Housing */}
      <rect x="60" y="175" width="120" height="120" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="3" rx="8" opacity="0.9"/>
      <text x="120" y="237" fill="white" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">SPINDLE</text>
      <text x="120" y="255" fill="#a5f3fc" fontSize="10" textAnchor="middle" fontFamily="monospace">{Math.round(rpm)} RPM</text>
      {/* Chuck */}
      <g transform="translate(230,235)">
        <circle r="44" fill={c.darkSurface} stroke="#fbbf24" strokeWidth="4"/>
        <circle r="34" fill={isDark ? '#0f172a' : '#eff6ff'} stroke="#fbbf24" strokeWidth="2"/>
        <g transform={`rotate(${angle})`}>
          {[0,120,240].map((a,i) => <g key={i} transform={`rotate(${a})`}><rect x="-8" y="-44" width="16" height="20" fill="#fbbf24" rx="2"/></g>)}
        </g>
        <rect x="-11" y="-76" width="22" height="152" fill="#22c55e" rx="3" opacity="0.9"/>
      </g>
      {/* Tool Turret */}
      <g transform="translate(360,195)">
        <rect width="58" height="115" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="2" rx="4"/>
        {[0,38,76].map((y,i) => <g key={i} transform={`translate(0,${y})`}>
          <rect x="54" y="5" width="75" height="28" fill={isDark?'#4b5563':'#cbd5e1'} stroke={c.metalStroke} strokeWidth="1" rx="2"/>
          <polygon points={`129,19 155,13 155,25`} fill={i===1?'#635bff':c.metalFill} stroke="#a78bfa" strokeWidth="1"/>
        </g>)}
        <text x="29" y="62" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace">TURRET</text>
      </g>
      {status==='OPERATIONAL' && (
        <g>
          <circle cx="267" cy="235" r="14" fill="#f97316" opacity="0.65">
            <animate attributeName="opacity" values="0.65;0.2;0.65" dur="0.45s" repeatCount="indefinite"/>
          </circle>
          <circle cx="273" cy="228" r="7" fill="#fbbf24" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.3s" repeatCount="indefinite"/>
          </circle>
        </g>
      )}
      {/* Data Panel */}
      <DataPanel x={578} y={50} items={[
        {label:'SPINDLE RPM',value:Math.round(rpm).toString(),unit:'',color:'#fbbf24'},
        {label:'FEED RATE',value:feed.toFixed(1),unit:'mm/min',color:'#22c55e'},
        {label:'X POSITION',value:xPos.toFixed(1),unit:'mm',color:'#06b6d4'},
        {label:'Z POSITION',value:zPos.toFixed(1),unit:'mm',color:'#a78bfa'},
        {label:'TEMPERATURE',value:t.toFixed(1),unit:'°C',color:tempColor(t)},
        {label:'LOAD',value:l.toFixed(0),unit:'%',color:loadColor(l)},
        {label:'PRESSURE',value:pressure.toFixed(1),unit:'PSI',color:'#f472b6'},
      ]} panelBg={c.panelBg} panelBorder={c.panelBorder} textPrimary={c.textPrimary} textSecondary={c.textSecondary} load={l}/>
      {/* Tabs */}
      <g transform="translate(18,362)">
        {['SPINDLE','FEED','TOOL','OFFSET','CYCLE','POSITIONS'].map((tab,i) => (
          <g key={tab} transform={`translate(${i*77},0)`} style={{cursor:'pointer'}}>
            <rect width="72" height="30" fill={i===0?c.tabActiveBg:c.tabBg} stroke={i===0?c.machineBlueStroke:c.panelBorder} strokeWidth="1" rx="4"/>
            <text x="36" y="20" fill={i===0?'white':c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">{tab}</text>
          </g>
        ))}
      </g>
      {status==='BREAKDOWN'&&<><rect width="800" height="400" fill="rgba(239,68,68,0.12)"/><rect x="280" y="168" width="240" height="58" fill="rgba(127,0,0,0.87)" rx="8"/><text x="400" y="194" textAnchor="middle" fill="#fca5a5" fontSize="14" fontWeight="bold" fontFamily="monospace">⚠ FAULT DETECTED</text><text x="400" y="215" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">CHECK MACHINE LOG</text></>}
      {status==='MAINTENANCE'&&<><rect width="800" height="400" fill="rgba(245,158,11,0.08)"/><rect x="292" y="174" width="216" height="50" fill="rgba(80,55,0,0.87)" rx="8"/><text x="400" y="205" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">🔧 IN MAINTENANCE</text></>}
    </svg>
  );
}

// ─── Press Brake Schematic ────────────────────────────────────────────────────
function PressBrakeSchematic({ force, angle, stroke, thickness, temp: t, load: l, pressure, status, isDark, compact, onCommand }: any) {
  const c = useThemeColors(isDark);
  const [ramPos, setRamPos] = useState(0);
  const [dir, setDir] = useState(1);
  useEffect(() => {
    if (status !== 'OPERATIONAL') { setRamPos(0); return; }
    const iv = setInterval(() => {
      setRamPos(prev => {
        const n = prev + dir * 1.5;
        if (n >= 38) setDir(-1);
        if (n <= 0) setDir(1);
        return Math.max(0, Math.min(38, n));
      });
    }, 40);
    return () => clearInterval(iv);
  }, [status, dir]);

  if (compact) return (
    <svg viewBox="0 0 400 160" className="w-full h-full">
      <GridDefs id="pb-cg" color={c.gridColor} size={20}/>
      {c.bg !== 'transparent' && <rect width="400" height="160" fill={c.bg}/>}
      <rect width="400" height="160" fill="url(#pb-cg)" opacity="0.6"/>
      <text x="8" y="17" fill={c.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="72" y="17" fill={c.textSecondary} fontSize="9" fontFamily="monospace">PRESS BRAKE</text>
      {/* Frame */}
      <rect x="25" y="22" width="22" height="128" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2" rx="3" opacity="0.9"/>
      <rect x="25" y="22" width="148" height="22" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2" rx="3" opacity="0.9"/>
      <rect x="25" y="128" width="148" height="22" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2" rx="3" opacity="0.9"/>
      {/* Cylinders */}
      <rect x="60" y="44" width="15" height={35 + ramPos * 0.7} fill="#06b6d4" rx="2"/>
      <rect x="95" y="44" width="15" height={35 + ramPos * 0.7} fill="#06b6d4" rx="2"/>
      {/* RAM */}
      <rect x="53" y={44 + 35 + ramPos * 0.7} width="118" height="18" fill="#f97316" stroke="#fb923c" strokeWidth="2" rx="3"/>
      {/* Sheet/Die */}
      <rect x="53" y="126" width="118" height="7" fill="#22d3ee" rx="2"/>
      <polygon points={`100,133 112,148 124,133`} fill="#fbbf24"/>
      {/* Info */}
      <rect x="190" y="8" width="205" height="80" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="1" rx="4" opacity="0.95"/>
      <text x="292" y="24" textAnchor="middle" fill={c.textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">LIVE DATA</text>
      <text x="198" y="38" fill={c.textSecondary} fontSize="8" fontFamily="monospace">FORCE: <tspan fill="#06b6d4" fontWeight="bold">{force.toFixed(0)} kN</tspan></text>
      <text x="198" y="50" fill={c.textSecondary} fontSize="8" fontFamily="monospace">ANGLE: <tspan fill="#fbbf24" fontWeight="bold">{angle.toFixed(1)}°</tspan></text>
      <text x="198" y="62" fill={c.textSecondary} fontSize="8" fontFamily="monospace">LOAD: <tspan fill={loadColor(l)} fontWeight="bold">{l.toFixed(0)}%</tspan></text>
      <text x="198" y="74" fill={c.textSecondary} fontSize="8" fontFamily="monospace">TEMP: <tspan fill={tempColor(t)} fontWeight="bold">{t.toFixed(0)}°C</tspan></text>
      <circle cx="388" cy="14" r="6" fill={statusColor(status)}>
        {status === 'OPERATIONAL' && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>}
      </circle>
      {status === 'BREAKDOWN' && <rect width="400" height="160" fill="rgba(239,68,68,0.15)"/>}
    </svg>
  );

  return (
    <svg viewBox="0 0 800 400" className="w-full h-full">
      <GridDefs id="pb-fg" color={c.gridColor}/>
      {c.bg !== 'transparent' && <rect width="800" height="400" fill={c.bg}/>}
      <rect width="800" height="400" fill="url(#pb-fg)" opacity="0.6"/>
      <rect width="800" height="44" fill={c.headerBg} opacity="0.97"/>
      <text x="18" y="29" fill={c.textPrimary} fontSize="17" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="112" y="29" fill={c.textSecondary} fontSize="13" fontFamily="monospace">PRESS BRAKE HMI</text>
      <circle cx="655" cy="22" r="5" fill={statusColor(status)}/>
      <text x="776" y="27" fill={statusColor(status)} fontSize="12" textAnchor="end" fontFamily="monospace" fontWeight="bold">{status}</text>
      {/* Buttons */}
      <g transform="translate(18,52)">
        {[{l:'MOTOR ON',c:'#fbbf24',t:'#1e3a5f',cmd:'START'},{l:'PUMP ON',c:'#06b6d4',t:'white',cmd:'START'},{l:'AUTO',c:'#3b82f6',t:'white',cmd:'START'},{l:'MANUAL',c:'#6b7280',t:'white',cmd:'PAUSE'},{l:'CYCLE',c:'#22c55e',t:'white',cmd:'START'}].map((b,i) => (
          <g key={b.l} transform={`translate(${i*85},0)`} style={{cursor:'pointer'}} onClick={() => onCommand?.(b.cmd, b.l)}>
            <rect width="78" height="28" fill={b.c} rx="4" opacity="0.9"/>
            <text x="39" y="18" fill={b.t} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{b.l}</text>
          </g>
        ))}
      </g>
      {/* C-Frame */}
      <rect x="55" y="88" width="38" height="290" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="3" rx="6" opacity="0.9"/>
      <rect x="55" y="88" width="370" height="38" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="3" rx="6" opacity="0.9"/>
      <rect x="55" y="340" width="370" height="38" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="3" rx="6" opacity="0.9"/>
      {/* Cylinders */}
      <rect x="108" y="126" width="28" height={55 + ramPos} fill="#06b6d4" stroke="#22d3ee" strokeWidth="2" rx="3"/>
      <rect x="190" y="126" width="28" height={55 + ramPos} fill="#06b6d4" stroke="#22d3ee" strokeWidth="2" rx="3"/>
      <rect x="300" y="126" width="28" height={55 + ramPos} fill="#06b6d4" stroke="#22d3ee" strokeWidth="2" rx="3"/>
      {/* RAM */}
      <rect x="92" y={181 + ramPos} width="296" height="34" fill="#f97316" stroke="#fb923c" strokeWidth="2" rx="4"/>
      <text x="240" y={202 + ramPos} fill="white" fontSize="13" textAnchor="middle" fontFamily="monospace" fontWeight="bold">HYDRAULIC RAM</text>
      {/* Punch */}
      <rect x="212" y={215 + ramPos} width="56" height="22" fill="#d97706" rx="2"/>
      <polygon points={`212,${237+ramPos} 240,${258+ramPos} 268,${237+ramPos}`} fill="#d97706"/>
      {/* Sheet */}
      <rect x="100" y="336" width="230" height="9" fill={isDark?'#22d3ee':'#3b82f6'} rx="2" opacity="0.9"/>
      {/* V-Die */}
      <polygon points="192,345 240,368 288,345" fill="#fbbf24"/>
      {/* Side data */}
      <text x="458" y="120" fill={c.textSecondary} fontSize="11" fontFamily="monospace">FORCE: {force.toFixed(0)} kN</text>
      <text x="458" y="140" fill={c.textSecondary} fontSize="11" fontFamily="monospace">ANGLE: {angle.toFixed(1)}°</text>
      <text x="458" y="160" fill={c.textSecondary} fontSize="11" fontFamily="monospace">STROKE: {stroke.toFixed(0)} mm</text>
      <text x="458" y="180" fill={c.textSecondary} fontSize="11" fontFamily="monospace">THICK:  {thickness.toFixed(1)} mm</text>
      <DataPanel x={578} y={50} items={[
        {label:'FORCE',value:force.toFixed(0),unit:'kN',color:'#06b6d4'},
        {label:'BEND ANGLE',value:angle.toFixed(1),unit:'°',color:'#fbbf24'},
        {label:'STROKE',value:stroke.toFixed(0),unit:'mm',color:'#22c55e'},
        {label:'THICKNESS',value:thickness.toFixed(1),unit:'mm',color:'#a78bfa'},
        {label:'HYD. PRESS',value:pressure.toFixed(1),unit:'bar',color:'#f472b6'},
        {label:'TEMPERATURE',value:t.toFixed(1),unit:'°C',color:tempColor(t)},
        {label:'LOAD',value:l.toFixed(0),unit:'%',color:loadColor(l)},
      ]} panelBg={c.panelBg} panelBorder={c.panelBorder} textPrimary={c.textPrimary} textSecondary={c.textSecondary} load={l}/>
      <g transform="translate(18,362)">
        {['PRESSURE','STROKE','ANGLE','TOOL','TIMER','SETUP'].map((tab,i) => (
          <g key={tab} transform={`translate(${i*77},0)`} style={{cursor:'pointer'}}>
            <rect width="72" height="30" fill={i===0?c.tabActiveBg:c.tabBg} stroke={i===0?c.machineBlueStroke:c.panelBorder} strokeWidth="1" rx="4"/>
            <text x="36" y="20" fill={i===0?'white':c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">{tab}</text>
          </g>
        ))}
      </g>
      {status==='BREAKDOWN'&&<><rect width="800" height="400" fill="rgba(239,68,68,0.12)"/><rect x="280" y="168" width="240" height="58" fill="rgba(127,0,0,0.87)" rx="8"/><text x="400" y="194" textAnchor="middle" fill="#fca5a5" fontSize="14" fontWeight="bold" fontFamily="monospace">⚠ FAULT DETECTED</text><text x="400" y="215" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">CHECK MACHINE LOG</text></>}
      {status==='MAINTENANCE'&&<><rect width="800" height="400" fill="rgba(245,158,11,0.08)"/><rect x="292" y="174" width="216" height="50" fill="rgba(80,55,0,0.87)" rx="8"/><text x="400" y="205" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">🔧 IN MAINTENANCE</text></>}
    </svg>
  );
}

// ─── CNC Mill Schematic ───────────────────────────────────────────────────────
function CNCMillSchematic({ rpm, feed, xPos, yPos, zPos, temp: t, load: l, status, isDark, compact, onCommand }: any) {
  const c = useThemeColors(isDark);
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (status !== 'OPERATIONAL') return;
    const iv = setInterval(() => setAngle(a => (a + Math.max(1, rpm / 60)) % 360), 16);
    return () => clearInterval(iv);
  }, [rpm, status]);

  if (compact) return (
    <svg viewBox="0 0 400 160" className="w-full h-full">
      <GridDefs id="cm-cg" color={c.gridColor} size={20}/>
      {c.bg !== 'transparent' && <rect width="400" height="160" fill={c.bg}/>}
      <rect width="400" height="160" fill="url(#cm-cg)" opacity="0.6"/>
      <text x="8" y="17" fill={c.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="72" y="17" fill={c.textSecondary} fontSize="9" fontFamily="monospace">CNC MILL</text>
      {/* Column */}
      <rect x="28" y="28" width="44" height="120" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2" rx="4" opacity="0.9"/>
      {/* Arm */}
      <rect x="72" y="44" width="130" height="16" fill={isDark?'#1e40af':'#3b82f6'} stroke={c.machineBlueStroke} strokeWidth="2" rx="3" opacity="0.9"/>
      {/* Spindle head */}
      <rect x="155" y="60" width="70" height="55" fill={isDark?'#1e40af':'#3b82f6'} stroke={c.machineBlueStroke} strokeWidth="2" rx="4" opacity="0.9"/>
      <g transform="translate(190,87)">
        <circle r="16" fill={c.darkSurface} stroke="#fbbf24" strokeWidth="2.5"/>
        <g transform={`rotate(${angle})`}>
          {[0,60,120,180,240,300].map((a,i) => <line key={i} x1="0" y1="0" x2={Math.cos(a*Math.PI/180)*11} y2={Math.sin(a*Math.PI/180)*11} stroke="#fbbf24" strokeWidth="2"/>)}
        </g>
        <circle r="4" fill="#f97316"/>
      </g>
      {/* Table */}
      <rect x="90" y="125" width="155" height="22" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="2" rx="2"/>
      {/* Workpiece */}
      <rect x="135" y="112" width="64" height="15" fill="#22c55e" rx="2" opacity="0.9"/>
      {/* Info */}
      <rect x="272" y="8" width="122" height="64" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="1" rx="4" opacity="0.95"/>
      <text x="333" y="22" textAnchor="middle" fill={c.textPrimary} fontSize="8" fontWeight="bold" fontFamily="monospace">LIVE</text>
      <text x="280" y="35" fill={c.textSecondary} fontSize="7" fontFamily="monospace">RPM: <tspan fill="#fbbf24" fontWeight="bold">{Math.round(rpm)}</tspan></text>
      <text x="280" y="47" fill={c.textSecondary} fontSize="7" fontFamily="monospace">LOAD: <tspan fill={loadColor(l)} fontWeight="bold">{l.toFixed(0)}%</tspan></text>
      <text x="280" y="59" fill={c.textSecondary} fontSize="7" fontFamily="monospace">TEMP: <tspan fill={tempColor(t)} fontWeight="bold">{t.toFixed(0)}°C</tspan></text>
      <circle cx="387" cy="14" r="6" fill={statusColor(status)}>
        {status === 'OPERATIONAL' && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>}
      </circle>
      {status === 'BREAKDOWN' && <rect width="400" height="160" fill="rgba(239,68,68,0.15)"/>}
    </svg>
  );

  return (
    <svg viewBox="0 0 800 400" className="w-full h-full">
      <GridDefs id="cm-fg" color={c.gridColor}/>
      {c.bg !== 'transparent' && <rect width="800" height="400" fill={c.bg}/>}
      <rect width="800" height="400" fill="url(#cm-fg)" opacity="0.6"/>
      <rect width="800" height="44" fill={c.headerBg} opacity="0.97"/>
      <text x="18" y="29" fill={c.textPrimary} fontSize="17" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="112" y="29" fill={c.textSecondary} fontSize="13" fontFamily="monospace">CNC MILL HMI</text>
      <circle cx="658" cy="22" r="5" fill={statusColor(status)}/>
      <text x="776" y="27" fill={statusColor(status)} fontSize="12" textAnchor="end" fontFamily="monospace" fontWeight="bold">{status}</text>
      <g transform="translate(18,52)">
        {[{l:'MOTOR ON',c:'#fbbf24',t:'#1e3a5f',cmd:'START'},{l:'SPINDLE ON',c:'#fbbf24',t:'#1e3a5f',cmd:'START'},{l:'AUTO',c:'#3b82f6',t:'white',cmd:'START'},{l:'MANUAL',c:'#06b6d4',t:'white',cmd:'PAUSE'},{l:'CYCLE',c:'#22c55e',t:'white',cmd:'START'}].map((b,i) => (
          <g key={b.l} transform={`translate(${i*85},0)`} style={{cursor:'pointer'}} onClick={() => onCommand?.(b.cmd, b.l)}>
            <rect width="78" height="28" fill={b.c} rx="4" opacity="0.9"/>
            <text x="39" y="18" fill={b.t} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{b.l}</text>
          </g>
        ))}
      </g>
      {/* Column */}
      <rect x="55" y="100" width="68" height="215" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="3" rx="6" opacity="0.9"/>
      <text x="89" y="205" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">COL</text>
      {/* Knee arm */}
      <rect x="123" y="110" width="200" height="20" fill={isDark?'#1e40af':'#3b82f6'} stroke={c.machineBlueStroke} strokeWidth="2" rx="3" opacity="0.9"/>
      {/* Spindle head */}
      <rect x="240" y="130" width="96" height="82" fill={isDark?'#1e40af':'#3b82f6'} stroke={c.machineBlueStroke} strokeWidth="2" rx="6" opacity="0.9"/>
      <text x="288" y="175" fill="white" fontSize="11" textAnchor="middle" fontFamily="monospace">SPINDLE</text>
      <text x="288" y="192" fill="#a5f3fc" fontSize="9" textAnchor="middle" fontFamily="monospace">{Math.round(rpm)} RPM</text>
      {/* End mill */}
      <g transform="translate(288,228)">
        <circle r="22" fill={c.darkSurface} stroke="#fbbf24" strokeWidth="3"/>
        <g transform={`rotate(${angle})`}>
          {[0,60,120,180,240,300].map((a,i) => <line key={i} x1="0" y1="0" x2={Math.cos(a*Math.PI/180)*16} y2={Math.sin(a*Math.PI/180)*16} stroke="#fbbf24" strokeWidth="2.5"/>)}
        </g>
        <circle r="5" fill="#f97316"/>
        {status==='OPERATIONAL'&&<circle r="28" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.4s" repeatCount="indefinite"/></circle>}
      </g>
      {/* Table */}
      <rect x="140" y="268" width="300" height="28" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="2" rx="3"/>
      {/* Workpiece */}
      <rect x="220" y="252" width="110" height="18" fill="#22c55e" rx="3" opacity="0.9"/>
      <text x="275" y="265" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace">WORKPIECE</text>
      {/* Axis readouts */}
      <text x="470" y="180" fill={c.textSecondary} fontSize="11" fontFamily="monospace">X: {xPos.toFixed(1)} mm</text>
      <text x="470" y="200" fill={c.textSecondary} fontSize="11" fontFamily="monospace">Y: {yPos.toFixed(1)} mm</text>
      <text x="470" y="220" fill={c.textSecondary} fontSize="11" fontFamily="monospace">Z: {zPos.toFixed(1)} mm</text>
      <DataPanel x={578} y={50} items={[
        {label:'SPINDLE RPM',value:Math.round(rpm).toString(),unit:'',color:'#fbbf24'},
        {label:'FEED RATE',value:feed.toFixed(1),unit:'mm/min',color:'#22c55e'},
        {label:'X POSITION',value:xPos.toFixed(1),unit:'mm',color:'#06b6d4'},
        {label:'Y POSITION',value:yPos.toFixed(1),unit:'mm',color:'#a78bfa'},
        {label:'Z POSITION',value:zPos.toFixed(1),unit:'mm',color:'#f472b6'},
        {label:'TEMPERATURE',value:t.toFixed(1),unit:'°C',color:tempColor(t)},
        {label:'LOAD',value:l.toFixed(0),unit:'%',color:loadColor(l)},
      ]} panelBg={c.panelBg} panelBorder={c.panelBorder} textPrimary={c.textPrimary} textSecondary={c.textSecondary} load={l}/>
      <g transform="translate(18,362)">
        {['SPINDLE','TABLE','TOOL','OFFSET','CYCLE','POSITIONS'].map((tab,i) => (
          <g key={tab} transform={`translate(${i*77},0)`} style={{cursor:'pointer'}}>
            <rect width="72" height="30" fill={i===0?c.tabActiveBg:c.tabBg} stroke={i===0?c.machineBlueStroke:c.panelBorder} strokeWidth="1" rx="4"/>
            <text x="36" y="20" fill={i===0?'white':c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">{tab}</text>
          </g>
        ))}
      </g>
      {status==='BREAKDOWN'&&<><rect width="800" height="400" fill="rgba(239,68,68,0.12)"/><rect x="280" y="168" width="240" height="58" fill="rgba(127,0,0,0.87)" rx="8"/><text x="400" y="194" textAnchor="middle" fill="#fca5a5" fontSize="14" fontWeight="bold" fontFamily="monospace">⚠ FAULT DETECTED</text><text x="400" y="215" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">CHECK MACHINE LOG</text></>}
      {status==='MAINTENANCE'&&<><rect width="800" height="400" fill="rgba(245,158,11,0.08)"/><rect x="292" y="174" width="216" height="50" fill="rgba(80,55,0,0.87)" rx="8"/><text x="400" y="205" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">🔧 IN MAINTENANCE</text></>}
    </svg>
  );
}

// ─── Compressor Schematic ─────────────────────────────────────────────────────
function CompressorSchematic({ pressure, flow, temp: t, load: l, runtime, status, isDark, compact, onCommand }: any) {
  const c = useThemeColors(isDark);
  const [screwAngle, setScrewAngle] = useState(0);
  useEffect(() => {
    if (status !== 'OPERATIONAL') return;
    const iv = setInterval(() => setScrewAngle(a => (a + 3) % 360), 30);
    return () => clearInterval(iv);
  }, [status]);

  if (compact) return (
    <svg viewBox="0 0 400 160" className="w-full h-full">
      <GridDefs id="cp-cg" color={c.gridColor} size={20}/>
      {c.bg !== 'transparent' && <rect width="400" height="160" fill={c.bg}/>}
      <rect width="400" height="160" fill="url(#cp-cg)" opacity="0.6"/>
      <text x="8" y="17" fill={c.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="72" y="17" fill={c.textSecondary} fontSize="9" fontFamily="monospace">COMPRESSOR</text>
      {/* Motor */}
      <rect x="20" y="55" width="70" height="60" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2" rx="4" opacity="0.9"/>
      <text x="55" y="85" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace">MOTOR</text>
      {/* Screw unit */}
      <rect x="90" y="60" width="100" height="50" fill={isDark?'#1e40af':'#3b82f6'} stroke={c.machineBlueStroke} strokeWidth="2" rx="4" opacity="0.9"/>
      <g transform="translate(140,85)">
        <ellipse rx="22" ry="12" fill={c.darkSurface} stroke="#fbbf24" strokeWidth="2"/>
        <ellipse rx="14" ry="7" fill="none" stroke="#fbbf24" strokeWidth="1.5" transform={`rotate(${screwAngle})`}/>
      </g>
      {/* Tank */}
      <ellipse cx="245" cy="85" rx="30" ry="45" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="2"/>
      <text x="245" y="89" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">TANK</text>
      {/* Info */}
      <rect x="290" y="8" width="105" height="72" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="1" rx="4" opacity="0.95"/>
      <text x="342" y="22" textAnchor="middle" fill={c.textPrimary} fontSize="8" fontWeight="bold" fontFamily="monospace">LIVE</text>
      <text x="298" y="36" fill={c.textSecondary} fontSize="7" fontFamily="monospace">PSI: <tspan fill="#06b6d4" fontWeight="bold">{pressure.toFixed(0)}</tspan></text>
      <text x="298" y="48" fill={c.textSecondary} fontSize="7" fontFamily="monospace">FLOW: <tspan fill="#22c55e" fontWeight="bold">{flow.toFixed(1)}</tspan></text>
      <text x="298" y="60" fill={c.textSecondary} fontSize="7" fontFamily="monospace">LOAD: <tspan fill={loadColor(l)} fontWeight="bold">{l.toFixed(0)}%</tspan></text>
      <text x="298" y="72" fill={c.textSecondary} fontSize="7" fontFamily="monospace">TEMP: <tspan fill={tempColor(t)} fontWeight="bold">{t.toFixed(0)}°C</tspan></text>
      <circle cx="387" cy="14" r="6" fill={statusColor(status)}>
        {status === 'OPERATIONAL' && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>}
      </circle>
      {status === 'BREAKDOWN' && <rect width="400" height="160" fill="rgba(239,68,68,0.15)"/>}
    </svg>
  );

  return (
    <svg viewBox="0 0 800 400" className="w-full h-full">
      <GridDefs id="cp-fg" color={c.gridColor}/>
      {c.bg !== 'transparent' && <rect width="800" height="400" fill={c.bg}/>}
      <rect width="800" height="400" fill="url(#cp-fg)" opacity="0.6"/>
      <rect width="800" height="44" fill={c.headerBg} opacity="0.97"/>
      <text x="18" y="29" fill={c.textPrimary} fontSize="17" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="112" y="29" fill={c.textSecondary} fontSize="13" fontFamily="monospace">COMPRESSOR HMI</text>
      <circle cx="658" cy="22" r="5" fill={statusColor(status)}/>
      <text x="776" y="27" fill={statusColor(status)} fontSize="12" textAnchor="end" fontFamily="monospace" fontWeight="bold">{status}</text>
      <g transform="translate(18,52)">
        {[{l:'MOTOR ON',c:'#fbbf24',t:'#1e3a5f',cmd:'START'},{l:'LOAD',c:'#06b6d4',t:'white',cmd:'START'},{l:'AUTO',c:'#3b82f6',t:'white',cmd:'START'},{l:'UNLOAD',c:'#6b7280',t:'white',cmd:'PAUSE'},{l:'STOP',c:'#ef4444',t:'white',cmd:'STOP'}].map((b,i) => (
          <g key={b.l} transform={`translate(${i*85},0)`} style={{cursor:'pointer'}} onClick={() => onCommand?.(b.cmd, b.l)}>
            <rect width="78" height="28" fill={b.c} rx="4" opacity="0.9"/>
            <text x="39" y="18" fill={b.t} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{b.l}</text>
          </g>
        ))}
      </g>
      {/* Motor */}
      <rect x="50" y="130" width="110" height="110" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="3" rx="8" opacity="0.9"/>
      <text x="105" y="183" fill="white" fontSize="13" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MOTOR</text>
      <g transform="translate(105,220)">
        <circle r="22" fill={c.darkSurface} stroke="#fbbf24" strokeWidth="3"/>
        <g transform={`rotate(${screwAngle})`}>
          <line x1="0" y1="-18" x2="0" y2="18" stroke="#fbbf24" strokeWidth="2.5"/>
          <line x1="-18" y1="0" x2="18" y2="0" stroke="#fbbf24" strokeWidth="2.5"/>
        </g>
      </g>
      {/* Screw Compressor Unit */}
      <rect x="160" y="140" width="160" height="90" fill={isDark?'#1e40af':'#3b82f6'} stroke={c.machineBlueStroke} strokeWidth="2" rx="6" opacity="0.9"/>
      <text x="240" y="168" fill="white" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">ROTARY SCREW</text>
      <g transform="translate(240,205)">
        <ellipse rx="45" ry="22" fill={c.darkSurface} stroke="#fbbf24" strokeWidth="2"/>
        {[0,30,60,90,120,150].map((a,i) => (
          <ellipse key={i} rx="32" ry="14" fill="none" stroke="#06b6d4" strokeWidth="1.5" transform={`rotate(${a + screwAngle * 0.5})`} opacity="0.6"/>
        ))}
      </g>
      {/* Inlet/Outlet pipes */}
      <rect x="40" y="185" width="12" height="40" fill={isDark?'#334155':'#94a3b8'} rx="2"/>
      <rect x="320" y="185" width="60" height="12" fill={isDark?'#334155':'#94a3b8'} rx="2"/>
      {/* Separator */}
      <rect x="380" y="140" width="70" height="90" fill={isDark?'#374151':'#94a3b8'} stroke={c.metalStroke} strokeWidth="2" rx="4"/>
      <text x="415" y="188" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">SEP</text>
      {/* Receiver Tank */}
      <ellipse cx="510" cy="185" rx="55" ry="80" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="3"/>
      <text x="510" y="180" fill="white" fontSize="13" textAnchor="middle" fontFamily="monospace" fontWeight="bold">RECEIVER</text>
      <text x="510" y="198" fill="#a5f3fc" fontSize="10" textAnchor="middle" fontFamily="monospace">TANK</text>
      {/* Pressure gauge */}
      <circle cx="510" cy="110" r="20" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="2"/>
      <text x="510" y="107" fill={c.textPrimary} fontSize="8" textAnchor="middle" fontFamily="monospace">{pressure.toFixed(0)}</text>
      <text x="510" y="120" fill={c.textSecondary} fontSize="7" textAnchor="middle" fontFamily="monospace">PSI</text>
      {/* Outlet pipe */}
      <rect x="565" y="180" width="15" height="60" fill={isDark?'#334155':'#94a3b8'} rx="2"/>
      <DataPanel x={578} y={50} items={[
        {label:'TANK PRESS.',value:pressure.toFixed(1),unit:'PSI',color:'#06b6d4'},
        {label:'FLOW RATE',value:flow.toFixed(1),unit:'cfm',color:'#22c55e'},
        {label:'TEMPERATURE',value:t.toFixed(1),unit:'°C',color:tempColor(t)},
        {label:'RUNTIME',value:runtime.toFixed(0),unit:'hrs',color:'#a78bfa'},
        {label:'LOAD',value:l.toFixed(0),unit:'%',color:loadColor(l)},
      ]} panelBg={c.panelBg} panelBorder={c.panelBorder} textPrimary={c.textPrimary} textSecondary={c.textSecondary} load={l}/>
      <g transform="translate(18,362)">
        {['PRESSURE','FLOW','TEMP','RUNTIME','ALARMS','SETTINGS'].map((tab,i) => (
          <g key={tab} transform={`translate(${i*77},0)`} style={{cursor:'pointer'}}>
            <rect width="72" height="30" fill={i===0?c.tabActiveBg:c.tabBg} stroke={i===0?c.machineBlueStroke:c.panelBorder} strokeWidth="1" rx="4"/>
            <text x="36" y="20" fill={i===0?'white':c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">{tab}</text>
          </g>
        ))}
      </g>
      {status==='BREAKDOWN'&&<><rect width="800" height="400" fill="rgba(239,68,68,0.12)"/><rect x="280" y="168" width="240" height="58" fill="rgba(127,0,0,0.87)" rx="8"/><text x="400" y="194" textAnchor="middle" fill="#fca5a5" fontSize="14" fontWeight="bold" fontFamily="monospace">⚠ FAULT DETECTED</text></>}
      {status==='MAINTENANCE'&&<><rect width="800" height="400" fill="rgba(245,158,11,0.08)"/><rect x="292" y="174" width="216" height="50" fill="rgba(80,55,0,0.87)" rx="8"/><text x="400" y="205" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">🔧 IN MAINTENANCE</text></>}
    </svg>
  );
}

// ─── Conveyor Schematic ───────────────────────────────────────────────────────
function ConveyorSchematic({ speed, count, load: l, runtime, status, isDark, compact, onCommand }: any) {
  const c = useThemeColors(isDark);
  const [beltOffset, setBeltOffset] = useState(0);
  useEffect(() => {
    if (status !== 'OPERATIONAL') return;
    const iv = setInterval(() => setBeltOffset(o => (o + speed * 10 + 1) % 60), 50);
    return () => clearInterval(iv);
  }, [speed, status]);

  const boxes = [0, 80, 160, 250, 340];

  if (compact) return (
    <svg viewBox="0 0 400 160" className="w-full h-full">
      <GridDefs id="cv-cg" color={c.gridColor} size={20}/>
      {c.bg !== 'transparent' && <rect width="400" height="160" fill={c.bg}/>}
      <rect width="400" height="160" fill="url(#cv-cg)" opacity="0.6"/>
      <text x="8" y="17" fill={c.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="72" y="17" fill={c.textSecondary} fontSize="9" fontFamily="monospace">CONVEYOR</text>
      {/* Motor */}
      <rect x="12" y="85" width="45" height="35" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2" rx="3" opacity="0.9"/>
      {/* Drive roller */}
      <ellipse cx="57" cy="102" rx="14" ry="14" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="2"/>
      <ellipse cx="57" cy="102" rx="6" ry="6" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2">
        {status==='OPERATIONAL'&&<animateTransform attributeName="transform" type="rotate" from={`0 57 102`} to={`360 57 102`} dur="1s" repeatCount="indefinite"/>}
      </ellipse>
      {/* Belt */}
      <rect x="57" y="95" width="270" height="8" fill={isDark?'#374151':'#94a3b8'} opacity="0.8"/>
      <rect x="57" y="110" width="270" height="8" fill={isDark?'#374151':'#94a3b8'} opacity="0.5"/>
      {/* Tail roller */}
      <ellipse cx="327" cy="102" rx="14" ry="14" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="2"/>
      {/* Boxes */}
      {[60,115,170,225].map((x,i) => (
        <rect key={i} x={(x + beltOffset) % 290 + 57} y="82" width="26" height="22" fill={['#22c55e','#f97316','#635bff','#06b6d4'][i]} rx="2" opacity="0.9"/>
      ))}
      {/* Info */}
      <rect x="290" y="8" width="105" height="64" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="1" rx="4" opacity="0.95"/>
      <text x="342" y="22" textAnchor="middle" fill={c.textPrimary} fontSize="8" fontWeight="bold" fontFamily="monospace">LIVE</text>
      <text x="298" y="35" fill={c.textSecondary} fontSize="7" fontFamily="monospace">SPD: <tspan fill="#06b6d4" fontWeight="bold">{speed.toFixed(3)}</tspan></text>
      <text x="298" y="47" fill={c.textSecondary} fontSize="7" fontFamily="monospace">CNT: <tspan fill="#22c55e" fontWeight="bold">{count}</tspan></text>
      <text x="298" y="59" fill={c.textSecondary} fontSize="7" fontFamily="monospace">LOAD: <tspan fill={loadColor(l)} fontWeight="bold">{l.toFixed(0)}%</tspan></text>
      <circle cx="387" cy="14" r="6" fill={statusColor(status)}>
        {status === 'OPERATIONAL' && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>}
      </circle>
      {status === 'BREAKDOWN' && <rect width="400" height="160" fill="rgba(239,68,68,0.15)"/>}
    </svg>
  );

  return (
    <svg viewBox="0 0 800 400" className="w-full h-full">
      <GridDefs id="cv-fg" color={c.gridColor}/>
      {c.bg !== 'transparent' && <rect width="800" height="400" fill={c.bg}/>}
      <rect width="800" height="400" fill="url(#cv-fg)" opacity="0.6"/>
      <rect width="800" height="44" fill={c.headerBg} opacity="0.97"/>
      <text x="18" y="29" fill={c.textPrimary} fontSize="17" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="112" y="29" fill={c.textSecondary} fontSize="13" fontFamily="monospace">CONVEYOR HMI</text>
      <circle cx="658" cy="22" r="5" fill={statusColor(status)}/>
      <text x="776" y="27" fill={statusColor(status)} fontSize="12" textAnchor="end" fontFamily="monospace" fontWeight="bold">{status}</text>
      <g transform="translate(18,52)">
        {[{l:'MOTOR ON',c:'#fbbf24',t:'#1e3a5f',cmd:'START'},{l:'FWD',c:'#22c55e',t:'white',cmd:'START'},{l:'REV',c:'#06b6d4',t:'white',cmd:'PAUSE'},{l:'SLOW',c:'#6b7280',t:'white',cmd:'PAUSE'},{l:'STOP',c:'#ef4444',t:'white',cmd:'STOP'}].map((b,i) => (
          <g key={b.l} transform={`translate(${i*85},0)`} style={{cursor:'pointer'}} onClick={() => onCommand?.(b.cmd, b.l)}>
            <rect width="78" height="28" fill={b.c} rx="4" opacity="0.9"/>
            <text x="39" y="18" fill={b.t} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{b.l}</text>
          </g>
        ))}
      </g>
      {/* Motor */}
      <rect x="40" y="185" width="80" height="70" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="3" rx="6" opacity="0.9"/>
      <text x="80" y="222" fill="white" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MOTOR</text>
      {/* Drive roller */}
      <ellipse cx="122" cy="220" rx="24" ry="24" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="3"/>
      <ellipse cx="122" cy="220" rx="12" ry="12" fill={c.machineBlue} stroke={c.machineBlueStroke} strokeWidth="2">
        {status==='OPERATIONAL'&&<animateTransform attributeName="transform" type="rotate" from="0 122 220" to="360 122 220" dur="0.8s" repeatCount="indefinite"/>}
      </ellipse>
      {/* Belt top & bottom */}
      <rect x="122" y="200" width="400" height="18" fill={isDark?'#374151':'#cbd5e1'} opacity="0.9"/>
      <rect x="122" y="230" width="400" height="18" fill={isDark?'#374151':'#cbd5e1'} opacity="0.5"/>
      {/* Belt stripes (animated) */}
      {[0,60,120,180,240,300,360,420].map((x,i) => (
        <rect key={i} x={122 + ((x + beltOffset * 5) % 400)} y="200" width="20" height="18" fill={isDark?'#4b5563':'#94a3b8'} opacity="0.4"/>
      ))}
      {/* Tail roller */}
      <ellipse cx="522" cy="220" rx="24" ry="24" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="3"/>
      {/* Boxes on belt */}
      {boxes.map((x,i) => (
        <g key={i} transform={`translate(${122 + ((x + beltOffset * 5) % 400)}, 175)`}>
          <rect width="44" height="28" fill={['#22c55e','#f97316','#635bff','#06b6d4','#f59e0b'][i]} rx="3" opacity="0.9"/>
          <text x="22" y="18" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace">P{i+1}</text>
        </g>
      ))}
      {/* Support legs */}
      {[150,250,350,450].map((x,i) => (
        <rect key={i} x={x} y="248" width="10" height="60" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1" rx="1"/>
      ))}
      {/* Sensors */}
      <rect x="200" y="180" width="8" height="20" fill="#ef4444" rx="1"/>
      <rect x="400" y="180" width="8" height="20" fill={statusColor(status)} rx="1"/>
      <text x="204" y="175" fill={c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">S1</text>
      <text x="404" y="175" fill={c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">S2</text>
      <DataPanel x={578} y={50} items={[
        {label:'BELT SPEED',value:speed.toFixed(3),unit:'m/s',color:'#06b6d4'},
        {label:'PARTS COUNT',value:count.toString(),unit:'/min',color:'#22c55e'},
        {label:'RUNTIME',value:runtime.toFixed(0),unit:'hrs',color:'#a78bfa'},
        {label:'LOAD',value:l.toFixed(0),unit:'%',color:loadColor(l)},
      ]} panelBg={c.panelBg} panelBorder={c.panelBorder} textPrimary={c.textPrimary} textSecondary={c.textSecondary} load={l}/>
      <g transform="translate(18,362)">
        {['SPEED','PARTS','SENSORS','LOAD','ALARMS','SETTINGS'].map((tab,i) => (
          <g key={tab} transform={`translate(${i*77},0)`} style={{cursor:'pointer'}}>
            <rect width="72" height="30" fill={i===0?c.tabActiveBg:c.tabBg} stroke={i===0?c.machineBlueStroke:c.panelBorder} strokeWidth="1" rx="4"/>
            <text x="36" y="20" fill={i===0?'white':c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">{tab}</text>
          </g>
        ))}
      </g>
      {status==='BREAKDOWN'&&<><rect width="800" height="400" fill="rgba(239,68,68,0.12)"/><rect x="280" y="168" width="240" height="58" fill="rgba(127,0,0,0.87)" rx="8"/><text x="400" y="194" textAnchor="middle" fill="#fca5a5" fontSize="14" fontWeight="bold" fontFamily="monospace">⚠ FAULT DETECTED</text></>}
      {status==='MAINTENANCE'&&<><rect width="800" height="400" fill="rgba(245,158,11,0.08)"/><rect x="292" y="174" width="216" height="50" fill="rgba(80,55,0,0.87)" rx="8"/><text x="400" y="205" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">🔧 IN MAINTENANCE</text></>}
    </svg>
  );
}

// ─── Generic Machine Schematic ────────────────────────────────────────────────
function GenericSchematic({ machineName, speed, load: l, temp: t, efficiency, status, isDark, compact, onCommand }: any) {
  const c = useThemeColors(isDark);
  const [rot, setRot] = useState(0);
  useEffect(() => {
    if (status !== 'OPERATIONAL') return;
    const iv = setInterval(() => setRot(r => (r + 2) % 360), 30);
    return () => clearInterval(iv);
  }, [status]);

  if (compact) return (
    <svg viewBox="0 0 400 160" className="w-full h-full">
      <GridDefs id="gm-cg" color={c.gridColor} size={20}/>
      {c.bg !== 'transparent' && <rect width="400" height="160" fill={c.bg}/>}
      <rect width="400" height="160" fill="url(#gm-cg)" opacity="0.6"/>
      <text x="8" y="17" fill={c.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="72" y="17" fill={c.textSecondary} fontSize="8" fontFamily="monospace">{machineName?.slice(0,18)}</text>
      {/* Body */}
      <rect x="28" y="30" width="200" height="112" fill={isDark?'#1e3a5f':'#dbeafe'} stroke={c.panelBorder} strokeWidth="2" rx="6" opacity="0.9"/>
      {/* Panel */}
      <rect x="38" y="40" width="70" height="50" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="1" rx="3"/>
      <circle cx="58" cy="58" r="8" fill={statusColor(status)} opacity="0.9"/>
      <circle cx="82" cy="58" r="8" fill={status==='OPERATIONAL'?'#06b6d4':'#374151'} opacity="0.9"/>
      <rect x="42" y="76" width="60" height="8" fill={status==='OPERATIONAL'?'#22c55e':'#374151'} rx="2"/>
      {/* Motor */}
      <g transform="translate(170,90)">
        <circle r="28" fill={isDark?'#0f172a':'#eff6ff'} stroke={c.machineBlueStroke} strokeWidth="2"/>
        <g transform={`rotate(${rot})`}>
          <line x1="0" y1="-22" x2="0" y2="22" stroke={c.machineBlue} strokeWidth="3"/>
          <line x1="-22" y1="0" x2="22" y2="0" stroke={c.machineBlue} strokeWidth="3"/>
        </g>
        <circle r="7" fill={c.machineBlue}/>
      </g>
      {/* Info */}
      <rect x="248" y="8" width="147" height="80" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="1" rx="4" opacity="0.95"/>
      <text x="322" y="22" textAnchor="middle" fill={c.textPrimary} fontSize="8" fontWeight="bold" fontFamily="monospace">LIVE DATA</text>
      <text x="256" y="36" fill={c.textSecondary} fontSize="7" fontFamily="monospace">EFF: <tspan fill="#22c55e" fontWeight="bold">{efficiency?.toFixed(0)}%</tspan></text>
      <text x="256" y="48" fill={c.textSecondary} fontSize="7" fontFamily="monospace">LOAD: <tspan fill={loadColor(l)} fontWeight="bold">{l.toFixed(0)}%</tspan></text>
      <text x="256" y="60" fill={c.textSecondary} fontSize="7" fontFamily="monospace">TEMP: <tspan fill={tempColor(t)} fontWeight="bold">{t.toFixed(0)}°C</tspan></text>
      <text x="256" y="72" fill={c.textSecondary} fontSize="7" fontFamily="monospace">SPD: <tspan fill="#06b6d4" fontWeight="bold">{speed?.toFixed(0)}</tspan></text>
      <circle cx="387" cy="14" r="6" fill={statusColor(status)}>
        {status === 'OPERATIONAL' && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>}
      </circle>
      {status === 'BREAKDOWN' && <rect width="400" height="160" fill="rgba(239,68,68,0.15)"/>}
    </svg>
  );

  return (
    <svg viewBox="0 0 800 400" className="w-full h-full">
      <GridDefs id="gm-fg" color={c.gridColor}/>
      {c.bg !== 'transparent' && <rect width="800" height="400" fill={c.bg}/>}
      <rect width="800" height="400" fill="url(#gm-fg)" opacity="0.6"/>
      <rect width="800" height="44" fill={c.headerBg} opacity="0.97"/>
      <text x="18" y="29" fill={c.textPrimary} fontSize="17" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
      <text x="112" y="29" fill={c.textSecondary} fontSize="12" fontFamily="monospace">{machineName?.toUpperCase()?.slice(0,28)}</text>
      <circle cx="658" cy="22" r="5" fill={statusColor(status)}/>
      <text x="776" y="27" fill={statusColor(status)} fontSize="12" textAnchor="end" fontFamily="monospace" fontWeight="bold">{status}</text>
      <g transform="translate(18,52)">
        {[{l:'START',c:'#22c55e',t:'white',cmd:'START'},{l:'STOP',c:'#6b7280',t:'white',cmd:'STOP'},{l:'RESET',c:'#3b82f6',t:'white',cmd:'START'},{l:'E-STOP',c:'#ef4444',t:'white',cmd:'EMERGENCY_STOP'}].map((b,i) => (
          <g key={b.l} transform={`translate(${i*90},0)`} style={{cursor:'pointer'}} onClick={() => onCommand?.(b.cmd, b.l)}>
            <rect width="82" height="28" fill={b.c} rx="4" opacity="0.9"/>
            <text x="41" y="18" fill={b.t} fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{b.l}</text>
          </g>
        ))}
      </g>
      {/* Machine Body */}
      <rect x="50" y="88" width="490" height="245" fill={isDark?'#1e3a5f':'#dbeafe'} stroke={c.panelBorder} strokeWidth="3" rx="10" opacity="0.85"/>
      {/* Control Panel */}
      <rect x="70" y="108" width="150" height="100" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="2" rx="6"/>
      <circle cx="100" cy="135" r="14" fill={statusColor(status)} opacity="0.9"/>
      <circle cx="140" cy="135" r="14" fill={status==='OPERATIONAL'?'#06b6d4':'#374151'} opacity="0.9"/>
      <circle cx="180" cy="135" r="14" fill={status==='OPERATIONAL'?'#fbbf24':'#374151'} opacity="0.9"/>
      <text x="100" y="140" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">RUN</text>
      <text x="140" y="140" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">PWR</text>
      <text x="180" y="140" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">FLT</text>
      <rect x="80" y="162" width="130" height="30" fill={status==='OPERATIONAL'?'#22c55e':'#374151'} rx="4" opacity="0.8"/>
      <text x="145" y="182" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">{status==='OPERATIONAL'?'RUNNING':'STOPPED'}</text>
      {/* Processing area */}
      <rect x="240" y="108" width="260" height="200" fill={isDark?'#0f172a':'#eff6ff'} stroke={c.panelBorder} strokeWidth="1" rx="6"/>
      {/* Arrow in */}
      <polygon points="50,195 90,180 90,210" fill="#06b6d4" opacity="0.7"/>
      <text x="68" y="230" fill={c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">IN</text>
      {/* Motor */}
      <g transform="translate(370,208)">
        <circle r="50" fill={isDark?'#1e3a5f':'#dbeafe'} stroke={c.panelBorder} strokeWidth="2"/>
        <circle r="40" fill={c.panelBg} stroke={c.machineBlueStroke} strokeWidth="2"/>
        <g transform={`rotate(${rot})`}>
          <line x1="0" y1="-35" x2="0" y2="35" stroke={c.machineBlue} strokeWidth="5"/>
          <line x1="-35" y1="0" x2="35" y2="0" stroke={c.machineBlue} strokeWidth="5"/>
        </g>
        <circle r="12" fill={c.machineBlue}/>
        <text x="0" y="65" fill={c.textSecondary} fontSize="10" textAnchor="middle" fontFamily="monospace">DRIVE</text>
      </g>
      {/* Arrow out */}
      <polygon points="540,195 500,180 500,210" fill="#22c55e" opacity="0.7"/>
      <text x="522" y="230" fill={c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">OUT</text>
      <DataPanel x={578} y={50} items={[
        {label:'SPEED',value:speed?.toFixed(0)||'0',unit:'rpm',color:'#06b6d4'},
        {label:'EFFICIENCY',value:efficiency?.toFixed(0)||'0',unit:'%',color:'#22c55e'},
        {label:'TEMPERATURE',value:t.toFixed(1),unit:'°C',color:tempColor(t)},
        {label:'LOAD',value:l.toFixed(0),unit:'%',color:loadColor(l)},
      ]} panelBg={c.panelBg} panelBorder={c.panelBorder} textPrimary={c.textPrimary} textSecondary={c.textSecondary} load={l}/>
      <g transform="translate(18,362)">
        {['DIAGRAM','PROGRAM','ALARMS','I/O','SETTINGS','HELP'].map((tab,i) => (
          <g key={tab} transform={`translate(${i*77},0)`} style={{cursor:'pointer'}}>
            <rect width="72" height="30" fill={i===0?c.tabActiveBg:c.tabBg} stroke={i===0?c.machineBlueStroke:c.panelBorder} strokeWidth="1" rx="4"/>
            <text x="36" y="20" fill={i===0?'white':c.textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">{tab}</text>
          </g>
        ))}
      </g>
      {status==='BREAKDOWN'&&<><rect width="800" height="400" fill="rgba(239,68,68,0.12)"/><rect x="280" y="168" width="240" height="58" fill="rgba(127,0,0,0.87)" rx="8"/><text x="400" y="194" textAnchor="middle" fill="#fca5a5" fontSize="14" fontWeight="bold" fontFamily="monospace">⚠ FAULT DETECTED</text><text x="400" y="215" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">CHECK MACHINE LOG</text></>}
      {status==='MAINTENANCE'&&<><rect width="800" height="400" fill="rgba(245,158,11,0.08)"/><rect x="292" y="174" width="216" height="50" fill="rgba(80,55,0,0.87)" rx="8"/><text x="400" y="205" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">🔧 IN MAINTENANCE</text></>}
    </svg>
  );
}

// ─── Main Export: MachineHMISchematic ─────────────────────────────────────────
export function MachineHMISchematic({
  category, machineName, status, liveData, compact = false, isDark = false, machineId, onCommand
}: HMISchematicProps) {
  const machineStatus = status as 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  const temp = liveData?.temp ?? 25;
  const load = liveData?.load ?? 0;
  const rpm  = liveData?.rpm ?? 0;
  const pres = liveData?.pressure ?? 0;
  const name = machineName.toLowerCase();

  const cls = `relative w-full h-full overflow-hidden${!isDark && !compact ? ' rounded-lg' : ''}`;

  // CNC Lathe
  if (category === 'CNC_LATHE' || name.includes('lathe')) {
    return (
      <div className={cls}>
        <CNCLatheSchematic rpm={rpm} feed={rpm*0.14} xPos={50+load*0.3} zPos={-(rpm*0.065+load*0.3)} temp={temp} load={load} pressure={pres} status={machineStatus} isDark={isDark} compact={compact} onCommand={onCommand}/>
      </div>
    );
  }
  // CNC Mill
  if (category === 'CNC_MILL' || name.includes('mill') || name.includes('milling')) {
    return (
      <div className={cls}>
        <CNCMillSchematic rpm={rpm} feed={rpm*0.12} xPos={30+load*0.2} yPos={15+load*0.1} zPos={-(rpm*0.05)} temp={temp} load={load} status={machineStatus} isDark={isDark} compact={compact} onCommand={onCommand}/>
      </div>
    );
  }
  // Press Brake / Hydraulic
  if (name.includes('press') || name.includes('hydraulic') || category === 'PRESS' || category === 'HYDRAULIC') {
    return (
      <div className={cls}>
        <PressBrakeSchematic force={pres*9.2} angle={45+load*0.3} stroke={load*2.5} thickness={5+load*0.05} temp={temp} load={load} pressure={pres} status={machineStatus} isDark={isDark} compact={compact} onCommand={onCommand}/>
      </div>
    );
  }
  // Compressor
  if (category === 'COMPRESSOR' || name.includes('compressor')) {
    return (
      <div className={cls}>
        <CompressorSchematic pressure={pres*1.15} flow={load*0.85} temp={temp} runtime={rpm*0.01} load={load} status={machineStatus} isDark={isDark} compact={compact} onCommand={onCommand}/>
      </div>
    );
  }
  // Conveyor
  if (category === 'CONVEYOR' || name.includes('conveyor')) {
    return (
      <div className={cls}>
        <ConveyorSchematic speed={rpm*0.00028} count={Math.floor(load*0.5)} load={load} runtime={rpm*0.01} status={machineStatus} isDark={isDark} compact={compact} onCommand={onCommand}/>
      </div>
    );
  }
  // Welder — reuse generic with welder label
  // Injection Mold — reuse generic
  // Assembly Robot — reuse generic
  // Default
  return (
    <div className={cls}>
      <GenericSchematic machineName={machineName} speed={rpm} load={load} temp={temp} efficiency={load > 0 ? load : 85} status={machineStatus} isDark={isDark} compact={compact} onCommand={onCommand}/>
    </div>
  );
}

export default MachineHMISchematic;