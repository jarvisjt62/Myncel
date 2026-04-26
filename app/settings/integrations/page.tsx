'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface IntegrationData {
  id: string;
  type: string;
  name: string;
  status: string;
  connectedAt?: string;
  config?: Record<string, any>;
  apiKey?: string;
  webhookUrl?: string;
}

type ModalType =
  | { kind: 'twilio' }
  | { kind: 'zapier'; apiKey: string; webhookUrl: string }
  | { kind: 'oauth'; integration: string; name: string }
  | { kind: 'webhooks' }
  | null;

const INTEGRATION_META: Record<string, { icon: string; name: string; description: string; category: string }> = {
  slack: { icon: '💬', name: 'Slack', description: 'Get work order notifications and alerts in your Slack channels', category: 'Communication' },
  quickbooks: { icon: '💰', name: 'QuickBooks', description: 'Sync maintenance costs and parts purchases with QuickBooks', category: 'Accounting' },
  zapier: { icon: '⚡', name: 'Zapier', description: 'Connect Myncel to 5,000+ apps and automate workflows', category: 'Automation' },
  twilio: { icon: '📱', name: 'SMS Notifications', description: 'Send work order alerts via SMS to your team using Twilio', category: 'Communication' },
  webhooks: { icon: '🔗', name: 'Webhooks', description: 'Send real-time events to your own endpoints', category: 'Developer' },
  google_sheets: { icon: '📊', name: 'Google Sheets', description: 'Export reports and data to Google Sheets automatically', category: 'Productivity' },
};

