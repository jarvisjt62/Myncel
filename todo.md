# Myncel CMMS — Task Tracker

## ✅ Big bets — all shipped

- [x] **8.1 Big Bet #1** — Offline mobile sync (Capacitor + IndexedDB queue + conflict resolution). Commit `647616d`.
- [x] **8.2 Big Bet #2** — SAML 2.0 SSO + SCIM 2.0 (Okta, Azure AD / Entra, OneLogin, JumpCloud). Commit `d9d1add`.
- [x] **8.3 Big Bet #3** — OBD-II / J1939 / NMEA 2000 / MAVLink + Geotab/Samsara/Verizon/Motive/Fleetio importers. Commits `46a4d49` + `50eccc2` (SuperAdmin Fleet tab).
- [x] **8.4 Big Bet #4** — AI Settings panel + anomaly detection + predictive forecasts. Commit `2de3274` + `91c22c2` (Supabase SQL migration).

## ✅ Recent passes

- [x] Handbook + Roadmap pass — AI chapter, Vehicles chapter, /docs/ai card, cross-links. Commit `68ccb37`.
- [x] Comprehensive mobile safe-area fix — toasts, AI panels, admin bottom nav. Commit `a6c85a8`.
- [x] Scrub SuperAdmin operational details from customer-facing handbook chapters (Predictive, AI, Vehicles). Commit `2746a0d`.
- [x] **Print/Save-as-PDF button now works in Capacitor mobile app** — server-side binary PDF via pdfkit (`<a href download>` instead of `window.print()`, which is a no-op in iOS WKWebView). Commit `38bad5f`.

## 🔧 Postponed (do not resume without explicit user request)

- [ ] **Samsung S24 Ultra status-bar overlap** — 3 attempts failed. User said postpone.

## 🎯 Tomorrow

- [ ] Comprehensive bug-fix + mobile-responsiveness deep dive across web, mobile apps, mobile view (landscape + portrait).

## 📜 Standing rules (every shipped feature must satisfy)

1. Verify mobile responsiveness — mobile web (landscape + portrait) AND mobile apps (Android + iOS).
2. Update `lib/handbook/content.ts` — REMOVE shipped item from Roadmap chapter, INSERT detailed step-by-step content into the relevant chapter matching the existing `body[]` / `bullets[]` / `steps[]` / `callout` style. Callout `type` ∈ `'tip' | 'warning' | 'info'` only — never `'success'`. `steps` must be flat `string[]`.
3. SuperAdmin dashboard must control / sync with all features — but customer-facing handbook chapters must NOT describe what the SuperAdmin org does.
4. Big Bet #4 schema must be applied via Supabase SQL Editor (`prisma/sql/big-bet-4-ai.sql`).
