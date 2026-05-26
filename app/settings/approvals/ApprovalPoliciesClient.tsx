'use client';

/**
 * /settings/approvals — Manage approval policies
 *
 * List + create / edit / delete `ApprovalPolicy` records. Each policy has
 * a trigger (PRE_START / PRE_CLOSE / VENDOR_QUOTE), match criteria
 * (priority, type, minTotalCost), and 1..N ordered steps. Each step
 * specifies either a required permission OR a list of named approver
 * users (or both).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PolicyStep {
  id?: string;
  order: number;
  name: string;
  requiredPermission: string;
  approverUserIds: string[];
  requireAll: boolean;
}

interface Policy {
  id: string;
  name: string;
  description: string | null;
  trigger: 'PRE_START' | 'PRE_CLOSE' | 'VENDOR_QUOTE';
  matchPriorities: string[];
  matchTypes: string[];
  minTotalCost: number;
  isActive: boolean;
  steps: PolicyStep[];
  createdAt: string;
  updatedAt: string;
}

const TRIGGERS: { id: Policy['trigger']; label: string; help: string }[] = [
  { id: 'PRE_START', label: 'Pre-start budget approval', help: 'Fires when someone tries to move a work order to IN_PROGRESS.' },
  { id: 'PRE_CLOSE', label: 'Pre-close safety sign-off', help: 'Fires when someone tries to move a work order to COMPLETED.' },
  { id: 'VENDOR_QUOTE', label: 'Vendor / parts quote', help: 'For vendor-quote tracking. Today fires the same way as PRE_START — call to differentiate when committing parts cost.' },
];

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const TYPES = ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'PROJECT'];

const COMMON_PERMISSIONS = [
  { key: '', label: '(no permission gate)' },
  { key: 'work_orders.approve_budget', label: 'work_orders.approve_budget — Approve budget' },
  { key: 'work_orders.approve_safety', label: 'work_orders.approve_safety — Approve safety / lockout' },
  { key: 'work_orders.approve_vendor', label: 'work_orders.approve_vendor — Approve vendor / parts' },
  { key: 'work_orders.close', label: 'work_orders.close — Anyone who can close WOs' },
  { key: 'work_orders.manage_approvals', label: 'work_orders.manage_approvals — Approval admins' },
];

function emptyPolicy(): Partial<Policy> {
  return {
    name: '',
    description: '',
    trigger: 'PRE_START',
    matchPriorities: ['CRITICAL', 'HIGH'],
    matchTypes: [],
    minTotalCost: 0,
    isActive: true,
    steps: [
      {
        order: 1,
        name: 'Supervisor sign-off',
        requiredPermission: 'work_orders.approve_budget',
        approverUserIds: [],
        requireAll: false,
      },
    ],
  };
}

export default function ApprovalPoliciesClient() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Policy> | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/approval-policies').then((r) => r.json());
      setPolicies(Array.isArray(r.policies) ? r.policies : []);
    } catch {
      showToast('error', 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const togglePriority = (p: string) => {
    if (!editing) return;
    const cur = new Set(editing.matchPriorities ?? []);
    if (cur.has(p)) cur.delete(p);
    else cur.add(p);
    setEditing({ ...editing, matchPriorities: Array.from(cur) });
  };

  const toggleType = (t: string) => {
    if (!editing) return;
    const cur = new Set(editing.matchTypes ?? []);
    if (cur.has(t)) cur.delete(t);
    else cur.add(t);
    setEditing({ ...editing, matchTypes: Array.from(cur) });
  };

  const addStep = () => {
    if (!editing) return;
    const steps = editing.steps ?? [];
    if (steps.length >= 10) {
      showToast('error', 'Maximum 10 steps per policy');
      return;
    }
    setEditing({
      ...editing,
      steps: [
        ...steps,
        {
          order: steps.length + 1,
          name: `Step ${steps.length + 1}`,
          requiredPermission: '',
          approverUserIds: [],
          requireAll: false,
        },
      ],
    });
  };

  const removeStep = (idx: number) => {
    if (!editing) return;
    const steps = (editing.steps ?? []).filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    if (steps.length === 0) {
      showToast('error', 'A policy needs at least one step');
      return;
    }
    setEditing({ ...editing, steps });
  };

  const updateStep = (idx: number, patch: Partial<PolicyStep>) => {
    if (!editing) return;
    const steps = (editing.steps ?? []).map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setEditing({ ...editing, steps });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) {
      showToast('error', 'Name is required');
      return;
    }
    if (!editing.steps || editing.steps.length === 0) {
      showToast('error', 'At least one step is required');
      return;
    }
    for (const s of editing.steps) {
      if (!s.requiredPermission && (!s.approverUserIds || s.approverUserIds.length === 0)) {
        showToast('error', `Step "${s.name}" needs a permission OR named approver`);
        return;
      }
    }

    setWorking('save');
    try {
      const isEdit = Boolean(editing.id);
      const url = isEdit ? `/api/approval-policies/${editing.id}` : '/api/approval-policies';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Save failed');
      showToast('success', isEdit ? 'Policy updated' : 'Policy created');
      setEditing(null);
      refresh();
    } catch (e: any) {
      showToast('error', e?.message || 'Save failed');
    } finally {
      setWorking(null);
    }
  };

  const deletePolicy = async (p: Policy) => {
    if (!confirm(`Delete policy "${p.name}"?`)) return;
    setWorking(p.id);
    try {
      const res = await fetch(`/api/approval-policies/${p.id}`, { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Delete failed');
      showToast('success', 'Policy deleted');
      refresh();
    } catch (e: any) {
      showToast('error', e?.message || 'Delete failed');
    } finally {
      setWorking(null);
    }
  };

  const togglePolicy = async (p: Policy) => {
    setWorking(p.id);
    try {
      const res = await fetch(`/api/approval-policies/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b?.error || 'Toggle failed');
      }
      refresh();
    } catch (e: any) {
      showToast('error', e?.message || 'Toggle failed');
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Approval policies</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gate work-order transitions with multi-step approvals.{' '}
            <Link href="/approvals" className="text-indigo-600 hover:underline">
              See pending requests →
            </Link>
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyPolicy())}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          + New policy
        </button>
      </div>

      {toast && (
        <div
          className={`mb-3 text-sm rounded-lg px-4 py-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 p-8 text-center">Loading…</div>
      ) : policies.length === 0 ? (
        <div className="text-sm text-gray-500 p-8 text-center bg-white rounded-lg border border-gray-200">
          No approval policies yet. Click <strong>+ New policy</strong> to create the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((p) => (
            <div
              key={p.id}
              className={`bg-white border rounded-xl p-4 shadow-sm ${
                p.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                      {TRIGGERS.find((t) => t.id === p.trigger)?.label || p.trigger}
                    </span>
                    {!p.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                        paused
                      </span>
                    )}
                  </div>
                  {p.description && <p className="text-sm text-gray-600 mb-2">{p.description}</p>}
                  <p className="text-xs text-gray-500">
                    Matches:{' '}
                    {p.matchPriorities.length === 0 ? 'any priority' : p.matchPriorities.join(', ')}
                    {' · '}
                    {p.matchTypes.length === 0 ? 'any type' : p.matchTypes.join(', ')}
                    {p.minTotalCost > 0 ? ` · ≥ $${p.minTotalCost.toLocaleString()}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.steps.map((s) => (
                      <span
                        key={s.order}
                        className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                      >
                        {s.order}. {s.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => togglePolicy(p)}
                    disabled={working === p.id}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {p.isActive ? '⏸ Pause' : '▶ Resume'}
                  </button>
                  <button
                    onClick={() => setEditing(p)}
                    disabled={working === p.id}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    ✎ Edit
                  </button>
                  <button
                    onClick={() => deletePolicy(p)}
                    disabled={working === p.id}
                    className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl modal-safe-pad max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">
                {editing.id ? 'Edit policy' : 'New policy'}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. High-cost emergency WO budget"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Why this policy exists, who it affects."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger *</label>
                <select
                  value={editing.trigger ?? 'PRE_START'}
                  onChange={(e) => setEditing({ ...editing, trigger: e.target.value as Policy['trigger'] })}
                  className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {TRIGGERS.find((t) => t.id === editing.trigger)?.help}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Match priorities</label>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => togglePriority(p)}
                        type="button"
                        className={`px-2 py-1 text-xs rounded-full border ${
                          (editing.matchPriorities ?? []).includes(p)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Empty = match any priority.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Match types</label>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        type="button"
                        className={`px-2 py-1 text-xs rounded-full border ${
                          (editing.matchTypes ?? []).includes(t)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Empty = match any type.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum total cost (parts + labor)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={editing.minTotalCost ?? 0}
                  onChange={(e) => setEditing({ ...editing, minTotalCost: Number(e.target.value) || 0 })}
                  className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only fires when work-order total is ≥ this. Use 0 for "always".
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editing.isActive !== false}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                />
                <label htmlFor="active" className="text-sm">Active</label>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Approval steps</h3>
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    + Add step
                  </button>
                </div>
                <div className="space-y-2">
                  {(editing.steps ?? []).map((s, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs text-gray-500 font-mono">Step {s.order}</span>
                        {(editing.steps ?? []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(idx)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        value={s.name}
                        onChange={(e) => updateStep(idx, { name: e.target.value })}
                        placeholder="Step name (e.g. Supervisor sign-off)"
                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 mb-2"
                      />
                      <select
                        value={s.requiredPermission}
                        onChange={(e) => updateStep(idx, { requiredPermission: e.target.value })}
                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 mb-2"
                      >
                        {COMMON_PERMISSIONS.map((p) => (
                          <option key={p.key} value={p.key}>{p.label}</option>
                        ))}
                      </select>
                      <input
                        value={(s.approverUserIds || []).join(', ')}
                        onChange={(e) =>
                          updateStep(idx, {
                            approverUserIds: e.target.value
                              .split(',')
                              .map((x) => x.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Named approver user IDs (comma-separated, optional)"
                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 mb-2 font-mono text-xs"
                      />
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={s.requireAll}
                          onChange={(e) => updateStep(idx, { requireAll: e.target.checked })}
                        />
                        Require ALL named approvers (otherwise first one advances)
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex flex-wrap gap-2 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={working === 'save'}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {working === 'save' ? 'Saving…' : editing.id ? 'Save changes' : 'Create policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
