"use client";

import { useState, useEffect } from 'react';

interface AnalyticsData {
  period: string;
  summary: {
    workOrdersCompleted: number;
    workOrdersCreated: number;
    avgCompletionTimeHours: number | null;
    maintenanceTasksCompleted: number;
    totalLaborCost: number;
    totalPartsCost: number;
    totalCost: number;
  };
  machines: {
    total: number;
    totalRuntimeHours: number;
    avgHoursPerMachine: number;
    operational: number;
    reliabilityScore: number;
  };
  maintenance: {
    tasksCompleted: number;
    pmComplianceRate: number;
  };
  inventory: {
    lowStockParts: number;
  };
  workOrders: {
    byStatus: Array<{ status: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    trends: Array<{ week: string; created: number; completed: number }>;
  };
  alerts: {
    byType: Array<{ type: string; count: number }>;
  };
  recentActivity: Array<{
    id: string;
    woNumber: string;
    title: string;
    status: string;
    updatedAt: string;
    machine: { name: string };
    assignedTo: { name: string } | null;
  }>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-gray-500">
        {error || 'No data available'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Work Orders Created"
          value={data.summary.workOrdersCreated}
          icon="📋"
          color="blue"
        />
        <SummaryCard
          title="Completed"
          value={data.summary.workOrdersCompleted}
          icon="✅"
          color="green"
        />
        <SummaryCard
          title="Avg Completion"
          value={data.summary.avgCompletionTimeHours ? `${data.summary.avgCompletionTimeHours}h` : '-'}
          icon="⏱️"
          color="purple"
        />
        <SummaryCard
          title="Total Cost"
          value={data.summary.totalCost > 0 ? `$${data.summary.totalCost.toLocaleString()}` : '-'}
          icon="💰"
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work Order Trends */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Work Order Trends</h4>
          <TrendChart data={data.workOrders.trends} />
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Status Distribution</h4>
          <StatusChart data={data.workOrders.byStatus} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Machine Health */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Machine Health</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Machines</span>
              <span className="font-semibold text-gray-900">{data.machines.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Operational</span>
              <span className="font-semibold text-green-600">{data.machines.operational}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Reliability Score</span>
              <span className={`font-semibold ${data.machines.reliabilityScore >= 90 ? 'text-green-600' : data.machines.reliabilityScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {data.machines.reliabilityScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${data.machines.reliabilityScore >= 90 ? 'bg-green-500' : data.machines.reliabilityScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${data.machines.reliabilityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* PM Compliance */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">PM Compliance</h4>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={data.maintenance.pmComplianceRate >= 90 ? '#10b981' : data.maintenance.pmComplianceRate >= 70 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(data.maintenance.pmComplianceRate / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{data.maintenance.pmComplianceRate}%</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">On-time completion rate</p>
          </div>
        </div>

        {/* Inventory Alert */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Inventory Status</h4>
          <div className="flex flex-col items-center justify-center py-4">
            <div className={`text-4xl font-bold ${data.inventory.lowStockParts > 0 ? 'text-orange-500' : 'text-green-500'}`}>
              {data.inventory.lowStockParts}
            </div>
            <p className="mt-2 text-sm text-gray-600">Parts below reorder point</p>
            {data.inventory.lowStockParts > 0 && (
              <button className="mt-3 text-xs text-blue-600 hover:underline">
                View low stock items →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Priority & Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">By Priority</h4>
          <BarChart data={data.workOrders.byPriority} labelKey="priority" valueKey="count" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">By Type</h4>
          <BarChart data={data.workOrders.byType} labelKey="type" valueKey="count" />
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Simple Trend Chart using CSS
function TrendChart({ data }: { data: Array<{ week: string; created: number; completed: number }> }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">No trend data available</p>;
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.created, d.completed)), 1);

  return (
    <div className="space-y-3">
      {data.slice(-8).map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-16 flex-shrink-0">
            {new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <div className="flex-1 flex gap-1">
            <div
              className="h-4 bg-blue-500 rounded"
              style={{ width: `${(item.created / maxValue) * 100}%`, minWidth: item.created > 0 ? '4px' : '0' }}
              title={`Created: ${item.created}`}
            />
            <div
              className="h-4 bg-green-500 rounded"
              style={{ width: `${(item.completed / maxValue) * 100}%`, minWidth: item.completed > 0 ? '4px' : '0' }}
              title={`Completed: ${item.completed}`}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> Created</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Completed</span>
      </div>
    </div>
  );
}

// Status Distribution Chart
function StatusChart({ data }: { data: Array<{ status: string; count: number }> }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  const statusColors: Record<string, string> = {
    OPEN: 'bg-gray-400',
    IN_PROGRESS: 'bg-blue-500',
    ON_HOLD: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-400',
  };

  if (total === 0) {
    return <p className="text-sm text-gray-500">No status data available</p>;
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.status} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-24">{item.status.replace('_', ' ')}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
            <div
              className={`h-full ${statusColors[item.status] || 'bg-gray-400'}`}
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-8">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

// Bar Chart Component
function BarChart({ data, labelKey, valueKey }: { data: Array<Record<string, unknown>>; labelKey: string; valueKey: string }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">No data available</p>;
  }

  const maxValue = Math.max(...data.map(d => d[valueKey] as number), 1);

  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-28 truncate">{String(item[labelKey]).replace('_', ' ')}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className={`h-full ${colors[i % colors.length]}`}
              style={{ width: `${((item[valueKey] as number) / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700 w-8">{item[valueKey] as number}</span>
        </div>
      ))}
    </div>
  );
}