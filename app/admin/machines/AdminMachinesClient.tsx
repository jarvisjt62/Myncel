'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

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
  imageUrl?: string | null;
  organization?: { name: string; plan: string } | null;
  _count: { workOrders: number; alerts: number; maintenanceTasks: number };
}

const statusColors: Record<string, string> = {
  OPERATIONAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MAINTENANCE:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BREAKDOWN:    'bg-red-500/20 text-red-400 border-red-500/30',
  RETIRED:      'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
const criticalityColors: Record<string, string> = {
  HIGH: 'text-red-400', MEDIUM: 'text-yellow-400', LOW: 'text-emerald-400',
};
const statusDot: Record<string, string> = {
  OPERATIONAL: 'bg-emerald-400', MAINTENANCE: 'bg-yellow-400',
  BREAKDOWN: 'bg-red-400', RETIRED: 'bg-gray-400',
};
const categoryLabels: Record<string, string> = {
  CNC_MILL: 'CNC Mill', CNC_LATHE: 'CNC Lathe', PRESS: 'Press / Brake',
  HYDRAULIC: 'Hydraulic System', COMPRESSOR: 'Compressor', CONVEYOR: 'Conveyor',
  WELDER: 'Welder', INJECTION_MOLD: 'Injection Mold', ASSEMBLY: 'Assembly Line',
  LASER_CUTTER: 'Laser Cutter', PLASMA_CUTTER: 'Plasma Cutter',
  GRINDER: 'Grinder', DRILL_PRESS: 'Drill Press', PUNCH_PRESS: 'Punch Press',
  PUMP: 'Pump / Fluid System', BOILER: 'Boiler / Furnace', GENERATOR: 'Generator',
  CRANE: 'Crane / Hoist', ROBOT: 'Industrial Robot', HEAT_TREATMENT: 'Heat Treatment',
  MEASURING: 'CMM / Measuring', PACKAGING: 'Packaging', FORKLIFT: 'Forklift / AGV',
  VEHICLE_LIGHT: 'Car / Light Truck', VEHICLE_HEAVY: 'Heavy Truck / Bus',
  VESSEL: 'Vessel / Boat', DRONE_UAV: 'Drone / UAV',
  OTHER: 'Other',
};

const PAGE_SIZE = 15;

type SortKey = 'name' | 'organization' | 'status' | 'criticality' | 'category' | 'workOrders' | 'alerts' | 'hours';
type SortDir = 'asc' | 'desc';

const SORT_ORDER: Record<string, number> = {
  BREAKDOWN: 0, MAINTENANCE: 1, OPERATIONAL: 2, RETIRED: 3,
  HIGH: 0, MEDIUM: 1, LOW: 2,
};

// ── SortIcon defined outside component to prevent remount on re-render ──
const SortIcon = ({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: string }) => (
  <span className="ml-1 inline-block text-[10px] opacity-50">
    {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
  </span>
);

export default function AdminMachinesClient({ machines: initial }: { machines: Machine[] }) {
  const [machines, setMachines]         = useState<Machine[]>(initial);
  const [selected, setSelected]         = useState<Machine | null>(null);
  const [detail, setDetail]             = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editMode, setEditMode]         = useState(false);
  const [editForm, setEditForm]         = useState<any>({});
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');
  const [gatewayMsg, setGatewayMsg]     = useState('');
  const [gatewayTokenName, setGatewayTokenName] = useState('');
  const [creatingGatewayToken, setCreatingGatewayToken] = useState(false);
  const [newGatewayToken, setNewGatewayToken] = useState('');
  const [selectedWo, setSelectedWo] = useState<any>(null);
  const [editingWo, setEditingWo] = useState<any>(null);
  const [editWoForm, setEditWoForm] = useState<any>({});
  const [confirmDeleteWo, setConfirmDeleteWo] = useState<any>(null);
  const [deletingWoId, setDeletingWoId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [editAlertForm, setEditAlertForm] = useState<any>({});
  const [confirmDeleteAlert, setConfirmDeleteAlert] = useState<any>(null);
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const openedFromQueryRef              = useRef(false);

  // ── Search & Filter state ──────────────────────────────────────
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCrit, setFilterCrit]     = useState('ALL');
  const [filterCat, setFilterCat]       = useState('ALL');
  const [filterOrg, setFilterOrg]       = useState('ALL');
  const [sortKey, setSortKey]           = useState<SortKey>('name');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');
  const [page, setPage]                 = useState(1);

  // ── Derived unique org list for org filter dropdown ────────────
  const orgList = useMemo(() => {
    const names = Array.from(new Set(machines.map(m => m.organization?.name || '—').filter(Boolean)));
    return names.sort();
  }, [machines]);

  // ── Search: matches name, org, status, criticality, category, hours, WO count, alert count ──
  const matchesSearch = (m: Machine, q: string) => {
    if (!q) return true;
    const lq = q.toLowerCase().trim();
    const catLabel = (categoryLabels[m.category] || m.category).toLowerCase();
    return (
      m.name.toLowerCase().includes(lq) ||
      (m.organization?.name || '').toLowerCase().includes(lq) ||
      (m.location || '').toLowerCase().includes(lq) ||
      (m.manufacturer || '').toLowerCase().includes(lq) ||
      (m.model || '').toLowerCase().includes(lq) ||
      (m.serialNumber || '').toLowerCase().includes(lq) ||
      m.status.toLowerCase().includes(lq) ||
      m.criticality.toLowerCase().includes(lq) ||
      catLabel.includes(lq) ||
      m.category.toLowerCase().replace(/_/g, ' ').includes(lq) ||
      String(m._count.workOrders).includes(lq) ||
      String(m._count.alerts).includes(lq) ||
      String(Math.round(m.totalHours)).includes(lq)
    );
  };

  // ── Combined filter + sort ─────────────────────────────────────
  const processed = useMemo(() => {
    let list = machines.filter(m => {
      if (!matchesSearch(m, search)) return false;
      if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
      if (filterCrit   !== 'ALL' && m.criticality !== filterCrit) return false;
      if (filterCat    !== 'ALL' && m.category !== filterCat) return false;
      if (filterOrg    !== 'ALL' && (m.organization?.name || '—') !== filterOrg) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':         cmp = a.name.localeCompare(b.name); break;
        case 'organization': cmp = (a.organization?.name||'').localeCompare(b.organization?.name||''); break;
        case 'status':       cmp = (SORT_ORDER[a.status]??9) - (SORT_ORDER[b.status]??9); break;
        case 'criticality':  cmp = (SORT_ORDER[a.criticality]??9) - (SORT_ORDER[b.criticality]??9); break;
        case 'category':     cmp = (categoryLabels[a.category]||a.category).localeCompare(categoryLabels[b.category]||b.category); break;
        case 'workOrders':   cmp = a._count.workOrders - b._count.workOrders; break;
        case 'alerts':       cmp = a._count.alerts - b._count.alerts; break;
        case 'hours':        cmp = a.totalHours - b.totalHours; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [machines, search, filterStatus, filterCrit, filterCat, filterOrg, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const resetFilters = () => {
    setSearch(''); setFilterStatus('ALL'); setFilterCrit('ALL');
    setFilterCat('ALL'); setFilterOrg('ALL'); setPage(1);
  };

  const hasActiveFilters = search || filterStatus !== 'ALL' || filterCrit !== 'ALL' || filterCat !== 'ALL' || filterOrg !== 'ALL';

  // SortIcon is defined outside this component to prevent remount on re-render

  // ── Detail modal ───────────────────────────────────────────────
  const openDetail = async (m: Machine) => {
    setSelected(m); setDetail(null); setEditMode(false);
    setEditForm({ status: m.status, location: m.location||'', notes: m.notes||'', imageUrl: m.imageUrl || null,
      criticality: m.criticality, model: m.model||'', manufacturer: m.manufacturer||'' });
    setSaveMsg(''); setGatewayMsg(''); setNewGatewayToken(''); setGatewayTokenName(`${m.name} edge gateway`); setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/machines/${m.id}`);
      if (res.ok) {
        const fullDetail = await res.json();
        setDetail(fullDetail);
        setEditForm((prev: any) => ({ ...prev, imageUrl: fullDetail.imageUrl || null }));
      }
    }
    catch { /* use basic data */ }
    setLoadingDetail(false);
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
    setEditMode(false);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('machineId')) {
        url.searchParams.delete('machineId');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      }
    }
  };

  useEffect(() => {
    if (openedFromQueryRef.current || typeof window === 'undefined') return;

    const machineId = new URLSearchParams(window.location.search).get('machineId');
    if (!machineId) return;

    const target = machines.find(m => m.id === machineId);
    if (!target) return;

    openedFromQueryRef.current = true;

    // Clear filters so the machine is visible behind the modal after closing.
    setSearch('');
    setFilterStatus('ALL');
    setFilterCrit('ALL');
    setFilterCat('ALL');
    setFilterOrg('ALL');
    setPage(1);

    openDetail(target);
  }, [machines]);

  const deleteMachine = async (machineId: string) => {
    setDeletingId(machineId);
    try {
      const res = await fetch(`/api/machines/${machineId}`, { method: 'DELETE' });
      if (res.ok) { setMachines(prev => prev.filter(m => m.id !== machineId)); setConfirmDelete(null); closeDetail(); }
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  const syncMachineImage = (machineId: string, imageUrl: string | null) => {
    setMachines(prev => prev.map(m => m.id === machineId ? { ...m, imageUrl } : m));
    setSelected(prev => prev?.id === machineId ? { ...prev, imageUrl } : prev);
    setDetail((prev: any) => prev?.id === machineId ? { ...prev, imageUrl } : prev);
    setEditForm((prev: any) => ({ ...prev, imageUrl }));
  };

  const removeMachineImage = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/machines/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null }),
      });
      if (res.ok) {
        syncMachineImage(selected.id, null);
        setSaveMsg('✅ Image removed.');
      } else {
        setSaveMsg('❌ Failed to remove image.');
      }
    } catch {
      setSaveMsg('❌ Error removing image.');
    }
  };


  const isGatewayOnline = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return false;
    return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
  };

  const connectorFromGatewayName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('opc')) return 'OPC UA';
    if (lower.includes('mqtt') || lower.includes('esp32')) return 'MQTT';
    if (lower.includes('modbus')) return 'Modbus';
    if (lower.includes('bacnet')) return 'BACnet/IP';
    if (lower.includes('s7') || lower.includes('siemens')) return 'Siemens S7';
    if (lower.includes('rockwell') || lower.includes('ethernet')) return 'Rockwell EtherNet/IP';
    if (lower.includes('beckhoff') || lower.includes('ads')) return 'Beckhoff ADS';
    if (lower.includes('mtconnect') || lower.includes('cnc')) return 'MTConnect';
    return 'Gateway agent';
  };

  const createGatewayToken = async () => {
    if (!selected) return;
    setCreatingGatewayToken(true);
    setGatewayMsg('');
    setNewGatewayToken('');
    try {
      const res = await fetch(`/api/machines/${selected.id}/device-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: gatewayTokenName || `${selected.name} edge gateway` }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewGatewayToken(data.deviceToken);
        setGatewayMsg('✅ Gateway token created. Copy it now; it will not be shown again.');
        setDetail((prev: any) => prev ? {
          ...prev,
          machineDeviceTokens: [data.token, ...(prev.machineDeviceTokens || [])],
        } : prev);
      } else {
        setGatewayMsg(`❌ ${data.error || 'Failed to create gateway token.'}`);
      }
    } catch {
      setGatewayMsg('❌ Error creating gateway token.');
    }
    setCreatingGatewayToken(false);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch(`/api/machines/${selected.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setMachines(prev => prev.map(m => m.id === selected.id ? { ...m, ...updated.machine } : m));
        setSelected(prev => prev ? { ...prev, ...updated.machine } : prev);
        setDetail((prev: any) => prev ? { ...prev, ...updated.machine } : prev);
        setSaveMsg('✅ Saved successfully!'); setEditMode(false);
      } else { setSaveMsg('❌ Failed to save.'); }
    } catch { setSaveMsg('❌ Error saving.'); }
    setSaving(false);
  };

  const openEditWo = (wo: any) => {
    setEditingWo(wo);
    setEditWoForm({
      title: wo.title || '',
      description: wo.description || '',
      type: wo.type || 'PREVENTIVE',
      priority: wo.priority || 'MEDIUM',
      status: wo.status || 'OPEN',
      dueAt: wo.dueAt ? new Date(wo.dueAt).toISOString().slice(0, 16) : '',
      estimatedMinutes: wo.estimatedMinutes || '',
      notes: wo.notes || '',
    });
  };

  const saveEditWo = async () => {
    if (!editingWo) return;
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch(`/api/work-orders/${editingWo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editWoForm),
      });
      const data = await res.json();
      if (res.ok) {
        setDetail((prev: any) => prev ? { ...prev, workOrders: (prev.workOrders || []).map((w: any) => w.id === editingWo.id ? { ...w, ...data.workOrder } : w) } : prev);
        setSelectedWo((prev: any) => prev?.id === editingWo.id ? { ...prev, ...data.workOrder } : prev);
        setEditingWo(null);
        setSaveMsg('✅ Work order saved.');
      } else {
        setSaveMsg(`❌ ${data.error || 'Failed to save work order.'}`);
      }
    } catch {
      setSaveMsg('❌ Error saving work order.');
    }
    setSaving(false);
  };

  const deleteWo = async (woId: string) => {
    setDeletingWoId(woId);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/work-orders/${woId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDetail((prev: any) => prev ? { ...prev, workOrders: (prev.workOrders || []).filter((w: any) => w.id !== woId) } : prev);
        setSelectedWo(null);
        setEditingWo(null);
        setConfirmDeleteWo(null);
        setSaveMsg('✅ Work order deleted.');
      } else {
        setSaveMsg(`❌ ${data.error || 'Failed to delete work order.'}`);
      }
    } catch {
      setSaveMsg('❌ Error deleting work order.');
    }
    setDeletingWoId(null);
  };

  const openEditAlert = (alert: any) => {
    setEditingAlert(alert);
    setEditAlertForm({
      title: alert.title || '',
      message: alert.message || '',
      type: alert.type || 'MAINTENANCE_DUE',
      severity: alert.severity || 'MEDIUM',
      isResolved: !!alert.isResolved,
      isRead: !!alert.isRead,
    });
  };

  const saveEditAlert = async () => {
    if (!editingAlert) return;
    setSaving(true); setSaveMsg('');
    try {
      const res = await fetch(`/api/alerts/${editingAlert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAlertForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const updated = data.alert || { ...editingAlert, ...editAlertForm };
        setDetail((prev: any) => prev ? { ...prev, alerts: (prev.alerts || []).map((a: any) => a.id === editingAlert.id ? { ...a, ...updated } : a) } : prev);
        setSelectedAlert((prev: any) => prev?.id === editingAlert.id ? { ...prev, ...updated } : prev);
        setEditingAlert(null);
        setSaveMsg('✅ Alert saved.');
      } else {
        setSaveMsg(`❌ ${data.error || 'Failed to save alert.'}`);
      }
    } catch {
      setSaveMsg('❌ Error saving alert.');
    }
    setSaving(false);
  };

  const resolveAlert = async (alertId: string) => {
    setResolvingAlertId(alertId);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const fallbackResolvedAt = new Date().toISOString();
        const updated = data.alert || { isResolved: true, isRead: true, resolvedAt: fallbackResolvedAt };
        setDetail((prev: any) => prev ? { ...prev, alerts: (prev.alerts || []).map((a: any) => a.id === alertId ? { ...a, ...updated } : a) } : prev);
        setSelectedAlert((prev: any) => prev?.id === alertId ? { ...prev, ...updated } : prev);
        setEditingAlert((prev: any) => prev?.id === alertId ? { ...prev, ...updated } : prev);
        setSaveMsg('✅ Alert resolved.');
      } else {
        setSaveMsg(`❌ ${data.error || 'Failed to resolve alert.'}`);
      }
    } catch {
      setSaveMsg('❌ Error resolving alert.');
    }
    setResolvingAlertId(null);
  };

  const deleteAlert = async (alertId: string) => {
    setDeletingAlertId(alertId);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDetail((prev: any) => prev ? { ...prev, alerts: (prev.alerts || []).filter((a: any) => a.id !== alertId) } : prev);
        setSelectedAlert(null);
        setEditingAlert(null);
        setConfirmDeleteAlert(null);
        setSaveMsg('✅ Alert deleted.');
      } else {
        setSaveMsg(`❌ ${data.error || 'Failed to delete alert.'}`);
      }
    } catch {
      setSaveMsg('❌ Error deleting alert.');
    }
    setDeletingAlertId(null);
  };

  const totalOperational = machines.filter(m => m.status === 'OPERATIONAL').length;
  const totalMaintenance = machines.filter(m => m.status === 'MAINTENANCE').length;
  const totalBreakdown   = machines.filter(m => m.status === 'BREAKDOWN').length;

  const inputCls  = 'bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#4a5a7a] focus:outline-none focus:border-[#635bff] transition-colors';
  const selectCls = 'bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#635bff] transition-colors cursor-pointer';
  const thCls     = 'text-left text-xs font-semibold text-[#8892a4] uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-white select-none whitespace-nowrap';

  const m = detail || selected;

  // unique categories present in machines list
  const catOptions = useMemo(() => Array.from(new Set(machines.map(m => m.category))).sort(), [machines]);

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Machines</h1>
          <p className="text-[#8892a4] mt-1 text-sm">
            {machines.length} total · showing {processed.length} result{processed.length !== 1 ? 's' : ''}
            {hasActiveFilters && <span className="ml-2 text-[#635bff]">· filtered</span>}
          </p>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Machines', value: machines.length,  color: 'text-white',         bg: 'bg-[#0d1426]' },
          { label: 'Operational',    value: totalOperational, color: 'text-emerald-400',   bg: 'bg-emerald-500/5 border-emerald-500/20' },
          { label: 'In Maintenance', value: totalMaintenance, color: 'text-yellow-400',    bg: 'bg-yellow-500/5 border-yellow-500/20' },
          { label: 'Breakdown',      value: totalBreakdown,   color: 'text-red-400',       bg: 'bg-red-500/5 border-red-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border border-[#1e2d4a] rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[#8892a4] text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter bar ──────────────────────────────── */}
      <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl p-4 space-y-3">
        {/* Search input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5a7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by machine name, organization, status, criticality, category, work orders, alerts, hours…"
            className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#4a5a7a] focus:outline-none focus:border-[#635bff] transition-colors"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5a7a] hover:text-white">✕</button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#8892a4] font-semibold uppercase tracking-wide mr-1">Filter:</span>

          {/* Status */}
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className={selectCls}>
            <option value="ALL">All Statuses</option>
            <option value="OPERATIONAL">🟢 Operational</option>
            <option value="MAINTENANCE">🟡 Maintenance</option>
            <option value="BREAKDOWN">🔴 Breakdown</option>
            <option value="RETIRED">⚫ Retired</option>
          </select>

          {/* Criticality */}
          <select value={filterCrit} onChange={e => { setFilterCrit(e.target.value); setPage(1); }} className={selectCls}>
            <option value="ALL">All Criticality</option>
            <option value="HIGH">🔴 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>

          {/* Category */}
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }} className={selectCls}>
            <option value="ALL">All Categories</option>
            {catOptions.map(c => (
              <option key={c} value={c}>{categoryLabels[c] || c}</option>
            ))}
          </select>

          {/* Organization */}
          <select value={filterOrg} onChange={e => { setFilterOrg(e.target.value); setPage(1); }} className={selectCls}>
            <option value="ALL">All Organizations</option>
            {orgList.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {/* Clear button */}
          {hasActiveFilters && (
            <button onClick={resetFilters} className="ml-auto text-xs text-[#635bff] border border-[#635bff]/40 px-3 py-1.5 rounded-lg hover:bg-[#635bff]/10 transition-colors">
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5">
            {search && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#635bff]/20 text-[#a89fff] border border-[#635bff]/30 rounded-full px-2.5 py-0.5">
                🔍 "{search.length > 20 ? search.slice(0,20)+'…' : search}"
                <button onClick={() => setSearch('')} className="hover:text-white ml-0.5">✕</button>
              </span>
            )}
            {filterStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#1e2d4a] text-[#8892a4] border border-[#2d3f5e] rounded-full px-2.5 py-0.5">
                Status: {filterStatus}
                <button onClick={() => setFilterStatus('ALL')} className="hover:text-white ml-0.5">✕</button>
              </span>
            )}
            {filterCrit !== 'ALL' && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#1e2d4a] text-[#8892a4] border border-[#2d3f5e] rounded-full px-2.5 py-0.5">
                Criticality: {filterCrit}
                <button onClick={() => setFilterCrit('ALL')} className="hover:text-white ml-0.5">✕</button>
              </span>
            )}
            {filterCat !== 'ALL' && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#1e2d4a] text-[#8892a4] border border-[#2d3f5e] rounded-full px-2.5 py-0.5">
                Category: {categoryLabels[filterCat] || filterCat}
                <button onClick={() => setFilterCat('ALL')} className="hover:text-white ml-0.5">✕</button>
              </span>
            )}
            {filterOrg !== 'ALL' && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#1e2d4a] text-[#8892a4] border border-[#2d3f5e] rounded-full px-2.5 py-0.5">
                Org: {filterOrg.length > 20 ? filterOrg.slice(0,20)+'…' : filterOrg}
                <button onClick={() => setFilterOrg('ALL')} className="hover:text-white ml-0.5">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl overflow-hidden">
        {/* Scrollable container with max height */}
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-[#0d1831] border-b border-[#1e2d4a]">
              <tr>
                <th className={thCls} onClick={() => handleSort('name')}>
                  Machine <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('organization')}>
                  Organization <SortIcon col="organization" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('status')}>
                  Status <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('criticality')}>
                  Criticality <SortIcon col="criticality" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('category')}>
                  Category <SortIcon col="category" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('workOrders')}>
                  Work Orders <SortIcon col="workOrders" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('alerts')}>
                  Alerts <SortIcon col="alerts" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className={thCls} onClick={() => handleSort('hours')}>
                  Hours <SortIcon col="hours" sortKey={sortKey} sortDir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]">
              {paginated.map(machine => (
                <tr key={machine.id} onClick={() => openDetail(machine)}
                  className="hover:bg-[#1e2d4a]/50 transition-colors cursor-pointer group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[machine.status] || 'bg-gray-400'}`}/>
                      <div>
                        <p className="text-white text-sm font-medium group-hover:text-[#a89fff] transition-colors">{machine.name}</p>
                        <p className="text-[#8892a4] text-xs">{machine.manufacturer} {machine.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{machine.organization?.name || '—'}</p>
                    <p className="text-[#8892a4] text-xs">{machine.organization?.plan}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[machine.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {machine.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${criticalityColors[machine.criticality] || 'text-white'}`}>
                      {machine.criticality}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#8892a4] text-sm">{categoryLabels[machine.category] || machine.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white text-sm font-medium">{machine._count.workOrders}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${machine._count.alerts > 0 ? 'text-red-400' : 'text-[#8892a4]'}`}>
                      {machine._count.alerts > 0 ? `⚠ ${machine._count.alerts}` : '0'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#8892a4] text-sm">{machine.totalHours.toLocaleString()}h</span>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="text-[#8892a4] space-y-2">
                      <div className="text-3xl">🔍</div>
                      <div className="text-sm font-medium">No machines match your search</div>
                      {hasActiveFilters && (
                        <button onClick={resetFilters} className="text-xs text-[#635bff] hover:underline">Clear all filters</button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e2d4a] bg-[#0d1831]">
            <p className="text-xs text-[#c8d3e8]">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, processed.length)} of {processed.length} machines
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage === 1}
                className="px-2 py-1 rounded text-xs text-[#c8d3e8] hover:text-white hover:bg-[#1e2d4a] disabled:opacity-30 transition-colors">«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="px-2 py-1 rounded text-xs text-[#c8d3e8] hover:text-white hover:bg-[#1e2d4a] disabled:opacity-30 transition-colors">‹ Prev</button>

              {/* Page number buttons — show up to 7 pages */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (arr[i-1] as number) < p - 1) acc.push('...');
                  acc.push(p); return acc;
                }, [])
                .map((p, i) => p === '...'
                  ? <span key={`ellipsis-${i}`} className="px-2 py-1 text-xs text-[#c8d3e8]">…</span>
                  : <button key={p} onClick={() => setPage(p as number)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${safePage === p ? 'bg-[#635bff] text-white' : 'text-[#c8d3e8] hover:text-white hover:bg-[#1e2d4a]'}`}>
                      {p}
                    </button>
                )}

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="px-2 py-1 rounded text-xs text-[#c8d3e8] hover:text-white hover:bg-[#1e2d4a] disabled:opacity-30 transition-colors">Next ›</button>
              <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
                className="px-2 py-1 rounded text-xs text-[#c8d3e8] hover:text-white hover:bg-[#1e2d4a] disabled:opacity-30 transition-colors">»</button>
            </div>
          </div>
        )}

        {/* Row count when only 1 page */}
        {totalPages === 1 && processed.length > 0 && (
          <div className="px-4 py-2.5 border-t border-[#1e2d4a] bg-[#0d1831]">
            <p className="text-xs text-[#c8d3e8]">{processed.length} machine{processed.length !== 1 ? 's' : ''} shown</p>
          </div>
        )}
      </div>

      {/* ── Machine Detail Modal ──────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={closeDetail}/>
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1e2d4a]">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusDot[selected.status] || 'bg-gray-400'}`}/>
                <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[selected.status] || ''}`}>{selected.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(true)} className="text-xs text-[#635bff] border border-[#635bff]/40 px-3 py-1.5 rounded-lg hover:bg-[#635bff]/10 transition-colors">✏️ Edit</button>
                    <button onClick={() => setConfirmDelete(selected)} className="text-xs text-red-400 border border-red-500/40 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">🗑️ Delete</button>
                  </div>
                )}
                <button onClick={closeDetail} className="text-[#c8d3e8] hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {loadingDetail && <p className="text-sm text-[#c8d3e8] animate-pulse">Loading full details…</p>}

              {editMode ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Edit Machine Details</h4>

                  <div>
                    <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-2">Machine Image</p>
                    <div className="flex items-start gap-3 bg-[#101a30] border border-[#1e2d4a] rounded-xl p-3">
                      {(editForm.imageUrl || m?.imageUrl) ? (
                        <img
                          src={editForm.imageUrl || m?.imageUrl}
                          alt={`${selected.name} machine`}
                          className="w-28 h-28 object-cover rounded-xl border border-[#2d3f5e]"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-xl border-2 border-dashed border-[#2d3f5e] flex items-center justify-center bg-[#1e2d4a]">
                          <svg className="w-9 h-9 text-[#8892a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          <label className="cursor-pointer">
                            <div className="px-3 py-2 rounded-lg border border-[#635bff]/40 text-xs text-[#a7a1ff] hover:bg-[#635bff]/10 transition-colors">
                              {(editForm.imageUrl || m?.imageUrl) ? 'Replace Image' : 'Upload Image'}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !selected) return;
                                const fd = new FormData();
                                fd.append('file', file);
                                fd.append('machineId', selected.id);
                                try {
                                  const res = await fetch('/api/machines/upload', { method: 'POST', body: fd });
                                  if (res.ok) {
                                    const { imageUrl } = await res.json();
                                    syncMachineImage(selected.id, imageUrl);
                                    setSaveMsg('✅ Image updated.');
                                    e.currentTarget.value = '';
                                  } else {
                                    setSaveMsg('❌ Failed to upload image.');
                                  }
                                } catch {
                                  setSaveMsg('❌ Error uploading image.');
                                }
                              }}
                            />
                          </label>
                          {(editForm.imageUrl || m?.imageUrl) && (
                            <button
                              type="button"
                              onClick={removeMachineImage}
                              className="px-3 py-2 rounded-lg border border-red-500/40 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-[#8892a4] mt-2">JPG, PNG, WebP, or GIF up to 2MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-1">Status</label>
                      <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                        className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]">
                        <option value="OPERATIONAL">✅ OPERATIONAL</option>
                        <option value="MAINTENANCE">🔧 MAINTENANCE</option>
                        <option value="BREAKDOWN">🚨 BREAKDOWN</option>
                        <option value="RETIRED">⛔ RETIRED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-1">Criticality</label>
                      <select value={editForm.criticality} onChange={e => setEditForm({...editForm, criticality: e.target.value})}
                        className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]">
                        <option value="HIGH">🔴 HIGH</option>
                        <option value="MEDIUM">🟡 MEDIUM</option>
                        <option value="LOW">🟢 LOW</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-1">Manufacturer</label>
                      <input value={editForm.manufacturer} onChange={e => setEditForm({...editForm, manufacturer: e.target.value})}
                        placeholder="e.g. Haas" className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-1">Model</label>
                      <input value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})}
                        placeholder="e.g. VF-2SS" className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]"/>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-1">Location / Zone</label>
                      <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})}
                        placeholder="e.g. Plant 1 — Bay A" className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-1">Notes</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={3}
                      className="w-full bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#635bff]"/>
                  </div>
                  {saveMsg && <p className="text-sm">{saveMsg}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setEditMode(false)} className="flex-1 px-4 py-2 border border-[#2d3f5e] rounded-lg text-sm text-[#c8d3e8] hover:bg-[#1e2d4a]">Cancel</button>
                    <button onClick={saveEdit} disabled={saving} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">
                      {saving ? 'Saving…' : '💾 Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-2">Machine Image</p>
                    {(m?.imageUrl || selected.imageUrl) ? (
                      <img
                        src={m?.imageUrl || selected.imageUrl}
                        alt={`${selected.name} machine`}
                        className="w-full max-h-72 object-cover rounded-xl border border-[#2d3f5e] bg-[#1e2d4a]"
                      />
                    ) : (
                      <div className="h-40 rounded-xl border-2 border-dashed border-[#2d3f5e] flex flex-col items-center justify-center bg-[#1e2d4a] text-[#8892a4]">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No image uploaded for this machine.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { label: 'Model',         value: m?.model },
                      { label: 'Manufacturer',  value: m?.manufacturer },
                      { label: 'Serial Number', value: m?.serialNumber },
                      { label: 'Location',      value: m?.location },
                      { label: 'Category',      value: categoryLabels[m?.category] || m?.category },
                      { label: 'Criticality',   value: m?.criticality },
                      { label: 'Year Installed',value: m?.yearInstalled },
                      { label: 'Total Hours',   value: m?.totalHours ? `${Number(m.totalHours).toLocaleString()} hrs` : null },
                      { label: 'Last Service',  value: m?.lastServiceAt ? new Date(m.lastServiceAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : 'Never' },
                      { label: 'Organization',  value: selected.organization?.name },
                      { label: 'Work Orders',   value: selected._count?.workOrders },
                      { label: 'Active Alerts', value: selected._count?.alerts },
                    ] as {label:string;value:any}[]).map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-white mt-0.5">{value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-[#1e2d4a] bg-[#101a30] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide">Connected Gateways / Last Seen</p>
                        <p className="mt-1 text-sm text-[#8892a4]">Create device tokens for edge gateways and monitor online/offline state, connector type, and last-seen timestamps.</p>
                      </div>
                      <a href="/docs/edge-gateway" className="text-xs text-[#a7a1ff] hover:underline">Gateway docs →</a>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={gatewayTokenName}
                        onChange={e => setGatewayTokenName(e.target.value)}
                        placeholder={`${selected.name} edge gateway`}
                        className="flex-1 bg-[#1e2d4a] border border-[#2d3f5e] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a5a7a] focus:outline-none focus:border-[#635bff]"
                      />
                      <button
                        onClick={createGatewayToken}
                        disabled={creatingGatewayToken}
                        className="px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50"
                      >
                        {creatingGatewayToken ? 'Creating…' : 'Create Gateway Token'}
                      </button>
                    </div>

                    {gatewayMsg && <p className="mt-2 text-sm text-[#c8d3e8]">{gatewayMsg}</p>}
                    {newGatewayToken && (
                      <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Copy this token now</p>
                        <div className="mt-2 flex gap-2">
                          <code className="flex-1 overflow-x-auto rounded bg-black/30 px-3 py-2 text-xs text-emerald-100">{newGatewayToken}</code>
                          <button onClick={() => navigator.clipboard?.writeText(newGatewayToken)} className="rounded border border-emerald-400/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10">Copy</button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 overflow-x-auto rounded-lg border border-[#1e2d4a]">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead className="bg-[#0d1426] text-xs uppercase tracking-wider text-[#8892a4]">
                          <tr>
                            <th className="px-3 py-2 text-left">Gateway</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Last seen</th>
                            <th className="px-3 py-2 text-left">Connector type</th>
                            <th className="px-3 py-2 text-left">Readings count</th>
                            <th className="px-3 py-2 text-left">Token</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail?.machineDeviceTokens?.length > 0 ? detail.machineDeviceTokens.map((token: any) => (
                            <tr key={token.id} className="border-t border-[#1e2d4a]">
                              <td className="px-3 py-2 font-semibold text-white">{token.name}</td>
                              <td className="px-3 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${token.isActive && isGatewayOnline(token.lastSeenAt) ? 'bg-emerald-500/15 text-emerald-300' : token.isActive ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}`}>
                                  {token.isActive && isGatewayOnline(token.lastSeenAt) ? 'online' : token.isActive ? 'offline' : 'revoked'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[#c8d3e8]">{token.lastSeenAt ? new Date(token.lastSeenAt).toLocaleString() : 'Never'}</td>
                              <td className="px-3 py-2 text-[#c8d3e8]">{connectorFromGatewayName(token.name)}</td>
                              <td className="px-3 py-2 text-[#c8d3e8]">0</td>
                              <td className="px-3 py-2 font-mono text-xs text-[#8892a4]">{token.tokenPrefix}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="px-3 py-5 text-center text-[#8892a4]">No connected gateways yet. Create a gateway token to enroll an edge agent.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {m?.notes && (
                    <div>
                      <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-[#c8d3e8] bg-[#1e2d4a] rounded-lg p-3">{m.notes}</p>
                    </div>
                  )}
                  {detail?.workOrders?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-2">Recent Work Orders</p>
                      <div className="space-y-2">
                        {detail.workOrders.map((wo: any) => (
                          <div key={wo.id} className="flex items-center justify-between gap-3 bg-[#1e2d4a] rounded-lg px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-xs font-mono text-[#635bff]">{wo.woNumber}</p>
                              <p className="text-sm font-medium text-white truncate">{wo.title}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[wo.status] || ''}`}>{wo.status.replace('_',' ')}</span>
                              <button onClick={() => setSelectedWo(wo)} className="text-xs px-2 py-1 rounded border border-[#2d3f5e] text-[#c8d3e8] hover:text-white">View</button>
                              <button onClick={() => openEditWo(wo)} className="text-xs px-2 py-1 rounded border border-[#635bff]/50 text-[#a7a2ff] hover:bg-[#635bff]/10">Edit</button>
                              <button onClick={() => setConfirmDeleteWo(wo)} className="text-xs px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail?.maintenanceTasks?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-2">Maintenance Schedule</p>
                      <div className="space-y-2">
                        {detail.maintenanceTasks.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between bg-[#1e2d4a] rounded-lg px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-white">{t.title}</p>
                              <p className="text-xs text-[#c8d3e8]">{t.frequency} · Next: {t.nextDueAt ? new Date(t.nextDueAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}</p>
                            </div>
                            <span className="text-xs text-[#c8d3e8]">{t.priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail?.alerts?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-2">Active Alerts</p>
                      <div className="space-y-2">
                        {detail.alerts.map((a: any) => (
                          <div key={a.id} className={`flex items-center justify-between gap-3 bg-[#1e2d4a] rounded-lg px-3 py-2 border-l-4 ${a.isResolved ? 'border-emerald-500/50 opacity-80' : 'border-red-500/60'}`}>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{a.title}</p>
                              <p className="text-xs text-[#8892a4]">{a.severity} · {a.isResolved ? 'Resolved' : 'Unresolved'}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                              {!a.isResolved && <button onClick={() => resolveAlert(a.id)} disabled={resolvingAlertId === a.id} className="text-xs px-2 py-1 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50">{resolvingAlertId === a.id ? 'Resolving...' : 'Resolve'}</button>}
                              <button onClick={() => setSelectedAlert(a)} className="text-xs px-2 py-1 rounded border border-[#2d3f5e] text-[#c8d3e8] hover:text-white">View</button>
                              <button onClick={() => openEditAlert(a)} className="text-xs px-2 py-1 rounded border border-[#635bff]/50 text-[#a7a2ff] hover:bg-[#635bff]/10">Edit</button>
                              <button onClick={() => setConfirmDeleteAlert(a)} className="text-xs px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-[#c8d3e8] uppercase tracking-wide mb-3">Equipment History Timeline</p>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#1e2d4a]"></div>
                      <div className="space-y-3">
                        {(() => {
                          const events: any[] = [];
                          (detail?.workOrders || []).forEach((wo: any) => events.push({
                            type: 'work_order',
                            date: wo.createdAt || wo.dueAt,
                            title: wo.title,
                            subtitle: wo.woNumber,
                            status: wo.status,
                            record: wo,
                            color: wo.status === 'COMPLETED' ? 'bg-emerald-500' : wo.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-500',
                          }));
                          (detail?.maintenanceTasks || []).forEach((t: any) => {
                            if (t.lastCompletedAt) events.push({
                              type: 'maintenance',
                              date: t.lastCompletedAt,
                              title: t.title,
                              subtitle: `${t.frequency} maintenance completed`,
                              record: t,
                              color: 'bg-purple-500',
                            });
                          });
                          (detail?.alerts || []).forEach((a: any) => events.push({
                            type: 'alert',
                            date: a.createdAt,
                            title: a.title,
                            subtitle: `${a.severity} alert`,
                            record: a,
                            color: a.severity === 'CRITICAL' ? 'bg-red-500' : a.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500',
                          }));
                          events.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
                          if (!events.length) return <div className="pl-10 py-4 text-center text-sm text-[#8892a4]">No history records yet</div>;
                          return events.slice(0, 10).map((event, idx) => (
                            <div key={idx} className="flex gap-3 relative">
                              <div className={`relative z-10 w-8 h-8 rounded-full ${event.color} flex items-center justify-center text-white flex-shrink-0`}>
                                {event.type === 'work_order' ? 'WO' : event.type === 'maintenance' ? 'MT' : '!'}
                              </div>
                              <div className="flex-1 bg-[#1e2d4a] rounded-lg p-3 border border-[#2d3f5e]">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium text-white">{event.title}</p>
                                    <p className="text-xs text-[#8892a4]">{event.subtitle}</p>
                                  </div>
                                  {event.date && <span className="text-xs text-[#8892a4] whitespace-nowrap">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                                </div>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  {event.status && <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[event.status] || ''}`}>{event.status.replace('_',' ')}</span>}
                                  {event.type === 'work_order' ? (
                                    <>
                                      <button onClick={() => setSelectedWo(event.record)} className="text-xs px-2 py-1 rounded border border-[#2d3f5e] text-[#c8d3e8] hover:text-white">View</button>
                                      <button onClick={() => openEditWo(event.record)} className="text-xs px-2 py-1 rounded border border-[#635bff]/50 text-[#a7a2ff] hover:bg-[#635bff]/10">Edit</button>
                                      <button onClick={() => setConfirmDeleteWo(event.record)} className="text-xs px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10">Delete</button>
                                    </>
                                  ) : event.type === 'alert' ? (
                                    <>
                                      {!event.record.isResolved ? (
                                        <button onClick={() => resolveAlert(event.record.id)} disabled={resolvingAlertId === event.record.id} className="text-xs px-2 py-1 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50">{resolvingAlertId === event.record.id ? 'Resolving...' : 'Resolve'}</button>
                                      ) : (
                                        <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300">Resolved</span>
                                      )}
                                      <button onClick={() => setSelectedAlert(event.record)} className="text-xs px-2 py-1 rounded border border-[#2d3f5e] text-[#c8d3e8] hover:text-white">View</button>
                                      <button onClick={() => openEditAlert(event.record)} className="text-xs px-2 py-1 rounded border border-[#635bff]/50 text-[#a7a2ff] hover:bg-[#635bff]/10">Edit</button>
                                      <button onClick={() => setConfirmDeleteAlert(event.record)} className="text-xs px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10">Delete</button>
                                    </>
                                  ) : (
                                    <span className="text-xs text-[#8892a4]">Maintenance task completion</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={closeDetail} className="px-4 py-2 text-sm text-[#c8d3e8] border border-[#1e2d4a] rounded-lg hover:bg-[#1e2d4a]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Order Detail */}
      {selectedWo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedWo(null)}/>
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-mono text-[#635bff]">{selectedWo.woNumber}</p>
                <h3 className="text-lg font-bold text-white">{selectedWo.title}</h3>
              </div>
              <button onClick={() => setSelectedWo(null)} className="text-[#8892a4] hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-sm text-[#c8d3e8]">
              <p>{selectedWo.description || 'No description provided.'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-[#8892a4]">Status</p><p className="font-semibold text-white">{selectedWo.status?.replace('_',' ')}</p></div>
                <div><p className="text-xs text-[#8892a4]">Priority</p><p className="font-semibold text-white">{selectedWo.priority}</p></div>
                <div><p className="text-xs text-[#8892a4]">Type</p><p className="font-semibold text-white">{selectedWo.type}</p></div>
                <div><p className="text-xs text-[#8892a4]">Due</p><p className="font-semibold text-white">{selectedWo.dueAt ? new Date(selectedWo.dueAt).toLocaleDateString() : '—'}</p></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { openEditWo(selectedWo); setSelectedWo(null); }} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5]">Edit</button>
                <button onClick={() => { setConfirmDeleteWo(selectedWo); setSelectedWo(null); }} className="flex-1 px-4 py-2 border border-red-500/40 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-500/10">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Order */}
      {editingWo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditingWo(null)}/>
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Edit Work Order</h3>
              <button onClick={() => setEditingWo(null)} className="text-[#8892a4] hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs text-[#8892a4] mb-1">Title</label><input value={editWoForm.title || ''} onChange={e => setEditWoForm({...editWoForm, title: e.target.value})} className={inputCls + ' w-full'} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-[#8892a4] mb-1">Status</label><select value={editWoForm.status || 'OPEN'} onChange={e => setEditWoForm({...editWoForm, status: e.target.value})} className={selectCls + ' w-full'}>{['OPEN','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED'].map(v => <option key={v} value={v}>{v.replace('_',' ')}</option>)}</select></div>
                <div><label className="block text-xs text-[#8892a4] mb-1">Priority</label><select value={editWoForm.priority || 'MEDIUM'} onChange={e => setEditWoForm({...editWoForm, priority: e.target.value})} className={selectCls + ' w-full'}>{['CRITICAL','HIGH','MEDIUM','LOW'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                <div><label className="block text-xs text-[#8892a4] mb-1">Type</label><select value={editWoForm.type || 'PREVENTIVE'} onChange={e => setEditWoForm({...editWoForm, type: e.target.value})} className={selectCls + ' w-full'}>{['PREVENTIVE','CORRECTIVE','EMERGENCY','INSPECTION','PROJECT'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                <div><label className="block text-xs text-[#8892a4] mb-1">Due</label><input type="datetime-local" value={editWoForm.dueAt || ''} onChange={e => setEditWoForm({...editWoForm, dueAt: e.target.value})} className={inputCls + ' w-full'} /></div>
              </div>
              <div><label className="block text-xs text-[#8892a4] mb-1">Description</label><textarea value={editWoForm.description || ''} onChange={e => setEditWoForm({...editWoForm, description: e.target.value})} rows={3} className={inputCls + ' w-full'} /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingWo(null)} className="flex-1 px-4 py-2 border border-[#2d3f5e] rounded-lg text-sm text-[#c8d3e8] hover:bg-[#1e2d4a]">Cancel</button>
                <button onClick={saveEditWo} disabled={saving} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Work Order */}
      {confirmDeleteWo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmDeleteWo(null)}/>
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2">Delete Work Order?</h3>
              <p className="text-sm text-[#c8d3e8] mb-6">Delete <strong className="text-white">{confirmDeleteWo.title}</strong>? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteWo(null)} className="flex-1 px-4 py-2 border border-[#2d3f5e] rounded-lg text-sm text-[#c8d3e8] hover:bg-[#1e2d4a]">Cancel</button>
                <button onClick={() => deleteWo(confirmDeleteWo.id)} disabled={!!deletingWoId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">{deletingWoId ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Detail */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedAlert(null)}/>
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs text-red-300 font-semibold">{selectedAlert.severity} ALERT</p>
                <h3 className="text-lg font-bold text-white">{selectedAlert.title}</h3>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="text-[#8892a4] hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-sm text-[#c8d3e8]">
              <p>{selectedAlert.message || 'No message provided.'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-[#8892a4]">Type</p><p className="font-semibold text-white">{selectedAlert.type?.replace(/_/g,' ')}</p></div>
                <div><p className="text-xs text-[#8892a4]">Status</p><p className="font-semibold text-white">{selectedAlert.isResolved ? 'Resolved' : 'Unresolved'}</p></div>
                <div><p className="text-xs text-[#8892a4]">Created</p><p className="font-semibold text-white">{selectedAlert.createdAt ? new Date(selectedAlert.createdAt).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-xs text-[#8892a4]">Resolved</p><p className="font-semibold text-white">{selectedAlert.resolvedAt ? new Date(selectedAlert.resolvedAt).toLocaleDateString() : '—'}</p></div>
              </div>
              <div className="flex gap-3 pt-2 flex-wrap">
                {!selectedAlert.isResolved && <button onClick={() => resolveAlert(selectedAlert.id)} disabled={resolvingAlertId === selectedAlert.id} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50">{resolvingAlertId === selectedAlert.id ? 'Resolving...' : 'Resolve'}</button>}
                <button onClick={() => { openEditAlert(selectedAlert); setSelectedAlert(null); }} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5]">Edit</button>
                <button onClick={() => { setConfirmDeleteAlert(selectedAlert); setSelectedAlert(null); }} className="flex-1 px-4 py-2 border border-red-500/40 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-500/10">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Alert */}
      {editingAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditingAlert(null)}/>
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Edit Alert</h3>
              <button onClick={() => setEditingAlert(null)} className="text-[#8892a4] hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs text-[#8892a4] mb-1">Title</label><input value={editAlertForm.title || ''} onChange={e => setEditAlertForm({...editAlertForm, title: e.target.value})} className={inputCls + ' w-full'} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-[#8892a4] mb-1">Severity</label><select value={editAlertForm.severity || 'MEDIUM'} onChange={e => setEditAlertForm({...editAlertForm, severity: e.target.value})} className={selectCls + ' w-full'}>{['CRITICAL','HIGH','MEDIUM','LOW'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                <div><label className="block text-xs text-[#8892a4] mb-1">Type</label><select value={editAlertForm.type || 'MAINTENANCE_DUE'} onChange={e => setEditAlertForm({...editAlertForm, type: e.target.value})} className={selectCls + ' w-full'}>{['MAINTENANCE_DUE','MACHINE_DOWN','OVERDUE_WORK_ORDER','PARTS_LOW','SAFETY','OTHER'].map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}</select></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#c8d3e8]"><input type="checkbox" checked={!!editAlertForm.isResolved} onChange={e => setEditAlertForm({...editAlertForm, isResolved: e.target.checked})} /> Resolved</label>
              <div><label className="block text-xs text-[#8892a4] mb-1">Message</label><textarea value={editAlertForm.message || ''} onChange={e => setEditAlertForm({...editAlertForm, message: e.target.value})} rows={3} className={inputCls + ' w-full'} /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingAlert(null)} className="flex-1 px-4 py-2 border border-[#2d3f5e] rounded-lg text-sm text-[#c8d3e8] hover:bg-[#1e2d4a]">Cancel</button>
                <button onClick={saveEditAlert} disabled={saving} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Alert */}
      {confirmDeleteAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmDeleteAlert(null)}/>
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2">Delete Alert?</h3>
              <p className="text-sm text-[#c8d3e8] mb-6">Delete <strong className="text-white">{confirmDeleteAlert.title}</strong>? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteAlert(null)} className="flex-1 px-4 py-2 border border-[#2d3f5e] rounded-lg text-sm text-[#c8d3e8] hover:bg-[#1e2d4a]">Cancel</button>
                <button onClick={() => deleteAlert(confirmDeleteAlert.id)} disabled={!!deletingAlertId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">{deletingAlertId ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Confirm Delete ────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-safe-pad">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmDelete(null)}/>
          <div className="relative bg-[#0d1426] border border-[#1e2d4a] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Machine?</h3>
              <p className="text-sm text-[#c8d3e8] mb-6">Delete <strong className="text-white">{confirmDelete?.name}</strong>? This removes all work orders and maintenance tasks for this machine.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-[#2d3f5e] rounded-lg text-sm text-[#c8d3e8] hover:bg-[#1e2d4a]">Cancel</button>
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
