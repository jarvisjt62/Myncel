'use client';

/**
 * /approvals — Multi-step approval queue
 *
 * Two tabs:
 *   - My Queue   → pending requests I can act on (or that I requested)
 *   - All        → every request in the org, all statuses
 *
 * Each row shows the linked work order, the current step, and Approve /
 * Reject buttons when the current user can act on it.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PolicyStep {
  id: string;
  order: number;
  name: string;
  requiredPermission: string;
  approverUserIds: string[];
  requireAll: boolean;
}

interface Policy {
  id: string;
  name: string;
  trigger: 'PRE_START' | 'PRE_CLOSE' | 'VENDOR_QUOTE';
  steps: PolicyStep[];
}

interface Decision {
  id: string;
  stepOrder: number;
  decision: 'APPROVED' | 'REJECTED';
  comment: string | null;
  decidedAt: string;
  user?: { id: string; name?: string | null; email?: string | null } | null;
}

interface ApprovalRequest {
  id: string;
  trigger: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  currentStepOrder: number;
  requestedTransition: string;
  previousStatus: string;
  createdAt: string;
  decidedAt?: string | null;
  policy: Policy;
  decisions: Decision[];
  workOrder: {
    id: string;
    woNumber: string;
    title: string;
    status: string;
    priority: string;
    totalCost?: number | null;
    currency?: string | null;
  };
  requestedBy?: { id: string; name?: string | null; email?: string | null } | null;
}

const TRIGGER_LABEL: Record<string, string> = {
  PRE_START: 'Pre-start budget approval',
  PRE_CLOSE: 'Pre-close safety sign-off',
  VENDOR_QUOTE: 'Vendor / parts quote',
};

const TRIGGER_BADGE: Record<string, string> = {
  PRE_START: 'bg-blue-50 text-blue-700 border-blue-200',
  PRE_CLOSE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VENDOR_QUOTE: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-purple-50 text-purple-700 border-purple-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '—';
  }
}

export default function ApprovalsClient() {
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [items, setItems] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [decideOn, setDecideOn] = useState<{ req: ApprovalRequest; decision: 'APPROVED' | 'REJECTED' } | null>(null);
  const [comment, setComment] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const url = tab === 'mine' ? '/api/approval-requests?mine=1' : '/api/approval-requests';
      const r = await fetch(url).then((r) => r.json());
      setItems(Array.isArray(r.requests) ? r.requests : []);
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const submitDecision = async () => {
    if (!decideOn) return;
    setWorking(decideOn.req.id);
    try {
      const res = await fetch(`/api/approval-requests/${decideOn.req.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decideOn.decision, comment: comment.trim() || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to submit decision');
      showToast('success', `Decision recorded: ${decideOn.decision.toLowerCase()}`);
      setDecideOn(null);
      setComment('');
      refresh();
    } catch (e: any) {
      showToast('error', e?.message || 'Decision failed');
    } finally {
      setWorking(null);
    }
  };

  const cancelRequest = async (req: ApprovalRequest) => {
    if (!confirm(`Cancel approval request for ${req.workOrder.woNumber}? The work order will return to its previous status.`)) return;
    setWorking(req.id);
    try {
      const res = await fetch(`/api/approval-requests/${req.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b?.error || 'Cancel failed');
      }
      showToast('success', 'Request cancelled');
      refresh();
    } catch (e: any) {
      showToast('error', e?.message || 'Cancel failed');
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Multi-step approval queue for work-order transitions.{' '}
            <Link href="/settings/approvals" className="text-indigo-600 hover:underline">
              Manage policies →
            </Link>
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {(['mine', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
              tab === t
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'mine' ? 'My Queue' : 'All Requests'}
          </button>
        ))}
      </div>

      {/* Toast */}
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

      {/* List */}
      {loading ? (
        <div className="text-sm text-gray-500 p-8 text-center">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500 p-8 text-center bg-white rounded-lg border border-gray-200">
          {tab === 'mine'
            ? 'No requests waiting on you. Nice work.'
            : 'No approval requests in this organization yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((req) => {
            const step = req.policy.steps.find((s) => s.order === req.currentStepOrder);
            const totalSteps = req.policy.steps.length;
            const myDecisionOnStep = req.decisions.find(
              (d) => d.stepOrder === req.currentStepOrder,
            );
            return (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        href={`/admin/work-orders`}
                        className="font-mono text-sm text-indigo-600 hover:underline"
                      >
                        {req.workOrder.woNumber}
                      </Link>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE[req.status]}`}
                      >
                        {req.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${TRIGGER_BADGE[req.trigger] || ''}`}
                      >
                        {TRIGGER_LABEL[req.trigger] || req.trigger}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {req.workOrder.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Policy: <span className="font-medium">{req.policy.name}</span>
                      {req.status === 'PENDING' && step ? (
                        <>
                          {' '}
                          · Step {req.currentStepOrder} of {totalSteps}:{' '}
                          <span className="font-medium">{step.name}</span>
                        </>
                      ) : null}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Requested by{' '}
                      {req.requestedBy?.name || req.requestedBy?.email || 'unknown'} ·{' '}
                      {formatDate(req.createdAt)}
                    </p>
                    {req.requestedTransition && req.status === 'PENDING' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Wants to move WO →{' '}
                        <span className="font-mono">{req.requestedTransition}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === 'PENDING' && !myDecisionOnStep && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={working === req.id}
                        onClick={() => setDecideOn({ req, decision: 'APPROVED' })}
                        className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✓ Approve
                      </button>
                      <button
                        disabled={working === req.id}
                        onClick={() => setDecideOn({ req, decision: 'REJECTED' })}
                        className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                      <button
                        disabled={working === req.id}
                        onClick={() => cancelRequest(req)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        title="Cancel & roll back the work order"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {req.status === 'PENDING' && myDecisionOnStep && (
                    <span className="text-xs text-gray-500 italic">
                      You already decided ({myDecisionOnStep.decision.toLowerCase()})
                    </span>
                  )}
                </div>

                {/* Decision history */}
                {req.decisions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    {req.decisions.map((d) => (
                      <div key={d.id} className="text-xs text-gray-600">
                        <span className="font-mono">Step {d.stepOrder}</span>
                        {' · '}
                        <span
                          className={
                            d.decision === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'
                          }
                        >
                          {d.decision}
                        </span>
                        {' by '}
                        <span className="font-medium">
                          {d.user?.name || d.user?.email || '—'}
                        </span>
                        {' · '}
                        <span className="text-gray-400">{formatDate(d.decidedAt)}</span>
                        {d.comment ? (
                          <div className="ml-4 mt-0.5 italic text-gray-500">“{d.comment}”</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Decision modal */}
      {decideOn && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl modal-safe-pad max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                {decideOn.decision === 'APPROVED' ? 'Approve' : 'Reject'} request
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {decideOn.req.workOrder.woNumber} — {decideOn.req.workOrder.title}
              </p>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Comment {decideOn.decision === 'REJECTED' ? '(recommended)' : '(optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  decideOn.decision === 'APPROVED'
                    ? 'e.g. Budget confirmed, proceed.'
                    : 'e.g. Need vendor quote first.'
                }
                rows={4}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="p-5 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => {
                  setDecideOn(null);
                  setComment('');
                }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitDecision}
                disabled={working === decideOn.req.id}
                className={`px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50 ${
                  decideOn.decision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {working === decideOn.req.id
                  ? 'Submitting…'
                  : decideOn.decision === 'APPROVED'
                  ? 'Approve'
                  : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
