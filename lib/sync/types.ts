/**
 * Web sync queue — type definitions.
 *
 * Captures field-side mutations (status changes, alert resolutions,
 * machine edits, part stock adjustments, etc.) into a persistent FIFO
 * queue while the device is offline, then drains them automatically
 * once connectivity is restored. Lives in `lib/sync/` so both the
 * dashboard pages and the Capacitor mobile app (which loads this same
 * Next.js bundle) get the offline behavior for free.
 *
 * Big-Bet expansion (v2):
 *   - Originally covered only `workOrder.updateStatus` / `workOrder.update`.
 *   - Now also covers alerts, machines, and parts so a technician can
 *     resolve an alarm, mark a machine as serviced, or adjust part
 *     stock from a tunnel/basement and have everything replay cleanly.
 */

export type QueuedMutationKind =
  | 'workOrder.updateStatus'
  | 'workOrder.update'
  | 'alert.resolve'
  | 'machine.update'
  | 'part.update';

export interface QueuedMutation {
  /** Stable client-side ID — used as the React key in the pending list. */
  id: string;

  /** Which API call this represents. */
  kind: QueuedMutationKind;

  /** Resource ID (e.g. WorkOrder.id) the mutation targets. */
  targetId: string;

  /** JSON body sent to the API. */
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

export type ItemSyncStatus = 'idle' | 'pending' | 'syncing' | 'failed';
