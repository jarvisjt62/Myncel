'use client';

/**
 * LocationPicker — 4-level hierarchy picker (Site → Building → Floor → Room).
 *
 * Each level is optional. Selecting a parent narrows the children. Clearing
 * a parent automatically clears all descendants. The component fetches
 * `/api/locations/tree` once on mount.
 *
 * Usage:
 *   <LocationPicker
 *     value={{ siteId, buildingId, floorId, roomId }}
 *     onChange={(v) => setForm({ ...form, ...v })}
 *   />
 */

import { useEffect, useMemo, useState } from 'react';

export interface LocationValue {
  siteId: string | null;
  buildingId: string | null;
  floorId: string | null;
  roomId: string | null;
}

interface RoomNode { id: string; name: string }
interface FloorNode { id: string; name: string; level: number | null; rooms: RoomNode[] }
interface BuildingNode { id: string; name: string; floors: FloorNode[] }
interface SiteNode { id: string; name: string; buildings: BuildingNode[] }

interface Props {
  value: Partial<LocationValue>;
  onChange: (next: LocationValue) => void;
  /** Optional className applied to each <select>. */
  selectClassName?: string;
  /** Optional inline style applied to each <select>. */
  selectStyle?: React.CSSProperties;
  /** Optional className for the field labels. */
  labelClassName?: string;
  /** Compact horizontal layout instead of stacked. */
  compact?: boolean;
}

export default function LocationPicker({
  value,
  onChange,
  selectClassName,
  selectStyle,
  labelClassName,
  compact = false,
}: Props) {
  const [sites, setSites] = useState<SiteNode[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/locations/tree', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setSites(d?.sites || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const site = useMemo(() => sites.find((s) => s.id === value.siteId) || null, [sites, value.siteId]);
  const building = useMemo(
    () => site?.buildings.find((b) => b.id === value.buildingId) || null,
    [site, value.buildingId],
  );
  const floor = useMemo(
    () => building?.floors.find((f) => f.id === value.floorId) || null,
    [building, value.floorId],
  );

  // Cascade-clear when a parent changes
  function setSite(id: string) {
    onChange({ siteId: id || null, buildingId: null, floorId: null, roomId: null });
  }
  function setBuilding(id: string) {
    onChange({
      siteId: value.siteId || null,
      buildingId: id || null,
      floorId: null,
      roomId: null,
    });
  }
  function setFloor(id: string) {
    onChange({
      siteId: value.siteId || null,
      buildingId: value.buildingId || null,
      floorId: id || null,
      roomId: null,
    });
  }
  function setRoom(id: string) {
    onChange({
      siteId: value.siteId || null,
      buildingId: value.buildingId || null,
      floorId: value.floorId || null,
      roomId: id || null,
    });
  }

  const selCls = selectClassName ?? 'w-full rounded-lg border px-3 py-2 text-sm';
  const lblCls = labelClassName ?? 'block text-xs font-medium text-[var(--text-secondary)] mb-1';

  return (
    <div className={compact ? 'grid grid-cols-2 sm:grid-cols-4 gap-2' : 'space-y-3'}>
      <div>
        <label className={lblCls}>Site</label>
        <select
          value={value.siteId || ''}
          onChange={(e) => setSite(e.target.value)}
          className={selCls}
          style={selectStyle}
          disabled={!loaded || sites.length === 0}
        >
          <option value="">{loaded && sites.length === 0 ? '— No sites yet —' : '— None —'}</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={lblCls}>Building</label>
        <select
          value={value.buildingId || ''}
          onChange={(e) => setBuilding(e.target.value)}
          className={selCls}
          style={selectStyle}
          disabled={!site}
        >
          <option value="">— None —</option>
          {site?.buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={lblCls}>Floor</label>
        <select
          value={value.floorId || ''}
          onChange={(e) => setFloor(e.target.value)}
          className={selCls}
          style={selectStyle}
          disabled={!building}
        >
          <option value="">— None —</option>
          {building?.floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
              {f.level !== null ? ` (lvl ${f.level})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={lblCls}>Room</label>
        <select
          value={value.roomId || ''}
          onChange={(e) => setRoom(e.target.value)}
          className={selCls}
          style={selectStyle}
          disabled={!floor}
        >
          <option value="">— None —</option>
          {floor?.rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      {loaded && sites.length === 0 && !compact && (
        <p className="text-xs text-[var(--text-muted)] italic">
          Define sites and buildings in <a href="/settings/locations" className="underline">Settings → Locations</a> to use the structured picker.
        </p>
      )}
    </div>
  );
}
