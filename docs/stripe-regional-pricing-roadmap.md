# Stripe Regional Pricing — Roadmap

## Context

**Why we need this:** Google Play rejected build #2 with "currency
differences with prominent display price" because `/pricing` showed
USD ($49 / $99 / $249) while Stripe checkout auto-localized totals to
the reviewer's region (PHP ₱7,148 / ₱17,880 / ₱30,335). Same flow,
two currencies → policy violation.

**Confirmed root cause** (verified in Stripe Dashboard 2026-05-23):
**Stripe Adaptive Pricing is ON** for this account. That feature
auto-converts USD list prices to the customer's local currency at
checkout. The offers page is still rendering hardcoded USD, so the
two surfaces disagree by design.

This means:

1. We do NOT need to create per-region Stripe Products/Prices to be
   compliant. Stripe is already handling the charge-side conversion.
2. We DO need our `/pricing` display to match what Adaptive Pricing
   will show at checkout for the same region.
3. Phase 2 (real per-market Prices) becomes optional — a
   conversion-rate optimization rather than a compliance requirement.

**Today's mitigation** (`fix/play-pricing-compliance`, commits
`ff28bae` + `ab9a54e` + `f8fb9dc` + `751c1c6`): hide all prominent
prices inside the Capacitor mobile app. Compliant, ships in hours,
but the mobile app can no longer convert visitors directly — they have
to leave the app to subscribe.

**Goal of this initiative:** make `/pricing` and the homepage hero
**show the user's local currency** so the offers page matches the
Adaptive Pricing checkout cart, then **re-enable in-app pricing** for
the mobile app once Google has approved at least one build.

## What "regional pricing" means here

There are two related but separate decisions:

### Decision A — How prices are *calculated* per region

| Strategy | Effort | Complexity | Notes |
|---|---|---|---|
| **A1. FX conversion only** | Low | Low | "$49 USD" → look up the current FX rate → display "₱2,750" or "£39" or "€45". Same dollar value, different currency. Charges happen in local currency but USD-equivalent. Works without per-region Stripe Products. |
| **A2. Real local prices per market** | High | High | "$49 in US, £39 in UK, ₱2,500 in PH, €45 in EU." Each market gets its own Stripe Product/Price. PPP-adjusted. Better conversion in low-income countries, but requires accounting / tax / pricing strategy work. |
| **A3. Stripe Adaptive Pricing** | Low | Low | New Stripe feature: you keep your USD prices, Stripe shows localized estimates at checkout. Available since 2024. **Probably already on for your account** (which is exactly why the cart showed PHP). |

**Recommendation:** Start with **A1** for the offers page (so it matches what A3 already does at checkout), and reserve A2 for after we have ≥3 months of regional conversion data.

### Decision B — How the user's region is *detected*

| Method | Reliability | Latency | Notes |
|---|---|---|---|
| **B1. Vercel Edge geo header** (`x-vercel-ip-country`) | High in production | Zero | Free with Vercel. Resolves country at the edge. Best default. |
| **B2. `Intl.NumberFormat` + browser locale** | Medium | Zero | Tells you currency *formatting* preference, not location. Falls back fine. |
| **B3. IP geolocation API** (ipapi.co, MaxMind, etc.) | High | ~50–200ms | Adds a network call. Use only as a fallback. |
| **B4. User-selected currency** | N/A | Zero | A `<select>` on the page. Always offer this as a manual override. |

**Recommendation:** B1 (server-side via middleware or RSC) + B4
(manual override stored in a cookie). B2 only as a no-JS fallback.

## Two-phase implementation plan

### Phase 1 — Display-only localization (FX conversion) [≈ 1 week]

Goal: `/pricing` shows local currency that matches what Stripe will
charge at checkout. Backend Stripe configuration unchanged.

