'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Machine {
  id: string;
  name: string;
  location?: string;
}

export default function QuickActions() {
  const router = useRouter();
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [breakdownForm, setBreakdownForm] = useState({
    machineId: '',
    description: '',
    severity: 'HIGH',
    estimatedDowntime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch machines for the breakdown form
  useEffect(() => {
    if (showBreakdownModal && machines.length === 0) {
      fetch('/api/machines')
        .then(r => r.json())
        .then(d => setMachines(d.machines || []))
        .catch(() => {});
    }
  }, [showBreakdownModal]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      // Alt+B = Log Breakdown
      if (e.altKey && e.key === 'b') {
        e.preventDefault();
        setShowBreakdownModal(true);
      }
      // Alt+W = New Work Order
      if (e.altKey && e.key === 'w') {
        e.preventDefault();
        router.push('/dashboard?modal=work-order');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleBreakdownSubmit = async () => {
    if (!breakdownForm.machineId || !breakdownForm.description.trim()) {
      setSubmitError('Please select a machine and describe the issue.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/dashboard/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(breakdownForm),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowBreakdownModal(false);
          setSubmitSuccess(false);
          setBreakdownForm({ machineId: '', description: '', severity: 'HIGH', estimatedDowntime: '' });
          window.location.reload();
        }, 1500);
      } else {
        const d = await res.json();
        setSubmitError(d.error || 'Failed to log breakdown');
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const actions = [
    {
      id: 'breakdown',
      label: 'Log Breakdown',
      shortcut: 'Alt+B',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20',
      action: () => setShowBreakdownModal(true),
    },
    {
      id: 'new-work-order',
      label: 'New Work Order',
      shortcut: 'Alt+W',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20',
      action: () => router.push('/dashboard#workorders'),
    },
    {
      id: 'schedule-maintenance',
      label: 'Schedule PM',
      shortcut: null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20',
      action: () => router.push('/dashboard#schedules'),
    },
    {
      id: 'add-machine',
      label: 'Add Machine',
      shortcut: null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20',
      action: () => router.push('/dashboard#equipment'),
    },
    {
      id: 'view-alerts',
      label: 'View Alerts',
      shortcut: null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20',
      action: () => router.push('/dashboard#alerts'),
    },
    {
      id: 'settings',
      label: 'Settings',
      shortcut: null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-gray-500/10 text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-surface-2)]',
      action: () => router.push('/settings'),
    },
  ];

  const inputClass = "w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 [background:var(--bg-surface)]";
  const labelClass = "block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5";

  return (
    <>
      <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h3>
          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-2)] px-2 py-0.5 rounded-full border border-[var(--border)]">
            ⌘K search
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
              className={`flex items-center gap-2 p-2.5 rounded-lg transition-all duration-200 text-left ${action.color}`}
            >
              <div className="flex-shrink-0">{action.icon}</div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium block truncate">{action.label}</span>
                {action.shortcut && (
                  <span className="text-[10px] opacity-60 font-mono">{action.shortcut}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Log Breakdown Modal */}
      {showBreakdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && setShowBreakdownModal(false)} />
          <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-2xl w-full max-w-md border border-[var(--border)]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Log Breakdown</h3>
                  <p className="text-xs text-[var(--text-muted)]">Creates emergency work order + alert</p>
                </div>
              </div>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-surface-2)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {submitSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-[var(--text-primary)] font-semibold">Breakdown Logged!</p>
                  <p className="text-[var(--text-muted)] text-sm mt-1">Emergency work order created.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>Machine *</label>
                    <select
                      value={breakdownForm.machineId}
                      onChange={e => setBreakdownForm(f => ({ ...f, machineId: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">Select a machine...</option>
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.name}{m.location ? ` — ${m.location}` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Severity</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['MEDIUM', 'HIGH', 'CRITICAL'].map(sev => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setBreakdownForm(f => ({ ...f, severity: sev }))}
                          className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                            breakdownForm.severity === sev
                              ? sev === 'CRITICAL' ? 'bg-red-500 text-white border-red-500'
                                : sev === 'HIGH' ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-amber-500 text-white border-amber-500'
                              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Issue Description *</label>
                    <textarea
                      rows={3}
                      value={breakdownForm.description}
                      onChange={e => setBreakdownForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe what happened and what symptoms you observed..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Estimated Downtime (hours)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={breakdownForm.estimatedDowntime}
                      onChange={e => setBreakdownForm(f => ({ ...f, estimatedDowntime: e.target.value }))}
                      placeholder="e.g. 4"
                      className={inputClass}
                    />
                  </div>

                  {submitError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {submitError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowBreakdownModal(false)}
                      className="flex-1 px-4 py-2.5 text-sm text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-surface-2)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBreakdownSubmit}
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Logging...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Log Breakdown
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}