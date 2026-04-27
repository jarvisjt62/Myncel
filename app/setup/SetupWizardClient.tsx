'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface MachineForm {
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  location: string;
  category: string;
  criticality: string;
  yearInstalled: string;
  notes: string;
}

interface SensorConfig {
  type: string;
  unit: string;
  enabled: boolean;
  criticalThreshold: string;
  warningThreshold: string;
}

const STEPS: WizardStep[] = [
  { id: 1, title: 'Welcome',     description: 'Get started with Myncel',        icon: '👋' },
  { id: 2, title: 'Add Machine', description: 'Register your first equipment',   icon: '⚙️' },
  { id: 3, title: 'IoT Sensors', description: 'Configure sensor monitoring',     icon: '📡' },
  { id: 4, title: 'API Key',     description: 'Connect your IoT devices',        icon: '🔑' },
  { id: 5, title: 'Complete',    description: "You're all set!",                 icon: '✅' },
];

const MACHINE_CATEGORIES = [
  { value: 'CNC_MILL',       label: 'CNC Mill' },
  { value: 'CNC_LATHE',      label: 'CNC Lathe' },
  { value: 'PRESS',          label: 'Press / Brake' },
  { value: 'HYDRAULIC',      label: 'Hydraulic System' },
  { value: 'COMPRESSOR',     label: 'Compressor' },
  { value: 'CONVEYOR',       label: 'Conveyor' },
  { value: 'WELDER',         label: 'Welder' },
  { value: 'INJECTION_MOLD', label: 'Injection Mold' },
  { value: 'ASSEMBLY',       label: 'Assembly Line' },
  { value: 'LASER_CUTTER',   label: 'Laser Cutter' },
  { value: 'PLASMA_CUTTER',  label: 'Plasma Cutter' },
  { value: 'GRINDER',        label: 'Grinder' },
  { value: 'DRILL_PRESS',    label: 'Drill Press' },
  { value: 'PUMP',           label: 'Pump / Fluid System' },
  { value: 'BOILER',         label: 'Boiler / Furnace' },
  { value: 'GENERATOR',      label: 'Generator' },
  { value: 'CRANE',          label: 'Crane / Hoist' },
  { value: 'ROBOT',          label: 'Industrial Robot' },
  { value: 'OTHER',          label: 'Other' },
];

const DEFAULT_SENSORS: SensorConfig[] = [
  { type: 'temperature',   unit: '°C',   enabled: true,  criticalThreshold: '90',  warningThreshold: '75' },
  { type: 'vibration',     unit: 'mm/s', enabled: false, criticalThreshold: '10',  warningThreshold: '7'  },
  { type: 'pressure',      unit: 'PSI',  enabled: false, criticalThreshold: '150', warningThreshold: '120'},
  { type: 'current',       unit: 'A',    enabled: false, criticalThreshold: '50',  warningThreshold: '40' },
  { type: 'oil_level',     unit: '%',    enabled: false, criticalThreshold: '10',  warningThreshold: '20' },
  { type: 'runtime_hours', unit: 'hrs',  enabled: true,  criticalThreshold: '',    warningThreshold: ''   },
  { type: 'humidity',      unit: '%',    enabled: false, criticalThreshold: '80',  warningThreshold: '65' },
];

const SENSOR_ICONS: Record<string, string> = {
  temperature:   '🌡️',
  vibration:     '📳',
  pressure:      '💨',
  current:       '⚡',
  oil_level:     '🛢️',
  runtime_hours: '⏱️',
  humidity:      '💧',
};

// ── Shared input style helper ─────────────────────────────────────────────
const inputStyle = {
  backgroundColor: 'var(--bg-page)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
} as React.CSSProperties;

// ── Main Component ─────────────────────────────────────────────────────────

