'use client';

import { useState, useEffect } from 'react';

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

function useTC(isDark: boolean) {
  return {
    bg:           isDark ? '#0a1628' : 'transparent',
    headerBg:     isDark ? '#0f172a' : '#dbeafe',
    panelBg:      isDark ? '#0f172a' : '#f0f7ff',
    panelBorder:  isDark ? '#1e3a5f' : '#bfdbfe',
    textPrimary:  isDark ? '#67e8f9' : '#1e40af',
    textSecond:   isDark ? '#94a3b8' : '#334155',
    machineBlue:  isDark ? '#0891b2' : '#2563eb',
    mStroke:      isDark ? '#22d3ee' : '#60a5fa',
    metalFill:    isDark ? '#374151' : '#9ca3af',
    metalStroke:  isDark ? '#6b7280' : '#6b7280',
    svgBg:        isDark ? '#0f172a' : '#e8f0fe',
    darkSurf:     isDark ? '#1e3a5f' : '#dbeafe',
  };
}

function DB({ label, value, unit, max, color, isDark }: {
  label: string; value: number; unit: string; max: number; color: string; isDark: boolean;
}) {
  const c = useTC(isDark);
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ color: c.textSecond, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
        <span style={{ color, fontSize: 11, fontWeight: 700 }}>{value.toFixed(1)}{unit}</span>
      </div>
      <div style={{ background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 3, height: 6 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s' }}/>
      </div>
    </div>
  );
}

function HBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const [p, setP] = useState(false);
  return (
    <button onMouseDown={() => setP(true)} onMouseUp={() => { setP(false); onClick(); }} onMouseLeave={() => setP(false)}
      style={{ background: p ? color : 'transparent', border: `1.5px solid ${color}`, color: p ? '#000' : color,
        borderRadius: 3, padding: '4px 9px', fontSize: 9, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.7,
        textTransform: 'uppercase', transition: 'all 0.1s', fontFamily: 'monospace', whiteSpace: 'nowrap' }}
    >{label}</button>
  );
}

function ES({ onClick }: { onClick: () => void }) {
  const [b, setB] = useState(false);
  useEffect(() => { const t = setInterval(() => setB(x => !x), 600); return () => clearInterval(t); }, []);
  return (
    <button onClick={onClick}
      style={{ background: b ? '#ef4444' : '#7f1d1d', border: '2px solid #ef4444', color: '#fff',
        borderRadius: 3, padding: '4px 10px', fontSize: 9, fontWeight: 900, cursor: 'pointer',
        letterSpacing: 1, fontFamily: 'monospace', boxShadow: '0 0 8px #ef444480' }}>E-STOP</button>
  );
}

function Panel({ isDark, compact, title, sc, sl, children }: {
  isDark: boolean; compact: boolean; title: string; sc: string; sl: string; children: React.ReactNode;
}) {
  const c = useTC(isDark);
  return (
    <div style={{ background: c.bg, fontFamily: 'monospace', width: '100%', height: '100%',
      minHeight: compact ? 160 : 520, border: `1px solid ${c.panelBorder}`, borderRadius: 10, overflow: 'hidden',
      display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: c.headerBg, borderBottom: `1px solid ${c.panelBorder}`,
        padding: compact ? '3px 8px' : '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: c.textPrimary, fontSize: compact ? 9 : 11, fontWeight: 700, letterSpacing: 1.2 }}>
          MYNCEL | {title.toUpperCase()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: sc, fontSize: 8, letterSpacing: 1 }}>{sl}</span>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: sc, boxShadow: `0 0 6px ${sc}`, display: 'inline-block' }}/>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}


