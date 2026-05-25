/**
 * Lightweight IP → geo lookup for the super-admin login-activity dashboard.
 *
 * Strategy:
 *   - Use the free, no-key `ip-api.com` endpoint (45 req/min limit, plenty for
 *     login-event tagging).
 *   - 1.5-second timeout — if the lookup is slow or fails, return null and
 *     just store the raw IP. Login flow MUST NOT block on geo.
 *   - Skip private / loopback / unknown IPs entirely.
 *   - Tiny in-process LRU cache so repeated logins from the same IP don't
 *     hammer the API.
 *
 * Returns a compact `{ city, region, country, countryCode }` shape that can
 * be stored as JSON in `AuditLog.changes.geo`.
 */

export interface GeoInfo {
  city?: string;
  region?: string; // state / province
  country?: string;
  countryCode?: string; // 2-letter ISO
  isp?: string;
}

const CACHE = new Map<string, { value: GeoInfo | null; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CACHE_MAX_ENTRIES = 500;

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return true;
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  // 172.16.0.0 – 172.31.255.255
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1] ?? '0', 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith('fc00:') || ip.startsWith('fd')) return true; // ipv6 ULA
  if (ip.startsWith('fe80:')) return true; // ipv6 link-local
  return false;
}

function cacheGet(ip: string): GeoInfo | null | undefined {
  const hit = CACHE.get(ip);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    CACHE.delete(ip);
    return undefined;
  }
  return hit.value;
}

function cacheSet(ip: string, value: GeoInfo | null) {
  if (CACHE.size >= CACHE_MAX_ENTRIES) {
    const firstKey = CACHE.keys().next().value;
    if (firstKey) CACHE.delete(firstKey);
  }
  CACHE.set(ip, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Look up geo info for an IP. Never throws; returns null on any failure.
 */
export async function lookupGeo(ip: string): Promise<GeoInfo | null> {
  if (isPrivateIp(ip)) return null;

  const cached = cacheGet(ip);
  if (cached !== undefined) return cached;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);

  try {
    // ip-api.com: free, no key, http-only on the free plan but they also
    // accept https on a different path. We use http for the free tier.
    // Fields filter trims response size.
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,isp`,
      { signal: ctrl.signal, cache: 'no-store' }
    );
    clearTimeout(timer);

    if (!res.ok) {
      cacheSet(ip, null);
      return null;
    }

    const data = await res.json();
    if (data?.status !== 'success') {
      cacheSet(ip, null);
      return null;
    }

    const geo: GeoInfo = {
      city: data.city || undefined,
      region: data.regionName || undefined,
      country: data.country || undefined,
      countryCode: data.countryCode || undefined,
      isp: data.isp || undefined,
    };
    cacheSet(ip, geo);
    return geo;
  } catch {
    clearTimeout(timer);
    cacheSet(ip, null);
    return null;
  }
}

/**
 * Pretty-print a geo result for one-line display in tables.
 *   "San Francisco, CA, United States"
 *   "—" if null/empty
 */
export function formatGeo(g: GeoInfo | null | undefined): string {
  if (!g) return '—';
  const parts = [g.city, g.region, g.country].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}
