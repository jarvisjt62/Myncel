'use client';

import { useState, useEffect } from 'react';
import { NotificationSkeleton } from '@/app/components/LoadingSkeleton';
import { fetchWithCache, invalidateCache } from '@/app/lib/client-cache';

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
  smsPlatformManaged?: boolean;
  slackPlatformManaged?: boolean;
}

function Toggle({ checked, onChange, disabled }: { 
  checked: boolean; 
  onChange?: () => void; 
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-[#635bff]' : 'bg-gray-200'
        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailWorkOrders: true, emailAlerts: true, emailReports: true, emailDigest: 'WEEKLY',
    smsEnabled: false, smsWorkOrders: false, smsAlerts: false, smsCriticalOnly: true, phoneNumber: '',
    slackEnabled: false, slackWorkOrders: false, slackAlerts: false, slackChannel: '',
  });
  const [capabilities, setCapabilities] = useState<Capabilities>({ email: true, slack: false, sms: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async (useCache = true) => {
    try {
      const data = await fetchWithCache(
        'notifications',
        async () => {
          const res = await fetch('/api/settings/notifications');
          if (res.ok) {
            const json = await res.json();
            return {
              settings: json.settings,
              capabilities: json.capabilities,
              isAdmin: json.isAdmin,
            };
          }
          return {};
        },
        { staleWhileRevalidate: useCache }
      );
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
      if (data.capabilities) setCapabilities(data.capabilities);
      if (data.isAdmin !== undefined) setIsAdmin(data.isAdmin);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) { invalidateCache('notifications'); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return <NotificationSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isAdmin 
            ? 'Configure notification settings for the entire platform.'
            : 'Configure your organization\'s notification preferences.'
          }
        </p>
      </div>

      {/* Email */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>📧 Email Notifications</h3>
        </div>
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
              <Toggle 
                checked={settings[item.key] as boolean} 
                onChange={() => toggle(item.key)}
              />
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
          {!capabilities.sms && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">SMS unavailable</span>
          )}
        </div>
        <div className="space-y-4">
          {/* SMS Opt-in Consent Block */}
          <div className="rounded-lg border p-4" style={{ background: 'var(--bg-page, #f6f9fc)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>📲 Enable SMS Text Message Notifications</p>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              By enabling SMS notifications and entering your phone number below, you agree to receive automated text messages from <strong>Myncel</strong> at the number provided. Messages may include work order updates, critical equipment alerts, and maintenance reminders.
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Message frequency varies based on your settings. Message and data rates may apply. Reply <strong>HELP</strong> for help. Reply <strong>STOP</strong> at any time to unsubscribe and stop receiving SMS messages.
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted, #8898aa)' }}>
              By enabling SMS, you consent to receiving text messages as described above. This consent is separate from our{' '}
              <a href="/privacy" className="underline" style={{ color: 'var(--color-primary, #635bff)' }}>Privacy Policy</a>{' '}
              and{' '}
              <a href="/terms" className="underline" style={{ color: 'var(--color-primary, #635bff)' }}>Terms of Service</a>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                I agree to receive SMS text message notifications from Myncel
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Toggle on to opt in to SMS alerts. Reply STOP to unsubscribe at any time.
              </p>
            </div>
            <Toggle
              checked={settings.smsEnabled}
              onChange={() => toggle('smsEnabled')}
              disabled={!capabilities.sms}
            />
          </div>

          {settings.smsEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Mobile Phone Number</label>
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Enter the mobile number where you want to receive SMS text messages from Myncel. Standard messaging rates apply.
                </p>
                <input
                  type="tel"
                  value={settings.phoneNumber || ''}
                  onChange={e => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1 (234) 567-8900"
                  className="w-full max-w-xs rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Work Order SMS Alerts</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Receive a text message when work orders are assigned or updated</p>
                </div>
                <Toggle
                  checked={settings.smsWorkOrders}
                  onChange={() => toggle('smsWorkOrders')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Critical Equipment Alerts Only</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Only send SMS text messages for critical priority equipment alerts</p>
                </div>
                <Toggle
                  checked={settings.smsCriticalOnly}
                  onChange={() => toggle('smsCriticalOnly')}
                />
              </div>

              {/* What you'll receive box */}
              <div className="rounded-lg border p-4 mt-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-page, #f6f9fc)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Example SMS messages you may receive:</p>
                <div className="space-y-2">
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                    [Myncel] Work Order #142 assigned to you: "Replace conveyor belt — Machine CNC-03". Reply STOP to unsubscribe.
                  </div>
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#fff3e0', color: '#e65100' }}>
                    [Myncel] CRITICAL ALERT: Temperature on Boiler #2 exceeded threshold (185°F). Check dashboard immediately. Reply STOP to opt out.
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted, #8898aa)' }}>
                  Msg frequency varies. Msg &amp; data rates may apply. Text HELP to (844) 994-1183 for help. Text STOP to unsubscribe.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Slack */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>💬 Slack Notifications</h3>
          {!capabilities.slack && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Slack unavailable</span>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable Slack</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Post notifications to a Slack channel</p>
            </div>
            <Toggle 
              checked={settings.slackEnabled} 
              onChange={() => toggle('slackEnabled')} 
              disabled={!capabilities.slack}
            />
          </div>
          {settings.slackEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Work Order Notifications</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Post work order updates to Slack</p>
                </div>
                <Toggle 
                  checked={settings.slackWorkOrders} 
                  onChange={() => toggle('slackWorkOrders')}
                />
              </div>
              {!capabilities.slackPlatformManaged && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Slack Channel</label>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Enter the Slack channel for your organization's notifications</p>
                  <input
                    type="text"
                    value={settings.slackChannel || ''}
                    onChange={e => setSettings(prev => ({ ...prev, slackChannel: e.target.value }))}
                    placeholder="#maintenance"
                    className="w-full max-w-xs rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}
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