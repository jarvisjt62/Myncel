'use client';

import React, { useEffect, useState, useCallback } from 'react';

/**
 * Admin → Login Activity
 *
 * Super-admin observability page for sign-in events.
 *
 *   - Successful logins (action='LOGIN' in AuditLog)
 *   - Failed logins   (action='LOGIN_FAILED')
 *   - Per-row: email, date/time, IP address, geo (city/region/country),
 *     device (parsed from user-agent), and failure reason if applicable.
 *
 * Backed by:  GET /api/admin/login-activity?page=1&pageSize=50&email=&status=all|success|failed
 */

interface LoginRow {
  id: string;
  action: 'LOGIN' | 'LOGIN_FAILED';
  success: boolean;
  email: string | null;
  userName: string | null;
  userId: string | null;
  organizationName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  geo: {
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    isp?: string;
  } | null;
  reason: string | null;
  createdAt: string;
}

interface ApiResponse {
  rows: LoginRow[];
  page: number;
  pageSize: number;
  total: number | null;
  hasMore: boolean;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function formatGeo(g: LoginRow['geo']): string {
  if (!g) return '—';
  const parts = [g.city, g.region, g.country].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

/**
 * Coarse user-agent → device label parser. Good enough for an admin table.
 * No external dependency.
 */
function parseDevice(ua: string | null): string {
  if (!ua) return '—';
  const lower = ua.toLowerCase();

  // Myncel native apps first
  if (lower.includes('myncelapp')) {
    if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios'))
      return 'Myncel iOS App';
    if (lower.includes('android')) return 'Myncel Android App';
    return 'Myncel App';
  }

  // OS
  let os = '';
  if (lower.includes('iphone'))         os = 'iPhone';
  else if (lower.includes('ipad'))      os = 'iPad';
  else if (lower.includes('android'))   os = 'Android';
  else if (lower.includes('windows'))   os = 'Windows';
  else if (lower.includes('mac os') || lower.includes('macintosh')) os = 'macOS';
  else if (lower.includes('linux'))     os = 'Linux';

  // Browser
  let browser = '';
  if (lower.includes('edg/'))           browser = 'Edge';
  else if (lower.includes('chrome/') && !lower.includes('edg/')) browser = 'Chrome';
  else if (lower.includes('firefox/'))  browser = 'Firefox';
  else if (lower.includes('safari/') && !lower.includes('chrome/')) browser = 'Safari';

  return [os, browser].filter(Boolean).join(' · ') || ua.slice(0, 40);
}

const REASON_LABEL: Record<string, string> = {
  missing_credentials: 'Missing credentials',
  captcha_failed:      'CAPTCHA failed',
  no_account:          'No such account',
  wrong_password:      'Wrong password',
  pending_deletion:    'Account pending deletion',
  email_not_verified:  'Email not verified',
};

export default function LoginActivityPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewingRow, setViewingRow] = useState<LoginRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState('');

