'use client';

import { useState } from 'react';

interface SettingDef {
  value: any;
  group: string;
  label: string;
}

interface Props {
  initialSettings: Record<string, SettingDef>;
}

const GROUP_META: Record<string, { label: string; icon: string; desc: string; color: string }> = {
  payment:  { label: 'Payment Gateways',    icon: '💳', desc: 'Control which payment methods are available to organizations during checkout.', color: '#635bff' },
  feature:  { label: 'Platform Features',   icon: '⚡', desc: 'Enable or disable features across the entire platform for all organizations.', color: '#10b981' },
  security: { label: 'Security Settings',   icon: '🔒', desc: 'Configure platform-wide security policies and authentication requirements.', color: '#ef4444' },
  platform: { label: 'Platform Operations', icon: '⚙️', desc: 'Core platform configuration including maintenance mode and registration settings.', color: '#f59e0b' },
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#10b981' : 'var(--bg-surface-2)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        outline: 'none', opacity: disabled ? 0.5 : 1,
        boxShadow: checked ? '0 0 0 2px rgba(16,185,129,0.2)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: 80, padding: '4px 10px', borderRadius: 6,
        border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
        color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
        outline: 'none', textAlign: 'center',
      }}
    />
  );
}

export default function PlatformSettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Record<string, any>>(
    Object.fromEntries(Object.entries(initialSettings).map(([k, v]) => [k, v.value]))
  );
  const [saving, setSaving] = useState(false);
  const [savedGroup, setSavedGroup] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setPendingChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveGroup = async (group: string) => {
    const groupKeys = Object.keys(initialSettings).filter(k => initialSettings[k].group === group);
    const updates: Record<string, any> = {};
    for (const k of groupKeys) {
      if (pendingChanges[k] !== undefined || true) {
        updates[k] = settings[k];
      }
    }

    setSaving(true);
    setSavedGroup(group);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      showToast('success', `${GROUP_META[group]?.label} settings saved successfully`);
      setPendingChanges(prev => {
        const next = { ...prev };
        for (const k of groupKeys) delete next[k];
        return next;
      });
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
      setSavedGroup(null);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      showToast('success', 'All platform settings saved successfully');
      setPendingChanges({});
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Group settings by group
  const grouped: Record<string, Array<{ key: string; label: string; value: any }>> = {};
  for (const [key, def] of Object.entries(initialSettings)) {
    if (!grouped[def.group]) grouped[def.group] = [];
    grouped[def.group].push({ key, label: def.label, value: settings[key] });
  }

  const hasPending = Object.keys(pendingChanges).length > 0;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.text}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            🔧 Platform Configuration
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            Control all platform-wide settings — payment gateways, features, security, and operations.
            Changes take effect immediately for all organizations.
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving || !hasPending}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: hasPending ? 'var(--accent)' : 'var(--bg-surface-2)',
            color: hasPending ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700, fontSize: 14,
            cursor: hasPending && !saving ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}
        >
          {saving && !savedGroup ? '⏳ Saving…' : hasPending ? `💾 Save All (${Object.keys(pendingChanges).length})` : '✓ All Saved'}
        </button>
      </div>

      {/* Unsaved changes warning */}
      {hasPending && (
        <div style={{
          marginBottom: 24, padding: '10px 16px', borderRadius: 8,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
          fontSize: 13, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚠️ You have <strong>{Object.keys(pendingChanges).length} unsaved change{Object.keys(pendingChanges).length !== 1 ? 's' : ''}</strong>.
          Save each section individually or click "Save All" above.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {(['payment', 'feature', 'security', 'platform'] as const).map(group => {
          const meta = GROUP_META[group];
          const items = grouped[group] ?? [];
          const groupPending = items.filter(i => pendingChanges[i.key] !== undefined).length;

          return (
            <div key={group} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              {/* Section header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: `linear-gradient(135deg, ${meta.color}08 0%, transparent 100%)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: meta.color + '20', border: `1px solid ${meta.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {meta.icon}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {meta.label}
                      {groupPending > 0 && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, padding: '1px 7px', borderRadius: 10,
                          background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700,
                        }}>{groupPending} unsaved</span>
                      )}
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{meta.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => saveGroup(group)}
                  disabled={saving}
                  style={{
                    padding: '7px 18px', borderRadius: 7, border: 'none',
                    background: groupPending > 0 ? meta.color : 'var(--bg-surface-2)',
                    color: groupPending > 0 ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600, fontSize: 13,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving && savedGroup === group ? 0.7 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {saving && savedGroup === group ? '⏳ Saving…' : 'Save Section'}
                </button>
              </div>

              {/* Settings rows */}
              <div style={{ padding: '8px 0' }}>
                {items.map((item, idx) => {
                  const isBool = typeof item.value === 'boolean';
                  const isNum  = typeof item.value === 'number';
                  const isPending = pendingChanges[item.key] !== undefined;

                  return (
                    <div key={item.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 24px',
                      borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                      background: isPending ? 'rgba(245,158,11,0.03)' : 'transparent',
                      transition: 'background 0.2s',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.label}
                          </span>
                          {isPending && (
                            <span style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 8,
                              background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700,
                            }}>UNSAVED</span>
                          )}
                        </div>
                        <code style={{
                          fontSize: 11, color: 'var(--text-muted)',
                          background: 'var(--bg-surface-2)', padding: '1px 6px',
                          borderRadius: 4, marginTop: 2, display: 'inline-block',
                        }}>{item.key}</code>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isBool && (
                          <>
                            <span style={{
                              fontSize: 12, fontWeight: 600,
                              color: item.value ? '#10b981' : 'var(--text-secondary)',
                            }}>
                              {item.value ? 'Enabled' : 'Disabled'}
                            </span>
                            <Toggle
                              checked={item.value}
                              onChange={v => updateSetting(item.key, v)}
                            />
                          </>
                        )}
                        {isNum && (
                          <>
                            <NumberInput
                              value={item.value}
                              onChange={v => updateSetting(item.key, v)}
                              min={0}
                              max={item.key.includes('Timeout') ? 168 : item.key.includes('trialDays') ? 90 : 100}
                            />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 40 }}>
                              {item.key.includes('Timeout') ? 'hrs' : item.key.includes('Days') ? 'days' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div style={{
        marginTop: 24, padding: '16px 20px', borderRadius: 10,
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>ℹ️</span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            About Platform Settings
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
            Settings are stored in the database and take effect immediately across the platform.
            Payment gateway toggles control which options appear in the checkout modal — disabled gateways are hidden from all users.
            Feature flags control access to entire sections of the app.
            Security settings apply globally to all organizations and users.
          </p>
        </div>
      </div>
    </div>
  );
}