'use client';

import '../components/theme.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';
import { ThemeProvider, ThemeToggle, useTheme } from '../components/ThemeProvider';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import CalendarWidget from '../components/dashboard/CalendarWidget';
import QuickActions from '../components/dashboard/QuickActions';
import ExportButtons from '../components/dashboard/ExportButtons';

// ── Change Password Component ──────────────────────────────────────────────
function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    setMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword === currentPassword) {
      setMsg({ type: 'error', text: 'New password must be different from current password.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: '✅ Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const pwStrength = (pw: string) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
    if (score === 3) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' };
    if (score === 4) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const strength = pwStrength(newPassword);

  return (
    <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-6">
      <h2 className="font-semibold text-[var(--text-primary)] mb-1">Change Password</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-5">Keep your account secure with a strong password.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all pr-10"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm">
              {showCurrent ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all pr-10"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm">
              {showNew ? '🙈' : '👁️'}
            </button>
          </div>
          {strength && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[var(--text-muted)]">Password strength</p>
                <p className="text-xs font-medium">{strength.label}</p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 transition-all pr-10 ${
                confirmPassword && newPassword !== confirmPassword
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                  : confirmPassword && newPassword === confirmPassword
                  ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-200'
                  : 'border-[var(--border)] focus:border-[#635bff] focus:ring-[#635bff]/20'
              }`}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm">
              {showConfirm ? '🙈' : '👁️'}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
          {confirmPassword && newPassword === confirmPassword && (
            <p className="text-xs text-emerald-600 mt-1">✓ Passwords match</p>
          )}
        </div>
        {msg && (
          <div className={`text-sm px-3 py-2.5 rounded-lg ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-[#635bff] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Updating...</>
          ) : 'Change Password'}
        </button>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Machine = {
  id: string;
  name: string;
  model: string | null;
  location: string | null;
  status: string;
  criticality: string;
  lastServiceAt: Date | null;
  _count: { workOrders: number; maintenanceTasks: number };
};

type WorkOrder = {
  id: string;
  woNumber: string;
  title: string;
  priority: string;
  status: string;
  dueAt: Date | null;
  machine: { name: string } | null;
  assignedTo: { name: string | null } | null;
};

type MaintenanceTask = {
  id: string;
  title: string;
  priority: string;
  nextDueAt: Date | null;
  machine: { name: string } | null;
};

type Alert = {
  id: string;
  title: string;
  message: string;
  severity: string;
  createdAt: Date;
  machine: { name: string } | null;
};

type Stats = {
  totalMachines: number;
  criticalMachines: number;
  warningMachines: number;
  openWorkOrders: number;
  overdueWorkOrders: number;
  upcomingTasks: number;
  unresolvedAlerts: number;
  monthMaintenanceCost: number;
};

type OrgUser = { id: string; name: string | null; email: string; role: string };

type Props = {
  user: { name: string; email: string; role: string; organizationName: string };
  data: {
    machines: Machine[];
    workOrders: WorkOrder[];
    maintenanceTasks: MaintenanceTask[];
    alerts: Alert[];
    orgUsers: OrgUser[];
    stats: Stats;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(date: Date | null) {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function statusDot(status: string) {
  const map: Record<string, string> = {
    OPERATIONAL: 'bg-emerald-400',
    OK: 'bg-emerald-400',
    WARNING: 'bg-amber-400',
    CRITICAL: 'bg-red-500',
    OFFLINE: 'bg-gray-400',
    MAINTENANCE: 'bg-blue-400',
  };
  return map[status] ?? 'bg-gray-300';
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-gray-100 text-gray-600',
  };
  return map[priority] ?? 'bg-gray-100 text-gray-600';
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    ON_HOLD: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

function severityColor(severity: string) {
  const map: Record<string, string> = {
    CRITICAL: 'border-l-red-500 bg-red-50',
    HIGH: 'border-l-orange-500 bg-orange-50',
    MEDIUM: 'border-l-amber-500 bg-amber-50',
    LOW: 'border-l-blue-500 bg-blue-50',
  };
  return map[severity] ?? 'border-l-gray-300 bg-gray-50';
}

// ── Component ─────────────────────────────────────────────────────────────────
function DashboardClientInner({ user, data }: Props) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { machines: initialMachines, workOrders: initialWorkOrders, maintenanceTasks: initialTasks, alerts: initialAlerts, orgUsers, stats } = data;

  // Local state for live updates
  const [machines, setMachines] = useState(initialMachines);
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [maintenanceTasks, setMaintenanceTasks] = useState(initialTasks);
  const [alerts, setAlerts] = useState(initialAlerts);

  // KPI trend indicators (month-over-month comparison)
  const [kpiTrends, setKpiTrends] = useState<any>(null);
  useEffect(() => {
    fetch('/api/dashboard/trends')
      .then(r => r.json())
      .then(d => setKpiTrends(d.trends))
      .catch(() => {});
  }, []);

  // Modal states (create)
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [woFilter, setWoFilter] = useState('ALL');

  // Detail modal states
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [machineDetail, setMachineDetail] = useState<any>(null);
  const [woDetail, setWoDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit/Delete states
  const [editingMachine, setEditingMachine] = useState<any>(null);
  const [editingWo, setEditingWo] = useState<any>(null);
  const [deletingMachineId, setDeletingMachineId] = useState<string | null>(null);
  const [deletingWoId, setDeletingWoId] = useState<string | null>(null);
  const [editMachineForm, setEditMachineForm] = useState<any>({});
  const [editWoForm, setEditWoForm] = useState<any>({});
  const [confirmDeleteMachine, setConfirmDeleteMachine] = useState<any>(null);
  const [confirmDeleteWo, setConfirmDeleteWo] = useState<any>(null);

  // Open machine detail
  const openMachineDetail = async (machine: any) => {
    setSelectedMachine(machine);
    setMachineDetail(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/machines/${machine.id}`);
      if (res.ok) setMachineDetail(await res.json());
    } catch { /* use basic data */ }
    setLoadingDetail(false);
  };

  // Open work order detail
  const openWoDetail = async (wo: any) => {
    setSelectedWorkOrder(wo);
    setWoDetail(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/work-orders/${wo.id}`);
      if (res.ok) setWoDetail(await res.json());
    } catch { /* use basic data */ }
    setLoadingDetail(false);
  };

  // Update work order status
  const updateWoStatus = async (woId: string, status: string) => {
    try {
      const res = await fetch(`/api/work-orders/${woId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkOrders(prev => prev.map(w => w.id === woId ? { ...w, status: updated.workOrder.status } : w));
        if (woDetail?.id === woId) setWoDetail((prev: any) => ({ ...prev, status: updated.workOrder.status }));
        if (selectedWorkOrder?.id === woId) setSelectedWorkOrder((prev: any) => ({ ...prev, status: updated.workOrder.status }));
      }
    } catch { /* ignore */ }
  };

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true }),
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch { /* ignore */ }
  };

  // Edit Machine
  const openEditMachine = (m: any) => {
    setEditingMachine(m);
    setEditMachineForm({
      name: m.name || '',
      model: m.model || '',
      manufacturer: m.manufacturer || '',
      location: m.location || '',
      category: m.category || 'OTHER',
      criticality: m.criticality || 'MEDIUM',
      status: m.status || 'OPERATIONAL',
      notes: m.notes || '',
    });
  };
  const saveEditMachine = async () => {
    if (!editingMachine) return;
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/machines/${editingMachine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMachineForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...updated.machine } : m));
        setEditingMachine(null);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to update machine');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setSaving(false); }
  };
  const deleteMachine = async (machineId: string) => {
    setDeletingMachineId(machineId);
    try {
      const res = await fetch(`/api/machines/${machineId}`, { method: 'DELETE' });
      if (res.ok) {
        setMachines(prev => prev.filter(m => m.id !== machineId));
        setConfirmDeleteMachine(null);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to delete machine');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setDeletingMachineId(null); }
  };

  // Edit Work Order
  const openEditWo = (wo: any) => {
    setEditingWo(wo);
    setEditWoForm({
      title: wo.title || '',
      description: wo.description || '',
      type: wo.type || 'PREVENTIVE',
      priority: wo.priority || 'MEDIUM',
      status: wo.status || 'OPEN',
      dueAt: wo.dueAt ? new Date(wo.dueAt).toISOString().slice(0, 16) : '',
      assignedToId: wo.assignedTo?.id || '',
      estimatedMinutes: wo.estimatedMinutes || '',
    });
  };
  const saveEditWo = async () => {
    if (!editingWo) return;
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/work-orders/${editingWo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editWoForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkOrders(prev => prev.map(w => w.id === editingWo.id ? { ...w, ...updated.workOrder } : w));
        setEditingWo(null);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to update work order');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setSaving(false); }
  };
  const deleteWo = async (woId: string) => {
    setDeletingWoId(woId);
    try {
      const res = await fetch(`/api/work-orders/${woId}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkOrders(prev => prev.filter(w => w.id !== woId));
        setConfirmDeleteWo(null);
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to delete work order');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setDeletingWoId(null); }
  };

  // Done tasks tracking (client-side visual state)
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<string | null>(null);

  // Mark maintenance task done
  const markTaskDone = async (taskId: string) => {
    try {
      const res = await fetch(`/api/maintenance-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markDone: true }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDoneTasks(prev => new Set(prev).add(taskId));
        setMaintenanceTasks(prev => prev.map(t => t.id === taskId ? { ...t, nextDueAt: updated.task.nextDueAt, lastCompletedAt: updated.task.lastCompletedAt } : t));
      }
    } catch { /* ignore */ }
  };

  // Delete maintenance task
  const deleteTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    try {
      const res = await fetch(`/api/maintenance-tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setMaintenanceTasks(prev => prev.filter(t => t.id !== taskId));
        setDoneTasks(prev => { const s = new Set(prev); s.delete(taskId); return s; });
      }
    } catch { /* ignore */ }
    setDeletingTaskId(null);
    setConfirmDeleteTask(null);
  };

  // Form states for machine
  const [machineForm, setMachineForm] = useState({
    name: '', serialNumber: '', yearInstalled: '', model: '', manufacturer: '', location: '', category: 'OTHER', criticality: 'MEDIUM', status: 'OPERATIONAL', notes: ''
  });

  // Form states for work order
  const [woForm, setWoForm] = useState({
    title: '', description: '', machineId: '', type: 'PREVENTIVE', priority: 'MEDIUM', dueAt: '', estimatedMinutes: '', assignedToId: '', laborCost: '', partsCost: ''
  });

  // Form states for maintenance task
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', machineId: '', taskType: 'PREVENTIVE', frequency: 'MONTHLY', priority: 'MEDIUM', estimatedMinutes: '', estimatedCost: '', nextDueAt: '', intervalDays: ''
  });

  const refreshData = () => window.location.reload();

  const handleCreateMachine = async () => {
    if (!machineForm.name.trim()) return;
    setSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(machineForm),
      });
      if (res.ok) {
        setShowMachineModal(false);
        setMachineForm({ name: '', serialNumber: '', yearInstalled: '', model: '', manufacturer: '', location: '', category: 'OTHER', criticality: 'MEDIUM', status: 'OPERATIONAL', notes: '' });
        refreshData();
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to create machine');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleCreateWorkOrder = async () => {
    if (!woForm.title.trim() || !woForm.machineId) { setSaveError('Title and machine are required'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(woForm),
      });
      if (res.ok) {
        setShowWorkOrderModal(false);
        setWoForm({ title: '', description: '', machineId: '', type: 'PREVENTIVE', priority: 'MEDIUM', dueAt: '', estimatedMinutes: '', assignedToId: '', laborCost: '', partsCost: '' });
        refreshData();
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to create work order');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim() || !taskForm.machineId) { setSaveError('Title and machine are required'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/maintenance-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setTaskForm({ title: '', description: '', machineId: '', taskType: 'PREVENTIVE', frequency: 'MONTHLY', priority: 'MEDIUM', estimatedMinutes: '', estimatedCost: '', nextDueAt: '', intervalDays: '' });
        refreshData();
      } else {
        const d = await res.json();
        setSaveError(d.error || 'Failed to create task');
      }
    } catch { setSaveError('Something went wrong'); }
    finally { setSaving(false); }
  };

  // Modal component
  const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    );
  };

  const inputClass = "w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20";
  const labelClass = "block text-xs font-semibold text-[var(--text-primary)] mb-1.5 uppercase tracking-wide";
  const selectClass = "w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 [background:var(--bg-surface)]";

  // ── Machine Detail Modal ────────────────────────────────────────────────────
  const MachineDetailModal = () => {
    if (!selectedMachine) return null;
    const m = machineDetail || selectedMachine;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => { setSelectedMachine(null); setMachineDetail(null); }} />
        <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${statusDot(m.status)}`} />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{m.name}</h3>
            </div>
            <button onClick={() => { setSelectedMachine(null); setMachineDetail(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-5 space-y-5">
            {loadingDetail && <p className="text-sm text-[var(--text-muted)] animate-pulse">Loading details…</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { label: 'Model', value: m.model },
                { label: 'Manufacturer', value: m.manufacturer },
                { label: 'Serial Number', value: m.serialNumber },
                { label: 'Location', value: m.location },
                { label: 'Category', value: m.category },
                { label: 'Criticality', value: m.criticality },
                { label: 'Year Installed', value: m.yearInstalled },
                { label: 'Total Hours', value: m.totalHours ? `${Number(m.totalHours).toLocaleString()} hrs` : null },
                { label: 'Last Service', value: m.lastServiceAt ? new Date(m.lastServiceAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never' },
                { label: 'Status', value: m.status },
              ] as {label:string;value:any}[]).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-[var(--text-primary)] mt-0.5">{value ?? '—'}</p>
                </div>
              ))}
            </div>
            {m.notes && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-surface-2)] rounded-lg p-3">{m.notes}</p>
              </div>
            )}
            {machineDetail?.workOrders?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Recent Work Orders</p>
                <div className="space-y-2">
                  {machineDetail.workOrders.map((wo: any) => (
                    <div key={wo.id} className="flex items-center justify-between bg-[var(--bg-surface-2)] rounded-lg px-3 py-2">
                      <div><p className="text-xs font-mono text-[var(--text-muted)]">{wo.woNumber}</p><p className="text-sm font-medium text-[var(--text-primary)]">{wo.title}</p></div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(wo.status)}`}>{wo.status.replace('_',' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {machineDetail?.maintenanceTasks?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Maintenance Schedule</p>
                <div className="space-y-2">
                  {machineDetail.maintenanceTasks.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between bg-[var(--bg-surface-2)] rounded-lg px-3 py-2">
                      <div><p className="text-sm font-medium text-[var(--text-primary)]">{t.title}</p><p className="text-xs text-[var(--text-muted)]">{t.frequency} · Next: {t.nextDueAt ? new Date(t.nextDueAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}</p></div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(t.priority)}`}>{t.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {machineDetail?.alerts?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Active Alerts</p>
                <div className="space-y-2">
                  {machineDetail.alerts.map((a: any) => (
                    <div key={a.id} className={`flex items-center justify-between rounded-lg px-3 py-2 border-l-4 ${severityColor(a.severity)}`}>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{a.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.severity==='CRITICAL'?'bg-red-100 text-red-700':a.severity==='HIGH'?'bg-orange-100 text-orange-700':'bg-amber-100 text-amber-700'}`}>{a.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
              
              {/* Equipment History Timeline */}
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Equipment History Timeline</p>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--border)]"></div>
                  
                  <div className="space-y-3">
                    {/* Combine work orders and maintenance into timeline */}
                    {(() => {
                      const events: any[] = [];
                      
                      // Add work orders
                      (machineDetail?.workOrders || []).forEach((wo: any) => {
                        events.push({
                          type: 'work_order',
                          date: wo.createdAt || wo.dueAt,
                          title: wo.title,
                          subtitle: wo.woNumber,
                          status: wo.status,
                          icon: (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ),
                          color: wo.status === 'COMPLETED' ? 'bg-emerald-500' : wo.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-gray-400'
                        });
                      });
                      
                      // Add maintenance completions
                      (machineDetail?.maintenanceTasks || []).forEach((t: any) => {
                        if (t.lastCompletedAt) {
                          events.push({
                            type: 'maintenance',
                            date: t.lastCompletedAt,
                            title: t.title,
                            subtitle: `${t.frequency} maintenance completed`,
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ),
                            color: 'bg-purple-500'
                          });
                        }
                      });
                      
                      // Add alerts
                      (machineDetail?.alerts || []).forEach((a: any) => {
                        events.push({
                          type: 'alert',
                          date: a.createdAt,
                          title: a.title,
                          subtitle: `${a.severity} alert`,
                          icon: (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          ),
                          color: a.severity === 'CRITICAL' ? 'bg-red-500' : a.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
                        });
                      });
                      
                      // Sort by date descending
                      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                      
                      if (events.length === 0) {
                        return (
                          <div className="pl-10 py-4 text-center">
                            <p className="text-sm text-[var(--text-muted)]">No history records yet</p>
                          </div>
                        );
                      }
                      
                      return events.slice(0, 10).map((event, idx) => (
                        <div key={idx} className="flex gap-3 relative">
                          {/* Timeline dot */}
                          <div className={`relative z-10 w-8 h-8 rounded-full ${event.color} flex items-center justify-center text-white flex-shrink-0`}>
                            {event.icon}
                          </div>
                          {/* Event content */}
                          <div className="flex-1 bg-[var(--bg-surface-2)] rounded-lg p-3 border border-[var(--border)]">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">{event.title}</p>
                                <p className="text-xs text-[var(--text-muted)]">{event.subtitle}</p>
                              </div>
                              {event.date && (
                                <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            {event.status && (
                              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(event.status)}`}>
                                {event.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
              
            {/* IoT Sensor Chart */}
            {(() => {
              const [sensorData, setSensorData] = React.useState<any>(null);
              const [loadingSensors, setLoadingSensors] = React.useState(false);
              const [activeSensorType, setActiveSensorType] = React.useState<string | null>(null);
              React.useEffect(() => {
                if (!selectedMachine) return;
                setLoadingSensors(true);
                fetch(`/api/dashboard/sensors?machineId=${selectedMachine.id}`)
                  .then(r => r.json())
                  .then(d => {
                    setSensorData(d);
                    if (d.sensorTypes?.length > 0) setActiveSensorType(d.sensorTypes[0]);
                  })
                  .catch(() => {})
                  .finally(() => setLoadingSensors(false));
              }, [selectedMachine?.id]);
              if (loadingSensors) return <div className="h-8 bg-[var(--bg-surface-2)] rounded animate-pulse" />;
              if (!sensorData?.hasData) return null;
              const activeReadings = activeSensorType ? sensorData.readings[activeSensorType] || [] : [];
              const values = activeReadings.map((r: any) => r.value);
              const minVal = Math.min(...values);
              const maxVal = Math.max(...values);
              const range = maxVal - minVal || 1;
              const chartH = 60;
              const chartW = 280;
              const points = activeReadings.map((r: any, i: number) => {
                const x = (i / Math.max(activeReadings.length - 1, 1)) * chartW;
                const y = chartH - ((r.value - minVal) / range) * (chartH - 8) - 4;
                return `${x},${y}`;
              }).join(' ');
              const unit = activeReadings[0]?.unit || '';
              const latestVal = activeReadings[activeReadings.length - 1]?.value;
              return (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">IoT Sensor Data</p>
                  <div className="rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border)] p-4">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {sensorData.sensorTypes.map((t: string) => (
                        <button key={t} onClick={() => setActiveSensorType(t)}
                          className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all capitalize ${activeSensorType === t ? 'bg-[#635bff] text-white border-[#635bff]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[#635bff] hover:text-[#635bff]'}`}>
                          {t.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    {activeReadings.length > 1 ? (
                      <div>
                        <div className="flex items-end justify-between mb-1">
                          <span className="text-xs text-[var(--text-muted)] capitalize">{activeSensorType?.replace('_', ' ')}</span>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{latestVal?.toFixed(1)} {unit}</span>
                        </div>
                        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-16 overflow-visible">
                          <defs>
                            <linearGradient id="sensorGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#635bff" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#635bff" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <polyline points={points} fill="none" stroke="#635bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points={`0,${chartH} ${points} ${chartW},${chartH}`} fill="url(#sensorGrad)" stroke="none" />
                        </svg>
                        <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-1">
                          <span>{new Date(activeReadings[0].timestamp).toLocaleDateString()}</span>
                          <span>{activeReadings.length} readings</span>
                          <span>{new Date(activeReadings[activeReadings.length-1].timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] py-2">Not enough data to render chart</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Equipment Image/Attachment Upload */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Machine Image</p>
              <div className="flex items-start gap-3">
                {(machineDetail?.imageUrl || selectedMachine?.imageUrl) ? (
                  <img
                    src={machineDetail?.imageUrl || selectedMachine?.imageUrl}
                    alt="Machine"
                    className="w-24 h-24 object-cover rounded-xl border border-[var(--border)]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center bg-[var(--bg-surface-2)]">
                    <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff] transition-all w-fit">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Image
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !selectedMachine) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('machineId', selectedMachine.id);
                        try {
                          const res = await fetch('/api/machines/upload', { method: 'POST', body: fd });
                          if (res.ok) {
                            const { imageUrl } = await res.json();
                            setMachineDetail((prev: any) => prev ? { ...prev, imageUrl } : prev);
                          }
                        } catch { /* ignore */ }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">JPG, PNG, WebP up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => { setSelectedMachine(null); setMachineDetail(null); }} className="px-4 py-2 text-sm text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-surface-2)]">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Work Order Detail Modal ────────────────────────────────────────────────
  const WorkOrderDetailModal = () => {
    const [updatingStatus, setUpdatingStatus] = useState('');
    if (!selectedWorkOrder) return null;
    const wo = woDetail || selectedWorkOrder;
    const handleStatusChange = async (newStatus: string) => {
      setUpdatingStatus(newStatus);
      await updateWoStatus(wo.id, newStatus);
      setUpdatingStatus('');
    };
    const statusOptions = ['OPEN','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED'];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => { setSelectedWorkOrder(null); setWoDetail(null); }} />
        <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <div><p className="text-xs font-mono text-[var(--text-muted)]">{wo.woNumber}</p><h3 className="text-lg font-bold text-[var(--text-primary)]">{wo.title}</h3></div>
            <button onClick={() => { setSelectedWorkOrder(null); setWoDetail(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-5 space-y-5">
            {loadingDetail && <p className="text-sm text-[var(--text-muted)] animate-pulse">Loading details…</p>}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusBadge(wo.status)}`}>{wo.status?.replace('_',' ')}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${priorityBadge(wo.priority)}`}>{wo.priority}</span>
              {wo.type && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-purple-100 text-purple-700">{wo.type}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                { label: 'Machine', value: wo.machine?.name },
                { label: 'Assigned To', value: wo.assignedTo?.name ?? 'Unassigned' },
                { label: 'Created By', value: wo.createdBy?.name },
                { label: 'Due Date', value: wo.dueAt ? new Date(wo.dueAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—' },
                { label: 'Scheduled At', value: wo.scheduledAt ? new Date(wo.scheduledAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—' },
                { label: 'Completed At', value: wo.completedAt ? new Date(wo.completedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—' },
                { label: 'Est. Duration', value: wo.estimatedMinutes ? `${wo.estimatedMinutes} min` : '—' },
                { label: 'Actual Duration', value: wo.actualMinutes ? `${wo.actualMinutes} min` : '—' },
                { label: 'Labor Cost', value: wo.laborCost != null ? `$${Number(wo.laborCost).toFixed(2)}` : '—' },
                { label: 'Parts Cost', value: wo.partsCost != null ? `$${Number(wo.partsCost).toFixed(2)}` : '—' },
              ] as {label:string;value:any}[]).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-[var(--text-primary)] mt-0.5">{value ?? '—'}</p>
                </div>
              ))}
            </div>
            {wo.description && (<div><p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Description</p><p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-surface-2)] rounded-lg p-3">{wo.description}</p></div>)}
            {wo.notes && (<div><p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">Notes</p><p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-surface-2)] rounded-lg p-3">{wo.notes}</p></div>)}
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(s => (
                  <button key={s} disabled={!!updatingStatus || wo.status===s} onClick={() => handleStatusChange(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${wo.status===s?'border-[#635bff] bg-[#635bff] text-white cursor-default':'border-[var(--border)] text-[var(--text-secondary)] hover:border-[#635bff] hover:text-[#635bff]'} disabled:opacity-60`}>
                    {updatingStatus===s ? '...' : s.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => { setSelectedWorkOrder(null); setWoDetail(null); }} className="px-4 py-2 text-sm text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-surface-2)]">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    )},
    { id: 'equipment', label: 'Equipment', badge: stats.criticalMachines > 0 ? stats.criticalMachines : undefined, icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: 'workorders', label: 'Work Orders', badge: stats.openWorkOrders || undefined, icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
    { id: 'schedules', label: 'Schedules', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { id: 'alerts', label: 'Alerts', badge: stats.unresolvedAlerts || undefined, icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
    { id: 'settings', label: 'Settings', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    )},
  ];

  // HMI link - opens /dashboard/hmi full page
  const hmiLinkHref = '/dashboard/hmi';

  const Sidebar = () => (
    <aside className="w-60 flex flex-col h-full" style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-1.5">
          <img src="/logo.png" alt="Myncel" className="w-9 h-9" />
          <div>
            <div className="font-bold text-sm text-[var(--text-primary)]">Myncel</div>
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {user.organizationName}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-[#635bff]/10 text-[#635bff]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className={activeTab === item.id ? 'text-[#635bff]' : 'text-[var(--text-muted)]'}>
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                item.id === 'alerts' || item.id === 'equipment'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-[#635bff]/10 text-[#635bff]'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}

        {/* HMI Monitor Link */}
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <Link
            href={hmiLinkHref}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          >
            <span className="text-[var(--text-muted)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <span className="flex-1 text-left">HMI Monitor</span>
            <span className="text-[9px] bg-[#635bff]/10 text-[#635bff] px-1.5 py-0.5 rounded-full font-semibold">Live</span>
          </Link>
          <Link
            href="/dashboard/iot-simulator"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          >
            <span className="text-[var(--text-muted)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </span>
            <span className="flex-1 text-left">IoT Simulator</span>
            <span className="text-[9px] bg-[#0ea5e9]/10 text-[#0ea5e9] px-1.5 py-0.5 rounded-full font-semibold">New</span>
          </Link>
          <Link
            href="/equipment/qr-labels"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
          >
            <span className="text-[var(--text-muted)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 17.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 7.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
              </svg>
            </span>
            <span className="flex-1 text-left">QR Labels</span>
          </Link>
        </div>
      </nav>

      {/* User */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#635bff] flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.role}</p>
          </div>
        </div>
        {/* Org Admin Panel — only for OWNER and ADMIN */}
        {(user.role === 'OWNER' || user.role === 'ADMIN') && (
          <Link
            href="/org/dashboard"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] mb-1"
          >
            <span className="text-[var(--text-muted)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <span className="flex-1 text-left">Org Admin Panel</span>
            <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold uppercase">
              {user.role}
            </span>
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-xs text-[var(--text-muted)] hover:text-red-500 flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-col fixed h-full z-10 w-60">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
        {/* Top bar */}
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-nav)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[var(--text-primary)] capitalize">
                {activeTab === 'workorders' ? 'Work Orders' : activeTab}
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <GlobalSearch />
            </div>
            <NotificationBell />
            {stats.unresolvedAlerts > 0 && (
              <button
                onClick={() => setActiveTab('alerts')}
                className="relative p-2 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            )}
            {user.email !== 'admin@myncel.com' && (
              <div className="text-xs text-[var(--text-muted)]">
                90-day trial · <Link href="/pricing" className="text-[#635bff] hover:underline">Upgrade</Link>
              </div>
            )}
            {user.email === 'admin@myncel.com' && (
              <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-[#635bff] bg-[#635bff]/10 hover:bg-[#635bff]/20 px-3 py-1.5 rounded-lg transition-colors border border-[var(--accent-border)]">
                🛡️ Admin Panel
              </Link>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Alert banner */}
              {stats.overdueWorkOrders > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">
                    <strong>{stats.overdueWorkOrders} work order{stats.overdueWorkOrders > 1 ? 's are' : ' is'} overdue.</strong>{' '}
                    <button onClick={() => setActiveTab('workorders')} className="underline hover:no-underline">
                      View now →
                    </button>
                  </p>
                </div>
              )}

                {/* KPI Cards with Trend Indicators */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const TrendBadge = ({ change, direction, goodDown }: { change: number; direction: string; goodDown?: boolean }) => {
                      if (!kpiTrends || change === 0) return null;
                      const isGood = goodDown ? direction === 'down' : direction === 'up';
                      return (
                        <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isGood ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                          {direction === 'up' ? '↑' : '↓'}{Math.abs(change)}%
                        </span>
                      );
                    };
                    const cards = [
                      {
                        label: 'Total Equipment', value: stats.totalMachines,
                        sub: `${stats.criticalMachines} critical`,
                        subColor: stats.criticalMachines > 0 ? 'text-red-500' : 'text-emerald-500',
                        trend: null, bg: 'bg-[#635bff]/10',
                        icon: <svg className="w-5 h-5 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
                      },
                      {
                        label: 'Open Work Orders', value: stats.openWorkOrders,
                        sub: `${stats.overdueWorkOrders} overdue`,
                        subColor: stats.overdueWorkOrders > 0 ? 'text-red-500' : 'text-[var(--text-muted)]',
                        trend: kpiTrends?.workOrders ? { ...kpiTrends.workOrders, goodDown: true } : null,
                        bg: 'bg-amber-500/10',
                        icon: <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
                      },
                      {
                        label: 'Due This Week', value: stats.upcomingTasks,
                        sub: 'scheduled tasks', subColor: 'text-[var(--text-muted)]',
                        trend: kpiTrends?.maintenanceTasks ? { ...kpiTrends.maintenanceTasks, goodDown: false } : null,
                        bg: 'bg-blue-500/10',
                        icon: <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                      },
                      {
                        label: 'Month Cost', value: `$${stats.monthMaintenanceCost.toLocaleString()}`,
                        sub: 'maintenance spend', subColor: 'text-[var(--text-muted)]',
                        trend: kpiTrends?.cost ? { ...kpiTrends.cost, goodDown: true } : null,
                        bg: 'bg-emerald-500/10',
                        icon: <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      },
                    ];
                    return cards.map((card) => (
                      <div key={card.label} className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{card.label}</p>
                          <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>{card.icon}</div>
                        </div>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">{card.value}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${card.subColor}`}>{card.sub}</p>
                          {card.trend && card.trend.change !== 0 && (
                            <TrendBadge change={card.trend.change} direction={card.trend.direction} goodDown={card.trend.goodDown} />
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Recent Work Orders + Alerts */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Work Orders */}
                <div className="lg:col-span-2 rounded-xl [background:var(--bg-surface)] border border-[var(--border)]">
                  <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h2 className="font-semibold text-[var(--text-primary)] text-sm">Open Work Orders</h2>
                    <button onClick={() => setActiveTab('workorders')} className="text-xs text-[#635bff] hover:underline">
                      View all →
                    </button>
                  </div>
                  {workOrders.length === 0 ? (
                    <div className="p-10 text-center">
                      <svg className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-[var(--text-muted)]">No open work orders. Great job! 🎉</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e6ebf1]">
                      {workOrders.slice(0, 5).map((wo) => (
                        <div key={wo.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[var(--bg-surface-2)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-mono text-[var(--text-muted)]">{wo.woNumber}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityBadge(wo.priority)}`}>
                                {wo.priority}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{wo.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{wo.machine?.name ?? '—'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium block mb-1 ${statusBadge(wo.status)}`}>
                              {wo.status.replace('_', ' ')}
                            </span>
                            <span className={`text-xs ${wo.dueAt && new Date(wo.dueAt) < new Date() ? 'text-red-500 font-semibold' : 'text-[var(--text-muted)]'}`}>
                              {formatDate(wo.dueAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alerts */}
                <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)]">
                  <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h2 className="font-semibold text-[var(--text-primary)] text-sm">Active Alerts</h2>
                    <button onClick={() => setActiveTab('alerts')} className="text-xs text-[#635bff] hover:underline">
                      View all →
                    </button>
                  </div>
                  {alerts.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-[var(--text-muted)]">No active alerts ✓</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e6ebf1]">
                      {alerts.map((alert) => (
                        <div key={alert.id} className={`px-4 py-3 border-l-4 ${severityColor(alert.severity)} cursor-pointer`} onClick={() => setActiveTab('alerts')}>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{alert.title}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{alert.message}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{alert.machine?.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Maintenance */}
              {maintenanceTasks.length > 0 && (
                <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)]">
                  <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h2 className="font-semibold text-[var(--text-primary)] text-sm">Upcoming Maintenance (Next 7 Days)</h2>
                    <button onClick={() => setActiveTab('schedules')} className="text-xs text-[#635bff] hover:underline">
                      View schedule →
                    </button>
                  </div>
                  <div className="divide-y divide-[#e6ebf1]">
                    {maintenanceTasks.map((task) => (
                      <div key={task.id} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--bg-surface-2)] transition-colors">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{task.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">{task.machine?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`text-xs font-medium ${task.nextDueAt && new Date(task.nextDueAt) < new Date() ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                            {formatDate(task.nextDueAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                {/* Dashboard Enhancement Widgets */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Activity Feed */}
                  <div className="lg:col-span-1">
                    <ActivityFeed />
                  </div>
                  
                  {/* Calendar Widget */}
                  <div className="lg:col-span-1">
                    <CalendarWidget />
                  </div>
                  
                  {/* Quick Actions & Export */}
                  <div className="lg:col-span-1 space-y-6">
                    <QuickActions />
                    <ExportButtons />
                  </div>
                </div>
            </div>
          )}

          {/* ── EQUIPMENT TAB ── */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">{machines.length} machines registered</p>
                <button onClick={() => setShowMachineModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">
                  + Add Machine
                </button>
              </div>
              <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Machine</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hidden md:table-cell">Location</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hidden lg:table-cell">Last Service</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hidden lg:table-cell">Work Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6ebf1]">
                    {machines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-[var(--text-muted)] text-sm">
                          No machines yet. Add your first machine to get started.
                        </td>
                      </tr>
                    ) : machines.map((m) => (
                      <tr key={m.id} className="hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer" onClick={() => openMachineDetail(m)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(m.status)}`} />
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">{m.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">{m.model ?? '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] hidden md:table-cell">{m.location ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.status === 'OPERATIONAL' || m.status === 'OK' ? 'bg-green-100 text-green-700' :
                            m.status === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                            m.status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] hidden lg:table-cell">
                          {m.lastServiceAt ? new Date(m.lastServiceAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] hidden lg:table-cell">
                          {m._count.workOrders} total
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* ── WORK ORDERS TAB ── */}
          {activeTab === 'workorders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                  {workOrders.filter(wo => woFilter === 'ALL' || wo.status === woFilter).length} work order{workOrders.filter(wo => woFilter === 'ALL' || wo.status === woFilter).length !== 1 ? 's' : ''}
                </p>
                <button onClick={() => setShowWorkOrderModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">
                  + New Work Order
                </button>
              </div>
              {/* Status filter pills */}
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setWoFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                      woFilter === f
                        ? 'bg-[#635bff] text-white border-[#635bff]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[#635bff] hover:text-[#635bff]'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">WO #</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Task</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hidden md:table-cell">Priority</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hidden lg:table-cell">Due</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide hidden lg:table-cell">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6ebf1]">
                    {workOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-muted)] text-sm">
                          No open work orders. All caught up! 🎉
                        </td>
                      </tr>
                    ) : workOrders.filter(wo => woFilter === 'ALL' || wo.status === woFilter).map((wo) => (
                      <tr key={wo.id} className="hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer" onClick={() => openWoDetail(wo)}>
                        <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-muted)]">{wo.woNumber}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-[var(--text-primary)]">{wo.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">{wo.machine?.name ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(wo.priority)}`}>
                            {wo.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(wo.status)}`}>
                            {wo.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`px-5 py-3.5 text-xs hidden lg:table-cell ${wo.dueAt && new Date(wo.dueAt) < new Date() ? 'text-red-500 font-semibold' : 'text-[var(--text-secondary)]'}`}>
                          {formatDate(wo.dueAt)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] hidden lg:table-cell">
                          {wo.assignedTo?.name ?? 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SCHEDULES TAB ── */}
          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                  {maintenanceTasks.filter(t => !doneTasks.has(t.id)).length} pending &middot;{' '}
                  <span className="text-emerald-600 font-medium">{doneTasks.size} completed</span>
                </p>
                <button onClick={() => setShowTaskModal(true)} className="bg-[#635bff] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#4f46e5] transition-colors">
                  + Add Task
                </button>
              </div>

              {/* Pending Tasks */}
              {maintenanceTasks.filter(t => !doneTasks.has(t.id)).length === 0 && doneTasks.size === 0 ? (
                <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-12 text-center">
                  <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[var(--text-muted)] text-sm">No maintenance tasks due in the next 7 days.</p>
                </div>
              ) : maintenanceTasks.filter(t => !doneTasks.has(t.id)).length === 0 ? (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-8 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-emerald-700 font-semibold text-sm">All tasks completed!</p>
                  <p className="text-emerald-600 text-xs mt-1">Great work keeping up with maintenance.</p>
                </div>
              ) : (
                <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] divide-y divide-[#e6ebf1]">
                  {maintenanceTasks.filter(t => !doneTasks.has(t.id)).map((task) => (
                    <div key={task.id} className="px-5 py-4 flex items-center justify-between hover:bg-[var(--bg-surface-2)] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => markTaskDone(task.id)}
                          className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[var(--border)] hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center justify-center group"
                          title="Mark as done"
                        >
                          <svg className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] text-sm truncate">{task.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{task.machine?.name ?? 'General'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs font-medium hidden sm:block ${task.nextDueAt && new Date(task.nextDueAt) < new Date() ? 'text-red-500 font-semibold' : 'text-[var(--text-primary)]'}`}>
                          {formatDate(task.nextDueAt)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); markTaskDone(task.id); }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold px-3 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors"
                        >
                          ✓ Done
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteTask(task.id); }}
                          className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Tasks Section */}
              {doneTasks.size > 0 && (
                <div className="rounded-xl [background:var(--bg-surface)] border border-emerald-100 overflow-hidden">
                  <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Completed This Session ({doneTasks.size})</span>
                  </div>
                  <div className="divide-y divide-[#e6ebf1]">
                    {maintenanceTasks.filter(t => doneTasks.has(t.id)).map((task) => (
                      <div key={task.id} className="px-5 py-3 flex items-center justify-between bg-emerald-50/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-[var(--text-secondary)] line-through truncate">{task.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{task.machine?.name ?? 'General'} &middot; Marked done</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteTask(task.id); }}
                          disabled={deletingTaskId === task.id}
                          className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded border border-red-100 hover:bg-red-50 transition-colors ml-3 flex-shrink-0 disabled:opacity-50"
                        >
                          {deletingTaskId === task.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Delete Task Modal */}
          {confirmDeleteTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="rounded-2xl [background:var(--bg-surface)] shadow-2xl max-w-sm w-full p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-center font-semibold text-[var(--text-primary)] mb-2">Delete Task?</h3>
                <p className="text-center text-sm text-[var(--text-secondary)] mb-6">This will permanently remove the maintenance task. This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDeleteTask(null)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
                  <button onClick={() => deleteTask(confirmDeleteTask)} disabled={!!deletingTaskId} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                    {deletingTaskId ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ALERTS TAB ── */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">{alerts.length} unresolved alert{alerts.length !== 1 ? 's' : ''}</p>
              {alerts.length === 0 ? (
                <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-12 text-center">
                  <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[var(--text-muted)] text-sm">No active alerts. All systems running normally ✓</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`rounded-xl [background:var(--bg-surface)] border border-[var(--border)] border-l-4 px-5 py-4 ${severityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="font-semibold text-[var(--text-primary)] text-sm">{alert.title}</p>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">{alert.message}</p>
                          {alert.machine && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">Machine: {alert.machine.name}</p>
                          )}
                        </div>
                        <button onClick={() => resolveAlert(alert.id)} className="text-xs text-white bg-[#635bff] hover:bg-[#4f46e5] px-3 py-1 rounded-lg font-medium transition-colors flex-shrink-0">✓ Resolve</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              {/* Appearance */}
              <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-6">
                <h2 className="font-semibold text-[var(--text-primary)] mb-1">Appearance</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-5">Controls the display mode for both the Dashboard and HMI Monitor.</p>
                <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{isDark ? 'Darker interface — applies to Dashboard & HMI Monitor' : 'Brighter interface — applies to Dashboard & HMI Monitor'}</p>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-6">
                <h2 className="font-semibold text-[var(--text-primary)] mb-4">Account Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Full Name</label>
                    <input defaultValue={user.name} className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Email</label>
                    <input defaultValue={user.email} type="email" className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">Organization</label>
                    <input defaultValue={user.organizationName} className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
                  </div>
                  <button className="bg-[#635bff] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>

              {user.email !== 'admin@myncel.com' && (
                <div className="rounded-xl [background:var(--bg-surface)] border border-[var(--border)] p-6">
                  <h2 className="font-semibold text-[var(--text-primary)] mb-1">Subscription</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">You're on the <strong>Free Trial</strong> plan.</p>
                  <Link href="/pricing" className="inline-flex items-center gap-2 bg-[#635bff] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-colors">
                    Upgrade to Pro →
                  </Link>
                </div>
              )}

              {/* Change Password */}
              <ChangePasswordSection />

              <div className="rounded-xl [background:var(--bg-surface)] border border-red-200 p-6">
                <h2 className="font-semibold text-red-600 mb-1">Danger Zone</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Permanently delete your account and all data.</p>
                <button className="border border-red-300 text-red-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      <Modal show={showMachineModal} onClose={() => { setShowMachineModal(false); setSaveError(''); }} title="Add New Machine">
        <div className="space-y-5">
          {/* Equipment Identity */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Equipment Identity</p>
            <div>
              <label className={labelClass}>Machine Name *</label>
              <input value={machineForm.name} onChange={e => setMachineForm({...machineForm, name: e.target.value})} placeholder="e.g. CNC Mill #1 — Bay A" className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Serial Number</label>
                <input value={machineForm.serialNumber} onChange={e => setMachineForm({...machineForm, serialNumber: e.target.value})} placeholder="e.g. SN-20481-X" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Year Installed</label>
                <input type="number" value={machineForm.yearInstalled} onChange={e => setMachineForm({...machineForm, yearInstalled: e.target.value})} placeholder={String(new Date().getFullYear())} min="1950" max={new Date().getFullYear()} className={inputClass} />
              </div>
            </div>
          </div>
          {/* Specs */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Specifications</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Manufacturer</label>
                <input value={machineForm.manufacturer} onChange={e => setMachineForm({...machineForm, manufacturer: e.target.value})} placeholder="e.g. Haas, Fanuc" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Model</label>
                <input value={machineForm.model} onChange={e => setMachineForm({...machineForm, model: e.target.value})} placeholder="e.g. VF-2SS" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={machineForm.category} onChange={e => setMachineForm({...machineForm, category: e.target.value})} className={selectClass}>
                <optgroup label="CNC / Machining">
                  <option value="CNC_MILL">⚙️ CNC Mill</option>
                  <option value="CNC_LATHE">🔄 CNC Lathe</option>
                  <option value="DRILL_PRESS">🔩 Drill Press</option>
                  <option value="GRINDER">🔵 Grinder / Surface Grinder</option>
                  <option value="PUNCH_PRESS">🔲 Punch Press / Turret Punch</option>
                </optgroup>
                <optgroup label="Cutting">
                  <option value="LASER_CUTTER">🔴 Laser Cutter</option>
                  <option value="PLASMA_CUTTER">⚡ Plasma Cutter</option>
                  <option value="PRESS">🔨 Press / Brake</option>
                </optgroup>
                <optgroup label="Fabrication">
                  <option value="WELDER">🔧 Welder / Welding Robot</option>
                  <option value="INJECTION_MOLD">🧪 Injection Mold</option>
                  <option value="HYDRAULIC">💧 Hydraulic System</option>
                </optgroup>
                <optgroup label="Automation & Assembly">
                  <option value="ROBOT">🤖 Industrial Robot</option>
                  <option value="ASSEMBLY">🏭 Assembly Line</option>
                  <option value="CONVEYOR">📦 Conveyor / Belt System</option>
                </optgroup>
                <optgroup label="Utilities & Infrastructure">
                  <option value="COMPRESSOR">🌀 Compressor / Air System</option>
                  <option value="PUMP">💦 Pump / Fluid System</option>
                  <option value="BOILER">🔥 Boiler / Furnace</option>
                  <option value="GENERATOR">⚡ Generator / Power Unit</option>
                  <option value="CRANE">🏗️ Crane / Hoist / Overhead</option>
                  <option value="HEAT_TREATMENT">🌡️ Heat Treatment / Oven</option>
                </optgroup>
                <optgroup label="Quality & Logistics">
                  <option value="MEASURING">📐 CMM / Measuring Equipment</option>
                  <option value="PACKAGING">📦 Packaging / Wrapping</option>
                  <option value="FORKLIFT">🚜 Forklift / AGV</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="OTHER">🔩 Other / Unclassified</option>
                </optgroup>
              </select>
            </div>
          </div>
          {/* Status & Classification */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Status & Classification</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Initial Status</label>
                <select value={machineForm.status} onChange={e => setMachineForm({...machineForm, status: e.target.value})} className={selectClass}>
                  <option value="OPERATIONAL">✅ Operational</option>
                  <option value="MAINTENANCE">🔧 In Maintenance</option>
                  <option value="BREAKDOWN">🚨 Breakdown</option>
                  <option value="RETIRED">⛔ Retired</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Criticality</label>
                <select value={machineForm.criticality} onChange={e => setMachineForm({...machineForm, criticality: e.target.value})} className={selectClass}>
                  <option value="HIGH">🔴 High — Production critical</option>
                  <option value="MEDIUM">🟡 Medium — Important asset</option>
                  <option value="LOW">🟢 Low — Non-critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Location / Zone</label>
              <input value={machineForm.location} onChange={e => setMachineForm({...machineForm, location: e.target.value})} placeholder="e.g. Plant 1 — Bay A — Line 3" className={inputClass} />
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className={labelClass}>Notes / Special Instructions</label>
            <textarea value={machineForm.notes} onChange={e => setMachineForm({...machineForm, notes: e.target.value})} placeholder="Describe any special operating conditions, known issues, or maintenance history..." className={inputClass} rows={3} />
          </div>
          {saveError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowMachineModal(false); setSaveError(''); }} className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
            <button onClick={handleCreateMachine} disabled={saving || !machineForm.name.trim()} className="flex-1 px-4 py-2.5 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Registering...</> : '+ Register Machine'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={showWorkOrderModal} onClose={() => { setShowWorkOrderModal(false); setSaveError(''); }} title="Create Work Order">
        <div className="space-y-5">
          {/* Work Order Details */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Work Order Details</p>
            <div>
              <label className={labelClass}>Title *</label>
              <input value={woForm.title} onChange={e => setWoForm({...woForm, title: e.target.value})} placeholder="e.g. Monthly spindle lubrication & inspection" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Machine *</label>
              <select value={woForm.machineId} onChange={e => setWoForm({...woForm, machineId: e.target.value})} className={selectClass}>
                <option value="">— Select a machine —</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}{m.location ? ` (${m.location})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Description / Scope of Work</label>
              <textarea value={woForm.description} onChange={e => setWoForm({...woForm, description: e.target.value})} placeholder="Detailed description of tasks, safety notes, required tools, steps to complete..." className={inputClass} rows={3} />
            </div>
          </div>
          {/* Classification */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Classification & Priority</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Type</label>
                <select value={woForm.type} onChange={e => setWoForm({...woForm, type: e.target.value})} className={selectClass}>
                  <option value="PREVENTIVE">🛡️ Preventive</option>
                  <option value="CORRECTIVE">🔧 Corrective</option>
                  <option value="EMERGENCY">🚨 Emergency</option>
                  <option value="INSPECTION">🔍 Inspection</option>
                  <option value="PROJECT">📋 Project</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select value={woForm.priority} onChange={e => setWoForm({...woForm, priority: e.target.value})} className={selectClass}>
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>
              </div>
            </div>
          </div>
          {/* Scheduling */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Scheduling & Resources</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Due Date</label>
                <input type="date" value={woForm.dueAt} onChange={e => setWoForm({...woForm, dueAt: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Est. Duration (min)</label>
                <input type="number" value={woForm.estimatedMinutes} onChange={e => setWoForm({...woForm, estimatedMinutes: e.target.value})} placeholder="e.g. 120" min="0" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Assign To</label>
              <select value={woForm.assignedToId} onChange={e => setWoForm({...woForm, assignedToId: e.target.value})} className={selectClass}>
                <option value="">-- Unassigned --</option>
                {orgUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Est. Labor Cost ($)</label>
                <input type="number" value={woForm.laborCost} onChange={e => setWoForm({...woForm, laborCost: e.target.value})} placeholder="0.00" min="0" step="0.01" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Est. Parts Cost ($)</label>
                <input type="number" value={woForm.partsCost} onChange={e => setWoForm({...woForm, partsCost: e.target.value})} placeholder="0.00" min="0" step="0.01" className={inputClass} />
              </div>
            </div>
          </div>
          {saveError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowWorkOrderModal(false); setSaveError(''); }} className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
            <button onClick={handleCreateWorkOrder} disabled={saving || !woForm.title.trim() || !woForm.machineId} className="flex-1 px-4 py-2.5 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating...</> : '+ Create Work Order'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={showTaskModal} onClose={() => { setShowTaskModal(false); setSaveError(''); }} title="Add Maintenance Task">
        <div className="space-y-5">
          {/* Task Identity */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Task Identity</p>
            <div>
              <label className={labelClass}>Task Title *</label>
              <input value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="e.g. Spindle lubrication & bearing inspection" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Machine *</label>
              <select value={taskForm.machineId} onChange={e => setTaskForm({...taskForm, machineId: e.target.value})} className={selectClass}>
                <option value="">— Select a machine —</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}{m.location ? ` (${m.location})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Procedure / Instructions</label>
              <textarea value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="Step-by-step procedure, safety requirements, tools needed, acceptance criteria..." className={inputClass} rows={3} />
            </div>
          </div>
          {/* Classification */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Classification & Schedule</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Task Type</label>
                <select value={taskForm.taskType} onChange={e => setTaskForm({...taskForm, taskType: e.target.value})} className={selectClass}>
                  <option value="PREVENTIVE">🛡️ Preventive</option>
                  <option value="PREDICTIVE">📊 Predictive</option>
                  <option value="CORRECTIVE">🔧 Corrective</option>
                  <option value="INSPECTION">🔍 Inspection</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className={selectClass}>
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Frequency</label>
                <select value={taskForm.frequency} onChange={e => setTaskForm({...taskForm, frequency: e.target.value})} className={selectClass}>
                  <option value="DAILY">📅 Daily</option>
                  <option value="WEEKLY">📅 Weekly</option>
                  <option value="BIWEEKLY">📅 Bi-Weekly</option>
                  <option value="MONTHLY">📅 Monthly</option>
                  <option value="QUARTERLY">📅 Quarterly</option>
                  <option value="BIANNUAL">📅 Bi-Annual</option>
                  <option value="ANNUAL">📅 Annual</option>
                  <option value="BY_HOURS">⏱️ By Hours</option>
                  <option value="CUSTOM">🔁 Custom</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Interval Days {taskForm.frequency === 'CUSTOM' ? '*' : ''}</label>
                <input type="number" value={taskForm.intervalDays} onChange={e => setTaskForm({...taskForm, intervalDays: e.target.value})} placeholder="e.g. 30" min="1" className={inputClass} />
              </div>
            </div>
          </div>
          {/* Resource Estimates */}
          <div className="bg-[var(--bg-surface-2)] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#635bff] uppercase tracking-widest">Resource Estimates</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Est. Duration (min)</label>
                <input type="number" value={taskForm.estimatedMinutes} onChange={e => setTaskForm({...taskForm, estimatedMinutes: e.target.value})} placeholder="e.g. 45" min="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Est. Cost ($)</label>
                <input type="number" value={taskForm.estimatedCost} onChange={e => setTaskForm({...taskForm, estimatedCost: e.target.value})} placeholder="0.00" min="0" step="0.01" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Next Due Date</label>
              <input type="date" value={taskForm.nextDueAt} onChange={e => setTaskForm({...taskForm, nextDueAt: e.target.value})} className={inputClass} />
            </div>
          </div>
          {saveError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowTaskModal(false); setSaveError(''); }} className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
            <button onClick={handleCreateTask} disabled={saving || !taskForm.title.trim() || !taskForm.machineId} className="flex-1 px-4 py-2.5 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Scheduling...</> : '+ Schedule Task'}
            </button>
          </div>
        </div>
      </Modal>
      {/* ── Detail Modals ── */}
      <MachineDetailModal />
      <WorkOrderDetailModal />

      {/* Edit Machine Modal */}
      {editingMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingMachine(null)} />
          <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Machine</h3>
              <button onClick={() => setEditingMachine(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {saveError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Machine Name</label>
                  <input value={editMachineForm.name || ''} onChange={e => setEditMachineForm({...editMachineForm, name: e.target.value})} className={inputClass} placeholder="Machine name" />
                </div>
                <div>
                  <label className={labelClass}>Manufacturer</label>
                  <input value={editMachineForm.manufacturer || ''} onChange={e => setEditMachineForm({...editMachineForm, manufacturer: e.target.value})} className={inputClass} placeholder="e.g. Fanuc" />
                </div>
                <div>
                  <label className={labelClass}>Model</label>
                  <input value={editMachineForm.model || ''} onChange={e => setEditMachineForm({...editMachineForm, model: e.target.value})} className={inputClass} placeholder="e.g. CNC-200X" />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input value={editMachineForm.location || ''} onChange={e => setEditMachineForm({...editMachineForm, location: e.target.value})} className={inputClass} placeholder="e.g. Bay A" />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={editMachineForm.status || 'OPERATIONAL'} onChange={e => setEditMachineForm({...editMachineForm, status: e.target.value})} className={selectClass}>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="BREAKDOWN">Breakdown</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Criticality</label>
                  <select value={editMachineForm.criticality || 'MEDIUM'} onChange={e => setEditMachineForm({...editMachineForm, criticality: e.target.value})} className={selectClass}>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select value={editMachineForm.category || 'OTHER'} onChange={e => setEditMachineForm({...editMachineForm, category: e.target.value})} className={selectClass}>
                    {['CNC','HYDRAULIC','PNEUMATIC','ELECTRICAL','CONVEYOR','PUMP','COMPRESSOR','ROBOT','HVAC','OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Notes</label>
                  <textarea value={editMachineForm.notes || ''} onChange={e => setEditMachineForm({...editMachineForm, notes: e.target.value})} rows={2} className={inputClass} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingMachine(null)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
                <button onClick={saveEditMachine} disabled={saving} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Order Modal */}
      {editingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingWo(null)} />
          <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Work Order</h3>
              <button onClick={() => setEditingWo(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {saveError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Title</label>
                  <input value={editWoForm.title || ''} onChange={e => setEditWoForm({...editWoForm, title: e.target.value})} className={inputClass} placeholder="Work order title" />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={editWoForm.status || 'OPEN'} onChange={e => setEditWoForm({...editWoForm, status: e.target.value})} className={selectClass}>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select value={editWoForm.priority || 'MEDIUM'} onChange={e => setEditWoForm({...editWoForm, priority: e.target.value})} className={selectClass}>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={editWoForm.type || 'PREVENTIVE'} onChange={e => setEditWoForm({...editWoForm, type: e.target.value})} className={selectClass}>
                    {['PREVENTIVE','CORRECTIVE','EMERGENCY','INSPECTION','PROJECT'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Due Date</label>
                  <input type="datetime-local" value={editWoForm.dueAt || ''} onChange={e => setEditWoForm({...editWoForm, dueAt: e.target.value})} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Assign To</label>
                  <select value={editWoForm.assignedToId || ''} onChange={e => setEditWoForm({...editWoForm, assignedToId: e.target.value})} className={selectClass}>
                    <option value="">-- Unassigned --</option>
                    {orgUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea value={editWoForm.description || ''} onChange={e => setEditWoForm({...editWoForm, description: e.target.value})} rows={3} className={inputClass} placeholder="Work order description..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingWo(null)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
                <button onClick={saveEditWo} disabled={saving} className="flex-1 px-4 py-2 bg-[#635bff] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Machine */}
      {confirmDeleteMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteMachine(null)} />
          <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Machine?</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Delete <strong>{confirmDeleteMachine.name}</strong>? This removes all associated work orders and tasks.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteMachine(null)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
                <button onClick={() => deleteMachine(confirmDeleteMachine.id)} disabled={!!deletingMachineId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  {deletingMachineId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Work Order */}
      {confirmDeleteWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteWo(null)} />
          <div className="relative rounded-2xl [background:var(--bg-surface)] shadow-xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Work Order?</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Delete <strong>{confirmDeleteWo.title}</strong>? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteWo(null)} className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]">Cancel</button>
                <button onClick={() => deleteWo(confirmDeleteWo.id)} disabled={!!deletingWoId} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                  {deletingWoId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DashboardClient(props: Props) {
  return (
    <ThemeProvider themeClass="dash-theme" defaultTheme="light" storageKey="myncel-dashboard-theme" style={{ minHeight: '100vh' }}>
      <DashboardClientInner {...props} />
    </ThemeProvider>
  );
}
