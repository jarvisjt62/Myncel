'use client';

import { useEffect, useState, useCallback } from 'react';

export type ScopeDataset = 'work_orders' | 'machines' | 'alerts' | 'parts' | 'vendors';

export interface ScopedExportModalProps {
  open: boolean;
  onClose: () => void;
  /** 'admin' shows the org dropdown; 'user' hides it and uses the caller's own org */
  mode: 'admin' | 'user';
  /** Title displayed at top of the modal (e.g. "Export to Google Sheets") */
  title: string;
  /** Short description under the title */
  description?: string;
  /** Which dataset to pick records from. If you pass multiple, we show a dataset radio. */
  datasets: ScopeDataset[];
  /** Called with the chosen scope when the user clicks the primary button */
  onConfirm: (scope: {
    targetOrgId?: string;
    targetOrgName?: string;
    dataset: ScopeDataset;
    ids: string[] | null; // null = "All records"
    allSelected: boolean;
  }) => Promise<void> | void;
  /** Label of the primary button */
  confirmLabel?: string;
  /** Whether the action is running right now */
  loading?: boolean;
}

interface Org {
  id: string;
  name: string;
  plan?: string;
  userCount?: number;
  workOrderCount?: number;
  machineCount?: number;
  alertCount?: number;
  partCount?: number;
}

interface RecordRow {
  id: string;
  label: string;
  sublabel?: string;
}

const DATASET_LABELS: Record<string, string> = {
  work_orders: 'Work Orders',
  machines: 'Machines / Equipment',
  alerts: 'Alerts',
  parts: 'Parts Inventory',
  vendors: 'Vendors',
};

