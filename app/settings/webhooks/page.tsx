'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
}

const ALL_EVENTS = [
  { id: 'work_order.created', label: 'Work Order Created', desc: 'Fires when a new work order is opened' },
  { id: 'work_order.completed', label: 'Work Order Completed', desc: 'Fires when a work order is marked done' },
  { id: 'alert.triggered', label: 'Alert Triggered', desc: 'Fires when an equipment alert fires' },
  { id: 'machine.status_changed', label: 'Machine Status Changed', desc: 'Fires when equipment status changes' },
  { id: 'pm.overdue', label: 'PM Overdue', desc: 'Fires when a preventive maintenance task goes overdue' },
];

const emptyForm = { name: '', url: '', events: [] as string[], secret: '' };

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formError, setFormError] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (e) {
      console.error('Failed to fetch webhooks:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (wh: Webhook) => {
    setEditing(wh);
    setForm({ name: wh.name, url: wh.url, events: [...wh.events], secret: wh.secret || '' });
    setFormError('');
    setShowForm(true);
  };

  const toggleEvent = (eventId: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(eventId)
        ? f.events.filter(e => e !== eventId)
        : [...f.events, eventId],
    }));
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.url.trim()) { setFormError('URL is required.'); return; }
    try { new URL(form.url); } catch { setFormError('URL must be a valid HTTPS URL.'); return; }
    if (form.events.length === 0) { setFormError('Select at least one event.'); return; }

    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing.id, name: form.name, url: form.url, events: form.events, secret: form.secret || undefined }
        : { name: form.name, url: form.url, events: form.events, secret: form.secret || undefined };

      const res = await fetch('/api/webhooks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        showToast('success', editing ? 'Webhook updated.' : 'Webhook created.');
        fetchWebhooks();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to save webhook.');
      }
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (wh: Webhook) => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wh.id, isActive: !wh.isActive }),
      });
      if (res.ok) fetchWebhooks();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook? Events will stop being delivered.')) return;
    setDeleting(id);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast('success', 'Webhook deleted.');
        fetchWebhooks();
      } else {
        showToast('error', 'Failed to delete webhook.');
      }
    } catch {
      showToast('error', 'Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0a2540]">Webhook Endpoints</h1>
              <p className="text-[#425466] mt-1">Configure URLs to receive real-time Myncel events via HTTP POST</p>
            </div>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-[#635bff] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors"
            >
              + Add Webhook
            </button>
          </div>
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
            <Link href="/settings/integrations" className="block px-4 py-3 rounded-lg text-[#425466] hover:bg-[#f0f4f8] transition-colors">Integrations</Link>
            <Link href="/settings/webhooks" className="block px-4 py-3 rounded-lg bg-[#635bff] text-white font-medium">Webhooks</Link>
          </div>

          {/* Main */}
          <div className="md:col-span-3 space-y-4">
            {/* How it works */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-5">
              <h2 className="font-semibold text-[#0a2540] mb-2">How webhooks work</h2>
              <p className="text-sm text-[#425466] mb-3">
                When an event occurs in Myncel, we send a JSON <code className="bg-[#f6f9fc] px-1 rounded">POST</code> request to your endpoint URL.
                Verify authenticity using the <code className="bg-[#f6f9fc] px-1 rounded">X-Myncel-Signature</code> header (HMAC-SHA256).
              </p>
              <div className="bg-[#f6f9fc] rounded-lg p-3 border border-[#e6ebf1]">
                <p className="text-xs font-mono text-[#425466] mb-1 font-semibold">Example payload:</p>
                <pre className="text-xs font-mono text-[#0a2540] overflow-x-auto">{`{
  "event": "work_order.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "type": "work_order.created",
    "workOrderNumber": "WO-0042",
    "title": "Replace hydraulic filter",
    "machineName": "Press #3",
    "priority": "HIGH"
  }
}`}</pre>
              </div>
            </div>

            {/* Webhook list */}
            {loading ? (
              <div className="bg-white rounded-xl border border-[#e6ebf1] p-8 text-center text-[#8898aa]">Loading…</div>
            ) : webhooks.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e6ebf1] p-10 text-center">
                <div className="text-4xl mb-3">🔗</div>
                <h3 className="font-semibold text-[#0a2540] mb-1">No webhooks yet</h3>
                <p className="text-sm text-[#425466] mb-4">Add your first endpoint to start receiving real-time events.</p>
                <button onClick={openCreate} className="px-4 py-2 bg-[#635bff] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors">
                  Add Webhook
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map(wh => (
                  <div key={wh.id} className="bg-white rounded-xl border border-[#e6ebf1] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#0a2540] truncate">{wh.name}</h3>
                          {wh.isActive ? (
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Active</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Paused</span>
                          )}
                        </div>
                        <p className="text-sm font-mono text-[#635bff] truncate mb-2">{wh.url}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {wh.events.map(ev => (
                            <span key={ev} className="text-xs bg-[#f0f4f8] text-[#425466] px-2 py-0.5 rounded font-mono">{ev}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(wh)}
                          className="p-2 rounded-lg border border-[#e6ebf1] text-[#425466] hover:bg-[#f6f9fc] transition-colors"
                          title={wh.isActive ? 'Pause' : 'Activate'}
                        >
                          {wh.isActive ? '⏸' : '▶️'}
                        </button>
                        <button
                          onClick={() => openEdit(wh)}
                          className="p-2 rounded-lg border border-[#e6ebf1] text-[#425466] hover:bg-[#f6f9fc] transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(wh.id)}
                          disabled={deleting === wh.id}
                          className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Create/Edit Modal ───────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold text-[#0a2540] mb-5">{editing ? 'Edit Webhook' : 'Add Webhook Endpoint'}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. My Production Server"
                    className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">Endpoint URL</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://your-server.com/webhook"
                    className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-1">
                    Secret (optional)
                  </label>
                  <input
                    type="text"
                    value={form.secret}
                    onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                    placeholder="Used to verify the X-Myncel-Signature header"
                    className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                  />
                  <p className="text-xs text-[#8898aa] mt-1">Leave blank to skip signature verification</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#425466] uppercase tracking-wide mb-2">Events to Listen For</label>
                  <div className="space-y-2">
                    {ALL_EVENTS.map(ev => (
                      <label key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border border-[#e6ebf1] cursor-pointer hover:bg-[#f6f9fc] transition-colors">
                        <input
                          type="checkbox"
                          checked={form.events.includes(ev.id)}
                          onChange={() => toggleEvent(ev.id)}
                          className="mt-0.5 accent-[#635bff]"
                        />
                        <div>
                          <p className="text-sm font-medium text-[#0a2540]">{ev.label}</p>
                          <p className="text-xs text-[#8898aa] font-mono">{ev.id}</p>
                          <p className="text-xs text-[#425466]">{ev.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{formError}</div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : editing ? 'Update Webhook' : 'Create Webhook'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:bg-[#f6f9fc] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}