  async function deleteRow(id: string) {
    if (!confirm('Delete this login event from the log?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/login-activity/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Failed: ${j.error || res.status}`);
      } else {
        await refresh();
      }
    } catch (e: any) {
      alert(`Failed: ${e?.message || 'Network error'}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAll() {
    if (confirmDeleteAll.trim().toUpperCase() !== 'DELETE ALL') {
      alert('Type DELETE ALL exactly to confirm.');
      return;
    }
    setDeletingAll(true);
    try {
      const res = await fetch('/api/admin/login-activity/delete?all=1', { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Failed: ${json.error || res.status}`);
      } else {
        alert(`Deleted ${json.deletedCount} login event(s).`);
        setShowDeleteAllModal(false);
        setConfirmDeleteAll('');
        await refresh();
      }
    } catch (e: any) {
      alert(`Failed: ${e?.message || 'Network error'}`);
    } finally {
      setDeletingAll(false);
    }
  }

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: statusFilter,
      });
      if (emailFilter.trim()) params.set('email', emailFilter.trim());

      const res = await fetch(`/api/admin/login-activity?${params}`, { cache: 'no-store' });
      if (res.status === 401) { setError('Not signed in.'); return; }
      if (res.status === 403) { setError('Super-admin only.'); return; }
      if (!res.ok) { setError(`HTTP ${res.status}`); return; }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, emailFilter]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [autoRefresh, refresh]);

  const totalPages = data?.total != null ? Math.max(1, Math.ceil(data.total / pageSize)) : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>🕒 Login Activity</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign-in events across all users — date, time, IP address, location, device. Failed attempts shown in red.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-refresh (15s)
          </label>
          {data && data.rows.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            >
              🗑 Delete all login events
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl p-4 border grid md:grid-cols-4 gap-3"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email contains</label>
          <input
            type="text"
            value={emailFilter}
            onChange={e => { setEmailFilter(e.target.value); setPage(1); }}
            placeholder="e.g. @yahoo.com"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <option value="all">All events</option>
            <option value="success">Successful only</option>
            <option value="failed">Failed only</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => { setPage(1); refresh(); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Refresh
          </button>
          <button
            onClick={() => { setEmailFilter(''); setStatusFilter('all'); setPage(1); }}
            className="px-3 py-2 rounded-lg text-sm border"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            Clear
          </button>
        </div>
        <div className="text-xs flex items-end" style={{ color: 'var(--text-muted)' }}>
          {data?.total != null
            ? <>Total events: <strong>{data.total.toLocaleString()}</strong></>
            : data
              ? <>Showing {data.rows.length} filtered results</>
              : null
          }
        </div>
      </section>

      {/* Table */}
      <section className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        {loading && !data ? (
          <div className="p-6 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading login events…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : !data || data.rows.length === 0 ? (
          <div className="p-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            No login events match these filters yet. (Login events have been recorded since this feature was deployed.)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                <tr className="text-left">
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Date / Time</th>
                  <th className="p-2.5">IP address</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Device</th>
                  <th className="p-2.5">Reason</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(r => (
                  <tr key={r.id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="p-2.5">
                      {r.success ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-800">
                          ✓ Success
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800">
                          ✗ Failed
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <div style={{ color: 'var(--text-primary)' }}>{r.email ?? '—'}</div>
                      {r.organizationName && (
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {r.organizationName}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 whitespace-nowrap" title={r.createdAt}>
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="p-2.5 font-mono">{r.ipAddress ?? '—'}</td>
                    <td className="p-2.5">
                      {r.geo?.countryCode && (
                        <span className="mr-1 text-[10px] font-mono px-1 rounded bg-gray-100 text-gray-700">
                          {r.geo.countryCode}
                        </span>
                      )}
                      {formatGeo(r.geo)}
                    </td>
                    <td className="p-2.5">{parseDevice(r.userAgent)}</td>
                    <td className="p-2.5" style={{ color: r.success ? 'var(--text-muted)' : '#b91c1c' }}>
                      {r.reason ? (REASON_LABEL[r.reason] ?? r.reason) : '—'}
                    </td>
                    <td className="p-2.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => setViewingRow(r)}
                        className="px-2 py-1 rounded text-[11px] mr-1 border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                      >
                        👁 View
                      </button>
                      <button
                        onClick={() => deleteRow(r.id)}
                        disabled={deletingId === r.id}
                        className="px-2 py-1 rounded text-[11px] border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === r.id ? '…' : '🗑 Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagination */}
      {data && data.rows.length > 0 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div>
            Page <strong>{data.page}</strong>{totalPages ? <> of <strong>{totalPages}</strong></> : null}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}
            >
              ← Prev
            </button>
            <button
              disabled={!data.hasMore && (totalPages != null && page >= totalPages)}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* View Login Event Modal */}
      {viewingRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setViewingRow(null)}
        >
          <div
            className="rounded-xl p-5 max-w-2xl w-full max-h-[85vh] overflow-y-auto border shadow-2xl"
            style={{ background: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-semibold text-lg" style={{ color: '#111827' }}>
                {viewingRow.success ? '✓ Successful login' : '✗ Failed login'}
              </h3>
              <button
                onClick={() => setViewingRow(null)}
                className="text-2xl leading-none hover:opacity-70"
                style={{ color: '#6b7280' }}
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Status"      value={viewingRow.success ? 'Success' : 'Failed'} />
              <Row label="Email"       value={viewingRow.email ?? '—'} />
              <Row label="User"        value={viewingRow.userName ?? '—'} />
              <Row label="User id"     value={viewingRow.userId ?? '—'} mono />
              <Row label="Organization" value={viewingRow.organizationName ?? '—'} />
              <Row label="Date / Time" value={formatDateTime(viewingRow.createdAt)} />
              <Row label="IP address"  value={viewingRow.ipAddress ?? '—'} mono />
              <Row label="Location"    value={formatGeo(viewingRow.geo)} />
              <Row label="Country code" value={viewingRow.geo?.countryCode ?? '—'} />
              <Row label="ISP"         value={viewingRow.geo?.isp ?? '—'} />
              <Row label="Device"      value={parseDevice(viewingRow.userAgent)} />
              {!viewingRow.success && (
                <Row
                  label="Failure reason"
                  value={viewingRow.reason ? (REASON_LABEL[viewingRow.reason] ?? viewingRow.reason) : '—'}
                />
              )}
              <Row label="Event id"    value={viewingRow.id} mono />

              <div className="pt-2">
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6b7280' }}>
                  Full user-agent
                </div>
                <pre className="text-[10px] p-2 rounded border overflow-x-auto whitespace-pre-wrap break-all"
                  style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}>
                  {viewingRow.userAgent ?? '—'}
                </pre>
              </div>

              {viewingRow.geo && (
                <div className="pt-2">
                  <div className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6b7280' }}>
                    Raw geo data
                  </div>
                  <pre className="text-[10px] p-2 rounded border overflow-x-auto whitespace-pre-wrap break-all"
                    style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}>
                    {JSON.stringify(viewingRow.geo, null, 2)}
                  </pre>
                </div>
              )}

              <div className="pt-3 mt-3 flex justify-end gap-2 border-t" style={{ borderColor: '#e5e7eb' }}>
                <button
                  onClick={() => setViewingRow(null)}
                  className="px-3 py-1.5 rounded-lg text-sm border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const id = viewingRow.id;
                    setViewingRow(null);
                    await deleteRow(id);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                >
                  🗑 Delete this event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete-all Confirm Modal */}
      {showDeleteAllModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => !deletingAll && setShowDeleteAllModal(false)}
        >
          <div
            className="rounded-xl p-5 max-w-md w-full border shadow-2xl"
            style={{ background: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2 text-red-700">⚠️ Delete ALL login events?</h3>
            <p className="text-sm mb-3" style={{ color: '#374151' }}>
              This will remove <strong>every</strong> recorded login event (successful and failed) from the
              audit log{data?.total != null ? <> — currently <strong>{data.total.toLocaleString()}</strong> event{data.total === 1 ? '' : 's'}</> : null}.
              User accounts are <strong>not</strong> affected.
            </p>
            <p className="text-xs mb-3" style={{ color: '#6b7280' }}>
              Type <code className="font-bold">DELETE ALL</code> below to confirm:
            </p>
            <input
              type="text"
              value={confirmDeleteAll}
              onChange={e => setConfirmDeleteAll(e.target.value)}
              placeholder="DELETE ALL"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border text-sm font-mono mb-3"
              style={{ background: '#ffffff', borderColor: '#d1d5db', color: '#111827' }}
            />
            <div className="flex justify-end gap-2">
              <button
                disabled={deletingAll}
                onClick={() => { setShowDeleteAllModal(false); setConfirmDeleteAll(''); }}
                className="px-3 py-1.5 rounded-lg text-sm border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deletingAll || confirmDeleteAll.trim().toUpperCase() !== 'DELETE ALL'}
                onClick={deleteAll}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-red-600 text-white border-red-700 hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAll ? 'Deleting…' : '🗑 Delete all'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="text-xs uppercase tracking-wide w-32 flex-shrink-0 pt-0.5" style={{ color: '#6b7280' }}>
        {label}
      </div>
      <div className={`flex-1 ${mono ? 'font-mono text-xs break-all' : ''}`} style={{ color: '#111827' }}>
        {value}
      </div>
    </div>
  );
}
