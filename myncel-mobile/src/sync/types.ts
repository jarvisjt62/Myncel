/**
 * Sync queue type definitions.
 *
 * The mobile app captures field-side mutations (status changes, completion
 * notes, etc.) into a persistent FIFO queue while the device is offline,
 * then drains them automatically once connectivity is restored. Every
 * queued mutation has just enough metadata for the processor to replay it
 * via the existing typed API surface.
 */

export type QueuedMutationKind =
  | 'workOrder.updateStatus'
  | 'workOrder.update';

export interface QueuedMutation {
  /** Stable client-side ID — used as the React key in the pending list. */
  id: string;

  /** Which API call this represents. */
  kind: QueuedMutationKind;

  /** Resource ID (e.g. WorkOrder.id) the mutation targets. */
  targetId: string;

  /** Free-form payload — shape depends on `kind`. */
  payload: Record<string, unknown>;

  /** Human-readable description shown in the pending drawer. */
  label: string;

  /** ISO timestamp when the user kicked off the mutation. */
  createdAt: string;

  /** How many times the processor has tried to send this. */
  attemptCount: number;

  /** ISO timestamp of the last attempt; `null` if never tried. */
  lastAttemptAt: string | null;

  /** Last error message from the server, if any. */
  lastError: string | null;
}

export type ConnectivityState = 'online' | 'offline' | 'unknown';

export type ItemSyncStatus =
  | 'idle'      // not in queue
  | 'pending'   // queued, not yet attempted
  | 'syncing'   // currently being sent
  | 'failed';   // hit max retries
