import Link from 'next/link';

export const metadata = {
  title: 'Account scheduled for deletion · Myncel',
  description:
    'Your Myncel account has been scheduled for permanent deletion.',
  robots: { index: false, follow: false },
};

/**
 * Confirmation page shown immediately after a user submits the
 * account-deletion form in /settings/security. The user has just
 * been signed out, so this page is intentionally unauthenticated and
 * lives outside the authed app shell.
 *
 * Required by Apple App Review Guideline 5.1.1(v) — provides clear
 * confirmation that deletion has been initiated and explains the
 * 14-day grace window.
 */
export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f9fc] to-white px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-[#e6ebf1] bg-white p-8 shadow-sm">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-amber-700"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>

          <h1 className="text-center text-2xl font-bold text-[#0a2540]">
            Account scheduled for deletion
          </h1>

          <p className="mt-3 text-center text-[15px] leading-6 text-[#525f7f]">
            Your Myncel account has been scheduled for permanent deletion in{' '}
            <span className="font-semibold text-[#0a2540]">14 days</span>.
            You have been signed out from all devices.
          </p>

          <div className="mt-6 rounded-xl border border-[#e6ebf1] bg-[#f6f9fc] p-4 text-sm leading-6 text-[#525f7f]">
            <p className="font-semibold text-[#0a2540] mb-1">Changed your mind?</p>
            <p>
              Contact{' '}
              <a
                href="mailto:support@myncel.com"
                className="font-semibold text-[#635bff] hover:underline"
              >
                support@myncel.com
              </a>{' '}
              within 14 days from your account email address and we will cancel
              the deletion. After 14 days, the deletion is final and your data
              cannot be recovered.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-xl bg-[#635bff] px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#5246e5]"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
