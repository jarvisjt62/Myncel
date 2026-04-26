'use client';

import { useState, useEffect } from 'react';

interface WelderHMIProps {
  voltage: number;
  current: number;
  wireFeed: number;
  duty: number;
  temp: number;
  load: number;
  gasPressure: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
}

export function WelderHMI({
  voltage,
  current,
  wireFeed,
  duty,
  temp,
  load,
  gasPressure,
  status,
  compact = false
}: WelderHMIProps) {
  const [arcIntensity, setArcIntensity] = useState(0);

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setArcIntensity(prev => (prev + 0.1) % 1);
      }, 50);
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
          
          {/* Power Supply */}
          <rect x="30" y="40" width="70" height="80" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" rx="4"/>
          
          {/* Wire Feed */}
          <rect x="110" y="50" width="50" height="40" fill="#fbbf24" stroke="#fcd34d" strokeWidth="2" rx="2"/>
          
          {/* Torch */}
          <rect x="170" y="55" width="80" height="15" fill="#4b5563" stroke="#6b7280" strokeWidth="1"/>
          <polygon points="250,60 290,60 280,75 260,75" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
          
          {/* Arc */}
          {status === 'OPERATIONAL' && (
            <g>
              <ellipse cx="270" cy="85" rx="15" ry="10" fill="#f97316" opacity={0.6 + arcIntensity * 0.4}/>
              <ellipse cx="270" cy="85" rx="8" ry="5" fill="#fef08a" opacity={0.7 + arcIntensity * 0.3}/>
            </g>
          )}
          
          {/* Workpiece */}
          <rect x="220" y="90" width="100" height="30" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
          
          {/* Gas Flow */}
          <path d="M 180 55 L 180 30 L 220 30" stroke="#06b6d4" strokeWidth="2" fill="none" strokeDasharray="4"/>
          
          <circle cx="380" cy="20" r="8" fill={getStatusColor()}>
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-yellow-400">V: <span className="text-white font-bold">{voltage}V</span></span>
            <span className="text-orange-400">A: <span className="text-white font-bold">{current}A</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden rounded-lg">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <defs>
          <pattern id="gridWeld" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="arcGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a"/>
            <stop offset="50%" stopColor="#f97316"/>
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="400" fill="url(#gridWeld)"/>

        {/* Header */}
        <rect x="0" y="0" width="800" height="45" fill="#0f172a"/>
        <text x="20" y="30" fill="#67e8f9" fontSize="18" fontWeight="bold" fontFamily="monospace">MYNCEL</text>
        <text x="120" y="30" fill="#94a3b8" fontSize="14" fontFamily="monospace">MIG WELDER HMI</text>
        
        <rect x="650" y="12" width="130" height="22" fill={getStatusColor()} rx="4" opacity="0.2"/>
        <text x="715" y="28" fill={getStatusColor()} fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{status}</text>

        {/* Control Buttons */}
        <g transform="translate(20, 55)">
          {['POWER ON', 'WIRE FEED', 'GAS ON', 'AUTO', 'MANUAL'].map((btn, i) => (
            <g key={btn} transform={`translate(${i * 85}, 0)`}>
              <rect width="75" height="28" fill={i < 2 ? '#fbbf24' : i === 2 ? '#06b6d4' : '#3b82f6'} rx="4" opacity="0.9"/>
              <text x="37" y="18" fill={i < 2 ? '#1e3a5f' : 'white'} fontSize="9" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{btn}</text>
            </g>
          ))}
        </g>

        {/* Machine Schematic */}
        <g transform="translate(50, 100)">
          {/* Power Supply Unit */}
          <rect x="0" y="20" width="120" height="140" fill="#0891b2" stroke="#22d3ee" strokeWidth="3" rx="8"/>
          <text x="60" y="70" fill="white" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">POWER</text>
          <text x="60" y="90" fill="white" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">SUPPLY</text>
          <text x="60" y="130" fill="#a5f3fc" fontSize="10" textAnchor="middle" fontFamily="monospace">{voltage}V / {current}A</text>
          
          {/* Wire Feed Motor */}
          <rect x="140" y="40" width="80" height="60" fill="#fbbf24" stroke="#fcd34d" strokeWidth="2" rx="4"/>
          <text x="180" y="75" fill="#1e3a5f" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">WIRE FEED</text>
          
          {/* Wire Spool */}
          <circle cx="180" cy="150" r="40" fill="none" stroke="#9ca3af" strokeWidth="3"/>
          <circle cx="180" cy="150" r="20" fill="#6b7280"/>
          
          {/* Gas Cylinder */}
          <rect x="240" y="60" width="40" height="120" fill="#06b6d4" opacity="0.3" stroke="#22d3ee" strokeWidth="2" rx="4"/>
          <text x="260" y="125" fill="#22d3ee" fontSize="8" textAnchor="middle" fontFamily="monospace">ARGON</text>
          <text x="260" y="145" fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace">{gasPressure}bar</text>
          
          {/* Gas Flow Line */}
          <path d="M 260 60 L 260 30 L 380 30 L 380 70" stroke="#06b6d4" strokeWidth="2" fill="none" strokeDasharray="6"/>
          
          {/* Welding Torch */}
          <g transform="translate(350, 50)">
            <rect x="0" y="0" width="100" height="25" fill="#4b5563" stroke="#6b7280" strokeWidth="2" rx="4"/>
            <text x="50" y="17" fill="white" fontSize="9" textAnchor="middle" fontFamily="monospace">TORCH</text>
            
            {/* Nozzle */}
            <polygon points="100,5 140,8 140,17 100,20" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
            
            {/* Wire through torch */}
            <line x1="0" y1="12" x2="140" y2="12" stroke="#fbbf24" strokeWidth="2"/>
          </g>
          
          {/* Welding Arc */}
          {status === 'OPERATIONAL' && (
            <g transform="translate(490, 100)">
              <ellipse cx="0" cy="0" rx="30" ry="20" fill="url(#arcGrad)" opacity={0.7 + arcIntensity * 0.3}>
                <animate attributeName="rx" values="25;35;25" dur="0.1s" repeatCount="indefinite"/>
              </ellipse>
              <circle r="10" fill="#fef08a" opacity={0.8}/>
              
              {/* Sparks */}
              {Array.from({length: 8}).map((_, i) => (
                <circle 
                  key={i}
                  cx={Math.cos(i * 45 * Math.PI / 180) * (20 + Math.random() * 30)}
                  cy={Math.sin(i * 45 * Math.PI / 180) * (10 + Math.random() * 20)}
                  r="2"
                  fill="#fbbf24"
                  opacity={0.7}
                />
              ))}
            </g>
          )}
          
          {/* Workpiece */}
          <rect x="420" y="130" width="120" height="40" fill="#374151" stroke="#6b7280" strokeWidth="2"/>
          
          {/* Weld Seam */}
          <line x1="430" y1="130" x2="530" y2="130" stroke="#22c55e" strokeWidth="4"/>
        </g>

        {/* Right Panel */}
        <g transform="translate(580, 55)">
          <rect width="200" height="280" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" rx="8"/>
          <text x="100" y="25" fill="#67e8f9" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">LIVE DATA</text>
          
          {[
            { label: 'VOLTAGE', value: voltage, unit: 'V', color: '#fbbf24' },
            { label: 'CURRENT', value: current, unit: 'A', color: '#f97316' },
            { label: 'WIRE FEED', value: wireFeed, unit: 'm/min', color: '#a78bfa' },
            { label: 'DUTY CYCLE', value: duty, unit: '%', color: duty > 80 ? '#ef4444' : '#22c55e' },
            { label: 'GAS PRESS', value: gasPressure, unit: 'bar', color: '#06b6d4' },
            { label: 'TEMPERATURE', value: temp, unit: '°C', color: temp > 150 ? '#ef4444' : '#22c55e' },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(10, ${45 + i * 38})`}>
              <text x="0" y="0" fill="#94a3b8" fontSize="10" fontFamily="monospace">{item.label}</text>
              <text x="180" y="0" fill={item.color} fontSize="16" textAnchor="end" fontFamily="monospace" fontWeight="bold">{item.value}</text>
              <text x="180" y="15" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{item.unit}</text>
            </g>
          ))}
        </g>

        {/* Bottom Tabs */}
        <g transform="translate(20, 360)">
          {['VOLTAGE', 'CURRENT', 'WIRE', 'GAS', 'TIMER', 'MODE'].map((tab, i) => (
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

export default WelderHMI;