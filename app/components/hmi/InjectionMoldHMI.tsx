'use client';

import { useState, useEffect } from 'react';

interface InjectionMoldHMIProps {
  injectPressure: number;
  moldTemp: number;
  cycleTime: number;
  shots: number;
  temp: number;
  load: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
}

export function InjectionMoldHMI({
  injectPressure,
  moldTemp,
  cycleTime,
  shots,
  temp,
  load,
  status,
  compact = false
}: InjectionMoldHMIProps) {
  const [screwPosition, setScrewPosition] = useState(0);
  const [injectionPhase, setInjectionPhase] = useState<'INJECT' | 'HOLD' | 'RETRACT'>('RETRACT');

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setScrewPosition(prev => {
          const next = (prev + 2) % 100;
          if (next < 30) setInjectionPhase('RETRACT');
          else if (next < 70) setInjectionPhase('INJECT');
          else setInjectionPhase('HOLD');
          return next;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusColor = () => status === 'OPERATIONAL' ? '#22c55e' : status === 'BREAKDOWN' ? '#ef4444' : '#f59e0b';

  if (compact) {
    return (
      <div className="relative w-full h-full bg-[#0a1628] overflow-hidden">
        <svg viewBox="0 0 400 160" className="w-full h-full">
          <rect width="400" height="160" fill="#0a1628"/>
          <text x="10" y="20" fill="#67e8f9" fontSize="12" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
          
          {/* Hopper */}
          <polygon points="50,30 90,30 80,60 60,60" fill="#22c55e" stroke="#16a34a" strokeWidth="1"/>
          
          {/* Barrel */}
          <rect x="60" y="60" width="180" height="35" fill="#4b5563" stroke="#6b7280" strokeWidth="2" rx="2"/>
          
          {/* Heating Zones */}
          {[80, 120, 160, 200].map(x => (
            <rect key={x} x={x} y="60" width="30" height="35" fill="#f97316" opacity="0.7" stroke="#fb923c" strokeWidth="1"/>
          ))}
          
          {/* Screw */}
          <rect x={70 + screwPosition * 1.2} y="72" width="80" height="10" fill="#fbbf24" stroke="#fcd34d" strokeWidth="1"/>
          
          {/* Nozzle */}
          <polygon points="240,70 280,75 280,85 240,90" fill="#635bff" stroke="#a78bfa" strokeWidth="1"/>
          
          {/* Mold */}
          <rect x="280" y="50" width="50" height="60" fill="#374151" stroke="#6b7280" strokeWidth="2"/>
          
          {/* Clamping Unit */}
          <rect x="330" y="40" width="30" height="80" fill="#0891b2" stroke="#22d3ee" strokeWidth="2"/>
          
          <circle cx="380" cy="20" r="8" fill={getStatusColor()}>
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-orange-400">PRESS: <span className="text-white font-bold">{injectPressure}bar</span></span>
            <span className="text-cyan-400">TEMP: <span className="text-white font-bold">{moldTemp}°C</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden rounded-lg">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <defs>
          <pattern id="gridMold" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
          </pattern>
          <linearGradient id="heaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316"/>
            <stop offset="100%" stopColor="#ea580c"/>
          </linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#gridMold)"/>

        {/* Header */}
        <rect x="0" y="0" width="800" height="45" fill="#0f172a"/>
        <text x="20" y="30" fill="#67e8f9" fontSize="18" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
        <text x="120" y="30" fill="#94a3b8" fontSize="14" fontFamily="monospace">INJECTION MOLDING HMI</text>
        
        <rect x="650" y="12" width="130" height="22" fill={getStatusColor()} rx="4" opacity="0.2"/>
        <text x="715" y="28" fill={getStatusColor()} fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{status}</text>

        {/* Control Buttons */}
        <g transform="translate(20, 55)">
          {['MOTOR ON', 'HEATER ON', 'AUTO', 'MANUAL', 'RECIPE'].map((btn, i) => (
            <g key={btn} transform={`translate(${i * 85}, 0)`}>
              <rect width="75" height="28" fill={i < 2 ? '#fbbf24' : i === 2 ? '#3b82f6' : i === 3 ? '#06b6d4' : '#a855f7'} rx="4" opacity="0.9"/>
              <text x="37" y="18" fill={i < 2 ? '#1e3a5f' : 'white'} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{btn}</text>
            </g>
          ))}
        </g>

        {/* Machine Schematic */}
        <g transform="translate(30, 100)">
          {/* Clamping Unit (Left) */}
          <rect x="0" y="50" width="80" height="150" fill="#0891b2" stroke="#22d3ee" strokeWidth="3" rx="4"/>
          <text x="40" y="130" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">CLAMP</text>
          <text x="40" y="145" fill="#a5f3fc" fontSize="8" textAnchor="middle" fontFamily="monospace">UNIT</text>
          
          {/* Mold Cavity */}
          <rect x="80" y="70" width="100" height="110" fill="#374151" stroke="#6b7280" strokeWidth="2"/>
          <rect x="100" y="90" width="60" height="70" fill="#1e3a5f" stroke="#334155" strokeWidth="1"/>
          <text x="130" y="130" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">MOLD</text>
          
          {/* Injection Unit */}
          <rect x="180" y="60" width="280" height="50" fill="#4b5563" stroke="#6b7280" strokeWidth="2" rx="2"/>
          
          {/* Heating Zones */}
          {[200, 250, 300, 350, 400].map((x, i) => (
            <g key={x}>
              <rect x={x} y="60" width="40" height="50" fill="url(#heaterGrad)" opacity="0.8" stroke="#fb923c" strokeWidth="1"/>
              <text x={x + 20} y="90" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">H{i + 1}</text>
            </g>
          ))}
          
          {/* Screw */}
          <rect x={190 + screwPosition * 2} y="75" width="100" height="20" fill="#fbbf24" stroke="#fcd34d" strokeWidth="2" rx="2">
            {status === 'OPERATIONAL' && <animate attributeName="x" values="190;340;190" dur={`${cycleTime / 10}s`} repeatCount="indefinite"/>}
          </rect>
          
          {/* Screw Threads */}
          <g fill="none" stroke="#d97706" strokeWidth="1">
            {Array.from({length: 8}).map((_, i) => (
              <line key={i} x1={210 + screwPosition * 2 + i * 10} y1="75" x2={215 + screwPosition * 2 + i * 10} y2="95"/>
            ))}
          </g>
          
          {/* Hopper */}
          <polygon points="280,20 320,20 310,60 290,60" fill="#22c55e" stroke="#16a34a" strokeWidth="2"/>
          <text x="300" y="45" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">PELLETS</text>
          
          {/* Nozzle */}
          <polygon points="460,75 510,85 510,95 460,105" fill="#635bff" stroke="#a78bfa" strokeWidth="2"/>
          <text x="485" y="95" fill="white" fontSize="7" textAnchor="middle" fontFamily="monospace">NOZZLE</text>
          
          {/* Phase Indicator */}
          <rect x="200" y="120" width="120" height="25" fill="#0f172a" stroke="#1e3a5f" strokeWidth="1" rx="4"/>
          <text x="260" y="138" fill={injectionPhase === 'INJECT' ? '#ef4444' : injectionPhase === 'HOLD' ? '#f59e0b' : '#22c55e'} fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{injectionPhase}</text>
        </g>

        {/* Right Panel - Live Data */}
        <g transform="translate(580, 55)">
          <rect width="200" height="280" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" rx="8"/>
          <text x="100" y="25" fill="#67e8f9" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
          
          {[
            { label: 'INJ PRESS', value: injectPressure, unit: 'bar', color: '#f97316' },
            { label: 'MOLD TEMP', value: moldTemp, unit: '°C', color: '#22c55e' },
            { label: 'CYCLE TIME', value: cycleTime, unit: 's', color: '#06b6d4' },
            { label: 'SHOTS', value: shots, unit: '', color: '#a78bfa' },
            { label: 'TEMP', value: temp, unit: '°C', color: temp > 80 ? '#ef4444' : '#22c55e' },
            { label: 'LOAD', value: load, unit: '%', color: load > 80 ? '#ef4444' : '#635bff' },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${45 + i * 38})`}>
              <text x="0" y="0" fill="#94a3b8" fontSize="10" fontFamily="monospace">{item.label}</text>
              <text x="180" y="0" fill={item.color} fontSize="16" textAnchor="end" fontFamily="monospace" fontWeight="bold">
                {typeof item.value === 'number' ? item.value.toFixed(item.unit === 's' ? 1 : 0) : item.value}
              </text>
              <text x="180" y="15" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{item.unit}</text>
            </g>
          ))}
        </g>

        {/* Bottom Tabs */}
        <g transform="translate(20, 360)">
          {['HEATER', 'MOLD', 'INJECTION', 'PRESSURE', 'TIMER', 'EJECT'].map((tab, i) => (
            <g key={tab} transform={`translate(${i * 75}, 0)`}>
              <rect width="70" height="30" fill={i === 2 ? '#0891b2' : '#1e3a5f'} stroke={i === 2 ? '#22d3ee' : '#334155'} strokeWidth="1" rx="4"/>
              <text x="35" y="20" fill={i === 2 ? 'white' : '#94a3b8'} fontSize="10" textAnchor="middle" fontFamily="monospace">{tab}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default InjectionMoldHMI;