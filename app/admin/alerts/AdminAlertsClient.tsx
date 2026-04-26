'use client';

import { useState } from 'react';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  type: string;
  isResolved: boolean;
  isRead: boolean;
  createdAt: string;
  resolvedAt: string | null;
  machine?: { name: string } | null;
  organization?: { name: string } | null;
}

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30 border-l-red-500',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30 border-l-orange-500',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border-l-yellow-500',
  LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30 border-l-blue-500',
};

const severityBadge: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  LOW: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

export default function AdminAlertsClient({ alerts: initial }: { alerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initial);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [showResolved, setShowResolved] = useState(false);

  const filtered = alerts.filter(a => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase()) ||
      (a.machine?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.organization?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === 'ALL' || a.severity === filterSeverity;
    const matchResolved = showResolved ? true : !a.isResolved;
    return matchSearch && matchSeverity && matchResolved;
  });

  const resolveAlert = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true }),
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() } : a));
        if (selected?.id === alertId) setSelected(prev => prev ? { ...prev, isResolved: true } : prev);
      }
    } catch { /* ignore */ }
    setResolvingId(null);
  };

  const unresolvedCount = alerts.filter(a => !a.isResolved).length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.isResolved).length;
  const highCount = alerts.filter(a => a.severity === 'HIGH' && !a.isResolved).length;
  const resolvedCount = alerts.filter(a => a.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Alerts</h1>
          <p className="text-[var(--text-secondary)] mt-1">{unresolvedCount} unresolved alerts across all organizations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
            className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#635bff]">
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button onClick={() => setShowResolved(!showResolved)}
            className={`text-sm px-3 py-2 rounded-lg border transition-colors ${showResolved ? 'bg-[#635bff] text-[var(--text-primary)] border-[#635bff]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'}`}>
            {showResolved ? '✓ Showing All' : 'Show Resolved'}
          </button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#635bff] w-48" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Unresolved', value: unresolvedCount, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-surface)]' },
          { label: 'Critical', value: criticalCount, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
          { label: 'High', value: highCount, color: 'text-orange-400', bg: 'bg-orange-500/5 border-orange-500/20' },
          { label: 'Resolved', value: resolvedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border border-[var(--border)] rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[var(--text-secondary)] text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts List */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-12 text-center">
          <p className="text-[var(--text-secondary)]">No alerts match your filters. ✓</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`bg-[var(--bg-surface)] border border-[var(--border)] border-l-4 rounded-xl px-5 py-4 ${
                alert.severity === 'CRITICAL' ? 'border-l-red-500' :
                alert.severity === 'HIGH' ? 'border-l-orange-500' :
                alert.severity === 'MEDIUM' ? 'border-l-yellow-500' : 'border-l-blue-500'
              } ${alert.isResolved ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => setSelected(alert)}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${severityBadge[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">{alert.type?.replace(/_/g, ' ')}</span>
                    {alert.isResolved && <span className="text-xs text-emerald-400 font-semibold">✓ RESOLVED</span>}
                    <span className="text-xs text-[var(--text-secondary)] ml-auto">
                      {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{alert.message}</p>
                  <div className="flex gap-4 mt-2">
                    {alert.machine && <p className="text-xs text-[var(--text-secondary)]">🔧 {alert.machine.name}</p>}
                    {alert.organization && <p className="text-xs text-[var(--text-secondary)]">🏢 {alert.organization.name}</p>}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {!alert.isResolved ? (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      disabled={resolvingId === alert.id}
                      className="text-xs text-[var(--text-primary)] bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {resolvingId === alert.id ? '…' : '✓ Resolve'}
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold">Resolved</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
          <div className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${severityBadge[selected.severity]}`}>{selected.severity}</span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-2">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">{selected.message}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { label: 'Severity', value: selected.severity },
                  { label: 'Type', value: selected.type?.replace(/_/g, ' ') },
                  { label: 'Machine', value: selected.machine?.name },
                  { label: 'Organization', value: selected.organization?.name },
                  { label: 'Status', value: selected.isResolved ? '✓ Resolved' : 'Unresolved' },
                  { label: 'Created', value: new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                  { label: 'Resolved At', value: selected.resolvedAt ? new Date(selected.resolvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
                ] as {label:string;value:any}[]).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-[var(--text-primary)] mt-0.5">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                {!selected.isResolved && (
                  <button onClick={() => { resolveAlert(selected.id); setSelected(null); }}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-[var(--text-primary)] rounded-lg text-sm font-semibold transition-colors">
                    ✓ Resolve Alert
                  </button>
                )}
                <button onClick={() => setSelected(null)}
                  className="flex-1 px-4 py-2 text-sm text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}