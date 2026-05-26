'use client';

import { useEffect, useMemo, useState } from 'react';

type Model = 'STATISTICAL' | 'HYBRID' | 'LLM_ASSISTED';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface OrgAISettings {
  id: string;
  enabled: boolean;
  model: Model;
  sensitivity: number;
  minAlertSeverity: Severity;
  forecastHorizonDays: number;
  autoCreateWorkOrders: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  alertChannelOverride: string | null;
  customInstructions: string | null;
  updatedAt: string;
}

const MODEL_LABELS: Record<Model, { title: string; desc: string; emoji: string }> = {
  STATISTICAL: {
    title: 'Statistical (default)',
    desc: 'Rolling z-score + EWMA. Runs entirely on your data, no external calls. Best for stable, well-instrumented assets.',
    emoji: '📊',
  },
  HYBRID: {
    title: 'Hybrid',
    desc: 'Statistical baseline + seasonal decomposition. Catches daily/weekly cyclic anomalies that pure z-score misses.',
    emoji: '🌊',
  },
  LLM_ASSISTED: {
    title: 'LLM-assisted',
    desc: 'Statistical detection + AI-written recommendations and root-cause hints. Sends anonymized signal summaries to the in-app chat AI.',
    emoji: '🤖',
  },
};

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low — log everything', color: '#9ca3af' },
  { value: 'MEDIUM', label: 'Medium — moderate noise filter', color: '#f59e0b' },
  { value: 'HIGH', label: 'High — only serious anomalies', color: '#f97316' },
  { value: 'CRITICAL', label: 'Critical — only catastrophic deviations', color: '#dc2626' },
];

function sigmaForSensitivity(s: number) {
  return (5 - (s / 100) * 3).toFixed(1);
}