export default function SetupWizardClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [machineForm, setMachineForm] = useState<MachineForm>({
    name: '', model: '', manufacturer: '', serialNumber: '',
    location: '', category: 'OTHER', criticality: 'MEDIUM',
    yearInstalled: '', notes: '',
  });
  const [createdMachineId, setCreatedMachineId] = useState('');
  const [createdMachineName, setCreatedMachineName] = useState('');

  const [sensors, setSensors] = useState<SensorConfig[]>(DEFAULT_SENSORS);

  const [apiKey, setApiKey] = useState('');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const nextStep = () => { setError(''); setStep(s => Math.min(s + 1, 5)); };
  const prevStep = () => { setError(''); setStep(s => Math.max(s - 1, 1)); };

  const handleCreateMachine = async () => {
    if (!machineForm.name.trim()) { setError('Machine name is required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...machineForm,
          yearInstalled: machineForm.yearInstalled ? parseInt(machineForm.yearInstalled) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create machine');
      setCreatedMachineId(data.machine.id);
      setCreatedMachineName(data.machine.name);
      nextStep();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'IoT Device Key', type: 'IOT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate API key');
      setApiKey(data.apiKey);
      nextStep();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const toggleSensor = (idx: number) => {
    setSensors(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSensor = (idx: number, field: keyof SensorConfig, value: string | boolean) => {
    setSensors(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-120px)]">

      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Myncel</span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/ Setup Wizard</span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all flex-shrink-0 ${
                step > s.id  ? 'bg-emerald-500 text-white' :
                step === s.id ? 'bg-[#635bff] text-white ring-4 ring-[#635bff]/30' :
                'text-[var(--text-muted)]'
              }`}
              style={step <= s.id && step !== s.id ? { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' } : undefined}>
                {step > s.id ? '✓' : s.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all rounded ${step > s.id ? 'bg-emerald-500' : ''}`}
                  style={step <= s.id ? { backgroundColor: 'var(--border)' } : undefined} />
              )}
            </div>
          ))}
        </div>

        {/* Step label */}
        <div className="mt-4">
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{STEPS[step - 1].title}</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{STEPS[step - 1].description}</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-2xl p-8"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

        {/* ── Step 1: Welcome ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🏭</div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome to Myncel CMMS</h1>
              <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                This wizard will help you register your equipment and connect IoT sensors
                in just a few minutes. You'll get real-time monitoring up and running today.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[
                { icon: '⚙️', title: 'Register Equipment', desc: 'Add your machines with full details and categorization' },
                { icon: '📡', title: 'Configure Sensors',  desc: 'Set up IoT sensor types and alert thresholds' },
                { icon: '🔑', title: 'Get API Key',         desc: 'Connect physical sensors to your equipment instantly' },
              ].map(card => (
                <div key={card.title} className="rounded-xl p-4 text-center"
                  style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{card.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{card.desc}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-medium text-[#635bff]">💡 What you'll need</p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>• Basic machine information (name, model, location)</li>
                <li>• Serial number (optional but recommended)</li>
                <li>• IoT gateway or sensor device (to send data later)</li>
              </ul>
            </div>

            <button onClick={nextStep}
              className="w-full bg-[#635bff] hover:bg-[#5248e6] text-white font-semibold py-3 rounded-xl transition-colors">
              Get Started →
            </button>
          </div>
        )}

        {/* ── Step 2: Add Machine ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Register Your Equipment</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enter the details for your first machine or piece of equipment.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Machine Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={machineForm.name}
                  onChange={e => setMachineForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Haas VF-2 CNC Mill"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <select value={machineForm.category}
                  onChange={e => setMachineForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                  style={inputStyle}>
                  {MACHINE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Criticality</label>
                <select value={machineForm.criticality}
                  onChange={e => setMachineForm(p => ({ ...p, criticality: e.target.value }))}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                  style={inputStyle}>
                  <option value="HIGH">High — Production critical</option>
                  <option value="MEDIUM">Medium — Important</option>
                  <option value="LOW">Low — Non-critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Manufacturer</label>
                <input type="text" value={machineForm.manufacturer}
                  onChange={e => setMachineForm(p => ({ ...p, manufacturer: e.target.value }))}
                  placeholder="e.g. Haas Automation"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Model Number</label>
                <input type="text" value={machineForm.model}
                  onChange={e => setMachineForm(p => ({ ...p, model: e.target.value }))}
                  placeholder="e.g. VF-2"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Serial Number</label>
                <input type="text" value={machineForm.serialNumber}
                  onChange={e => setMachineForm(p => ({ ...p, serialNumber: e.target.value }))}
                  placeholder="e.g. SN-2024-001"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Location</label>
                <input type="text" value={machineForm.location}
                  onChange={e => setMachineForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Building A, Bay 3"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                  style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Year Installed</label>
                <input type="number" value={machineForm.yearInstalled}
                  onChange={e => setMachineForm(p => ({ ...p, yearInstalled: e.target.value }))}
                  placeholder="e.g. 2019" min="1950" max="2030"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all"
                  style={inputStyle} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                <textarea value={machineForm.notes}
                  onChange={e => setMachineForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional notes about this equipment..."
                  rows={2}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/50 transition-all resize-none"
                  style={inputStyle} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={prevStep}
                className="flex-1 font-semibold py-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                ← Back
              </button>
              <button onClick={handleCreateMachine} disabled={loading}
                className="flex-1 bg-[#635bff] hover:bg-[#5248e6] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
                {loading ? 'Creating...' : 'Create Machine →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Sensor Configuration ─────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Configure IoT Sensors</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Select which sensor types you'll connect to{' '}
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{createdMachineName}</span>.
                You can change these anytime.
              </p>
            </div>

            <div className="space-y-3">
              {sensors.map((sensor, idx) => (
                <div key={sensor.type} className="rounded-xl p-4 transition-all"
                  style={{
                    backgroundColor: sensor.enabled ? 'var(--bg-page)' : 'var(--bg-page)',
                    border: sensor.enabled ? '1px solid rgba(99,91,255,0.4)' : '1px solid var(--border)',
                    boxShadow: sensor.enabled ? '0 0 0 1px rgba(99,91,255,0.1)' : undefined,
                  }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{SENSOR_ICONS[sensor.type]}</span>
                      <div>
                        <div className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                          {sensor.type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Unit: {sensor.unit}</div>
                      </div>
                    </div>
                    <button onClick={() => toggleSensor(idx)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sensor.enabled ? 'bg-[#635bff]' : ''}`}
                      style={!sensor.enabled ? { backgroundColor: 'var(--border)' } : undefined}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sensor.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {sensor.enabled && sensor.type !== 'runtime_hours' && sensor.type !== 'cycle_count' && (
                    <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Warning threshold ({sensor.unit})</label>
                        <input type="number" value={sensor.warningThreshold}
                          onChange={e => updateSensor(idx, 'warningThreshold', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
                          style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Critical threshold ({sensor.unit})</label>
                        <input type="number" value={sensor.criticalThreshold}
                          onChange={e => updateSensor(idx, 'criticalThreshold', e.target.value)}
                          className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                          style={inputStyle} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">ℹ️ How sensor alerts work</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                When a sensor reading exceeds your thresholds, Myncel automatically creates an alert
                and notifies your team. Thresholds are per-sensor and fully customizable.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={prevStep}
                className="flex-1 font-semibold py-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                ← Back
              </button>
              <button onClick={handleGenerateApiKey} disabled={loading}
                className="flex-1 bg-[#635bff] hover:bg-[#5248e6] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
                {loading ? 'Generating Key...' : 'Generate API Key →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: API Key ───────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Your IoT API Key</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Use this key to authenticate your IoT devices and sensors. Keep it secret!
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid rgba(99,91,255,0.4)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#635bff] text-xs font-semibold uppercase tracking-wide">API Key</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>— Copy and save this now</span>
              </div>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-emerald-600 dark:text-emerald-400 text-sm font-mono break-all">{apiKey}</code>
                <button onClick={copyApiKey}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    apiKeyCopied
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#635bff]/20 text-[#635bff] border border-[#635bff]/30 hover:bg-[#635bff]/30'
                  }`}>
                  {apiKeyCopied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Send sensor data to:</h4>
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="text-sm" style={{ color: 'var(--text-primary)' }}>/api/iot</code>
                </div>
                <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Header:</p>
                  <code className="text-[#635bff] text-xs font-mono">X-API-Key: {apiKey?.slice(0, 20)}...</code>
                </div>
                <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Body (JSON):</p>
                  <pre className="text-emerald-600 dark:text-emerald-400 text-xs font-mono overflow-auto">{JSON.stringify({
                    machineId: createdMachineId,
                    sensorType: 'temperature',
                    value: 72.5,
                    unit: '°C'
                  }, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Quick test (cURL):</h4>
              <div className="rounded-xl p-4 overflow-auto" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{`curl -X POST https://yourapp.com/api/iot \\
     -H "X-API-Key: ${apiKey}" \\
     -H "Content-Type: application/json" \\
     -d '{"machineId":"${createdMachineId}","sensorType":"temperature","value":72.5,"unit":"°C"}'`}</pre>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={prevStep}
                className="flex-1 font-semibold py-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                ← Back
              </button>
              <button onClick={nextStep}
                className="flex-1 bg-[#635bff] hover:bg-[#5248e6] text-white font-semibold py-3 rounded-xl transition-colors">
                Finish Setup →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Complete ──────────────────────────────────────── */}
        {step === 5 && (
          <div className="text-center space-y-6">
            <div>
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>You're all set!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{createdMachineName}</span> has been registered
                and your IoT API key is ready. Start sending sensor data to see live readings on your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '📊', title: 'View Dashboard',   desc: 'See your machine status',   href: '/dashboard' },
                { icon: '🔑', title: 'Manage API Keys',  desc: 'View and rotate keys',       href: '/settings/api-keys' },
                { icon: '📡', title: 'IoT Simulator',    desc: 'Test without hardware',      href: '/dashboard/iot-simulator' },
              ].map(card => (
                <a key={card.title} href={card.href}
                  className="rounded-xl p-4 text-center transition-colors hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{card.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{card.desc}</div>
                </a>
              ))}
            </div>

            <div className="rounded-xl p-4 text-left" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
              <p className="text-[#635bff] text-sm font-medium">💡 Next steps</p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>• Send your first sensor reading using the cURL command from the previous step</li>
                <li>• Add more machines via the dashboard or repeat this wizard</li>
                <li>• Set up maintenance schedules for each machine</li>
                <li>• Invite your team members from Settings → Team</li>
              </ul>
            </div>

            <button onClick={() => router.push('/dashboard')}
              className="w-full bg-[#635bff] hover:bg-[#5248e6] text-white font-bold py-3 rounded-xl transition-colors text-lg">
              Go to Dashboard →
            </button>
          </div>
        )}

      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        You can add more machines and configure integrations anytime from your dashboard.
      </p>
    </div>
  );
}