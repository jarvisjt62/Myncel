'use client';

/**
 * DeleteAccountSection
 *
 * Settings UI for permanent account deletion.
 *
 * Required by Apple App Review Guideline 5.1.1(v): apps that allow
 * account creation must allow in-app account deletion.
 *
 * Behavior:
 *   - On mount, GET /api/user/delete-account to determine whether
 *     deletion is already pending or whether the user is blocked
 *     because they own a multi-user organization.
 *   - "Delete account" button opens a confirmation dialog.
 *   - Confirmation requires (a) typing the literal word DELETE and
 *     (b) re-entering the user's current password.
 *   - On success, the user is signed out and redirected to a
 *     confirmation page.
 *
 * Apple's reviewer needs to be able to demonstrate: account creation
 * → navigate to deletion option → complete the deletion flow. This
 * section is reachable from /settings/security which is in the
 * primary settings nav, two clicks from the dashboard.
 */

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DeletionStatus {
  pending: boolean;
  requestedAt: string | null;
  scheduledFor: string | null;
  daysRemaining: number | null;
  graceDays: number;
  blockReason: string | null;
}

export default function DeleteAccountSection() {
  const router = useRouter();
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch deletion status on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/delete-account');
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setStatusError(json.error || 'Failed to load account status.');
        } else {
          setStatus(json);
        }
      } catch (err: any) {
        if (!cancelled) setStatusError(err?.message || 'Network error.');
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete() {
    setSubmitError(null);

    if (confirmText !== 'DELETE') {
      setSubmitError('You must type DELETE in the confirmation field.');
      return;
    }
    if (!password) {
      setSubmitError('Enter your current password to confirm.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm: 'DELETE' }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error || 'Deletion failed.');
        setSubmitting(false);
        return;
      }

      // Sign the user out and redirect to a confirmation page.
      await signOut({ redirect: false });
      router.push('/account-deleted');
    } catch (err: any) {
      setSubmitError(err?.message || 'Network error.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        background: 'var(--bg-surface)',
        borderColor: '#fca5a5',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3
            className="text-base font-semibold"
            style={{ color: '#b91c1c' }}
          >
            Delete account
          </h3>
          <p
            className="text-sm mt-1 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Permanently delete your Myncel account and all associated personal data.
            After you confirm, your account is scheduled for deletion in 14 days.
            You can sign back in within that window to cancel; after 14 days the
            deletion is final and cannot be undone.
          </p>
        </div>
      </div>

      {/* Status */}
      {statusLoading && (
        <div className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading account status…
        </div>
      )}
      {statusError && !statusLoading && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {statusError}
        </div>
      )}

      {/* Already pending */}
      {!statusLoading && status?.pending && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="font-semibold text-amber-900 text-sm">
            Account deletion is pending
          </div>
          <div className="text-sm text-amber-800 mt-1">
            Scheduled for permanent deletion on{' '}
            <span className="font-mono">
              {status.scheduledFor?.split('T')[0]}
            </span>{' '}
            ({status.daysRemaining} day
            {status.daysRemaining === 1 ? '' : 's'} remaining). To recover your
            account, contact support before that date.
          </div>
        </div>
      )}

      {/* Blocked: OWNER of multi-user org */}
      {!statusLoading && !status?.pending && status?.blockReason && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="font-semibold text-amber-900 text-sm">
            Account deletion is unavailable
          </div>
          <div className="text-sm text-amber-800 mt-1">
            {status.blockReason}
          </div>
        </div>
      )}

      {/* Action button */}
      {!statusLoading && !status?.pending && !status?.blockReason && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setSubmitError(null);
              setConfirmText('');
              setPassword('');
              setShowDialog(true);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
          >
            Delete my account
          </button>
        </div>
      )}

      {/* Confirmation dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2
              id="delete-account-dialog-title"
              className="text-lg font-bold text-red-700"
            >
              Permanently delete your account?
            </h2>
            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
              This will schedule your account and all associated personal data for
              permanent deletion in 14 days. You will be signed out immediately.
              You can sign back in during the 14-day window to cancel.
            </p>

            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Your profile, email, and password will be removed</li>
              <li>Push notification tokens for your devices will be revoked</li>
              <li>Records you authored (work orders, audit logs) will be retained
                  by your organization for compliance, but will no longer be
                  attributed to your name</li>
            </ul>

            {/* Confirm field */}
            <label
              htmlFor="confirm-delete-text"
              className="block mt-5 text-sm font-medium text-gray-900"
            >
              Type <span className="font-mono font-bold">DELETE</span> to confirm:
            </label>
            <input
              id="confirm-delete-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />

            {/* Password field */}
            <label
              htmlFor="confirm-delete-password"
              className="block mt-4 text-sm font-medium text-gray-900"
            >
              Re-enter your password:
            </label>
            <input
              id="confirm-delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />

            {submitError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={
                  submitting || confirmText !== 'DELETE' || !password
                }
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
