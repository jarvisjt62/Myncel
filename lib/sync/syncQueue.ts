/**
 * localStorage-backed FIFO queue for offline mutations.
 *
 * Why localStorage and not IndexedDB:
 *   - Queue entries are tiny JSON objects (no blobs/photos)
 *   - localStorage is sync, simple, and ~5 MB — enough for ~10,000 mutations
 *   - Works identically in browsers and the Capacitor WebView
 *
 * All operations are wrapped in `safeStorage()` so this module never
 * crashes when running on the server (Next.js SSR pass) or when
 * localStorage is disabled (private mode in some browsers).
 */

import type { QueuedMutation } from './types';

const STORAGE_KEY = 'myncel.sync.queue.v1';

/** Returns the localStorage-like store, or `null` on the server / when disabled. */
function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    // Touch storage to force the "is it available?" exception path.
    const probe = '__myncel_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Read the entire queue. Returns [] on first run / corrupt data / no storage. */
export function readQueue(): QueuedMutation[] {
  const store = safeStorage();
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedMutation[]) : [];
  } catch {
    return [];
  }
}

/** Persist the queue. Silently swallows quota/storage errors. */
export function writeQueue(queue: QueuedMutation[]): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* quota exceeded — accept the loss; next successful write re-syncs */
  }
}

/** Append a mutation to the tail of the queue. */
export function enqueue(mutation: QueuedMutation): QueuedMutation[] {
  const next = [...readQueue(), mutation];
  writeQueue(next);
  return next;
}

/** Remove a mutation by ID (used after successful send). */
export function removeById(id: string): QueuedMutation[] {
  const next = readQueue().filter((m) => m.id !== id);
  writeQueue(next);
  return next;
}

/** Replace the entry for a single ID (used to bump attemptCount/lastError). */
export function updateById(
  id: string,
  patch: Partial<QueuedMutation>
): QueuedMutation[] {
  const next = readQueue().map((m) => (m.id === id ? { ...m, ...patch } : m));
  writeQueue(next);
  return next;
}

/** Wipe the queue entirely. */
export function clearQueue(): void {
  const store = safeStorage();
  if (store) store.removeItem(STORAGE_KEY);
}

/** Generate a reasonably-unique mutation ID without pulling in uuid. */
export function newMutationId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