- [ ] **1.1** Pick an FX source. Options: a free daily-rate JSON like
      [exchangerate.host](https://exchangerate.host),
      [open.er-api.com](https://open.er-api.com), or
      [Frankfurter](https://www.frankfurter.app). Cache for 24h.
- [ ] **1.2** Build `lib/pricing-region.ts`:
      - `getRegion(req)` → reads `x-vercel-ip-country` header in middleware
      - `getCurrencyForCountry(cc)` → ISO mapping (US→USD, GB→GBP, PH→PHP, etc.)
      - `convertUSD(usdAmount, targetCurrency)` → cached FX call
      - `formatPrice(amount, currency, locale)` → Intl.NumberFormat
- [ ] **1.3** Build `app/api/pricing/region/route.ts` — returns
      `{ country, currency, locale, rates }` for the current request.
      Cache 5 min in Vercel CDN.
- [ ] **1.4** Convert `/pricing` and the homepage `<section id="pricing">`
      to a server component (or RSC + `'use client'` price card child)
      that calls `getRegion()` at render time and shows local-currency
      prices.
- [ ] **1.5** Add a currency switcher (header dropdown or top-right
      pill on `/pricing`) that writes `myncel-currency` cookie. The
      cookie overrides the geo default.
- [ ] **1.6** Add a "Prices shown in {currency} based on your region.
      Final amount may vary slightly with daily exchange rates." note
      under the price grid.
- [ ] **1.7** **Compliance test:** point a VPN at five regions
      (US, UK, PH, IN, NG) and screenshot `/pricing` + Stripe checkout
      side-by-side. Currency *symbol* must match in both. Numeric
      total can differ by ±1% (FX vs. Stripe's spot rate at charge time).
- [ ] **1.8** Re-enable in-app pricing for Android: remove
      `<PriceGateMobile>` wrapper from `/solutions/*` and
      `/locations/*`, remove `/pricing` early-return — but **only**
      after Google approves at least one new build with the current
      compliance fix in place. Don't risk a second rejection.

### Phase 2 — Real regional pricing (Stripe-native) [≈ 3–4 weeks]

Goal: each priority market has its own Stripe Price object so customers
in lower-income countries pay PPP-adjusted rates and we can run
country-specific promotions.

- [ ] **2.1** **Pricing strategy decision** (you, not me):
      Which markets get discounts? By how much? (Examples: US/CA/UK/EU
      = 100% list, AU/NZ = 100%, PH/IN/MX/BR/NG = 50%, ZA/ID/VN = 60%.)
- [ ] **2.2** Tax/legal review:
      - Are we registered for VAT in any EU country? (Threshold €10k/yr OSS)
      - Do we charge VAT inclusive or exclusive? (UK = inclusive, US = exclusive)
      - GST in India / Australia?
      - Stripe Tax can handle this but has to be enabled per-country.
- [ ] **2.3** In Stripe: create per-currency Products + Prices for the
      three plans (Starter / Growth / Professional, monthly + yearly).
      With 5 priority currencies × 3 plans × 2 intervals = 30 new
      Price objects.
- [ ] **2.4** Update `lib/stripe.ts` `BILLING_PLANS` to be a function
      `getBillingPlans(currency)` that returns the right Price IDs.
- [ ] **2.5** Update `app/api/billing/checkout/route.ts` to pick the
      right Payment Link or Price ID based on the user's region cookie.
- [ ] **2.6** Update Stripe webhook to handle multi-currency
      subscriptions (the Subscription object already carries currency,
      but our DB schema may need a `currency` column on `Organization`
      or `Subscription`).
- [ ] **2.7** Admin panel: show currency on each org's billing page so
      support can answer "why is this customer paying ₱2,500?"
- [ ] **2.8** Migrate or grandfather: any USD subscribers stay USD.
      Only new signups from non-USD regions get the new prices.

## Risks / open questions

1. **~~Stripe Adaptive Pricing may already be on.~~** **CONFIRMED ON**
   (verified in Stripe Dashboard, 2026-05-23). This is the direct
   cause of the rejection. Phase 1 is therefore mandatory if we want
   to re-enable in-app pricing after Google approves the current
   build. Phase 2 (real per-market Prices) becomes purely a
   conversion-rate / margin optimization, not a compliance issue.
2. **FX-rate drift between our display and Stripe's checkout.** Our
   FX source (e.g. exchangerate.host) and Stripe's internal rate will
   never match exactly. Expect ±1% drift. Three options:
   - **(a)** Accept the drift and add a "approximate, final amount in
     local currency" disclaimer near the price grid. Google has not
     historically flagged ±1% as a policy violation; the rejection
     was triggered by displaying *different currencies entirely*, not
     by minor numeric drift.
   - **(b)** Use Stripe's `/v1/exchange_rates` API (Connect-only;
     check if it's enabled on this account before relying on it).
   - **(c)** Display dual prices: "$49 USD · billed as ₱2,750 in PH".
     Sidesteps FX drift because the USD anchor is always identical
     to the system of record. Recommended path.
3. **Card BIN vs IP geo mismatch.** A US expat in Manila has a US
   credit card and a PH IP. They'll see PHP prices but their card
   charges in USD. Stripe handles this gracefully (charges in PHP,
   bank does FX), but it can confuse users. The "Prices shown in PHP
   based on your location" note + the manual currency switcher
   addresses this.
4. **VAT compliance is not optional in EU/UK.** Phase 2 should be
   gated on having Stripe Tax + VAT registration sorted, otherwise
   we're collecting VAT illegally in markets we're not registered in.
5. **Mobile re-enablement timing.** Don't push a build to Google Play
   that re-enables in-app pricing until Phase 1 is verified across
   ≥3 regions. Re-rejection costs another 3–7 day review.

## What this roadmap is NOT

- Not blocking the current Play resubmission. The compliance fix
  shipped today (`ff28bae` + `ab9a54e` + `f8fb9dc`) is sufficient on
  its own — it just leaves money on the table for in-app conversions.
- Not something to start before Google approves the current build.
  Two simultaneous rejections is much harder to recover from than one.
- Not a 1-day task. Phase 1 is realistically ~1 dev week including
  testing across regions; Phase 2 needs pricing-strategy and
  tax/legal sign-off before any code is written.

## Suggested sequence

1. **Now:** Submit appeal to Google Play with today's compliance fix.
2. **Wait 1–7 days** for Google to approve.
3. **Phase 1, week 1:** FX-based display localization, VPN testing.
4. **Phase 1, week 2:** Push a new Capacitor build to Play that
   re-enables in-app pricing (now consistent USD→local everywhere).
5. **Phase 2:** Pricing strategy + Stripe Tax + per-market Prices —
   only after Phase 1 has been live and stable for ≥1 month and we
   have data on which markets convert worst.
