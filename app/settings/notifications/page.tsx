'use client';

import { useState, useEffect } from 'react';

interface NotificationSettings {
  emailWorkOrders: boolean;
  emailAlerts: boolean;
  emailReports: boolean;
  emailDigest: string;
  smsEnabled: boolean;
  smsWorkOrders: boolean;
  smsAlerts: boolean;
  smsCriticalOnly: boolean;
  phoneNumber: string;
  slackEnabled: boolean;
  slackWorkOrders: boolean;
  slackAlerts: boolean;
  slackChannel: string;
}

interface Capabilities {
  email: boolean;
  slack: boolean;
  sms: boolean;
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-[#635bff]' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailWorkOrders: true, emailAlerts: true, emailReports: true, emailDigest: 'WEEKLY',
    smsEnabled: false, smsWorkOrders: false, smsAlerts: false, smsCriticalOnly: true, phoneNumber: '',
    slackEnabled: false, slackWorkOrders: false, slackAlerts: false, slackChannel: '',
  });
  const [capabilities, setCapabilities] = useState<Capabilities>({ email: true, slack: false, sms: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
        if (data.capabilities) setCapabilities(data.capabilities);
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: keyof NotificationSettings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Configure how and when you receive notifications.</p>
      </div>

      {/* Email */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>📧 Email Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'emailWorkOrders' as const, label: 'Work Order Updates', desc: 'Get notified when work orders are assigned or completed' },
            { key: 'emailAlerts' as const,     label: 'Alerts',             desc: 'Critical alerts and maintenance reminders' },
            { key: 'emailReports' as const,    label: 'Reports',            desc: 'Summary of maintenance activity and metrics' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
              <Toggle checked={settings[item.key] as boolean} onChange={() => toggle(item.key)} />
            </div>
          ))}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email Digest Frequency</label>
            <select
              value={settings.emailDigest}
              onChange={e => setSettings(prev => ({ ...prev, emailDigest: e.target.value }))}
              className="w-full max-w-xs rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="NEVER">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* SMS */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>📱 SMS Notifications</h3>
          {!capabilities.sms && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Requires Twilio Integration</span>}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable SMS</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Turn on SMS notifications</p>
            </div>
            <Toggle checked={settings.smsEnabled} onChange={() => toggle('smsEnabled')} disabled={!capabilities.sms} />
          </div>
          {settings.smsEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Work Order Alerts</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Get SMS for work orders</p>
                </div>
                <Toggle checked={settings.smsWorkOrders} onChange={() => toggle('smsWorkOrders')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Critical Alerts Only</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Only send SMS for critical priority items</p>
                </div>
                <Toggle checked={settings.smsCriticalOnly} onChange={() => toggle('smsCriticalOnly')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                <input
                  type="tel"
                  value={settings.phoneNumber || ''}
                  onChange={e => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1234567890"
                  className="w-full max-w-xs rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Slack */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>💬 Slack Notifications</h3>
          {!capabilities.slack && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Requires Slack Integration</span>}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable Slack</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Post notifications to a Slack channel</p>
            </div>
            <Toggle checked={settings.slackEnabled} onChange={() => toggle('slackEnabled')} disabled={!capabilities.slack} />
          </div>
          {settings.slackEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Work Order Notifications</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Post work order updates to Slack</p>
                </div>
                <Toggle checked={settings.slackWorkOrders} onChange={() => toggle('slackWorkOrders')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Slack Channel</label>
                <input
                  type="text"
                  value={settings.slackChannel || ''}
                  onChange={e => setSettings(prev => ({ ...prev, slackChannel: e.target.value }))}
                  placeholder="#maintenance"
                  className="w-full max-w-xs rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-4">
        {saved && <span className="text-sm text-emerald-600">✓ Settings saved successfully!</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#635bff] text-white rounded-lg font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors text-sm"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}