'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  { id: 1, title: 'Welcome',        description: 'Get started with Myncel',           icon: '👋' },
  { id: 2, title: 'Add Machine',    description: 'Register your first equipment',      icon: '⚙️' },
  { id: 3, title: 'IoT Sensors',    description: 'Configure sensor monitoring',        icon: '📡' },
  { id: 4, title: 'API Key',        description: 'Connect your IoT devices',           icon: '🔑' },
  { id: 5, title: 'Complete',       description: 'You\'re all set!',                   icon: '✅' },
];

const MACHINE_CATEGORIES = [
  { value: 'CNC_MILL',        label: 'CNC Mill' },
  { value: 'CNC_LATHE',       label: 'CNC Lathe' },
  { value: 'PRESS',           label: 'Press / Brake' },
  { value: 'HYDRAULIC',       label: 'Hydraulic System' },
  { value: 'COMPRESSOR',      label: 'Compressor' },
  { value: 'CONVEYOR',        label: 'Conveyor' },
  { value: 'WELDER',          label: 'Welder' },
  { value: 'INJECTION_MOLD',  label: 'Injection Mold' },
  { value: 'ASSEMBLY',        label: 'Assembly Line' },
  { value: 'LASER_CUTTER',    label: 'Laser Cutter' },
  { value: 'PLASMA_CUTTER',   label: 'Plasma Cutter' },
  { value: 'GRINDER',         label: 'Grinder' },
  { value: 'DRILL_PRESS',     label: 'Drill Press' },
  { value: 'PUMP',            label: 'Pump / Fluid System' },
  { value: 'BOILER',          label: 'Boiler / Furnace' },
  { value: 'GENERATOR',       label: 'Generator' },
  { value: 'CRANE',           label: 'Crane / Hoist' },
  { value: 'ROBOT',           label: 'Industrial Robot' },
  { value: 'OTHER',           label: 'Other' },
];

const DEFAULT_SENSORS: SensorConfig[] = [
  { type: 'temperature',    unit: '°C',   enabled: true,  criticalThreshold: '90',  warningThreshold: '75' },
  { type: 'vibration',      unit: 'mm/s', enabled: false, criticalThreshold: '10',  warningThreshold: '7'  },
  { type: 'pressure',       unit: 'PSI',  enabled: false, criticalThreshold: '150', warningThreshold: '120'},
  { type: 'current',        unit: 'A',    enabled: false, criticalThreshold: '50',  warningThreshold: '40' },
  { type: 'oil_level',      unit: '%',    enabled: false, criticalThreshold: '10',  warningThreshold: '20' },
  { type: 'runtime_hours',  unit: 'hrs',  enabled: true,  criticalThreshold: '',    warningThreshold: ''   },
  { type: 'humidity',       unit: '%',    enabled: false, criticalThreshold: '80',  warningThreshold: '65' },
];

