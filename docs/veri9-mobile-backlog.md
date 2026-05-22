# Veri9 Mobile Apps — Backlog Plan

**Status:** Queued. **Trigger:** Myncel iOS 1.0 (12) approved by Apple AND Myncel iOS 1.0.1 (13) shipped to both stores without issues.
**Why this gating:** confirms we have a clean reusable submission template before we open a second App Store / Play Console submission cycle.

---

## 1. Product context (captured 2026-05-22 from veri9.com)

**Veri9 = consumer-facing barcode product-authenticity scanner.**

| Aspect | Veri9 | Myncel |
|---|---|---|
| Audience | B2C — general public, 250K+ users | B2B — businesses/orgs |
| Core action | Scan a barcode → trust score + verdict | Manage maintenance work orders |
| Account model | Free signup, no card, optional | Paid org accounts only |
| Data sources | GS1, OpenFDA, USDA, Open Food Facts, UPCitemdb (30+) | Internal CMMS data |
| Killer feature for mobile | **Camera barcode scanning** — must work great | Camera = QR code scanning |
| Platform fit | **Strong native fit** — barcode scanning, push for counterfeit alerts | Strong native fit — offline work orders |

### ⚠️ CRITICAL: This is B2C, not B2B

The Apple rejection playbook we used for Myncel **does NOT apply** to Veri9:

