'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
  isPending: boolean;
}

/**
 * Super-admin action: hard-delete a user account directly from the
 * global /admin/users list.
 *
 * Two visual modes:
 *   - For users with deletionRequestedAt set ("pending deletion"),
 *     this renders as a prominent amber "Purge now" button — used
 *     when the super admin wants to skip the 14-day grace and remove
 *     the account immediately (e.g. user requested early purge).
 *   - For active users, it renders as a small red "Remove" button.
 *
 * Calls DELETE /api/admin/users/[userId], which now nulls the FK
 * references to WorkOrder and RemoteSupportSession before deletion
 * so the operation actually succeeds even on databases where the
 * onDelete: SetNull migration has not yet been applied.
 */
export default function RemoveUserButton({
  userId,
  userEmail,
  userName,
  isPending,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    const verb = isPending ? 'PURGE' : 'PERMANENTLY DELETE';
    const ok = confirm(
      `${verb} the user "${userName}" (${userEmail})?\n\n` +
        (isPending
          ? 'This account is already scheduled for deletion. Purging now ' +
            'skips the remaining grace period and removes the account ' +
            'immediately. This cannot be undone.'
          : 'This will hard-delete the user, null any work-order and ' +
            'remote-support attribution, and remove their sessions, ' +
            'push tokens, and notifications. This cannot be undone.')
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // Refresh the page so the user disappears from the list.
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed');
      setBusy(false);
      setTimeout(() => setError(null), 6000);
    }
  }

  if (error) {
    return (
      <span
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap"
        title={error}
      >
        ✗ {error.slice(0, 32)}
      </span>
    );
  }

  if (isPending) {
    return (
      <button
        onClick={run}
        disabled={busy}
        title="Skip the 14-day grace period and permanently delete this user now."
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {busy ? 'Purging…' : 'Purge now'}
      </button>
    );
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      title="Permanently delete this user account."
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors whitespace-nowrap disabled:opacity-50"
    >
      {busy ? 'Removing…' : 'Remove'}
    </button>
  );
}
