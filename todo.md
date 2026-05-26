# Myncel CMMS — Task Tracker

## ✅ Big bets — all shipped

- [x] **8.1** — Offline mobile sync (`647616d`)
- [x] **8.2** — SAML 2.0 SSO + SCIM 2.0 (`d9d1add`)
- [x] **8.3** — OBD-II / J1939 / NMEA 2000 / MAVLink + 5 telematics importers (`46a4d49`, `50eccc2`)
- [x] **8.4** — AI Settings + anomaly detection + predictive forecasts (`2de3274`, `91c22c2`)

## ✅ Recent passes

- [x] Handbook + Roadmap pass (`68ccb37`)
- [x] App-wide safe-area pass (`a6c85a8`)
- [x] Scrub SuperAdmin operational details from customer chapters (`2746a0d`)
- [x] **PDF button — server-side binary PDF via pdfkit** (`38bad5f`)
- [x] **CRITICAL pdfkit fix** — serverComponentsExternalPackages so AFM fonts ship to Vercel (`2707711`)
- [x] **Mobile-app thin-shell pass** — universal Capacitor safe-area rules, download-link interceptor, /diag page, ?capacitor-preview=1 mode (`3f8bdfb`)

## 🔧 Postponed

- [ ] **Samsung S24 Ultra status-bar overlap** — postponed by user.

## 🎯 Next

- [ ] Comprehensive bug-fix + mobile-responsiveness deep dive (web, mobile apps, mobile view, landscape + portrait).

## 📜 Standing rules

1. Verify mobile responsiveness — mobile web (landscape + portrait) AND mobile apps (Android + iOS).
2. Update `lib/handbook/content.ts` — REMOVE shipped items from Roadmap, INSERT step-by-step into the relevant chapter. Callout `type` ∈ `'tip'|'warning'|'info'`. `steps` flat `string[]`.
3. SuperAdmin dashboard must control / sync with all features — but customer-facing handbook chapters must NOT describe what SuperAdmin does.
4. Big Bet #4 schema applied via Supabase SQL Editor (`prisma/sql/big-bet-4-ai.sql`).
5. **For mobile-app bug reports**: ask for a screenshot of `/diag` first. Tells us platform, safe-area insets, viewport, plugins, and html classes in one glance.
