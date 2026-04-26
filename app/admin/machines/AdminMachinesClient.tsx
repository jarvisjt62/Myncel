'use client';

import { useState } from 'react';

interface Machine {
  id: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  location: string | null;
  category: string;
  criticality: string;
  status: string;
  totalHours: number;
  lastServiceAt: string | null;
  yearInstalled: number | null;
  notes: string | null;
  organization?: { name: string; plan: string } | null;
  _count: { workOrders: number; alerts: number; maintenanceTasks: number };
}

const statusColors: Record<string, string> = {
  OPERATIONAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MAINTENANCE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BREAKDOWN: 'bg-red-500/20 text-red-400 border-red-500/30',
  RETIRED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const criticalityColors: Record<string, string> = {
  HIGH: 'text-red-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-emerald-400',
};

const categoryLabels: Record<string, string> = {
  CNC_MILL: 'CNC Mill', CNC_LATHE: 'CNC Lathe', PRESS: 'Press',
  HYDRAULIC: 'Hydraulic', COMPRESSOR: 'Compressor', CONVEYOR: 'Conveyor',
  WELDER: 'Welder', INJECTION_MOLD: 'Injection Mold', ASSEMBLY: 'Assembly', OTHER: 'Other',
};

const statusDot: Record<string, string> = {
  OPERATIONAL: 'bg-emerald-400',
  MAINTENANCE: 'bg-yellow-400',
  BREAKDOWN: 'bg-red-400',
  RETIRED: 'bg-gray-400',
};

export default function AdminMachinesClient({ machines: initial }: { machines: Machine[] }) {
  const [machines, setMachines] = useState<Machine[]>(initial);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [search, setSearch] = useState('');

  const filtered = machines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.organization?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = async (m: Machine) => {
    setSelected(m);
    setDetail(null);
    setEditMode(false);
    setEditForm({
      status: m.status,
      location: m.location || '',
      notes: m.notes || '',
      criticality: m.criticality,
      model: m.model || '',
      manufacturer: m.manufacturer || '',
    });
    setSaveMsg('');
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/machines/${m.id}`);
      if (res.ok) setDetail(await res.json());
    } catch { /* use basic data */ }
    setLoadingDetail(false);
  };

  const deleteMachine = async (machineId: string) => {
    setDeletingId(machineId);
    try {
      const res = await fetch(`/api/machines/${machineId}`, { method: 'DELETE' });
      if (res.ok) {
        setMachines(prev => prev.filter(m => m.id !== machineId));
        setConfirmDelete(null);
        setSelected(null);
      }
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/machines/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setMachines(prev => prev.map(m => m.id === selected.id ? { ...m, ...updated.machine } : m));
        setSelected(prev => prev ? { ...prev, ...updated.machine } : prev);
        setSaveMsg('✅ Saved successfully!');
        setEditMode(false);
      } else {
        setSaveMsg('❌ Failed to save.');
      }
    } catch { setSaveMsg('❌ Error saving.'); }
    setSaving(false);
  };

  const totalOperational = machines.filter(m => m.status === 'OPERATIONAL').length;
  const totalMaintenance = machines.filter(m => m.status === 'MAINTENANCE').length;
  const totalBreakdown = machines.filter(m => m.status === 'BREAKDOWN').length;

  const m = detail || selected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Machines</h1>
          <p className="text-[#8892a4] mt-1">{machines.length} total machines across all organizations</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search machines..."
          className="bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-4 py-2 text-sm text-white placeholder-[#8892a4] focus:outline-none focus:border-[#635bff] w-64"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Machines', value: machines.length, color: 'text-white', bg: 'bg-[#0d1426]' },
          { label: 'Operational', value: totalOperational, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
          { label: 'In Maintenance', value: totalMaintenance, color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20' },
          { label: 'Breakdown', value: totalBreakdown, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border border-[#1e2d4a] rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[#8892a4] text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2d4a]">
                <th className="text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-6 py-3">Machine</th>
                <th className="text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-6 py-3">Organization</th>
                <th className="text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-6 py-3">Criticality</th>
                <th className="text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-6 py-3">Category</th>
                <th className="text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-6 py-3">Work Orders</th>
                <th className="text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-6 py-3">Alerts</th>
                <th className="text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-6 py-3">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {filtered.map((machine) => (
                <tr
                  key={machine.id}
                  onClick={() => openDetail(machine)}
                  className="hover:bg-[#1e2d4a]/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[machine.status] || 'bg-gray-400'}`} />
                      <div>
                        <p className="text-white text-sm font-medium">{machine.name}</p>
                        <p className="text-[#8892a4] text-xs">{machine.manufacturer} {machine.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="text-white text-sm">{machine.organization?.name || '—'}</p>
                    <p className="text-[#8892a4] text-xs">{machine.organization?.plan}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[machine.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {machine.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`text-sm font-semibold ${criticalityColors[machine.criticality] || 'text-white'}`}>
                      {machine.criticality}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-[#8892a4] text-sm">{categoryLabels[machine.category] || machine.category}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-white text-sm font-medium">{machine._count.workOrders}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`text-sm font-medium ${machine._count.alerts > 0 ? 'text-red-400' : 'text-[#8892a4]'}`}>
                      {machine._count.alerts}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-[#8892a4] text-sm">{machine.totalHours.toLocaleString()}h</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#8892a4]">No machines found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Machine Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setSelected(null); setDetail(null); setEditMode(false); }} />
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1e2d4a]">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusDot[selected.status] || 'bg-gray-400'}`} />
                <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[selected.status] || ''}`}>{selected.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(true)} className="text-xs text-[#635bff] border border-[#635bff]/40 px-3 py-1.5 rounded-lg hover:bg-[#635bff]/10 transition-colors">
                      ✏️ Edit
                    </button>
                    <button onClick={() => setConfirmDelete(selected)} className="text-xs text-red-400 border border-red-500/40 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                      🗑️ Delete
                    </button>
                  </div>
                )}
                <button onClick={() => { setSelected(null); setDetail(null); setEditMode(false); }} className="text-[#8892a4] hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {loadingDetail && <p className="text-sm text-[#8892a4] animate-pulse">Loading full details…</p>}

              {/* Edit Form */}
              {editMode ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Edit Machine Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1">Status</label>
                      <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                        className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]">
                        <option value="OPERATIONAL">✅ OPERATIONAL</option>
                        <option value="MAINTENANCE">🔧 MAINTENANCE</option>
                        <option value="BREAKDOWN">🚨 BREAKDOWN</option>
                        <option value="RETIRED">⛔ RETIRED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1">Criticality</label>
                      <select value={editForm.criticality} onChange={e => setEditForm({...editForm, criticality: e.target.value})}
                        className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]">
                        <option value="HIGH">🔴 HIGH</option>
                        <option value="MEDIUM">🟡 MEDIUM</option>
                        <option value="LOW">🟢 LOW</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1">Manufacturer</label>
                      <input value={editForm.manufacturer} onChange={e => setEditForm({...editForm, manufacturer: e.target.value})}
                        placeholder="e.g. Haas" className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1">Model</label>
                      <input value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})}
                        placeholder="e.g. VF-2SS" className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1">Location / Zone</label>
                      <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})}
                        placeholder="e.g. Plant 1 — Bay A" className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1">Notes</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={3}
                      className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]" />
                  </div>
                  {saveMsg && <p className="text-sm">{saveMsg}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setEditMode(false)} className="flex-1 px-4 py-2 border border-[#2d3f5e] rounded-lg text-sm text-[#8892a4] hover:bg-[#1e2d4a]">Cancel</button>
                    <button onClick={saveEdit} disabled={saving} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">
                      {saving ? 'Saving…' : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { label: 'Model', value: m?.model },
                      { label: 'Manufacturer', value: m?.manufacturer },
                      { label: 'Serial Number', value: m?.serialNumber },
                      { label: 'Location', value: m?.location },
                      { label: 'Category', value: categoryLabels[m?.category] || m?.category },
                      { label: 'Criticality', value: m?.criticality },
                      { label: 'Year Installed', value: m?.yearInstalled },
                      { label: 'Total Hours', value: m?.totalHours ? `${Number(m.totalHours).toLocaleString()} hrs` : null },
                      { label: 'Last Service', value: m?.lastServiceAt ? new Date(m.lastServiceAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never' },
                      { label: 'Organization', value: selected.organization?.name },
                      { label: 'Work Orders', value: selected._count?.workOrders },
                      { label: 'Active Alerts', value: selected._count?.alerts },
                    ] as {label:string;value:any}[]).map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs font-semibold text-[#8892a4] uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-white mt-0.5">{value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  {m?.notes && (
                    <div>
                      <p className="text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-[#8892a4] bg-[#1e2d4a] rounded-lg p-3">{m.notes}</p>
                    </div>
                  )}
                  {/* Recent Work Orders */}
                  {detail?.workOrders?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-2">Recent Work Orders</p>
                      <div className="space-y-2">
                        {detail.workOrders.map((wo: any) => (
                          <div key={wo.id} className="flex items-center justify-between bg-[#1e2d4a] rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs font-mono text-[#635bff]">{wo.woNumber}</p>
                              <p className="text-sm font-medium text-white">{wo.title}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[wo.status] || ''}`}>{wo.status.replace('_',' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Maintenance Tasks */}
                  {detail?.maintenanceTasks?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-2">Maintenance Schedule</p>
                      <div className="space-y-2">
                        {detail.maintenanceTasks.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between bg-[#1e2d4a] rounded-lg px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-white">{t.title}</p>
                              <p className="text-xs text-[#8892a4]">{t.frequency} · Next: {t.nextDueAt ? new Date(t.nextDueAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}</p>
                            </div>
                            <span className="text-xs text-[#8892a4]">{t.priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Active Alerts */}
                  {detail?.alerts?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#8892a4] uppercase tracking-wide mb-2">Active Alerts</p>
                      <div className="space-y-2">
                        {detail.alerts.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between bg-[#1e2d4a] rounded-lg px-3 py-2 border-l-4 border-red-500/60">
                            <p className="text-sm font-medium text-white">{a.title}</p>
                            <span className="text-xs text-red-400 font-semibold">{a.severity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end pt-2">
                <button onClick={() => { setSelected(null); setDetail(null); setEditMode(false); }}
                  className="px-4 py-2 text-sm text-[#8892a4] border border-[#1e2d4a] rounded-lg hover:bg-[#1e2d4a]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Machine */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Machine?</h3>
              <p className="text-sm text-[#8892a4] mb-6">Delete <strong className="text-white">{confirmDelete?.name}</strong>? This removes all work orders and maintenance tasks for this machine.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-[#2d3f5e] rounded-lg text-sm text-[#8892a4] hover:bg-[#1e2d4a]">Cancel</button>
                <button onClick={() => deleteMachine(confirmDelete.id)} disabled={!!deletingId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  {deletingId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}