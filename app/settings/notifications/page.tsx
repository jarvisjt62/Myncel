'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailWorkOrders: true,
    emailAlerts: true,
    emailReports: true,
    emailDigest: 'WEEKLY',
    smsEnabled: false,
    smsWorkOrders: false,
    smsAlerts: false,
    smsCriticalOnly: true,
    phoneNumber: '',
    slackEnabled: false,
    slackWorkOrders: false,
    slackAlerts: false,
    slackChannel: '',
  });
  const [capabilities, setCapabilities] = useState<Capabilities>({ email: true, slack: false, sms: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
        if (data.capabilities) {
          setCapabilities(data.capabilities);
        }
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
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
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center">
        <div className="text-[#425466]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[#0a2540]">Notifications</h1>
          <p className="text-[#425466] mt-1">Configure how and when you receive notifications</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-1">
            <Link href="/settings" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Profile
            </Link>
            <Link href="/settings/security" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Security
            </Link>
            <Link href="/settings/team" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Team
            </Link>
            <Link href="/settings/notifications" className="block px-4 py-3 rounded-lg bg-[#635bff] text-white font-medium">
              Notifications
            </Link>
            <Link href="/settings/integrations" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">
              Integrations
            </Link>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Email Notifications */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6">
              <h2 className="text-lg font-semibold text-[#0a2540] mb-4">📧 Email Notifications</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-[#0a2540] font-medium">Work Order Updates</span>
                    <p className="text-sm text-[#425466]">Get notified when work orders are assigned or completed</p>
                  </div>
                  <button
                    onClick={() => handleToggle('emailWorkOrders')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.emailWorkOrders ? 'bg-[#635bff]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailWorkOrders ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
                
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-[#0a2540] font-medium">Alerts</span>
                    <p className="text-sm text-[#425466]">Critical alerts and maintenance reminders</p>
                  </div>
                  <button
                    onClick={() => handleToggle('emailAlerts')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.emailAlerts ? 'bg-[#635bff]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-[#0a2540] font-medium">Reports</span>
                    <p className="text-sm text-[#425466]">Summary of maintenance activity and metrics</p>
                  </div>
                  <button
                    onClick={() => handleToggle('emailReports')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.emailReports ? 'bg-[#635bff]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailReports ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <div className="pt-4 border-t border-[#e6ebf1]">
                  <label className="block text-sm font-medium text-[#0a2540] mb-2">Email Digest Frequency</label>
                  <select 
                    value={settings.emailDigest}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailDigest: e.target.value }))}
                    className="w-full max-w-xs border border-[#e6ebf1] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="NEVER">Never</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0a2540]">📱 SMS Notifications</h2>
                {!capabilities.sms && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Requires Twilio Integration</span>
                )}
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-[#0a2540] font-medium">Enable SMS</span>
                    <p className="text-sm text-[#425466]">Turn on SMS notifications</p>
                  </div>
                  <button
                    onClick={() => handleToggle('smsEnabled')}
                    disabled={!capabilities.sms}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.smsEnabled ? 'bg-[#635bff]' : 'bg-gray-200'
                    } ${!capabilities.sms ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.smsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                {settings.smsEnabled && (
                  <>
                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-[#0a2540] font-medium">Work Order Alerts</span>
                        <p className="text-sm text-[#425466]">Get SMS for work orders</p>
                      </div>
                      <button
                        onClick={() => handleToggle('smsWorkOrders')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.smsWorkOrders ? 'bg-[#635bff]' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.smsWorkOrders ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-[#0a2540] font-medium">Critical Alerts Only</span>
                        <p className="text-sm text-[#425466]">Only send SMS for critical priority items</p>
                      </div>
                      <button
                        onClick={() => handleToggle('smsCriticalOnly')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.smsCriticalOnly ? 'bg-[#635bff]' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.smsCriticalOnly ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-[#0a2540] mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={settings.phoneNumber || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="+1234567890"
                        className="w-full max-w-xs border border-[#e6ebf1] rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Slack Notifications */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0a2540]">💬 Slack Notifications</h2>
                {!capabilities.slack && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Requires Slack Integration</span>
                )}
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="text-[#0a2540] font-medium">Enable Slack</span>
                    <p className="text-sm text-[#425466]">Post notifications to a Slack channel</p>
                  </div>
                  <button
                    onClick={() => handleToggle('slackEnabled')}
                    disabled={!capabilities.slack}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.slackEnabled ? 'bg-[#635bff]' : 'bg-gray-200'
                    } ${!capabilities.slack ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.slackEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                {settings.slackEnabled && (
                  <>
                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-[#0a2540] font-medium">Work Order Notifications</span>
                        <p className="text-sm text-[#425466]">Post work order updates to Slack</p>
                      </div>
                      <button
                        onClick={() => handleToggle('slackWorkOrders')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.slackWorkOrders ? 'bg-[#635bff]' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.slackWorkOrders ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-[#0a2540] mb-1">Slack Channel</label>
                      <input
                        type="text"
                        value={settings.slackChannel || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, slackChannel: e.target.value }))}
                        placeholder="#maintenance"
                        className="w-full max-w-xs border border-[#e6ebf1] rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4">
              {saved && (
                <span className="text-sm text-emerald-600">Settings saved successfully!</span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#635bff] text-white rounded-lg font-medium hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}