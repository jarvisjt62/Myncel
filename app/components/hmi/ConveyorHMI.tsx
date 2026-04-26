'use client';

import { useState, useEffect } from 'react';

interface ConveyorHMIProps {
  speed: number;
  count: number;
  load: number;
  runtime: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
}

export function ConveyorHMI({
  speed,
  count,
  load,
  runtime,
  status,
  compact = false
}: ConveyorHMIProps) {
  const [boxPositions, setBoxPositions] = useState([0, 50, 100]);

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setBoxPositions(prev => prev.map(p => (p + speed / 10) % 150));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [speed, status]);

  const getStatusColor = () => status === 'OPERATIONAL' ? '#22c55e' : status === 'BREAKDOWN' ? '#ef4444' : '#f59e0b';

  if (compact) {
    return (
      <div className="relative w-full h-full bg-[#0a1628] overflow-hidden">
        <svg viewBox="0 0 400 160" className="w-full h-full">
          <rect width="400" height="160" fill="#0a1628"/>
          <text x="10" y="20" fill="#67e8f9" fontSize="12" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
          
          {/* Belt */}
          <rect x="20" y="80" width="360" height="25" fill="#22c55e" stroke="#16a34a" strokeWidth="2" rx="4"/>
          
          {/* Rollers */}
          {[30, 100, 170, 240, 310, 370].map(x => (
            <circle key={x} cx={x} cy="92" r="10" fill="#374151" stroke="#6b7280" strokeWidth="2"/>
          ))}
          
          {/* Moving Boxes */}
          {boxPositions.map((pos, i) => (
            <rect key={i} x={20 + pos} y="60" width="30" height="20" fill="#fbbf24" stroke="#fcd34d" strokeWidth="1" rx="2"/>
          ))}
          
          {/* Motor */}
          <rect x="20" y="105" width="40" height="30" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" rx="2"/>
          
          <circle cx="380" cy="20" r="8" fill={getStatusColor()}>
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-green-400">SPEED: <span className="text-white font-bold">{speed}m/s</span></span>
            <span className="text-yellow-400">COUNT: <span className="text-white font-bold">{count}</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden rounded-lg">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <defs>
          <pattern id="gridConv" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#gridConv)"/>

        {/* Header */}
        <rect x="0" y="0" width="800" height="45" fill="#0f172a"/>
        <text x="20" y="30" fill="#67e8f9" fontSize="18" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
        <text x="120" y="30" fill="#94a3b8" fontSize="14" fontFamily="monospace">CONVEYOR BELT HMI</text>
        
        <rect x="650" y="12" width="130" height="22" fill={getStatusColor()} rx="4" opacity="0.2"/>
        <text x="715" y="28" fill={getStatusColor()} fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{status}</text>

        {/* Control Buttons */}
        <g transform="translate(20, 55)">
          {['MOTOR ON', 'START', 'STOP', 'AUTO', 'E-STOP'].map((btn, i) => (
            <g key={btn} transform={`translate(${i * 85}, 0)`}>
              <rect width="75" height="28" fill={i === 0 ? '#fbbf24' : i === 1 ? '#22c55e' : i === 2 ? '#ef4444' : i === 3 ? '#3b82f6' : '#dc2626'} rx="4" opacity="0.9"/>
              <text x="37" y="18" fill={i === 0 ? '#1e3a5f' : 'white'} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{btn}</text>
            </g>
          ))}
        </g>

        {/* Machine Schematic */}
        <g transform="translate(50, 100)">
          {/* Drive Motor */}
          <rect x="0" y="100" width="80" height="80" fill="#0891b2" stroke="#22d3ee" strokeWidth="3" rx="8"/>
          <text x="40" y="145" fill="white" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MOTOR</text>
          
          {/* Drive Roller */}
          <circle cx="120" cy="100" r="30" fill="#374151" stroke="#6b7280" strokeWidth="3"/>
          <text x="120" y="105" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">DRIVE</text>
          
          {/* Belt */}
          <rect x="100" y="70" width="380" height="60" fill="#22c55e" stroke="#16a34a" strokeWidth="3" rx="4"/>
          
          {/* Belt Texture Lines */}
          {Array.from({length: 20}).map((_, i) => (
            <line key={i} x1={120 + i * 20} y1="75" x2={120 + i * 20} y2="125" stroke="#16a34a" strokeWidth="1" opacity="0.5"/>
          ))}
          
          {/* Support Rollers */}
          {[180, 260, 340, 420].map(x => (
            <circle key={x} cx={x} cy="100" r="15" fill="#4b5563" stroke="#6b7280" strokeWidth="2"/>
          ))}
          
          {/* Moving Boxes */}
          {boxPositions.map((pos, i) => (
            <g key={i} transform={`translate(${150 + pos * 2}, 50)`}>
              <rect width="40" height="25" fill="#fbbf24" stroke="#fcd34d" strokeWidth="2" rx="3"/>
              <text x="20" y="16" fill="#1e3a5f" fontSize="8" textAnchor="middle" fontFamily="monospace">BOX</text>
            </g>
          ))}
          
          {/* Sensors */}
          {[200, 300, 400].map((x, i) => (
            <g key={x}>
              <rect x={x - 15} y="30" width="30" height="35" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2" rx="4"/>
              <text x={x} y="52" fill="white" fontSize="7" textAnchor="middle" fontFamily="monospace">S{i + 1}</text>
              <circle cx={x} cy="70" r="5" fill="#22c55e">
                <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite"/>
              </circle>
            </g>
          ))}
          
          {/* Tail Roller */}
          <circle cx="520" cy="100" r="30" fill="#374151" stroke="#6b7280" strokeWidth="3"/>
        </g>

        {/* Right Panel */}
        <g transform="translate(580, 55)">
          <rect width="200" height="280" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" rx="8"/>
          <text x="100" y="25" fill="#67e8f9" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
          
          {[
            { label: 'SPEED', value: speed, unit: 'm/s', color: '#22c55e' },
            { label: 'COUNT', value: count, unit: 'pcs', color: '#fbbf24' },
            { label: 'LOAD', value: load, unit: '%', color: load > 80 ? '#ef4444' : '#635bff' },
            { label: 'RUNTIME', value: runtime, unit: 'h', color: '#a78bfa' },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${45 + i * 55})`}>
              <text x="0" y="0" fill="#94a3b8" fontSize="10" fontFamily="monospace">{item.label}</text>
              <text x="180" y="0" fill={item.color} fontSize="20" textAnchor="end" fontFamily="monospace" fontWeight="bold">{item.value}</text>
              <text x="180" y="20" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">{item.unit}</text>
            </g>
          ))}
        </g>

        {/* Bottom Tabs */}
        <g transform="translate(20, 360)">
          {['SPEED', 'COUNT', 'TIMER', 'SENSORS', 'RESET', 'DIAG'].map((tab, i) => (
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

export default ConveyorHMI;