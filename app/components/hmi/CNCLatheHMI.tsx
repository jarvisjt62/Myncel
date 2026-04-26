'use client';

import { useState, useEffect } from 'react';

interface CNCLatheHMIProps {
  rpm: number;
  feed: number;
  xPos: number;
  zPos: number;
  temp: number;
  load: number;
  pressure: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
  isDark?: boolean;
  machineId?: string;
  onCommand?: (command: string) => void;
}

export function CNCLatheHMI({
  rpm, feed, xPos, zPos, temp, load, pressure, status,
  compact = false, isDark = false, machineId, onCommand
}: CNCLatheHMIProps) {
  const [spindleAngle, setSpindleAngle] = useState(0);

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setSpindleAngle(prev => (prev + Math.max(1, rpm / 60)) % 360);
      }, 16);
      return () => clearInterval(interval);
    }
  }, [rpm, status]);

  const statusColor = status === 'OPERATIONAL' ? '#22c55e' : status === 'BREAKDOWN' ? '#ef4444' : '#f59e0b';
  const tempColor = temp > 90 ? '#ef4444' : temp > 75 ? '#f59e0b' : '#22c55e';
  const loadColor = load > 90 ? '#ef4444' : load > 70 ? '#f59e0b' : '#635bff';

  // Theme-aware colors
  const bg = isDark ? '#0a1628' : 'transparent';
  const gridColor = isDark ? '#1e3a5f' : '#c0d8f0';
  const headerBg = isDark ? '#0f172a' : '#dbeafe';
  const panelBg = isDark ? '#0f172a' : '#eff6ff';
  const panelBorder = isDark ? '#1e3a5f' : '#bfdbfe';
  const textPrimary = isDark ? '#67e8f9' : '#1e40af';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const tabBg = isDark ? '#1e3a5f' : '#dbeafe';
  const tabActiveBg = isDark ? '#0891b2' : '#3b82f6';
  const machineBodyColor = isDark ? '#0891b2' : '#2563eb';
  const machineBodyStroke = isDark ? '#22d3ee' : '#60a5fa';

  const handleCmd = (cmd: string) => onCommand?.(cmd);

  if (compact) {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ background: bg }}>
        <svg viewBox="0 0 400 160" className="w-full h-full">
          <defs>
            <pattern id="cgrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={gridColor} strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="400" height="160" fill={bg === 'transparent' ? 'transparent' : bg}/>
          {bg !== 'transparent' && <rect width="400" height="160" fill="url(#cgrid)"/>}

          <text x="10" y="20" fill={textPrimary} fontSize="12" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
          <text x="80" y="20" fill={textSecondary} fontSize="10" fontFamily="monospace">CNC LATHE</text>

          {/* Spindle Housing */}
          <rect x="30" y="45" width="85" height="70" fill={machineBodyColor} stroke={machineBodyStroke} strokeWidth="2" rx="4" opacity="0.9"/>
          <text x="72" y="85" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace">SPINDLE</text>
          <text x="72" y="100" fill="#a5f3fc" fontSize="8" textAnchor="middle" fontFamily="monospace">{rpm} RPM</text>

          {/* Chuck */}
          <g transform="translate(145, 80)">
            <circle r="28" fill={isDark ? '#1e3a5f' : '#dbeafe'} stroke="#fbbf24" strokeWidth="3"/>
            <g transform={`rotate(${spindleAngle})`}>
              <line x1="0" y1="-20" x2="0" y2="20" stroke="#fbbf24" strokeWidth="2"/>
              <line x1="-20" y1="0" x2="20" y2="0" stroke="#fbbf24" strokeWidth="2"/>
            </g>
            <rect x="-8" y="-32" width="16" height="64" fill="#22c55e" rx="2" opacity="0.9"/>
          </g>

          {/* Tool Turret */}
          <rect x="200" y="40" width="40" height="80" fill={isDark ? '#374151' : '#94a3b8'} stroke={isDark ? '#9ca3af' : '#64748b'} strokeWidth="2" rx="2"/>
          <polygon points="240,80 275,74 275,86" fill="#635bff" stroke="#a78bfa" strokeWidth="1"/>

          {status === 'OPERATIONAL' && (
            <g>
              <circle cx="175" cy="80" r="8" fill="#f97316" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.3;0.7" dur="0.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="179" cy="76" r="4" fill="#fbbf24" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.3s" repeatCount="indefinite"/>
              </circle>
            </g>
          )}

          {/* Live data strip */}
          <rect x="290" y="10" width="105" height="60" fill={panelBg} stroke={panelBorder} strokeWidth="1" rx="4" opacity="0.95"/>
          <text x="342" y="26" textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">LIVE DATA</text>
          <text x="298" y="40" fill={textSecondary} fontSize="8" fontFamily="monospace">RPM:</text>
          <text x="390" y="40" textAnchor="end" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">{rpm}</text>
          <text x="298" y="52" fill={textSecondary} fontSize="8" fontFamily="monospace">LOAD:</text>
          <text x="390" y="52" textAnchor="end" fill={loadColor} fontSize="9" fontWeight="bold" fontFamily="monospace">{load.toFixed(0)}%</text>
          <text x="298" y="64" fill={textSecondary} fontSize="8" fontFamily="monospace">TEMP:</text>
          <text x="390" y="64" textAnchor="end" fill={tempColor} fontSize="9" fontWeight="bold" fontFamily="monospace">{temp.toFixed(0)}°C</text>

          {/* Status LED */}
          <circle cx="382" cy="16" r="6" fill={statusColor}>
            {status === 'OPERATIONAL' && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>}
          </circle>

          {/* Status overlays */}
          {status === 'BREAKDOWN' && (
            <rect x="0" y="0" width="400" height="160" fill="rgba(239,68,68,0.15)"/>
          )}
          {status === 'MAINTENANCE' && (
            <rect x="0" y="0" width="400" height="160" fill="rgba(245,158,11,0.1)"/>
          )}
        </svg>
      </div>
    );
  }

  // Full Detail View
  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg" style={{ background: bg }}>
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <defs>
          <pattern id="cgridFull" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={gridColor} strokeWidth="0.5"/>
          </pattern>
          <linearGradient id="cmetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#4b5563' : '#94a3b8'}/>
            <stop offset="50%" stopColor={isDark ? '#6b7280' : '#cbd5e1'}/>
            <stop offset="100%" stopColor={isDark ? '#4b5563' : '#94a3b8'}/>
          </linearGradient>
        </defs>
        {bg !== 'transparent' && <rect width="800" height="400" fill={bg}/>}
        <rect width="800" height="400" fill="url(#cgridFull)" opacity={isDark ? 1 : 0.5}/>

        {/* Header */}
        <rect x="0" y="0" width="800" height="45" fill={headerBg} opacity="0.95"/>
        <text x="20" y="30" fill={textPrimary} fontSize="18" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
        <text x="115" y="30" fill={textSecondary} fontSize="14" fontFamily="monospace">CNC LATHE HMI</text>
        <rect x="648" y="12" width="135" height="22" fill={statusColor} rx="4" opacity="0.2"/>
        <circle cx="660" cy="23" r="5" fill={statusColor}/>
        <text x="775" y="28" fill={statusColor} fontSize="12" textAnchor="end" fontFamily="monospace" fontWeight="bold">{status}</text>

        {/* Control Buttons */}
        <g transform="translate(20, 55)">
          {[
            { label: 'MOTOR ON', color: '#fbbf24', textColor: '#1e3a5f', cmd: 'START' },
            { label: 'SPINDLE ON', color: '#fbbf24', textColor: '#1e3a5f', cmd: 'START' },
            { label: 'AUTO', color: '#3b82f6', textColor: 'white', cmd: 'START' },
            { label: 'MANUAL', color: '#06b6d4', textColor: 'white', cmd: 'PAUSE' },
            { label: 'CYCLE', color: '#22c55e', textColor: 'white', cmd: 'START' },
          ].map((btn, i) => (
            <g key={btn.label} transform={`translate(${i * 85}, 0)`} style={{ cursor: 'pointer' }} onClick={() => handleCmd(btn.cmd)}>
              <rect width="75" height="28" fill={btn.color} rx="4" opacity="0.9"/>
              <rect width="75" height="28" fill="transparent" rx="4" stroke={btn.color} strokeWidth="1"/>
              <text x="37" y="18" fill={btn.textColor} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{btn.label}</text>
            </g>
          ))}
        </g>

        {/* Machine Schematic */}
        <g transform="translate(40, 100)">
          {/* Bed */}
          <rect x="0" y="200" width="500" height="30" fill="url(#cmetalGrad)" stroke={isDark ? '#6b7280' : '#94a3b8'} strokeWidth="2" rx="2"/>
          {/* Spindle Housing */}
          <rect x="20" y="80" width="120" height="120" fill={machineBodyColor} stroke={machineBodyStroke} strokeWidth="3" rx="8" opacity="0.9"/>
          <text x="80" y="142" fill="white" fontSize="13" textAnchor="middle" fontFamily="monospace" fontWeight="bold">SPINDLE</text>
          <text x="80" y="162" fill="#a5f3fc" fontSize="11" textAnchor="middle" fontFamily="monospace">{rpm} RPM</text>

          {/* Rotating Chuck */}
          <g transform="translate(190, 140)">
            <circle r="45" fill={isDark ? '#1e3a5f' : '#dbeafe'} stroke="#fbbf24" strokeWidth="4"/>
            <circle r="35" fill={isDark ? '#0f172a' : '#eff6ff'} stroke="#fbbf24" strokeWidth="2"/>
            <g transform={`rotate(${spindleAngle})`}>
              {[0, 120, 240].map((angle, i) => (
                <g key={i} transform={`rotate(${angle})`}>
                  <rect x="-8" y="-45" width="16" height="20" fill="#fbbf24" rx="2"/>
                </g>
              ))}
            </g>
            <rect x="-12" y="-80" width="24" height="160" fill="#22c55e" rx="3" opacity="0.9"/>
            <text x="0" y="5" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">PART</text>
          </g>

          {/* Tool Turret */}
          <g transform="translate(320, 100)">
            <rect x="0" y="0" width="60" height="120" fill={isDark ? '#374151' : '#94a3b8'} stroke={isDark ? '#9ca3af' : '#64748b'} strokeWidth="2" rx="4"/>
            {[0, 40, 80].map((y, i) => (
              <g key={i} transform={`translate(0, ${y})`}>
                <rect x="55" y="5" width="80" height="30" fill={isDark ? '#4b5563' : '#cbd5e1'} stroke={isDark ? '#6b7280' : '#94a3b8'} strokeWidth="1" rx="2"/>
                <polygon points="135,20 162,15 162,25" fill={i === 1 ? '#635bff' : (isDark ? '#6b7280' : '#94a3b8')} stroke="#a78bfa" strokeWidth="1"/>
              </g>
            ))}
            <text x="30" y="65" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">TURRET</text>
          </g>

          {/* Cutting sparks */}
          {status === 'OPERATIONAL' && (
            <g>
              <circle cx="218" cy="140" r="14" fill="#f97316" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.4s" repeatCount="indefinite"/>
              </circle>
              <circle cx="224" cy="133" r="7" fill="#fbbf24" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.3s" repeatCount="indefinite"/>
              </circle>
            </g>
          )}
        </g>

        {/* Right Data Panel */}
        <g transform="translate(580, 50)">
          <rect width="205" height="290" fill={panelBg} stroke={panelBorder} strokeWidth="2" rx="8" opacity="0.97"/>
          <text x="102" y="25" fill={textPrimary} fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
          {[
            { label: 'SPINDLE RPM', value: rpm.toFixed(0), unit: '', color: '#fbbf24' },
            { label: 'FEED RATE', value: feed.toFixed(1), unit: 'mm/min', color: '#22c55e' },
            { label: 'X POSITION', value: xPos.toFixed(1), unit: 'mm', color: '#06b6d4' },
            { label: 'Z POSITION', value: zPos.toFixed(1), unit: 'mm', color: '#a78bfa' },
            { label: 'TEMPERATURE', value: temp.toFixed(1), unit: '°C', color: tempColor },
            { label: 'LOAD', value: load.toFixed(0), unit: '%', color: loadColor },
            { label: 'PRESSURE', value: pressure.toFixed(1), unit: 'PSI', color: '#f472b6' },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${42 + i * 36})`}>
              <text x="0" y="0" fill={textSecondary} fontSize="9" fontFamily="monospace">{item.label}</text>
              <text x="194" y="0" fill={item.color} fontSize="15" textAnchor="end" fontFamily="monospace" fontWeight="bold">{item.value}</text>
              <text x="194" y="14" fill={textSecondary} fontSize="8" textAnchor="end" fontFamily="monospace">{item.unit}</text>
              {item.label === 'LOAD' && (
                <>
                  <rect x="0" y="18" width="184" height="5" fill={isDark ? '#1e3a5f' : '#dbeafe'} rx="2"/>
                  <rect x="0" y="18" width={184 * (load / 100)} height="5" fill={loadColor} rx="2"/>
                </>
              )}
            </g>
          ))}
        </g>

        {/* Bottom Tabs */}
        <g transform="translate(20, 362)">
          {['SPINDLE', 'FEED', 'TOOL', 'OFFSET', 'CYCLE', 'POSITIONS'].map((tab, i) => (
            <g key={tab} transform={`translate(${i * 77}, 0)`} style={{ cursor: 'pointer' }}>
              <rect width="72" height="30" fill={i === 0 ? tabActiveBg : tabBg} stroke={i === 0 ? machineBodyStroke : panelBorder} strokeWidth="1" rx="4"/>
              <text x="36" y="20" fill={i === 0 ? 'white' : textSecondary} fontSize="9" textAnchor="middle" fontFamily="monospace">{tab}</text>
            </g>
          ))}
        </g>

        {/* Fault overlays */}
        {status === 'BREAKDOWN' && (
          <>
            <rect width="800" height="400" fill="rgba(239,68,68,0.12)"/>
            <rect x="280" y="170" width="240" height="60" fill="rgba(127,0,0,0.85)" rx="8"/>
            <text x="400" y="197" textAnchor="middle" fill="#fca5a5" fontSize="14" fontWeight="bold" fontFamily="monospace">⚠ FAULT DETECTED</text>
            <text x="400" y="218" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">CHECK MACHINE LOG</text>
          </>
        )}
        {status === 'MAINTENANCE' && (
          <>
            <rect width="800" height="400" fill="rgba(245,158,11,0.08)"/>
            <rect x="290" y="175" width="220" height="50" fill="rgba(80,55,0,0.85)" rx="8"/>
            <text x="400" y="205" textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="bold" fontFamily="monospace">🔧 IN MAINTENANCE</text>
          </>
        )}
      </svg>
    </div>
  );
}

export default CNCLatheHMI;