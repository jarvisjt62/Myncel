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
        className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
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
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                Organization
              </label>
              {loadingOrgs ? (
                <div className="text-sm text-slate-400">Loading organizations…</div>
              ) : (
                <select
                  value={selectedOrgId}
                  onChange={e => { setSelectedOrgId(e.target.value); setSelectedIds(new Set()); setAllSelected(true); }}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
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
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                What to export
              </label>
              <div className="flex flex-wrap gap-2">
                {datasets.map(ds => (
                  <button
                    key={ds}
                    onClick={() => { setDataset(ds); setSelectedIds(new Set()); setAllSelected(true); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      dataset === ds
                        ? 'bg-[#635bff] text-white border-[#635bff]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-[#635bff]/50'
                    }`}
                  >
                    {DATASET_LABELS[ds]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Record picker (skip for vendors — all-only) */}
          {dataset !== 'vendors' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {DATASET_LABELS[dataset]}
                  {datasetCount !== undefined && ` (${datasetCount} total)`}
                </label>
                <div className="flex items-center gap-3 text-xs">
                  <button onClick={selectAll} className="text-[#635bff] hover:underline font-medium">All records</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={selectNone} className="text-slate-500 hover:text-slate-700 hover:underline">Clear</button>
                </div>
              </div>

              {/* All records selected banner */}
              {allSelected && (
                <div className="mb-3 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-[#635bff]/30 px-3 py-2 text-sm text-[#635bff] font-medium flex items-center gap-2">
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff] mb-2"
              />

              {/* List */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                {loadingRecords ? (
                  <div className="p-4 text-sm text-slate-400 text-center">Loading records…</div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400 text-center">
                    {search ? 'No matches.' : 'No records in this organization.'}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredRecords.map(r => (
                      <li key={r.id}>
                        <label className="flex items-start gap-3 px-3 py-2 hover:bg-white dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={!allSelected && selectedIds.has(r.id)}
                            onChange={() => toggleId(r.id)}
                            className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#635bff] focus:ring-[#635bff]/30"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.label}</p>
                            {r.sublabel && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.sublabel}</p>
                            )}
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!allSelected && selectedIds.size > 0 && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {selectedIds.size} record{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {dataset === 'vendors' && (
            <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-[#635bff]/30 px-4 py-3 text-sm text-[#635bff]">
              All vendor records for the selected organization will be synced.
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
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
