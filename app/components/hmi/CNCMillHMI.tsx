'use client';

import { useState, useEffect } from 'react';

interface CNCMillHMIProps {
  rpm: number;
  feed: number;
  xPos: number;
  yPos: number;
  zPos: number;
  temp: number;
  load: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
}

export function CNCMillHMI({
  rpm,
  feed,
  xPos,
  yPos,
  zPos,
  temp,
  load,
  status,
  compact = false
}: CNCMillHMIProps) {
  const [spindleAngle, setSpindleAngle] = useState(0);

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setSpindleAngle(prev => (prev + rpm / 60) % 360);
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
        <svg viewBox="0 0 400 160" className="w-full h-full">
          <defs>
            <pattern id="gridMill" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="400" height="160" fill="url(#gridMill)"/>
          
          <text x="10" y="20" fill="#67e8f9" fontSize="12" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
          
          {/* Column */}
          <rect x="50" y="30" width="40" height="100" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" rx="2"/>
          
          {/* Spindle Head */}
          <rect x="90" y="50" width="80" height="50" fill="#4b5563" stroke="#9ca3af" strokeWidth="2" rx="4"/>
          
          {/* Rotating Spindle */}
          <g transform="translate(130, 110)">
            <circle r="20" fill="#1e3a5f" stroke="#fbbf24" strokeWidth="2"/>
            <g transform={`rotate(${spindleAngle})`}>
              <line x1="0" y1="-15" x2="0" y2="15" stroke="#fbbf24" strokeWidth="2"/>
              <line x1="-15" y1="0" x2="15" y2="0" stroke="#fbbf24" strokeWidth="2"/>
            </g>
            {/* End Mill */}
            <rect x="-8" y="0" width="16" height="30" fill="#635bff" rx="2"/>
          </g>
          
          {/* Table with Workpiece */}
          <rect x="80" y="145" width="120" height="15" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
          <rect x="100" y="138" width="60" height="10" fill="#22c55e" rx="1"/>
          
          {/* Status */}
          <circle cx="380" cy="20" r="8" fill={getStatusColor()}>
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
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

  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden rounded-lg">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <defs>
          <pattern id="gridFullMill" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
          </pattern>
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4b5563"/>
            <stop offset="50%" stopColor="#6b7280"/>
            <stop offset="100%" stopColor="#4b5563"/>
          </linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#gridFullMill)"/>

        {/* Header */}
        <rect x="0" y="0" width="800" height="45" fill="#0f172a"/>
        <text x="20" y="30" fill="#67e8f9" fontSize="18" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
        <text x="120" y="30" fill="#94a3b8" fontSize="14" fontFamily="monospace">CNC MILL HMI</text>
        
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

        {/* Machine Schematic */}
        <g transform="translate(50, 100)">
          {/* Base */}
          <rect x="0" y="230" width="450" height="20" fill="url(#metalGrad)" stroke="#6b7280" strokeWidth="2"/>
          
          {/* Column */}
          <rect x="30" y="30" width="60" height="200" fill="#0891b2" stroke="#22d3ee" strokeWidth="3" rx="4"/>
          <text x="60" y="130" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace" transform="rotate(-90, 60, 130)">COLUMN</text>
          
          {/* Spindle Head */}
          <rect x="80" y="60" width="120" height="80" fill="#374151" stroke="#6b7280" strokeWidth="2" rx="4"/>
          <text x="140" y="95" fill="white" fontSize="11" textAnchor="middle" fontFamily="monospace">SPINDLE HEAD</text>
          <text x="140" y="115" fill="#fbbf24" fontSize="10" textAnchor="middle" fontFamily="monospace">{rpm} RPM</text>
          
          {/* Quill/Spindle */}
          <g transform="translate(140, 150)">
            <rect x="-20" y="0" width="40" height="60" fill="#4b5563" stroke="#9ca3af" strokeWidth="2" rx="2"/>
            {/* Rotating End Mill */}
            <g transform={`rotate(${spindleAngle})`}>
              <circle r="25" fill="#1e3a5f" stroke="#fbbf24" strokeWidth="2"/>
              <line x1="0" y1="-20" x2="0" y2="20" stroke="#fbbf24" strokeWidth="2"/>
              <line x1="-20" y1="0" x2="20" y2="0" stroke="#fbbf24" strokeWidth="2"/>
            </g>
            <rect x="-10" y="25" width="20" height="50" fill="#635bff" rx="2"/>
            
            {/* Cutting sparks */}
            {status === 'OPERATIONAL' && (
              <g className="animate-pulse">
                <circle cx="0" cy="75" r="8" fill="#f97316" opacity="0.6"/>
                <circle cx="5" cy="70" r="4" fill="#fbbf24" opacity="0.4"/>
              </g>
            )}
          </g>
          
          {/* Work Table */}
          <rect x="60" y="200" width="180" height="30" fill="#374151" stroke="#6b7280" strokeWidth="2" rx="2"/>
          
          {/* Workpiece on Table */}
          <rect x="100" y="190" width="80" height="15" fill="#22c55e" stroke="#16a34a" strokeWidth="1" rx="1"/>
          <text x="140" y="200" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">WORKPIECE</text>
          
          {/* T-Slots on Table */}
          {[80, 120, 160, 200].map(x => (
            <rect key={x} x={x} y="205" width="4" height="25" fill="#1e3a5f"/>
          ))}
          
          {/* Axes Indicators */}
          <g transform="translate(260, 200)">
            {/* X Axis */}
            <line x1="0" y1="0" x2="80" y2="0" stroke="#ef4444" strokeWidth="2"/>
            <polygon points="80,0 70,-5 70,5" fill="#ef4444"/>
            <text x="40" y="-10" fill="#ef4444" fontSize="10" textAnchor="middle" fontFamily="monospace">X</text>
            
            {/* Y Axis */}
            <line x1="0" y1="0" x2="0" y2="-60" stroke="#22c55e" strokeWidth="2"/>
            <polygon points="0,-60 -5,-50 5,-50" fill="#22c55e"/>
            <text x="-15" y="-30" fill="#22c55e" fontSize="10" textAnchor="middle" fontFamily="monospace">Y</text>
            
            {/* Z Axis */}
            <line x1="0" y1="0" x2="-40" y2="40" stroke="#3b82f6" strokeWidth="2"/>
            <polygon points="-40,40 -28,38 -35,28" fill="#3b82f6"/>
            <text x="-50" y="25" fill="#3b82f6" fontSize="10" textAnchor="middle" fontFamily="monospace">Z</text>
          </g>
        </g>

        {/* Right Panel - Live Data */}
        <g transform="translate(580, 55)">
          <rect width="200" height="280" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" rx="8"/>
          <text x="100" y="25" fill="#67e8f9" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
          
          {[
            { label: 'SPINDLE RPM', value: rpm, unit: '', color: '#fbbf24' },
            { label: 'FEED RATE', value: feed, unit: 'mm/min', color: '#22c55e' },
            { label: 'X POSITION', value: xPos, unit: 'mm', color: '#ef4444' },
            { label: 'Y POSITION', value: yPos, unit: 'mm', color: '#22c55e' },
            { label: 'Z POSITION', value: zPos, unit: 'mm', color: '#3b82f6' },
            { label: 'TEMPERATURE', value: temp, unit: '°C', color: tempColor },
            { label: 'LOAD', value: load, unit: '%', color: loadColor },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${45 + i * 33})`}>
              <text x="0" y="0" fill="#94a3b8" fontSize="10" fontFamily="monospace">{item.label}</text>
              <text x="180" y="0" fill={item.color} fontSize="16" textAnchor="end" fontFamily="monospace" fontWeight="bold">
                {typeof item.value === 'number' ? item.value.toFixed(item.unit === 'mm' ? 1 : 0) : item.value}
              </text>
              <text x="180" y="15" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{item.unit}</text>
              {item.label === 'LOAD' && (
                <rect x="0" y="20" width="180" height="6" fill="#1e3a5f" rx="3">
                  <rect x="0" y="0" width={180 * (load / 100)} height="6" fill={loadColor} rx="3"/>
                </rect>
              )}
            </g>
          ))}
        </g>

        {/* Bottom Tabs */}
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

export default CNCMillHMI;