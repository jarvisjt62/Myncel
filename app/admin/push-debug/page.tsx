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
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          📱 Registered devices <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({data.tokens.length} most recent)</span>
        </h2>
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
    </div>
  );
}
