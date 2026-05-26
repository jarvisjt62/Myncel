'use client';

import React, { useEffect, useState, useCallback } from 'react';

/**
 * /dashboard/templates  —  Reusable Work Order Templates
 *
 * Lets the user manage WorkOrderTemplate rows for their org:
 *   - List active + archived templates
 *   - Create new template (full form, mirrors WO form minus machine/due)
 *   - Edit / archive / unarchive / delete
 *
 * Spawning a WO from a template happens elsewhere — inside the
 * "Create Work Order" modal on the dashboard, via a "Start from
 * template" dropdown that calls /api/work-order-templates/[id]/spawn.
 * This page is the management surface only.
 */

type Template = {
  id: string;
  name: string;
  title: string;
  description: string | null;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY' | 'INSPECTION' | 'PROJECT';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedMinutes: number | null;
  laborCost: number | null;
  partsCost: number | null;
  currency: string | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
};

type FormState = {
  name: string;
  title: string;
  description: string;
  type: Template['type'];
  priority: Template['priority'];
  estimatedMinutes: string;
  laborCost: string;
  partsCost: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  title: '',
  description: '',
  type: 'PREVENTIVE',
  priority: 'MEDIUM',
  estimatedMinutes: '',
  laborCost: '',
  partsCost: '',
  notes: '',
};

const TYPE_LABEL: Record<Template['type'], string> = {
  PREVENTIVE: '🛡️ Preventive',
  CORRECTIVE: '🔧 Corrective',
  EMERGENCY:  '🚨 Emergency',
  INSPECTION: '🔍 Inspection',
  PROJECT:    '📋 Project',
};

const PRIORITY_LABEL: Record<Template['priority'], string> = {
  CRITICAL: '🔴 Critical',
  HIGH:     '🟠 High',
  MEDIUM:   '🟡 Medium',
  LOW:      '🟢 Low',
};

