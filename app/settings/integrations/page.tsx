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
  slack:         { icon: '💬', name: 'Slack',           description: 'Get work order notifications and alerts in your Slack channels', category: 'Communication' },
  quickbooks:    { icon: '💰', name: 'QuickBooks',      description: 'Sync maintenance costs and parts purchases with QuickBooks', category: 'Accounting' },
  zapier:        { icon: '⚡', name: 'Zapier',          description: 'Connect Myncel to 5,000+ apps and automate workflows', category: 'Automation' },
  twilio:        { icon: '📱', name: 'SMS Notifications', description: 'Send work order alerts via SMS to your team using Twilio', category: 'Communication' },
  webhooks:      { icon: '🔗', name: 'Webhooks',        description: 'Send real-time events to your own endpoints', category: 'Developer' },
  google_sheets: { icon: '📊', name: 'Google Sheets',   description: 'Export reports and data to Google Sheets automatically', category: 'Productivity' },
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

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const isConnected = (id: string) => integrations[id]?.status === 'CONNECTED';

  const handleConnect = async (id: string) => {
    if (id === 'twilio') {
      setTwilioForm({ accountSid: '', authToken: '', fromNumber: '' });
      setTwilioError('');
      setModal({ kind: 'twilio' });
      return;
    }
    if (id === 'webhooks') { setModal({ kind: 'webhooks' }); return; }

    setWorking(id);
    try {
      const res = await fetch(`/api/integrations/${id}/connect`);
      if (res.ok) {
        const data = await res.json();
        if (data.type === 'api_key') {
          setModal({ kind: 'zapier', apiKey: data.apiKey, webhookUrl: data.webhookUrl });
          fetchIntegrations();
        } else if (res.redirected || data.authUrl) {
          window.location.href = data.authUrl || res.url;
        } else if (data.error) {
          if (data.message) setModal({ kind: 'oauth', integration: id, name: INTEGRATION_META[id]?.name || id });
          else showToast('error', data.error);
        }
      } else {
        const data = await res.json();
        if (data.message) setModal({ kind: 'oauth', integration: id, name: INTEGRATION_META[id]?.name || id });
        else showToast('error', data.error || 'Failed to connect');
      }
    } catch { showToast('error', 'Connection failed. Please try again.'); }
    finally { setWorking(null); }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm(`Disconnect ${INTEGRATION_META[id]?.name || id}? This will disable related notifications.`)) return;
    setWorking(id);
    try {
      const integ = integrations[id];
      if (!integ?.id) { showToast('error', 'Integration not found'); return; }
      const res = await fetch(`/api/integrations/${id}/disconnect`, { method: 'POST' });
      if (res.ok) { showToast('success', `${INTEGRATION_META[id]?.name || id} disconnected.`); fetchIntegrations(); }
      else { const data = await res.json(); showToast('error', data.error || 'Failed to disconnect'); }
    } catch { showToast('error', 'Disconnect failed.'); }
    finally { setWorking(null); }
  };

  const handleTwilioSave = async () => {
    setTwilioError('');
    if (!twilioForm.accountSid || !twilioForm.authToken || !twilioForm.fromNumber) {
      setTwilioError('All fields are required.'); return;
    }
    if (!/^\+\d{10,15}$/.test(twilioForm.fromNumber)) {
      setTwilioError('From Number must be in E.164 format, e.g. +12125551234'); return;
    }
    setTwilioSaving(true);
    try {
      const res = await fetch('/api/integrations/twilio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: twilioForm }),
      });
      if (res.ok) { setModal(null); showToast('success', 'SMS / Twilio connected successfully!'); fetchIntegrations(); }
      else { const data = await res.json(); setTwilioError(data.error || 'Failed to save configuration.'); }
    } catch { setTwilioError('Failed to save. Please try again.'); }
    finally { setTwilioSaving(false); }
  };

  const connectedIds = ALL_IDS.filter(isConnected);
  const availableIds = ALL_IDS.filter(id => !isConnected(id));

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Integrations</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Connect Myncel with your favorite tools to automate notifications and workflows.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          Loading integrations…
        </div>
      ) : (
        <>
          {/* Connected */}
          {connectedIds.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Connected ({connectedIds.length})
              </h3>
              <div className="grid gap-3">
                {connectedIds.map(id => {
                  const meta = INTEGRATION_META[id];
                  const data = integrations[id];
                  return (
                    <div key={id} className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{meta.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{meta.name}</h4>
                              <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Connected
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{meta.description}</p>
                            {data?.connectedAt && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                Connected {new Date(data.connectedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDisconnect(id)}
                          disabled={working === id}
                          className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors flex-shrink-0"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
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
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Available Integrations
            </h3>
            <div className="grid gap-3">
              {availableIds.map(id => {
                const meta = INTEGRATION_META[id];
                return (
                  <div key={id} className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{meta.icon}</span>
                        <div>
                          <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{meta.name}</h4>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{meta.description}</p>
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                            {meta.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(id)}
                        disabled={working === id}
                        className="px-4 py-2 text-sm bg-[#635bff] text-white rounded-lg hover:bg-[#4f46e5] disabled:opacity-50 transition-colors whitespace-nowrap flex-shrink-0"
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
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Webhook Endpoints</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Configure custom endpoints to receive real-time Myncel events</p>
              </div>
              <Link href="/settings/webhooks" className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors" style={{ background: '#0a2540' }}>
                Manage Webhooks →
              </Link>
            </div>
            <div className="rounded-lg p-4 border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>Events available:</p>
              <div className="flex flex-wrap gap-2">
                {['work_order.created', 'work_order.completed', 'alert.triggered', 'machine.status_changed', 'pm.overdue'].map(ev => (
                  <span key={ev} className="text-xs font-mono px-2 py-1 rounded border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{ev}</span>
                ))}
              </div>
            </div>
          </div>

          {/* REST API */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>REST API</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Use the Myncel REST API to build custom integrations. Base URL:{' '}
              <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                https://myncel.com/api
              </code>
            </p>
            <div className="flex gap-3">
              <Link href="/docs/api" className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                API Documentation
              </Link>
              <button onClick={() => handleConnect('zapier')} className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors" style={{ background: '#0a2540' }}>
                Generate API Key
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>

            {/* Twilio */}
            {modal.kind === 'twilio' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">📱</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Connect SMS Notifications</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Powered by Twilio</p>
                  </div>
                </div>
                <p className="text-sm mb-5 rounded-lg p-3 border" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                  You'll need a{' '}
                  <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-[#635bff] hover:underline">Twilio account</a>
                  {' '}to send SMS. Enter your credentials below — they are stored securely.
                </p>
                <div className="space-y-4">
                  {[
                    { label: 'Account SID', key: 'accountSid', type: 'text', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
                    { label: 'Auth Token', key: 'authToken', type: 'password', placeholder: 'Your Twilio auth token' },
                    { label: 'From Number', key: 'fromNumber', type: 'tel', placeholder: '+12125551234' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                      <input
                        type={f.type}
                        value={(twilioForm as any)[f.key]}
                        onChange={e => setTwilioForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  ))}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>From Number must be in E.164 format, e.g. +12125551234</p>
                  {twilioError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{twilioError}</div>}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleTwilioSave} disabled={twilioSaving}
                    className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50 transition-colors">
                    {twilioSaving ? 'Saving…' : 'Connect SMS'}
                  </button>
                  <button onClick={() => setModal(null)}
                    className="px-5 py-2.5 rounded-lg text-sm transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Zapier */}
            {modal.kind === 'zapier' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">⚡</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Zapier Connected</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your API key is ready</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'API Key', value: modal.apiKey },
                    { label: 'Webhook URL', value: modal.webhookUrl },
                  ].map(item => (
                    <div key={item.label}>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</label>
                      <div className="flex gap-2">
                        <code className="flex-1 rounded-lg px-3 py-2.5 text-xs font-mono break-all" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                          {item.value}
                        </code>
                        <button onClick={() => { navigator.clipboard.writeText(item.value); showToast('success', 'Copied!'); }}
                          className="px-3 py-2 rounded-lg text-sm flex-shrink-0" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                          📋
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>Save your API key now.</strong> Use it in the Myncel Zapier app to authenticate.
                  </div>
                </div>
                <button onClick={() => setModal(null)}
                  className="w-full mt-6 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors">
                  Done
                </button>
              </div>
            )}

            {/* OAuth not configured */}
            {modal.kind === 'oauth' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{INTEGRATION_META[modal.integration]?.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Connect {modal.name}</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>OAuth configuration required</p>
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
                <button onClick={() => setModal(null)}
                  className="w-full rounded-lg text-sm py-2.5 transition-colors"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                  Close
                </button>
              </div>
            )}

            {/* Webhooks info */}
            {modal.kind === 'webhooks' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🔗</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Webhook Endpoints</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Real-time event delivery</p>
                  </div>
                </div>
                <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                  Webhooks let you receive real-time HTTP POST notifications when events happen in Myncel.
                </p>
                <div className="rounded-lg p-4 border mb-5" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Available Events</p>
                  <div className="space-y-1">
                    {[
                      { event: 'work_order.created',     desc: 'A new work order is opened' },
                      { event: 'work_order.completed',   desc: 'A work order is marked done' },
                      { event: 'alert.triggered',        desc: 'An equipment alert fires' },
                      { event: 'machine.status_changed', desc: 'Equipment status changes' },
                      { event: 'pm.overdue',             desc: 'A preventive maintenance task is overdue' },
                    ].map(e => (
                      <div key={e.event} className="flex items-start gap-2">
                        <code className="text-xs font-mono text-[#635bff] flex-shrink-0">{e.event}</code>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— {e.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link href="/settings/webhooks" onClick={() => setModal(null)}
                    className="flex-1 text-center bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors">
                    Manage Webhooks →
                  </Link>
                  <button onClick={() => setModal(null)}
                    className="px-5 py-2.5 rounded-lg text-sm transition-colors"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
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