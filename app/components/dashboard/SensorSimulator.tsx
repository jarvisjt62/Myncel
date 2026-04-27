'use client';

import { useState, useEffect, useRef } from 'react';

interface Machine {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface SimulatorLog {
  id: string;
  timestamp: string;
  machineId: string;
  machineName: string;
  sensorType: string;
  value: number;
  unit: string;
  status: 'ok' | 'error' | 'alert';
  message?: string;
}

interface SensorProfile {
  type: string;
  unit: string;
  icon: string;
  baseMin: number;
  baseMax: number;
  alertHigh: number;
  criticalHigh: number;
  alertLow?: number;
  criticalLow?: number;
  direction: 'high' | 'low' | 'both';
}

const SENSOR_PROFILES: SensorProfile[] = [
  { type: 'temperature',   unit: '°C',   icon: '🌡️', baseMin: 40,  baseMax: 75,  alertHigh: 75,  criticalHigh: 90,  direction: 'high' },
  { type: 'vibration',     unit: 'mm/s', icon: '📳', baseMin: 1,   baseMax: 6,   alertHigh: 7,   criticalHigh: 10,  direction: 'high' },
  { type: 'pressure',      unit: 'PSI',  icon: '💨', baseMin: 80,  baseMax: 115, alertHigh: 120, criticalHigh: 150, direction: 'high' },
  { type: 'current',       unit: 'A',    icon: '⚡', baseMin: 20,  baseMax: 38,  alertHigh: 40,  criticalHigh: 50,  direction: 'high' },
  { type: 'oil_level',     unit: '%',    icon: '🛢️', baseMin: 30,  baseMax: 80,  alertLow: 20,   criticalLow: 10,   alertHigh: 999, criticalHigh: 999, direction: 'low' },
  { type: 'runtime_hours', unit: 'hrs',  icon: '⏱️', baseMin: 100, baseMax: 5000,alertHigh: 9999,criticalHigh: 9999,direction: 'high' },
  { type: 'humidity',      unit: '%',    icon: '💧', baseMin: 30,  baseMax: 60,  alertHigh: 65,  criticalHigh: 80,  direction: 'high' },
];

const SCENARIOS = [
  { id: 'normal',   label: 'Normal Operation',   icon: '✅', description: 'All readings within safe ranges' },
  { id: 'warning',  label: 'Warning Condition',  icon: '⚠️', description: 'Some readings approaching thresholds' },
  { id: 'critical', label: 'Critical Failure',   icon: '🚨', description: 'Readings exceed critical thresholds' },
  { id: 'gradual',  label: 'Gradual Degradation',icon: '📈', description: 'Values slowly climbing over time' },
  { id: 'random',   label: 'Random / Noise',     icon: '🎲', description: 'Randomized readings across all ranges' },
];

function generateValue(profile: SensorProfile, scenario: string, tick: number): number {
  const range = profile.baseMax - profile.baseMin;
  const noise = () => (Math.random() - 0.5) * range * 0.1;

  switch (scenario) {
    case 'normal':
      return +(profile.baseMin + Math.random() * range * 0.6 + noise()).toFixed(2);
    case 'warning':
      return +(profile.alertHigh ? profile.alertHigh * 0.95 + noise() : profile.baseMax + noise()).toFixed(2);
    case 'critical':
      return +(profile.criticalHigh ? profile.criticalHigh * 1.05 + noise() : profile.baseMax * 1.2 + noise()).toFixed(2);
    case 'gradual': {
      const progress = Math.min(tick / 20, 1);
      return +(profile.baseMin + range * (0.3 + progress * 0.9) + noise()).toFixed(2);
    }
    case 'random':
    default:
      return +(profile.baseMin + Math.random() * range * 1.4 + noise()).toFixed(2);
  }
}

function getReadingStatus(profile: SensorProfile, value: number): 'ok' | 'alert' | 'error' {
  if (profile.direction === 'high' || profile.direction === 'both') {
    if (value >= profile.criticalHigh) return 'error';
    if (value >= profile.alertHigh) return 'alert';
  }
  if (profile.direction === 'low' || profile.direction === 'both') {
    if (profile.criticalLow !== undefined && value <= profile.criticalLow) return 'error';
    if (profile.alertLow !== undefined && value <= profile.alertLow) return 'alert';
  }
  return 'ok';
}

export default function SensorSimulator() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['temperature', 'vibration']);
  const [scenario, setScenario] = useState('normal');
  const [intervalSec, setIntervalSec] = useState(3);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<SimulatorLog[]>([]);
  const [tick, setTick] = useState(0);
  const [stats, setStats] = useState({ sent: 0, ok: 0, alerts: 0, errors: 0 });
  const [apiKey, setApiKey] = useState('');
  const [loadingMachines, setLoadingMachines] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/machines')
      .then(r => r.json())
      .then(d => {
        setMachines(d.machines || []);
        if (d.machines?.length > 0) setSelectedMachineId(d.machines[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingMachines(false));
  }, []);

  useEffect(() => {
    fetch('/api/settings/api-keys')
      .then(r => r.json())
      .then(d => {
        const active = (d.keys || []).find((k: any) => k.status === 'CONNECTED' && k.apiKeyFull);
        if (active?.apiKeyFull) setApiKey(active.apiKeyFull);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const toggleSensor = (type: string) => {
    setSelectedSensors(prev =>
      prev.includes(type) ? prev.filter(s => s !== type) : [...prev, type]
    );
  };

  const sendReadings = async (currentTick: number) => {
    if (!selectedMachineId || selectedSensors.length === 0) return;
    const machine = machines.find(m => m.id === selectedMachineId);
    if (!machine) return;

    const readings = selectedSensors.map(type => {
      const profile = SENSOR_PROFILES.find(p => p.type === type)!;
      return {
        machineId: selectedMachineId,
        sensorType: type,
        value: generateValue(profile, scenario, currentTick),
        unit: profile.unit,
        timestamp: new Date().toISOString(),
      };
    });

    try {
      const res = await fetch('/api/dashboard/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings, apiKey }),
      });
      const data = await res.json();
      const timestamp = new Date().toLocaleTimeString();
      const newLogs: SimulatorLog[] = readings.map((r, i) => {
        const profile = SENSOR_PROFILES.find(p => p.type === r.sensorType)!;
        const readingStatus = getReadingStatus(profile, r.value);
        return {
          id: `${Date.now()}-${i}`,
          timestamp,
          machineId: r.machineId,
          machineName: machine.name,
          sensorType: r.sensorType,
          value: r.value,
          unit: r.unit,
          status: data.success ? readingStatus : 'error',
          message: data.error,
        };
      });
      setLogs(prev => [...prev.slice(-200), ...newLogs]);
      setStats(prev => ({
        sent: prev.sent + readings.length,
        ok: prev.ok + newLogs.filter(l => l.status === 'ok').length,
        alerts: prev.alerts + newLogs.filter(l => l.status === 'alert').length,
        errors: prev.errors + newLogs.filter(l => l.status === 'error').length,
      }));
      setTick(t => t + 1);
    } catch {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev.slice(-200), {
        id: Date.now().toString(),
        timestamp,
        machineId: selectedMachineId,
        machineName: machine.name,
        sensorType: 'all',
        value: 0,
        unit: '',
        status: 'error',
        message: 'Network error — check console',
      }]);
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
    }
  };

  const startSimulator = () => {
    if (!selectedMachineId) return;
    setRunning(true);
    setTick(0);
    sendReadings(0);
    intervalRef.current = setInterval(() => {
      setTick(t => { sendReadings(t + 1); return t + 1; });
    }, intervalSec * 1000);
  };

  const stopSimulator = () => {
    setRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const clearLogs = () => {
    setLogs([]);
    setStats({ sent: 0, ok: 0, alerts: 0, errors: 0 });
  };

  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  // Shared inline styles using CSS variables
  const surfaceStyle = { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' } as React.CSSProperties;
  const pageStyle = { backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' } as React.CSSProperties;
  const inputStyle = { backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties;

  return (
    <div className="rounded-2xl overflow-hidden" style={surfaceStyle}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(to right, rgba(99,91,255,0.07), transparent)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">📡</span>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>IoT Sensor Simulator</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Test your IoT integration without physical hardware</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live — tick {tick}
            </span>
          )}
          <button onClick={clearLogs}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">

        {/* ── Config Panel ──────────────────────────────────────── */}
        <div className="p-5 space-y-5" style={{ borderRight: '1px solid var(--border)' }}>

          {/* Machine selector */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Target Machine</label>
            {loadingMachines ? (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading machines...</div>
            ) : machines.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No machines found.{' '}
                <a href="/setup" className="text-[#635bff] hover:underline">Add one →</a>
              </div>
            ) : (
              <select value={selectedMachineId} onChange={e => setSelectedMachineId(e.target.value)}
                disabled={running}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 transition-all disabled:opacity-60"
                style={inputStyle}>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            {selectedMachine && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  selectedMachine.status === 'OPERATIONAL' ? 'bg-emerald-500' :
                  selectedMachine.status === 'BREAKDOWN'   ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {selectedMachine.status} · {selectedMachine.category.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Scenario */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Scenario</label>
            <div className="space-y-1.5">
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => !running && setScenario(s.id)} disabled={running}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
                  style={scenario === s.id
                    ? { backgroundColor: 'rgba(99,91,255,0.12)', border: '1px solid rgba(99,91,255,0.4)', color: 'var(--text-primary)' }
                    : { backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                  }>
                  <div className="flex items-center gap-2">
                    <span>{s.icon}</span>
                    <div>
                      <div className="font-medium leading-tight">{s.label}</div>
                      <div className="text-xs opacity-70">{s.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sensors */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Sensor Types</label>
            <div className="space-y-1.5">
              {SENSOR_PROFILES.map(p => (
                <button key={p.type} onClick={() => !running && toggleSensor(p.type)} disabled={running}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-60 flex items-center justify-between"
                  style={selectedSensors.includes(p.type)
                    ? { backgroundColor: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.3)', color: 'var(--text-primary)' }
                    : { backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                  }>
                  <span className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span className="capitalize">{p.type.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="text-xs opacity-60">{p.unit}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Interval: {intervalSec}s
            </label>
            <input type="range" min={1} max={30} step={1} value={intervalSec}
              onChange={e => setIntervalSec(+e.target.value)}
              disabled={running}
              className="w-full accent-[#635bff] disabled:opacity-60" />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>1s (fast)</span><span>30s (slow)</span>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>API Key</label>
            <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)}
              disabled={running}
              placeholder="mnc_iot_... (auto-loaded)"
              className="w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 transition-all disabled:opacity-60 truncate"
              style={inputStyle} />
          </div>

          {/* Start/Stop */}
          <button
            onClick={running ? stopSimulator : startSimulator}
            disabled={!selectedMachineId || selectedSensors.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
              running
                ? 'bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-600 dark:text-red-400'
                : 'bg-[#635bff] hover:bg-[#5248e6] text-white'
            }`}>
            {running ? '⏹ Stop Simulator' : '▶ Start Simulator'}
          </button>
        </div>

        {/* ── Log + Stats Panel ─────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col">

          {/* Stats row */}
          <div className="grid grid-cols-4" style={{ borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Sent',   value: stats.sent,   color: 'var(--text-primary)' },
              { label: 'OK',     value: stats.ok,     color: '#10b981' },
              { label: 'Alerts', value: stats.alerts, color: '#f59e0b' },
              { label: 'Errors', value: stats.errors, color: '#ef4444' },
            ].map((s, i) => (
              <div key={s.label} className="px-4 py-3 text-center"
                style={{ borderRight: i < 3 ? '1px solid var(--border)' : undefined }}>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto max-h-96 p-4 space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-3xl mb-2">📡</span>
                <p>Configure settings and press <strong style={{ color: 'var(--text-primary)' }}>Start</strong> to begin simulation</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={
                    log.status === 'error' ? { backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' } :
                    log.status === 'alert' ? { backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' } :
                    { backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }
                  }>
                  <span className="w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{log.timestamp}</span>
                  <span className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    {SENSOR_PROFILES.find(p => p.type === log.sensorType)?.icon || '📊'}
                  </span>
                  <span className={`flex-shrink-0 font-semibold ${
                    log.status === 'error' ? 'text-red-500 dark:text-red-400' :
                    log.status === 'alert' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {log.value}{log.unit}
                  </span>
                  <span className="text-[#635bff] truncate">{log.sensorType}</span>
                  <span className="truncate" style={{ color: 'var(--text-muted)' }}>→ {log.machineName}</span>
                  {log.message && <span className="text-red-500 dark:text-red-400 ml-auto">{log.message}</span>}
                  <span className="ml-auto flex-shrink-0">
                    {log.status === 'ok'    && <span className="text-emerald-500">✓</span>}
                    {log.status === 'alert' && <span className="text-yellow-500">⚠</span>}
                    {log.status === 'error' && <span className="text-red-500">✗</span>}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Footer hint */}
          <div className="px-4 py-3 flex items-center justify-between text-xs"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <span>Readings are stored in your DB and visible on the dashboard sensor charts</span>
            <a href="/settings/api-keys" className="text-[#635bff] hover:underline">Manage API Keys →</a>
          </div>
        </div>
      </div>
    </div>
  );
}