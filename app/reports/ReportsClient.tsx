'use client';

/**
 * /reports — Saved & Scheduled Reports
 *
 * One page that lists all saved reports for the current org, lets the
 * user create / edit / delete them, run them on demand (CSV download),
 * and configure email schedules.
 */

import { useEffect, useMemo, useState } from 'react';

interface Dataset {
  id: string;
  label: string;
  description: string;
  supportsDateRange: boolean;
  filters: string[];
  columns: string[];
}

interface Owner {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface SavedReport {
  id: string;
  name: string;
  description?: string | null;
  dataset: string;
  filters: Record<string, any>;
  schedule: 'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  hourLocal: number;
  timezone: string;
  recipients: string[];
  format: 'CSV' | 'XLSX' | 'PDF';
  isActive: boolean;
  lastRunAt?: string | null;
  lastRunOk?: boolean | null;
  lastRunRows?: number | null;
  lastError?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: Owner;
}

const SCHEDULE_LABELS: Record<string, string> = {
  NEVER: 'Manual only',
  DAILY: 'Every day',
  WEEKLY: 'Every Monday',
  MONTHLY: 'Every 1st of the month',
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return '—'; }
}

export default function ReportsClient() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<SavedReport> | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const refresh = async () => {
    try {
      const [r, d] = await Promise.all([
        fetch('/api/reports').then(r => r.json()),
        fetch('/api/reports/datasets').then(r => r.json()),
      ]);
      setReports(r.reports || []);
      setDatasets(d.datasets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleRunNow = async (id: string, alsoEmail = false) => {
    setWorking(id);
    try {
      const url = alsoEmail ? `/api/reports/${id}/run?email=1` : `/api/reports/${id}/run`;
      const res = await fetch(url, { method: 'POST' });

      if (alsoEmail) {
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('success', `Sent to ${data.emailedTo.length} recipient(s) — ${data.rowCount} row(s).`);
        } else {
          showToast('error', data.error || 'Failed to send');
        }
      } else {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast('error', data.error || 'Failed to run');
          return;
        }
        // CSV — trigger browser download
        const blob = await res.blob();
        const cd = res.headers.get('content-disposition') || '';
        const m = cd.match(/filename="([^"]+)"/);
        const filename = m ? m[1] : `report-${id}.csv`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        const rowCount = res.headers.get('x-row-count') || '0';
        showToast('success', `Downloaded ${filename} (${rowCount} rows)`);
      }
      refresh();
    } catch (err) {
      console.error(err);
      showToast('error', 'Run failed');
    } finally {
      setWorking(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete saved report "${name}"? This cannot be undone.`)) return;
    setWorking(id);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Report deleted');
        refresh();
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to delete');
      }
    } finally {
      setWorking(null);
    }
  };

  const handleToggleActive = async (r: SavedReport) => {
    setWorking(r.id);
    try {
      const res = await fetch(`/api/reports/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !r.isActive }),
      });
      if (res.ok) {
        showToast('success', !r.isActive ? 'Report resumed' : 'Report paused');
        refresh();
      } else {
        showToast('error', 'Failed to toggle');
      }
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>📊 Saved &amp; Scheduled Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Save frequently-used filters, run on demand, or email a CSV to your team on a schedule.
          </p>
        </div>
        <button
          onClick={() => setEditing({ schedule: 'NEVER', hourLocal: 8, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', recipients: [], format: 'CSV', filters: {}, isActive: true })}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#635bff' }}
        >
          + New Report
        </button>
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading…</div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="text-5xl mb-3">📈</div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No saved reports yet</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Create your first report to save filters and optionally email a CSV on a schedule.
          </p>
          <button
            onClick={() => setEditing({ schedule: 'NEVER', hourLocal: 8, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', recipients: [], format: 'CSV', filters: {}, isActive: true })}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#635bff' }}
          >
            + Create Report
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map(r => {
            const ds = datasets.find(d => d.id === r.dataset);
            return (
              <div key={r.id}
                className="rounded-xl border p-4 sm:p-5"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</h3>
                      {!r.isActive && <span className="px-2 py-0.5 text-xs rounded-full" style={{ background: '#fef3c7', color: '#92400e' }}>Paused</span>}
                      {r.schedule !== 'NEVER' && r.isActive && <span className="px-2 py-0.5 text-xs rounded-full" style={{ background: '#dcfce7', color: '#166534' }}>📅 Scheduled</span>}
                    </div>
                    {r.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      <span>📂 <strong>{ds?.label || r.dataset}</strong></span>
                      <span>🕒 {SCHEDULE_LABELS[r.schedule]}{r.schedule !== 'NEVER' ? ` @ ${String(r.hourLocal).padStart(2, '0')}:00 ${r.timezone}` : ''}</span>
                      {r.recipients?.length > 0 && <span>📧 {r.recipients.length} recipient{r.recipients.length === 1 ? '' : 's'}</span>}
                      {r.lastRunAt && <span>Last run: {formatDate(r.lastRunAt)}{r.lastRunOk === false ? ' ❌' : r.lastRunRows != null ? ` · ${r.lastRunRows} rows` : ''}</span>}
                      {r.nextRunAt && r.isActive && <span>Next: {formatDate(r.nextRunAt)}</span>}
                    </div>
                    {r.lastError && (
                      <div className="text-xs mt-2 p-2 rounded bg-red-50 border border-red-200 text-red-700">
                        Last error: {r.lastError}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleRunNow(r.id, false)}
                      disabled={working === r.id}
                      className="px-3 py-2 text-xs font-medium rounded-lg disabled:opacity-50"
                      style={{ background: '#635bff', color: 'white' }}
                      title="Download CSV right now"
                    >
                      {working === r.id ? '…' : '⬇ Run + Download'}
                    </button>
                    {r.recipients?.length > 0 && (
                      <button
                        onClick={() => handleRunNow(r.id, true)}
                        disabled={working === r.id}
                        className="px-3 py-2 text-xs font-medium rounded-lg disabled:opacity-50"
                        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        title="Run and email to recipients"
                      >
                        📧 Run + Email
                      </button>
                    )}
                    {r.schedule !== 'NEVER' && (
                      <button
                        onClick={() => handleToggleActive(r)}
                        disabled={working === r.id}
                        className="px-3 py-2 text-xs font-medium rounded-lg disabled:opacity-50"
                        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        {r.isActive ? '⏸ Pause' : '▶ Resume'}
                      </button>
                    )}
                    <button
                      onClick={() => setEditing(r)}
                      className="px-3 py-2 text-xs font-medium rounded-lg"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id, r.name)}
                      disabled={working === r.id}
                      className="px-3 py-2 text-xs font-medium rounded-lg disabled:opacity-50"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: '#dc2626' }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ReportEditor
          report={editing}
          datasets={datasets}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); showToast('success', 'Report saved'); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
          style={{ background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: 'white' }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Editor modal ─────────────────────── */

interface EditorProps {
  report: Partial<SavedReport>;
  datasets: Dataset[];
  onClose: () => void;
  onSaved: () => void;
}

function ReportEditor({ report, datasets, onClose, onSaved }: EditorProps) {
  const [name, setName] = useState(report.name || '');
  const [description, setDescription] = useState(report.description || '');
  const [dataset, setDataset] = useState(report.dataset || datasets[0]?.id || 'WORK_ORDERS');
  const [filters, setFilters] = useState<Record<string, any>>(report.filters || {});
  const [schedule, setSchedule] = useState<'NEVER' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>(report.schedule || 'NEVER');
  const [hourLocal, setHourLocal] = useState<number>(report.hourLocal ?? 8);
  const [timezone, setTimezone] = useState(report.timezone || (typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'));
  const [recipientsText, setRecipientsText] = useState((report.recipients || []).join(', '));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const ds = useMemo(() => datasets.find(d => d.id === dataset), [datasets, dataset]);
  const isCreate = !report.id;

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    const recipients = recipientsText.split(/[,;\s]+/).map(s => s.trim()).filter(s => s.includes('@'));
    if (schedule !== 'NEVER' && recipients.length === 0) {
      setError('Scheduled reports need at least one email recipient.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        dataset,
        filters,
        schedule,
        hourLocal,
        timezone,
        recipients,
        format: 'CSV',
      };
      const url = isCreate ? '/api/reports' : `/api/reports/${report.id}`;
      const method = isCreate ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 modal-safe-pad" onClick={onClose}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {isCreate ? '📊 New Report' : '✎ Edit Report'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Monthly downtime — Production line"
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What this report shows…"
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Dataset</label>
              <select
                value={dataset}
                onChange={e => { setDataset(e.target.value); setFilters({}); }}
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                {datasets.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              {ds && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{ds.description}</p>}
            </div>

            {ds?.filters.includes('from') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>From</label>
                  <input
                    type="date"
                    value={filters.from || ''}
                    onChange={e => setFilters(f => ({ ...f, from: e.target.value || undefined }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>To</label>
                  <input
                    type="date"
                    value={filters.to || ''}
                    onChange={e => setFilters(f => ({ ...f, to: e.target.value || undefined }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            )}

            {ds?.filters.includes('search') && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Title contains</label>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined }))}
                  placeholder="(any)"
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>
            )}

            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Schedule</label>
              <select
                value={schedule}
                onChange={e => setSchedule(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                <option value="NEVER">Manual only — no schedule</option>
                <option value="DAILY">Every day</option>
                <option value="WEEKLY">Every Monday</option>
                <option value="MONTHLY">First day of every month</option>
              </select>
            </div>

            {schedule !== 'NEVER' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Hour (local)</label>
                    <select
                      value={hourLocal}
                      onChange={e => setHourLocal(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2.5 rounded-lg text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Timezone</label>
                    <input
                      type="text"
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      placeholder="America/New_York"
                      className="w-full px-3 py-2.5 rounded-lg text-sm"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Recipients</label>
                  <input
                    type="text"
                    value={recipientsText}
                    onChange={e => setRecipientsText(e.target.value)}
                    placeholder="alice@example.com, bob@example.com"
                    className="w-full px-3 py-2.5 rounded-lg text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Comma- or space-separated email addresses. The CSV is attached to each scheduled email.</p>
                </div>
              </>
            )}

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] disabled:opacity-50">
              {saving ? 'Saving…' : (isCreate ? 'Create Report' : 'Save Changes')}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
