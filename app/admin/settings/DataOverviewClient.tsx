'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Org {
  id: string;
  name: string;
  plan: string;
  _count: { machines: number; users: number; workOrders: number; alerts: number };
}

interface OverviewData {
  machineCount: number;
  machineOperational: number;
  machineMaintenance: number;
  machineBreakdown: number;
  workOrderCount: number;
  workOrderOpen: number;
  workOrderInProgress: number;
  workOrderCompleted: number;
  alertCount: number;
  alertActive: number;
  alertCritical: number;
  taskCount: number;
  taskActive: number;
  taskOverdue: number;
  isSuperAdmin: boolean;
  organizations: Org[];
  selectedOrgId: string;
  syncedAt: string;
}

const REFRESH_INTERVAL = 30_000;

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const diff = value - start;
    const startTime = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - startTime) / 500, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * e));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prev.current = value;
  }, [value]);
  return <>{display}</>;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 3, height: 4, overflow: 'hidden', marginTop: 2 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.7s ease' }} />
    </div>
  );
}

export default function DataOverviewClient({ initialOrgId, isSuperAdmin: initIsSuperAdmin }: {
  initialOrgId: string;
  isSuperAdmin: boolean;
}) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState(initIsSuperAdmin ? 'all' : initialOrgId);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [forceSyncing, setForceSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [showSyncLog, setShowSyncLog] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (orgId: string, showSyncing = false) => {
    if (showSyncing) setSyncing(true);
    try {
      const res = await fetch(`/api/admin/settings-overview?orgId=${orgId}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch overview:', e);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedOrgId);
  }, [selectedOrgId, fetchData]);

  useEffect(() => {
    intervalRef.current = setInterval(() => fetchData(selectedOrgId, true), REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedOrgId, fetchData]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSyncLog([]);
    setShowSyncLog(false);
    setLoading(true);
  };

  const handleRefresh = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    fetchData(selectedOrgId, true);
    intervalRef.current = setInterval(() => fetchData(selectedOrgId, true), REFRESH_INTERVAL);
  };

  const handleForceSync = async () => {
    setForceSyncing(true);
    setSyncLog([]);
    setShowSyncLog(true);
    try {
      const res = await fetch(`/api/admin/settings-overview?orgId=${selectedOrgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (res.ok) {
        setSyncLog(json.actions || []);
        // Refresh data after sync
        await fetchData(selectedOrgId, false);
        setLastUpdated(new Date());
      } else {
        setSyncLog([`Error: ${json.error}`]);
      }
    } catch (e) {
      setSyncLog([`Error: ${String(e)}`]);
    } finally {
      setForceSyncing(false);
    }
  };

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const selectedOrg = data?.organizations.find(o => o.id === selectedOrgId);

  const statCards = data ? [
    {
      label: 'Machines',
      main: data.machineCount,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.07)',
      border: 'rgba(59,130,246,0.18)',
      icon: '⚙️',
      breakdown: [
        { label: 'Operational', value: data.machineOperational, color: '#22c55e' },
        { label: 'Maintenance', value: data.machineMaintenance, color: '#f59e0b' },
        { label: 'Breakdown',   value: data.machineBreakdown,   color: '#ef4444' },
      ],
    },
    {
      label: 'Work Orders',
      main: data.workOrderCount,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.07)',
      border: 'rgba(139,92,246,0.18)',
      icon: '📋',
      breakdown: [
        { label: 'Open',        value: data.workOrderOpen,       color: '#f59e0b' },
        { label: 'In Progress', value: data.workOrderInProgress, color: '#3b82f6' },
        { label: 'Completed',   value: data.workOrderCompleted,  color: '#22c55e' },
      ],
    },
    {
      label: 'Alerts',
      main: data.alertCount,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.07)',
      border: 'rgba(239,68,68,0.18)',
      icon: '🔔',
      breakdown: [
        { label: 'Active',   value: data.alertActive,   color: '#ef4444' },
        { label: 'Critical', value: data.alertCritical, color: '#dc2626' },
        { label: 'Resolved', value: data.alertCount - data.alertActive, color: '#22c55e' },
      ],
    },
    {
      label: 'Maint. Tasks',
      main: data.taskCount,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.07)',
      border: 'rgba(245,158,11,0.18)',
      icon: '🔧',
      breakdown: [
        { label: 'Active',  value: data.taskActive,  color: '#22c55e' },
        { label: 'Overdue', value: data.taskOverdue, color: '#ef4444' },
        { label: 'Inactive', value: data.taskCount - data.taskActive, color: '#94a3b8' },
      ],
    },
  ] : [];

  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Data Overview</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            LIVE
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {lastUpdated && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Synced {fmt(lastUpdated)}
            </span>
          )}

          {/* Refresh */}
          <button onClick={handleRefresh} disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing…' : 'Refresh'}
          </button>

          {/* Force Sync */}
          <button onClick={handleForceSync} disabled={forceSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: forceSyncing ? 'rgba(99,91,255,0.2)' : 'rgba(99,91,255,0.1)',
              border: '1px solid rgba(99,91,255,0.35)', color: '#635bff' }}>
            <svg className={`w-3.5 h-3.5 ${forceSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {forceSyncing ? 'Syncing…' : 'Force Sync'}
          </button>

          {/* Org selector — super admin only */}
          {data?.isSuperAdmin && (
            <div className="relative">
              <select value={selectedOrgId} onChange={e => handleOrgChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', minWidth: 170 }}>
                <option value="all">🌐 All Organizations</option>
                {data.organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org._count.machines}m)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: 'var(--text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Selected org badge ── */}
      {data?.isSuperAdmin && selectedOrgId !== 'all' && selectedOrg && (
        <div className="mb-4 flex items-center gap-3 px-3 py-2 rounded-lg text-xs flex-wrap"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <span>🏢</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedOrg.name}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
            style={{ background: 'rgba(99,91,255,0.12)', color: '#635bff' }}>{selectedOrg.plan}</span>
          <span style={{ marginLeft: 'auto' }}>
            {selectedOrg._count.machines} machines · {selectedOrg._count.users} users · {selectedOrg._count.workOrders} WOs · {selectedOrg._count.alerts} alerts
          </span>
        </div>
      )}

      {/* ── Stat cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-xl animate-pulse"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', height: 130 }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="rounded-xl p-4 flex flex-col gap-3 transition-all hover:scale-[1.02]"
              style={{ background: card.bg, border: `1px solid ${card.border}` }}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  {card.label}
                </p>
                <span className="text-base">{card.icon}</span>
              </div>
              {/* Main number */}
              <p className="text-3xl font-bold leading-none" style={{ color: card.color }}>
                <AnimatedNumber value={card.main} />
              </p>
              {/* Breakdown rows */}
              <div className="space-y-1.5">
                {card.breakdown.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{b.label}</span>
                      <span className="text-[10px] font-bold" style={{ color: b.color }}>{b.value}</span>
                    </div>
                    <MiniBar value={b.value} max={card.main} color={b.color} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sync log ── */}
      {showSyncLog && syncLog.length > 0 && (
        <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(99,91,255,0.06)', border: '1px solid rgba(99,91,255,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#635bff' }}>
              ⚡ Force Sync Results
            </span>
            <button onClick={() => setShowSyncLog(false)}
              className="text-xs" style={{ color: 'var(--text-muted)' }}>✕ close</button>
          </div>
          <ul className="space-y-1">
            {syncLog.map((action, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: action.startsWith('✅') ? '#22c55e' : action.startsWith('Error') ? '#ef4444' : '#635bff', flexShrink: 0 }}>
                  {action.startsWith('✅') ? '✅' : action.startsWith('Error') ? '❌' : '→'}
                </span>
                <span>{action.replace(/^✅\s*/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Auto-refreshes every 30s · Force Sync recalculates derived data from live DB
        </p>
        {data?.syncedAt && (
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            DB snapshot: {new Date(data.syncedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}