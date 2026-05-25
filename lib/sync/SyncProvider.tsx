'use client';

/**
 * SyncProvider
 * ────────────
 * Browser-native sync context. Captures mutations into a localStorage
 * FIFO queue while `navigator.onLine` is false, then auto-drains them
 * when connectivity returns. Works in both desktop browsers and the
 * Capacitor WebView shell.
 *
 * Connectivity detection:
 *   - Listens to `online` / `offline` window events (zero-cost, native)
 *   - Polls every 30s as a safety net (some Capacitor builds don't
 *     fire the events reliably)
 *   - Re-checks on tab visibility change (PWA returning from background)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  enqueue,
  newMutationId,
  readQueue,
  removeById,
  writeQueue,
} from './syncQueue';
import { drainQueue, MAX_ATTEMPTS } from './processor';
import type {
  ConnectivityState,
  ItemSyncStatus,
  QueuedMutation,
  QueuedMutationKind,
} from './types';

export interface SyncContextValue {
  connectivity: ConnectivityState;
  pending: QueuedMutation[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;

  /**
   * Push a mutation into the queue. Drains immediately if online,
   * otherwise waits for the next connectivity transition.
   */
  enqueueMutation: (input: {
    kind: QueuedMutationKind;
    targetId: string;
    payload: Record<string, unknown>;
    label: string;
  }) => Promise<QueuedMutation>;

  /** Manually trigger a drain. */
  retryNow: () => Promise<void>;

  /** Drop a single mutation from the queue. */
  discardMutation: (id: string) => void;

  /** Per-target sync status — used to badge individual list/detail items. */
  statusForTarget: (targetId: string) => ItemSyncStatus;
}

const SyncContext = createContext<SyncContextValue | null>(null);

function probeOnline(): ConnectivityState {
  if (typeof navigator === 'undefined') return 'unknown';
  return navigator.onLine ? 'online' : 'offline';
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [connectivity, setConnectivity] = useState<ConnectivityState>('unknown');
  const [pending, setPending] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const drainingRef = useRef(false);
  const inflightIdRef = useRef<string | null>(null);

  const refreshPending = useCallback(() => {
    setPending(readQueue());
  }, []);

  // Hydrate queue snapshot + initial connectivity probe on mount.
  useEffect(() => {
    refreshPending();
    setConnectivity(probeOnline());
  }, [refreshPending]);

  const runDrain = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    setIsSyncing(true);
    setLastError(null);
    try {
      const head = readQueue()[0];
      inflightIdRef.current = head?.id ?? null;
      const result = await drainQueue();
      if (result.sent > 0) setLastSyncedAt(new Date().toISOString());
      if (result.lastError) setLastError(result.lastError);
    } finally {
      inflightIdRef.current = null;
      drainingRef.current = false;
      setIsSyncing(false);
      refreshPending();
    }
  }, [refreshPending]);

  // Wire connectivity events + visibility + periodic safety probe.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setConnectivity('online');
      runDrain();
    };
    const handleOffline = () => {
      setConnectivity('offline');
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const next = probeOnline();
        setConnectivity((prev) => {
          if (prev !== 'online' && next === 'online') runDrain();
          return next;
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    // Safety net: re-probe every 30s in case the events misbehave inside
    // a Capacitor WebView. Cheap — just reads navigator.onLine.
    const timer = window.setInterval(() => {
      const next = probeOnline();
      setConnectivity((prev) => {
        if (prev !== 'online' && next === 'online') runDrain();
        return next;
      });
    }, 30_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(timer);
    };
  }, [runDrain]);

  const enqueueMutation: SyncContextValue['enqueueMutation'] = useCallback(
    async ({ kind, targetId, payload, label }) => {
      const mutation: QueuedMutation = {
        id: newMutationId(),
        kind,
        targetId,
        payload,
        label,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        lastAttemptAt: null,
        lastError: null,
      };
      enqueue(mutation);
      refreshPending();
      // Fire-and-forget drain. If offline it'll bail immediately.
      runDrain();
      return mutation;
    },
    [refreshPending, runDrain]
  );

  const retryNow = useCallback(async () => {
    // Reset attempt counters so user-driven retries don't insta-fail.
    const reset = readQueue().map((m) => ({
      ...m,
      attemptCount: 0,
      lastError: null,
    }));
    writeQueue(reset);
    refreshPending();
    await runDrain();
  }, [refreshPending, runDrain]);

  const discardMutation = useCallback(
    (id: string) => {
      removeById(id);
      refreshPending();
    },
    [refreshPending]
  );

  const statusForTarget = useCallback(
    (targetId: string): ItemSyncStatus => {
      const match = pending.find((m) => m.targetId === targetId);
      if (!match) return 'idle';
      if (inflightIdRef.current === match.id) return 'syncing';
      if (match.attemptCount >= MAX_ATTEMPTS) return 'failed';
      return 'pending';
    },
    [pending]
  );

  const value = useMemo<SyncContextValue>(
    () => ({
      connectivity,
      pending,
      isSyncing,
      lastSyncedAt,
      lastError,
      enqueueMutation,
      retryNow,
      discardMutation,
      statusForTarget,
    }),
    [
      connectivity,
      pending,
      isSyncing,
      lastSyncedAt,
      lastError,
      enqueueMutation,
      retryNow,
      discardMutation,
      statusForTarget,
    ]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSync() must be used inside <SyncProvider>');
  }
  return ctx;
}
