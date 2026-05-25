'use client';

import { useEffect, useState, useCallback } from 'react';
/**
 * Admin → Push Debug
 *
 * Super-admin observability page for the push notification pipeline.
 *
 *   - Configuration sanity (FCM creds, CRON_SECRET, etc.)
 *   - Registered device tokens (counts, recent registrations)
 *   - Recent push attempts with delivery outcome (sent / error / token_dead / skipped)
 *   - Recent emergency broadcasts (audit trail)
 *   - Recent cron sweeps (when did /api/cron/notifications last run?)
 *
 * Backed by:  GET  /api/admin/push-debug
 *             POST /api/admin/test-push
 */

interface DebugData {
  now: string;
  counts: {
    totalTokens: number;
    iosTokens: number;
    androidTokens: number;
    notificationsLastHour: number;
    notificationsLastDay: number;
  };
  config: Record<string, boolean | string | null>;
  fcmReady: boolean;
  tokens: Array<{
    id: string;
    platform: string;
    deviceName: string | null;
    appVersion: string | null;
    createdAt: string;
    lastUsedAt: string;
    tokenSuffix: string | null;
    user: { email: string; name: string | null; organizationId: string | null } | null;
  }>;
  recentAttempts: Array<{
    id: string;
    entityId: string | null;
    userId: string | null;
    organizationId: string | null;
    changes: any;
    createdAt: string;
  }>;
  recentEmergencies: Array<{
    id: string;
    userId: string | null;
    organizationId: string | null;
    changes: any;
    createdAt: string;
    user: { email: string; name: string | null } | null;
    organization: { name: string } | null;
  }>;
  recentCronRuns: Array<{
    id: string;
    changes: any;
    createdAt: string;
  }>;
}

