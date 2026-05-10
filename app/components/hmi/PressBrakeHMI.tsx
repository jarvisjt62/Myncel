'use client';

import { useState, useEffect } from 'react';

interface PressBrakeHMIProps {
  force: number;
  angle: number;
  stroke: number;
  thickness: number;
  temp: number;
  load: number;
  pressure: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
}

export function PressBrakeHMI({
  force,
  angle,
  stroke,
  thickness,
  temp,
  load,
  pressure,
  status,
  compact = false
}: PressBrakeHMIProps) {
  const [ramPosition, setRamPosition] = useState(0);

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setRamPosition(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case 'OPERATIONAL': return '#22c55e';
      case 'BREAKDOWN': return '#ef4444';
      case 'MAINTENANCE': return '#f59e0b';
    }
  };

  const tempColor = temp > 80 ? '#ef4444' : temp > 60 ? '#f59e0b' : '#22c55e';

  if (compact) {
    return (
      <div className="relative w-full h-full bg-[#0a1628] overflow-hidden">
        <svg viewBox="0 0 400 160" className="w-full h-full">
          <defs>
            <pattern id="gridPress" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="400" height="160" fill="url(#gridPress)"/>
          
          <text x="10" y="20" fill="#67e8f9" fontSize="12" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
          
          {/* C-Frame */}
          <path d="M 80 30 L 80 130 L 300 130 L 300 30 L 280 30 L 280 110 L 100 110 L 100 30 Z" fill="#0891b2" stroke="#22d3ee" strokeWidth="2"/>
          
          {/* Hydraulic Cylinder */}
          <rect x="160" y="30" width="60" height="30" fill="#fbbf24" stroke="#fcd34d" strokeWidth="2" rx="2"/>
          
          {/* Ram */}
          <rect x="150" y="60" width="80" height="20" fill="#4b5563" stroke="#6b7280" strokeWidth="1"/>
          
          {/* Die */}
          <rect x="140" y="110" width="100" height="15" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
          
          {/* Sheet Metal */}
          <rect x="160" y="95" width="60" height="8" fill="#22c55e" rx="1" transform={`rotate(${status === 'OPERATIONAL' ? (ramPosition > 50 ? 45 : 0) : 0}, 190, 99)`}/>
          
          <circle cx="380" cy="20" r="8" fill={getStatusColor()}>
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-yellow-400">FORCE: <span className="text-white font-bold">{force}kN</span></span>
            <span className="text-cyan-400">ANGLE: <span className="text-white font-bold">{angle}°</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden rounded-lg">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <defs>
          <pattern id="gridFullPress" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
          </pattern>
          <linearGradient id="hydraulicGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24"/>
            <stop offset="100%" stopColor="#d97706"/>
          </linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#gridFullPress)"/>

        {/* Header */}
        <rect x="0" y="0" width="800" height="45" fill="#0f172a"/>
        <text x="20" y="30" fill="#67e8f9" fontSize="18" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
        <text x="120" y="30" fill="#94a3b8" fontSize="14" fontFamily="monospace">PRESS BRAKE HMI</text>
        
        <rect x="650" y="12" width="130" height="22" fill={getStatusColor()} rx="4" opacity="0.2"/>
        <text x="715" y="28" fill={getStatusColor()} fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{status}</text>

        {/* Control Buttons */}
        <g transform="translate(20, 55)">
          {['MOTOR ON', 'PUMP ON', 'AUTO', 'MANUAL', 'CYCLE'].map((btn, i) => (
            <g key={btn} transform={`translate(${i * 85}, 0)`}>
              <rect width="75" height="28" fill={i < 2 ? '#fbbf24' : i === 2 ? '#3b82f6' : i === 3 ? '#06b6d4' : '#22c55e'} rx="4" opacity="0.9"/>
              <text x="37" y="18" fill={i < 2 ? '#1e3a5f' : 'white'} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{btn}</text>
            </g>
          ))}
        </g>

        {/* Machine Schematic */}
        <g transform="translate(50, 100)">
          {/* C-Frame Structure */}
          <path d="M 50 20 L 50 250 L 400 250 L 400 20 L 370 20 L 370 220 L 80 220 L 80 20 Z" fill="#0891b2" stroke="#22d3ee" strokeWidth="3"/>
          
          {/* Hydraulic System */}
          <rect x="170" y="25" width="100" height="40" fill="url(#hydraulicGrad)" stroke="#fcd34d" strokeWidth="2" rx="4"/>
          <text x="220" y="50" fill="#1e3a5f" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">HYDRAULIC</text>
          
          {/* Ram Assembly */}
          <rect x="150" y="75" width="140" height="35" fill="#4b5563" stroke="#6b7280" strokeWidth="2" rx="2"/>
          <text x="220" y="97" fill="white" fontSize="10" textAnchor="middle" fontFamily="monospace">RAM</text>
          
          {/* Punch */}
          <polygon points="210,110 230,110 240,145 200,145" fill="#635bff" stroke="#a78bfa" strokeWidth="2"/>
          
          {/* Sheet Metal Being Bent */}
          <g transform={`translate(220, 170)`}>
            <rect x="-60" y="-15" width="120" height="8" fill="#22c55e" rx="1" transform={status === 'OPERATIONAL' ? `rotate(${ramPosition > 50 ? 45 : 0})` : ''}/>
            {status === 'OPERATIONAL' && ramPosition > 50 && (
              <>
                <rect x="-60" y="-15" width="120" height="8" fill="#22c55e" rx="1" transform="rotate(-45)"/>
                <rect x="-60" y="-15" width="120" height="8" fill="#22c55e" rx="1" transform="rotate(45)"/>
              </>
            )}
          </g>
          
          {/* Die V-Block */}
          <polygon points="170,200 270,200 250,185 190,185" fill="#374151" stroke="#6b7280" strokeWidth="2"/>
          <text x="220" y="215" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">V-DIE</text>
          
          {/* Back Gauge */}
          <rect x="320" y="120" width="15" height="80" fill="#4b5563" stroke="#6b7280" strokeWidth="1"/>
          <text x="327" y="165" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace" transform="rotate(90, 327, 165)">BACK GAUGE</text>
        </g>

        {/* Right Panel - Live Data */}
        <g transform="translate(580, 55)">
          <rect width="200" height="280" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" rx="8"/>
          <text x="100" y="25" fill="#67e8f9" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
          
          {[
            { label: 'FORCE', value: force, unit: 'kN', color: '#fbbf24' },
            { label: 'BEND ANGLE', value: angle, unit: '°', color: '#22c55e' },
            { label: 'STROKE', value: stroke, unit: 'mm', color: '#06b6d4' },
            { label: 'THICKNESS', value: thickness, unit: 'mm', color: '#a78bfa' },
            { label: 'HYD PRESS', value: pressure, unit: 'bar', color: '#f472b6' },
            { label: 'TEMPERATURE', value: temp, unit: '°C', color: tempColor },
            { label: 'LOAD', value: load, unit: '%', color: load > 70 ? '#ef4444' : '#635bff' },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${45 + i * 33})`}>
              <text x="0" y="0" fill="#94a3b8" fontSize="10" fontFamily="monospace">{item.label}</text>
              <text x="180" y="0" fill={item.color} fontSize="16" textAnchor="end" fontFamily="monospace" fontWeight="bold">
                {typeof item.value === 'number' ? item.value.toFixed(item.unit === 'mm' ? 1 : 0) : item.value}
              </text>
              <text x="180" y="15" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{item.unit}</text>
            </g>
          ))}
        </g>

        {/* Bottom Tabs */}
        <g transform="translate(20, 360)">
          {['PRESSURE', 'STROKE', 'ANGLE', 'TOOL', 'TIMER', 'SETUP'].map((tab, i) => (
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

export default PressBrakeHMI;