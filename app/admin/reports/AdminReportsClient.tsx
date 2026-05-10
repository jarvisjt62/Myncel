'use client';

import { useState } from 'react';

interface WorkOrder {
  id: string;
  woNumber: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  laborCost: number | null;
  partsCost: number | null;
  totalCost: number | null;
  completedAt: string | null;
  createdAt: string;
}

interface Machine {
  id: string;
  name: string;
  status: string;
  criticality: string;
}

interface Organization {
  id: string;
  name: string;
  plan: string;
  machines: Machine[];
  workOrders: WorkOrder[];
  _count: { machines: number; workOrders: number; users: number };
}

export default function AdminReportsClient({ organizations }: { organizations: Organization[] }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');

  const selectedOrgs = selectedOrgId === 'all' ? organizations : organizations.filter(o => o.id === selectedOrgId);
  const allWOs = selectedOrgs.flatMap(o => o.workOrders);
  const allMachines = selectedOrgs.flatMap(o => o.machines);

  const totalCost = allWOs.reduce((s, wo) => s + (wo.totalCost ?? 0), 0);
  const laborCost = allWOs.reduce((s, wo) => s + (wo.laborCost ?? 0), 0);
  const partsCost = allWOs.reduce((s, wo) => s + (wo.partsCost ?? 0), 0);
  const completionRate = allWOs.length > 0
    ? Math.round((allWOs.filter(wo => wo.status === 'COMPLETED').length / allWOs.length) * 100)
    : 0;

  const colorMap: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#635bff', LOW: '#94a3b8' };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Maintenance costs, work order stats and equipment health across all organizations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-semibold"
          style={{ backgroundColor: 'rgba(99,91,255,0.08)', color: '#635bff', border: '1px solid rgba(99,91,255,0.25)' }}>
          Admin Mode
        </div>
      </div>

      {/* Org filter */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Filter by Organization</label>
        <select
          value={selectedOrgId}
          onChange={e => setSelectedOrgId(e.target.value)}
          className="w-full sm:w-80 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#635bff]/40 appearance-none"
          style={{
            backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px',
          }}
        >
          <option value="all">All Organizations ({organizations.length})</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name} — {org._count.workOrders} WOs
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Maintenance Cost', value: `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'All work orders' },
          { label: 'Labor Cost', value: `$${laborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Total labor' },
          { label: 'Parts Cost', value: `$${partsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Total parts' },
          { label: 'Completion Rate', value: `${completionRate}%`, sub: `${allWOs.filter(wo => wo.status === 'COMPLETED').length} of ${allWOs.length} completed` },
        ].map(card => (
          <div key={card.label} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{card.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{card.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Equipment Health + WO Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Equipment Health */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Equipment Health</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Operational', count: allMachines.filter(m => m.status === 'OPERATIONAL').length, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
              { label: 'Maintenance', count: allMachines.filter(m => m.status === 'MAINTENANCE').length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              { label: 'Breakdown', count: allMachines.filter(m => m.status === 'BREAKDOWN').length, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center p-3 rounded-lg" style={{ backgroundColor: item.bg, border: `1px solid ${item.color}33` }}>
                <div className="text-xl font-bold" style={{ color: item.color }}>{item.count}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WO Status */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Work Order Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Open', count: allWOs.filter(wo => wo.status === 'OPEN').length, color: '#635bff' },
              { label: 'In Progress', count: allWOs.filter(wo => wo.status === 'IN_PROGRESS').length, color: '#0ea5e9' },
              { label: 'Completed', count: allWOs.filter(wo => wo.status === 'COMPLETED').length, color: '#10b981' },
              { label: 'Overdue', count: allWOs.filter(wo => wo.status !== 'COMPLETED' && wo.completedAt === null).length, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                <div className="text-xl font-bold" style={{ color: item.color }}>{item.count}</div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost by Priority */}
      <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Cost by Priority</h2>
        <div className="space-y-3">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(priority => {
            const filtered = allWOs.filter(wo => wo.priority === priority);
            const cost = filtered.reduce((s, wo) => s + (wo.totalCost ?? 0), 0);
            const pct = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0;
            return (
              <div key={priority} className="flex items-center gap-3">
                <span className="text-xs font-medium w-16" style={{ color: 'var(--text-secondary)' }}>{priority}</span>
                <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colorMap[priority] || '#635bff', minWidth: filtered.length > 0 ? '8px' : '0' }} />
                </div>
                <span className="text-xs font-mono w-24 text-right" style={{ color: 'var(--text-primary)' }}>
                  ${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs w-12" style={{ color: 'var(--text-muted)' }}>{filtered.length} WOs</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Organization Breakdown */}
      {selectedOrgId === 'all' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Per-Organization Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Organization', 'Plan', 'Machines', 'Work Orders', 'Completed', 'Total Cost', 'Labor', 'Parts'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => {
                  const wos = org.workOrders;
                  const tc = wos.reduce((s, w) => s + (w.totalCost ?? 0), 0);
                  const lc = wos.reduce((s, w) => s + (w.laborCost ?? 0), 0);
                  const pc = wos.reduce((s, w) => s + (w.partsCost ?? 0), 0);
                  return (
                    <tr key={org.id} className="hover:bg-[var(--bg-surface-2)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{org.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#635bff]/10 text-[#635bff]">{org.plan}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{org._count.machines}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{wos.length}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{wos.filter(w => w.status === 'COMPLETED').length}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>${tc.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>${lc.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>${pc.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}