export default function WorkOrderTemplatesPage() {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (includeArchived) params.set('includeArchived', '1');
      const res = await fetch(`/api/work-order-templates?${params}`, { cache: 'no-store' });
      if (res.status === 401) { setError('Not signed in.'); return; }
      if (res.status === 403) { setError('You do not have permission to view templates.'); return; }
      if (!res.ok) { setError(`HTTP ${res.status}`); return; }
      const json = await res.json();
      setTemplates(json.templates);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Network error');
    }
  }, [includeArchived]);

  useEffect(() => { refresh(); }, [refresh]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      title: t.title,
      description: t.description ?? '',
      type: t.type,
      priority: t.priority,
      estimatedMinutes: t.estimatedMinutes != null ? String(t.estimatedMinutes) : '',
      laborCost: t.laborCost != null ? String(t.laborCost) : '',
      partsCost: t.partsCost != null ? String(t.partsCost) : '',
      notes: t.notes ?? '',
    });
    setFormError(null);
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim() || !form.title.trim()) {
      setFormError('Template name and default title are required.');
      return;
    }
    setSaving(true); setFormError(null);
    try {
      const url = editingId
        ? `/api/work-order-templates/${editingId}`
        : '/api/work-order-templates';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(j.error || `HTTP ${res.status}`);
      } else {
        setShowForm(false);
        await refresh();
      }
    } catch (e: any) {
      setFormError(e?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  }

  async function archiveToggle(t: Template) {
    const res = await fetch(`/api/work-order-templates/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: !t.isArchived }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Failed: ${j.error || res.status}`);
      return;
    }
    await refresh();
  }

  async function deletePermanent(t: Template) {
    if (!confirm(`Permanently delete template "${t.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/work-order-templates/${t.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Failed: ${j.error || res.status}`);
      return;
    }
    await refresh();
  }

  // Tailwind helpers — match the dashboard styling vocabulary
  const labelClass = 'block text-xs font-semibold mb-1 text-[var(--text-secondary)] uppercase tracking-wide';
  const inputClass = 'w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface-2)] border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#635bff]';
  const selectClass = inputClass + ' cursor-pointer';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            📋 Work Order Templates
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create reusable templates for recurring work — e.g. <em>“30-day Haas VF-2 PM”</em> or
            <em> “Quarterly compressor inspection”</em> — then spawn a real Work Order from any template
            in one click on the dashboard.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={e => setIncludeArchived(e.target.checked)}
            />
            Show archived
          </label>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5]"
          >
            + New template
          </button>
        </div>
      </div>

      {/* List */}
      {error ? (
        <div className="rounded-xl p-6 text-sm text-red-600 border border-red-200 bg-red-50">{error}</div>
      ) : !templates ? (
        <div className="rounded-xl p-6 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading templates…</div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl p-8 text-center border border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <div className="text-4xl mb-2">📋</div>
          <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            No templates yet
          </div>
          <p className="text-sm max-w-md mx-auto">
            Templates let you stop re-typing the same Work Order title, description, and
            estimated cost every time. Create one for any job you do more than once.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5]"
          >
            + Create your first template
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div
              key={t.id}
              className={`rounded-xl border p-4 ${t.isArchived ? 'opacity-60' : ''}`}
              style={{ background: 'var(--bg-surface-1)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {t.name}
                    {t.isArchived && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                        Archived
                      </span>
                    )}
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    Default WO title: <span style={{ color: 'var(--text-secondary)' }}>{t.title}</span>
                  </div>
                </div>
                <div className="flex gap-2 text-[10px] flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {TYPE_LABEL[t.type]}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                    {PRIORITY_LABEL[t.priority]}
                  </span>
                </div>
              </div>

              {t.description && (
                <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {t.description}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
                <Stat label="Est. duration" value={t.estimatedMinutes != null ? `${t.estimatedMinutes} min` : '—'} />
                <Stat label="Labor cost"    value={t.laborCost   != null ? `${t.currency ?? 'USD'} ${t.laborCost}` : '—'} />
                <Stat label="Parts cost"    value={t.partsCost   != null ? `${t.currency ?? 'USD'} ${t.partsCost}` : '—'} />
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => openEdit(t)}
                  className="px-2.5 py-1 rounded border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => archiveToggle(t)}
                  className="px-2.5 py-1 rounded border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                >
                  {t.isArchived ? '↩ Unarchive' : '📦 Archive'}
                </button>
                <button
                  onClick={() => deletePermanent(t)}
                  className="px-2.5 py-1 rounded border bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-safe-pad"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => !saving && setShowForm(false)}
        >
          <div
            className="rounded-xl p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl"
            style={{ background: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-semibold text-lg" style={{ color: '#111827' }}>
                {editingId ? '✏️ Edit template' : '+ New template'}
              </h3>
              <button
                onClick={() => !saving && setShowForm(false)}
                className="text-2xl leading-none hover:opacity-70"
                style={{ color: '#6b7280' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Template name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder='e.g. "30-day Haas VF-2 PM"'
                  className={inputClass}
                />
                <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>
                  Internal name shown when picking a template. Doesn’t appear on the work order itself.
                </p>
              </div>

              <div>
                <label className={labelClass}>Default work-order title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Monthly spindle lubrication & inspection"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Description / scope of work</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detailed steps, safety notes, required tools…"
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                    className={selectClass}
                  >
                    <option value="PREVENTIVE">{TYPE_LABEL.PREVENTIVE}</option>
                    <option value="CORRECTIVE">{TYPE_LABEL.CORRECTIVE}</option>
                    <option value="EMERGENCY">{TYPE_LABEL.EMERGENCY}</option>
                    <option value="INSPECTION">{TYPE_LABEL.INSPECTION}</option>
                    <option value="PROJECT">{TYPE_LABEL.PROJECT}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                    className={selectClass}
                  >
                    <option value="CRITICAL">{PRIORITY_LABEL.CRITICAL}</option>
                    <option value="HIGH">{PRIORITY_LABEL.HIGH}</option>
                    <option value="MEDIUM">{PRIORITY_LABEL.MEDIUM}</option>
                    <option value="LOW">{PRIORITY_LABEL.LOW}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Est. duration (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.estimatedMinutes}
                    onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))}
                    placeholder="e.g. 120"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Labor cost</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.laborCost}
                    onChange={e => setForm(f => ({ ...f, laborCost: e.target.value }))}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Parts cost</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.partsCost}
                    onChange={e => setForm(f => ({ ...f, partsCost: e.target.value }))}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Internal notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes that copy onto every spawned WO."
                  rows={2}
                  className={inputClass}
                />
              </div>

              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
                <button
                  onClick={() => !saving && setShowForm(false)}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-sm border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving || !form.name.trim() || !form.title.trim()}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold border bg-[#635bff] text-white border-[#635bff] hover:bg-[#4f46e5] disabled:opacity-50"
                >
                  {saving ? 'Saving…' : (editingId ? 'Save changes' : '+ Create template')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md px-2 py-1 border"
      style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
    >
      <div className="uppercase tracking-wide" style={{ color: 'var(--text-muted)', fontSize: 9 }}>
        {label}
      </div>
      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
