'use client';

/**
 * MobileBillingFallback
 *
 * Rendered in place of the full /settings/billing page when the user
 * is signed into the Myncel Capacitor mobile app (com.myncel.app or
 * iOS).
 *
 * Why: Google Play rejected build #2 again on 2026-05-24 with:
 *   "Currency differences with prominent display price. Ensure that
 *   currency displayed is consistent through multiple screens such as
 *   offers page and payment cart within the purchase flow and is
 *   appropriately localized for each country that your app is
 *   targeting."
 *
 * The /settings/billing page renders hard-coded USD prices on both
 * the plan comparison cards AND in the checkout modal header. Until
 * we ship Stripe regional pricing that localizes BOTH surfaces
 * consistently, the safest fix is to not show ANY price inside the
 * mobile app at all and direct the user to manage their plan on the
 * website.
 *
 * This component intentionally shows:
 *   - The user's current plan name (text only, e.g. "Professional")
 *   - The trial status if applicable (text only, "X days remaining")
 *   - NO numeric price, NO currency symbol, NO "/mo" suffix
 *   - NO upgrade/checkout buttons
 *   - A CTA that opens myncel.com/settings/billing in the device
 *     browser where pricing is shown consistently in USD on the live
 *     web app (no in-app currency mismatch).
 *
 * This keeps the app compliant with both:
 *   - Google Play "Subscriptions: currency differences" policy
 *   - Apple App Store "external purchase links" rules (the user has
 *     to intentionally leave the app and visit the web to subscribe)
 */

interface Props {
  planName: string;
  trialDaysLeft: number;
  isActiveTrial: boolean;
  isTrialExpired: boolean;
  subscriptionStatus: string | null;
}

export default function MobileBillingFallback({
  planName,
  trialDaysLeft,
  isActiveTrial,
  isTrialExpired,
  subscriptionStatus,
}: Props) {
  // Build a friendly, price-free status string.
  let statusLine: string;
  let statusTone: 'ok' | 'warn' | 'info' = 'info';
  if (isActiveTrial) {
    statusLine = `Free trial · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining`;
    statusTone = 'warn';
  } else if (isTrialExpired) {
    statusLine = 'Your trial has ended. Choose a plan to keep using Myncel.';
    statusTone = 'warn';
  } else if (subscriptionStatus === 'active') {
    statusLine = 'Subscription active';
    statusTone = 'ok';
  } else if (subscriptionStatus === 'past_due') {
    statusLine = 'Payment past due — please update from a web browser';
    statusTone = 'warn';
  } else if (subscriptionStatus === 'canceled') {
    statusLine = 'Subscription canceled';
    statusTone = 'warn';
  } else {
    statusLine = 'No active subscription';
    statusTone = 'info';
  }

  const toneColor =
    statusTone === 'ok'
      ? '#10b981'
      : statusTone === 'warn'
      ? '#f59e0b'
      : '#6366f1';

  return (
    <div className="space-y-6">
      {/* Current plan card (text only — NO prices) */}
      <div
        className="rounded-2xl border p-6"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Current plan
            </p>
            <h1
              className="mt-1 text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {planName}
            </h1>
            <p
              className="mt-2 text-sm font-medium"
              style={{ color: toneColor }}
            >
              {statusLine}
            </p>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'rgba(99,91,255,0.12)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#635bff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <path d="M3 10h18" />
              <path d="M7 14h4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Manage-on-web card */}
      <div
        className="rounded-2xl border p-6"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <h2
          className="text-base font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Manage your plan from a web browser
        </h2>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          For your security, Myncel subscriptions and billing are managed on
          our website. Open <span className="font-semibold">myncel.com</span>{' '}
          in your phone or computer browser to view plans, start a free trial,
          change your subscription, update your payment method, or download
          invoices.
        </p>

        <a
          href="https://www.myncel.com/settings/billing?from=app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition"
          style={{ background: '#635bff' }}
        >
          Open billing on myncel.com
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
        </a>

        <p
          className="mt-4 text-xs leading-5"
          style={{ color: 'var(--text-muted)' }}
        >
          Already on a plan? Your subscription continues to work in the app.
          You only need a web browser to <em>change</em> your plan or view
          billing history.
        </p>
      </div>

      {/* Help row */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Need help with billing?
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          Our support team typically responds within 2 hours on business days.
        </p>
        <a
          href="mailto:billing@myncel.com"
          className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface-2)',
          }}
        >
          Contact billing support
        </a>
      </div>
    </div>
  );
}