- Myncel argument: "B2B-only, businesses sign up on web, mobile is for already-onboarded employees → no in-app registration."
- **Veri9 reality: B2C, anyone can sign up, free** → in-app registration **must work**, and **must NOT require IAP** (it's free, no subscription).

Apple Guidelines we'll have to clear:
- **2.1** (basic functionality, no crashes, working demo creds)
- **5.1.1** (data collection / privacy — much stricter for B2C)
- **5.1.2** (data sharing / 3rd party)
- **2.5.1** (only public APIs)
- **4.0** (design — barcode scanner UX must be polished)
- **3.1.1** (IAP) — **only if** we add a paid tier later. For free MVP this doesn't apply.

---

## 2. Open questions (for you, before I start work)

These are the things I need answers on before writing a line of code. We can answer them when the time comes — for now they're parked.

### 2.1 Repo & infra

1. **Where is veri9.com hosted?** Same as Myncel (Next.js + Vercel + Prisma + Postgres)? If so, we copy the Myncel mobile pattern almost verbatim.
2. **Is veri9.com in a separate GitHub repo** (`jarvisjt62/Veri9` or similar), or a folder inside Myncel?
3. **Does Veri9 already have a mobile API?** Same JWT pattern as `/api/mobile/login`? Or do we need to build `/api/mobile/*` from scratch?
4. **Database schema** — what are the main tables? (User, ScanHistory, Report, Brand, etc.)

### 2.2 Apple / Google accounts

5. **Same Apple Developer team** (`com.jarvisitconsults.veri9`)? Same Apple ID for App Store Connect submissions?
6. **Same Google Play Developer account**? (One-time $25 already paid, can publish multiple apps under it.)
7. **EAS account** — same Expo organisation as Myncel, or new one?

### 2.3 Feature scope for v1.0

8. **What goes in the v1.0 MVP** of the mobile app? My proposal:
   - Camera barcode scanner (the hero feature)
   - Trust-score result screen with product details
   - Optional sign-in (works fully without account)
   - Scan history (stored locally, synced if signed in)
   - Submit a counterfeit report (Community Reports)
   - Push notifications for "product you scanned was flagged as counterfeit"
   - Settings + Privacy / Terms links
9. **Do we want Sign in with Apple?** (Required by App Store Review for any B2C app that supports email signup, per Guideline 4.8.) **Yes, must.**
10. **Do we want Google Sign-In, Facebook, etc.?** Probably yes for parity with web.

### 2.4 Compliance prep

11. **Privacy Policy** — does veri9.com/privacy already exist? (Yes, in footer.) Need to check it covers mobile-specific data: camera, push tokens, device ID.
12. **Data Safety form for Google Play** — what data is collected? (Email, scan history, optionally device ID.) Need a fresh table, not Myncel's.
13. **Apple App Privacy "Nutrition Label"** — same exercise.

---

## 3. Reusable assets from Myncel (no rework needed)

When we kick this off, here's what copy-pastes 1:1 from the Myncel mobile project:

| Asset | File / pattern in Myncel | Reuse strategy for Veri9 |
|---|---|---|
| EAS build config | `myncel-mobile/eas.json` | Copy verbatim, change appleTeamId/ascAppId |
| Expo SDK 51 + RN 0.74.5 base | `myncel-mobile/package.json` deps | Copy entire `dependencies` block |
| App.json template | `myncel-mobile/app.json` | Copy structure, change name/slug/bundleId/scheme |
| JWT login flow | `myncel-mobile/src/api/auth.ts` (and server `/api/mobile/login`) | Re-implement on Veri9 server, identical client code |
| Secure token storage | `expo-secure-store` pattern | Copy verbatim |
| Camera + scanner | `expo-camera` + `expo-barcode-scanner` | Already in Myncel for QR; same lib does barcodes |
| Push notification setup | `expo-notifications` + token-registration endpoint | Copy server endpoint pattern |
| Apple review playbook | `docs/apple-review-notes-field.md` (B2B) | **Adapt to B2C** — different argument |
| Google Play playbook | `docs/google-play-review-notes.md` | Adapt to B2C |
| Demo seed endpoint | `app/api/admin/seed-app-review/route.ts` + `APP_REVIEW_SEED_SECRET` | Copy pattern, new secret per app |
| Pre-stage release branch pattern | `release/1.0.1-build-13` workflow | Copy verbatim, new branch name |
| Offline content bundling | `lib/handbook/content.ts` → `myncel-mobile/src/handbook/content.json` | Adapt if Veri9 needs offline reference data (e.g. trusted-brand list) |

---

## 4. New work specific to Veri9

| Task | Estimated effort | Priority |
|---|---|---|
| Native barcode scanner UI (live camera, beep, haptics) | 2 days | P0 |
| Trust-score result screen with product images | 2 days | P0 |
| Scan history (local SQLite + cloud sync) | 2 days | P0 |
| Submit counterfeit report flow + photo upload | 1 day | P1 |
| **Sign in with Apple** (Apple-required for B2C) | 0.5 day | P0 |
| Google Sign-In | 0.5 day | P1 |
| Push notifications for flagged-product alerts | 1 day | P1 |
| Onboarding screen (3-slide intro) | 0.5 day | P2 |
| Apple App Privacy nutrition label (form fill) | 0.5 day | P0 |
| Google Play Data Safety form fill | 0.5 day | P0 |
| App Store screenshots (6.7" + 6.5" + iPad) | 0.5 day | P0 |
| Google Play screenshots + feature graphic | 0.5 day | P0 |
| App Store review notes for B2C | 0.5 day | P0 |
| Demo account seed endpoint on Veri9 server | 0.5 day | P0 |
| Privacy policy mobile-specific section | 0.5 day | P0 |

**Total: ~13 working days for v1.0** (one developer, one platform team).

If we ship iOS first then Android, add ~3 days for Android-specific polish + Play submission.

---

## 5. Recommended execution order

When the trigger condition is met, run these in order:

1. **Discovery (1 day)** — answer all 13 open questions in §2 above. No code yet.
2. **Scaffold (1 day)** — `npx create-expo-app veri9-mobile`, copy Myncel's `app.json`/`eas.json`/`package.json` deps, set new bundle ID `com.jarvisitconsults.veri9`, push to GitHub.
3. **Mobile API on veri9.com server (2 days)** — build `/api/mobile/login`, `/api/mobile/scan`, `/api/mobile/history`, `/api/mobile/report` mirroring Myncel's pattern. Add `APP_REVIEW_SEED_SECRET` env var on Vercel. Seed demo accounts.
4. **Auth + Tab navigator (1 day)** — Sign in with Apple, Google, email. Bottom tabs: Scan / History / Community / Profile.
5. **Scanner + result screen (3 days)** — the hero flow, must feel polished.
6. **History + Reports + Push (2 days)**.
7. **Settings + onboarding + polish (1 day)**.
8. **Smoke test on Expo Go + TestFlight internal (1 day)**.
9. **Submit to Apple + Google (0.5 day each)** — using adapted review-notes playbooks.

---

## 6. Two strategic decisions to make NOW (cheap to decide, expensive to undo)

### Decision 1: Do you want a unified Expo monorepo or separate repos?

- **Separate repos** (`Veri9` and `Myncel-mobile`) — clean isolation, simpler CI, no dep version conflicts. ✅ Recommended.
- **Monorepo** (`apps/myncel-mobile` + `apps/veri9-mobile`) — shared components/utils, harder to reason about. ❌ Not worth it for two unrelated products.

### Decision 2: Same Apple Developer team / Apple ID?

- **Same team** (`com.jarvisitconsults`) — both apps appear under one developer name. Free.
- **Different team** — needs another $99/yr enrollment, only worth it for legal/branding reasons.

My recommendation: **same team, separate apps**. That matches your existing setup.

---

## 7. Trigger summary

**When this plan activates:**

1. ✅ Apple emails "Ready for Sale" on Myncel iOS 1.0 (12)
2. ✅ Myncel iOS 1.0.1 (13) ships per `docs/eas-build-13-prestage-plan.md`
3. ✅ Myncel Android 1.0.1 (13) ships per same plan
4. ✅ No new rejections / fires from either store for ≥3 days
5. ✅ You give me the go-signal + answers to the open questions in §2

**Then:** I scaffold `veri9-mobile`, you review the v1.0 scope, we ship.

---

## 8. Don't-forget reminders (carried over)

- 🔐 Revoke GitHub PAT `ghp_FnDPshwm…3x2ExLMM`
- 🔐 Rotate Vercel `APP_REVIEW_SEED_SECRET` after Apple approves Myncel (12)
- 📞 Twilio toll-free resubmission
- 🍎 Find iPhone tester before Veri9 v1.0 launch — Veri9 is B2C, so a real-device pre-flight matters more than for Myncel