export default function AISettingsClient() {
  const [settings, setSettings] = useState<OrgAISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/ai/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.settings) setSettings(d.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof OrgAISettings>(key: K, value: OrgAISettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function save(patch: Partial<OrgAISettings>) {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Save failed');
      }
      const j = await res.json();
      setSettings(j.settings);
      setToast({ type: 'ok', msg: 'AI settings saved.' });
    } catch (err: any) {
      setToast({ type: 'err', msg: err?.message || 'Save failed' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2400);
    }
  }

  async function runNow() {
    setRunning(true);
    try {
      const res = await fetch('/api/ai/detect', { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Run failed');
      }
      const j = await res.json();
      setToast({
        type: 'ok',
        msg: `Engine ran on ${j.machinesScanned} machines. ${j.detectionsCreated} new detections, ${j.forecastsCreated} forecasts.`,
      });
    } catch (err: any) {
      setToast({ type: 'err', msg: err?.message || 'Run failed' });
    } finally {
      setRunning(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const sigma = useMemo(() => (settings ? sigmaForSensitivity(settings.sensitivity) : '3.0'), [settings]);

  if (loading || !settings) {
    return <div className="p-6 text-sm text-[var(--text-secondary)]">Loading AI settings…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">🤖 AI &amp; Predictive Maintenance</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Anomaly detection runs against incoming sensor readings and surfaces the deviations that matter.
            Predictive forecasts project sensor trajectories forward and warn you before a threshold is crossed.
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={running || !settings.enabled}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
        >
          {running ? 'Running engine…' : '⚡ Run engine now'}
        </button>
      </div>

      {/* Master switch */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-4">
          <button
            onClick={() => save({ enabled: !settings.enabled })}
            disabled={saving}
            role="switch"
            aria-checked={settings.enabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-[var(--accent)]' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              AI engine {settings.enabled ? 'enabled' : 'disabled'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              When disabled, the engine ignores all sensor readings org-wide. Existing detections and forecasts are preserved.
            </p>
          </div>
        </div>
      </div>

      {/* Model */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Detection model</h3>
        <div className="space-y-2">
          {(Object.keys(MODEL_LABELS) as Model[]).map((m) => {
            const meta = MODEL_LABELS[m];
            const active = settings.model === m;
            return (
              <button
                key={m}
                onClick={() => save({ model: m })}
                disabled={saving}
                className="w-full text-left rounded-lg border p-3 transition-colors flex items-start gap-3"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--accent-soft)' : 'var(--bg-card)',
                }}
              >
                <span className="text-xl leading-none">{meta.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{meta.title}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{meta.desc}</div>
                </div>
                {active && <span className="text-[var(--accent)] text-xs font-semibold">SELECTED</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sensitivity slider */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sensitivity</h3>
            <p className="text-xs text-[var(--text-secondary)]">Higher = more detections (more noise). Lower = fewer detections (only severe).</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[var(--accent)] leading-none">{settings.sensitivity}</div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">≈ {sigma}σ threshold</div>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={settings.sensitivity}
          onChange={(e) => update('sensitivity', parseInt(e.target.value))}
          onMouseUp={() => save({ sensitivity: settings.sensitivity })}
          onTouchEnd={() => save({ sensitivity: settings.sensitivity })}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
          <span>Silent (5σ)</span>
          <span>Default (3σ)</span>
          <span>Paranoid (2σ)</span>
        </div>
      </div>

      {/* Min severity */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Minimum alert severity</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Detections below this severity are still recorded but won&apos;t create alerts or send notifications.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_OPTIONS.map((opt) => {
            const active = settings.minAlertSeverity === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => save({ minAlertSeverity: opt.value })}
                disabled={saving}
                className="rounded-lg border p-2.5 text-left text-xs transition-colors"
                style={{
                  borderColor: active ? opt.color : 'var(--border)',
                  background: active ? `${opt.color}1a` : 'var(--bg-card)',
                  color: active ? opt.color : 'var(--text-primary)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Forecast horizon + auto-WO + quiet hours */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Predictive forecasting</h3>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Forecast horizon (days)
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={settings.forecastHorizonDays}
            onChange={(e) => update('forecastHorizonDays', parseInt(e.target.value || '0'))}
            onBlur={() => save({ forecastHorizonDays: settings.forecastHorizonDays })}
            className="w-32 rounded-lg border px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            How far ahead the engine projects. 30 days is the sweet spot for most rotating equipment.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoCreateWorkOrders}
            onChange={(e) => save({ autoCreateWorkOrders: e.target.checked })}
            className="mt-0.5 accent-[var(--accent)]"
          />
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">Auto-create work orders for HIGH/CRITICAL detections</div>
            <div className="text-xs text-[var(--text-secondary)]">
              When the engine raises a HIGH or CRITICAL anomaly, it will also open a draft work order on the affected machine. Most teams leave this off until they trust the model.
            </div>
          </div>
        </label>
      </div>

      {/* Quiet hours */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Quiet hours (UTC)</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Detections raised inside this window are queued and emitted when quiet hours end. Leave both blank for 24/7 alerts.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)]">From</span>
            <input
              type="number"
              min={0}
              max={23}
              value={settings.quietHoursStart ?? ''}
              onChange={(e) => update('quietHoursStart', e.target.value === '' ? null : parseInt(e.target.value))}
              onBlur={() => save({ quietHoursStart: settings.quietHoursStart })}
              placeholder="—"
              className="w-20 rounded-lg border px-3 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)]">To</span>
            <input
              type="number"
              min={0}
              max={23}
              value={settings.quietHoursEnd ?? ''}
              onChange={(e) => update('quietHoursEnd', e.target.value === '' ? null : parseInt(e.target.value))}
              onBlur={() => save({ quietHoursEnd: settings.quietHoursEnd })}
              placeholder="—"
              className="w-20 rounded-lg border px-3 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
            />
          </label>
          {(settings.quietHoursStart !== null || settings.quietHoursEnd !== null) && (
            <button
              onClick={() => save({ quietHoursStart: null, quietHoursEnd: null })}
              className="text-xs text-[var(--text-muted)] underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Alert channel + custom instructions */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Alert channel override</label>
          <p className="text-xs text-[var(--text-secondary)] mb-2">
            Slack channel name or Microsoft Teams webhook URL. Leave blank to use the default channel from <a href="/settings/notifications" className="underline">Notifications</a>.
          </p>
          <input
            type="text"
            value={settings.alertChannelOverride ?? ''}
            onChange={(e) => update('alertChannelOverride', e.target.value || null)}
            onBlur={() => save({ alertChannelOverride: settings.alertChannelOverride })}
            placeholder="#maintenance-ai or https://outlook.office.com/webhook/..."
            className="w-full rounded-lg border px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
          />
        </div>
        {settings.model === 'LLM_ASSISTED' && (
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Custom LLM instructions</label>
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Appended to every recommendation prompt. Use this to enforce house style, regulatory citations, or domain vocabulary.
            </p>
            <textarea
              value={settings.customInstructions ?? ''}
              onChange={(e) => update('customInstructions', e.target.value || null)}
              onBlur={() => save({ customInstructions: settings.customInstructions })}
              rows={3}
              placeholder='e.g. "Always cite SAE J1939 SPN if the source is a J1939 PGN. Reference 49 CFR §396.11 for DVIR-related recommendations."'
              className="w-full rounded-lg border px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
        <span>Per-machine overrides:</span>
        <a href="/dashboard" className="underline">Equipment → AI tab</a>
        <span>·</span>
        <a href="/docs/ai" className="underline">Documentation</a>
      </div>

      {toast && (
        <div
          className={`fixed z-50 rounded-lg px-4 py-2.5 text-sm shadow-lg ${
            toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
          style={{
            bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
            right: 'max(16px, env(safe-area-inset-right, 0px))',
            left: 'max(16px, env(safe-area-inset-left, 0px))',
            maxWidth: 'calc(100vw - 32px)',
            marginLeft: 'auto',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
