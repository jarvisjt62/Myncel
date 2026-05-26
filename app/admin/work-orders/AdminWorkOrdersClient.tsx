'use client';

import { useState } from 'react';
import { formatCurrency } from '@/app/lib/currency';

interface WorkOrder {
  id: string;
  woNumber: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  laborCost: number | null;
  partsCost: number | null;
  totalCost?: number | null;
  currency?: string | null;
  notes: string | null;
  machine?: { name: string } | null;
  organization?: { name: string; plan: string; currency?: string } | null;
  assignedTo?: { name: string } | null;
  createdBy?: { name: string } | null;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PENDING_APPROVAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ON_HOLD: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const priorityColors: Record<string, string> = {
  CRITICAL: 'text-red-400',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-emerald-400',
};

const STATUS_FLOW = ['OPEN', 'PENDING_APPROVAL', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const TYPES = ['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'PROJECT'];
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const inputClass = 'w-full bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#635bff]';
const labelClass = 'block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1';

export default function AdminWorkOrdersClient({ workOrders: initial }: { workOrders: WorkOrder[] }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initial);
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterOrg, setFilterOrg] = useState('ALL');

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const orgList = Array.from(new Set(workOrders.map(wo => wo.organization?.name || '—'))).sort();

  const filtered = workOrders.filter(wo => {
    const matchSearch =
      wo.title.toLowerCase().includes(search.toLowerCase()) ||
      wo.woNumber.toLowerCase().includes(search.toLowerCase()) ||
      (wo.organization?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (wo.machine?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || wo.status === filterStatus;
    const matchPriority = filterPriority === 'ALL' || wo.priority === filterPriority;
    const matchOrg = filterOrg === 'ALL' || (wo.organization?.name || '—') === filterOrg;
    return matchSearch && matchStatus && matchPriority && matchOrg;
  });

  const openDetail = async (wo: WorkOrder) => {
    setSelected(wo);
    setDetail(null);
    setEditMode(false);
    setSaveError('');
    setSaveSuccess('');
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/work-orders/${wo.id}`);
      if (res.ok) setDetail(await res.json());
    } catch { /* use basic data */ }
    setLoadingDetail(false);
  };

  const openEdit = (wo: WorkOrder) => {
    setSelected(wo);
    setEditMode(true);
    setSaveError('');
    setSaveSuccess('');
    setEditForm({
      title: wo.title,
      description: wo.description || '',
      type: wo.type,
      status: wo.status,
      priority: wo.priority,
      dueAt: wo.dueAt ? wo.dueAt.slice(0, 10) : '',
      estimatedMinutes: wo.estimatedMinutes ?? '',
      actualMinutes: wo.actualMinutes ?? '',
      laborCost: wo.laborCost ?? '',
      partsCost: wo.partsCost ?? '',
      notes: wo.notes || '',
    });
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const payload: any = {
        title: editForm.title,
        description: editForm.description || null,
        type: editForm.type,
        status: editForm.status,
        priority: editForm.priority,
        dueAt: editForm.dueAt || null,
        notes: editForm.notes || null,
      };
      if (editForm.estimatedMinutes !== '') payload.estimatedMinutes = parseInt(editForm.estimatedMinutes);
      if (editForm.actualMinutes !== '') payload.actualMinutes = parseInt(editForm.actualMinutes);
      if (editForm.laborCost !== '') payload.laborCost = parseFloat(editForm.laborCost);
      if (editForm.partsCost !== '') payload.partsCost = parseFloat(editForm.partsCost);

      const res = await fetch(`/api/work-orders/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        const updatedWo = updated.workOrder;
        setWorkOrders(prev => prev.map(w => w.id === selected.id ? { ...w, ...updatedWo, dueAt: updatedWo.dueAt ?? null, completedAt: updatedWo.completedAt ?? null } : w));
        setSelected(prev => prev ? { ...prev, ...updatedWo } : prev);
        setDetail(null);
        // If the server parked the WO in PENDING_APPROVAL, surface the policy.
        if (updated.approvalRequest) {
          setSaveSuccess(updated.message || `Approval required (${updated.approvalRequest.policyName}). Step ${updated.approvalRequest.currentStepOrder} of ${updated.approvalRequest.totalSteps}.`);
        } else {
          setSaveSuccess('Work order updated successfully!');
        }
        setEditMode(false);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to update work order');
      }
    } catch {
      setSaveError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const deleteWo = async (woId: string) => {
    setDeletingId(woId);
    try {
      const res = await fetch(`/api/work-orders/${woId}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkOrders(prev => prev.filter(w => w.id !== woId));
        setConfirmDelete(null);
        setSelected(null);
        setDetail(null);
      }
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  const totalOpen = workOrders.filter(w => w.status === 'OPEN').length;
  const totalInProgress = workOrders.filter(w => w.status === 'IN_PROGRESS').length;
  const totalCompleted = workOrders.filter(w => w.status === 'COMPLETED').length;
  const totalOverdue = workOrders.filter(w => w.dueAt && new Date(w.dueAt) < new Date() && w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length;

  const wo = detail || selected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Work Orders</h1>
          <p className="text-[var(--text-secondary)] mt-1">{workOrders.length} work orders across all organizations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#635bff]">
            <option value="ALL">All Statuses</option>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#635bff]">
            <option value="ALL">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
            className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#635bff]">
            <option value="ALL">All Organizations</option>
            {orgList.map(org => <option key={org} value={org}>{org}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#635bff] w-48" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Open', value: totalOpen, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20', filter: 'OPEN' },
          { label: 'In Progress', value: totalInProgress, color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20', filter: 'IN_PROGRESS' },
          { label: 'Completed', value: totalCompleted, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', filter: 'COMPLETED' },
          { label: 'Overdue', value: totalOverdue, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20', filter: 'ALL' },
        ].map((stat) => (
          <div key={stat.label} onClick={() => setFilterStatus(stat.filter)}
            className={`${stat.bg} border rounded-xl p-4 cursor-pointer hover:opacity-80 transition-opacity`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[var(--text-secondary)] text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">WO #</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Organization</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Machine</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Priority</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Assigned To</th>
                <th className="text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Due Date</th>
                <th className="text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {filtered.map((wo) => {
                const isOverdue = wo.dueAt && new Date(wo.dueAt) < new Date() && wo.status !== 'COMPLETED' && wo.status !== 'CANCELLED';
                return (
                  <tr key={wo.id} className="hover:bg-[var(--bg-hover)]/50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className="text-[#635bff] text-xs font-mono font-semibold">{wo.woNumber}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <p className="text-sm font-medium max-w-[200px] truncate">{wo.title}</p>
                      <p className="text-[var(--text-secondary)] text-xs">{wo.type}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <p className="text-sm">{wo.organization?.name || '—'}</p>
                      <p className="text-[var(--text-secondary)] text-xs">{wo.organization?.plan}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className="text-[var(--text-secondary)] text-sm">{wo.machine?.name || '—'}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[wo.status]}`}>
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className={`text-sm font-semibold ${priorityColors[wo.priority]}`}>{wo.priority}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span className="text-[var(--text-secondary)] text-sm">{wo.assignedTo?.name || 'Unassigned'}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {wo.dueAt ? (
                        <span className={`text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-[var(--text-secondary)]'}`}>
                          {isOverdue ? '⚠ ' : ''}{new Date(wo.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ) : <span className="text-[var(--text-secondary)] text-sm">—</span>}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDetail(wo)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-[var(--bg-hover)] transition-colors">View</button>
                        <button onClick={() => openEdit(wo)} className="text-xs text-[#635bff] hover:text-[#4f46e5] px-2 py-1 rounded hover:bg-[#635bff]/10 transition-colors font-semibold">Edit</button>
                        <button onClick={() => setConfirmDelete(wo)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-[var(--text-secondary)]">No work orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Work Order Detail / Edit Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setSelected(null); setDetail(null); setEditMode(false); setSaveError(''); setSaveSuccess(''); }} />
          <div className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div>
                <p className="text-xs font-mono text-[#635bff] mb-1">{selected.woNumber}</p>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{editMode ? 'Edit Work Order' : selected.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button onClick={() => openEdit(selected)} className="text-xs bg-[#635bff] text-white px-3 py-1.5 rounded-lg hover:bg-[#4f46e5] font-semibold transition-colors">
                    ✏️ Edit
                  </button>
                )}
                <button onClick={() => { setSelected(null); setDetail(null); setEditMode(false); setSaveError(''); setSaveSuccess(''); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {loadingDetail && !editMode && <p className="text-sm text-[var(--text-secondary)] animate-pulse">Loading details…</p>}
              {saveSuccess && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2 text-sm text-emerald-400">{saveSuccess}</div>}
              {saveError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">{saveError}</div>}

              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Title *</label>
                      <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className={inputClass} placeholder="Work order title" />
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className={inputClass}>
                        {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Priority</label>
                      <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className={inputClass}>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className={inputClass}>
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Due Date</label>
                      <input type="date" value={editForm.dueAt} onChange={e => setEditForm({ ...editForm, dueAt: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Est. Duration (min)</label>
                      <input type="number" value={editForm.estimatedMinutes} onChange={e => setEditForm({ ...editForm, estimatedMinutes: e.target.value })} className={inputClass} placeholder="e.g. 60" min="0" />
                    </div>
                    <div>
                      <label className={labelClass}>Actual Duration (min)</label>
                      <input type="number" value={editForm.actualMinutes} onChange={e => setEditForm({ ...editForm, actualMinutes: e.target.value })} className={inputClass} placeholder="e.g. 75" min="0" />
                    </div>
                    <div>
                      <label className={labelClass}>Labor Cost ($)</label>
                      <input type="number" value={editForm.laborCost} onChange={e => setEditForm({ ...editForm, laborCost: e.target.value })} className={inputClass} placeholder="0.00" min="0" step="0.01" />
                    </div>
                    <div>
                      <label className={labelClass}>Parts Cost ($)</label>
                      <input type="number" value={editForm.partsCost} onChange={e => setEditForm({ ...editForm, partsCost: e.target.value })} className={inputClass} placeholder="0.00" min="0" step="0.01" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Description</label>
                      <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} className={inputClass} placeholder="Work order description..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Notes</label>
                      <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className={inputClass} placeholder="Internal notes..." />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setEditMode(false); setSaveError(''); }} className="flex-1 px-4 py-2 border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancel</button>
                    <button onClick={saveEdit} disabled={saving || !editForm.title?.trim()} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { label: 'Status', value: <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[selected.status]}`}>{selected.status.replace('_', ' ')}</span> },
                      { label: 'Priority', value: <span className={`font-semibold ${priorityColors[selected.priority]}`}>{selected.priority}</span> },
                      { label: 'Type', value: wo?.type },
                      { label: 'Machine', value: wo?.machine?.name || selected.machine?.name },
                      { label: 'Organization', value: wo?.organization?.name || selected.organization?.name },
                      { label: 'Assigned To', value: wo?.assignedTo?.name || selected.assignedTo?.name || 'Unassigned' },
                      { label: 'Created By', value: wo?.createdBy?.name || selected.createdBy?.name },
                      { label: 'Due Date', value: selected.dueAt ? new Date(selected.dueAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No due date' },
                      { label: 'Completed', value: selected.completedAt ? new Date(selected.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not completed' },
                      { label: 'Est. Minutes', value: selected.estimatedMinutes ? `${selected.estimatedMinutes} min` : '—' },
                      { label: 'Actual Minutes', value: selected.actualMinutes ? `${selected.actualMinutes} min` : '—' },
                      { label: 'Labor Cost', value: selected.laborCost != null ? formatCurrency(Number(selected.laborCost), selected.currency || selected.organization?.currency || 'USD') : '—' },
                      { label: 'Parts Cost', value: selected.partsCost != null ? formatCurrency(Number(selected.partsCost), selected.currency || selected.organization?.currency || 'USD') : '—' },
                    ] as { label: string; value: any }[]).map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-[var(--text-primary)] mt-0.5">{value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  {(wo?.description || selected.description) && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-hover)] rounded-lg p-3">{wo?.description || selected.description}</p>
                    </div>
                  )}
                  {(wo?.notes || selected.notes) && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-hover)] rounded-lg p-3">{wo?.notes || selected.notes}</p>
                    </div>
                  )}
                  <div className="flex justify-between pt-2">
                    <button onClick={() => setConfirmDelete(selected)} className="px-4 py-2 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10">🗑 Delete</button>
                    <button onClick={() => { setSelected(null); setDetail(null); }} className="px-4 py-2 text-sm text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]">Close</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Work Order?</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Delete <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.title}</strong>? This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancel</button>
                <button onClick={() => deleteWo(confirmDelete.id)} disabled={!!deletingId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  {deletingId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}