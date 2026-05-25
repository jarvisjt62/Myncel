/**
 * AsyncStorage-backed FIFO queue for offline mutations.
 *
 * All reads/writes are async because AsyncStorage is async. The queue is
 * intentionally tiny and JSON-serializable — anything more complex (binary
 * uploads, photo blobs) would belong in a dedicated dataStore, not here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueuedMutation } from './types';

const STORAGE_KEY = 'myncel.sync.queue.v1';

/** Read the entire queue from disk. Returns [] on first run / corrupt data. */
export async function readQueue(): Promise<QueuedMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedMutation[]) : [];
  } catch {
    return [];
  }
}

/** Persist the queue to disk. */
export async function writeQueue(queue: QueuedMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Disk full / quota exceeded — best we can do is keep the in-memory
    // copy. The next successful write will re-sync.
  }
}

/** Append one mutation to the tail of the queue. */
export async function enqueue(mutation: QueuedMutation): Promise<QueuedMutation[]> {
  const current = await readQueue();
  const next = [...current, mutation];
  await writeQueue(next);
  return next;
}

/** Remove a mutation by ID (used after successful send). */
export async function removeById(id: string): Promise<QueuedMutation[]> {
  const current = await readQueue();
  const next = current.filter((m) => m.id !== id);
  await writeQueue(next);
  return next;
}

/** Replace the entry for a single ID (used to bump attemptCount/lastError). */
export async function updateById(
  id: string,
  patch: Partial<QueuedMutation>
): Promise<QueuedMutation[]> {
  const current = await readQueue();
  const next = current.map((m) => (m.id === id ? { ...m, ...patch } : m));
  await writeQueue(next);
  return next;
}

/** Wipe the queue entirely — exposed for the "clear failed" UX. */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Generate a reasonably-unique mutation ID without pulling in uuid. */
export function newMutationId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
