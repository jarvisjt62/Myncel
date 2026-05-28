'use client';

/**
 * BackToDashboardBar
 *
 * Small affordance shown at the top of public marketing pages (/handbook,
 * /docs, etc.) when the user is signed in. Lets users who navigated to docs
 * from the in-app Resources menu jump back to /dashboard with one tap —
 * critical on mobile where the public Navbar lacks any "back" button.
 *
 * Renders nothing for anonymous visitors so it doesn't pollute the marketing
 * experience for prospects.
 */

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function BackToDashboardBar() {
  const { status, data: session } = useSession();

  // Anonymous → render nothing (don't show "Back to dashboard" to prospects).
  if (status !== 'authenticated' || !session?.user) return null;

  // Super admin → /admin; users with org → /dashboard; otherwise /onboarding.
  const target =
    session.user.email === 'admin@myncel.com'
      ? '/admin'
      : session.user.organizationId
        ? '/dashboard'
        : '/onboarding';

  const label =
    target === '/admin'
      ? 'Back to admin'
      : target === '/dashboard'
        ? 'Back to dashboard'
        : 'Continue setup';

  return (
    <div className="lg:hidden bg-[#f6f9fc] border-b border-[#e6ebf1]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <Link
          href={target}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#635bff] hover:text-[#4f46e5] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {label}
        </Link>
        <span className="hidden sm:inline text-xs text-[#8898aa]">
          You&apos;re signed in.
        </span>
      </div>
    </div>
  );
}