const SENSOR_ICONS: Record<string, string> = {
  temperature: '🌡️',
  vibration: '📳',
  pressure: '💨',
  current: '⚡',
  oil_level: '🛢️',
  runtime_hours: '⏱️',
  humidity: '💧',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupWizardClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2: Machine form
  const [machineForm, setMachineForm] = useState<MachineForm>({
    name: '', model: '', manufacturer: '', serialNumber: '',
    location: '', category: 'OTHER', criticality: 'MEDIUM',
    yearInstalled: '', notes: '',
  });
  const [createdMachineId, setCreatedMachineId] = useState('');
  const [createdMachineName, setCreatedMachineName] = useState('');

  // Step 3: Sensor configuration
  const [sensors, setSensors] = useState<SensorConfig[]>(DEFAULT_SENSORS);

  // Step 4: API key
  const [apiKey, setApiKey] = useState('');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [integrationId, setIntegrationId] = useState('');

  // ── Navigation helpers ────────────────────────────────────────────────────

  const nextStep = () => { setError(''); setStep(s => Math.min(s + 1, 5)); };
  const prevStep = () => { setError(''); setStep(s => Math.max(s - 1, 1)); };

  // ── Step 2: Create Machine ────────────────────────────────────────────────

  const handleCreateMachine = async () => {
    if (!machineForm.name.trim()) {
      setError('Machine name is required.');
      return;
    }
    setLoading(true);
    setError('');
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

  // ── Step 4: Generate API Key ──────────────────────────────────────────────

  const handleGenerateApiKey = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'IoT Device Key', type: 'IOT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate API key');
      setApiKey(data.apiKey);
      setIntegrationId(data.id);
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

  // ── Sensor toggle ─────────────────────────────────────────────────────────

  const toggleSensor = (idx: number) => {
    setSensors(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSensor = (idx: number, field: keyof SensorConfig, value: string | boolean) => {
    setSensors(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-black text-white">Myncel</span>
          <span className="text-[#8892a4] text-sm">/ Setup Wizard</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all flex-shrink-0 ${
                step > s.id ? 'bg-emerald-500 text-white' :
                step === s.id ? 'bg-[#635bff] text-white ring-4 ring-[#635bff]/30' :
                'bg-[#1e2d4a] text-[#8892a4]'
              }`}>
                {step > s.id ? '✓' : s.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all ${step > s.id ? 'bg-emerald-500' : 'bg-[#1e2d4a]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step label */}
        <div className="mt-4">
          <h2 className="text-white font-semibold text-lg">{STEPS[step - 1].title}</h2>
          <p className="text-[#8892a4] text-sm">{STEPS[step - 1].description}</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-[#0d1426] border border-[#1e2d4a] rounded-2xl p-8">

        {/* ─── Step 1: Welcome ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🏭</div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to Myncel CMMS</h1>
              <p className="text-[#8892a4] max-w-md mx-auto">
                This wizard will help you register your equipment and connect IoT sensors
                in just a few minutes. You'll get real-time monitoring up and running today.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[
                { icon: '⚙️', title: 'Register Equipment', desc: 'Add your machines with full details and categorization' },
                { icon: '📡', title: 'Configure Sensors', desc: 'Set up IoT sensor types and alert thresholds' },
                { icon: '🔑', title: 'Get API Key', desc: 'Connect physical sensors to your equipment instantly' },
              ].map(card => (
                <div key={card.title} className="bg-[#070d1a] border border-[#1e2d4a] rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <div className="text-white text-sm font-semibold mb-1">{card.title}</div>
                  <div className="text-[#8892a4] text-xs">{card.desc}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#635bff]/10 border border-[#635bff]/30 rounded-xl p-4">
              <p className="text-[#635bff] text-sm font-medium">💡 What you'll need</p>
              <ul className="mt-2 space-y-1 text-[#8892a4] text-sm">
                <li>• Basic machine information (name, model, location)</li>
                <li>• Serial number (optional but recommended)</li>
                <li>• IoT gateway or sensor device (to send data later)</li>
              </ul>
            </div>

            <button
              onClick={nextStep}
              className="w-full bg-[#635bff] hover:bg-[#5248e6] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Get Started →
            </button>
          </div>
        )}

        {/* ─── Step 2: Add Machine ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">Register Your Equipment</h3>
              <p className="text-[#8892a4] text-sm">Enter the details for your first machine or piece of equipment.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">
                  Machine Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={machineForm.name}
                  onChange={e => setMachineForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Haas VF-2 CNC Mill"
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Category</label>
                <select
                  value={machineForm.category}
                  onChange={e => setMachineForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#635bff] transition-colors"
                >
                  {MACHINE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Criticality</label>
                <select
                  value={machineForm.criticality}
                  onChange={e => setMachineForm(p => ({ ...p, criticality: e.target.value }))}
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#635bff] transition-colors"
                >
                  <option value="HIGH">High — Production critical</option>
                  <option value="MEDIUM">Medium — Important</option>
                  <option value="LOW">Low — Non-critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Manufacturer</label>
                <input
                  type="text"
                  value={machineForm.manufacturer}
                  onChange={e => setMachineForm(p => ({ ...p, manufacturer: e.target.value }))}
                  placeholder="e.g. Haas Automation"
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Model Number</label>
                <input
                  type="text"
                  value={machineForm.model}
                  onChange={e => setMachineForm(p => ({ ...p, model: e.target.value }))}
                  placeholder="e.g. VF-2"
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Serial Number</label>
                <input
                  type="text"
                  value={machineForm.serialNumber}
                  onChange={e => setMachineForm(p => ({ ...p, serialNumber: e.target.value }))}
                  placeholder="e.g. SN-2024-001"
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Location</label>
                <input
                  type="text"
                  value={machineForm.location}
                  onChange={e => setMachineForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Building A, Bay 3"
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Year Installed</label>
                <input
                  type="number"
                  value={machineForm.yearInstalled}
                  onChange={e => setMachineForm(p => ({ ...p, yearInstalled: e.target.value }))}
                  placeholder="e.g. 2019"
                  min="1950" max="2030"
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#8892a4] text-xs font-medium mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea
                  value={machineForm.notes}
                  onChange={e => setMachineForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional notes about this equipment..."
                  rows={2}
                  className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#635bff] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={prevStep} className="flex-1 bg-[#1e2d4a] hover:bg-[#253550] text-white font-semibold py-3 rounded-xl transition-colors">
                ← Back
              </button>
              <button
                onClick={handleCreateMachine}
                disabled={loading}
                className="flex-1 bg-[#635bff] hover:bg-[#5248e6] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Creating...' : 'Create Machine →'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Sensor Configuration ────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">Configure IoT Sensors</h3>
              <p className="text-[#8892a4] text-sm">
                Select which sensor types you'll connect to <span className="text-white font-medium">{createdMachineName}</span>.
                You can change these anytime.
              </p>
            </div>

            <div className="space-y-3">
              {sensors.map((sensor, idx) => (
                <div
                  key={sensor.type}
                  className={`border rounded-xl p-4 transition-all ${
                    sensor.enabled
                      ? 'bg-[#635bff]/5 border-[#635bff]/40'
                      : 'bg-[#070d1a] border-[#1e2d4a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{SENSOR_ICONS[sensor.type]}</span>
                      <div>
                        <div className="text-white text-sm font-semibold capitalize">
                          {sensor.type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[#8892a4] text-xs">Unit: {sensor.unit}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSensor(idx)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        sensor.enabled ? 'bg-[#635bff]' : 'bg-[#1e2d4a]'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sensor.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {sensor.enabled && sensor.type !== 'runtime_hours' && sensor.type !== 'cycle_count' && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1e2d4a]">
                      <div>
                        <label className="block text-[#8892a4] text-xs mb-1">Warning threshold ({sensor.unit})</label>
                        <input
                          type="number"
                          value={sensor.warningThreshold}
                          onChange={e => updateSensor(idx, 'warningThreshold', e.target.value)}
                          className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[#8892a4] text-xs mb-1">Critical threshold ({sensor.unit})</label>
                        <input
                          type="number"
                          value={sensor.criticalThreshold}
                          onChange={e => updateSensor(idx, 'criticalThreshold', e.target.value)}
                          className="w-full bg-[#070d1a] border border-[#1e2d4a] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-400 text-sm font-medium">ℹ️ How sensor alerts work</p>
              <p className="text-[#8892a4] text-sm mt-1">
                When a sensor reading exceeds your thresholds, Myncel automatically creates an alert
                and notifies your team. Thresholds are per-sensor and fully customizable.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={prevStep} className="flex-1 bg-[#1e2d4a] hover:bg-[#253550] text-white font-semibold py-3 rounded-xl transition-colors">
                ← Back
              </button>
              <button
                onClick={handleGenerateApiKey}
                disabled={loading}
                className="flex-1 bg-[#635bff] hover:bg-[#5248e6] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Generating Key...' : 'Generate API Key →'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: API Key ──────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">Your IoT API Key</h3>
              <p className="text-[#8892a4] text-sm">
                Use this key to authenticate your IoT devices and sensors. Keep it secret!
              </p>
            </div>

            {/* API Key display */}
            <div className="bg-[#070d1a] border border-[#635bff]/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#635bff] text-xs font-semibold uppercase tracking-wide">API Key</span>
                <span className="text-xs text-[#8892a4]">— Copy and save this now</span>
              </div>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-emerald-400 text-sm font-mono break-all">{apiKey}</code>
                <button
                  onClick={copyApiKey}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    apiKeyCopied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#635bff]/20 text-[#635bff] border border-[#635bff]/30 hover:bg-[#635bff]/30'
                  }`}
                >
                  {apiKeyCopied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* Endpoint info */}
            <div className="space-y-3">
              <h4 className="text-white text-sm font-semibold">Send sensor data to:</h4>
              <div className="bg-[#070d1a] border border-[#1e2d4a] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded">POST</span>
                  <code className="text-white text-sm">/api/iot</code>
                </div>
                <div className="border-t border-[#1e2d4a] pt-3">
                  <p className="text-[#8892a4] text-xs mb-2">Header:</p>
                  <code className="text-[#635bff] text-xs font-mono">X-API-Key: {apiKey?.slice(0, 20)}...</code>
                </div>
                <div className="border-t border-[#1e2d4a] pt-3">
                  <p className="text-[#8892a4] text-xs mb-2">Body (JSON):</p>
                  <pre className="text-emerald-400 text-xs font-mono overflow-auto">{JSON.stringify({
                    machineId: createdMachineId,
                    sensorType: "temperature",
                    value: 72.5,
                    unit: "°C"
                  }, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* cURL example */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-2">Quick test (cURL):</h4>
              <div className="bg-[#070d1a] border border-[#1e2d4a] rounded-xl p-4 overflow-auto">
                <pre className="text-[#8892a4] text-xs font-mono whitespace-pre-wrap">{`curl -X POST https://yourapp.com/api/iot \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"machineId":"${createdMachineId}","sensorType":"temperature","value":72.5,"unit":"°C"}'`}</pre>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={prevStep} className="flex-1 bg-[#1e2d4a] hover:bg-[#253550] text-white font-semibold py-3 rounded-xl transition-colors">
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="flex-1 bg-[#635bff] hover:bg-[#5248e6] text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Finish Setup →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 5: Complete ─────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="text-center space-y-6">
            <div>
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">You're all set!</h3>
              <p className="text-[#8892a4]">
                <span className="text-white font-medium">{createdMachineName}</span> has been registered
                and your IoT API key is ready. Start sending sensor data to see live readings on your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '📊', title: 'View Dashboard', desc: 'See your machine status', href: '/dashboard' },
                { icon: '🔑', title: 'Manage API Keys', desc: 'View and rotate keys', href: '/settings/api-keys' },
                { icon: '📡', title: 'IoT Simulator', desc: 'Test without hardware', href: '/dashboard?tab=simulator' },
              ].map(card => (
                <a
                  key={card.title}
                  href={card.href}
                  className="bg-[#070d1a] border border-[#1e2d4a] hover:border-[#635bff]/50 rounded-xl p-4 text-center transition-colors cursor-pointer"
                >
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="text-white text-sm font-semibold">{card.title}</div>
                  <div className="text-[#8892a4] text-xs mt-0.5">{card.desc}</div>
                </a>
              ))}
            </div>

            <div className="bg-[#635bff]/10 border border-[#635bff]/30 rounded-xl p-4">
              <p className="text-[#635bff] text-sm font-medium">💡 Next steps</p>
              <ul className="mt-2 space-y-1 text-[#8892a4] text-sm text-left">
                <li>• Send your first sensor reading using the cURL command from the previous step</li>
                <li>• Add more machines via the dashboard or repeat this wizard</li>
                <li>• Set up maintenance schedules for each machine</li>
                <li>• Invite your team members from Settings → Team</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#635bff] hover:bg-[#5248e6] text-white font-bold py-3 rounded-xl transition-colors text-lg"
            >
              Go to Dashboard →
            </button>
          </div>
        )}

      </div>

      {/* Footer note */}
      <p className="text-[#4a5568] text-xs mt-6">
        You can add more machines and configure integrations anytime from your dashboard.
      </p>
    </div>
  );
}