export default function ScopedExportModal({
  open,
  onClose,
  mode,
  title,
  description,
  datasets,
  onConfirm,
  confirmLabel = 'Export',
  loading: externalLoading,
}: ScopedExportModalProps) {
  const [dataset, setDataset] = useState<ScopeDataset>(datasets[0]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isLoading = submitting || externalLoading;

  // Reset when opening
  useEffect(() => {
    if (open) {
      setDataset(datasets[0]);
      setSelectedIds(new Set());
      setAllSelected(true);
      setSearch('');
      setError(null);
    }
  }, [open, datasets]);

  // Load orgs (admin mode only)
  useEffect(() => {
    if (!open || mode !== 'admin') return;
    setLoadingOrgs(true);
    fetch('/api/admin/organizations')
      .then(r => r.json())
      .then(data => {
        const list: Org[] = data.organizations || [];
        setOrgs(list);
        if (list.length > 0 && !selectedOrgId) setSelectedOrgId(list[0].id);
      })
      .catch(() => setError('Failed to load organizations'))
      .finally(() => setLoadingOrgs(false));
     
  }, [open, mode]);

  // Load records whenever org or dataset changes
  const loadRecords = useCallback(async () => {
    if (!open) return;
    // vendors dataset: we don't have a generic list endpoint for it yet; treat as all-only
    if (dataset === 'vendors') {
      setRecords([]);
      return;
    }
    setLoadingRecords(true);
    setError(null);
    try {
      const url =
        mode === 'admin'
          ? `/api/admin/records?orgId=${encodeURIComponent(selectedOrgId)}&dataset=${dataset}&limit=300`
          : `/api/my/records?dataset=${dataset}&limit=300`;
      if (mode === 'admin' && !selectedOrgId) {
        setRecords([]);
        return;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load records');
      setRecords(data.records || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load records');
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, [open, mode, selectedOrgId, dataset]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const toggleId = (id: string) => {
    setAllSelected(false);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setAllSelected(true);
    setSelectedIds(new Set());
  };

  const selectNone = () => {
    setAllSelected(false);
    setSelectedIds(new Set());
  };

  const filteredRecords = records.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.label.toLowerCase().includes(q) || (r.sublabel || '').toLowerCase().includes(q);
  });

  const handleConfirm = async () => {
    if (mode === 'admin' && !selectedOrgId) {
      setError('Please select an organization');
      return;
    }
    if (!allSelected && selectedIds.size === 0 && dataset !== 'vendors') {
      setError('Select at least one record, or choose "All records"');
      return;
    }
    const org = orgs.find(o => o.id === selectedOrgId);
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({
        targetOrgId: mode === 'admin' ? selectedOrgId : undefined,
        targetOrgName: org?.name,
        dataset,
        ids: allSelected ? null : Array.from(selectedIds),
        allSelected,
      });
      // Parent closes the modal on success
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const org = orgs.find(o => o.id === selectedOrgId);
  const datasetCount =
    org && dataset === 'work_orders' ? org.workOrderCount :
    org && dataset === 'machines' ? org.machineCount :
    org && dataset === 'alerts' ? org.alertCount :
    org && dataset === 'parts' ? org.partCount :
    undefined;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-start justify-between gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {description && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Organization (admin only) */}
          {mode === 'admin' && (
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-label)' }}
              >
                Organization
              </label>
              {loadingOrgs ? (
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading organizations…</div>
              ) : (
                <select
                  value={selectedOrgId}
                  onChange={e => { setSelectedOrgId(e.target.value); setSelectedIds(new Set()); setAllSelected(true); }}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {orgs.length === 0 && <option value="">No organizations found</option>}
                  {orgs.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} — {o.userCount ?? 0} users · {o.workOrderCount ?? 0} WOs · {o.machineCount ?? 0} machines
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Dataset (only if multiple) */}
          {datasets.length > 1 && (
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: 'var(--text-label)' }}
              >
                What to export
              </label>
              <div className="flex flex-wrap gap-2">
                {datasets.map(ds => {
                  const active = dataset === ds;
                  return (
                    <button
                      key={ds}
                      onClick={() => { setDataset(ds); setSelectedIds(new Set()); setAllSelected(true); }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                      style={{
                        background: active ? '#635bff' : 'var(--bg-surface-2)',
                        color: active ? '#ffffff' : 'var(--text-secondary)',
                        borderColor: active ? '#635bff' : 'var(--border)',
                      }}
                    >
                      {DATASET_LABELS[ds]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Record picker (skip for vendors — all-only) */}
          {dataset !== 'vendors' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-label)' }}
                >
                  {DATASET_LABELS[dataset]}
                  {datasetCount !== undefined && ` (${datasetCount} total)`}
                </label>
                <div className="flex items-center gap-3 text-xs">
                  <button onClick={selectAll} className="hover:underline font-medium" style={{ color: '#635bff' }}>All records</button>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <button onClick={selectNone} className="hover:underline" style={{ color: 'var(--text-secondary)' }}>Clear</button>
                </div>
              </div>

              {/* All records selected banner */}
              {allSelected && (
                <div
                  className="mb-3 rounded-lg border px-3 py-2 text-sm font-medium flex items-center gap-2"
                  style={{
                    background: 'var(--accent-bg)',
                    borderColor: 'var(--accent-border)',
                    color: '#635bff',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  All {DATASET_LABELS[dataset].toLowerCase()} will be exported
                </div>
              )}

              {/* Search */}
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${DATASET_LABELS[dataset].toLowerCase()}…`}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] mb-2"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />

              {/* List */}
              <div
                className="border rounded-lg max-h-60 overflow-y-auto"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                }}
              >
                {loadingRecords ? (
                  <div className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Loading records…</div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                    {search ? 'No matches.' : 'No records in this organization.'}
                  </div>
                ) : (
                  <ul>
                    {filteredRecords.map((r, idx) => (
                      <li
                        key={r.id}
                        style={{
                          borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                        }}
                      >
                        <label
                          className="flex items-start gap-3 px-3 py-2 cursor-pointer transition-colors"
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <input
                            type="checkbox"
                            checked={!allSelected && selectedIds.has(r.id)}
                            onChange={() => toggleId(r.id)}
                            className="mt-1 w-4 h-4 rounded text-[#635bff] focus:ring-[#635bff]/30"
                            style={{ borderColor: 'var(--border)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.label}</p>
                            {r.sublabel && (
                              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{r.sublabel}</p>
                            )}
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!allSelected && selectedIds.size > 0 && (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {selectedIds.size} record{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {dataset === 'vendors' && (
            <div
              className="rounded-lg border px-4 py-3 text-sm"
              style={{
                background: 'var(--accent-bg)',
                borderColor: 'var(--accent-border)',
                color: '#635bff',
              }}
            >
              All vendor records for the selected organization will be synced.
            </div>
          )}

          {error && (
            <div
              className="rounded-lg border px-4 py-2.5 text-sm"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-end gap-3"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (mode === 'admin' && !selectedOrgId)}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#635bff] text-white hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
