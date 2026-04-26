'use client';

import { useEffect, useState } from 'react';

interface AssemblyRobotHMIProps {
  joint1?: number;
  joint2?: number;
  joint3?: number;
  joint4?: number;
  joint5?: number;
  joint6?: number;
  gripper?: 'OPEN' | 'CLOSED' | 'GRIPPING';
  cycleTime?: number;
  partsCount?: number;
  speed?: number;
  temp: number;
  load: number;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'MAINTENANCE';
  compact?: boolean;
}

export function AssemblyRobotHMI({
  joint1 = 0,
  joint2 = 45,
  joint3 = -30,
  joint4 = 0,
  joint5 = 15,
  joint6 = 90,
  gripper = 'OPEN',
  cycleTime = 12.5,
  partsCount = 1456,
  speed = 85,
  temp,
  load,
  status,
  compact = false,
}: AssemblyRobotHMIProps) {
  const [animPhase, setAnimPhase] = useState(0);
  const [jointAnim, setJointAnim] = useState({ j1: 0, j2: 45, j3: -30, j4: 0, j5: 15, j6: 90 });

  useEffect(() => {
    if (status === 'OPERATIONAL') {
      const interval = setInterval(() => {
        setAnimPhase(prev => (prev + 1) % 360);
        // Simulate robot arm movement
        setJointAnim({
          j1: Math.sin(Date.now() / 2000) * 30,
          j2: 45 + Math.sin(Date.now() / 1500) * 20,
          j3: -30 + Math.cos(Date.now() / 1800) * 15,
          j4: Math.sin(Date.now() / 1000) * 45,
          j5: 15 + Math.sin(Date.now() / 1200) * 10,
          j6: 90 + Math.sin(Date.now() / 800) * 30,
        });
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
          <span className="text-[#00d4ff] text-xs font-bold">ASSEMBLY ROBOT</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor() }} />
            <span className="text-white text-[10px]">{status}</span>
          </div>
        </div>
        
        <svg viewBox="0 0 300 130" className="w-full h-28">
          {/* Robot base */}
          <rect x="120" y="105" width="60" height="20" fill="#444" rx="2" />
          <rect x="130" y="100" width="40" height="8" fill="#666" rx="2" />
          
          {/* Turntable (joint 1) */}
          <g transform={`rotate(${jointAnim.j1 * 0.3}, 150, 100)`}>
            <ellipse cx="150" cy="100" rx="25" ry="8" fill="#555" />
            
            {/* Link 1 (shoulder - joint 2) */}
            <g transform={`rotate(${jointAnim.j2 * 0.4}, 150, 92)`}>
              <rect x="145" y="55" width="10" height="40" fill="#00d4ff" rx="2" />
              <circle cx="150" cy="55" r="8" fill="#0f3460" stroke="#00d4ff" strokeWidth="2" />
              
              {/* Link 2 (elbow - joint 3) */}
              <g transform={`rotate(${jointAnim.j3 * 0.3}, 150, 55)`}>
                <rect x="145" y="25" width="10" height="32" fill="#00aa88" rx="2" />
                <circle cx="150" cy="25" r="6" fill="#0f3460" stroke="#00aa88" strokeWidth="2" />
                
                {/* Link 3 (wrist) */}
                <g transform={`rotate(${jointAnim.j4 * 0.2}, 150, 25)`}>
                  <rect x="147" y="8" width="6" height="20" fill="#ff6600" rx="1" />
                  
                  {/* End effector (gripper) */}
                  <g transform={`rotate(${jointAnim.j5 * 0.15}, 150, 8)`}>
                    <rect x="143" y="2" width="5" height="8" fill="#888" rx="1" />
                    <rect x="152" y="2" width="5" height="8" fill="#888" rx="1" />
                    <rect x="148" y="-2" width="4" height="6" fill="#666" rx="1" />
                  </g>
                </g>
              </g>
            </g>
          </g>
          
          {/* Status indicator */}
          <rect x="220" y="10" width="70" height="50" fill="#0f3460" rx="4" />
          <text x="255" y="28" textAnchor="middle" fill="#00d4ff" fontSize="8" fontWeight="bold">CYCLE</text>
          <text x="255" y="45" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{cycleTime.toFixed(1)}s</text>
          
          {/* Parts counter */}
          <rect x="10" y="10" width="60" height="35" fill="#0f3460" rx="4" />
          <text x="40" y="25" textAnchor="middle" fill="#00ff88" fontSize="7">PARTS</text>
          <text x="40" y="38" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{partsCount}</text>
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a0a15] rounded-lg overflow-hidden border border-[#1a1a2e]">
      {/* Header */}
      <div className="h-10 bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#00d4ff] font-bold text-lg">ASSEMBLY ROBOT</span>
          <span className="text-gray-500 text-sm">6-AXIS ARTICULATED</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }} />
          <span className="text-white font-semibold">{status}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2 p-2 bg-[#0f3460]/50">
        <button className="px-3 py-1 bg-[#00aa44] text-white text-sm font-bold rounded hover:bg-[#00cc55] transition">
          AUTO ON
        </button>
        <button className="px-3 py-1 bg-[#444] text-white text-sm font-bold rounded hover:bg-[#555] transition">
          MANUAL
        </button>
        <button className="px-3 py-1 bg-[#444] text-white text-sm font-bold rounded hover:bg-[#555] transition">
          HOME
        </button>
        <button className="px-3 py-1 bg-[#0066cc] text-white text-sm font-bold rounded hover:bg-[#0077dd] transition">
          CYCLE START
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
            <pattern id="robotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2a2a3e" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#robotGrid)" />
          
          {/* Work envelope (dashed) */}
          <ellipse cx="200" cy="260" rx="180" ry="40" fill="none" stroke="#333" strokeDasharray="5,5" />
          <path d="M 20 260 Q 200 50 380 260" fill="none" stroke="#333" strokeDasharray="5,5" />
          
          {/* Robot base */}
          <rect x="160" y="250" width="80" height="40" fill="#333" rx="4" />
          <rect x="175" y="242" width="50" height="12" fill="#444" rx="2" />
          <ellipse cx="200" cy="242" rx="35" ry="10" fill="#555" />
          
          {/* Joint 1 - Base rotation */}
          <g transform={`rotate(${jointAnim.j1}, 200, 235)`}>
            {/* Link 1 */}
            <g>
              <rect x="190" y="150" width="20" height="90" fill="#00d4ff" rx="3" />
              <circle cx="200" cy="150" r="15" fill="#0f3460" stroke="#00d4ff" strokeWidth="3" />
              <text x="200" y="154" textAnchor="middle" fill="#00d4ff" fontSize="10" fontWeight="bold">J2</text>
              
              {/* Joint 2 rotation */}
              <g transform={`rotate(${jointAnim.j2}, 200, 150)`}>
                <rect x="192" y="70" width="16" height="85" fill="#00aa88" rx="2" />
                <circle cx="200" cy="70" r="12" fill="#0f3460" stroke="#00aa88" strokeWidth="2" />
                <text x="200" y="74" textAnchor="middle" fill="#00aa88" fontSize="8" fontWeight="bold">J3</text>
                
                {/* Joint 3 rotation */}
                <g transform={`rotate(${jointAnim.j3}, 200, 70)`}>
                  <rect x="194" y="25" width="12" height="50" fill="#ff6600" rx="2" />
                  <circle cx="200" cy="25" r="10" fill="#0f3460" stroke="#ff6600" strokeWidth="2" />
                  <text x="200" y="29" textAnchor="middle" fill="#ff6600" fontSize="8" fontWeight="bold">J4</text>
                  
                  {/* Joint 4 rotation */}
                  <g transform={`rotate(${jointAnim.j4}, 200, 25)`}>
                    <rect x="196" y="0" width="8" height="30" fill="#aa44ff" rx="1" />
                    <circle cx="200" cy="0" r="8" fill="#0f3460" stroke="#aa44ff" strokeWidth="2" />
                    <text x="200" y="4" textAnchor="middle" fill="#aa44ff" fontSize="7" fontWeight="bold">J5</text>
                    
                    {/* Joint 5 - Wrist */}
                    <g transform={`rotate(${jointAnim.j5}, 200, 0)`}>
                      <rect x="197" y="-15" width="6" height="18" fill="#ffaa00" rx="1" />
                      
                      {/* Joint 6 - Tool rotation */}
                      <g transform={`rotate(${jointAnim.j6 * 0.1}, 200, -15)`}>
                        {/* Gripper */}
                        <rect x="190" y="-30" width="8" height="15" fill="#888" rx="1" />
                        <rect x="202" y="-30" width="8" height="15" fill="#888" rx="1" />
                        <rect x="196" y="-35" width="8" height="8" fill="#666" rx="1" />
                        
                        {/* Gripper status LED */}
                        <circle cx="200" cy="-40" r="4" fill={gripper === 'GRIPPING' ? '#00ff00' : gripper === 'CLOSED' ? '#ff0000' : '#ffaa00'} />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
          
          {/* Workpiece on table */}
          <rect x="300" y="240" width="40" height="15" fill="#00ff88" rx="2" />
          <rect x="60" y="240" width="35" height="15" fill="#ffaa00" rx="2" />
          
          {/* Labels */}
          <text x="200" y="295" textAnchor="middle" fill="#666" fontSize="10">WORK ENVELOPE</text>
          
          {/* Joint angles display */}
          <rect x="10" y="10" width="90" height="80" fill="#0f3460" rx="4" />
          <text x="55" y="25" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="bold">JOINT ANGLES</text>
          <text x="15" y="40" fill="white" fontSize="8">J1: {jointAnim.j1.toFixed(1)}°</text>
          <text x="15" y="52" fill="white" fontSize="8">J2: {jointAnim.j2.toFixed(1)}°</text>
          <text x="15" y="64" fill="white" fontSize="8">J3: {jointAnim.j3.toFixed(1)}°</text>
          <text x="55" y="40" fill="white" fontSize="8">J4: {jointAnim.j4.toFixed(1)}°</text>
          <text x="55" y="52" fill="white" fontSize="8">J5: {jointAnim.j5.toFixed(1)}°</text>
          <text x="55" y="64" fill="white" fontSize="8">J6: {jointAnim.j6.toFixed(1)}°</text>
          <text x="55" y="82" textAnchor="middle" fill="#ffaa00" fontSize="8">GRIP: {gripper}</text>
        </svg>

        {/* Live Data Panel */}
        <div className="w-48 space-y-2">
          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <h4 className="text-[#00d4ff] text-sm font-bold mb-2">PERFORMANCE</h4>
            <div className="space-y-2">
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
                  <span>SPEED</span>
                  <span className="text-white font-bold">{speed}%</span>
                </div>
                <div className="w-full h-2 bg-[#0f3460] rounded-full mt-1">
                  <div className="h-full bg-[#00d4ff] rounded-full" style={{ width: `${speed}%` }} />
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

          <div className="bg-[#1a1a2e] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">GRIPPER</span>
              <span className={`font-bold text-sm ${gripper === 'GRIPPING' ? 'text-green-400' : gripper === 'CLOSED' ? 'text-red-400' : 'text-yellow-400'}`}>
                {gripper}
              </span>
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
        <button className="flex-1 py-2 bg-[#1a1a2e] text-gray-400 text-sm hover:bg-[#252540] transition">SETTINGS</button>
      </div>

      {/* MYNCEL branding */}
      <div className="h-6 bg-[#0f3460] flex items-center px-4 justify-between">
        <span className="text-[#00d4ff] text-xs font-bold">MYNCEL</span>
        <span className="text-gray-500 text-xs">Industrial Automation Platform</span>
      </div>
    </div>
  );
}