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
}

export function CNCLatheHMI({
  rpm,
  feed,
  xPos,
  zPos,
  temp,
  load,
  pressure,
  status,
  compact = false
}: CNCLatheHMIProps) {
  const [spindleAngle, setSpindleAngle] = useState(0);
  const [toolMoving, setToolMoving] = useState(false);

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setSpindleAngle(prev => (prev + rpm / 60) % 360);
        setToolMoving(true);
      }, 16);
      return () => clearInterval(interval);
    }
  }, [rpm, status]);

  const getStatusColor = () => {
    switch (status) {
      case 'OPERATIONAL': return '#22c55e';
      case 'BREAKDOWN': return '#ef4444';
      case 'MAINTENANCE': return '#f59e0b';
    }
  };

  const tempColor = temp > 90 ? '#ef4444' : temp > 75 ? '#f59e0b' : '#22c55e';
  const loadColor = load > 90 ? '#ef4444' : load > 70 ? '#f59e0b' : '#635bff';

  if (compact) {
    return (
      <div className="relative w-full h-full bg-[#0a1628] overflow-hidden">
        {/* Compact View - Simplified Schematic */}
        <svg viewBox="0 0 400 160" className="w-full h-full">
          {/* Background Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="400" height="160" fill="url(#grid)"/>

          {/* MYNCEL Logo */}
          <text x="10" y="20" fill="#67e8f9" fontSize="12" fontWeight="bold" fontFamily="monospace">MYNCEL</text>

          {/* Spindle Housing */}
          <rect x="30" y="50" width="80" height="60" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" rx="4"/>
          <text x="70" y="85" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">SPINDLE</text>

          {/* Rotating Chuck */}
          <g transform={`translate(130, 80)`}>
            <circle r="25" fill="#1e3a5f" stroke="#fbbf24" strokeWidth="3"/>
            <g transform={`rotate(${spindleAngle})`}>
              <line x1="0" y1="-20" x2="0" y2="20" stroke="#fbbf24" strokeWidth="2"/>
              <line x1="-20" y1="0" x2="20" y2="0" stroke="#fbbf24" strokeWidth="2"/>
            </g>
            {/* Workpiece */}
            <rect x="-8" y="-30" width="16" height="60" fill="#22c55e" rx="2"/>
          </g>

          {/* Tool Turret */}
          <rect x="200" y="40" width="40" height="80" fill="#374151" stroke="#9ca3af" strokeWidth="2" rx="2"/>
          <polygon points="240,80 280,75 280,85" fill="#635bff" stroke="#a78bfa" strokeWidth="1"/>
          
          {/* Cutting Action Indicator */}
          {status === 'OPERATIONAL' && (
            <g className="animate-pulse">
              <circle cx="170" cy="80" r="8" fill="#f97316" opacity="0.7"/>
              <circle cx="175" cy="75" r="4" fill="#fbbf24" opacity="0.5"/>
            </g>
          )}

          {/* Status LED */}
          <circle cx="380" cy="20" r="8" fill={getStatusColor()}>
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>

        {/* Live Data Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-cyan-400">RPM: <span className="text-white font-bold">{rpm}</span></span>
            <span className="text-green-400">LOAD: <span className="text-white font-bold">{load}%</span></span>
            <span style={{ color: tempColor }}>TEMP: <span className="text-white font-bold">{temp}°C</span></span>
          </div>
        </div>
      </div>
    );
  }

  // Full Detail View
  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden rounded-lg">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        {/* Background Grid */}
        <defs>
          <pattern id="gridFull" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
          </pattern>
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4b5563"/>
            <stop offset="50%" stopColor="#6b7280"/>
            <stop offset="100%" stopColor="#4b5563"/>
          </linearGradient>
          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0891b2"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#gridFull)"/>

        {/* Header Bar */}
        <rect x="0" y="0" width="800" height="45" fill="#0f172a"/>
        <text x="20" y="30" fill="#67e8f9" fontSize="18" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
        <text x="120" y="30" fill="#94a3b8" fontSize="14" fontFamily="monospace">CNC LATHE HMI</text>
        
        {/* Status Badge */}
        <rect x="650" y="12" width="130" height="22" fill={getStatusColor()} rx="4" opacity="0.2"/>
        <text x="715" y="28" fill={getStatusColor()} fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{status}</text>

        {/* Control Buttons */}
        <g transform="translate(20, 55)">
          {['MOTOR ON', 'SPINDLE ON', 'AUTO', 'MANUAL', 'CYCLE'].map((btn, i) => (
            <g key={btn} transform={`translate(${i * 85}, 0)`}>
              <rect width="75" height="28" fill={i < 2 ? '#fbbf24' : i === 2 ? '#3b82f6' : i === 3 ? '#06b6d4' : '#22c55e'} rx="4" opacity="0.9"/>
              <text x="37" y="18" fill={i < 2 ? '#1e3a5f' : 'white'} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{btn}</text>
            </g>
          ))}
        </g>

        {/* Main Machine Schematic */}
        <g transform="translate(50, 100)">
          {/* Bed/Base */}
          <rect x="0" y="200" width="500" height="30" fill="url(#metalGradient)" stroke="#6b7280" strokeWidth="2" rx="2"/>
          
          {/* Spindle Housing */}
          <rect x="20" y="80" width="120" height="120" fill="url(#cyanGradient)" stroke="#22d3ee" strokeWidth="3" rx="8"/>
          <text x="80" y="145" fill="white" fontSize="14" textAnchor="middle" fontFamily="monospace" fontWeight="bold">SPINDLE</text>
          <text x="80" y="165" fill="#a5f3fc" fontSize="11" textAnchor="middle" fontFamily="monospace">{rpm} RPM</text>

          {/* Rotating Chuck with Workpiece */}
          <g transform="translate(180, 140)">
            {/* Chuck Body */}
            <circle r="45" fill="#1e3a5f" stroke="#fbbf24" strokeWidth="4"/>
            <circle r="35" fill="#0f172a" stroke="#fbbf24" strokeWidth="2"/>
            <g transform={`rotate(${spindleAngle})`}>
              {/* Chuck Jaws */}
              {[0, 120, 240].map((angle, i) => (
                <g key={i} transform={`rotate(${angle})`}>
                  <rect x="-8" y="-45" width="16" height="20" fill="#fbbf24" rx="2"/>
                </g>
              ))}
            </g>
            {/* Workpiece */}
            <rect x="-12" y="-80" width="24" height="160" fill="#22c55e" rx="3" opacity="0.9"/>
            <text x="0" y="5" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">PART</text>
          </g>

          {/* Tool Turret */}
          <g transform="translate(320, 100)">
            <rect x="0" y="0" width="60" height="120" fill="#374151" stroke="#9ca3af" strokeWidth="2" rx="4"/>
            {/* Tool Holders */}
            {[0, 40, 80].map((y, i) => (
              <g key={i} transform={`translate(0, ${y})`}>
                <rect x="55" y="5" width="80" height="30" fill="#4b5563" stroke="#6b7280" strokeWidth="1" rx="2"/>
                <polygon points="135,20 160,15 160,25" fill={i === 1 ? '#635bff' : '#6b7280'} stroke="#a78bfa" strokeWidth="1"/>
              </g>
            ))}
            <text x="30" y="65" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">TURRET</text>
          </g>

          {/* Cutting Zone Indicator */}
          {status === 'OPERATIONAL' && (
            <g className="animate-pulse">
              <circle cx="215" cy="140" r="15" fill="#f97316" opacity="0.6"/>
              <circle cx="220" cy="135" r="8" fill="#fbbf24" opacity="0.4"/>
              <circle cx="210" cy="145" r="5" fill="#fef08a" opacity="0.3"/>
            </g>
          )}

          {/* Chips/Ejects Animation */}
          {status === 'OPERATIONAL' && (
            <g>
              {Array.from({ length: 5 }).map((_, i) => (
                <circle 
                  key={i}
                  cx={230 + Math.random() * 20}
                  cy={120 + i * 15}
                  r="2"
                  fill="#fbbf24"
                  opacity={0.6}
                >
                  <animate 
                    attributeName="cx" 
                    values={`${230 + i * 5};${260 + i * 10};${230 + i * 5}`} 
                    dur={`${0.5 + i * 0.1}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}
        </g>

        {/* Right Side Data Panel */}
        <g transform="translate(580, 55)">
          <rect width="200" height="280" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" rx="8"/>
          <text x="100" y="25" fill="#67e8f9" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
          
          {/* Readouts */}
          {[
            { label: 'SPINDLE RPM', value: rpm, unit: '', color: '#fbbf24' },
            { label: 'FEED RATE', value: feed, unit: 'mm/min', color: '#22c55e' },
            { label: 'X POSITION', value: xPos, unit: 'mm', color: '#06b6d4' },
            { label: 'Z POSITION', value: zPos, unit: 'mm', color: '#a78bfa' },
            { label: 'TEMPERATURE', value: temp, unit: '°C', color: tempColor },
            { label: 'LOAD', value: load, unit: '%', color: loadColor },
            { label: 'PRESSURE', value: pressure, unit: 'PSI', color: '#f472b6' },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${45 + i * 33})`}>
              <text x="0" y="0" fill="#94a3b8" fontSize="10" fontFamily="monospace">{item.label}</text>
              <text x="180" y="0" fill={item.color} fontSize="16" textAnchor="end" fontFamily="monospace" fontWeight="bold">
                {typeof item.value === 'number' ? item.value.toFixed(item.unit === 'mm' ? 1 : 0) : item.value}
              </text>
              <text x="180" y="15" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{item.unit}</text>
              {/* Bar indicator for percentage values */}
              {item.label === 'LOAD' && (
                <rect x="0" y="20" width="180" height="6" fill="#1e3a5f" rx="3">
                  <rect x="0" y="0" width={180 * (load / 100)} height="6" fill={loadColor} rx="3"/>
                </rect>
              )}
            </g>
          ))}
        </g>

        {/* Bottom Function Tabs */}
        <g transform="translate(20, 360)">
          {['SPINDLE', 'FEED', 'TOOL', 'OFFSET', 'CYCLE', 'POSITIONS'].map((tab, i) => (
            <g key={tab} transform={`translate(${i * 75}, 0)`}>
              <rect width="70" height="30" fill={i === 0 ? '#0891b2' : '#1e3a5f'} stroke={i === 0 ? '#22d3ee' : '#334155'} strokeWidth="1" rx="4"/>
              <text x="35" y="20" fill={i === 0 ? 'white' : '#94a3b8'} fontSize="10" textAnchor="middle" fontFamily="monospace">{tab}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default CNCLatheHMI;