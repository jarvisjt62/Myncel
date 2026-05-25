'use client';

/**
 * MobilePricingFallback
 *
 * Rendered in place of the full /pricing page when the user is inside
 * the Myncel Capacitor mobile app (com.myncel.app).
 *
 * Why: Google Play rejected build #2 with "Subscriptions policy:
 * Currency differences with prominent display price." The hardcoded
 * USD prices (Starter $49, Growth $99, Professional $249) are shown
 * to users in every country, which violates the policy. Until we
 * implement Stripe regional pricing, the safest fix is to not show
 * any price inside the mobile app at all — users manage subscriptions
 * from a web browser instead.
 *
 * This component intentionally:
 *   - Shows no numeric price
 *   - Shows no currency symbol
 *   - Shows no "Buy now" / "Subscribe" CTA
 *   - On Android: shows an "Open myncel.com in browser" button
 *   - On iOS: shows NO link/button to a purchase site (Apple
 *     Guideline 3.1.1 prohibits external purchase links of any kind)
 *
 * That keeps the mobile app compliant with both:
 *   - Google Play "Subscriptions: currency differences" policy
 *   - Apple App Store Guideline 3.1.1 (no clickable external billing)
 */

import { useIsIOSApp } from '@/lib/use-capacitor-webview';

export default function MobilePricingFallback() {
  const isIOSApp = useIsIOSApp();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f9fc] to-white px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-[#e6ebf1] bg-white p-8 shadow-sm">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-white"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <path d="M3 10h18" />
              <path d="M7 14h4" />
            </svg>
          </div>

          <h1 className="text-center text-2xl font-bold text-[#0a2540]">
            Manage your plan from a web browser
          </h1>

          {isIOSApp ? (
            // ── iOS variant ─────────────────────────────────────────────
            // No clickable affordance to an external purchase site.
            // Apple Guideline 3.1.1 prohibits ANY link or button that
            // sends the user out of the app to a purchase flow — even
            // to your own marketing site.
            <p className="mt-3 text-center text-[15px] leading-6 text-[#525f7f]">
              Myncel subscriptions and billing are managed on a web
              browser. To view plans, start a free trial, or change
              your subscription, please visit Myncel using a web
              browser on any device.
            </p>
          ) : (
            <p className="mt-3 text-center text-[15px] leading-6 text-[#525f7f]">
              For your security, Myncel subscriptions and billing are managed on
              our website. Open <span className="font-semibold text-[#0a2540]">myncel.com</span>{' '}
              in your phone or computer browser to view plans, start a free
              trial, or update your subscription.
            </p>
          )}

          {!isIOSApp && (
            // Android-only: opens the marketing site in the device's
            // default browser, not the in-app webview. We pass
            // ?from=app so the website can suppress the in-app
            // detection and show full pricing.
            <a
              href="https://www.myncel.com/pricing?from=app"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#5246e5]"
            >
              Open myncel.com in browser
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
          )}

          <a
            href="/dashboard"
            className={`${isIOSApp ? 'mt-7' : 'mt-3'} flex w-full items-center justify-center rounded-xl border border-[#e6ebf1] bg-white px-5 py-3 text-[15px] font-semibold text-[#0a2540] transition hover:bg-[#f6f9fc]`}
          >
            Back to my dashboard
          </a>

          <p className="mt-6 text-center text-xs leading-5 text-[#8898aa]">
            Already on a plan? Your subscription continues to work in the app.
            {isIOSApp ? (
              <> You don&apos;t need to do anything.</>
            ) : (
              <> You only need a browser to <em>change</em> your plan.</>
            )}
          </p>
        </div>

        {/* Helpful links — features only, never prices */}
        <div className="mx-auto mt-8 max-w-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8898aa]">
            Explore Myncel features
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <a
              href="/features"
              className="rounded-full border border-[#e6ebf1] bg-white px-3 py-1.5 text-xs font-medium text-[#525f7f] hover:bg-[#f6f9fc]"
            >
              Features
            </a>
            <a
              href="/products/mobile"
              className="rounded-full border border-[#e6ebf1] bg-white px-3 py-1.5 text-xs font-medium text-[#525f7f] hover:bg-[#f6f9fc]"
            >
              Mobile app
            </a>
            <a
              href="/contact"
              className="rounded-full border border-[#e6ebf1] bg-white px-3 py-1.5 text-xs font-medium text-[#525f7f] hover:bg-[#f6f9fc]"
            >
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