const ALL_IDS = ['slack', 'quickbooks', 'zapier', 'twilio', 'webhooks', 'google_sheets'];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Record<string, IntegrationData>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [twilioForm, setTwilioForm] = useState({ accountSid: '', authToken: '', fromNumber: '' });
  const [twilioError, setTwilioError] = useState('');
  const [twilioSaving, setTwilioSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, IntegrationData> = {};
        (data.integrations || []).forEach((i: any) => {
          // API returns { id: 'slack', connected: true, integrationId: '...' }
          map[i.id] = {
            id: i.integrationId || i.id,
            type: i.id,
            name: i.name,
            status: i.connected ? 'CONNECTED' : (i.status || 'PENDING'),
            connectedAt: i.connectedAt,
            config: i.config,
            apiKey: i.apiKey,
            webhookUrl: i.webhookUrl,
          };
        });
        setIntegrations(map);
      }
    } catch (e) {
      console.error('Failed to fetch integrations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const isConnected = (id: string) => {
    const key = id === 'google_sheets' ? 'google_sheets' : id;
    return integrations[key]?.status === 'CONNECTED';
  };

  const handleConnect = async (id: string) => {
    if (id === 'twilio') {
      setTwilioForm({ accountSid: '', authToken: '', fromNumber: '' });
      setTwilioError('');
      setModal({ kind: 'twilio' });
      return;
    }

    if (id === 'webhooks') {
      setModal({ kind: 'webhooks' });
      return;
    }

    // OAuth-based or API-key based
    setWorking(id);
    try {
      const res = await fetch(`/api/integrations/${id}/connect`);
      if (res.ok) {
        const data = await res.json();
        if (data.type === 'api_key') {
          // Zapier
          setModal({ kind: 'zapier', apiKey: data.apiKey, webhookUrl: data.webhookUrl });
          fetchIntegrations();
        } else if (res.redirected || data.authUrl) {
          // OAuth redirect
          const url = data.authUrl || res.url;
          window.location.href = url;
        } else if (data.error) {
          if (data.message) {
            setModal({ kind: 'oauth', integration: id, name: INTEGRATION_META[id]?.name || id });
          } else {
            showToast('error', data.error);
          }
        }
      } else {
        const data = await res.json();
        if (data.message) {
          setModal({ kind: 'oauth', integration: id, name: INTEGRATION_META[id]?.name || id });
        } else {
          showToast('error', data.error || 'Failed to connect');
        }
      }
    } catch (e) {
      showToast('error', 'Connection failed. Please try again.');
    } finally {
      setWorking(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm(`Disconnect ${INTEGRATION_META[id]?.name || id}? This will disable related notifications.`)) return;
    setWorking(id);
    try {
      const integ = integrations[id];
      if (!integ?.id) {
        showToast('error', 'Integration not found');
        return;
      }
      // Use the integration type name (e.g. 'slack') not the DB id
      const res = await fetch(`/api/integrations/${id}/disconnect`, { method: 'POST' });
      if (res.ok) {
        showToast('success', `${INTEGRATION_META[id]?.name || id} disconnected.`);
        fetchIntegrations();
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to disconnect');
      }
    } catch {
      showToast('error', 'Disconnect failed.');
    } finally {
      setWorking(null);
    }
  };

  const handleTwilioSave = async () => {
    setTwilioError('');
    if (!twilioForm.accountSid || !twilioForm.authToken || !twilioForm.fromNumber) {
      setTwilioError('All fields are required.');
      return;
    }
    if (!/^\+\d{10,15}$/.test(twilioForm.fromNumber)) {
      setTwilioError('From Number must be in E.164 format, e.g. +12125551234');
      return;
    }
    setTwilioSaving(true);
    try {
      const res = await fetch('/api/integrations/twilio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: twilioForm }),
      });
      if (res.ok) {
        setModal(null);
        showToast('success', 'SMS / Twilio connected successfully!');
        fetchIntegrations();
      } else {
        const data = await res.json();
        setTwilioError(data.error || 'Failed to save configuration.');
      }
    } catch {
      setTwilioError('Failed to save. Please try again.');
    } finally {
      setTwilioSaving(false);
    }
  };

  const connectedIds = ALL_IDS.filter(isConnected);
  const availableIds = ALL_IDS.filter(id => !isConnected(id));

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-[#0a2540]">Integrations</h1>
          <p className="text-[#425466] mt-1">Connect Myncel with your favorite tools to automate notifications and workflows</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-1">
            <Link href="/settings" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">Profile</Link>
            <Link href="/settings/security" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">Security</Link>
            <Link href="/settings/team" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">Team</Link>
            <Link href="/settings/notifications" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">Notifications</Link>
            <Link href="/settings/integrations" className="block px-4 py-3 rounded-lg bg-[#635bff] text-white font-medium">Integrations</Link>
          </div>

          {/* Main */}
          <div className="md:col-span-3 space-y-6">
            {loading ? (
              <div className="bg-white rounded-xl border border-[#e6ebf1] p-8 text-center text-[#8898aa]">Loading integrations…</div>
            ) : (
              <>
                {/* Connected */}
                {connectedIds.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold text-[#8898aa] uppercase tracking-widest mb-3">Connected ({connectedIds.length})</h2>
                    <div className="grid gap-3">
                      {connectedIds.map(id => {
                        const meta = INTEGRATION_META[id];
                        const data = integrations[id];
                        return (
                          <div key={id} className="bg-white rounded-xl border border-[#e6ebf1] p-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="text-3xl">{meta.icon}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-[#0a2540]">{meta.name}</h3>
                                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                                      Connected
                                    </span>
                                  </div>
                                  <p className="text-sm text-[#425466]">{meta.description}</p>
                                  {data?.connectedAt && (
                                    <p className="text-xs text-[#8898aa] mt-0.5">
                                      Connected {new Date(data.connectedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                  {id === 'zapier' && integrations[id]?.apiKey && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <code className="text-xs bg-[#f6f9fc] border border-[#e6ebf1] px-2 py-1 rounded font-mono">
                                        {integrations[id].apiKey?.slice(0, 20)}…
                                      </code>
                                      <button
                                        onClick={() => {
                                          const key = integrations[id]?.apiKey || '';
                                          const wh = `${window.location.origin}/api/webhooks/zapier`;
                                          setModal({ kind: 'zapier', apiKey: key, webhookUrl: wh });
                                        }}
                                        className="text-xs text-[#635bff] hover:underline"
                                      >
                                        View key
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDisconnect(id)}
                                disabled={working === id}
                                className="px-4 py-2 text-sm border border-[#e6ebf1] rounded-lg text-[#425466] hover:bg-[#f6f9fc] disabled:opacity-50 transition-colors"
                              >
                                {working === id ? 'Working…' : 'Disconnect'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available */}
                <div>
                  <h2 className="text-xs font-semibold text-[#8898aa] uppercase tracking-widest mb-3">Available Integrations</h2>
                  <div className="grid gap-3">
                    {availableIds.map(id => {
                      const meta = INTEGRATION_META[id];
                      return (
                        <div key={id} className="bg-white rounded-xl border border-[#e6ebf1] p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-3xl">{meta.icon}</span>
                              <div>
                                <h3 className="font-semibold text-[#0a2540]">{meta.name}</h3>
                                <p className="text-sm text-[#425466]">{meta.description}</p>
                                <span className="inline-block mt-1 text-xs bg-[#f0f4f8] text-[#425466] px-2 py-0.5 rounded-full">
                                  {meta.category}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleConnect(id)}
                              disabled={working === id}
                              className="px-4 py-2 text-sm bg-[#635bff] text-white rounded-lg hover:bg-[#4f46e5] disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              {working === id ? 'Connecting…' : id === 'webhooks' ? 'Manage' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Webhooks section */}
                <div className="bg-white rounded-xl border border-[#e6ebf1] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="font-semibold text-[#0a2540]">Webhook Endpoints</h2>
                      <p className="text-sm text-[#425466] mt-0.5">Configure custom endpoints to receive real-time Myncel events</p>
                    </div>
                    <Link href="/settings/webhooks" className="px-4 py-2 text-sm bg-[#0a2540] text-white rounded-lg hover:bg-[#1e3a5f] transition-colors">
                      Manage Webhooks →
                    </Link>
                  </div>
                  <div className="bg-[#f6f9fc] rounded-lg p-4 border border-[#e6ebf1]">
                    <p className="text-xs text-[#8898aa] font-mono mb-1">Events available:</p>
                    <div className="flex flex-wrap gap-2">
                      {['work_order.created', 'work_order.completed', 'alert.triggered', 'machine.status_changed', 'pm.overdue'].map(ev => (
                        <span key={ev} className="text-xs font-mono bg-white border border-[#e6ebf1] px-2 py-1 rounded text-[#425466]">{ev}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Developer API Keys */}
                <div className="bg-white rounded-xl border border-[#e6ebf1] p-5">
                  <h2 className="font-semibold text-[#0a2540] mb-1">REST API</h2>
                  <p className="text-sm text-[#425466] mb-4">
                    Use the Myncel REST API to build custom integrations. Base URL:{' '}
                    <code className="text-xs bg-[#f6f9fc] border border-[#e6ebf1] px-1.5 py-0.5 rounded font-mono">https://myncel.com/api</code>
                  </p>
                  <div className="flex gap-3">
                    <Link href="/docs/api/overview" className="px-4 py-2 text-sm border border-[#e6ebf1] rounded-lg text-[#425466] hover:bg-[#f6f9fc] transition-colors">
                      API Documentation
                    </Link>
                    <button
                      onClick={() => handleConnect('zapier')}
                      className="px-4 py-2 text-sm bg-[#0a2540] text-white rounded-lg hover:bg-[#1e3a5f] transition-colors"
                    >
                      Generate API Key
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

            {/* Twilio Config Modal */}
            {modal.kind === 'twilio' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">📱</span>
                  <div>
                    <h2 className="text-lg font-bold text-[#0a2540]">Connect SMS Notifications</h2>
                    <p className="text-sm text-[#425466]">Powered by Twilio</p>
                  </div>
                </div>
                <p className="text-sm text-[#425466] mb-5 bg-[#f6f9fc] rounded-lg p-3 border border-[#e6ebf1]">
                  You'll need a{' '}
                  <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-[#635bff] hover:underline">Twilio account</a>
                  {' '}to send SMS. Enter your credentials below — they are stored securely.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Account SID</label>
                    <input
                      type="text"
                      value={twilioForm.accountSid}
                      onChange={e => setTwilioForm(f => ({ ...f, accountSid: e.target.value }))}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Auth Token</label>
                    <input
                      type="password"
                      value={twilioForm.authToken}
                      onChange={e => setTwilioForm(f => ({ ...f, authToken: e.target.value }))}
                      placeholder="Your Twilio auth token"
                      className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">From Number</label>
                    <input
                      type="tel"
                      value={twilioForm.fromNumber}
                      onChange={e => setTwilioForm(f => ({ ...f, fromNumber: e.target.value }))}
                      placeholder="+12125551234"
                      className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                    />
                    <p className="text-xs text-[#8898aa] mt-1">Must be a Twilio phone number in E.164 format</p>
                  </div>
                  {twilioError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{twilioError}</div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleTwilioSave}
                    disabled={twilioSaving}
                    className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                  >
                    {twilioSaving ? 'Saving…' : 'Connect SMS'}
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="px-5 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Zapier API Key Modal */}
            {modal.kind === 'zapier' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">⚡</span>
                  <div>
                    <h2 className="text-lg font-bold text-[#0a2540]">Zapier Connected</h2>
                    <p className="text-sm text-[#425466]">Your API key is ready</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">API Key</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg px-3 py-2.5 text-xs font-mono text-[#0a2540] break-all">
                        {modal.apiKey}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(modal.apiKey); showToast('success', 'Copied!'); }}
                        className="px-3 py-2 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc] transition-colors flex-shrink-0"
                        title="Copy"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Webhook URL</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg px-3 py-2.5 text-xs font-mono text-[#0a2540] break-all">
                        {modal.webhookUrl}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(modal.webhookUrl); showToast('success', 'Copied!'); }}
                        className="px-3 py-2 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc] transition-colors flex-shrink-0"
                        title="Copy"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>Save your API key now.</strong> Use it in the Myncel Zapier app to authenticate. The webhook URL receives events from Zapier triggers.
                  </div>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="w-full mt-6 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* OAuth not configured modal */}
            {modal.kind === 'oauth' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{INTEGRATION_META[modal.integration]?.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold text-[#0a2540]">Connect {modal.name}</h2>
                    <p className="text-sm text-[#425466]">OAuth configuration required</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-5">
                  <p className="font-semibold mb-1">Environment variables not set</p>
                  <p>To enable {modal.name} OAuth, add these to your environment:</p>
                  <ul className="mt-2 space-y-1 font-mono text-xs">
                    <li>{modal.integration.toUpperCase().replace('-', '_')}_CLIENT_ID</li>
                    <li>{modal.integration.toUpperCase().replace('-', '_')}_CLIENT_SECRET</li>
                  </ul>
                </div>
                <p className="text-sm text-[#425466] mb-5">
                  Once configured, users will be redirected through the {modal.name} OAuth flow to securely authorize Myncel.
                </p>
                <button onClick={() => setModal(null)} className="w-full border border-[#e6ebf1] text-[#425466] py-2.5 rounded-lg text-sm hover:bg-[#f6f9fc] transition-colors">
                  Close
                </button>
              </div>
            )}

            {/* Webhooks info modal */}
            {modal.kind === 'webhooks' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🔗</span>
                  <div>
                    <h2 className="text-lg font-bold text-[#0a2540]">Webhook Endpoints</h2>
                    <p className="text-sm text-[#425466]">Real-time event delivery</p>
                  </div>
                </div>
                <p className="text-sm text-[#425466] mb-5">
                  Webhooks let you receive real-time HTTP POST notifications when events happen in Myncel — work orders created, alerts triggered, and more.
                </p>
                <div className="bg-[#f6f9fc] rounded-lg p-4 border border-[#e6ebf1] mb-5">
                  <p className="text-xs font-semibold text-[#425466] uppercase tracking-wide mb-2">Available Events</p>
                  <div className="space-y-1">
                    {[
                      { event: 'work_order.created', desc: 'A new work order is opened' },
                      { event: 'work_order.completed', desc: 'A work order is marked done' },
                      { event: 'alert.triggered', desc: 'An equipment alert fires' },
                      { event: 'machine.status_changed', desc: 'Equipment status changes' },
                      { event: 'pm.overdue', desc: 'A preventive maintenance task is overdue' },
                    ].map(e => (
                      <div key={e.event} className="flex items-start gap-2">
                        <code className="text-xs font-mono text-[#635bff] flex-shrink-0">{e.event}</code>
                        <span className="text-xs text-[#8898aa]">— {e.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/settings/webhooks"
                    onClick={() => setModal(null)}
                    className="flex-1 text-center bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors"
                  >
                    Manage Webhooks →
                  </Link>
                  <button onClick={() => setModal(null)} className="px-5 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc] transition-colors">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}