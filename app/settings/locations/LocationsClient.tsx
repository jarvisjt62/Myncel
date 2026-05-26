'use client';

/**
 * /settings/locations — Manage the 4-level location hierarchy.
 *
 * Tree editor:
 *   Site (top)
 *     ├ Building
 *     │   ├ Floor
 *     │   │   └ Room
 *
 * Each node can be added/renamed/deleted inline. Counts of contained
 * machines are surfaced so deleting a busy node prompts confirmation.
 *
 * Mobile responsive: tree collapses to a single-column accordion under
 * 640px; modal uses max-w-2xl + modal-safe-pad to clear the keyboard.
 */

import { useEffect, useMemo, useState } from 'react';

interface RoomNode {
  id: string;
  name: string;
  code: string | null;
}
interface FloorNode {
  id: string;
  name: string;
  level: number | null;
  rooms: RoomNode[];
}
interface BuildingNode {
  id: string;
  name: string;
  code: string | null;
  floors: FloorNode[];
}
interface SiteNode {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  timezone: string | null;
  buildings: BuildingNode[];
}

type CountsMap = Record<string, number>;
type Counts = { site: CountsMap; building: CountsMap; floor: CountsMap; room: CountsMap };

type Modal =
  | null
  | { kind: 'site'; mode: 'create' | 'edit'; site?: SiteNode }
  | { kind: 'building'; mode: 'create' | 'edit'; siteId: string; building?: BuildingNode }
  | { kind: 'floor'; mode: 'create' | 'edit'; buildingId: string; floor?: FloorNode }
  | { kind: 'room'; mode: 'create' | 'edit'; floorId: string; room?: RoomNode };

