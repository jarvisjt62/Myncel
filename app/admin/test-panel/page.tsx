'use client';

import { useState, useEffect, useCallback } from 'react';

export const dynamic = 'force-dynamic';

const SECRET = 'myncel-simulate-2024';

interface Machine {
  id: string;
  name: string;
  status: string;
  serialNumber: string;
  organization?: {
    id: string;
    name: string;
  };
}

interface Organization {
  id: string;
  name: string;
  _count?: {
    machines: number;
  };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  OPERATIONAL: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  MAINTENANCE: { bg: 'bg-yellow-50 dark:bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' },
  BREAKDOWN: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  RETIRED: { bg: 'bg-gray-50 dark:bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' },
};

const SCENARIOS = [
  { id: 'breakdown', label: '🚨 Machine Breakdown', desc: 'Simulates a machine failing — creates emergency work order + critical alert', color: 'border-red-200 dark:border-red-500/30 hover:border-red-400 dark:hover:border-red-500/60 hover:bg-red-50 dark:hover:bg-red-500/5' },
  { id: 'maintenance_due', label: '⚠️ Maintenance Overdue', desc: 'Creates a maintenance overdue alert for a scheduled task', color: 'border-yellow-200 dark:border-yellow-500/30 hover:border-yellow-400 dark:hover:border-yellow-500/60 hover:bg-yellow-50 dark:hover:bg-yellow-500/5' },
  { id: 'low_parts', label: '📦 Low Parts Inventory', desc: 'Sets a part to critical low stock and creates an alert', color: 'border-orange-200 dark:border-orange-500/30 hover:border-orange-400 dark:hover:border-orange-500/60 hover:bg-orange-50 dark:hover:bg-orange-500/5' },
  { id: 'work_order_progress', label: '▶️ Start Work Orders', desc: 'Moves open work orders to IN_PROGRESS status', color: 'border-blue-200 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-500/60 hover:bg-blue-50 dark:hover:bg-blue-500/5' },
  { id: 'complete_work_order', label: '✅ Complete Work Order', desc: 'Completes an in-progress work order and restores the machine to OPERATIONAL', color: 'border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:bg-emerald-50 dark:hover:bg-emerald-500/5' },
  { id: 'random', label: '🎲 Run Random Events', desc: 'Runs breakdown + maintenance overdue + low parts all at once', color: 'border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/60 hover:bg-purple-50 dark:hover:bg-purple-500/5' },
  { id: 'reset', label: '🔄 Reset All', desc: 'Resets all machines to OPERATIONAL and resolves all alerts', color: 'border-gray-200 dark:border-gray-500/30 hover:border-gray-400 dark:hover:border-gray-500/60 hover:bg-gray-50 dark:hover:bg-gray-500/5' },
];

