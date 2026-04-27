'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';

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
  { id: 'work_order.created',     label: 'Work Order Created',     desc: 'Fires when a new work order is opened' },
  { id: 'work_order.completed',   label: 'Work Order Completed',   desc: 'Fires when a work order is marked done' },
  { id: 'alert.triggered',        label: 'Alert Triggered',        desc: 'Fires when an equipment alert fires' },
  { id: 'machine.status_changed', label: 'Machine Status Changed', desc: 'Fires when equipment status changes' },
  { id: 'pm.overdue',             label: 'PM Overdue',             desc: 'Fires when a preventive maintenance task goes overdue' },
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

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(''); setShowForm(true); };
  const openEdit = (wh: Webhook) => {
    setEditing(wh);
    setForm({ name: wh.name, url: wh.url, events: [...wh.events], secret: wh.secret || '' });
    setFormError('');
    setShowForm(true);
  };

  const toggleEvent = (eventId: string) =>
    setForm(f => ({
      ...f,
      events: f.events.includes(eventId) ? f.events.filter(e => e !== eventId) : [...f.events, eventId],
    }));

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
      if (res.ok) { showToast('success', 'Webhook deleted.'); fetchWebhooks(); }
      else showToast('error', 'Failed to delete webhook.');
    } catch { showToast('error', 'Failed to delete.'); }
    finally { setDeleting(null); }
  };

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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Webhook Endpoints</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Configure URLs to receive real-time Myncel events via HTTP POST.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-[#635bff] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors">
          + Add Webhook
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>How webhooks work</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          When an event occurs in Myncel, we send a JSON{' '}
          <code className="px-1 rounded text-xs" style={{ background: 'var(--bg-surface-2)' }}>POST</code>{' '}
          request to your endpoint URL. Verify authenticity using the{' '}
          <code className="px-1 rounded text-xs" style={{ background: 'var(--bg-surface-2)' }}>X-Myncel-Signature</code>{' '}
          header (HMAC-SHA256).
        </p>
        <div className="rounded-lg p-3 border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-mono font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Example payload:</p>
          <pre className="text-xs font-mono overflow-x-auto" style={{ color: 'var(--text-primary)' }}>{`{
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
        <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Loading…</div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-3">🔗</div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No webhooks yet</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Add your first endpoint to start receiving real-time events.</p>
          <button onClick={openCreate} className="px-4 py-2 bg-[#635bff] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors">
            Add Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <div key={wh.id} className="rounded-xl border p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{wh.name}</h4>
                    {wh.isActive ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Active</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Paused</span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-[#635bff] truncate mb-2">{wh.url}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.events.map(ev => (
                      <span key={ev} className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>{ev}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggleActive(wh)}
                    className="p-2 rounded-lg transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
                    title={wh.isActive ? 'Pause' : 'Activate'}>
                    {wh.isActive ? '⏸' : '▶️'}
                  </button>
                  <button onClick={() => openEdit(wh)}
                    className="p-2 rounded-lg transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
                    title="Edit">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(wh.id)} disabled={deleting === wh.id}
                    className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
                {editing ? 'Edit Webhook' : 'Add Webhook Endpoint'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. My Production Server"
                    className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Endpoint URL</label>
                  <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://your-server.com/webhook"
                    className="w-full px-3 py-2.5 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Secret (optional)</label>
                  <input type="text" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                    placeholder="Used to verify the X-Myncel-Signature header"
                    className="w-full px-3 py-2.5 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Leave blank to skip signature verification</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Events to Listen For</label>
                  <div className="space-y-2">
                    {ALL_EVENTS.map(ev => (
                      <label key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--border)', background: form.events.includes(ev.id) ? 'rgba(99,91,255,0.06)' : 'transparent' }}>
                        <input type="checkbox" checked={form.events.includes(ev.id)} onChange={() => toggleEvent(ev.id)}
                          className="mt-0.5 accent-[#635bff]" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ev.label}</p>
                          <p className="text-xs font-mono" style={{ color: '#635bff' }}>{ev.id}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ev.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{formError}</div>}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editing ? 'Update Webhook' : 'Create Webhook'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
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