// === CNC LATHE ===
function CNCLathe({ isDark, compact, status, rpm, feed, xPos, zPos, temp, load, pressure, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="CNC LATHE" sc={sc} sl={status}>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 1, padding: compact ? 4 : 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 200 140" style={{ width: '100%', height: compact ? 120 : 300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="10" y="100" width="180" height="12" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="12" y="55" width="45" height="50" rx="3" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <text x="34" y="75" textAnchor="middle" fill={c.textPrimary} fontSize="9" fontWeight="700">HEAD</text>
            <text x="34" y="85" textAnchor="middle" fill={c.textPrimary} fontSize="8">STOCK</text>
            <circle cx="57" cy="78" r="14" fill="none" stroke={c.mStroke} strokeWidth="1.5"/>
            <circle cx="57" cy="78" r="9" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            {[0,120,240].map((a,i) => { const r=(a*Math.PI)/180; return <rect key={i} x={57+Math.cos(r)*5-2} y={78+Math.sin(r)*5-3} width="4" height="6" rx="1" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="0.5" transform={`rotate(${a} ${57+Math.cos(r)*5} ${78+Math.sin(r)*5})`}/>; })}
            <rect x="57" y="70" width="60" height="16" rx="2" fill={isDark?'#374151':'#bfdbfe'} stroke={c.mStroke} strokeWidth="1"/>
            <rect x="140" y="62" width="30" height="40" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1"/>
            <line x1="140" y1="78" x2="120" y2="78" stroke={c.mStroke} strokeWidth="1.5" strokeDasharray="3,2"/>
            <polygon points="110,72 120,76 110,80" fill={isDark?'#f59e0b':'#d97706'} stroke="#f59e0b" strokeWidth="0.5"/>
            <text x="90" y="58" fill={c.textSecond} fontSize="9">X:{(xPos??0).toFixed(1)}mm Z:{(zPos??0).toFixed(1)}mm</text>
            <text x="10" y="130" fill={c.textSecond} fontSize="9">FEED:{(feed??0).toFixed(0)}mm/min</text>
            <text x="130" y="130" fill={c.textPrimary} fontSize="9" fontWeight="700">RPM:{(rpm??0).toFixed(0)}</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="RPM" value={rpm??0} unit="" max={4000} color="#22d3ee" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={120} color={(temp??0)>90?'#ef4444':'#f59e0b'} isDark={isDark}/>
            <DB label="Coolant" value={pressure??0} unit="bar" max={10} color="#60a5fa" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="PAUSE" color="#f59e0b" onClick={()=>onCommand?.('PAUSE','PAUSE')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="HOME" color="#60a5fa" onClick={()=>onCommand?.('HOME_AXES','HOME')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === CNC MILL ===
function CNCMill({ isDark, compact, status, rpm, feed, xPos, yPos, zPos, temp, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="CNC MILL" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="150" y="10" width="35" height="115" rx="3" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="110" y="15" width="50" height="35" rx="3" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="127" y="50" width="16" height="25" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1"/>
            <polygon points="130,75 135,85 132,85 131,75" fill={isDark?'#f59e0b':'#d97706'} stroke="#f59e0b" strokeWidth="0.5"/>
            <polygon points="135,75 140,85 137,85 136,75" fill={isDark?'#f59e0b':'#d97706'} stroke="#f59e0b" strokeWidth="0.5"/>
            {isOp && <circle cx="135" cy="78" r="6" fill="none" stroke={c.mStroke} strokeWidth="1" strokeDasharray="2,2"><animateTransform attributeName="transform" type="rotate" from="0 135 78" to="360 135 78" dur={`${Math.max(0.2,1.5-(rpm??0)/4000)}s`} repeatCount="indefinite"/></circle>}
            <rect x="15" y="95" width="120" height="10" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="20" y="105" width="110" height="18" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1"/>
            {[35,60,85,110].map((x,i)=><line key={i} x1={x} y1="105" x2={x} y2="123" stroke={c.metalStroke} strokeWidth="1"/>)}
            <rect x="50" y="88" width="60" height="8" rx="1" fill={isDark?'#374151':'#bfdbfe'} stroke={c.mStroke} strokeWidth="0.8"/>
            <text x="10" y="135" fill={c.textSecond} fontSize="9">X:{(xPos??0).toFixed(1)} Y:{(yPos??0).toFixed(1)} Z:{(zPos??0).toFixed(1)}</text>
            <text x="155" y="135" fill={c.textPrimary} fontSize="9" fontWeight="700">RPM:{(rpm??0).toFixed(0)}</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="RPM" value={rpm??0} unit="" max={8000} color="#22d3ee" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={120} color={(temp??0)>90?'#ef4444':'#f59e0b'} isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="PAUSE" color="#f59e0b" onClick={()=>onCommand?.('PAUSE','PAUSE')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="HOME" color="#60a5fa" onClick={()=>onCommand?.('HOME_AXES','HOME')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === PRESS BRAKE ===
function PressBrake({ isDark, compact, status, force, angle, stroke, temp, load, pressure, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  const ramY = 55 + ((stroke??0)/200)*30;
  return (
    <Panel isDark={isDark} compact={compact} title="PRESS BRAKE" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="10" y="10" width="20" height="120" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <rect x="170" y="10" width="20" height="120" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <rect x="10" y="10" width="180" height="18" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="55" y="28" width="14" height="22" rx="2" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1"/>
            <rect x="131" y="28" width="14" height="22" rx="2" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1"/>
            {isOp && <><line x1="62" y1="22" x2="62" y2="28" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2,2"><animate attributeName="strokeDashoffset" from="0" to="8" dur="0.5s" repeatCount="indefinite"/></line><line x1="138" y1="22" x2="138" y2="28" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="2,2"><animate attributeName="strokeDashoffset" from="0" to="8" dur="0.5s" repeatCount="indefinite"/></line></>}
            <rect x="30" y={ramY} width="140" height="14" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.5"/>
            <polygon points={`90,${ramY+14} 110,${ramY+14} 100,${ramY+22}`} fill={isDark?'#f59e0b':'#d97706'} stroke="#f59e0b" strokeWidth="0.8"/>
            <rect x="35" y="105" width="130" height="5" rx="1" fill={isDark?'#60a5fa':'#bfdbfe'} stroke={c.mStroke} strokeWidth="0.8"/>
            <path d="M50,110 L80,110 L90,120 L110,120 L120,110 L150,110 L150,118 L50,118 Z" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <text x="10" y="133" fill={c.textSecond} fontSize="9">FORCE:{(force??0).toFixed(0)}kN ANGLE:{(angle??0).toFixed(1)}deg</text>
            <text x="150" y="133" fill={c.textPrimary} fontSize="9" fontWeight="700">P:{(pressure??0).toFixed(0)}bar</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Force kN" value={force??0} unit="kN" max={1000} color="#22d3ee" isDark={isDark}/>
            <DB label="Pressure" value={pressure??0} unit="bar" max={200} color="#60a5fa" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={100} color={(temp??0)>80?'#ef4444':'#f59e0b'} isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="PRESS" color="#22c55e" onClick={()=>onCommand?.('START','PRESS')}/>
              <HBtn label="RETRACT" color="#60a5fa" onClick={()=>onCommand?.('RETRACT','RETRACT')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === WELDER / WELDING ROBOT ===
function Welder({ isDark, compact, status, current, voltage, wireSpeed, gasFlow, temp, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="WELDING ROBOT" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="70" y="110" width="40" height="15" rx="3" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="80" y="88" width="20" height="25" rx="3" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="88" y="55" width="10" height="38" rx="3" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <circle cx="93" cy="55" r="7" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1.2"/>
            <line x1="93" y1="55" x2="130" y2="40" stroke={c.mStroke} strokeWidth="8" strokeLinecap="round"/>
            <line x1="93" y1="55" x2="130" y2="40" stroke={c.darkSurf} strokeWidth="5" strokeLinecap="round"/>
            <circle cx="130" cy="40" r="6" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1.2"/>
            <line x1="130" y1="40" x2="155" y2="65" stroke={c.mStroke} strokeWidth="6" strokeLinecap="round"/>
            <line x1="130" y1="40" x2="155" y2="65" stroke={c.darkSurf} strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="158" cy="68" r="4" fill={isDark?'#f59e0b':'#d97706'} stroke="#f59e0b" strokeWidth="0.8"/>
            {isOp && <><circle cx="158" cy="74" r="3" fill="#fff9c4" opacity="0.9"><animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.15s" repeatCount="indefinite"/><animate attributeName="r" values="3;5;3" dur="0.15s" repeatCount="indefinite"/></circle><line x1="155" y1="72" x2="150" y2="80" stroke="#fbbf24" strokeWidth="1.5"><animate attributeName="opacity" values="0.8;0;0.8" dur="0.2s" repeatCount="indefinite"/></line><line x1="161" y1="72" x2="166" y2="80" stroke="#fbbf24" strokeWidth="1.5"><animate attributeName="opacity" values="0;0.8;0" dur="0.2s" repeatCount="indefinite"/></line></>}
            <rect x="120" y="78" width="60" height="8" rx="1" fill={isDark?'#374151':'#bfdbfe'} stroke={c.mStroke} strokeWidth="0.8"/>
            <rect x="110" y="85" width="80" height="6" rx="1" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="0.8"/>
            <circle cx="25" cy="35" r="18" fill="none" stroke={c.mStroke} strokeWidth="1.5"/>
            <circle cx="25" cy="35" r="10" fill={c.darkSurf} stroke={c.metalStroke} strokeWidth="1"/>
            <circle cx="25" cy="35" r="4" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="0.8"/>
            <text x="25" y="62" textAnchor="middle" fill={c.textSecond} fontSize="8">WIRE</text>
            <path d="M43,35 Q70,20 93,48" fill="none" stroke={c.metalStroke} strokeWidth="1.5" strokeDasharray="3,2"/>
            <rect x="8" y="70" width="14" height="40" rx="4" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1"/>
            <text x="10" y="133" fill={c.textSecond} fontSize="9">A:{(current??0).toFixed(0)} V:{(voltage??0).toFixed(0)} Wire:{(wireSpeed??0).toFixed(1)}m/min</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Current A" value={current??0} unit="A" max={400} color="#fbbf24" isDark={isDark}/>
            <DB label="Voltage V" value={voltage??0} unit="V" max={50} color="#22d3ee" isDark={isDark}/>
            <DB label="Wire m/min" value={wireSpeed??0} unit="m/min" max={20} color="#a78bfa" isDark={isDark}/>
            <DB label="Gas L/min" value={gasFlow??0} unit="L/min" max={25} color="#60a5fa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={120} color={(temp??0)>90?'#ef4444':'#f59e0b'} isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="WELD ON" color="#fbbf24" onClick={()=>onCommand?.('START','WELD ON')}/>
              <HBtn label="WELD OFF" color="#ef4444" onClick={()=>onCommand?.('STOP','WELD OFF')}/>
              <HBtn label="GAS ON" color="#60a5fa" onClick={()=>onCommand?.('GAS_ON','GAS ON')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === INJECTION MOLD ===
function InjMold({ isDark, compact, status, injPressure, clampForce, meltTemp, cycleTime, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="INJECTION MOLD" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="8" y="60" width="184" height="8" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="8" y="80" width="184" height="8" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="10" y="45" width="20" height="58" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="30" y="55" width="30" height="38" rx="2" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="90" y="55" width="30" height="38" rx="2" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="57" y="65" width="35" height="18" rx="2" fill={isOp?'#f59e0b':(isDark?'#1e3a5f':'#dbeafe')} stroke={c.mStroke} strokeWidth="0.8" opacity="0.7"/>
            <rect x="120" y="45" width="20" height="58" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="148" y="62" width="40" height="24" rx="3" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            {[158,170,180].map((x,i)=><rect key={i} x={x} y="62" width="6" height="24" rx="1" fill={isOp?'#ef4444':(isDark?'#374151':'#cbd5e1')} stroke={c.metalStroke} strokeWidth="0.5" opacity="0.7"/>)}
            <path d="M170,45 L185,45 L181,62 L174,62 Z" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            {isOp && [173,178,175,180,172].map((x,i)=><circle key={i} cx={x} cy={50+i*2} r="1.5" fill={isDark?'#60a5fa':'#3b82f6'} opacity="0.8"/>)}
            <text x="10" y="118" fill={c.textSecond} fontSize="9">CLAMP:{(clampForce??0).toFixed(0)}kN MELT:{(meltTemp??0).toFixed(0)}C</text>
            <text x="10" y="128" fill={c.textSecond} fontSize="9">INJ:{(injPressure??0).toFixed(0)}bar CYCLE:{(cycleTime??0).toFixed(1)}s</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Inj Pressure" value={injPressure??0} unit="bar" max={2000} color="#22d3ee" isDark={isDark}/>
            <DB label="Clamp kN" value={clampForce??0} unit="kN" max={5000} color="#60a5fa" isDark={isDark}/>
            <DB label="Melt Temp C" value={meltTemp??0} unit="C" max={350} color="#ef4444" isDark={isDark}/>
            <DB label="Cycle Time" value={cycleTime??0} unit="s" max={60} color="#a78bfa" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#fbbf24" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="CYCLE" color="#22c55e" onClick={()=>onCommand?.('START','CYCLE')}/>
              <HBtn label="HEAT ON" color="#ef4444" onClick={()=>onCommand?.('HEATER_ON','HEAT ON')}/>
              <HBtn label="STOP" color="#6b7280" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="PURGE" color="#f59e0b" onClick={()=>onCommand?.('PURGE','PURGE')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === ASSEMBLY ROBOT ===
function AsmRobot({ isDark, compact, status, axis1, axis2, payload, speed, cycleTime, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  const a1r = ((axis1??45)*Math.PI)/180;
  const a2r = ((axis2??-60)*Math.PI)/180;
  const j1x=90, j1y=100;
  const j2x=j1x+Math.cos(a1r)*38, j2y=j1y-Math.sin(a1r)*38;
  const j3x=j2x+Math.cos(a1r+a2r)*30, j3y=j2y-Math.sin(a1r+a2r)*30;
  return (
    <Panel isDark={isDark} compact={compact} title="ASSEMBLY ROBOT" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="8" y="8" width="185" height="125" rx="4" fill="none" stroke={isDark?'#1e3a5f':'#bfdbfe'} strokeWidth="1" strokeDasharray="6,4"/>
            <text x="10" y="18" fill={isDark?'#1e3a5f':'#bfdbfe'} fontSize="8" letterSpacing="2">SAFETY ZONE</text>
            <rect x="130" y="95" width="55" height="6" rx="1" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="0.8"/>
            <rect x="135" y="88" width="12" height="8" rx="1" fill={isDark?'#60a5fa':'#3b82f6'} stroke={c.mStroke} strokeWidth="0.5"/>
            <rect x="152" y="88" width="12" height="8" rx="1" fill={isDark?'#a78bfa':'#7c3aed'} stroke={c.mStroke} strokeWidth="0.5" opacity="0.7"/>
            <rect x="168" y="88" width="12" height="8" rx="1" fill={isDark?'#34d399':'#10b981'} stroke={c.mStroke} strokeWidth="0.5" opacity="0.5"/>
            <rect x="75" y="105" width="30" height="10" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <circle cx={j1x} cy={j1y} r="8" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.5"/>
            <line x1={j1x} y1={j1y} x2={j2x} y2={j2y} stroke={c.mStroke} strokeWidth="7" strokeLinecap="round"/>
            <line x1={j1x} y1={j1y} x2={j2x} y2={j2y} stroke={c.darkSurf} strokeWidth="4" strokeLinecap="round"/>
            <circle cx={j2x} cy={j2y} r="6" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1.2"/>
            <line x1={j2x} y1={j2y} x2={j3x} y2={j3y} stroke={c.mStroke} strokeWidth="5" strokeLinecap="round"/>
            <line x1={j2x} y1={j2y} x2={j3x} y2={j3y} stroke={c.darkSurf} strokeWidth="3" strokeLinecap="round"/>
            <circle cx={j3x} cy={j3y} r="5" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1.2"/>
            <line x1={j3x-3} y1={j3y+4} x2={j3x-5} y2={j3y+10} stroke={c.mStroke} strokeWidth="2" strokeLinecap="round"/>
            <line x1={j3x+3} y1={j3y+4} x2={j3x+5} y2={j3y+10} stroke={c.mStroke} strokeWidth="2" strokeLinecap="round"/>
            {isOp && <circle cx={j3x} cy={j3y} r="8" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.5"><animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/></circle>}
            <text x="12" y="118" fill={c.textSecond} fontSize="9">J1:{(axis1??0).toFixed(0)}deg J2:{(axis2??0).toFixed(0)}deg</text>
            <text x="12" y="128" fill={c.textSecond} fontSize="9">SPD:{(speed??0).toFixed(0)}% CYC:{(cycleTime??0).toFixed(1)}s</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Speed %" value={speed??0} unit="%" max={100} color="#22d3ee" isDark={isDark}/>
            <DB label="Payload kg" value={payload??0} unit="kg" max={20} color="#60a5fa" isDark={isDark}/>
            <DB label="Cycle Time" value={cycleTime??0} unit="s" max={30} color="#a78bfa" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#fbbf24" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="PAUSE" color="#f59e0b" onClick={()=>onCommand?.('PAUSE','PAUSE')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="HOME" color="#60a5fa" onClick={()=>onCommand?.('HOME_AXES','HOME')}/>
              <HBtn label="GRIPPER" color="#34d399" onClick={()=>onCommand?.('GRIPPER','GRIPPER')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === COMPRESSOR ===
function Compressor({ isDark, compact, status, pressure, flow, temp, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  const gAngle = (((pressure??0)/14)*240-210)*Math.PI/180;
  return (
    <Panel isDark={isDark} compact={compact} title="COMPRESSOR" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <ellipse cx="150" cy="74" rx="12" ry="35" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <rect x="138" y="40" width="24" height="68" fill={c.metalFill} stroke="none"/>
            <ellipse cx="150" cy="39" rx="12" ry="5" fill={c.darkSurf} stroke={c.metalStroke} strokeWidth="1.2"/>
            <ellipse cx="150" cy="109" rx="12" ry="5" fill={c.darkSurf} stroke={c.metalStroke} strokeWidth="1.2"/>
            <circle cx="162" cy="60" r="10" fill={c.panelBg} stroke={c.mStroke} strokeWidth="1"/>
            <line x1="162" y1="60" x2={162+5*Math.cos(gAngle)} y2={60+5*Math.sin(gAngle)} stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
            <text x="162" y="74" textAnchor="middle" fill={c.textSecond} fontSize="7">bar</text>
            <rect x="15" y="55" width="75" height="40" rx="4" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="22" y="62" width="16" height="26" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="45" y="62" width="16" height="26" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <circle cx="67" cy="74" r="9" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1.2">
              {isOp && <animateTransform attributeName="transform" type="rotate" from="0 67 74" to="360 67 74" dur={`${Math.max(0.4,2-(load??0)/100)}s`} repeatCount="indefinite"/>}
            </circle>
            <circle cx="67" cy="74" r="3" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="0.8"/>
            <ellipse cx="20" cy="74" rx="6" ry="12" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1.2"/>
            <text x="20" y="78" textAnchor="middle" fill={c.textPrimary} fontSize="10" fontWeight="700">M</text>
            <path d="M90,74 Q110,74 138,74" fill="none" stroke={c.mStroke} strokeWidth="2.5"/>
            <text x="100" y="70" fill={c.textSecond} fontSize="8">{(flow??0).toFixed(1)}m3/h</text>
            <text x="10" y="128" fill={c.textSecond} fontSize="9">P:{(pressure??0).toFixed(1)}bar T:{(temp??0).toFixed(0)}C L:{(load??0).toFixed(0)}%</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Pressure bar" value={pressure??0} unit="bar" max={14} color="#22d3ee" isDark={isDark}/>
            <DB label="Flow m3/h" value={flow??0} unit="m3/h" max={30} color="#60a5fa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={120} color={(temp??0)>90?'#ef4444':'#f59e0b'} isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="MOTOR ON" color="#22c55e" onClick={()=>onCommand?.('MOTOR_ON','MOTOR ON')}/>
              <HBtn label="MOTOR OFF" color="#ef4444" onClick={()=>onCommand?.('MOTOR_OFF','MOTOR OFF')}/>
              <HBtn label="DRAIN" color="#60a5fa" onClick={()=>onCommand?.('DRAIN','DRAIN')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === CONVEYOR ===
function Conveyor({ isDark, compact, status, speed, count, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  const colors = [isDark?'#60a5fa':'#3b82f6', isDark?'#34d399':'#10b981', isDark?'#f59e0b':'#d97706', isDark?'#a78bfa':'#7c3aed'];
  return (
    <Panel isDark={isDark} compact={compact} title="CONVEYOR" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            {[25,85,145].map((x,i)=><g key={i}><line x1={x} y1="90" x2={x-8} y2="115" stroke={c.metalStroke} strokeWidth="2"/><line x1={x} y1="90" x2={x+8} y2="115" stroke={c.metalStroke} strokeWidth="2"/></g>)}
            <ellipse cx="25" cy="75" rx="12" ry="12" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2">
              {isOp && <animateTransform attributeName="transform" type="rotate" from="0 25 75" to="360 25 75" dur={`${Math.max(0.3,2-(speed??0)/3)}s`} repeatCount="indefinite"/>}
            </ellipse>
            <ellipse cx="25" cy="75" rx="5" ry="5" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="0.8"/>
            <ellipse cx="175" cy="75" rx="12" ry="12" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <ellipse cx="175" cy="75" rx="5" ry="5" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="0.8"/>
            <rect x="25" y="63" width="150" height="10" fill={isDark?'#374151':'#94a3b8'} stroke={c.metalStroke} strokeWidth="0.8"/>
            {[0,1,2,3,4,5,6,7,8,9].map(i=><line key={i} x1={25+i*15} y1="63" x2={25+i*15} y2="73" stroke={c.metalStroke} strokeWidth="0.5" opacity="0.5"/>)}
            <rect x="25" y="85" width="150" height="6" fill={isDark?'#1e293b':'#cbd5e1'} stroke={c.metalStroke} strokeWidth="0.5"/>
            {isOp && [40,75,120,160].map((x,i)=>(
              <rect key={i} x={x} y="55" width="16" height="10" rx="1" fill={colors[i%4]} stroke={c.metalStroke} strokeWidth="0.5">
                {isOp && <animateTransform attributeName="transform" type="translate" from="0,0" to="-150,0" dur={`${Math.max(1,5-(speed??0))}s`} repeatCount="indefinite" begin={`${i*1.2}s`}/>}
              </rect>
            ))}
            <rect x="8" y="80" width="18" height="20" rx="2" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1"/>
            <text x="17" y="93" textAnchor="middle" fill={c.textPrimary} fontSize="10" fontWeight="700">M</text>
            <text x="10" y="128" fill={c.textSecond} fontSize="9">SPEED:{(speed??0).toFixed(2)}m/s COUNT:{(count??0).toFixed(0)}</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Speed m/s" value={speed??0} unit="m/s" max={5} color="#22d3ee" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="PAUSE" color="#f59e0b" onClick={()=>onCommand?.('PAUSE','PAUSE')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="+SPEED" color="#60a5fa" onClick={()=>onCommand?.('SPEED_UP','+SPEED')}/>
              <HBtn label="-SPEED" color="#94a3b8" onClick={()=>onCommand?.('SPEED_DOWN','-SPEED')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === LASER CUTTER ===
function LaserCutter({ isDark, compact, status, laserPower, cuttingSpeed, gasFlow, temp, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="LASER CUTTER" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="10" y="10" width="180" height="110" rx="4" fill="none" stroke={c.mStroke} strokeWidth="1.5"/>
            <rect x="15" y="25" width="170" height="6" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="15" y="45" width="170" height="5" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2">
              {isOp && <animate attributeName="y" values="35;75;35" dur="4s" repeatCount="indefinite"/>}
            </rect>
            <rect x="85" y="43" width="20" height="10" rx="2" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1.2">
              {isOp && <animate attributeName="x" values="20;160;20" dur="3s" repeatCount="indefinite"/>}
              {isOp && <animate attributeName="y" values="33;73;33" dur="4s" repeatCount="indefinite"/>}
            </rect>
            {isOp && <>
              <line x1="95" y1="53" x2="95" y2="90" stroke="#ff0000" strokeWidth="1" opacity="0.8">
                <animate attributeName="x1" values="30;170;30" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="x2" values="30;170;30" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="y1" values="43;83;43" dur="4s" repeatCount="indefinite"/>
              </line>
              <circle cx="95" cy="90" r="2" fill="#ff6060" opacity="0.9">
                <animate attributeName="cx" values="30;170;30" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="55;95;55" dur="4s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.1s" repeatCount="indefinite"/>
              </circle>
            </>}
            <rect x="20" y="90" width="160" height="22" rx="1" fill={isDark?'#374151':'#bfdbfe'} stroke={c.mStroke} strokeWidth="0.8"/>
            <rect x="165" y="10" width="22" height="16" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1"/>
            <text x="176" y="21" textAnchor="middle" fill={isDark?'#ef4444':'#dc2626'} fontSize="9" fontWeight="700">LASER</text>
            <rect x="165" y="30" width="22" height="12" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="0.8"/>
            <text x="176" y="39" textAnchor="middle" fill={c.textSecond} fontSize="8">N2/O2</text>
            <text x="10" y="128" fill={c.textSecond} fontSize="9">PWR:{(laserPower??0).toFixed(0)}W SPD:{(cuttingSpeed??0).toFixed(0)}mm/s GAS:{(gasFlow??0).toFixed(1)}L/min</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Laser Power" value={laserPower??0} unit="W" max={6000} color="#ef4444" isDark={isDark}/>
            <DB label="Cut Speed" value={cuttingSpeed??0} unit="mm/s" max={200} color="#22d3ee" isDark={isDark}/>
            <DB label="Assist Gas" value={gasFlow??0} unit="L/min" max={30} color="#60a5fa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={60} color="#f59e0b" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="LASER ON" color="#ef4444" onClick={()=>onCommand?.('START','LASER ON')}/>
              <HBtn label="LASER OFF" color="#6b7280" onClick={()=>onCommand?.('STOP','LASER OFF')}/>
              <HBtn label="HOME" color="#60a5fa" onClick={()=>onCommand?.('HOME_AXES','HOME')}/>
              <HBtn label="GAS ON" color="#a78bfa" onClick={()=>onCommand?.('GAS_ON','GAS ON')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === PLASMA CUTTER ===
function PlasmaCutter({ isDark, compact, status, arcCurrent, cuttingSpeed, gasFlow, temp, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="PLASMA CUTTER" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="10" y="85" width="170" height="25" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            {[20,40,60,80,100,120,140,160].map((x,i)=><line key={i} x1={x} y1="85" x2={x} y2="110" stroke={c.metalStroke} strokeWidth="0.5" opacity="0.5"/>)}
            <rect x="20" y="78" width="150" height="10" rx="1" fill={isDark?'#374151':'#bfdbfe'} stroke={c.mStroke} strokeWidth="0.8"/>
            <rect x="10" y="30" width="170" height="5" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="85" y="28" width="22" height="9" rx="2" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1">
              {isOp && <animate attributeName="x" values="15;165;15" dur="4s" repeatCount="indefinite"/>}
            </rect>
            <rect x="92" y="37" width="8" height="25" rx="2" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1">
              {isOp && <animate attributeName="x" values="22;172;22" dur="4s" repeatCount="indefinite"/>}
            </rect>
            {isOp && <line x1="96" y1="62" x2="96" y2="78" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
              <animate attributeName="x1" values="26;176;26" dur="4s" repeatCount="indefinite"/>
              <animate attributeName="x2" values="26;176;26" dur="4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.08s" repeatCount="indefinite"/>
            </line>}
            <rect x="10" y="10" width="55" height="30" rx="3" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <text x="37" y="22" textAnchor="middle" fill={c.textPrimary} fontSize="9" fontWeight="700">PLASMA</text>
            <text x="37" y="32" textAnchor="middle" fill={isDark?'#a78bfa':'#7c3aed'} fontSize="10" fontWeight="700">{(arcCurrent??0).toFixed(0)}A</text>
            <rect x="170" y="10" width="16" height="40" rx="5" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1"/>
            <rect x="173" y="6" width="10" height="6" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="0.8"/>
            <text x="10" y="120" fill={c.textSecond} fontSize="9">ARC:{(arcCurrent??0).toFixed(0)}A SPD:{(cuttingSpeed??0).toFixed(0)}mm/s</text>
            <text x="10" y="130" fill={c.textSecond} fontSize="9">GAS:{(gasFlow??0).toFixed(1)}L/min T:{(temp??0).toFixed(0)}C</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Arc Current" value={arcCurrent??0} unit="A" max={200} color="#a78bfa" isDark={isDark}/>
            <DB label="Cut Speed" value={cuttingSpeed??0} unit="mm/s" max={150} color="#22d3ee" isDark={isDark}/>
            <DB label="Gas Flow" value={gasFlow??0} unit="L/min" max={30} color="#60a5fa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={80} color="#f59e0b" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#fbbf24" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="ARC ON" color="#a78bfa" onClick={()=>onCommand?.('START','ARC ON')}/>
              <HBtn label="ARC OFF" color="#ef4444" onClick={()=>onCommand?.('STOP','ARC OFF')}/>
              <HBtn label="HOME" color="#60a5fa" onClick={()=>onCommand?.('HOME_AXES','HOME')}/>
              <HBtn label="GAS ON" color="#34d399" onClick={()=>onCommand?.('GAS_ON','GAS ON')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === GRINDER ===
function Grinder({ isDark, compact, status, wheelRpm, feedRate, depth, temp, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="GRINDER" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="15" y="100" width="160" height="20" rx="3" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <rect x="140" y="15" width="30" height="90" rx="3" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <path d="M 65,30 A 35,35 0 1,1 65,100 L 75,100 A 25,25 0 1,0 75,30 Z" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <circle cx="70" cy="65" r="28" fill={isDark?'#374151':'#9ca3af'} stroke={c.metalStroke} strokeWidth="1.5"/>
            <circle cx="70" cy="65" r="20" fill={isDark?'#1f2937':'#6b7280'} stroke={c.metalStroke} strokeWidth="0.8"/>
            <circle cx="70" cy="65" r="4" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1"/>
            {isOp && <circle cx="70" cy="65" r="24" fill="none" stroke={c.mStroke} strokeWidth="1" strokeDasharray="4,4"><animateTransform attributeName="transform" type="rotate" from="0 70 65" to="360 70 65" dur={`${Math.max(0.1,0.8-(wheelRpm??0)/10000)}s`} repeatCount="indefinite"/></circle>}
            <rect x="15" y="88" width="120" height="14" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="85" y="82" width="40" height="8" rx="1" fill={isDark?'#60a5fa':'#3b82f6'} stroke={c.mStroke} strokeWidth="0.8">
              {isOp && <animate attributeName="x" values="20;100;20" dur="3s" repeatCount="indefinite"/>}
            </rect>
            <text x="10" y="128" fill={c.textSecond} fontSize="9">RPM:{(wheelRpm??0).toFixed(0)} DOC:{(depth??0).toFixed(2)}mm L:{(load??0).toFixed(0)}%</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Wheel RPM" value={wheelRpm??0} unit="" max={3600} color="#22d3ee" isDark={isDark}/>
            <DB label="Feed Rate" value={feedRate??0} unit="mm/s" max={5} color="#60a5fa" isDark={isDark}/>
            <DB label="Depth mm" value={depth??0} unit="mm" max={2} color="#fbbf24" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={80} color={(temp??0)>60?'#ef4444':'#f59e0b'} isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="COOLANT" color="#60a5fa" onClick={()=>onCommand?.('COOLANT_ON','COOLANT')}/>
              <HBtn label="DRESS" color="#f59e0b" onClick={()=>onCommand?.('DRESS_WHEEL','DRESS')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === DRILL PRESS ===
function DrillPress({ isDark, compact, status, rpm, depth, torque, temp, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  const drillY = 60 + (isOp?((depth??0)/50)*20:0);
  return (
    <Panel isDark={isDark} compact={compact} title="DRILL PRESS" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="88" y="10" width="14" height="115" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <ellipse cx="95" cy="125" rx="40" ry="10" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="60" y="10" width="70" height="28" rx="4" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <ellipse cx="115" cy="22" rx="14" ry="10" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1.2"/>
            <text x="115" y="25" textAnchor="middle" fill={c.textPrimary} fontSize="9" fontWeight="700">M</text>
            <line x1="101" y1="18" x2="80" y2="18" stroke={c.metalStroke} strokeWidth="2"/>
            <line x1="101" y1="26" x2="80" y2="26" stroke={c.metalStroke} strokeWidth="2"/>
            <rect x="82" y="38" width="26" height="20" rx="3" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <rect x="86" y="58" width="18" height="10" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1">
              {isOp && <animateTransform attributeName="transform" type="rotate" from="0 95 63" to="360 95 63" dur={`${Math.max(0.2,2-(rpm??0)/2000)}s`} repeatCount="indefinite"/>}
            </rect>
            <line x1="95" y1="68" x2="95" y2={drillY+5} stroke={isDark?'#94a3b8':'#4b5563'} strokeWidth="2.5" strokeLinecap="round"/>
            <polygon points={`91,${drillY+5} 99,${drillY+5} 95,${drillY+12}`} fill={isDark?'#f59e0b':'#d97706'} stroke="#f59e0b" strokeWidth="0.5"/>
            <rect x="50" y="100" width="90" height="8" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <rect x="70" y="93" width="50" height="10" rx="1" fill={isDark?'#374151':'#bfdbfe'} stroke={c.mStroke} strokeWidth="0.8"/>
            <text x="10" y="128" fill={c.textSecond} fontSize="9">RPM:{(rpm??0).toFixed(0)} DOC:{(depth??0).toFixed(1)}mm TQ:{(torque??0).toFixed(0)}Nm</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Spindle RPM" value={rpm??0} unit="" max={3000} color="#22d3ee" isDark={isDark}/>
            <DB label="Depth mm" value={depth??0} unit="mm" max={50} color="#fbbf24" isDark={isDark}/>
            <DB label="Torque Nm" value={torque??0} unit="Nm" max={100} color="#a78bfa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={80} color="#f59e0b" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="FEED" color="#60a5fa" onClick={()=>onCommand?.('FEED_DOWN','FEED')}/>
              <HBtn label="RETRACT" color="#f59e0b" onClick={()=>onCommand?.('RETRACT','RETRACT')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === PUNCH PRESS ===
function PunchPress({ isDark, compact, status, strokes, force, speed, temp, load, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="PUNCH PRESS" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="15" y="10" width="15" height="120" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <rect x="170" y="10" width="15" height="120" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <rect x="15" y="10" width="170" height="20" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.2"/>
            <circle cx="155" cy="30" r="18" fill="none" stroke={c.mStroke} strokeWidth="1.5"/>
            <circle cx="155" cy="30" r="10" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <circle cx="155" cy="30" r="4" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="0.8">
              {isOp && <animateTransform attributeName="transform" type="rotate" from="0 155 30" to="360 155 30" dur={`${Math.max(0.3,2-(speed??0)/100)}s`} repeatCount="indefinite"/>}
            </circle>
            <line x1="155" y1="30" x2="155" y2="18" stroke={c.mStroke} strokeWidth="1.5"/>
            <line x1="155" y1="18" x2="95" y2="55" stroke={c.metalStroke} strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="70" y="52" width="50" height="16" rx="2" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.5">
              {isOp && <animate attributeName="y" values="48;68;48" dur={`${Math.max(0.4,2-(speed??0)/100)}s`} repeatCount="indefinite"/>}
            </rect>
            <rect x="82" y="68" width="26" height="10" rx="1" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1">
              {isOp && <animate attributeName="y" values="64;84;64" dur={`${Math.max(0.4,2-(speed??0)/100)}s`} repeatCount="indefinite"/>}
            </rect>
            <rect x="35" y="98" width="130" height="5" rx="1" fill={isDark?'#374151':'#bfdbfe'} stroke={c.mStroke} strokeWidth="0.8"/>
            <rect x="70" y="103" width="50" height="12" rx="2" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1.2"/>
            <rect x="82" y="103" width="26" height="12" rx="1" fill={c.svgBg} stroke={c.mStroke} strokeWidth="0.5"/>
            <text x="10" y="128" fill={c.textSecond} fontSize="9">SPM:{(strokes??0).toFixed(0)} FORCE:{(force??0).toFixed(0)}kN L:{(load??0).toFixed(0)}%</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Strokes/min" value={strokes??0} unit="spm" max={200} color="#22d3ee" isDark={isDark}/>
            <DB label="Force kN" value={force??0} unit="kN" max={2000} color="#f59e0b" isDark={isDark}/>
            <DB label="Speed %" value={speed??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={80} color={(temp??0)>60?'#ef4444':'#60a5fa'} isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#60a5fa" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="INCH" color="#f59e0b" onClick={()=>onCommand?.('INCH','INCH')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === PUMP ===
function Pump({ isDark, compact, status, flow, pressure, temp, load, rpm, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  const gAngle = (((pressure??0)/20)*240-210)*Math.PI/180;
  return (
    <Panel isDark={isDark} compact={compact} title="PUMP SYSTEM" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="8" y="70" width="35" height="8" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <text x="10" y="68" fill={c.textSecond} fontSize="8">INLET</text>
            <circle cx="83" cy="74" r="28" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.5"/>
            <circle cx="83" cy="74" r="18" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            {[0,60,120,180,240,300].map((a,i)=>{
              const rad=(a*Math.PI)/180;
              return <path key={i} d={`M 83 74 L ${83+Math.cos(rad)*14} ${74+Math.sin(rad)*14} Q ${83+Math.cos(rad+0.4)*10} ${74+Math.sin(rad+0.4)*10} 83`} fill={c.machineBlue} stroke={c.mStroke} strokeWidth="0.5">
                {isOp && <animateTransform attributeName="transform" type="rotate" from="0 83 74" to="360 83 74" dur={`${Math.max(0.3,2-(rpm??0)/2000)}s`} repeatCount="indefinite"/>}
              </path>;
            })}
            <circle cx="83" cy="74" r="4" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="0.8"/>
            <rect x="111" y="70" width="40" height="8" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1.2"/>
            <text x="125" y="68" fill={c.textSecond} fontSize="8">OUTLET</text>
            <rect x="147" y="30" width="8" height="42" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <circle cx="170" cy="65" r="12" fill={c.panelBg} stroke={c.mStroke} strokeWidth="1"/>
            <line x1="170" y1="65" x2={170+6*Math.cos(gAngle)} y2={65+6*Math.sin(gAngle)} stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
            <text x="170" y="82" textAnchor="middle" fill={c.textSecond} fontSize="7">bar</text>
            <rect x="60" y="108" width="46" height="22" rx="3" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="1.2"/>
            <text x="83" y="122" textAnchor="middle" fill={c.textPrimary} fontSize="10" fontWeight="700">MOTOR</text>
            <text x="10" y="128" fill={c.textSecond} fontSize="9">FLOW:{(flow??0).toFixed(1)}m3/h P:{(pressure??0).toFixed(1)}bar T:{(temp??0).toFixed(0)}C</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Flow m3/h" value={flow??0} unit="m3/h" max={100} color="#22d3ee" isDark={isDark}/>
            <DB label="Pressure bar" value={pressure??0} unit="bar" max={20} color="#60a5fa" isDark={isDark}/>
            <DB label="RPM" value={rpm??0} unit="" max={3600} color="#a78bfa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={80} color="#f59e0b" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#fbbf24" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="MOTOR ON" color="#22c55e" onClick={()=>onCommand?.('MOTOR_ON','MOTOR ON')}/>
              <HBtn label="MOTOR OFF" color="#ef4444" onClick={()=>onCommand?.('MOTOR_OFF','MOTOR OFF')}/>
              <HBtn label="PRIME" color="#60a5fa" onClick={()=>onCommand?.('PRIME','PRIME')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === BOILER / FURNACE ===
function Boiler({ isDark, compact, status, setpoint, actual, pressure, burnerLoad, temp, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  const heatPct = Math.min(1, (actual??0) / Math.max(1, setpoint??200));
  const flameColor = isOp ? (heatPct > 0.9 ? '#ef4444' : '#f97316') : '#374151';
  const gAngle = (((pressure??0)/20)*240-210)*Math.PI/180;
  return (
    <Panel isDark={isDark} compact={compact} title="BOILER / FURNACE" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="40" y="20" width="100" height="90" rx="8" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.5"/>
            {[35,55,75,95].map((y,i)=><rect key={i} x="40" y={y} width="100" height="6" fill={isDark?'#1e3a5f':'#dbeafe'} stroke={c.panelBorder} strokeWidth="0.5" opacity="0.5"/>)}
            {isOp && <>
              <ellipse cx="90" cy="105" rx="20" ry="8" fill={flameColor} opacity="0.8">
                <animate attributeName="ry" values="8;12;8" dur="0.3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.5;0.8" dur="0.3s" repeatCount="indefinite"/>
              </ellipse>
              <ellipse cx="90" cy="98" rx="12" ry="10" fill={isDark?'#fbbf24':'#f59e0b'} opacity="0.7">
                <animate attributeName="ry" values="10;15;10" dur="0.25s" repeatCount="indefinite"/>
                <animate attributeName="cy" values="98;92;98" dur="0.25s" repeatCount="indefinite"/>
              </ellipse>
            </>}
            <rect x="42" y={110-heatPct*80} width="96" height={heatPct*80} rx="4" fill={`rgba(${isOp?'239,68,68':'59,130,246'},0.15)`}/>
            <circle cx="165" cy="45" r="14" fill={c.panelBg} stroke={c.mStroke} strokeWidth="1"/>
            <line x1="165" y1="45" x2={165+8*Math.cos(gAngle)} y2={45+8*Math.sin(gAngle)} stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
            <text x="165" y="63" textAnchor="middle" fill={c.textSecond} fontSize="7">bar</text>
            <rect x="90" y="8" width="10" height="16" rx="2" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <text x="10" y="120" fill={c.textSecond} fontSize="9">SETPT:{(setpoint??0).toFixed(0)}C ACTUAL:{(actual??0).toFixed(0)}C</text>
            <text x="10" y="130" fill={c.textSecond} fontSize="9">PRESS:{(pressure??0).toFixed(1)}bar LOAD:{(burnerLoad??0).toFixed(0)}%</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Actual Temp" value={actual??0} unit="C" max={setpoint??500} color="#ef4444" isDark={isDark}/>
            <DB label="Pressure bar" value={pressure??0} unit="bar" max={20} color="#60a5fa" isDark={isDark}/>
            <DB label="Burner Load" value={burnerLoad??0} unit="%" max={100} color="#f97316" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={100} color="#f59e0b" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="BURNER ON" color="#f97316" onClick={()=>onCommand?.('START','BURNER ON')}/>
              <HBtn label="BURNER OFF" color="#ef4444" onClick={()=>onCommand?.('STOP','BURNER OFF')}/>
              <HBtn label="BLOWDOWN" color="#60a5fa" onClick={()=>onCommand?.('BLOWDOWN','BLOWDOWN')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === GENERATOR ===
function Generator({ isDark, compact, status, frequency, voltage, loadKw, rpm, temp, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title="GENERATOR" sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="10" y="40" width="180" height="65" rx="6" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.5"/>
            <rect x="15" y="45" width="70" height="55" rx="4" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <text x="50" y="65" textAnchor="middle" fill={c.textPrimary} fontSize="10" fontWeight="700">ENGINE</text>
            <circle cx="50" cy="78" r="12" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1">
              {isOp && <animateTransform attributeName="transform" type="rotate" from="0 50 78" to="360 50 78" dur={`${Math.max(0.2,2-(rpm??0)/3000)}s`} repeatCount="indefinite"/>}
            </circle>
            <circle cx="50" cy="78" r="5" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="0.8"/>
            <rect x="95" y="45" width="90" height="55" rx="4" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <text x="140" y="60" textAnchor="middle" fill={c.textPrimary} fontSize="10" fontWeight="700">ALTERNATOR</text>
            {[70,75,80,85].map((y,i)=><path key={i} d={`M100,${y} Q105,${y-4} 110,${y} Q115,${y+4} 120,${y}`} fill="none" stroke={isOp?'#fbbf24':c.metalStroke} strokeWidth="1.2" opacity={isOp?0.8:0.3}/>)}
            <text x="140" y="85" textAnchor="middle" fill={c.textSecond} fontSize="9" fontWeight="700">{(voltage??0).toFixed(0)}V</text>
            <text x="140" y="95" textAnchor="middle" fill={c.textSecond} fontSize="9">{(frequency??0).toFixed(1)}Hz</text>
            <line x1="85" y1="72" x2="95" y2="72" stroke={c.mStroke} strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="10" y="10" width="60" height="28" rx="3" fill={c.panelBg} stroke={c.mStroke} strokeWidth="1"/>
            <text x="40" y="22" textAnchor="middle" fill={c.textPrimary} fontSize="9" fontWeight="700">CONTROL</text>
            <text x="40" y="32" textAnchor="middle" fill={isOp?'#22c55e':'#ef4444'} fontSize="9">{isOp?'ON-LINE':'OFF-LINE'}</text>
            <text x="10" y="120" fill={c.textSecond} fontSize="9">RPM:{(rpm??0).toFixed(0)} V:{(voltage??0).toFixed(0)} Hz:{(frequency??0).toFixed(1)}</text>
            <text x="10" y="130" fill={c.textSecond} fontSize="9">LOAD:{(loadKw??0).toFixed(0)}kW T:{(temp??0).toFixed(0)}C</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="Voltage V" value={voltage??0} unit="V" max={480} color="#fbbf24" isDark={isDark}/>
            <DB label="Frequency" value={frequency??0} unit="Hz" max={60} color="#22d3ee" isDark={isDark}/>
            <DB label="Load kW" value={loadKw??0} unit="kW" max={1000} color="#a78bfa" isDark={isDark}/>
            <DB label="RPM" value={rpm??0} unit="" max={3600} color="#60a5fa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={100} color="#f59e0b" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="SYNC" color="#fbbf24" onClick={()=>onCommand?.('SYNC','SYNC')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === GENERIC MACHINE ===
function Generic({ isDark, compact, status, machineName, rpm, load, temp, pressure, onCommand }: any) {
  const c = useTC(isDark);
  const isOp = status === 'OPERATIONAL'; const isB = status === 'BREAKDOWN';
  const sc = isOp ? '#22c55e' : isB ? '#ef4444' : '#f59e0b';
  return (
    <Panel isDark={isDark} compact={compact} title={machineName||'MACHINE'} sc={sc} sl={status}>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ flex:1, padding:compact?4:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 200 140" style={{ width:'100%', height:compact?120:300 }}>
            <rect x="0" y="0" width="200" height="140" fill={c.svgBg} rx="4"/>
            <rect x="20" y="20" width="160" height="90" rx="6" fill={c.darkSurf} stroke={c.mStroke} strokeWidth="1.5"/>
            <rect x="30" y="28" width="140" height="30" rx="3" fill={c.metalFill} stroke={c.metalStroke} strokeWidth="1"/>
            <circle cx="75" cy="73" r="22" fill={c.metalFill} stroke={c.mStroke} strokeWidth="1.5">
              {isOp && <animateTransform attributeName="transform" type="rotate" from="0 75 73" to="360 75 73" dur={`${Math.max(0.3,2-(rpm??0)/2000)}s`} repeatCount="indefinite"/>}
            </circle>
            <circle cx="75" cy="73" r="14" fill={c.darkSurf} stroke={c.metalStroke} strokeWidth="1"/>
            <circle cx="75" cy="73" r="5" fill={c.machineBlue} stroke={c.mStroke} strokeWidth="0.8"/>
            {[0,60,120,180,240,300].map((a,i)=>{const r2=(a*Math.PI)/180;return <line key={i} x1={75+Math.cos(r2)*7} y1={73+Math.sin(r2)*7} x2={75+Math.cos(r2)*14} y2={73+Math.sin(r2)*14} stroke={c.mStroke} strokeWidth="1.5" strokeLinecap="round"/>;}) }
            <rect x="110" y="58" width="60" height="30" rx="3" fill={c.panelBg} stroke={c.panelBorder} strokeWidth="1"/>
            <text x="140" y="70" textAnchor="middle" fill={c.textPrimary} fontSize="10" fontWeight="700">{(rpm??0).toFixed(0)}</text>
            <text x="140" y="80" textAnchor="middle" fill={c.textSecond} fontSize="8">RPM</text>
            {isB && <><line x1="88" y1="60" x2="62" y2="86" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/><line x1="62" y1="60" x2="88" y2="86" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/></>}
            <text x="10" y="125" fill={c.textSecond} fontSize="9">RPM:{(rpm??0).toFixed(0)} LOAD:{(load??0).toFixed(0)}%</text>
            <text x="10" y="134" fill={c.textSecond} fontSize="9">TEMP:{(temp??0).toFixed(0)}C P:{(pressure??0).toFixed(1)}bar</text>
            <circle cx="188" cy="12" r="5" fill={sc} style={{filter:`drop-shadow(0 0 4px ${sc})`}}/>
          </svg>
        </div>
        {!compact && (
          <div style={{ width:150, padding:10, borderLeft:`1px solid ${c.panelBorder}`, display:'flex', flexDirection:'column', gap:4 }}>
            <DB label="RPM" value={rpm??0} unit="" max={3000} color="#22d3ee" isDark={isDark}/>
            <DB label="Load %" value={load??0} unit="%" max={100} color="#a78bfa" isDark={isDark}/>
            <DB label="Temp C" value={temp??0} unit="C" max={120} color="#f59e0b" isDark={isDark}/>
            <DB label="Pressure" value={pressure??0} unit="bar" max={20} color="#60a5fa" isDark={isDark}/>
            <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              <HBtn label="START" color="#22c55e" onClick={()=>onCommand?.('START','START')}/>
              <HBtn label="STOP" color="#ef4444" onClick={()=>onCommand?.('STOP','STOP')}/>
              <HBtn label="RESET" color="#60a5fa" onClick={()=>onCommand?.('RESET','RESET')}/>
              <HBtn label="AUTO" color="#a78bfa" onClick={()=>onCommand?.('AUTO_MODE','AUTO')}/>
              <ES onClick={()=>onCommand?.('EMERGENCY_STOP','EMERGENCY STOP')}/>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}


// === MAIN EXPORT ===
export function MachineHMISchematic({
  category, machineName, status, liveData, compact = false, isDark = false, machineId, onCommand
}: HMISchematicProps) {
  const s = (status || 'OPERATIONAL') as 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  const rpm = liveData?.rpm ?? 0;
  const load = liveData?.load ?? 0;
  const temp = liveData?.temp ?? 0;
  const pres = liveData?.pressure ?? 0;
  const name = machineName.toLowerCase();

  if (category === 'CNC_LATHE' || name.includes('lathe'))
    return <CNCLathe rpm={rpm} feed={rpm*0.14} xPos={50+load*0.3} zPos={-(rpm*0.065+load*0.3)} temp={temp} load={load} pressure={pres} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (category === 'CNC_MILL' || name.includes('mill') || name.includes('milling') || name.includes('machining center'))
    return <CNCMill rpm={rpm} feed={rpm*0.12} xPos={30+load*0.2} yPos={15+load*0.1} zPos={-(rpm*0.05)} temp={temp} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('press brake') || name.includes('pressbrake') || category === 'PRESS' || category === 'HYDRAULIC' || name.includes('hydraulic press'))
    return <PressBrake force={pres*9.2} angle={45+load*0.3} stroke={load*2.5} thickness={5+load*0.05} temp={temp} load={load} pressure={pres} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (category === 'WELDER' || name.includes('weld'))
    return <Welder current={pres*4} voltage={20+load*0.25} wireSpeed={load*0.15} gasFlow={15+load*0.1} temp={temp} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (category === 'INJECTION_MOLD' || name.includes('inject') || name.includes('mold') || name.includes('molding'))
    return <InjMold injPressure={pres*15} clampForce={pres*50} meltTemp={200+temp*0.5} cycleTime={20-load*0.1} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (category === 'ASSEMBLY' || name.includes('robot') || name.includes('assembly'))
    return <AsmRobot axis1={45+load*0.3} axis2={-60+rpm*0.01} payload={load*0.1} speed={load} cycleTime={20-load*0.1} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (category === 'COMPRESSOR' || name.includes('compressor'))
    return <Compressor pressure={pres*1.15} flow={load*0.85} temp={temp} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (category === 'CONVEYOR' || name.includes('conveyor'))
    return <Conveyor speed={rpm*0.00028} count={Math.floor(load*0.5)} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('laser'))
    return <LaserCutter laserPower={load*60} cuttingSpeed={rpm*0.01} gasFlow={15+load*0.1} temp={temp} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('plasma'))
    return <PlasmaCutter arcCurrent={pres*2} cuttingSpeed={rpm*0.008} gasFlow={18+load*0.08} temp={temp} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('grind'))
    return <Grinder wheelRpm={rpm*1.5} feedRate={load*0.03} depth={load*0.01} temp={temp} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('drill'))
    return <DrillPress rpm={rpm} depth={load*0.3} torque={pres*2} temp={temp} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('punch'))
    return <PunchPress strokes={rpm*0.02} force={pres*8} speed={load} temp={temp} load={load} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('pump'))
    return <Pump flow={load*0.8} pressure={pres*0.9} temp={temp} load={load} rpm={rpm} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('boiler') || name.includes('furnace') || name.includes('oven') || name.includes('kiln'))
    return <Boiler setpoint={temp*1.5+100} actual={temp*1.2} pressure={pres*0.5} burnerLoad={load} temp={temp} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('generat'))
    return <Generator frequency={50+load*0.1} voltage={380+load*0.5} loadKw={load*8} rpm={rpm} temp={temp} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  if (name.includes('press') || name.includes('hydraulic'))
    return <PressBrake force={pres*9.2} angle={45+load*0.3} stroke={load*2.5} thickness={5+load*0.05} temp={temp} load={load} pressure={pres} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;

  return <Generic machineName={machineName} rpm={rpm} load={load} temp={temp} pressure={pres} status={s} isDark={isDark} compact={compact} onCommand={onCommand}/>;
}

export default MachineHMISchematic;
