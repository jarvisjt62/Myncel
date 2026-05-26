'use client';

/**
 * Equipment Detail — tabbed page at /equipment/[id]
 *
 * Replaces the in-place modal with a full-page tabbed view:
 *
 *   Overview │ Documents │ Parts │ Schedules │ Timeline │ Telemetry
 *
 * Tabs lazy-fetch their own data; the Overview tab is rendered from the
 * server-side initial payload so first paint is instant.
 *
 * Mobile responsive: the tab nav becomes horizontally scrollable under
 * 640px; cards stack to a single column; modals use modal-safe-pad.
 */

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// Render a modal subtree at the document body level so nothing in the
// component tree can clip it (transforms, overflow:hidden, etc.).
function modalPortal(node: React.ReactNode): React.ReactPortal | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}

type TabKey = 'overview' | 'documents' | 'parts' | 'schedules' | 'timeline' | 'telemetry' | 'ai';

interface Machine {
  id: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  yearInstalled: number | null;
  category: string;
  status: string;
  criticality: string;
  notes: string | null;
  imageUrl: string | null;
  location: string | null;
  totalHours: number;
  lastServiceAt: string | null;
  createdAt: string;
  updatedAt: string;
  site: { id: string; name: string } | null;
  building: { id: string; name: string } | null;
  floor: { id: string; name: string } | null;
  room: { id: string; name: string } | null;
  _count: {
    workOrders: number;
    maintenanceTasks: number;
    alerts: number;
    documents: number;
    sensorReadings: number;
  };
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '🏷️' },
  { key: 'documents', label: 'Documents', icon: '📄' },
  { key: 'parts', label: 'Parts', icon: '🔩' },
  { key: 'schedules', label: 'Schedules', icon: '📅' },
  { key: 'timeline', label: 'Timeline', icon: '🕒' },
  { key: 'telemetry', label: 'Telemetry', icon: '📈' },
  { key: 'ai', label: 'AI', icon: '🤖' },
];

function breadcrumb(m: Machine): string {
  const parts = [m.site?.name, m.building?.name, m.floor?.name, m.room?.name].filter(
    (x): x is string => typeof x === 'string' && x.length > 0,
  );
  if (parts.length > 0) return parts.join(' › ');
  return m.location || '';
}

