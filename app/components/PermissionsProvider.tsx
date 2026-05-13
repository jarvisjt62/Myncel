'use client';

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';

type PermissionState = {
  keys: Set<string>;
  isPlatformAdmin: boolean;
  loaded: boolean;
  /** True if user has every listed permission (AND logic). */
  hasAll: (...keys: string[]) => boolean;
  /** True if user has at least one of the listed permissions (OR logic). */
  hasAny: (...keys: string[]) => boolean;
  /** Alias for hasAll with a single key. */
  can: (key: string) => boolean;
  /** Re-fetch from the server (e.g. after a role change). */
  refresh: () => Promise<void>;
};

const EMPTY: PermissionState = {
  keys: new Set(),
  isPlatformAdmin: false,
  loaded: false,
  hasAll: () => false,
  hasAny: () => false,
  can: () => false,
  refresh: async () => {},
};

const Ctx = createContext<PermissionState>(EMPTY);

/**
 * Wraps the dashboard tree so every component can read effective permissions
 * via usePermissions() without its own fetch.
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/me/permissions', { cache: 'no-store' });
      if (!res.ok) { setLoaded(true); return; }
      const data = await res.json();
      setKeys(new Set<string>(data.keys || []));
      setIsPlatformAdmin(!!data.isPlatformAdmin);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const hasAll = useCallback((...wanted: string[]) => {
    if (isPlatformAdmin) return true;
    return wanted.every(k => keys.has(k));
  }, [keys, isPlatformAdmin]);

  const hasAny = useCallback((...wanted: string[]) => {
    if (isPlatformAdmin) return true;
    return wanted.some(k => keys.has(k));
  }, [keys, isPlatformAdmin]);

  const can = useCallback((k: string) => isPlatformAdmin || keys.has(k), [keys, isPlatformAdmin]);

  const value: PermissionState = { keys, isPlatformAdmin, loaded, hasAll, hasAny, can, refresh };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePermissions() {
  return useContext(Ctx);
}

/**
 * Convenience wrapper that conditionally renders children when a permission
 * is present. Falls back to `fallback` if provided.
 *
 *   <Can permission="work_orders.delete">
 *     <DeleteButton />
 *   </Can>
 */
export function Can({
  permission,
  permissions,
  mode = 'all',
  fallback = null,
  children,
}: {
  permission?: string;
  permissions?: string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { hasAll, hasAny, loaded } = usePermissions();
  if (!loaded) return null; // don't flicker before we know
  const keys = permission ? [permission] : (permissions ?? []);
  if (keys.length === 0) return <>{children}</>;
  const ok = mode === 'all' ? hasAll(...keys) : hasAny(...keys);
  return <>{ok ? children : fallback}</>;
}