export default function LocationsClient() {
  const [sites, setSites] = useState<SiteNode[]>([]);
  const [counts, setCounts] = useState<Counts>({ site: {}, building: {}, floor: {}, room: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<Modal>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/locations/tree', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setSites(data.sites || []);
      setCounts(data.counts || { site: {}, building: {}, floor: {}, room: {} });
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const totalSites = sites.length;
  const totalBuildings = useMemo(() => sites.reduce((a, s) => a + s.buildings.length, 0), [sites]);
  const totalFloors = useMemo(
    () => sites.reduce((a, s) => a + s.buildings.reduce((b, bld) => b + bld.floors.length, 0), 0),
    [sites],
  );
  const totalRooms = useMemo(
    () =>
      sites.reduce(
        (a, s) =>
          a + s.buildings.reduce((b, bld) => b + bld.floors.reduce((c, f) => c + f.rooms.length, 0), 0),
        0,
      ),
    [sites],
  );

  // ────────────────────────────────────────────────────────────────────
  // Submit handlers — one per kind
  // ────────────────────────────────────────────────────────────────────
  async function submitSite(form: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: String(form.get('name') || '').trim(),
        code: String(form.get('code') || '').trim() || null,
        address: String(form.get('address') || '').trim() || null,
        timezone: String(form.get('timezone') || '').trim() || null,
        notes: String(form.get('notes') || '').trim() || null,
      };
      if (modal?.kind !== 'site') return;
      const url = modal.mode === 'edit' ? `/api/locations/sites/${modal.site!.id}` : '/api/locations/sites';
      const method = modal.mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setModal(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBuilding(form: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      if (modal?.kind !== 'building') return;
      const payload = {
        siteId: modal.siteId,
        name: String(form.get('name') || '').trim(),
        code: String(form.get('code') || '').trim() || null,
        notes: String(form.get('notes') || '').trim() || null,
      };
      const url =
        modal.mode === 'edit' ? `/api/locations/buildings/${modal.building!.id}` : '/api/locations/buildings';
      const method = modal.mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setModal(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFloor(form: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      if (modal?.kind !== 'floor') return;
      const levelStr = String(form.get('level') || '').trim();
      const payload = {
        buildingId: modal.buildingId,
        name: String(form.get('name') || '').trim(),
        level: levelStr === '' ? null : Number(levelStr),
        notes: String(form.get('notes') || '').trim() || null,
      };
      const url = modal.mode === 'edit' ? `/api/locations/floors/${modal.floor!.id}` : '/api/locations/floors';
      const method = modal.mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setModal(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRoom(form: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      if (modal?.kind !== 'room') return;
      const payload = {
        floorId: modal.floorId,
        name: String(form.get('name') || '').trim(),
        code: String(form.get('code') || '').trim() || null,
        notes: String(form.get('notes') || '').trim() || null,
      };
      const url = modal.mode === 'edit' ? `/api/locations/rooms/${modal.room!.id}` : '/api/locations/rooms';
      const method = modal.mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setModal(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteNode(kind: 'sites' | 'buildings' | 'floors' | 'rooms', id: string, label: string, machineCount: number) {
    const warning = machineCount > 0
      ? `Delete "${label}"? ${machineCount} machine${machineCount === 1 ? '' : 's'} will lose this location label (machines themselves are kept).`
      : `Delete "${label}"?`;
    if (!confirm(warning)) return;
    setError(null);
    try {
      const res = await fetch(`/api/locations/${kind}/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to delete');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-5 sm:mb-7">
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">Locations</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Organize equipment by <strong>Site → Building → Floor → Room</strong>. Each level is optional — fill in only what you need.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        {[
          { label: 'Sites', value: totalSites, icon: '🏭' },
          { label: 'Buildings', value: totalBuildings, icon: '🏢' },
          { label: 'Floors', value: totalFloors, icon: '🪜' },
          { label: 'Rooms', value: totalRooms, icon: '🚪' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-3"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
              {s.icon} {s.label}
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mt-0.5">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg border p-3 text-sm"
          style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}
        >
          {error}
        </div>
      )}

      {/* Add Site button */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setModal({ kind: 'site', mode: 'create' })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <span aria-hidden>＋</span> Add Site
        </button>
        <button
          onClick={load}
          className="rounded-lg border px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          style={{ borderColor: 'var(--border)' }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-[var(--text-muted)]">Loading…</div>
      ) : sites.length === 0 ? (
        <EmptyState onCreate={() => setModal({ kind: 'site', mode: 'create' })} />
      ) : (
        <div className="space-y-3">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              counts={counts}
              expanded={expanded}
              onToggle={toggle}
              onModal={setModal}
              onDelete={deleteNode}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <ModalOverlay onClose={() => !submitting && setModal(null)}>
          {modal.kind === 'site' && (
            <SiteForm
              mode={modal.mode}
              site={modal.site}
              submitting={submitting}
              onSubmit={submitSite}
              onClose={() => setModal(null)}
            />
          )}
          {modal.kind === 'building' && (
            <BuildingForm
              mode={modal.mode}
              building={modal.building}
              submitting={submitting}
              onSubmit={submitBuilding}
              onClose={() => setModal(null)}
            />
          )}
          {modal.kind === 'floor' && (
            <FloorForm
              mode={modal.mode}
              floor={modal.floor}
              submitting={submitting}
              onSubmit={submitFloor}
              onClose={() => setModal(null)}
            />
          )}
          {modal.kind === 'room' && (
            <RoomForm
              mode={modal.mode}
              room={modal.room}
              submitting={submitting}
              onSubmit={submitRoom}
              onClose={() => setModal(null)}
            />
          )}
        </ModalOverlay>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="rounded-xl border border-dashed p-6 sm:p-8 text-center"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="text-4xl mb-2">🏭</div>
      <div className="text-base font-medium text-[var(--text-primary)]">No sites yet</div>
      <div className="text-sm text-[var(--text-secondary)] mt-1 mb-4">
        Start by adding a site (a single physical address). You can nest buildings, floors, and rooms underneath.
      </div>
      <button
        onClick={onCreate}
        className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        + Add your first Site
      </button>
    </div>
  );
}

function SiteCard({
  site,
  counts,
  expanded,
  onToggle,
  onModal,
  onDelete,
}: {
  site: SiteNode;
  counts: Counts;
  expanded: Set<string>;
  onToggle: (k: string) => void;
  onModal: (m: Modal) => void;
  onDelete: (k: 'sites' | 'buildings' | 'floors' | 'rooms', id: string, label: string, machineCount: number) => void;
}) {
  const open = expanded.has(`s:${site.id}`);
  const machineCount = counts.site[site.id] || 0;
  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <button
          onClick={() => onToggle(`s:${site.id}`)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg leading-none"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▼' : '▶'}
        </button>
        <span className="text-lg" aria-hidden>🏭</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium text-[var(--text-primary)] truncate">{site.name}</span>
            {site.code && <span className="text-xs text-[var(--text-muted)]">[{site.code}]</span>}
          </div>
          <div className="text-xs text-[var(--text-muted)] flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            <span>{site.buildings.length} building{site.buildings.length === 1 ? '' : 's'}</span>
            <span>{machineCount} machine{machineCount === 1 ? '' : 's'}</span>
            {site.address && <span className="truncate">📍 {site.address}</span>}
            {site.timezone && <span>🕒 {site.timezone}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ActionBtn onClick={() => onModal({ kind: 'building', mode: 'create', siteId: site.id })}>
            + Building
          </ActionBtn>
          <ActionBtn onClick={() => onModal({ kind: 'site', mode: 'edit', site })}>Edit</ActionBtn>
          <ActionBtn
            tone="danger"
            onClick={() => onDelete('sites', site.id, site.name, machineCount)}
          >
            Delete
          </ActionBtn>
        </div>
      </div>

      {open && (
        <div className="border-t pl-4 sm:pl-6 pr-2 sm:pr-3 py-2" style={{ borderColor: 'var(--border)' }}>
          {site.buildings.length === 0 ? (
            <div className="py-3 text-xs text-[var(--text-muted)] italic">No buildings yet.</div>
          ) : (
            <div className="space-y-1.5">
              {site.buildings.map((b) => (
                <BuildingRow
                  key={b.id}
                  building={b}
                  counts={counts}
                  expanded={expanded}
                  onToggle={onToggle}
                  onModal={onModal}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BuildingRow({
  building,
  counts,
  expanded,
  onToggle,
  onModal,
  onDelete,
}: {
  building: BuildingNode;
  counts: Counts;
  expanded: Set<string>;
  onToggle: (k: string) => void;
  onModal: (m: Modal) => void;
  onDelete: (k: 'sites' | 'buildings' | 'floors' | 'rooms', id: string, label: string, machineCount: number) => void;
}) {
  const open = expanded.has(`b:${building.id}`);
  const machineCount = counts.building[building.id] || 0;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 py-1.5">
        <button
          onClick={() => onToggle(`b:${building.id}`)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm leading-none w-4"
        >
          {open ? '▼' : '▶'}
        </button>
        <span aria-hidden>🏢</span>
        <div className="min-w-0 flex-1">
          <span className="font-medium text-[var(--text-primary)] text-sm">{building.name}</span>
          {building.code && <span className="ml-1 text-xs text-[var(--text-muted)]">[{building.code}]</span>}
          <span className="ml-2 text-xs text-[var(--text-muted)]">
            · {building.floors.length} floor{building.floors.length === 1 ? '' : 's'}
            {machineCount > 0 ? ` · ${machineCount} machine${machineCount === 1 ? '' : 's'}` : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ActionBtn small onClick={() => onModal({ kind: 'floor', mode: 'create', buildingId: building.id })}>
            + Floor
          </ActionBtn>
          <ActionBtn small onClick={() => onModal({ kind: 'building', mode: 'edit', siteId: '', building })}>
            Edit
          </ActionBtn>
          <ActionBtn small tone="danger" onClick={() => onDelete('buildings', building.id, building.name, machineCount)}>
            ✕
          </ActionBtn>
        </div>
      </div>
      {open && (
        <div className="pl-5 sm:pl-7 border-l ml-2" style={{ borderColor: 'var(--border)' }}>
          {building.floors.length === 0 ? (
            <div className="py-2 text-xs text-[var(--text-muted)] italic">No floors yet.</div>
          ) : (
            building.floors.map((f) => (
              <FloorRow
                key={f.id}
                floor={f}
                counts={counts}
                expanded={expanded}
                onToggle={onToggle}
                onModal={onModal}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FloorRow({
  floor,
  counts,
  expanded,
  onToggle,
  onModal,
  onDelete,
}: {
  floor: FloorNode;
  counts: Counts;
  expanded: Set<string>;
  onToggle: (k: string) => void;
  onModal: (m: Modal) => void;
  onDelete: (k: 'sites' | 'buildings' | 'floors' | 'rooms', id: string, label: string, machineCount: number) => void;
}) {
  const open = expanded.has(`f:${floor.id}`);
  const machineCount = counts.floor[floor.id] || 0;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 py-1.5">
        <button
          onClick={() => onToggle(`f:${floor.id}`)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm leading-none w-4"
        >
          {open ? '▼' : '▶'}
        </button>
        <span aria-hidden>🪜</span>
        <div className="min-w-0 flex-1">
          <span className="font-medium text-[var(--text-primary)] text-sm">{floor.name}</span>
          {floor.level !== null && <span className="ml-1 text-xs text-[var(--text-muted)]">(lvl {floor.level})</span>}
          <span className="ml-2 text-xs text-[var(--text-muted)]">
            · {floor.rooms.length} room{floor.rooms.length === 1 ? '' : 's'}
            {machineCount > 0 ? ` · ${machineCount} machine${machineCount === 1 ? '' : 's'}` : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ActionBtn small onClick={() => onModal({ kind: 'room', mode: 'create', floorId: floor.id })}>
            + Room
          </ActionBtn>
          <ActionBtn small onClick={() => onModal({ kind: 'floor', mode: 'edit', buildingId: '', floor })}>
            Edit
          </ActionBtn>
          <ActionBtn small tone="danger" onClick={() => onDelete('floors', floor.id, floor.name, machineCount)}>
            ✕
          </ActionBtn>
        </div>
      </div>
      {open && (
        <div className="pl-5 sm:pl-7 border-l ml-2" style={{ borderColor: 'var(--border)' }}>
          {floor.rooms.length === 0 ? (
            <div className="py-2 text-xs text-[var(--text-muted)] italic">No rooms yet.</div>
          ) : (
            floor.rooms.map((r) => {
              const rmCount = counts.room[r.id] || 0;
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-2 py-1.5">
                  <span className="w-4" />
                  <span aria-hidden>🚪</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-[var(--text-primary)]">{r.name}</span>
                    {r.code && <span className="ml-1 text-xs text-[var(--text-muted)]">[{r.code}]</span>}
                    {rmCount > 0 && (
                      <span className="ml-2 text-xs text-[var(--text-muted)]">
                        · {rmCount} machine{rmCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <ActionBtn small onClick={() => onModal({ kind: 'room', mode: 'edit', floorId: '', room: r })}>
                      Edit
                    </ActionBtn>
                    <ActionBtn small tone="danger" onClick={() => onDelete('rooms', r.id, r.name, rmCount)}>
                      ✕
                    </ActionBtn>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  tone = 'default',
  small = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'default' | 'danger';
  small?: boolean;
}) {
  const base = small ? 'text-xs px-2 py-1' : 'text-xs px-2.5 py-1.5';
  const toneCls =
    tone === 'danger'
      ? 'border-red-200 text-red-600 hover:bg-red-50'
      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]';
  return (
    <button
      onClick={onClick}
      className={`rounded-md border ${base} ${toneCls}`}
      style={tone === 'default' ? { borderColor: 'var(--border)' } : undefined}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Modal shell + per-kind forms
// ─────────────────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 modal-safe-pad"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-auto"
        style={{ background: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function FormShell({
  title,
  subtitle,
  submitting,
  onSubmit,
  onClose,
  submitLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  submitting: boolean;
  onSubmit: (form: FormData) => void;
  onClose: () => void;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <form
      className="p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          style={{ borderColor: 'var(--border)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1';
const inputCls =
  'w-full rounded-lg border px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]';
const inputStyle: React.CSSProperties = {
  background: 'var(--bg-page)',
  borderColor: 'var(--border)',
};

function SiteForm({
  mode,
  site,
  submitting,
  onSubmit,
  onClose,
}: {
  mode: 'create' | 'edit';
  site?: SiteNode;
  submitting: boolean;
  onSubmit: (form: FormData) => void;
  onClose: () => void;
}) {
  return (
    <FormShell
      title={mode === 'edit' ? `Edit Site: ${site?.name}` : 'New Site'}
      subtitle="A site is one physical address. e.g. 'Plant 1', 'Houston Yard'."
      submitting={submitting}
      onSubmit={onSubmit}
      onClose={onClose}
      submitLabel={mode === 'edit' ? 'Save changes' : 'Create site'}
    >
      <div>
        <label className={labelCls}>Name *</label>
        <input name="name" defaultValue={site?.name || ''} required className={inputCls} style={inputStyle} placeholder="e.g. Plant 1" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Code (optional)</label>
          <input name="code" defaultValue={site?.code || ''} className={inputCls} style={inputStyle} placeholder="e.g. PLT-1" />
        </div>
        <div>
          <label className={labelCls}>Timezone (optional)</label>
          <input name="timezone" defaultValue={site?.timezone || ''} className={inputCls} style={inputStyle} placeholder="America/Chicago" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Address (optional)</label>
        <input name="address" defaultValue={site?.address || ''} className={inputCls} style={inputStyle} placeholder="123 Industrial Blvd, City, ST" />
      </div>
      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea name="notes" rows={2} className={inputCls} style={inputStyle} />
      </div>
    </FormShell>
  );
}

function BuildingForm({
  mode,
  building,
  submitting,
  onSubmit,
  onClose,
}: {
  mode: 'create' | 'edit';
  building?: BuildingNode;
  submitting: boolean;
  onSubmit: (form: FormData) => void;
  onClose: () => void;
}) {
  return (
    <FormShell
      title={mode === 'edit' ? `Edit Building: ${building?.name}` : 'New Building'}
      subtitle="A building inside a site. e.g. 'Building A', 'Warehouse 3'."
      submitting={submitting}
      onSubmit={onSubmit}
      onClose={onClose}
      submitLabel={mode === 'edit' ? 'Save changes' : 'Create building'}
    >
      <div>
        <label className={labelCls}>Name *</label>
        <input name="name" defaultValue={building?.name || ''} required className={inputCls} style={inputStyle} placeholder="e.g. Building A" />
      </div>
      <div>
        <label className={labelCls}>Code (optional)</label>
        <input name="code" defaultValue={building?.code || ''} className={inputCls} style={inputStyle} placeholder="e.g. BLDG-A" />
      </div>
      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea name="notes" rows={2} className={inputCls} style={inputStyle} />
      </div>
    </FormShell>
  );
}

function FloorForm({
  mode,
  floor,
  submitting,
  onSubmit,
  onClose,
}: {
  mode: 'create' | 'edit';
  floor?: FloorNode;
  submitting: boolean;
  onSubmit: (form: FormData) => void;
  onClose: () => void;
}) {
  return (
    <FormShell
      title={mode === 'edit' ? `Edit Floor: ${floor?.name}` : 'New Floor'}
      subtitle="A floor inside a building. Use level −1 for basement, 0 for ground."
      submitting={submitting}
      onSubmit={onSubmit}
      onClose={onClose}
      submitLabel={mode === 'edit' ? 'Save changes' : 'Create floor'}
    >
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Name *</label>
          <input name="name" defaultValue={floor?.name || ''} required className={inputCls} style={inputStyle} placeholder="e.g. Ground, Floor 2, Mezzanine" />
        </div>
        <div>
          <label className={labelCls}>Level (optional)</label>
          <input
            type="number"
            name="level"
            defaultValue={floor?.level ?? ''}
            className={inputCls}
            style={inputStyle}
            placeholder="0"
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea name="notes" rows={2} className={inputCls} style={inputStyle} />
      </div>
    </FormShell>
  );
}

function RoomForm({
  mode,
  room,
  submitting,
  onSubmit,
  onClose,
}: {
  mode: 'create' | 'edit';
  room?: RoomNode;
  submitting: boolean;
  onSubmit: (form: FormData) => void;
  onClose: () => void;
}) {
  return (
    <FormShell
      title={mode === 'edit' ? `Edit Room: ${room?.name}` : 'New Room'}
      subtitle="A room, bay, line, or zone on this floor."
      submitting={submitting}
      onSubmit={onSubmit}
      onClose={onClose}
      submitLabel={mode === 'edit' ? 'Save changes' : 'Create room'}
    >
      <div>
        <label className={labelCls}>Name *</label>
        <input name="name" defaultValue={room?.name || ''} required className={inputCls} style={inputStyle} placeholder="e.g. Bay A, Line 3, Mech Room" />
      </div>
      <div>
        <label className={labelCls}>Code (optional)</label>
        <input name="code" defaultValue={room?.code || ''} className={inputCls} style={inputStyle} placeholder="e.g. R-204" />
      </div>
      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea name="notes" rows={2} className={inputCls} style={inputStyle} />
      </div>
    </FormShell>
  );
}