function statusColor(s: string): string {
  if (s === 'OPERATIONAL' || s === 'OK') return 'bg-green-100 text-green-700';
  if (s === 'MAINTENANCE' || s === 'WARNING') return 'bg-amber-100 text-amber-700';
  if (s === 'BREAKDOWN' || s === 'CRITICAL') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

export default function EquipmentDetailClient({ initialMachine }: { initialMachine: Machine }) {
  const [machine] = useState<Machine>(initialMachine);
  const [tab, setTab] = useState<TabKey>('overview');

  // Sync from URL hash so links like /equipment/abc#parts work
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const apply = () => {
      const h = window.location.hash.replace('#', '');
      if (TABS.some((t) => t.key === h)) setTab(h as TabKey);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const setTabAndHash = (k: TabKey) => {
    setTab(k);
    if (typeof window !== 'undefined') window.location.hash = k;
  };

  const crumb = breadcrumb(machine);

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Breadcrumb back to equipment list */}
      <div className="mb-3 text-xs text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
        <Link href="/dashboard#equipment" className="hover:text-[var(--text-primary)]">
          ← Equipment
        </Link>
        {crumb && (
          <>
            <span>·</span>
            <span className="truncate max-w-[60vw]">📍 {crumb}</span>
          </>
        )}
      </div>

      {/* Header card */}
      <div
        className="rounded-2xl border p-3 sm:p-5 mb-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-wrap items-start gap-3 sm:gap-4">
          {machine.imageUrl ? (
            <img
              src={machine.imageUrl}
              alt={machine.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0 border"
              style={{ borderColor: 'var(--border)' }}
            />
          ) : (
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
            >
              ⚙️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-semibold text-[var(--text-primary)] truncate">{machine.name}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColor(machine.status)}`}>
                {machine.status}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                {machine.criticality}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {machine.manufacturer && <span>{machine.manufacturer}</span>}
              {machine.model && <span>· {machine.model}</span>}
              {machine.serialNumber && <span>· S/N {machine.serialNumber}</span>}
              {machine.yearInstalled && <span>· Installed {machine.yearInstalled}</span>}
            </div>
            {crumb && <div className="text-xs text-[var(--text-muted)] mt-1.5">📍 {crumb}</div>}
          </div>
        </div>

        {/* Counts strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
          <Stat label="Work orders" value={machine._count.workOrders} />
          <Stat label="Schedules" value={machine._count.maintenanceTasks} />
          <Stat label="Alerts" value={machine._count.alerts} />
          <Stat label="Documents" value={machine._count.documents} />
          <Stat label="Sensor readings" value={machine._count.sensorReadings} />
        </div>
      </div>

      {/* Tab nav — horizontally scrolls on narrow screens */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4">
        <div className="inline-flex gap-1 rounded-lg p-1 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTabAndHash(t.key)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="mr-1.5" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview' && <OverviewTab machine={machine} />}
        {tab === 'documents' && <DocumentsTab machineId={machine.id} />}
        {tab === 'parts' && <PartsTab machineId={machine.id} />}
        {tab === 'schedules' && <SchedulesTab machineId={machine.id} />}
        {tab === 'timeline' && <TimelineTab machineId={machine.id} />}
        {tab === 'telemetry' && <TelemetryTab machineId={machine.id} />}
        {tab === 'ai' && <AITab machineId={machine.id} machineName={machine.name} />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }}>
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// OVERVIEW
// ─────────────────────────────────────────────────────────────────────

function OverviewTab({ machine }: { machine: Machine }) {
  // Show structured location fields only if at least one is set; same for free-text.
  const hasStructured = !!(machine.site || machine.building || machine.floor || machine.room);
  const hasFreeText = !!machine.location;

  const identity: { label: string; value: string | number | null | undefined }[] = [
    { label: 'Manufacturer', value: machine.manufacturer },
    { label: 'Model', value: machine.model },
    { label: 'Serial number', value: machine.serialNumber },
    { label: 'Year installed', value: machine.yearInstalled },
    { label: 'Category', value: machine.category },
    { label: 'Criticality', value: machine.criticality },
    { label: 'Status', value: machine.status },
    { label: 'Total hours', value: machine.totalHours ? machine.totalHours.toLocaleString() : null },
    { label: 'Last serviced', value: machine.lastServiceAt ? new Date(machine.lastServiceAt).toLocaleDateString() : null },
  ];

  const locationFields: { label: string; value: string | null | undefined }[] = hasStructured
    ? [
        { label: 'Site', value: machine.site?.name },
        { label: 'Building', value: machine.building?.name },
        { label: 'Floor', value: machine.floor?.name },
        { label: 'Room', value: machine.room?.name },
      ].filter((f) => !!f.value)
    : [];

  return (
    <div className="space-y-4">
      <Card title="Identity">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {identity.map((f) => (
            <div key={f.label}>
              <dt className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{f.label}</dt>
              <dd className="text-[var(--text-primary)] mt-0.5">{f.value ?? <span className="text-[var(--text-muted)]">—</span>}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {(hasStructured || hasFreeText) && (
        <Card title="Location">
          {hasStructured && locationFields.length > 0 && (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm mb-3">
              {locationFields.map((f) => (
                <div key={f.label}>
                  <dt className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{f.label}</dt>
                  <dd className="text-[var(--text-primary)] mt-0.5">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {hasFreeText && (
            <div className={hasStructured ? 'pt-3 border-t' : ''} style={hasStructured ? { borderColor: 'var(--border)' } : {}}>
              <dt className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Free-text location</dt>
              <dd className="text-[var(--text-primary)] mt-0.5 text-sm">{machine.location}</dd>
            </div>
          )}
          {!hasStructured && !hasFreeText && (
            <p className="text-sm text-[var(--text-muted)] italic">No location set. Edit the machine to assign one.</p>
          )}
        </Card>
      )}

      {machine.notes && (
        <Card title="Notes">
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{machine.notes}</p>
        </Card>
      )}

      <div className="text-center">
        <Link
          href={`/dashboard?editMachine=${machine.id}`}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-page)]"
          style={{ borderColor: 'var(--border)' }}
        >
          ✏️ Edit machine details
        </Link>
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border p-3 sm:p-5"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────────────────────────────

interface DocumentRow {
  id: string;
  name: string;
  description: string | null;
  kind: string;
  url: string;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  uploadedBy: { id: string; name: string | null; email: string } | null;
}

const DOC_KINDS = [
  { key: 'MANUAL', label: 'Manual', icon: '📘' },
  { key: 'DRAWING', label: 'Drawing (DXF/DWG/PDF)', icon: '📐' },
  { key: 'PNID', label: 'P&ID', icon: '🔧' },
  { key: 'DATASHEET', label: 'Datasheet', icon: '📋' },
  { key: 'CERTIFICATE', label: 'Certificate', icon: '📜' },
  { key: 'PHOTO', label: 'Photo', icon: '📷' },
  { key: 'OTHER', label: 'Other', icon: '📄' },
];

function DocumentsTab({ machineId }: { machineId: string }) {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<DocumentRow | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/machines/${machineId}/documents`, { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to load');
      setDocs(d.documents || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [machineId]);

  async function deleteDoc(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const r = await fetch(`/api/machine-documents/${id}`, { method: 'DELETE' });
    if (r.ok) await load();
    else {
      const d = await r.json().catch(() => ({}));
      setError(d?.error || 'Failed to delete');
    }
  }

  return (
    <>
      <Card
        title={`Documents${docs.length ? ` (${docs.length})` : ''}`}
        action={
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:opacity-90"
          >
            + Attach document
          </button>
        }
      >
        {error && <div className="mb-3 rounded-lg p-2 text-xs bg-red-50 text-red-700">{error}</div>}
        {loading ? (
          <div className="text-sm text-[var(--text-muted)]">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)] italic py-6 text-center">
            No documents yet. Attach manuals, drawings, P&IDs, and certificates so techs can reach them right from the machine.
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {docs.map((d) => {
              const kind = DOC_KINDS.find((k) => k.key === d.kind);
              return (
                <li key={d.id} className="py-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-xl flex-shrink-0" aria-hidden>{kind?.icon || '📄'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{d.name}</div>
                    <div className="text-xs text-[var(--text-muted)] flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>{kind?.label || d.kind}</span>
                      {d.filename && <span>· {d.filename}</span>}
                      {d.sizeBytes != null && <span>· {humanBytes(d.sizeBytes)}</span>}
                      <span>· {new Date(d.createdAt).toLocaleDateString()}</span>
                      {d.uploadedBy?.name && <span>· {d.uploadedBy.name}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setPreview(d)}
                      className="rounded-md border px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      Preview
                    </button>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={d.filename || undefined}
                      className="rounded-md border px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      Download
                    </a>
                    <button
                      onClick={() => deleteDoc(d.id, d.name)}
                      className="rounded-md border px-2 py-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {showUpload && (
        <UploadModal machineId={machineId} onClose={() => setShowUpload(false)} onSaved={() => { setShowUpload(false); load(); }} />
      )}
      {preview && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function UploadModal({ machineId, onClose, onSaved }: { machineId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState('MANUAL');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError('File is over 5 MB. Upload it to your storage and paste the URL instead.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUrl(String(reader.result || ''));
      setFilename(file.name);
      setMimeType(file.type || '');
      setSizeBytes(file.size);
      if (!name) setName(file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/machines/${machineId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          kind,
          url: url.trim(),
          filename: filename || null,
          mimeType: mimeType || null,
          sizeBytes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      onSaved();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return modalPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 modal-safe-pad" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-auto p-4 sm:p-6"
        style={{ background: 'var(--bg-card)' }}
      >
        <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3">Attach document</h2>

        {error && <div className="mb-3 rounded-lg p-2 text-xs bg-red-50 text-red-700">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }} placeholder="e.g. Service manual rev 4" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Kind</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }}>
              {DOC_KINDS.map((k) => (
                <option key={k.key} value={k.key}>{k.icon} {k.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Upload file (≤ 5 MB) — or paste a URL below</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.svg,.dxf,.dwg,.dwf,.txt,.csv,.xlsx,.doc,.docx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickFile(f);
              }}
              className="w-full text-sm"
            />
            {filename && (
              <div className="mt-1.5 text-xs text-[var(--text-muted)]">
                Selected: <span className="text-[var(--text-primary)]">{filename}</span>
                {sizeBytes != null && <span> · {humanBytes(sizeBytes)}</span>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">…or paste a hosted URL</label>
            <input value={url.startsWith('data:') ? '(file embedded)' : url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }} placeholder="https://your-cdn.com/manuals/cnc-vf2.pdf" disabled={url.startsWith('data:')} />
            {url.startsWith('data:') && (
              <button type="button" onClick={() => { setUrl(''); setFilename(''); setMimeType(''); setSizeBytes(null); }} className="mt-1 text-xs text-[var(--text-muted)] underline">
                Clear embedded file
              </button>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }} placeholder="What's in this document?" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border px-3 py-2 text-sm text-[var(--text-secondary)]" style={{ borderColor: 'var(--border)' }}>
            Cancel
          </button>
          <button type="submit" disabled={submitting || !name.trim() || !url.trim()} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
            {submitting ? 'Saving…' : 'Attach'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PreviewModal({ doc, onClose }: { doc: DocumentRow; onClose: () => void }) {
  const isPdf = (doc.mimeType || '').includes('pdf') || (doc.filename || '').toLowerCase().endsWith('.pdf');
  const isImage = (doc.mimeType || '').startsWith('image/') || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(doc.filename || '');
  const isCad =
    /\.(dxf|dwg|dwf)$/i.test(doc.filename || '') ||
    /(autocad|dxf|dwg)/i.test(doc.mimeType || '');

  return modalPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 modal-safe-pad" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            <div className="font-medium text-[var(--text-primary)] truncate">{doc.name}</div>
            <div className="text-xs text-[var(--text-muted)] truncate">{doc.filename || doc.url}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl leading-none px-2">✕</button>
        </div>
        <div className="p-3 sm:p-4">
          {isPdf ? (
            <iframe src={doc.url} className="w-full h-[70vh] rounded-lg border" style={{ borderColor: 'var(--border)' }} title={doc.name} />
          ) : isImage ? (
            <img src={doc.url} alt={doc.name} className="max-w-full mx-auto rounded-lg border" style={{ borderColor: 'var(--border)' }} />
          ) : isCad ? (
            <div className="rounded-lg border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }}>
              <div className="text-4xl mb-2">📐</div>
              <div className="text-sm text-[var(--text-primary)] font-medium">CAD file detected ({doc.filename})</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 mb-4 max-w-md mx-auto">
                In-browser DXF/DWG rendering isn't bundled in Myncel today — open the file in your CAD tool (AutoCAD, BricsCAD, LibreCAD) to view. PDF exports of the same drawing render inline.
              </div>
              <a
                href={doc.url}
                download={doc.filename || undefined}
                className="inline-block rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Download to open
              </a>
            </div>
          ) : (
            <div className="rounded-lg border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }}>
              <div className="text-4xl mb-2">📄</div>
              <div className="text-sm text-[var(--text-primary)] font-medium">Inline preview unavailable for this file type</div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                download={doc.filename || undefined}
                className="inline-block mt-3 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Open / download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PARTS USED
// ─────────────────────────────────────────────────────────────────────

interface PartUsage {
  partId: string;
  name: string;
  partNumber: string | null;
  totalQuantity: number;
  totalCost: number;
  unitCostLast: number | null;
  workOrderCount: number;
  currency: string | null;
  lastUsedAt: string | null;
}

function PartsTab({ machineId }: { machineId: string }) {
  const [parts, setParts] = useState<PartUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch(`/api/machines/${machineId}/parts-used`, { cache: 'no-store' })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancel) return;
        if (!ok) setError(d?.error || 'Failed to load');
        else setParts(d.parts || []);
      })
      .catch((e) => !cancel && setError(String(e)))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [machineId]);

  const totalSpend = useMemo(() => parts.reduce((a, p) => a + p.totalCost, 0), [parts]);
  const currency = parts[0]?.currency || 'USD';

  return (
    <Card title={`Parts used${parts.length ? ` (${parts.length})` : ''}`}>
      {error && <div className="mb-3 rounded-lg p-2 text-xs bg-red-50 text-red-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-[var(--text-muted)]">Loading…</div>
      ) : parts.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] italic py-6 text-center">
          No parts have been consumed by work orders for this machine yet. As you complete work orders that include parts, they'll show up here.
        </div>
      ) : (
        <>
          <div className="text-xs text-[var(--text-muted)] mb-2">
            Total spend on this machine: <span className="font-semibold text-[var(--text-primary)]">{formatMoney(totalSpend, currency)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left py-2 pr-3">Part</th>
                  <th className="text-right py-2 pr-3 hidden sm:table-cell">Qty</th>
                  <th className="text-right py-2 pr-3 hidden sm:table-cell">WOs</th>
                  <th className="text-right py-2 pr-3 hidden md:table-cell">Last unit cost</th>
                  <th className="text-right py-2 pr-3">Total</th>
                  <th className="text-right py-2 pl-3 hidden md:table-cell">Last used</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.partId} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 pr-3">
                      <div className="font-medium text-[var(--text-primary)]">{p.name}</div>
                      {p.partNumber && <div className="text-xs text-[var(--text-muted)]">{p.partNumber}</div>}
                    </td>
                    <td className="text-right py-2 pr-3 hidden sm:table-cell">{p.totalQuantity}</td>
                    <td className="text-right py-2 pr-3 hidden sm:table-cell">{p.workOrderCount}</td>
                    <td className="text-right py-2 pr-3 hidden md:table-cell">
                      {p.unitCostLast != null ? formatMoney(p.unitCostLast, p.currency || currency) : '—'}
                    </td>
                    <td className="text-right py-2 pr-3 font-medium">{formatMoney(p.totalCost, p.currency || currency)}</td>
                    <td className="text-right py-2 pl-3 hidden md:table-cell text-[var(--text-muted)]">
                      {p.lastUsedAt ? new Date(p.lastUsedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

function formatMoney(n: number, cur: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(n);
  } catch {
    return `${cur} ${n.toFixed(2)}`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// SCHEDULES
// ─────────────────────────────────────────────────────────────────────

interface ScheduleRow {
  id: string;
  title: string;
  frequency: string;
  nextDueAt: string | null;
  lastCompletedAt: string | null;
  priority: string;
}

function SchedulesTab({ machineId }: { machineId: string }) {
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    // The /api/machines/[id] GET already returns up to 5 active maintenance
    // tasks. We refetch here to display them on this tab without
    // depending on parent props.
    fetch(`/api/machines/${machineId}`, { cache: 'no-store' })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancel) return;
        if (!ok) setError(d?.error || 'Failed to load');
        else setSchedules(d.maintenanceTasks || []);
      })
      .catch((e) => !cancel && setError(String(e)))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [machineId]);

  return (
    <Card
      title={`Active schedules${schedules.length ? ` (${schedules.length})` : ''}`}
      action={
        <Link
          href="/dashboard#schedules"
          className="rounded-lg border px-3 py-1.5 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          style={{ borderColor: 'var(--border)' }}
        >
          Manage in /dashboard
        </Link>
      }
    >
      {error && <div className="mb-3 rounded-lg p-2 text-xs bg-red-50 text-red-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-[var(--text-muted)]">Loading…</div>
      ) : schedules.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] italic py-6 text-center">
          No preventive-maintenance schedules attached to this machine yet. Add one from the Schedules tab in your dashboard.
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {schedules.map((s) => (
            <li key={s.id} className="py-2.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium text-[var(--text-primary)] text-sm">{s.title}</span>
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{s.frequency}</span>
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">· {s.priority}</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                {s.nextDueAt && <span>Next due: {new Date(s.nextDueAt).toLocaleDateString()}</span>}
                {s.lastCompletedAt && <span>Last done: {new Date(s.lastCompletedAt).toLocaleDateString()}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  kind: 'work_order_created' | 'work_order_completed' | 'alert' | 'document_added';
  at: string;
  title: string;
  summary: string;
  refId: string;
  refType: string;
  severity?: 'info' | 'warn' | 'crit';
}

function TimelineTab({ machineId }: { machineId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch(`/api/machines/${machineId}/timeline`, { cache: 'no-store' })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancel) return;
        if (!ok) setError(d?.error || 'Failed to load');
        else setEvents(d.events || []);
      })
      .catch((e) => !cancel && setError(String(e)))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [machineId]);

  return (
    <Card title={`Activity timeline${events.length ? ` (${events.length})` : ''}`}>
      {error && <div className="mb-3 rounded-lg p-2 text-xs bg-red-50 text-red-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-[var(--text-muted)]">Loading…</div>
      ) : events.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] italic py-6 text-center">
          No activity yet. Work orders, alerts, and document uploads will appear here as they happen.
        </div>
      ) : (
        <ol className="relative pl-5 sm:pl-6 border-l" style={{ borderColor: 'var(--border)' }}>
          {events.map((e, i) => (
            <li key={`${e.refType}-${e.refId}-${i}`} className="mb-4 last:mb-0">
              <span
                className="absolute -left-[7px] sm:-left-[9px] mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2"
                style={{
                  background:
                    e.severity === 'crit' ? '#fee2e2' : e.severity === 'warn' ? '#fef3c7' : 'var(--bg-card)',
                  borderColor:
                    e.severity === 'crit' ? '#dc2626' : e.severity === 'warn' ? '#d97706' : 'var(--border)',
                }}
              />
              <div className="text-xs text-[var(--text-muted)]">
                {new Date(e.at).toLocaleString()} · <span className="uppercase tracking-wide">{e.kind.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{e.title}</div>
              {e.summary && <div className="text-xs text-[var(--text-secondary)] mt-0.5 break-words">{e.summary}</div>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TELEMETRY
// ─────────────────────────────────────────────────────────────────────

interface SensorReading {
  id: string;
  type: string;
  value: number;
  unit: string;
  recordedAt: string;
}

function TelemetryTab({ machineId }: { machineId: string }) {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latestByType, setLatestByType] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard/sensors?machineId=${machineId}&limit=200`, { cache: 'no-store' })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancel) return;
        if (!ok) {
          setError(d?.error || 'Failed to load telemetry');
          return;
        }
        // Endpoint shape: { readings: { [type]: [{value,unit,timestamp}, ...] }, latestReadings: [...], sensorTypes: [...] }
        // Defensively handle a flat-array fallback too.
        let flat: SensorReading[] = [];
        let latest: SensorReading[] = [];

        if (Array.isArray(d)) {
          flat = d.map((r: any, i: number) => ({
            id: r.id ?? `${r.type ?? 'x'}-${i}`,
            type: r.type ?? 'unknown',
            value: Number(r.value ?? 0),
            unit: r.unit ?? '',
            recordedAt: r.recordedAt ?? r.timestamp ?? new Date().toISOString(),
          }));
        } else if (d && typeof d === 'object') {
          const grouped = (d.readings && typeof d.readings === 'object' && !Array.isArray(d.readings)) ? d.readings : null;
          if (grouped) {
            // Flatten { type: [{value,unit,timestamp}] } into SensorReading[]
            for (const [type, arr] of Object.entries(grouped as Record<string, any[]>)) {
              if (!Array.isArray(arr)) continue;
              arr.forEach((r: any, i: number) => {
                flat.push({
                  id: `${type}-${r.timestamp ?? i}`,
                  type,
                  value: Number(r.value ?? 0),
                  unit: r.unit ?? '',
                  recordedAt: r.timestamp ?? r.recordedAt ?? new Date().toISOString(),
                });
              });
            }
          } else if (Array.isArray(d.readings)) {
            flat = d.readings.map((r: any, i: number) => ({
              id: r.id ?? `${r.type ?? 'x'}-${i}`,
              type: r.type ?? 'unknown',
              value: Number(r.value ?? 0),
              unit: r.unit ?? '',
              recordedAt: r.recordedAt ?? r.timestamp ?? new Date().toISOString(),
            }));
          }

          if (Array.isArray(d.latestReadings)) {
            latest = d.latestReadings.map((r: any, i: number) => ({
              id: `latest-${r.type ?? i}`,
              type: r.type ?? 'unknown',
              value: Number(r.value ?? 0),
              unit: r.unit ?? '',
              recordedAt: r.timestamp ?? r.recordedAt ?? new Date().toISOString(),
            }));
          }
        }

        // Sort flat by recordedAt desc for the table
        flat.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));

        // Build latest from flat if not provided
        if (latest.length === 0 && flat.length > 0) {
          const m = new Map<string, SensorReading>();
          for (const r of flat) {
            const cur = m.get(r.type);
            if (!cur || cur.recordedAt < r.recordedAt) m.set(r.type, r);
          }
          latest = Array.from(m.values());
        }

        setReadings(flat);
        setLatestByType(latest);
      })
      .catch((e) => !cancel && setError(String(e?.message || e)))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [machineId]);

  const latest = latestByType;

  return (
    <Card
      title="Telemetry"
      action={
        <Link
          href="/dashboard#sensors"
          className="rounded-lg border px-3 py-1.5 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          style={{ borderColor: 'var(--border)' }}
        >
          Open sensors view
        </Link>
      }
    >
      {error && <div className="mb-3 rounded-lg p-2 text-xs bg-red-50 text-red-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-[var(--text-muted)]">Loading…</div>
      ) : readings.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] italic py-6 text-center">
          No sensor readings yet. Connect an edge gateway with a per-machine token to start streaming live values.
        </div>
      ) : (
        <>
          {latest.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {latest.map((r) => (
                <div
                  key={r.type}
                  className="rounded-lg border p-3 min-w-0"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-page)' }}
                >
                  <div
                    className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] truncate"
                    title={r.type}
                  >
                    {r.type}
                  </div>
                  <div className="text-lg font-semibold text-[var(--text-primary)] mt-0.5 flex items-baseline gap-1 flex-wrap">
                    <span className="tabular-nums">{formatSensorValue(r.value)}</span>
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{r.unit}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate" title={new Date(r.recordedAt).toLocaleString()}>
                    {formatRelativeTime(r.recordedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1">Recent readings (latest 50)</div>

          {/* Mobile: compact card list — no narrow-column wrapping */}
          <ul className="sm:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
            {readings.slice(0, 50).map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate" title={r.type}>
                    {r.type}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">
                    {new Date(r.recordedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatSensorValue(r.value)} <span className="text-xs font-normal text-[var(--text-muted)]">{r.unit}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop / tablet: full table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left py-2 pr-3 whitespace-nowrap">When</th>
                  <th className="text-left py-2 pr-3 whitespace-nowrap">Type</th>
                  <th className="text-right py-2 pr-3 whitespace-nowrap">Value</th>
                  <th className="text-left py-2 pl-3 whitespace-nowrap">Unit</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(0, 50).map((r) => (
                  <tr key={r.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 pr-3 text-[var(--text-muted)] whitespace-nowrap">{new Date(r.recordedAt).toLocaleString()}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{r.type}</td>
                    <td className="text-right py-2 pr-3 font-medium tabular-nums whitespace-nowrap">{formatSensorValue(r.value)}</td>
                    <td className="py-2 pl-3 text-[var(--text-muted)] whitespace-nowrap">{r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

// Format a sensor value with reasonable precision. Avoids long floats like 58.45000001
// that ruin column widths on narrow viewports.
function formatSensorValue(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 100) return v.toFixed(1);
  return v.toFixed(2);
}

// "12s ago", "3m ago", "2h ago", or a date string when older than a day.
function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  const diff = (Date.now() - t) / 1000;
  if (diff < 0) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ────────────────────────────────────────────────────────────────────────
// AI tab — Big Bet #4
// Per-machine AI settings (override org defaults) + recent detections + forecasts.
// ────────────────────────────────────────────────────────────────────────

type AIModel = 'STATISTICAL' | 'HYBRID' | 'LLM_ASSISTED';
type AISeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AIMachineSettings {
  enabled: boolean;
  model: AIModel | null;
  sensitivity: number | null;
  minAlertSeverity: AISeverity | null;
  forecastHorizonDays: number | null;
  thresholds: Record<string, { warn: number; crit: number; unit?: string }> | null;
  notes: string | null;
}

interface AIEffective {
  enabled: boolean;
  model: AIModel;
  sensitivity: number;
  minAlertSeverity: AISeverity;
  forecastHorizonDays: number;
  thresholds: Record<string, { warn: number; crit: number; unit?: string }> | null;
}

interface AIDetectionRow {
  id: string;
  sensorType: string;
  value: number;
  unit: string | null;
  baseline: number | null;
  deviation: number | null;
  threshold: number | null;
  severity: AISeverity;
  message: string;
  recommendation: string | null;
  feedback: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  modelUsed: AIModel;
  detectedAt: string;
  alert: { id: string; severity: AISeverity; isResolved: boolean } | null;
}

interface AIForecastRow {
  id: string;
  sensorType: string;
  predictedFailureAt: string | null;
  confidence: number;
  recommendation: string;
  horizonDays: number;
  generatedAt: string;
}

const AI_SEV_COLORS: Record<AISeverity, string> = {
  LOW: '#9ca3af',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#dc2626',
};

function AITab({ machineId, machineName }: { machineId: string; machineName: string }) {
  const [settings, setSettings] = useState<AIMachineSettings | null>(null);
  const [effective, setEffective] = useState<AIEffective | null>(null);
  const [detections, setDetections] = useState<AIDetectionRow[]>([]);
  const [forecasts, setForecasts] = useState<AIForecastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch(`/api/ai/settings/${machineId}`).then((r) => r.json()),
        fetch(`/api/ai/detect/${machineId}`).then((r) => r.json()),
      ]);
      setSettings(sRes?.settings || {
        enabled: true, model: null, sensitivity: null, minAlertSeverity: null,
        forecastHorizonDays: null, thresholds: null, notes: null,
      });
      setEffective(sRes?.effective || null);
      setDetections(dRes?.detections || []);
      setForecasts(dRes?.forecasts || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [machineId]);

  async function save(patch: Partial<AIMachineSettings>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/ai/settings/${machineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Save failed');
      }
      const j = await res.json();
      setSettings(j.settings);
      setEffective(j.effective);
      setToast({ type: 'ok', msg: 'Saved.' });
    } catch (err: any) {
      setToast({ type: 'err', msg: err?.message || 'Save failed' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2400);
    }
  }

  async function runNow() {
    setRunning(true);
    try {
      const res = await fetch(`/api/ai/detect/${machineId}`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Run failed');
      }
      await refresh();
      setToast({ type: 'ok', msg: 'Engine ran.' });
    } catch (err: any) {
      setToast({ type: 'err', msg: err?.message || 'Run failed' });
    } finally {
      setRunning(false);
      setTimeout(() => setToast(null), 2400);
    }
  }

  async function feedback(id: string, value: 'CONFIRMED' | 'REJECTED') {
    try {
      await fetch(`/api/ai/feedback/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: value }),
      });
      setDetections((rows) => rows.map((r) => (r.id === id ? { ...r, feedback: value } : r)));
    } catch {/* ignore */}
  }

  if (loading || !settings || !effective) {
    return <div className="text-sm text-[var(--text-secondary)] py-6">Loading AI insights…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">🤖 AI insights for {machineName}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Settings here override the org default. Empty fields inherit from <a href="/settings/ai" className="underline">Settings → AI</a>.
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={running || !effective.enabled}
          className="rounded-lg bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
        >
          {running ? 'Running…' : '⚡ Run engine'}
        </button>
      </div>

      {/* Effective settings card */}
      <div className="rounded-xl border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
           style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Status</div>
          <div className={`text-sm font-semibold ${effective.enabled ? 'text-green-600' : 'text-gray-500'}`}>
            {effective.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Model</div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{effective.model}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Sensitivity</div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{effective.sensitivity} ({(5 - (effective.sensitivity / 100) * 3).toFixed(1)}σ)</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Forecast horizon</div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{effective.forecastHorizonDays}d</div>
        </div>
      </div>

      {/* Per-machine override controls */}
      <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="text-sm font-semibold text-[var(--text-primary)]">Per-machine overrides</div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => save({ enabled: e.target.checked })}
            className="accent-[var(--accent)]"
          />
          <span className="text-[var(--text-primary)]">AI enabled for this machine</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Model override</label>
            <select
              value={settings.model ?? ''}
              onChange={(e) => save({ model: (e.target.value || null) as any })}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
            >
              <option value="">— Inherit org default —</option>
              <option value="STATISTICAL">Statistical</option>
              <option value="HYBRID">Hybrid</option>
              <option value="LLM_ASSISTED">LLM-assisted</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Sensitivity override (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.sensitivity ?? ''}
              onChange={(e) => setSettings((s) => s ? { ...s, sensitivity: e.target.value === '' ? null : parseInt(e.target.value) } : s)}
              onBlur={() => save({ sensitivity: settings.sensitivity })}
              placeholder="inherit"
              className="w-full rounded-lg border px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Min alert severity</label>
            <select
              value={settings.minAlertSeverity ?? ''}
              onChange={(e) => save({ minAlertSeverity: (e.target.value || null) as any })}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
            >
              <option value="">— Inherit org default —</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Forecast horizon (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.forecastHorizonDays ?? ''}
              onChange={(e) => setSettings((s) => s ? { ...s, forecastHorizonDays: e.target.value === '' ? null : parseInt(e.target.value) } : s)}
              onBlur={() => save({ forecastHorizonDays: settings.forecastHorizonDays })}
              placeholder="inherit"
              className="w-full rounded-lg border px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Notes</label>
          <textarea
            value={settings.notes ?? ''}
            onChange={(e) => setSettings((s) => s ? { ...s, notes: e.target.value || null } : s)}
            onBlur={() => save({ notes: settings.notes })}
            rows={2}
            placeholder="Anything specific about this machine's AI behaviour…"
            className="w-full rounded-lg border px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]"
          />
        </div>
      </div>

      {/* Forecasts */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">📅 Predictive forecasts ({forecasts.length})</h4>
        {forecasts.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-[var(--text-muted)] italic"
               style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            No active forecasts. The engine needs at least 10 sensor readings over the last 30 days to project a trajectory.
          </div>
        ) : (
          <div className="space-y-2">
            {forecasts.map((f) => (
              <div key={f.id} className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                   style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {f.sensorType} → expected to cross threshold {f.predictedFailureAt ? new Date(f.predictedFailureAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{f.recommendation}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[var(--accent)]">{f.confidence}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">confidence</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent detections */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">🔍 Recent anomaly detections ({detections.length})</h4>
        {detections.length === 0 ? (
          <div className="rounded-xl border p-4 text-sm text-[var(--text-muted)] italic"
               style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            No detections yet. Click <strong>⚡ Run engine</strong> above to scan recent sensor readings.
          </div>
        ) : (
          <div className="space-y-2">
            {detections.map((d) => (
              <div key={d.id} className="rounded-xl border p-3"
                   style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderLeft: `4px solid ${AI_SEV_COLORS[d.severity]}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: AI_SEV_COLORS[d.severity] }}>
                        {d.severity}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">·</span>
                      <span className="text-xs text-[var(--text-secondary)]">{d.modelUsed}</span>
                      <span className="text-xs text-[var(--text-muted)]">·</span>
                      <span className="text-xs text-[var(--text-secondary)]">{formatRelativeTime(d.detectedAt)}</span>
                    </div>
                    <div className="text-sm text-[var(--text-primary)] mt-1">{d.message}</div>
                    {d.recommendation && (
                      <div className="text-xs text-[var(--text-secondary)] mt-1 italic">→ {d.recommendation}</div>
                    )}
                  </div>
                  {d.feedback === 'PENDING' ? (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => feedback(d.id, 'CONFIRMED')}
                        className="text-xs px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50"
                        title="Confirm — this was a real anomaly"
                      >
                        ✓ Real
                      </button>
                      <button
                        onClick={() => feedback(d.id, 'REJECTED')}
                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
                        title="Reject — this was a false positive"
                      >
                        ✗ False
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] px-2 py-1 rounded font-semibold ${
                      d.feedback === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {d.feedback}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2.5 text-sm shadow-lg ${
          toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