export default function PushDebugPage() {
  const [data, setData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Test-push form state
  const [testEmail, setTestEmail] = useState('');
  const [testTitle, setTestTitle] = useState('🧪 Myncel test push');
  const [testBody, setTestBody]   = useState('Hello from /admin/push-debug');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Device-management state
  const [viewingDevice, setViewingDevice] = useState<any | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/push-debug', { cache: 'no-store' });
      if (res.status === 401) { setError('Not signed in.'); return; }
      if (res.status === 403) { setError('Super-admin only (admin@myncel.com).'); return; }
      if (!res.ok) { setError(`HTTP ${res.status}`); return; }
      const json = await res.json();
      setData(json); setError(null);
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [autoRefresh, refresh]);

  async function sendTestPush() {
    setTestSending(true); setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-push', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: testEmail.trim() || undefined,
          title: testTitle,
          body: testBody,
        }),
      });
      const json = await res.json();
      setTestResult({ httpStatus: res.status, ...json });
      // Force a refresh so the new attempt shows up in the activity log
      setTimeout(refresh, 1500);
    } catch (e: any) {
      setTestResult({ error: e?.message || 'Network error' });
    } finally {
      setTestSending(false);
    }
  }

  async function viewDevice(id: string) {
    setViewingLoading(true);
    setViewingDevice({ id, _loading: true });
    try {
      const res = await fetch(`/api/admin/push-debug/devices/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setViewingDevice({ error: json.error || `HTTP ${res.status}` });
      } else {
        setViewingDevice(json);
      }
    } catch (e: any) {
      setViewingDevice({ error: e?.message || 'Network error' });
    } finally {
      setViewingLoading(false);
    }
  }

  async function deleteDevice(id: string) {
    if (!confirm('Delete this device token?\n\nThe user keeps their account; their next app launch will re-register a fresh token.')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/push-debug/devices/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Failed to delete: ${j.error || res.status}`);
      } else {
        await refresh();
      }
    } catch (e: any) {
      alert(`Failed to delete: ${e?.message || 'Network error'}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAllDevices() {
    if (confirmDeleteAll.trim().toUpperCase() !== 'DELETE ALL') {
      alert('Type DELETE ALL exactly to confirm.');
      return;
    }
    setDeletingAll(true);
    try {
      const res = await fetch('/api/admin/push-debug/devices?all=1', { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Failed: ${json.error || res.status}`);
      } else {
        alert(`Deleted ${json.deletedCount} device token(s).`);
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

  if (loading) return <div className="p-6 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading push debug…</div>;
  if (error)   return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!data)   return <div className="p-6 text-sm">No data.</div>;

  const Stat = ({ label, value, sub }: { label: string; value: any; sub?: string }) => (
    <div className="rounded-xl p-4 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
      <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );

  const Pill = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {ok ? '✓' : '✗'} {label}
    </span>
  );

  const outcomeColor = (o: string) => {
    if (o === 'sent') return 'text-green-700 bg-green-50 border-green-200';
    if (o === 'error') return 'text-red-700 bg-red-50 border-red-200';
    if (o === 'token_dead') return 'text-orange-700 bg-orange-50 border-orange-200';
    if (o === 'skipped_no_config') return 'text-gray-700 bg-gray-50 border-gray-200';
    return 'text-blue-700 bg-blue-50 border-blue-200';
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };
  const fmtAgo = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>📡 Push Debug</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Real-time observability for the iOS / Android push notification pipeline. Server time: <code className="text-xs">{fmtTime(data.now)}</code>
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
          Auto-refresh (10s)
        </label>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total tokens"    value={data.counts.totalTokens}    sub="all platforms" />
        <Stat label="iOS tokens"      value={data.counts.iosTokens}      sub="APNs via FCM" />
        <Stat label="Android tokens"  value={data.counts.androidTokens}  sub="FCM" />
        <Stat label="Notifs last hour" value={data.counts.notificationsLastHour} sub="in-app rows" />
        <Stat label="Notifs last 24h"  value={data.counts.notificationsLastDay}  sub="in-app rows" />
      </div>

      {/* Config */}
      <section className="rounded-xl p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>⚙️ Configuration</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <Pill ok={data.fcmReady} label={data.fcmReady ? 'FCM ready' : 'FCM not configured'} />
          <Pill ok={!!data.config.FCM_PROJECT_ID}    label="FCM_PROJECT_ID" />
          <Pill ok={!!data.config.FCM_CLIENT_EMAIL}  label="FCM_CLIENT_EMAIL" />
          <Pill ok={!!data.config.FCM_PRIVATE_KEY}   label="FCM_PRIVATE_KEY" />
          <Pill ok={!!data.config.CRON_SECRET}       label="CRON_SECRET" />
        </div>
        {!data.fcmReady && (
          <p className="text-xs mt-2 p-3 rounded bg-amber-50 border border-amber-200 text-amber-900">
            ⚠️ FCM environment variables missing — pushes will silently no-op until the three FCM_* secrets are set in Vercel.
            Configure these at Vercel → Settings → Environment Variables, then redeploy.
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          NEXTAUTH_URL: <code>{String(data.config.NEXTAUTH_URL ?? '(not set)')}</code>
        </p>
      </section>

      {/* Test-push form */}
      <section className="rounded-xl p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>🧪 Send test push</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Bypasses all channel toggles &amp; quiet hours. Leave email blank to push to yourself (admin@myncel.com).
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          <input
            type="email" placeholder="user@example.com (or leave blank for self)"
            value={testEmail} onChange={e => setTestEmail(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          />
          <input
            type="text" placeholder="Title"
            value={testTitle} onChange={e => setTestTitle(e.target.value)} maxLength={120}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          />
          <input
            type="text" placeholder="Body"
            value={testBody} onChange={e => setTestBody(e.target.value)} maxLength={240}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={sendTestPush}
            disabled={testSending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {testSending ? 'Sending…' : 'Send test push'}
          </button>
          {testResult && (
            <pre className="text-xs flex-1 p-2 rounded border overflow-x-auto"
                 style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          )}
        </div>
      </section>

      {/* Devices */}
      <section className="rounded-xl p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            📱 Registered devices <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({data.tokens.length} most recent · {data.counts.totalTokens} total)</span>
          </h2>
          {data.counts.totalTokens > 0 && (
            <button
              onClick={() => { setConfirmDeleteAll(''); setShowDeleteAllModal(true); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            >
              🗑 Delete all devices
            </button>
          )}
        </div>
        {data.tokens.length === 0 ? (
          <div className="text-sm p-4 rounded bg-gray-50 border border-gray-200" style={{ color: 'var(--text-secondary)' }}>
            No devices have registered for push yet. Once a tester installs the iOS or Android app and grants push permission, they&apos;ll show up here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead style={{ color: 'var(--text-muted)' }}>
                <tr className="text-left">
                  <th className="p-2">User</th>
                  <th className="p-2">Platform</th>
                  <th className="p-2">Device</th>
                  <th className="p-2">App ver</th>
                  <th className="p-2">Token</th>
                  <th className="p-2">Last used</th>
                  <th className="p-2">Created</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.tokens.map(t => (
                  <tr key={t.id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="p-2">{t.user?.email ?? '—'}</td>
                    <td className="p-2 uppercase">{t.platform}</td>
                    <td className="p-2">{t.deviceName ?? '—'}</td>
                    <td className="p-2">{t.appVersion ?? '—'}</td>
                    <td className="p-2 font-mono">{t.tokenSuffix ?? '—'}</td>
                    <td className="p-2" title={t.lastUsedAt}>{fmtAgo(t.lastUsedAt)}</td>
                    <td className="p-2" title={t.createdAt}>{fmtAgo(t.createdAt)}</td>
                    <td className="p-2 whitespace-nowrap text-right">
                      <button
                        onClick={() => viewDevice(t.id)}
                        className="px-2 py-1 rounded text-[11px] mr-1 border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                      >
                        👁 View
                      </button>
                      <button
                        onClick={() => deleteDevice(t.id)}
                        disabled={deletingId === t.id}
                        className="px-2 py-1 rounded text-[11px] border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === t.id ? '…' : '🗑 Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent push attempts */}
      <section className="rounded-xl p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          📬 Recent push attempts <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>(last 50)</span>
        </h2>
        {data.recentAttempts.length === 0 ? (
          <div className="text-sm p-4 rounded bg-gray-50 border border-gray-200" style={{ color: 'var(--text-secondary)' }}>
            No push attempts logged yet. Send a test push above (or trigger an emergency broadcast) and they&apos;ll appear here.
          </div>
        ) : (
          <div className="space-y-1.5">
            {data.recentAttempts.map(a => {
              const ch = a.changes || {};
              const outcome = ch.outcome ?? '?';
              return (
                <div key={a.id} className={`flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-md border text-xs ${outcomeColor(outcome)}`}>
                  <span className="font-mono font-bold uppercase">{outcome.replace('_', ' ')}</span>
                  <span className="font-mono">{ch.channel}</span>
                  {ch.platform && <span>{ch.platform}</span>}
                  {ch.status && <span>HTTP {ch.status}</span>}
                  <span className="font-mono">{a.entityId ?? '—'}</span>
                  <span className="flex-1 truncate" title={ch.body ?? ''}>
                    <strong>{ch.title ?? '(no title)'}</strong>
                    {ch.body && <> — {ch.body}</>}
                  </span>
                  <span title={a.createdAt}>{fmtAgo(a.createdAt)}</span>
                  {ch.errorText && (
                    <div className="w-full font-mono text-[10px] mt-1 opacity-80">
                      err: {ch.errorText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent emergencies */}
      <section className="rounded-xl p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🚨 Recent emergency broadcasts</h2>
        {data.recentEmergencies.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>None recorded.</div>
        ) : (
          <div className="space-y-2">
            {data.recentEmergencies.map(e => {
              const ch = e.changes || {};
              return (
                <div key={e.id} className="text-xs p-3 rounded border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <strong>{ch.title ?? '(no title)'}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{fmtAgo(e.createdAt)}</span>
                  </div>
                  <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>{ch.message ?? ch.body ?? '—'}</div>
                  <div className="mt-1 flex flex-wrap gap-3" style={{ color: 'var(--text-muted)' }}>
                    {e.user?.email && <span>by {e.user.email}</span>}
                    {e.organization?.name && <span>org: {e.organization.name}</span>}
                    {ch.recipientCount != null && <span>recipients: {ch.recipientCount}</span>}
                    {ch.pushesSent != null && <span>pushes sent: {ch.pushesSent}</span>}
                    {ch.pushesSkipped != null && <span>skipped: {ch.pushesSkipped}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent cron runs */}
      <section className="rounded-xl p-5 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>⏰ Recent cron sweeps <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(/api/cron/notifications, every 15 min)</span></h2>
        {data.recentCronRuns.length === 0 ? (
          <div className="text-sm p-4 rounded bg-amber-50 border border-amber-200 text-amber-900">
            ⚠️ No cron runs recorded yet. The cron is scheduled in <code>vercel.json</code>; check Vercel → Crons tab to confirm it&apos;s firing.
          </div>
        ) : (
          <div className="space-y-1">
            {data.recentCronRuns.map(r => {
              const ch = r.changes || {};
              const c = ch.counts || {};
              return (
                <div key={r.id} className="text-xs p-2 rounded border font-mono flex flex-wrap items-center gap-3"
                     style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <span className="font-bold">{fmtAgo(r.createdAt)}</span>
                  <span>{ch.durationMs}ms</span>
                  <span>created: {c.notificationsCreated ?? 0}</span>
                  <span>pushes: {c.pushesSent ?? 0}</span>
                  <span>skipped: {c.pushesSkipped ?? 0}</span>
                  <span title={r.createdAt} style={{ color: 'var(--text-muted)' }}>{fmtTime(r.createdAt)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* View Device Modal */}
      {viewingDevice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setViewingDevice(null)}
        >
          <div
            className="rounded-xl p-5 max-w-2xl w-full max-h-[80vh] overflow-y-auto border shadow-2xl"
            style={{
              background: '#ffffff',
              borderColor: '#e5e7eb',
              color: '#111827',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="font-semibold text-lg" style={{ color: '#111827' }}>
                📱 Device details
              </h3>
              <button
                onClick={() => setViewingDevice(null)}
                className="text-2xl leading-none hover:opacity-70"
                style={{ color: '#6b7280' }}
              >
                ×
              </button>
            </div>
            {viewingLoading || viewingDevice._loading ? (
              <div className="text-sm" style={{ color: '#6b7280' }}>Loading…</div>
            ) : viewingDevice.error ? (
              <div className="text-sm text-red-600">{viewingDevice.error}</div>
            ) : (
              <div className="space-y-2 text-sm">
                <Row label="User"        value={viewingDevice.user?.email ?? '—'} />
                <Row label="Name"        value={viewingDevice.user?.name ?? '—'} />
                <Row label="Role"        value={viewingDevice.user?.role ?? '—'} />
                <Row label="Org id"      value={viewingDevice.user?.organizationId ?? '—'} mono />
                <Row label="Platform"    value={String(viewingDevice.platform).toUpperCase()} />
                <Row label="Device"      value={viewingDevice.deviceName ?? '—'} />
                <Row label="App version" value={viewingDevice.appVersion ?? '—'} />
                <Row label="Created"     value={fmtTime(viewingDevice.createdAt)} />
                <Row label="Last used"   value={fmtTime(viewingDevice.lastUsedAt)} />
                <Row label="Token id"    value={viewingDevice.id} mono />
                <div className="pt-2">
                  <div className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6b7280' }}>
                    Push token (full)
                  </div>
                  <pre className="text-[10px] p-2 rounded border overflow-x-auto whitespace-pre-wrap break-all"
                    style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}>
                    {viewingDevice.token ?? '—'}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(viewingDevice.token ?? '').catch(() => {});
                    }}
                    className="mt-2 px-2 py-1 rounded text-[11px] border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  >
                    📋 Copy token
                  </button>
                </div>
                <div className="pt-3 mt-3 flex justify-end gap-2 border-t" style={{ borderColor: '#e5e7eb' }}>
                  <button
                    onClick={() => setViewingDevice(null)}
                    className="px-3 py-1.5 rounded-lg text-sm border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      const id = viewingDevice.id;
                      setViewingDevice(null);
                      await deleteDevice(id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  >
                    🗑 Delete this device
                  </button>
                </div>
              </div>
            )}
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
            <h3 className="font-semibold text-lg mb-2 text-red-700">⚠️ Delete ALL device tokens?</h3>
            <p className="text-sm mb-3" style={{ color: '#374151' }}>
              This will remove <strong>{data.counts.totalTokens}</strong> registered device token{data.counts.totalTokens === 1 ? '' : 's'}.
              User accounts are <strong>not</strong> affected; users will simply re-register their device the next time they open the app.
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
                onClick={deleteAllDevices}
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
      <div className="text-xs uppercase tracking-wide w-28 flex-shrink-0 pt-0.5" style={{ color: '#6b7280' }}>
        {label}
      </div>
      <div className={`flex-1 ${mono ? 'font-mono text-xs break-all' : ''}`} style={{ color: '#111827' }}>
        {value}
      </div>
    </div>
  );
}
