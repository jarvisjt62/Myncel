'use client';

import { useState } from 'react';

interface Props {
  userId: string;
  userEmail: string;
}

/**
 * One-click admin action that prepares a user account so the Google
 * Play / Apple App Store reviewer can sign in and review every feature:
 *   - Marks email as verified
 *   - Clears 2FA / lockout
 *   - Bumps org to PROFESSIONAL plan, active for 2 years
 *
 * Use on the admin Users page once you've signed up the demo account
 * through the normal /signup flow. After clicking this, paste the
 * email + the password you used into Play Console > App access.
 */
export default function PrepareForReviewButton({ userId, userEmail }: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    if (!confirm(`Prepare ${userEmail} for app-store review?\n\nThis will:\n  • Mark email as verified\n  • Disable 2FA\n  • Clear lockout / failed login attempts\n  • Bump org to PROFESSIONAL plan, active for 2 years\n\nUse this only for accounts you intend to share with Google Play / App Store reviewers.`)) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/prepare-for-review`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (e: any) {
      setError(e.message || 'Failed');
      setTimeout(() => setError(null), 5000);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
        ✓ Ready for review
      </span>
    );
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap" title={error}>
        ✗ {error.slice(0, 30)}
      </span>
    );
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      title="Prepare account for Google Play / App Store review (verifies email, disables 2FA, bumps plan to PROFESSIONAL for 2 years)"
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors whitespace-nowrap disabled:opacity-50"
    >
      {busy ? (
        <>
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Preparing…
        </>
      ) : (
        <>🛒 Prep for Review</>
      )}
    </button>
  );
}
