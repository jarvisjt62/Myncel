/**
 * SyncContext
 * ───────────
 * App-wide source of truth for offline sync state. Screens that need to
 * mutate data should call `enqueueMutation()` from this context instead
 * of hitting `workOrdersApi` directly — that way a status change made
 * in a tunnel still reaches the server when the tech walks back outside.
 *
 * Rendering optimization: the context is split into `useSync()` for
 * status bits (re-renders all consumers) and a stable mutation function
 * accessed via the same hook. We keep the value object reference-stable
 * across renders unless something genuinely changed.
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
import { AppState, type AppStateStatus } from 'react-native';

import { probeOnline } from './connectivity';
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
  /** Best-effort connectivity. `unknown` until the first probe completes. */
  connectivity: ConnectivityState;

  /** Snapshot of pending mutations (oldest first). */
  pending: QueuedMutation[];

  /** True while a drain is in flight. */
  isSyncing: boolean;

  /** Last successful drain timestamp, or `null`. */
  lastSyncedAt: string | null;

  /** Most recent error message from the last failed drain, or `null`. */
  lastError: string | null;

  /**
   * Push a mutation into the queue. If the device is online the
   * processor kicks in immediately; otherwise it waits for connectivity.
   * Returns the queued mutation so callers can correlate optimistic UI
   * updates with eventual server confirmation.
   */
  enqueueMutation: (input: {
    kind: QueuedMutationKind;
    targetId: string;
    payload: Record<string, unknown>;
    label: string;
  }) => Promise<QueuedMutation>;

  /** Manually trigger a drain (Retry-now button in the sync drawer). */
  retryNow: () => Promise<void>;

  /** Drop a single mutation from the queue (for permanently-failed items). */
  discardMutation: (id: string) => Promise<void>;

  /** Per-target sync status — used to badge individual list/detail items. */
  statusForTarget: (targetId: string) => ItemSyncStatus;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [connectivity, setConnectivity] = useState<ConnectivityState>('unknown');
  const [pending, setPending] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Avoid overlapping drains.
  const drainingRef = useRef(false);
  // Track which mutation is currently being sent (for per-item 'syncing' badge).
  const inflightIdRef = useRef<string | null>(null);

  const refreshPending = useCallback(async () => {
    const q = await readQueue();
    setPending(q);
  }, []);

  // Hydrate the queue snapshot once on mount.
  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const runDrain = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    setIsSyncing(true);
    setLastError(null);
    try {
      // Snapshot before drain so we can mark the head as inflight.
      const head = (await readQueue())[0];
      inflightIdRef.current = head?.id ?? null;
      const result = await drainQueue();
      if (result.sent > 0) {
        setLastSyncedAt(new Date().toISOString());
      }
      if (result.lastError) {
        setLastError(result.lastError);
      }
    } finally {
      inflightIdRef.current = null;
      drainingRef.current = false;
      setIsSyncing(false);
      await refreshPending();
    }
  }, [refreshPending]);

  // Periodic connectivity probe + drain on transition to online.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      const state = await probeOnline();
      if (cancelled) return;
      setConnectivity((prev) => {
        // Transition offline → online: kick off a drain.
        if (prev !== 'online' && state === 'online') {
          runDrain();
        }
        return state;
      });
    };

    tick(); // initial probe
    timer = setInterval(tick, 15_000); // every 15s — cheap, native call

    // Also probe whenever the app comes back to the foreground.
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') tick();
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      sub.remove();
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
      await enqueue(mutation);
      await refreshPending();
      // Fire-and-forget drain — if offline it'll bail fast and the
      // periodic tick will pick it up later.
      runDrain();
      return mutation;
    },
    [refreshPending, runDrain]
  );

  const retryNow = useCallback(async () => {
    // Reset attempt counters so user-driven retries don't immediately
    // hit the MAX_ATTEMPTS ceiling.
    const q = await readQueue();
    const reset = q.map((m) => ({ ...m, attemptCount: 0, lastError: null }));
    await writeQueue(reset);
    await refreshPending();
    await runDrain();
  }, [refreshPending, runDrain]);

  const discardMutation = useCallback(
    async (id: string) => {
      await removeById(id);
      await refreshPending();
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
