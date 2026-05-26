/**
 * Helpers to build location breadcrumbs from a Machine row that has the
 * `site / building / floor / room` relations included.
 *
 * Use:
 *   import { breadcrumbForMachine, breadcrumbString } from '@/lib/locations/breadcrumb';
 *   const parts = breadcrumbForMachine(machine);
 *   const text  = breadcrumbString(machine);  // "Plant 1 › Bldg A › Floor 2 › Bay 3"
 */

export type LocationLike = {
  site?: { name: string } | null;
  building?: { name: string } | null;
  floor?: { name: string } | null;
  room?: { name: string } | null;
  // legacy free-text — used as a fallback when nothing structured is set
  location?: string | null;
};

/** Returns ordered, non-empty crumb names. Falls back to legacy `location` string. */
export function breadcrumbForMachine(m: LocationLike): string[] {
  const crumbs = [m.site?.name, m.building?.name, m.floor?.name, m.room?.name].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  );
  if (crumbs.length > 0) return crumbs;
  if (m.location && m.location.trim().length > 0) return [m.location.trim()];
  return [];
}

/** Joined "A › B › C" string. Empty string if no location info. */
export function breadcrumbString(m: LocationLike, separator = ' › '): string {
  return breadcrumbForMachine(m).join(separator);
}

/** Same crumbs but emoji-prefixed for compact list rows. Empty string if none. */
export function breadcrumbLabel(m: LocationLike): string {
  const s = breadcrumbString(m);
  return s ? `📍 ${s}` : '';
}
