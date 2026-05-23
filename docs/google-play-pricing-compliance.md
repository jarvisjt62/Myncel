# Google Play Pricing Compliance

## Background

On 2024-11-23 (approx.), Google Play **rejected** Myncel build #2
(`com.myncel.app`, version code 2) under the policy:

> **Subscriptions: Currency differences with prominent display price**

The Capacitor mobile shell loads the live Myncel website inside a native
WebView. Reviewers in non-US regions saw hardcoded USD prices —
`$49 / $99 / $249` monthly and `$39 / $79 / $199` annual — across the
homepage, the `/pricing` page, the `/solutions/*` pages, and the
marketing screenshots in the Play Store listing. Google's policy
requires either:

1. Localized prices for every country the app is published in, **or**
2. No prominent display of price within the app at all.

We chose **option 2** for build #3 because it ships in hours rather
than weeks. Localized regional pricing (Stripe regional product setup,
FX, tax compliance per country) is a v1.1+ initiative.

## What "in the mobile app" means

The Myncel iOS and Android apps are a thin Capacitor wrapper
(`com.myncel.app`) that loads `https://www.myncel.com` inside a
WebView. The app does NOT ship any UI of its own; everything the user
sees comes from the live Next.js site.

That means we don't need a new mobile build to fix the rejection — we
just need the website to detect "I'm being rendered inside the
Capacitor app" and hide all prices. The next time a reviewer launches
the app (existing version code 2, no rebuild required), they will see
the price-free version.

## Detection

`lib/use-capacitor-webview.ts` exports `useIsCapacitorWebview()` which
returns `true` when **any** of the following is true at runtime:

1. `window.Capacitor.isNativePlatform()` returns true
   (the official Capacitor bridge API, always present in the app)
2. `navigator.userAgent` contains `MyncelApp`
   (set via Capacitor's `appendUserAgent` config — fallback for the
   ~50ms before the bridge fully initializes)
3. The URL has `?myncel-app=1` (manual override for desktop testing)

The hook returns `false` during SSR, so the desktop site is unaffected
for organic web visitors and search-engine crawlers — those still see
full pricing.

## What gets hidden in the mobile app

| Surface | Behavior in mobile app |
|---|---|
| `/pricing` (full page) | Replaced entirely with `<MobilePricingFallback />` — a card saying "Manage your plan from a web browser" with a button that opens `https://www.myncel.com/pricing?from=app` in the system browser |
| Homepage hero metric "Starter plan: $49/mo" | Swapped for "Mobile ready: iOS + Android" |
| Homepage CTA tagline "Plans start at $49/month" | Swapped for "30-day free trial" |
| Homepage `<section id="pricing">` (full pricing grid + Enterprise card) | Replaced with a price-free panel directing the user to the website |

What **stays** as-is everywhere (web + app):

- Dashboard, work orders, machines, schedules, alerts — none have prices
- All non-pricing marketing content (features, mobile, products, contact)
- Admin billing pages — gated behind login, reviewers can't reach them

What's **not yet hidden** but lower-risk for re-review:

- `/solutions/page.tsx` and `/solutions/{small,growing,midsize}/page.tsx` — show "Starting at $49/mo"
- `/blog/*`, `/changelog`, `/locations/*`, `/guides/roi-calculator` — deeper marketing pages

If Google flags any of these in a future review, we extend the same
pattern (one `useIsCapacitorWebview()` check + alternate copy).

## Bypass for the website's own users

The mobile-app `/pricing` fallback links to
`https://www.myncel.com/pricing?from=app` with `target="_blank"`. The
`?from=app` query param is currently a no-op (the website detects via
the Capacitor bridge or UA), but it's reserved for the future case
where we want to show explicit messaging like "You came from the
Myncel mobile app — here are the full plans".

## Re-submitting to Google Play

After this fix is live on `https://www.myncel.com`:

1. Replace the 7 Play Store listing screenshots that show
   `$49/$99/$249` prices. Use feature screenshots (work orders,
   schedules, alerts, dashboard) instead. The marketing screenshots
   live in **Play Console → Grow → Store presence → Main store
   listing → Phone screenshots**.
2. In Play Console **Publishing overview** for the rejected version,
   click **Edit** → write a response in the "What's new" / appeal
   field explaining: "Pricing is no longer displayed inside the mobile
   app. Subscriptions are managed exclusively on the web at
   myncel.com, where Stripe handles billing." Then **Send for review**.
3. No new APK/AAB upload is required because the fix is server-side
   (the Capacitor app loads www.myncel.com which now hides prices).

## Verifying the fix locally

Open `https://www.myncel.com/?myncel-app=1` (or `/pricing?myncel-app=1`)
in any browser. You should see the price-free hero metrics and the
"Manage your plan from a web browser" panel instead of the pricing
grid. Remove the query param to confirm the desktop site still shows
full pricing.

## Future work

- v1.1: Localize prices per country via Stripe regional products and
  show region-appropriate currency in the app. At that point we can
  remove the in-app fallback and let the mobile webview show prices
  again.
- Add `data-myncel-hide-in-app` attribute + global CSS rule so future
  pages with prices auto-hide them inside the app without code
  changes.
- Add an automated test that `?myncel-app=1` causes both the
  homepage and `/pricing` to render zero `$` characters.
