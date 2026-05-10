'use client';

import { useState, useEffect } from 'react';

interface CompressorHMIProps {
  pressure: number;
  flow: number;
  temp: number;
  runtime: number;
  load: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
}

export function CompressorHMI({
  pressure,
  flow,
  temp,
  runtime,
  load,
  status,
  compact = false
}: CompressorHMIProps) {
  const [rotorAngle, setRotorAngle] = useState(0);

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setRotorAngle(prev => (prev + 5) % 360);
      }, 16);
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
          
          {/* Motor */}
          <rect x="30" y="50" width="60" height="60" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" rx="4"/>
          
          {/* Compressor Unit */}
          <rect x="100" y="45" width="80" height="70" fill="#fbbf24" stroke="#fcd34d" strokeWidth="2" rx="4"/>
          <circle cx="140" cy="80" r="20" fill="#1e3a5f" stroke="#fbbf24" strokeWidth="2"/>
          <g transform={`rotate(${rotorAngle}, 140, 80)`}>
            <line x1="140" y1="65" x2="140" y2="95" stroke="#fbbf24" strokeWidth="3"/>
          </g>
          
          {/* Air Tank */}
          <ellipse cx="280" cy="80" rx="60" ry="35" fill="#374151" stroke="#6b7280" strokeWidth="2"/>
          
          {/* Pipes */}
          <path d="M 180 80 L 220 80" stroke="#06b6d4" strokeWidth="4" fill="none"/>
          
          <circle cx="380" cy="20" r="8" fill={getStatusColor()}>
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-cyan-400">PRESS: <span className="text-white font-bold">{pressure}bar</span></span>
            <span className="text-green-400">FLOW: <span className="text-white font-bold">{flow}L/min</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden rounded-lg">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <defs>
          <pattern id="gridComp" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#gridComp)"/>

        {/* Header */}
        <rect x="0" y="0" width="800" height="45" fill="#0f172a"/>
        <text x="20" y="30" fill="#67e8f9" fontSize="18" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
        <text x="120" y="30" fill="#94a3b8" fontSize="14" fontFamily="monospace">AIR COMPRESSOR HMI</text>
        
        <rect x="650" y="12" width="130" height="22" fill={getStatusColor()} rx="4" opacity="0.2"/>
        <text x="715" y="28" fill={getStatusColor()} fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{status}</text>

        {/* Control Buttons */}
        <g transform="translate(20, 55)">
          {['MOTOR ON', 'LOAD ON', 'AUTO', 'MANUAL', 'UNLOAD'].map((btn, i) => (
            <g key={btn} transform={`translate(${i * 85}, 0)`}>
              <rect width="75" height="28" fill={i < 2 ? '#fbbf24' : i === 2 ? '#3b82f6' : i === 3 ? '#06b6d4' : '#22c55e'} rx="4" opacity="0.9"/>
              <text x="37" y="18" fill={i < 2 ? '#1e3a5f' : 'white'} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{btn}</text>
            </g>
          ))}
        </g>

        {/* Machine Schematic */}
        <g transform="translate(50, 100)">
          {/* Electric Motor */}
          <rect x="0" y="60" width="100" height="100" fill="#0891b2" stroke="#22d3ee" strokeWidth="3" rx="8"/>
          <text x="50" y="115" fill="white" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MOTOR</text>
          
          {/* Motor Shaft */}
          <rect x="100" y="100" width="40" height="20" fill="#4b5563" stroke="#6b7280" strokeWidth="1"/>
          
          {/* Compressor Unit */}
          <rect x="140" y="40" width="150" height="140" fill="#fbbf24" stroke="#fcd34d" strokeWidth="3" rx="8"/>
          <text x="215" y="65" fill="#1e3a5f" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">ROTARY SCREW</text>
          
          {/* Rotating Screw */}
          <g transform="translate(215, 120)">
            <circle r="45" fill="#1e3a5f" stroke="#fbbf24" strokeWidth="3"/>
            <g transform={`rotate(${rotorAngle})`}>
              <ellipse cx="0" cy="0" rx="35" ry="15" fill="none" stroke="#fbbf24" strokeWidth="2"/>
              <ellipse cx="0" cy="0" rx="15" ry="35" fill="none" stroke="#fbbf24" strokeWidth="2"/>
            </g>
          </g>
          
          {/* Air Intake */}
          <rect x="140" y="120" width="25" height="40" fill="#06b6d4" opacity="0.5" stroke="#22d3ee" strokeWidth="1"/>
          <text x="152" y="145" fill="white" fontSize="7" textAnchor="middle" fontFamily="monospace">AIR IN</text>
          
          {/* Discharge Pipe */}
          <path d="M 290 110 L 350 110 L 350 140" stroke="#06b6d4" strokeWidth="6" fill="none"/>
          <polygon points="350,140 340,125 360,125" fill="#06b6d4"/>
          
          {/* Air Receiver Tank */}
          <ellipse cx="450" cy="120" rx="90" ry="60" fill="#374151" stroke="#6b7280" strokeWidth="3"/>
          <text x="450" y="115" fill="white" fontSize="11" textAnchor="middle" fontFamily="monospace">RECEIVER</text>
          <text x="450" y="135" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">TANK</text>
          
          {/* Pressure Gauge on Tank */}
          <circle cx="450" cy="70" r="20" fill="#0f172a" stroke="#22c55e" strokeWidth="2"/>
          <text x="450" y="75" fill="#22c55e" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{pressure}</text>
          
          {/* Outlet */}
          <rect x="540" y="105" width="30" height="30" fill="#22c55e" opacity="0.3" stroke="#22c55e" strokeWidth="2"/>
          <text x="555" y="125" fill="white" fontSize="7" textAnchor="middle" fontFamily="monospace">OUT</text>
        </g>

        {/* Right Panel */}
        <g transform="translate(580, 55)">
          <rect width="200" height="280" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" rx="8"/>
          <text x="100" y="25" fill="#67e8f9" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
          
          {[
            { label: 'PRESSURE', value: pressure, unit: 'bar', color: '#06b6d4' },
            { label: 'FLOW RATE', value: flow, unit: 'L/min', color: '#22c55e' },
            { label: 'TEMPERATURE', value: temp, unit: '°C', color: temp > 80 ? '#ef4444' : '#22c55e' },
            { label: 'RUNTIME', value: runtime, unit: 'h', color: '#a78bfa' },
            { label: 'LOAD', value: load, unit: '%', color: load > 80 ? '#ef4444' : '#635bff' },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${45 + i * 45})`}>
              <text x="0" y="0" fill="#94a3b8" fontSize="10" fontFamily="monospace">{item.label}</text>
              <text x="180" y="0" fill={item.color} fontSize="18" textAnchor="end" fontFamily="monospace" fontWeight="bold">{item.value}</text>
              <text x="180" y="18" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">{item.unit}</text>
            </g>
          ))}
        </g>

        {/* Bottom Tabs */}
        <g transform="translate(20, 360)">
          {['PRESSURE', 'FLOW', 'TEMP', 'TIMER', 'FILTER', 'DRAIN'].map((tab, i) => (
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

export default CompressorHMI;