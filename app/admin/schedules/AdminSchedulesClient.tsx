'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type Schedule = {
  id: string;
  title: string;
  description: string | null;
  taskType: string;
  frequency: string;
  intervalDays: number | null;
  estimatedMinutes: number | null;
  priority: string;
  isActive: boolean;
  nextDueAt: string | null;
  lastCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  machine: { name: string } | null;
  organization: { name: string; plan: string } | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  LOW: 'bg-green-100 text-green-700 border border-green-200',
};

const TYPE_COLORS: Record<string, string> = {
  PREVENTIVE: 'bg-blue-100 text-blue-700 border border-blue-200',
  PREDICTIVE: 'bg-purple-100 text-purple-700 border border-purple-200',
  CORRECTIVE: 'bg-red-100 text-red-700 border border-red-200',
  INSPECTION: 'bg-teal-100 text-teal-700 border border-teal-200',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isOverdue(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

export default function AdminSchedulesClient({ tasks }: { tasks: Schedule[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterOrg, setFilterOrg] = useState('');

  const orgList = useMemo(() => Array.from(new Set(tasks.map(t => t.organization?.name || '—'))).sort(), [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.machine?.name.toLowerCase().includes(q) &&
          !t.organization?.name.toLowerCase().includes(q)
        ) return false;
      }
      if (filterType && t.taskType !== filterType) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterFrequency && t.frequency !== filterFrequency) return false;
      if (filterActive === 'active' && !t.isActive) return false;
      if (filterActive === 'inactive' && t.isActive) return false;
      if (filterOrg && (t.organization?.name || '—') !== filterOrg) return false;
      return true;
    });
  }, [tasks, search, filterType, filterPriority, filterFrequency, filterActive, filterOrg]);

  function openView(t: Schedule) {
    setSelected(t);
    setEditMode(false);
    setSaveError('');
    setSaveSuccess('');
    setDeleteConfirm(false);
    setDeleteError('');
  }

  function openEdit(t: Schedule) {
    setSelected(t);
    setEditMode(true);
    setSaveError('');
    setSaveSuccess('');
    setDeleteConfirm(false);
    setDeleteError('');
    setEditForm({
      title: t.title,
      description: t.description || '',
      taskType: t.taskType,
      frequency: t.frequency,
      priority: t.priority,
      isActive: t.isActive,
      nextDueAt: t.nextDueAt ? t.nextDueAt.slice(0, 10) : '',
      estimatedMinutes: t.estimatedMinutes?.toString() ?? '',
      intervalDays: t.intervalDays?.toString() ?? '',
    });
  }

  function closeModal() {
    setSelected(null);
    setEditMode(false);
    setSaveError('');
    setSaveSuccess('');
    setDeleteConfirm(false);
    setDeleteError('');
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await fetch(`/api/maintenance-tasks/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          taskType: editForm.taskType,
          frequency: editForm.frequency,
          priority: editForm.priority,
          isActive: editForm.isActive,
          nextDueAt: editForm.nextDueAt || null,
          estimatedMinutes: editForm.estimatedMinutes !== '' ? Number(editForm.estimatedMinutes) : null,
          intervalDays: editForm.intervalDays !== '' ? Number(editForm.intervalDays) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save');
      } else {
        setSaveSuccess('Schedule updated successfully!');
        setEditMode(false);
        router.refresh();
        // Update selected with new data
        setSelected({ ...selected, ...editForm,
          estimatedMinutes: editForm.estimatedMinutes !== '' ? Number(editForm.estimatedMinutes) : null,
          intervalDays: editForm.intervalDays !== '' ? Number(editForm.intervalDays) : null,
          nextDueAt: editForm.nextDueAt ? new Date(editForm.nextDueAt).toISOString() : null,
        });
      }
    } catch (e: any) {
      setSaveError(e.message || 'Network error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask() {
    if (!selected) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/maintenance-tasks/${selected.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete');
        setDeleting(false);
      } else {
        closeModal();
        router.refresh();
      }
    } catch (e: any) {
      setDeleteError(e.message || 'Network error');
      setDeleting(false);
    }
  }

  // Stats
  const totalActive = tasks.filter(t => t.isActive).length;
  const totalOverdue = tasks.filter(t => isOverdue(t.nextDueAt) && t.isActive).length;
  const totalInactive = tasks.filter(t => !t.isActive).length;

  return (
    <div className="min-h-screen [background:var(--bg-base)] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Maintenance Schedules</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">All scheduled maintenance tasks across all organizations</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4 [background:var(--bg-surface)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Total Schedules</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{tasks.length}</p>
        </div>
        <div className="rounded-xl p-4 [background:var(--bg-surface)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Active</p>
          <p className="text-2xl font-bold text-green-500">{totalActive}</p>
        </div>
        <div className="rounded-xl p-4 [background:var(--bg-surface)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-500">{totalOverdue}</p>
        </div>
        <div className="rounded-xl p-4 [background:var(--bg-surface)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Inactive</p>
          <p className="text-2xl font-bold text-[var(--text-muted)]">{totalInactive}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by title, machine, org..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none">
          <option value="">All Types</option>
          <option>PREVENTIVE</option>
          <option>PREDICTIVE</option>
          <option>CORRECTIVE</option>
          <option>INSPECTION</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none">
          <option value="">All Priorities</option>
          <option>CRITICAL</option>
          <option>HIGH</option>
          <option>MEDIUM</option>
          <option>LOW</option>
        </select>
        <select value={filterFrequency} onChange={e => setFilterFrequency(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none">
          <option value="">All Frequencies</option>
          <option>DAILY</option>
          <option>WEEKLY</option>
          <option>BIWEEKLY</option>
          <option>MONTHLY</option>
          <option>QUARTERLY</option>
          <option>BIANNUAL</option>
          <option>ANNUAL</option>
          <option>CUSTOM</option>
          <option>BY_HOURS</option>
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none">
          <option value="">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none">
          <option value="">All Organizations</option>
          {orgList.map(org => <option key={org} value={org}>{org}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] [background:var(--bg-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-base)]">
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Machine</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Frequency</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Next Due</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[var(--text-muted)]">
                    No schedules found
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr key={t.id} className={`border-b border-[var(--border)] hover:bg-[var(--bg-base)] transition-colors ${i % 2 === 0 ? '' : 'bg-[var(--bg-base)]/30'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)] max-w-[200px] truncate">{t.title}</div>
                      {t.description && <div className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{t.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[var(--text-primary)]">{t.organization?.name ?? '—'}</div>
                      {t.organization?.plan && (
                        <span className="text-xs text-[var(--text-muted)]">{t.organization.plan}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{t.machine?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[t.taskType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {t.taskType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)] text-xs">{t.frequency}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.nextDueAt ? (
                        <span className={isOverdue(t.nextDueAt) && t.isActive ? 'text-red-500 font-semibold' : 'text-[var(--text-primary)]'}>
                          {formatDate(t.nextDueAt)}
                          {isOverdue(t.nextDueAt) && t.isActive && <span className="ml-1 text-xs">⚠️</span>}
                        </span>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openView(t)}
                          className="text-xs px-2 py-1 rounded bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors">
                          View
                        </button>
                        <button onClick={() => openEdit(t)}
                          className="text-xs px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors">
                          Edit
                        </button>
                        <button onClick={() => { openView(t); setDeleteConfirm(true); }}
                          className="text-xs px-2 py-1 rounded bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          Showing {filtered.length} of {tasks.length} schedules
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 [background:var(--bg-surface)] z-10">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {editMode ? '✏️ Edit Schedule' : '📅 Schedule Details'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{selected.organization?.name}</p>
              </div>
              <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Success / Error messages */}
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{saveSuccess}</div>
              )}
              {saveError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{saveError}</div>
              )}
              {deleteError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{deleteError}</div>
              )}

              {editMode ? (
                /* ---- EDIT FORM ---- */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Title *</label>
<input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Task Type</label>
                      <select
                        value={editForm.taskType}
                        onChange={e => setEditForm((f: any) => ({ ...f, taskType: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none">
                        <option>PREVENTIVE</option>
                        <option>PREDICTIVE</option>
                        <option>CORRECTIVE</option>
                        <option>INSPECTION</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Priority</label>
                      <select
                        value={editForm.priority}
                        onChange={e => setEditForm((f: any) => ({ ...f, priority: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none">
                        <option>CRITICAL</option>
                        <option>HIGH</option>
                        <option>MEDIUM</option>
                        <option>LOW</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Frequency</label>
                      <select
                        value={editForm.frequency}
                        onChange={e => setEditForm((f: any) => ({ ...f, frequency: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none">
                        <option>DAILY</option>
                        <option>WEEKLY</option>
                        <option>BIWEEKLY</option>
                        <option>MONTHLY</option>
                        <option>QUARTERLY</option>
                        <option>BIANNUAL</option>
                        <option>ANNUAL</option>
                        <option>CUSTOM</option>
                        <option>BY_HOURS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Status</label>
                      <select
                        value={editForm.isActive ? 'active' : 'inactive'}
                        onChange={e => setEditForm((f: any) => ({ ...f, isActive: e.target.value === 'active' }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Next Due Date</label>
                      <input
                        type="date"
                        value={editForm.nextDueAt}
                        onChange={e => setEditForm((f: any) => ({ ...f, nextDueAt: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Est. Duration (mins)</label>
                      <input
                        type="number"
                        value={editForm.estimatedMinutes}
                        onChange={e => setEditForm((f: any) => ({ ...f, estimatedMinutes: e.target.value }))}
                        min={0}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  {(editForm.frequency === 'CUSTOM' || editForm.frequency === 'BY_HOURS') && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Interval (days)</label>
                      <input
                        type="number"
                        value={editForm.intervalDays}
                        onChange={e => setEditForm((f: any) => ({ ...f, intervalDays: e.target.value }))}
                        min={1}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] [background:var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* ---- VIEW MODE ---- */
                <div className="space-y-4">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Task Type</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[selected.taskType] ?? ''}`}>
                        {selected.taskType}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Priority</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selected.priority] ?? ''}`}>
                        {selected.priority}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Frequency</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{selected.frequency}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Status</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selected.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {selected.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Next Due</p>
                      <p className={`text-sm font-medium ${isOverdue(selected.nextDueAt) && selected.isActive ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                        {formatDate(selected.nextDueAt)}
                        {isOverdue(selected.nextDueAt) && selected.isActive && ' ⚠️'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Last Completed</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(selected.lastCompletedAt)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Machine</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{selected.machine?.name ?? '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Est. Duration</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {selected.estimatedMinutes ? `${selected.estimatedMinutes} min` : '—'}
                      </p>
                    </div>
                    {selected.intervalDays && (
                      <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Interval Days</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{selected.intervalDays} days</p>
                      </div>
                    )}
                  </div>

                  {/* Title + Description */}
                  <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Title</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{selected.title}</p>
                  </div>
                  {selected.description && (
                    <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
                      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Description</p>
                      <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{selected.description}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-[var(--text-muted)]">
                    <p>Created: {formatDate(selected.createdAt)}</p>
                    <p>Updated: {formatDate(selected.updatedAt)}</p>
                  </div>

                  {/* Delete confirmation */}
                  {deleteConfirm && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-700 font-semibold mb-3">⚠️ Are you sure you want to delete this schedule?</p>
                      <p className="text-xs text-red-600 mb-3">This action cannot be undone. The schedule and all associated data will be permanently deleted.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={deleteTask}
                          disabled={deleting}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                          {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-base)]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-5 border-t border-[var(--border)] sticky bottom-0 [background:var(--bg-surface)]">
              {editMode ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveEdit}
                    disabled={saving || !editForm.title}
                    className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setSaveError(''); setSaveSuccess(''); }}
                    className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-base)]">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEdit(selected)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                    ✏️ Edit
                  </button>
                  {!deleteConfirm && (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-600 hover:text-white">
                      🗑️ Delete
                    </button>
                  )}
                </div>
              )}
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}