/**
 * Replays queued mutations against the API.
 *
 * Strategy:
 *   - Process FIFO, one at a time, so server-side state stays sane
 *     even if the user toggled status A → B → A while offline.
 *   - Each successful send removes the mutation from the queue.
 *   - Each failure increments attemptCount and stops the drain — the
 *     next online cycle will retry.
 *   - After MAX_ATTEMPTS the mutation is left in the queue but marked
 *     as `failed`; the user can manually discard it from the drawer.
 */

import { readQueue, removeById, updateById } from './syncQueue';
import type { QueuedMutation } from './types';

export const MAX_ATTEMPTS = 5;

/** Map a mutation kind to an HTTP request and dispatch it. Throws on failure. */
async function dispatchMutation(m: QueuedMutation): Promise<void> {
  switch (m.kind) {
    case 'workOrder.updateStatus':
    case 'workOrder.update': {
      const res = await fetch(`/api/work-orders/${m.targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m.payload),
      });
      if (!res.ok) {
        // Surface the server's error so the drawer can show it.
        let detail = `${res.status} ${res.statusText}`;
        try {
          const data = await res.json();
          if (data?.error) detail = data.error;
        } catch { /* response wasn't JSON */ }
        throw new Error(detail);
      }
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

/** Drain the queue. Returns counts so callers can update UI without re-reading. */
export async function drainQueue(): Promise<DrainResult> {
  let sent = 0;
  let failed = 0;
  let lastError: string | null = null;

  // Hard ceiling so a runaway loop can't lock the tab.
  const HARD_LIMIT = 100;
  for (let i = 0; i < HARD_LIMIT; i += 1) {
    const queue = readQueue();
    const next = queue.find((m) => m.attemptCount < MAX_ATTEMPTS);
    if (!next) {
      return { sent, failed, remaining: queue.length, lastError };
    }

    try {
      await dispatchMutation(next);
      removeById(next.id);
      sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      lastError = message;
      failed += 1;
      updateById(next.id, {
        attemptCount: next.attemptCount + 1,
        lastAttemptAt: new Date().toISOString(),
        lastError: message,
      });
      // Stop the drain — likely a network blip; we'll retry on next online tick.
      const remaining = readQueue().length;
      return { sent, failed, remaining, lastError };
    }
  }

  return { sent, failed, remaining: readQueue().length, lastError };
}