export default function TestPanel() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<{ scenario: string; results: string[]; error?: string; time: string }[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch organizations
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (e) {
      console.error('Failed to fetch organizations:', e);
    }
  }, []);

  // Fetch machines for selected org (or all orgs)
  const fetchMachines = useCallback(async () => {
    try {
      const url = selectedOrgId 
        ? `/api/admin/machines?organizationId=${selectedOrgId}`
        : '/api/admin/machines';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMachines(data.machines || []);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Failed to fetch machines:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  // Initial load
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Load machines when org changes
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines, selectedOrgId]);

  // Auto-refresh polling (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchMachines();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMachines]);

  // Reset selected machine when org changes
  useEffect(() => {
    setSelectedMachineId('');
  }, [selectedOrgId]);

  const runScenario = async (scenario: string) => {
    setRunning(scenario);
    try {
      const res = await fetch('/api/admin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          secret: SECRET, 
          scenario,
          organizationId: selectedOrgId || undefined,
          machineId: selectedMachineId || undefined,
        }),
      });
      const data = await res.json();
      setResults(prev => [{
        scenario,
        results: data.results || [data.error || 'Unknown result'],
        error: data.error,
        time: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 20));
      
      // Refresh machines after scenario runs
      setTimeout(() => fetchMachines(), 500);
    } catch (e) {
      setResults(prev => [{
        scenario,
        results: [`❌ Network error: ${e}`],
        error: String(e),
        time: new Date().toLocaleTimeString(),
      }, ...prev]);
    }
    setRunning(null);
  };

  const statusCounts = machines.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter machines by selected org
  const filteredMachines = selectedOrgId 
    ? machines.filter(m => m.organization?.id === selectedOrgId)
    : machines;

  // Get machines for selector dropdown
  const machinesForSelector = selectedOrgId 
    ? machines.filter(m => m.organization?.id === selectedOrgId)
    : machines;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">🧪 Test Panel</h1>
          <p className="text-[var(--text-secondary)] mt-1">Simulate real-time machine events to test the application functionality</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => fetchMachines()}
            className="px-3 py-1.5 text-sm bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg hover:opacity-80 transition-opacity border border-[var(--border-color)]"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
        <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium">⚠️ Development use only — these actions modify live database data</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: '👤 User Dashboard', href: '/dashboard' },
          { label: '🏭 HMI Dashboard', href: '/dashboard/hmi' },
          { label: '🎛️ Admin HMI', href: '/admin/hmi' },
          { label: '🔧 Machines', href: '/admin/machines' },
          { label: '📋 Work Orders', href: '/admin/work-orders' },
          { label: '🔔 Alerts', href: '/admin/alerts' },
        ].map(link => (
          <a key={link.href} href={link.href} target="_blank"
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)] transition-colors text-center">
            {link.label}
          </a>
        ))}
      </div>

      {/* Main Grid: Controls + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Organization Selector */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
            <h3 className="text-[var(--text-primary)] font-semibold mb-3">🏢 Organization</h3>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-color)] focus:outline-none"
            >
              <option value="">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org._count?.machines || 0} machines)
                </option>
              ))}
            </select>
          </div>

          {/* Machine Selector */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
            <h3 className="text-[var(--text-primary)] font-semibold mb-3">🏭 Target Machine</h3>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-color)] focus:outline-none"
            >
              <option value="">Random Machine</option>
              {machinesForSelector.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} ({machine.status})
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Select a specific machine or leave as "Random" for any machine in the org
            </p>
          </div>

          {/* Status Summary */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[var(--text-primary)] font-semibold">📊 Status Summary</h3>
              {lastRefresh && (
                <span className="text-xs text-[var(--text-secondary)]">{lastRefresh.toLocaleTimeString()}</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <span className="text-emerald-600 dark:text-emerald-400 text-sm">Operational</span>
                <span className="text-[var(--text-primary)] font-semibold">{statusCounts['OPERATIONAL'] || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400 text-sm">Maintenance</span>
                <span className="text-[var(--text-primary)] font-semibold">{statusCounts['MAINTENANCE'] || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-sm">Breakdown</span>
                <span className="text-[var(--text-primary)] font-semibold">{statusCounts['BREAKDOWN'] || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-500/10 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Retired</span>
                <span className="text-[var(--text-primary)] font-semibold">{statusCounts['RETIRED'] || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
            <h3 className="text-[var(--text-primary)] font-semibold mb-3">⚡ Quick Actions</h3>
            <div className="space-y-2">
              <a 
                href="/admin/hmi" 
                target="_blank"
                className="block w-full text-center px-4 py-2 bg-[var(--accent-color)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Open HMI Dashboard →
              </a>
              <button
                onClick={() => runScenario('reset')}
                disabled={!!running}
                className="w-full px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity border border-[var(--border-color)]"
              >
                🔄 Reset All Machines
              </button>
            </div>
          </div>
        </div>

        {/* Right: Machine Grid + Scenarios */}
        <div className="lg:col-span-3 space-y-6">
          {/* Machine Status Grid */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[var(--text-primary)] font-semibold">🏭 Machine Status ({filteredMachines.length})</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">Loading machines...</div>
            ) : filteredMachines.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                {selectedOrgId ? 'No machines found for this organization.' : 'No machines found. Create an organization and add machines first.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                {filteredMachines.map(machine => {
                  const config = STATUS_CONFIG[machine.status] || STATUS_CONFIG['RETIRED'];
                  return (
                    <div 
                      key={machine.id} 
                      className={`border rounded-lg p-3 transition-all cursor-pointer hover:shadow-md ${
                        selectedMachineId === machine.id 
                          ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/20' 
                          : 'border-[var(--border-color)]'
                      } ${machine.status === 'BREAKDOWN' ? 'animate-pulse' : ''}`}
                      onClick={() => setSelectedMachineId(machine.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`}></span>
                        <span className="text-[var(--text-primary)] text-sm font-medium truncate">{machine.name}</span>
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-secondary)] truncate">{machine.serialNumber || 'No SN'}</div>
                      <div className="mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
                          {machine.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scenario Cards */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">🎬 Simulation Scenarios</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {SCENARIOS.map(s => (
                <div key={s.id} className={`bg-[var(--bg-secondary)] border rounded-xl p-4 transition-all ${s.color}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[var(--text-primary)] font-semibold text-sm">{s.label}</p>
                    <button
                      onClick={() => runScenario(s.id)}
                      disabled={!!running}
                      className="flex-shrink-0 px-3 py-1.5 bg-[var(--accent-color)] text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity min-w-[60px]"
                    >
                      {running === s.id ? (
                        <span className="flex items-center justify-center gap-1">
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" /></svg>
                          Run
                        </span>
                      ) : 'Run'}
                    </button>
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Log */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">📋 Execution Log</h2>
            <button onClick={() => setResults([])} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg">Clear</button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`bg-[var(--bg-secondary)] border rounded-xl p-3 ${r.error ? 'border-red-200 dark:border-red-500/30' : 'border-emerald-200 dark:border-emerald-500/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[var(--text-primary)] font-semibold text-sm">{r.scenario}</p>
                  <p className="text-[var(--text-secondary)] text-xs">{r.time}</p>
                </div>
                {r.results.map((line, j) => (
                  <p key={j} className={`text-sm ${r.error ? 'text-red-500' : 'text-emerald-500'}`}>{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How to test */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
        <h3 className="text-[var(--text-primary)] font-semibold mb-3">📖 Testing Workflow</h3>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p><span className="text-[var(--text-primary)] font-medium">1.</span> Select an <strong className="text-[var(--text-primary)]">Organization</strong> from the dropdown</p>
          <p><span className="text-[var(--text-primary)] font-medium">2.</span> Optionally select a <strong className="text-[var(--text-primary)]">Target Machine</strong> or leave as "Random"</p>
          <p><span className="text-[var(--text-primary)] font-medium">3.</span> Click <strong className="text-[var(--text-primary)]">"🚨 Machine Breakdown"</strong> — watch the machine status change to BREAKDOWN</p>
          <p><span className="text-[var(--text-primary)] font-medium">4.</span> Open the <a href="/dashboard/hmi" target="_blank" className="text-[var(--accent-color)] hover:underline">HMI Dashboard</a> to see real-time changes</p>
          <p><span className="text-[var(--text-primary)] font-medium">5.</span> Click <strong className="text-[var(--text-primary)]">"✅ Complete Work Order"</strong> — machine returns to OPERATIONAL</p>
          <p><span className="text-[var(--text-primary)] font-medium">6.</span> Click <strong className="text-[var(--text-primary)]">"🔄 Reset All"</strong> to clean up and start fresh</p>
        </div>
      </div>
    </div>
  );
}