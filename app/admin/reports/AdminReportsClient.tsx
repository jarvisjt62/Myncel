'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface WorkOrder {
  id: string;
  woNumber: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  laborCost: number | null;
  partsCost: number | null;
  totalCost: number | null;
  completedAt: string | null;
  createdAt: string;
  organizationId?: string;
}

interface Machine {
  id: string;
  name: string;
  status: string;
  criticality: string;
}

interface Organization {
  id: string;
  name: string;
  plan: string;
  machines: Machine[];
  workOrders: WorkOrder[];
  _count: { machines: number; workOrders: number; users: number };
}

const REFRESH_MS = 15_000; // 15s polling for "real-time" sync

export default function AdminReportsClient({ organizations: initialOrgs }: { organizations: Organization[] }) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrgs);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');

  // Selection / bulk state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkOrder>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewingWo, setViewingWo] = useState<WorkOrder | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  // Search filter
  const [search, setSearch] = useState('');

  // ── Real-time sync via background polling ───────────────────────────────
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reports/snapshot', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.organizations)) {
          setOrganizations(data.organizations);
          setLastSyncedAt(new Date());
        }
      }
    } catch (e) {
      // Silent fail; user can manually refresh
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      return;
    }
    refreshTimer.current = setInterval(refresh, REFRESH_MS);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [autoRefresh, refresh]);

  // Re-fetch when window regains focus so the dashboard is always current
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const selectedOrgs = selectedOrgId === 'all' ? organizations : organizations.filter(o => o.id === selectedOrgId);
  const allWOs = selectedOrgs.flatMap(o => o.workOrders.map(w => ({ ...w, organizationId: o.id, _orgName: o.name })));
  const allMachines = selectedOrgs.flatMap(o => o.machines);

  const filteredWOs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allWOs;
    return allWOs.filter(wo =>
      wo.woNumber?.toLowerCase().includes(q) ||
      wo.title?.toLowerCase().includes(q) ||
      wo.status?.toLowerCase().includes(q) ||
      (wo as any)._orgName?.toLowerCase().includes(q)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, allWOs.length, selectedOrgId, organizations]);

  const totalCost = allWOs.reduce((s, wo) => s + (wo.totalCost ?? 0), 0);
  const laborCost = allWOs.reduce((s, wo) => s + (wo.laborCost ?? 0), 0);
  const partsCost = allWOs.reduce((s, wo) => s + (wo.partsCost ?? 0), 0);
  const completionRate = allWOs.length > 0
    ? Math.round((allWOs.filter(wo => wo.status === 'COMPLETED').length / allWOs.length) * 100)
    : 0;

  const colorMap: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#635bff', LOW: '#94a3b8' };

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllVisible = () => {
    setSelected(prev => {
      const allSelected = filteredWOs.length > 0 && filteredWOs.every(w => prev.has(w.id));
      if (allSelected) return new Set();
      return new Set(filteredWOs.map(w => w.id));
    });
  };
  const clearSelection = () => setSelected(new Set());

  // ── Single-record delete ─────────────────────────────────────────────────
  const deleteOne = async (id: string, label: string) => {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Optimistic local state update
        setOrganizations(prev => prev.map(o => ({ ...o, workOrders: o.workOrders.filter(w => w.id !== id) })));
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        setToast({ type: 'success', text: `Deleted ${label}.` });
        // Sync from server
        refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setToast({ type: 'error', text: d.error || 'Delete failed' });
      }
    } catch (e) {
      setToast({ type: 'error', text: 'Network error during delete' });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // ── Bulk delete ──────────────────────────────────────────────────────────
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} record${selected.size === 1 ? '' : 's'} across ALL selected organizations? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/reports/bulk-delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const deletedIds = new Set(Array.from(selected));
        setOrganizations(prev => prev.map(o => ({ ...o, workOrders: o.workOrders.filter(w => !deletedIds.has(w.id)) })));
        setSelected(new Set());
        setToast({
          type: 'success',
          text: `Deleted ${data.deleted} record${data.deleted === 1 ? '' : 's'}${data.skipped ? ` (${data.skipped} skipped)` : ''}.`,
        });
        refresh();
      } else {
        setToast({ type: 'error', text: data.error || 'Bulk delete failed' });
      }
    } catch (e) {
      setToast({ type: 'error', text: 'Network error during bulk delete' });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // ── Edit modal ───────────────────────────────────────────────────────────
  const openEdit = (wo: WorkOrder) => {
    setEditingWo(wo);
    setEditForm({
      title: wo.title,
      status: wo.status,
      priority: wo.priority,
      type: wo.type,
      laborCost: wo.laborCost ?? 0,
      partsCost: wo.partsCost ?? 0,
      totalCost: wo.totalCost ?? 0,
    });
  };
  const saveEdit = async () => {
    if (!editingWo) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/reports/${editingWo.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrganizations(prev => prev.map(o => ({
          ...o,
          workOrders: o.workOrders.map(w => w.id === editingWo.id ? { ...w, ...updated.workOrder } : w),
        })));
        setEditingWo(null);
        setToast({ type: 'success', text: `Updated ${editingWo.woNumber}` });
        refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setToast({ type: 'error', text: d.error || 'Update failed' });
      }
    } catch (e) {
      setToast({ type: 'error', text: 'Network error during update' });
    } finally {
      setSavingEdit(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Maintenance costs, work order stats and equipment health across all organizations.
          </p>
          <p className="text-[11px] mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {autoRefresh ? `Live · synced ${lastSyncedAt.toLocaleTimeString()}` : 'Auto-refresh paused'}
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className="underline hover:no-underline ml-1"
            >
              {autoRefresh ? 'pause' : 'resume'}
            </button>
            <button onClick={refresh} className="underline hover:no-underline">refresh now</button>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ backgroundColor: 'rgba(99,91,255,0.08)', color: '#635bff', border: '1px solid rgba(99,91,255,0.25)' }}>
          Admin Mode
        </div>
      </div>

      {/* Org filter */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Filter by Organization</label>
        <select
          value={selectedOrgId}
          onChange={e => { setSelectedOrgId(e.target.value); clearSelection(); }}
          className="w-full sm:w-80 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 appearance-none"
          style={{
            backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px',
          }}
        >
          <option value="all">All Organizations ({organizations.length})</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name} — {org._count.workOrders} WOs
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Maintenance Cost', value: `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'All work orders' },
          { label: 'Labor Cost', value: `$${laborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Total labor' },
          { label: 'Parts Cost', value: `$${partsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Total parts' },
          { label: 'Completion Rate', value: `${completionRate}%`, sub: `${allWOs.filter(wo => wo.status === 'COMPLETED').length} of ${allWOs.length} completed` },
        ].map(card => (
          <div key={card.label} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{card.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{card.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Equipment Health + WO Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Equipment Health</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Operational', count: allMachines.filter(m => m.status === 'OPERATIONAL').length, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
              { label: 'Maintenance', count: allMachines.filter(m => m.status === 'MAINTENANCE').length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              { label: 'Breakdown', count: allMachines.filter(m => m.status === 'BREAKDOWN').length, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: item.bg, border: `1px solid ${item.color}33` }}>
                <div className="text-xl font-bold" style={{ color: item.color }}>{item.count}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Work Order Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Open', count: allWOs.filter(wo => wo.status === 'OPEN').length, color: '#635bff' },
              { label: 'In Progress', count: allWOs.filter(wo => wo.status === 'IN_PROGRESS').length, color: '#0ea5e9' },
              { label: 'Completed', count: allWOs.filter(wo => wo.status === 'COMPLETED').length, color: '#10b981' },
              { label: 'Overdue', count: allWOs.filter(wo => wo.status !== 'COMPLETED' && wo.completedAt === null).length, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                <div className="text-xl font-bold" style={{ color: item.color }}>{item.count}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost by Priority */}
      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Cost by Priority</h2>
        <div className="space-y-3">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(priority => {
            const filtered = allWOs.filter(wo => wo.priority === priority);
            const cost = filtered.reduce((s, wo) => s + (wo.totalCost ?? 0), 0);
            const pct = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0;
            return (
              <div key={priority} className="flex items-center gap-3">
                <span className="text-xs font-medium w-16" style={{ color: 'var(--text-secondary)' }}>{priority}</span>
                <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colorMap[priority] || '#635bff', minWidth: filtered.length > 0 ? '8px' : '0' }} />
                </div>
                <span className="text-xs font-mono w-24 text-right" style={{ color: 'var(--text-primary)' }}>
                  ${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs w-12" style={{ color: 'var(--text-muted)' }}>{filtered.length} WOs</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Records Table — view / edit / delete each + bulk ─────────────── */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Report Records</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {selectedOrgId === 'all'
                ? `All ${filteredWOs.length} work-order record${filteredWOs.length === 1 ? '' : 's'} across every organization.`
                : `${filteredWOs.length} record${filteredWOs.length === 1 ? '' : 's'} in the selected organization.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search WO #, title, org…"
              className="rounded-lg px-3 py-2 text-sm w-56"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#635bff]/10 border border-[#635bff]/30">
                <span className="text-xs font-semibold text-[#635bff]">{selected.size} selected</span>
                <button onClick={clearSelection} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">clear</button>
                <button
                  onClick={bulkDelete}
                  disabled={busy}
                  className="ml-1 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? 'Deleting…' : '🗑 Bulk Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        {filteredWOs.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {search ? 'No records match your search.' : 'No work-order records to display.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                <tr>
                  <th className="px-4 py-2.5 text-left w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={filteredWOs.length > 0 && filteredWOs.every(w => selected.has(w.id))}
                      onChange={toggleAllVisible}
                      className="cursor-pointer accent-[#635bff]"
                    />
                  </th>
                  {['WO #', 'Title', 'Org', 'Status', 'Priority', 'Total', 'Completed', 'Actions'].map(h => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-semibold uppercase ${h === 'Total' || h === 'Actions' ? 'text-right' : 'text-left'}`}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredWOs.map((wo: any) => (
                  <tr
                    key={wo.id}
                    className="hover:bg-[var(--bg-surface-2)] transition-colors"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${wo.woNumber}`}
                        checked={selected.has(wo.id)}
                        onChange={() => toggleRow(wo.id)}
                        className="cursor-pointer accent-[#635bff]"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{wo.woNumber}</td>
                    <td className="px-4 py-3 font-medium max-w-[260px]" style={{ color: 'var(--text-primary)' }}>
                      <div className="truncate">{wo.title}</div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{wo._orgName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        wo.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-600' :
                        wo.status === 'IN_PROGRESS' ? 'bg-blue-500/15 text-blue-600' :
                        wo.status === 'OPEN' ? 'bg-purple-500/15 text-[#635bff]' :
                        'bg-gray-500/15 text-gray-500'
                      }`}>{wo.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{wo.priority}</td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                      {wo.totalCost != null ? `$${Number(wo.totalCost).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {wo.completedAt ? new Date(wo.completedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewingWo(wo)} title="View" aria-label={`View ${wo.woNumber}`}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[#635bff] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => openEdit(wo)} title="Edit" aria-label={`Edit ${wo.woNumber}`}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[#635bff] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteOne(wo.id, wo.woNumber)} disabled={busy} title="Delete" aria-label={`Delete ${wo.woNumber}`}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-600 transition-colors disabled:opacity-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-Organization Breakdown */}
      {selectedOrgId === 'all' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Per-Organization Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Organization', 'Plan', 'Machines', 'Work Orders', 'Completed', 'Total Cost', 'Labor', 'Parts'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => {
                  const wos = org.workOrders;
                  const tc = wos.reduce((s, w) => s + (w.totalCost ?? 0), 0);
                  const lc = wos.reduce((s, w) => s + (w.laborCost ?? 0), 0);
                  const pc = wos.reduce((s, w) => s + (w.partsCost ?? 0), 0);
                  return (
                    <tr key={org.id} className="hover:bg-[var(--bg-surface-2)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{org.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#635bff]/10 text-[#635bff]">{org.plan}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{org._count.machines}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{wos.length}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{wos.filter(w => w.status === 'COMPLETED').length}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>${tc.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>${lc.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>${pc.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── View modal ────────────────────────────────────────────────── */}
      {viewingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewingWo(null)} />
          <div className="relative rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{viewingWo.woNumber}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(viewingWo as any)._orgName}</p>
              </div>
              <button onClick={() => setViewingWo(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <Field label="Title">{viewingWo.title}</Field>
              <Field label="Status">{viewingWo.status}</Field>
              <Field label="Priority">{viewingWo.priority}</Field>
              <Field label="Type">{viewingWo.type}</Field>
              <Field label="Labor Cost">${Number(viewingWo.laborCost ?? 0).toFixed(2)}</Field>
              <Field label="Parts Cost">${Number(viewingWo.partsCost ?? 0).toFixed(2)}</Field>
              <Field label="Total Cost">${Number(viewingWo.totalCost ?? 0).toFixed(2)}</Field>
              <Field label="Created">{new Date(viewingWo.createdAt).toLocaleString()}</Field>
              <Field label="Completed">{viewingWo.completedAt ? new Date(viewingWo.completedAt).toLocaleString() : 'Not completed'}</Field>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ────────────────────────────────────────────────── */}
      {editingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingWo(null)} />
          <div className="relative rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Edit {editingWo.woNumber}</h3>
              <button onClick={() => setEditingWo(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Input label="Title" value={editForm.title || ''} onChange={v => setEditForm(f => ({ ...f, title: v }))} />
              <SelectInput label="Status" value={editForm.status || ''} onChange={v => setEditForm(f => ({ ...f, status: v }))}
                options={['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']} />
              <SelectInput label="Priority" value={editForm.priority || ''} onChange={v => setEditForm(f => ({ ...f, priority: v }))}
                options={['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']} />
              <Input label="Type" value={editForm.type || ''} onChange={v => setEditForm(f => ({ ...f, type: v }))} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Labor $" type="number" value={String(editForm.laborCost ?? '')} onChange={v => setEditForm(f => ({ ...f, laborCost: Number(v) || 0 }))} />
                <Input label="Parts $" type="number" value={String(editForm.partsCost ?? '')} onChange={v => setEditForm(f => ({ ...f, partsCost: Number(v) || 0 }))} />
                <Input label="Total $" type="number" value={String(editForm.totalCost ?? '')} onChange={v => setEditForm(f => ({ ...f, totalCost: Number(v) || 0 }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingWo(null)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
                <button onClick={saveEdit} disabled={savingEdit} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[70] px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-baseline">
      <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="col-span-2" style={{ color: 'var(--text-primary)' }}>{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40"
        style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/40"
        style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
