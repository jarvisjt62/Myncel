'use client';

/**
 * MobileBillingFallback
 *
 * Rendered in place of the full /settings/billing page when the user
 * is signed into the Myncel Capacitor mobile app (com.myncel.app or
 * iOS).
 *
 * Shows a price-free view (no $, no /mo, no checkout buttons) so
 * Google Play / Apple App Store reviewers never see hardcoded USD
 * prices inside the binary. CTA opens myncel.com in the OS browser.
 */

import { useState } from 'react';

interface Props {
  planName: string;
  /** Raw plan tier (TRIAL, TRIAL_RESTRICTED, BASIC, PROFESSIONAL, ENTERPRISE, FREE…). */
  plan?: string | null;
  /** True when on PROFESSIONAL/BASIC/ENTERPRISE/etc. paid tiers (i.e. NOT trial/free). */
  isPaidPlan?: boolean;
  trialDaysLeft: number;
  isActiveTrial: boolean;
  isTrialExpired: boolean;
  subscriptionStatus: string | null;
}

export default function MobileBillingFallback({
  planName,
  plan,
  isPaidPlan,
  trialDaysLeft,
  isActiveTrial,
  isTrialExpired,
  subscriptionStatus,
}: Props) {
  const [opening, setOpening] = useState(false);
  // Build a friendly, price-free status string.
  // ORDER MATTERS — most specific cases first.
  let statusLine: string;
  let statusTone: 'ok' | 'warn' | 'info' = 'info';

  if (isActiveTrial) {
    statusLine = `Free trial · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining`;
    statusTone = 'warn';
  } else if (isTrialExpired || plan === 'TRIAL_RESTRICTED') {
    statusLine = 'Your trial has ended. Choose a plan to keep using Myncel.';
    statusTone = 'warn';
  } else if (subscriptionStatus === 'past_due') {
    statusLine = 'Payment past due — please update from a web browser';
    statusTone = 'warn';
  } else if (subscriptionStatus === 'canceled') {
    statusLine = 'Subscription canceled';
    statusTone = 'warn';
  } else if (
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'trialing' ||
    isPaidPlan
  ) {
    // Treat any paid-tier plan name as active even when Stripe metadata
    // hasn't synced subscriptionStatus yet (common right after checkout
    // or for accounts provisioned manually by an admin).
    statusLine = 'Subscription active';
    statusTone = 'ok';
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

  const billingUrl = 'https://www.myncel.com/settings/billing?from=app';

  /**
   * Open the billing URL in the OS browser (Custom Tab on Android,
   * SFSafariViewController on iOS), NOT inside the Capacitor webview.
   *
   * Strategy order:
   *   1. window.Capacitor.Plugins.Browser.open() — injected by the
   *      native bridge when @capacitor/browser is in the shell.
   *      Opens an in-app Custom Tab so the user stays "in" Myncel
   *      visually but the Custom Tab handles navigation, NOT our
   *      webview.
   *   2. window.open(url, '_system') — Capacitor convention that
   *      forces external browser handling. Works for cross-origin
   *      links; can be unreliable for same-origin (myncel.com →
   *      myncel.com) so we keep this as a fallback only.
   *   3. window.location.href fallback — last resort.
   *
   * We do NOT use `<a target="_blank">` because Capacitor swallows
   * `_blank` and just reloads the URL inside the same webview —
   * which is exactly the bug the user reported ("button does
   * nothing").
   */
  async function openBillingExternal(e: React.MouseEvent) {
    e.preventDefault();
    if (opening) return;
    setOpening(true);
    try {
      // Strategy 1: Capacitor Browser plugin via the global bridge.
      // No dynamic import — that would fail because @capacitor/browser
      // isn't in the website's bundle, only in the native shell.
      const cap = (window as any)?.Capacitor;
      const browserPlugin = cap?.Plugins?.Browser;
      if (browserPlugin && typeof browserPlugin.open === 'function') {
        try {
          await browserPlugin.open({
            url: billingUrl,
            presentationStyle: 'popover',
          });
          return;
        } catch (err) {
          console.warn('[myncel-billing] Capacitor Browser.open failed', err);
          // fall through
        }
      }

      // Strategy 2: Capacitor's _system target convention
      try {
        const opened = window.open(billingUrl, '_system');
        if (opened) return;
      } catch {
        /* fall through */
      }

      // Strategy 3: plain navigation (last resort — leaves the app)
      window.location.href = billingUrl;
    } finally {
      // Re-enable in case the user comes back without a full reload
      setTimeout(() => setOpening(false), 1500);
    }
  }

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
          href={billingUrl}
          onClick={openBillingExternal}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition disabled:opacity-60"
          style={{ background: '#635bff' }}
          aria-busy={opening}
        >
          {opening ? 'Opening browser…' : 'Open billing on myncel.com'}
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
