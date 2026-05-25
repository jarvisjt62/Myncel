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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
          Auto-refresh (15s)
        </label>
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
                  <th className="p-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(r => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
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
                        <td className="p-2.5">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs underline"
                          >
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: 'var(--surface-2)' }}>
                          <td colSpan={8} className="p-3">
                            <div className="grid md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Full user-agent</strong>
                                <pre className="mt-1 p-2 rounded border overflow-x-auto whitespace-pre-wrap break-all"
                                  style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                  {r.userAgent ?? '—'}
                                </pre>
                              </div>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Geo + ISP</strong>
                                <pre className="mt-1 p-2 rounded border overflow-x-auto"
                                  style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                  {JSON.stringify(r.geo, null, 2)}
                                </pre>
                                <div className="mt-2" style={{ color: 'var(--text-muted)' }}>
                                  Audit log id: <code>{r.id}</code>
                                  {r.userId && <> · user id: <code>{r.userId}</code></>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
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
    </div>
  );
}
