'use client';

import { useEffect, useState } from 'react';

interface GenericMachineHMIProps {
  machineName?: string;
  machineType?: string;
  speed?: number;
  feedRate?: number;
  cycleTime?: number;
  partsCount?: number;
  efficiency?: number;
  temp: number;
  load: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
}

export function GenericMachineHMI({
  machineName = 'INDUSTRIAL EQUIPMENT',
  machineType = 'MACHINE',
  speed = 0,
  feedRate = 0,
  cycleTime = 0,
  partsCount = 0,
  efficiency = 85,
  temp,
  load,
  status,
  compact = false,
}: GenericMachineHMIProps) {
  const [animPhase, setAnimPhase] = useState(0);
  const [pulseAnim, setPulseAnim] = useState(0);

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setAnimPhase(prev => (prev + 1) % 360);
        setPulseAnim(prev => (prev + 5) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case 'OPERATIONAL': return '#00ff00';
      case 'BREAKDOWN': return '#ff0000';
      case 'MAINTENANCE': return '#ffaa00';
      default: return '#888888';
    }
  };

  if (compact) {
    return (
      <div className="w-full h-40 bg-[#1a1a2e] rounded-lg overflow-hidden border border-[#0f3460]">
        <div className="h-6 bg-[#0f3460] flex items-center px-2 justify-between">
          <span className="text-[#00d4ff] text-xs font-bold truncate">{machineName}</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor() }} />
            <span className="text-white text-[10px]">{status}</span>
          </div>
        </div>
        
        <svg viewBox="0 0 300 130" className="w-full h-28">
          {/* Generic machine body */}
          <rect x="80" y="30" width="140" height="80" fill="#2a2a3e" rx="4" stroke="#444" strokeWidth="2" />
          
          {/* Control panel */}
          <rect x="90" y="40" width="50" height="30" fill="#0f3460" rx="2" />
          <rect x="95" y="45" width="15" height="8" fill={status === 'OPERATIONAL' ? '#00ff00' : '#333'} rx="1" />
          <rect x="115" y="45" width="15" height="8" fill={status === 'OPERATIONAL' ? '#00d4ff' : '#333'} rx="1" />
          <circle cx="105" cy="62" r="5" fill={status === 'OPERATIONAL' ? `rgba(0, 255, 0, ${0.5 + pulseAnim * 0.005})` : '#333'} />
          <circle cx="125" cy="62" r="5" fill={status === 'OPERATIONAL' ? '#00d4ff' : '#333'} />
          
          {/* Input conveyor/pipes */}
          <rect x="20" y="60" width="60" height="15" fill="#444" rx="2" />
          <rect x="30" y="55" width="20" height="5" fill="#555" />
          
          {/* Output conveyor/pipes */}
          <rect x="220" y="60" width="60" height="15" fill="#444" rx="2" />
          <rect x="250" y="55" width="20" height="5" fill="#555" />
          
          {/* Motor */}
          <ellipse cx="180" cy="100" rx="20" ry="15" fill="#333" stroke="#555" strokeWidth="2" />
          <ellipse cx="180" cy="100" rx="10" ry="8" fill="#00d4ff" opacity={status === 'OPERATIONAL' ? 0.8 : 0.3}>
            {status === 'OPERATIONAL' && (
              <animate attributeName="opacity" values="0.5;1;0.5" dur="0.5s" repeatCount="indefinite" />
            )}
          </ellipse>
          
          {/* Data display */}
          <rect x="200" y="10" width="80" height="45" fill="#0f3460" rx="4" />
          <text x="240" y="25" textAnchor="middle" fill="#00d4ff" fontSize="7" fontWeight="bold">EFFICIENCY</text>
          <text x="240" y="45" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{efficiency.toFixed(1)}%</text>
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a0a15] rounded-lg overflow-hidden border border-[#1a1a2e]">
      {/* Header */}
      <div className="h-10 bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#00d4ff] font-bold text-lg">{machineName}</span>
          <span className="text-gray-500 text-sm">{machineType}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }} />
          <span className="text-white font-semibold">{status}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2 p-2 bg-[#0f3460]/50">
        <button className="px-3 py-1 bg-[#00aa44] text-white text-sm font-bold rounded hover:bg-[#00cc55] transition">
          START
        </button>
        <button className="px-3 py-1 bg-[#444] text-white text-sm font-bold rounded hover:bg-[#555] transition">
          STOP
        </button>
        <button className="px-3 py-1 bg-[#444] text-white text-sm font-bold rounded hover:bg-[#555] transition">
          RESET
        </button>
        <button className="px-3 py-1 bg-[#cc0000] text-white text-sm font-bold rounded hover:bg-[#dd0000] transition">
          E-STOP
        </button>
      </div>

      {/* Main Schematic */}
      <div className="p-4 flex gap-4">
        <svg viewBox="0 0 400 300" className="flex-1 bg-[#1a1a2e] rounded-lg">
          {/* Grid background */}
          <defs>
            <pattern id="genericGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2a2a3e" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#genericGrid)" />
          
          {/* Main machine body */}
          <rect x="100" y="60" width="200" height="160" fill="#2a2a3e" rx="8" stroke="#444" strokeWidth="2" />
          
          {/* Top section */}
          <rect x="110" y="70" width="180" height="60" fill="#1a1a2e" rx="4" />
          
          {/* Control panel */}
          <rect x="120" y="80" width="80" height="40" fill="#0f3460" rx="4" />
          <rect x="130" y="90" width="25" height="10" fill={status === 'OPERATIONAL' ? '#00ff00' : '#333'} rx="2">
            {status === 'OPERATIONAL' && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="0.8s" repeatCount="indefinite" />
            )}
          </rect>
          <rect x="160" y="90" width="25" height="10" fill={status === 'OPERATIONAL' ? '#00d4ff' : '#333'} rx="2" />
          <text x="145" y="112" textAnchor="middle" fill="white" fontSize="8">POWER</text>
          <text x="172" y="112" textAnchor="middle" fill="white" fontSize="8">RUN</text>
          
          {/* Display screen */}
          <rect x="210" y="80" width="70" height="40" fill="#0a0a15" rx="4" stroke="#00d4ff" strokeWidth="1" />
          <text x="245" y="98" textAnchor="middle" fill="#00d4ff" fontSize="10" fontWeight="bold">{efficiency.toFixed(0)}%</text>
          <text x="245" y="112" textAnchor="middle" fill="#666" fontSize="7">EFFICIENCY</text>
          
          {/* Processing chamber */}
          <rect x="120" y="140" width="160" height="70" fill="#1a1a2e" rx="4" stroke="#333" strokeWidth="1" />
          
          {/* Input mechanism */}
          <rect x="40" y="160" width="80" height="20" fill="#444" rx="2" />
          <polygon points="120,155 130,170 120,185" fill="#00d4ff" opacity={status === 'OPERATIONAL' ? 0.8 : 0.3}>
            {status === 'OPERATIONAL' && (
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
            )}
          </polygon>
          <text x="80" y="175" textAnchor="middle" fill="#888" fontSize="8">INPUT</text>
          
          {/* Output mechanism */}
          <rect x="280" y="160" width="80" height="20" fill="#444" rx="2" />
          <polygon points="280,155 270,170 280,185" fill="#00ff88" opacity={status === 'OPERATIONAL' ? 0.8 : 0.3}>
            {status === 'OPERATIONAL' && (
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
            )}
          </polygon>
          <text x="320" y="175" textAnchor="middle" fill="#888" fontSize="8">OUTPUT</text>
          
          {/* Rotating element (motor/drive) */}
          <g transform={`translate(200, 175)`}>
            <circle r="25" fill="#333" stroke="#555" strokeWidth="2" />
            <circle r="15" fill="#0f3460" stroke="#00d4ff" strokeWidth="2" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#00d4ff" strokeWidth="3" transform={`rotate(${animPhase})`} />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#00d4ff" strokeWidth="3" transform={`rotate(${animPhase})`} />
            {status === 'OPERATIONAL' && (
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" repeatCount="indefinite" additive="sum" />
            )}
          </g>
          
          {/* Base frame */}
          <rect x="80" y="230" width="240" height="20" fill="#333" rx="2" />
          <rect x="90" y="235" width="30" height="10" fill="#444" rx="1" />
          <rect x="280" y="235" width="30" height="10" fill="#444" rx="1" />
          
          {/* Status indicators */}
          <rect x="10" y="10" width="100" height="60" fill="#0f3460" rx="4" />
          <text x="60" y="28" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="bold">STATUS</text>
          <circle cx="30" cy="45" r="6" fill={status === 'OPERATIONAL' ? '#00ff00' : '#333'} />
          <text x="42" y="48" fill="white" fontSize="8">RUN</text>
          <circle cx="30" cy="60" r="6" fill={status === 'BREAKDOWN' ? '#ff0000' : '#333'} />
          <text x="42" y="63" fill="white" fontSize="8">ERR</text>
          
          {/* Data display */}
          <rect x="290" y="10" width="100" height="80" fill="#0f3460" rx="4" />
          <text x="340" y="28" textAnchor="middle" fill="#00d4ff" fontSize="8" fontWeight="bold">LIVE DATA</text>
          <text x="300" y="45" fill="white" fontSize="8">Speed: {speed.toFixed(0)} rpm</text>
          <text x="300" y="58" fill="white" fontSize="8">Feed: {feedRate.toFixed(1)}</text>
          <text x="300" y="71" fill="white" fontSize="8">Cycle: {cycleTime.toFixed(1)}s</text>
          <text x="300" y="84" fill="white" fontSize="8">Parts: {partsCount.toLocaleString()}</text>
        </svg>

        {/* Live Data Panel */}
        <div className="w-48 space-y-2">
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <h4 className="text-[#00d4ff] text-sm font-bold mb-2">PRODUCTION</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>SPEED</span>
                  <span className="text-white font-bold">{speed} rpm</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>FEED RATE</span>
                  <span className="text-white font-bold">{feedRate.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>CYCLE TIME</span>
                  <span className="text-white font-bold">{cycleTime.toFixed(1)}s</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>PARTS COUNT</span>
                  <span className="text-white font-bold">{partsCount.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>EFFICIENCY</span>
                  <span className="text-white font-bold">{efficiency}%</span>
                </div>
                <div className="w-full h-2 bg-[#0f3460] rounded-full mt-1">
                  <div className="h-full bg-[#00d4ff] rounded-full" style={{ width: `${efficiency}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <h4 className="text-[#00aa88] text-sm font-bold mb-2">SYSTEM</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>TEMPERATURE</span>
                  <span className={`font-bold ${temp > 60 ? 'text-red-400' : 'text-white'}`}>{temp.toFixed(1)}°C</span>
                </div>
                <div className="w-full h-2 bg-[#0f3460] rounded-full mt-1">
                  <div className={`h-full rounded-full ${temp > 60 ? 'bg-red-500' : 'bg-[#00aa88]'}`} style={{ width: `${Math.min(temp, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>LOAD</span>
                  <span className={`font-bold ${load > 80 ? 'text-red-400' : 'text-white'}`}>{load.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-[#0f3460] rounded-full mt-1">
                  <div className={`h-full rounded-full ${load > 80 ? 'bg-red-500' : 'bg-[#ff6600]'}`} style={{ width: `${load}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="flex border-t border-[#1a1a2e]">
        <button className="flex-1 py-2 bg-[#0f3460] text-white text-sm font-bold border-b-2 border-[#00d4ff]">DIAGRAM</button>
        <button className="flex-1 py-2 bg-[#1a1a2e] text-gray-400 text-sm hover:bg-[#252540] transition">PROGRAM</button>
        <button className="flex-1 py-2 bg-[#1a1a2e] text-gray-400 text-sm hover:bg-[#252540] transition">ALARMS</button>
        <button className="flex-1 py-2 bg-[#1a1a2e] text-gray-400 text-sm hover:bg-[#252540] transition">I/O</button>
        <button className="flex-1 py-2 bg-[#1a1a2e] text-gray-400 text-sm hover:bg-[#2525a2e] transition">SETTINGS</button>
      </div>

      {/* MYNCEL branding */}
      <div className="h-6 bg-[#0f3460] flex items-center px-4 justify-between">
        <span className="text-[#00d4ff] text-xs font-bold">MYNCEL</span>
        <span className="text-gray-500 text-xs">Industrial Automation Platform</span>
      </div>
    </div>
  );
}