/**
 * Replays queued mutations against the API.
 *
 * Strategy:
 *   - Process FIFO, one at a time, so server-side state stays sane even
 *     if the user toggled status A → B → A while offline.
 *   - Each successful send removes the mutation from the queue.
 *   - Each failure increments attemptCount, records the error, and stops
 *     the drain — the next online cycle will retry.
 *   - After 5 failed attempts a mutation is left in the queue but marked
 *     as `failed`; the user can manually clear it from the sync drawer.
 */

import { workOrdersApi } from '@/api/endpoints';
import { readQueue, removeById, updateById } from './syncQueue';
import type { QueuedMutation } from './types';

export const MAX_ATTEMPTS = 5;

/** Send a single mutation. Throws on transport / server failure. */
async function dispatchMutation(m: QueuedMutation): Promise<void> {
  switch (m.kind) {
    case 'workOrder.updateStatus': {
      const status = m.payload.status as string;
      await workOrdersApi.updateStatus(m.targetId, status as never);
      return;
    }
    case 'workOrder.update': {
      await workOrdersApi.update(m.targetId, m.payload as never);
      return;
    }
    default: {
      // Unknown kind — drop it so it doesn't poison the queue forever.
      throw new Error(`Unsupported mutation kind: ${(m as QueuedMutation).kind}`);
    }
  }
}

export interface DrainResult {
  sent: number;
  failed: number;
  remaining: number;
  lastError: string | null;
}

/**
 * Drain the queue. Returns counts so the caller (SyncContext) can update
 * UI state without re-reading storage.
 */
export async function drainQueue(): Promise<DrainResult> {
  let sent = 0;
  let failed = 0;
  let lastError: string | null = null;

  while (true) {
    const queue = await readQueue();
    // Pick the first non-exhausted mutation.
    const next = queue.find((m) => m.attemptCount < MAX_ATTEMPTS);
    if (!next) {
      return { sent, failed, remaining: queue.length, lastError };
    }

    try {
      await dispatchMutation(next);
      await removeById(next.id);
      sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      lastError = message;
      failed += 1;
      await updateById(next.id, {
        attemptCount: next.attemptCount + 1,
        lastAttemptAt: new Date().toISOString(),
        lastError: message,
      });
      // Stop the drain — likely a network blip; we'll retry on next online tick.
      const remaining = (await readQueue()).length;
      return { sent, failed, remaining, lastError };
    }
  }
}
