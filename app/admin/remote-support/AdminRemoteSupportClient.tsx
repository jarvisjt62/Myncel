'use client';

import { useState, useEffect, useRef } from 'react';

type Org = { id: string; name: string };
type Machine = { id: string; name: string; model?: string | null; organizationId: string };
type WorkOrder = { id: string; woNumber: string; title: string; priority?: string | null; status?: string | null };

type Participant = {
  id: string;
  displayName: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
};

type AuditLog = {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  actor?: { name: string; email: string } | null;
};

type Session = {
  id: string;
  title: string;
  description: string | null;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  roomName: string;
  inviteToken: string;
  inviteExpiresAt: string | null;
  notes: string | null;
  adminNotes: string | null;
  recordingUrl: string | null;
  diagnosticSnapshot: any;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  organizationId: string;
  organization?: { name: string } | null;
  machineId: string | null;
  machine?: { id: string; name: string; model?: string | null } | null;
  workOrderId: string | null;
  workOrder?: { id: string; woNumber: string; title: string } | null;
  createdBy?: { name: string; email: string } | null;
  participants?: Participant[];
  auditLogs?: AuditLog[];
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ENDED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  ENDED: 'Ended',
  CANCELLED: 'Cancelled',
};

function fmt(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function duration(start: string | null, end: string | null) {
  if (!start) return null;
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const m = Math.floor((e - s) / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function humanizeEnum(value: string | null | undefined) {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatWorkOrderOption(w: WorkOrder) {
  const priority = humanizeEnum(w.priority);
  const status = humanizeEnum(w.status);
  return `${w.woNumber} · ${w.title} · Priority: ${priority} · Status: ${status}`;
}

export default function AdminRemoteSupportClient({
  initialSessions,
  orgs,
  machines,
}: {
  initialSessions: Session[];
  orgs: Org[];
  machines: Machine[];
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [selected, setSelected] = useState<Session | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterOrg, setFilterOrg] = useState('ALL');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    organizationId: '',
    machineId: '',
    workOrderId: '',
    adminNotes: '',
  });

  // Edit notes
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState('');
  const [adminNotesVal, setAdminNotesVal] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Recording URL
  const [editingRecording, setEditingRecording] = useState(false);
  const [recordingVal, setRecordingVal] = useState('');

  // Diagnostic
  const [capturingDiag, setCapturingDiag] = useState(false);
  const [showDiag, setShowDiag] = useState(false);

  // Ending / deleting
  const [ending, setEnding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Work orders for selected org
  const [orgWorkOrders, setOrgWorkOrders] = useState<WorkOrder[]>([]);
  const [woLoading, setWoLoading] = useState(false);

  // Stats
  const total = sessions.length;
  const active = sessions.filter(s => s.status === 'ACTIVE').length;
  const scheduled = sessions.filter(s => s.status === 'SCHEDULED').length;
  const ended = sessions.filter(s => s.status === 'ENDED').length;

  const filtered = sessions.filter(s => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.organization?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const matchOrg = filterOrg === 'ALL' || s.organizationId === filterOrg;
    return matchSearch && matchStatus && matchOrg;
  });

  // Load work orders when org changes in create form
  useEffect(() => {
    if (!createForm.organizationId) { setOrgWorkOrders([]); return; }
    setWoLoading(true);
    fetch(`/api/work-orders?organizationId=${createForm.organizationId}`)
      .then(r => r.json())
      .then(d => setOrgWorkOrders(Array.isArray(d) ? d : (d.workOrders || [])))
      .catch(() => setOrgWorkOrders([]))
      .finally(() => setWoLoading(false));
  }, [createForm.organizationId]);

  // Load full session detail
  async function loadDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/remote-support/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelected(data);
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function selectSession(s: Session) {
    setSelected(s);
    setShowDiag(false);
    setEditingNotes(false);
    setEditingRecording(false);
    loadDetail(s.id);
  }

  async function createSession() {
    if (!createForm.title.trim() || !createForm.organizationId) return;
    setCreating(true);
    try {
      const res = await fetch('/api/remote-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim() || undefined,
          organizationId: createForm.organizationId,
          machineId: createForm.machineId || undefined,
          workOrderId: createForm.workOrderId || undefined,
          adminNotes: createForm.adminNotes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(prev => [data, ...prev]);
        setShowCreate(false);
        setCreateForm({ title: '', description: '', organizationId: '', machineId: '', workOrderId: '', adminNotes: '' });
        selectSession(data);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create session');
      }
    } finally {
      setCreating(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/remote-support/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesVal, adminNotes: adminNotesVal }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected(updated);
        setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, notes: updated.notes, adminNotes: updated.adminNotes } : s));
        setEditingNotes(false);
      }
    } finally {
      setSavingNotes(false);
    }
  }

  async function saveRecording() {
    if (!selected) return;
    const res = await fetch(`/api/remote-support/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingUrl: recordingVal }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelected(updated);
      setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, recordingUrl: updated.recordingUrl } : s));
      setEditingRecording(false);
    }
  }

  async function endSession() {
    if (!selected || !confirm('End this session?')) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/remote-support/${selected.id}/end`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setSelected(updated);
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
    } finally {
      setEnding(false);
    }
  }

  async function deleteSession() {
    if (!selected || !confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/remote-support/${selected.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== selected.id));
        setSelected(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function captureSnapshot() {
    if (!selected) return;
    setCapturingDiag(true);
    try {
      const res = await fetch(`/api/remote-support/${selected.id}/diagnostic`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setSelected(updated);
        setShowDiag(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to capture snapshot');
      }
    } finally {
      setCapturingDiag(false);
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/remote-support/join/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2500);
    });
  }

  const orgMachines = machines.filter(m => m.organizationId === createForm.organizationId);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: total, color: 'text-[#635bff]', bg: 'bg-[#635bff]/10' },
          { label: 'Active Now', value: active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Scheduled', value: scheduled, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ended', value: ended, color: 'text-gray-500', bg: 'bg-gray-50' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sessions…"
          className="flex-1 min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ACTIVE">Active</option>
          <option value="ENDED">Ended</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={filterOrg}
          onChange={e => setFilterOrg(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">All Orgs</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#635bff] text-white hover:bg-[#4f46e5] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </button>
      </div>

      {/* Split panel */}
      <div className="flex gap-4 min-h-[600px]">
        {/* Session list */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 680 }}>
          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
              <div className="text-4xl mb-3">📡</div>
              <p className="text-sm font-medium">No sessions found</p>
            </div>
          )}
          {filtered.map(s => (
            <button
              key={s.id}
              onClick={() => selectSession(s)}
              className={`w-full text-left p-4 rounded-2xl transition-all ${selected?.id === s.id ? 'ring-2 ring-[#635bff]' : ''}`}
              style={{
                background: selected?.id === s.id ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
                border: `1px solid ${selected?.id === s.id ? '#635bff' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{s.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[s.status]}`}>
                  {STATUS_LABELS[s.status]}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {s.organization?.name || '—'}
              </div>
              {s.machine && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  🔧 {s.machine.name}
                </div>
              )}
              <div className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                {fmt(s.createdAt)}
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {!selected && (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
              <div className="text-center">
                <div className="text-5xl mb-4">📡</div>
                <p className="text-sm font-medium">Select a session to view details</p>
              </div>
            </div>
          )}

          {selected && (
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 680 }}>
              {detailLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#635bff] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!detailLoading && (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selected.title}</h2>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                          {STATUS_LABELS[selected.status]}
                        </span>
                      </div>
                      {selected.description && (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(selected.status === 'SCHEDULED' || selected.status === 'ACTIVE') && (
                        <>
                          <a
                            href={`https://meet.jit.si/${selected.roomName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            📹 Join Video Room
                          </a>
                          <button
                            onClick={() => copyLink(selected.inviteToken)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          >
                            {copied === selected.inviteToken ? '✅ Copied!' : '🔗 Copy Invite'}
                          </button>
                        </>
                      )}
                      {(selected.status === 'SCHEDULED' || selected.status === 'ACTIVE') && (
                        <button
                          onClick={endSession}
                          disabled={ending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50"
                        >
                          {ending ? 'Ending…' : '⏹ End Session'}
                        </button>
                      )}
                      <button
                        onClick={deleteSession}
                        disabled={deleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {deleting ? 'Deleting…' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    {[
                      { label: 'Organization', value: selected.organization?.name || '—' },
                      { label: 'Created by', value: selected.createdBy?.name || '—' },
                      { label: 'Created', value: fmt(selected.createdAt) },
                      { label: 'Started', value: fmt(selected.startedAt) },
                      { label: 'Ended', value: fmt(selected.endedAt) },
                      { label: 'Duration', value: duration(selected.startedAt, selected.endedAt) || '—' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl p-3" style={{ background: 'var(--bg-surface-2)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Linked resources */}
                  {(selected.machine || selected.workOrder) && (
                    <div className="flex gap-3 mb-5">
                      {selected.machine && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                          🔧 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.machine.name}</span>
                          {selected.machine.model && <span>· {selected.machine.model}</span>}
                        </div>
                      )}
                      {selected.workOrder && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                          📋 <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.workOrder.woNumber}</span>
                          <span>· {selected.workOrder.title}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invite link */}
                  {(selected.status === 'SCHEDULED' || selected.status === 'ACTIVE') && (
                    <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Invite Link</span>
                        {selected.inviteExpiresAt && (
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Expires {fmt(selected.inviteExpiresAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs px-3 py-2 rounded-lg truncate font-mono" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
                          {typeof window !== 'undefined' ? `${window.location.origin}/remote-support/join/${selected.inviteToken}` : `/remote-support/join/${selected.inviteToken}`}
                        </code>
                        <button
                          onClick={() => copyLink(selected.inviteToken)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: copied === selected.inviteToken ? '#10b981' : '#635bff', color: '#fff' }}
                        >
                          {copied === selected.inviteToken ? '✅ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notes section */}
                  <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Session Notes</span>
                      {!editingNotes && (
                        <button
                          onClick={() => { setNotesVal(selected.notes || ''); setAdminNotesVal(selected.adminNotes || ''); setEditingNotes(true); }}
                          className="text-xs font-semibold text-[#635bff] hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingNotes ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>User-visible Notes</label>
                          <textarea
                            value={notesVal}
                            onChange={e => setNotesVal(e.target.value)}
                            rows={3}
                            placeholder="Notes visible to participants…"
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Admin Notes (internal)</label>
                          <textarea
                            value={adminNotesVal}
                            onChange={e => setAdminNotesVal(e.target.value)}
                            rows={3}
                            placeholder="Internal admin notes…"
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveNotes}
                            disabled={savingNotes}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#635bff] text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                          >
                            {savingNotes ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingNotes(false)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <div className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>User Notes</div>
                          <p className="text-sm" style={{ color: selected.notes ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {selected.notes || 'No notes yet.'}
                          </p>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>Admin Notes</div>
                          <p className="text-sm" style={{ color: selected.adminNotes ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {selected.adminNotes || 'No admin notes.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recording URL */}
                  <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recording</span>
                      {!editingRecording && (
                        <button
                          onClick={() => { setRecordingVal(selected.recordingUrl || ''); setEditingRecording(true); }}
                          className="text-xs font-semibold text-[#635bff] hover:underline"
                        >
                          {selected.recordingUrl ? 'Edit' : 'Add URL'}
                        </button>
                      )}
                    </div>
                    {editingRecording ? (
                      <div className="flex gap-2">
                        <input
                          value={recordingVal}
                          onChange={e => setRecordingVal(e.target.value)}
                          placeholder="https://…"
                          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                        <button onClick={saveRecording} className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#635bff] text-white hover:bg-[#4f46e5] transition-colors">Save</button>
                        <button onClick={() => setEditingRecording(false)} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                      </div>
                    ) : selected.recordingUrl ? (
                      <a href={selected.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#635bff] hover:underline break-all">
                        🎥 {selected.recordingUrl}
                      </a>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recording URL yet.</p>
                    )}
                  </div>

                  {/* Diagnostic Snapshot */}
                  <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Diagnostic Snapshot</span>
                      <div className="flex gap-2">
                        {selected.diagnosticSnapshot && (
                          <button onClick={() => setShowDiag(v => !v)} className="text-xs font-semibold text-[#635bff] hover:underline">
                            {showDiag ? 'Hide' : 'View'}
                          </button>
                        )}
                        {selected.machineId && (
                          <button
                            onClick={captureSnapshot}
                            disabled={capturingDiag}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-[#635bff]/10 text-[#635bff] hover:bg-[#635bff]/20 disabled:opacity-50 transition-colors"
                          >
                            {capturingDiag ? (
                              <><div className="w-3 h-3 border border-[#635bff] border-t-transparent rounded-full animate-spin" /> Capturing…</>
                            ) : '📸 Capture Now'}
                          </button>
                        )}
                      </div>
                    </div>
                    {!selected.machineId && !selected.diagnosticSnapshot && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Link a machine to this session to capture diagnostic snapshots.</p>
                    )}
                    {selected.machineId && !selected.diagnosticSnapshot && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No snapshot captured yet. Click "Capture Now" to record current machine diagnostics.</p>
                    )}
                    {showDiag && selected.diagnosticSnapshot && (
                      <pre className="mt-2 p-3 rounded-lg text-[11px] overflow-auto max-h-64 font-mono" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {JSON.stringify(selected.diagnosticSnapshot, null, 2)}
                      </pre>
                    )}
                  </div>

                  {/* Participants */}
                  {selected.participants && selected.participants.length > 0 && (
                    <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                        Participants ({selected.participants.length})
                      </div>
                      <div className="space-y-2">
                        {selected.participants.map(p => (
                          <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                            <div className="w-7 h-7 rounded-full bg-[#635bff]/20 flex items-center justify-center text-[#635bff] text-xs font-bold flex-shrink-0">
                              {p.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.displayName}</div>
                              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                Joined {fmt(p.joinedAt)} {p.leftAt ? `· Left ${fmt(p.leftAt)}` : '· Still active'}
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#635bff]/10 text-[#635bff]">{p.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audit log */}
                  {selected.auditLogs && selected.auditLogs.length > 0 && (
                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                        Audit Log ({selected.auditLogs.length})
                      </div>
                      <div className="space-y-1.5">
                        {selected.auditLogs.map(log => (
                          <div key={log.id} className="flex items-start gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#635bff]/40 mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{log.action}</span>
                              {log.details && <span style={{ color: 'var(--text-secondary)' }}> · {log.details}</span>}
                              {log.actor && <span style={{ color: 'var(--text-muted)' }}> by {log.actor.name}</span>}
                              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmt(log.createdAt)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>New Remote Support Session</h3>
              <button onClick={() => setShowCreate(false)} className="text-xl leading-none" style={{ color: 'var(--text-muted)' }}>×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Session Title *</label>
                <input
                  value={createForm.title}
                  onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Compressor #3 Diagnostic"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the issue or purpose…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Organization *</label>
                <select
                  value={createForm.organizationId}
                  onChange={e => setCreateForm(f => ({ ...f, organizationId: e.target.value, machineId: '', workOrderId: '' }))}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">— Select Organization —</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              {createForm.organizationId && (
                <>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Link Machine (optional)</label>
                    <select
                      value={createForm.machineId}
                      onChange={e => setCreateForm(f => ({ ...f, machineId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">— No Machine —</option>
                      {orgMachines.map(m => <option key={m.id} value={m.id}>{m.name}{m.model ? ` · ${m.model}` : ''}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Link Work Order (optional) {woLoading && <span className="text-[#635bff]">Loading…</span>}
                    </label>
                    <select
                      value={createForm.workOrderId}
                      onChange={e => setCreateForm(f => ({ ...f, workOrderId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">— No Work Order —</option>
                      {orgWorkOrders.map(w => <option key={w.id} value={w.id}>{formatWorkOrderOption(w)}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>Admin Notes (internal)</label>
                <textarea
                  value={createForm.adminNotes}
                  onChange={e => setCreateForm(f => ({ ...f, adminNotes: e.target.value }))}
                  placeholder="Internal notes visible only to admins…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm resize-none outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={createSession}
                disabled={creating || !createForm.title.trim() || !createForm.organizationId}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#635bff] text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating…' : 'Create Session & Generate Invite Link'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}