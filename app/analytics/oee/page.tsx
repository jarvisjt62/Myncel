'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Machine {
  id: string;
  name: string;
  status: string;
  location?: string;
}

interface OEEData {
  machineId: string;
  machineName: string;
  availability: number;   // 0-100%
  performance: number;    // 0-100%
  quality: number;        // 0-100%
  oee: number;            // 0-100% = A × P × Q
  plannedTime: number;    // hours
  actualRuntime: number;  // hours
  downtime: number;       // hours
  totalCycles?: number;
  goodCycles?: number;
  period: string;
}

type PeriodKey = '7d' | '30d' | '90d';

const OEE_BENCHMARKS = {
  worldClass: 85,
  good: 65,
  fair: 45,
};

function getOEEColor(oee: number): string {
  if (oee >= OEE_BENCHMARKS.worldClass) return '#10b981'; // emerald
  if (oee >= OEE_BENCHMARKS.good) return '#3b82f6';       // blue
  if (oee >= OEE_BENCHMARKS.fair) return '#f59e0b';       // amber
  return '#ef4444';                                         // red
}

function getOEELabel(oee: number): string {
  if (oee >= OEE_BENCHMARKS.worldClass) return 'World Class';
  if (oee >= OEE_BENCHMARKS.good) return 'Good';
  if (oee >= OEE_BENCHMARKS.fair) return 'Fair';
  return 'Needs Improvement';
}

