'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Org {
  id: string;
  name: string;
  plan: string;
  _count: { machines: number; users: number };
}

interface OverviewData {
  machineCount: number;
  workOrderCount: number;
  alertCount: number;
  taskCount: number;
  isSuperAdmin: boolean;
  organizations: Org[];
  selectedOrgId: string;
}

const REFRESH_INTERVAL = 30_000; // 30 seconds

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prev.current = value;
  }, [value]);

  return <>{display}</>;
}

export default function DataOverviewClient({ initialOrgId, isSuperAdmin: initialIsSuperAdmin }: {
  initialOrgId: string;
  isSuperAdmin: boolean;
}) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState(initialIsSuperAdmin ? 'all' : initialOrgId);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
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

  // Initial fetch
  useEffect(() => {
    fetchData(selectedOrgId);
  }, [selectedOrgId, fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData(selectedOrgId, true);
    }, REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedOrgId, fetchData]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setLoading(true);
  };

  const handleManualRefresh = () => {
    // Reset interval timer
    if (intervalRef.current) clearInterval(intervalRef.current);
    fetchData(selectedOrgId, true);
    intervalRef.current = setInterval(() => {
      fetchData(selectedOrgId, true);
    }, REFRESH_INTERVAL);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const stats = [
    {
      label: 'Machines',
      value: data?.machineCount ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.2)',
    },
    {
      label: 'Work Orders',
      value: data?.workOrderCount ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      ),
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.2)',
    },
    {
      label: 'Alerts',
      value: data?.alertCount ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
      ),
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
    },
    {
      label: 'Maintenance Tasks',
      value: data?.taskCount ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>
        </svg>
      ),
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
    },
  ];

  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Data Overview
          </h2>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
            LIVE
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Last updated */}
          {lastUpdated && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Updated {formatTime(lastUpdated)}
            </span>
          )}

          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            title="Refresh now"
          >
            <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {syncing ? 'Syncing…' : 'Refresh'}
          </button>

          {/* Org selector dropdown — only for super admin */}
          {data?.isSuperAdmin && (
            <div className="relative">
              <select
                value={selectedOrgId}
                onChange={e => handleOrgChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium cursor-pointer focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  minWidth: 160,
                }}
              >
                <option value="all">🌐 All Organizations</option>
                {data.organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org._count.machines} machines)
                  </option>
                ))}
              </select>
              {/* Dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: 'var(--text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected org info badge */}
      {data?.isSuperAdmin && selectedOrgId !== 'all' && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          Viewing:&nbsp;
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {data.organizations.find(o => o.id === selectedOrgId)?.name || selectedOrgId}
          </span>
          <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
            style={{ background: 'rgba(99,91,255,0.12)', color: '#635bff' }}>
            {data.organizations.find(o => o.id === selectedOrgId)?.plan || 'PLAN'}
          </span>
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-lg p-4 animate-pulse"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', height: 90 }}/>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  {stat.label}
                </p>
                <div style={{ color: stat.color }}>{stat.icon}</div>
              </div>
              <p className="text-3xl font-bold leading-none" style={{ color: stat.color }}>
                <AnimatedNumber value={stat.value}/>
              </p>
              {/* Subtle trend bar */}
              <div className="h-1 rounded-full mt-1" style={{ background: 'var(--bg-surface-2)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (stat.value / Math.max(1, stat.value)) * 100)}%`, background: stat.color, opacity: 0.6 }}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        Auto-refreshes every 30 seconds · Click Refresh for immediate sync
      </p>
    </div>
  );
}