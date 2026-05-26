'use client';

import { useState, useMemo } from 'react';

interface PermissionRow {
  id: string;
  key: string;
  category: string;
  label: string;
  description: string | null;
  isCustom: boolean;
  _count: { roles: number };
}

export default function AdminPermissionsClient({ initialPermissions }: { initialPermissions: PermissionRow[] }) {
  const [perms, setPerms] = useState<PermissionRow[]>(initialPermissions);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ key: '', category: '', label: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success'|'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');

  const byCategory = useMemo(() => {
    const filtered = search
      ? perms.filter(p => [p.key, p.label, p.category].join(' ').toLowerCase().includes(search.toLowerCase()))
      : perms;
    const out: Record<string, PermissionRow[]> = {};
    for (const p of filtered) (out[p.category] ||= []).push(p);
    return out;
  }, [perms, search]);

  function showToast(type: 'success'|'error', text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  }

  async function handleAdd() {
    setError('');
    if (!form.key || !form.category || !form.label) { setError('All fields except description are required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPerms(prev => [...prev, { ...data.permission, _count: { roles: 0 } }]);
      setShowAdd(false);
      setForm({ key: '', category: '', label: '', description: '' });
      showToast('success', 'Permission added');
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: PermissionRow) {
    if (!p.isCustom) return showToast('error', 'Seeded permissions cannot be deleted');
    if (!confirm(`Delete permission "${p.label}"? It will be removed from every role.`)) return;
    const res = await fetch(`/api/admin/permissions/${p.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return showToast('error', data.error || 'Failed');
    setPerms(prev => prev.filter(x => x.id !== p.id));
    showToast('success', 'Permission deleted');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Permission Catalog</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            The master list of permissions available to every role on the platform.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg bg-[#635bff] text-white text-sm font-semibold hover:bg-[#4f46e5]">+ Add Permission</button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search permissions…"
        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#635bff]"
      />

      <div className="space-y-4">
        {Object.keys(byCategory).length === 0 ? (
          <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-12 text-center text-[var(--text-muted)]">No permissions match.</div>
        ) : Object.entries(byCategory).map(([cat, list]) => (
          <div key={cat} className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] overflow-hidden">
            <div className="px-4 py-2 bg-[var(--bg-surface-2)] border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)] text-sm">{cat}</h3>
              <span className="text-xs text-[var(--text-muted)]">{list.length}</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {list.map(p => (
                <div key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[var(--text-primary)] truncate">{p.label}</div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">{p.key}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border)] text-[var(--text-muted)] hidden sm:inline-block">{p._count.roles} role{p._count.roles === 1 ? '' : 's'}</span>
                    {p.isCustom ? (
                      <>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">Custom</span>
                        <button onClick={() => handleDelete(p)} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50">Delete</button>
                      </>
                    ) : (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">Seeded</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 modal-safe-pad" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl [background:var(--bg-surface)] border border-[var(--border)] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Add Permission</h3>
            <div className="space-y-3">
              <Field label="Key" hint="lowercase dot-notation, e.g. custom.action">
                <input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase() }))} className="input" placeholder="custom.do_thing" />
              </Field>
              <Field label="Category">
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input" placeholder="Custom" />
              </Field>
              <Field label="Label">
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="input" placeholder="Do the thing" />
              </Field>
              <Field label="Description (optional)">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input" />
              </Field>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="px-4 py-2 rounded-lg bg-[#635bff] text-white text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-60">{saving ? 'Adding…' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{toast.text}</div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          background-color: var(--bg-surface-2);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        .input:focus { outline: none; border-color: #635bff; }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[var(--text-muted)] mt-1">{hint}</p>}
    </div>
  );
}