function OEEGauge({ value, color }: { value: number; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e6ebf1" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className="text-lg font-bold text-[#0a2540]">{value.toFixed(0)}%</span>
    </div>
  );
}

export default function OEEPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [oeeData, setOeeData] = useState<OEEData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch machines
      const machRes = await fetch('/api/machines?limit=100');
      if (machRes.ok) {
        const data = await machRes.json();
        const mList: Machine[] = data.machines || data.data || [];
        setMachines(mList);

        // Generate OEE data from work orders and alerts
        const woRes = await fetch(`/api/work-orders?limit=500&period=${period}`);
        const alertRes = await fetch(`/api/alerts?limit=500`);

        const woData = woRes.ok ? await woRes.json() : { workOrders: [] };
        const alertData = alertRes.ok ? await alertRes.json() : { alerts: [] };

        const workOrders = woData.workOrders || woData.data || [];
        const alerts = alertData.alerts || alertData.data || [];

        // Calculate OEE per machine
        const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const periodHours = periodDays * 24;

        const oeeList: OEEData[] = mList.map(machine => {
          // Estimate downtime from alerts and work orders for this machine
          const machineAlerts = alerts.filter((a: any) =>
            a.machineId === machine.id && ['CRITICAL', 'HIGH'].includes(a.severity)
          );
          const machineWOs = workOrders.filter((wo: any) => wo.machineId === machine.id);
          const completedWOs = machineWOs.filter((wo: any) => wo.status === 'COMPLETED');
          const openWOs = machineWOs.filter((wo: any) => ['OPEN', 'IN_PROGRESS'].includes(wo.status));

          // Estimate downtime: each critical alert = ~4h, high alert = ~2h, open WO = ~1h
          const estimatedDowntime = Math.min(
            periodHours * 0.4, // cap at 40% downtime
            (machineAlerts.filter((a: any) => a.severity === 'CRITICAL').length * 4) +
            (machineAlerts.filter((a: any) => a.severity === 'HIGH').length * 2) +
            (openWOs.length * 1.5)
          );

          const plannedTime = periodDays * 16; // 16 working hours/day
          const actualRuntime = Math.max(0, plannedTime - estimatedDowntime);
          const availability = Math.min(100, Math.max(0, (actualRuntime / plannedTime) * 100));

          // Performance: based on completed vs total expected work orders
          const expectedWOs = Math.max(1, periodDays * 0.5); // ~0.5 WOs per day per machine
          const performanceRatio = Math.min(1, completedWOs.length / expectedWOs);
          const performance = Math.min(100, Math.max(40,
            machine.status === 'DOWN' ? 30 :
            machine.status === 'MAINTENANCE' ? 60 :
            85 + performanceRatio * 10
          ));

          // Quality: based on % of work orders completed vs created (re-work proxy)
          const totalWOs = machineWOs.length;
          const quality = totalWOs === 0 ? 95 : Math.min(100, Math.max(60,
            (completedWOs.length / Math.max(1, totalWOs)) * 100 * 0.15 + 85
          ));

          const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

          return {
            machineId: machine.id,
            machineName: machine.name,
            availability: Math.round(availability * 10) / 10,
            performance: Math.round(performance * 10) / 10,
            quality: Math.round(quality * 10) / 10,
            oee: Math.round(oee * 10) / 10,
            plannedTime: Math.round(plannedTime),
            actualRuntime: Math.round(actualRuntime),
            downtime: Math.round(estimatedDowntime * 10) / 10,
            totalCycles: completedWOs.length,
            goodCycles: completedWOs.length,
            period,
          };
        });

        setOeeData(oeeList);
      }
    } catch (e) {
      console.error('Failed to fetch OEE data:', e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredData = selectedMachine === 'all'
    ? oeeData
    : oeeData.filter(d => d.machineId === selectedMachine);

  const avgOEE = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.oee, 0) / filteredData.length
    : 0;

  const avgAvailability = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.availability, 0) / filteredData.length
    : 0;

  const avgPerformance = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.performance, 0) / filteredData.length
    : 0;

  const avgQuality = filteredData.length > 0
    ? filteredData.reduce((sum, d) => sum + d.quality, 0) / filteredData.length
    : 0;

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Header */}
      <div className="bg-white border-b border-[#e6ebf1]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link href="/analytics" className="text-[#635bff] hover:underline text-sm">← Analytics</Link>
              <span className="text-[#e6ebf1]">/</span>
              <h1 className="text-xl font-bold text-[#0a2540]">OEE — Overall Equipment Effectiveness</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Period selector */}
              <div className="flex border border-[#e6ebf1] rounded-lg overflow-hidden bg-white">
                {(['7d', '30d', '90d'] as PeriodKey[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      period === p ? 'bg-[#635bff] text-white' : 'text-[#425466] hover:bg-[#f6f9fc]'
                    }`}
                  >
                    {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
              {/* Machine filter */}
              <select
                value={selectedMachine}
                onChange={e => setSelectedMachine(e.target.value)}
                className="px-3 py-2 text-sm border border-[#e6ebf1] rounded-lg bg-white text-[#425466] focus:outline-none focus:border-[#635bff]"
              >
                <option value="all">All Machines</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* OEE Formula explainer */}
        <div className="bg-white rounded-xl border border-[#e6ebf1] p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-sm font-semibold text-[#0a2540]">OEE Formula:</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">Availability</span>
              <span className="text-[#8898aa]">×</span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">Performance</span>
              <span className="text-[#8898aa]">×</span>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">Quality</span>
              <span className="text-[#8898aa]">=</span>
              <span className="bg-[#635bff] text-white px-3 py-1 rounded-full font-semibold">OEE</span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-[#8898aa]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> ≥{OEE_BENCHMARKS.worldClass}% World Class</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> ≥{OEE_BENCHMARKS.good}% Good</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> ≥{OEE_BENCHMARKS.fair}% Fair</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Below Fair</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#e6ebf1] p-12 text-center text-[#8898aa]">Calculating OEE…</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Overall OEE', value: avgOEE, color: getOEEColor(avgOEE), desc: getOEELabel(avgOEE) },
                { label: 'Avg Availability', value: avgAvailability, color: '#3b82f6', desc: 'Uptime vs planned time' },
                { label: 'Avg Performance', value: avgPerformance, color: '#8b5cf6', desc: 'Speed vs ideal rate' },
                { label: 'Avg Quality', value: avgQuality, color: '#10b981', desc: 'Good output rate' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl border border-[#e6ebf1] p-5 flex items-center gap-4">
                  <OEEGauge value={Math.round(card.value * 10) / 10} color={card.color} />
                  <div>
                    <p className="text-xs text-[#8898aa] uppercase tracking-wide">{card.label}</p>
                    <p className="text-sm font-semibold text-[#0a2540] mt-0.5">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Per-machine OEE table */}
            <div className="bg-white rounded-xl border border-[#e6ebf1] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e6ebf1]">
                <h2 className="font-semibold text-[#0a2540]">OEE by Machine</h2>
                <p className="text-sm text-[#425466]">
                  Last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}
                  {selectedMachine !== 'all' && ` — ${machines.find(m => m.id === selectedMachine)?.name}`}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f6f9fc] border-b border-[#e6ebf1]">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">Machine</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">OEE</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-blue-500 uppercase tracking-wide">Availability</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-purple-500 uppercase tracking-wide">Performance</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-500 uppercase tracking-wide">Quality</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">Downtime</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#8898aa] uppercase tracking-wide">WOs Done</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f4f8]">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-[#8898aa]">No data available</td>
                      </tr>
                    ) : (
                      filteredData
                        .sort((a, b) => b.oee - a.oee)
                        .map(d => {
                          const oeeColor = getOEEColor(d.oee);
                          return (
                            <tr key={d.machineId} className="hover:bg-[#f6f9fc] transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-medium text-[#0a2540]">{d.machineName}</p>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-24 bg-[#f0f4f8] rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full transition-all"
                                      style={{ width: `${d.oee}%`, background: oeeColor }}
                                    />
                                  </div>
                                  <span className="font-bold w-14 text-right" style={{ color: oeeColor }}>
                                    {d.oee.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-blue-600 font-medium">{d.availability.toFixed(1)}%</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-purple-600 font-medium">{d.performance.toFixed(1)}%</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-emerald-600 font-medium">{d.quality.toFixed(1)}%</span>
                              </td>
                              <td className="px-4 py-4 text-right text-[#425466]">
                                {d.downtime}h
                              </td>
                              <td className="px-4 py-4 text-right text-[#425466]">
                                {d.totalCycles}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OEE improvement tips */}
            {avgOEE < OEE_BENCHMARKS.worldClass && (
              <div className="bg-white rounded-xl border border-[#e6ebf1] p-5">
                <h3 className="font-semibold text-[#0a2540] mb-3">💡 How to Improve Your OEE</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {avgAvailability < 90 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <p className="text-sm font-semibold text-blue-700 mb-1">📈 Improve Availability ({avgAvailability.toFixed(0)}%)</p>
                      <p className="text-xs text-blue-600">Reduce unplanned downtime by setting up preventive maintenance schedules. Each PM task caught early prevents hours of breakdown time.</p>
                      <Link href="/maintenance" className="text-xs text-blue-700 font-semibold hover:underline mt-2 inline-block">Set up PM schedules →</Link>
                    </div>
                  )}
                  {avgPerformance < 85 && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <p className="text-sm font-semibold text-purple-700 mb-1">⚡ Improve Performance ({avgPerformance.toFixed(0)}%)</p>
                      <p className="text-xs text-purple-600">Close open work orders promptly and reduce equipment idle time. Track cycle times and compare to equipment specifications.</p>
                      <Link href="/work-orders" className="text-xs text-purple-700 font-semibold hover:underline mt-2 inline-block">View open work orders →</Link>
                    </div>
                  )}
                  {avgQuality < 95 && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <p className="text-sm font-semibold text-emerald-700 mb-1">✅ Improve Quality ({avgQuality.toFixed(0)}%)</p>
                      <p className="text-xs text-emerald-600">Reduce rework and defects by completing all preventive maintenance on schedule. Well-maintained equipment produces better output.</p>
                      <Link href="/maintenance" className="text-xs text-emerald-700 font-semibold hover:underline mt-2 inline-block">View maintenance tasks →</Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}