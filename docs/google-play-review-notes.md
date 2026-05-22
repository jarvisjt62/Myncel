# Google Play Console — Review Notes & Demo Account (parity with App Store)

After the Apple review-process work in May 2026, this doc gives the Google
Play submission the same belt-and-braces treatment: a pre-filled review-notes
paragraph, a verified demo account, and a checklist that the reviewer
cannot get stuck on.

> Google Play rejections most often come from: **(1)** broken demo creds,
> **(2)** missing "App access" entry, **(3)** Data safety form mismatches,
> and **(4)** target-API or 64-bit build issues. The first two are what
> this doc fixes; the last two are checked separately at build time.

## TL;DR — five steps before you hit Submit

1. **Verify both demo accounts are working** by signing in on the web and on a real Android device.
2. **Fill the App access form** in Play Console → Policy → App content → App access.
3. **Paste the review-notes paragraph** into the same form (see below).
4. **Confirm versionCode = 12** in `myncel-mobile/app.json` (parity with iOS buildNumber).
5. **Re-check the Data safety form** matches the actual permissions in `app.json`.

---

## 1. Demo accounts (same two as Apple, for consistency)

| Field    | Primary                              | Secondary (fallback)        |
| -------- | ------------------------------------ | --------------------------- |
| Username | `appstore-review@myncel.com`         | `googleplay@myncel.com`     |
| Password | `ReviewMyncel2026!`                  | `Google123456!`             |
| Role     | ADMIN                                | ADMIN                       |
| Org      | Apple Review Demo                    | Apple Review Demo           |

Both accounts:

- Have email pre-verified server-side (no inbox round-trip).
- Have 2FA disabled, lockout cleared, failed-login counter reset.
- Belong to the same demo organization that was seeded with 5 machines, 3 work orders, 2 PM schedules, and 2 alerts so every tab has visible data.
- Trial is set to expire in 5 years so the reviewer never hits a paywall.

These credentials are kept healthy by the same idempotent endpoint used for
the Apple review path — `POST /api/admin/seed-review-accounts` with the
`X-Seed-Secret: $APP_REVIEW_SEED_SECRET` header. Hit it before every
resubmission.

---

## 2. Play Console → App access

Go to **Policy → App content → App access** (or, on a fresh submission,
the **Dashboard → App access** card). Click **Manage** and choose
**"All or some functionality is restricted"**, then add an entry:

```
Username:  appstore-review@myncel.com
Password:  ReviewMyncel2026!

Steps to access:
  1. Open Myncel from the launcher.
  2. Tap "Sign in".
  3. Enter the credentials above.
  4. The dashboard opens with sample work orders, equipment, and alerts.
  5. Every tab (Dashboard, Equipment, Orders, Schedules, Alerts, Profile)
     has pre-populated data.
  6. The Handbook is accessible offline from Profile → 📖 Handbook.

Notes:
  Myncel is B2B. The Android app is sign-in only — there is no account
  registration, plan selection, or in-app purchase. Workspaces and billing
  are managed by customer organizations on myncel.com (the web).
```

Tick "These instructions still work for the latest version of my app",
then **Save**.

---

## 3. Pre-fill the "Review notes" / message field

The Play Console "Send a message to Google Play" review notes field is
shorter than App Store Connect's (max ~500 chars in some places). Use this
condensed version:

```
Myncel is a B2B CMMS — used by manufacturers, hospitals, hotels, and fleet operators to track maintenance work. The Android app is sign-in only; workspaces and plans are sold to organizations on myncel.com (web), not via Play Billing. There is no in-app registration, plan picker, or IAP. Demo: appstore-review@myncel.com / ReviewMyncel2026! (admin, pre-loaded with sample machines, work orders, schedules, alerts). Offline-capable. Push enabled by default. Handbook bundled offline under Profile → Handbook.
```

Paste into **Policy → App content → App access** notes box (or the build's
"Release notes for review" if you prefer that channel).

---

## 4. Build & version checklist (Android-specific)

Before uploading the AAB:

- [ ] `myncel-mobile/app.json` → `expo.android.versionCode = 12` (matches iOS `buildNumber: "12"` for cross-store parity).
- [ ] `expo.version = "1.0.0"` (the user-facing version; bump to "1.0.1" only if you ship Android-only fixes between iOS releases).
- [ ] Build with `eas build --platform android --profile production`.
- [ ] Confirm the bundle is 64-bit only (Expo does this by default; verify with `aapt dump badging` if hand-built).
- [ ] Target SDK 34+ (Android 14) — Google Play requires this through 2026.
- [ ] All dangerous permissions used by the app are declared in `app.json` and match the **Data safety** form. Today the app uses CAMERA (QR scanning) and POST_NOTIFICATIONS (push). No location, no contacts, no microphone.

---

## 5. Data safety form — quick re-check

Open Play Console → App content → Data safety. Confirm:

| Data type         | Collected? | Shared? | Optional? | Purpose                                    |
| ----------------- | ---------- | ------- | --------- | ------------------------------------------ |
| Email address     | Yes        | No      | No        | Account, app functionality, sign-in        |
| Name              | Yes        | No      | Yes       | Account, app functionality                 |
| App activity (WO actions) | Yes  | No      | No        | App functionality                          |
| Crash logs        | Yes        | No      | No        | Analytics                                  |
| Photos (camera)   | Optional   | No      | Yes       | App functionality (attach to work orders)  |
| Approximate / precise location | No | -      | -         | -                                          |

All transmitted data is encrypted in transit (HTTPS only). Users can request
deletion via Settings → Data → Delete account on the web, or by emailing
privacy@myncel.com. This matches Google's "Data deletion option" requirement.

---

## 6. After upload — pre-flight test

On a real Android device or an Android Studio emulator (API 33+), do this
exact sequence and confirm each step works. If any step fails, fix and
re-upload before submitting for review.

1. Install the AAB / APK from Internal Testing track.
2. Open the app — should land on the Sign In screen with **no** "Sign up" button.
3. Sign in with `appstore-review@myncel.com` / `ReviewMyncel2026!`.
4. Dashboard loads with sample stats.
5. Tap each tab — Dashboard, Equipment, Orders, Schedules, Alerts, Profile.
6. Every tab has data (no empty states).
7. Profile → 📖 Handbook → opens the bundled handbook list.
8. Profile → 📖 Handbook → tap a chapter (e.g. "Equipment & Machines") → confirm full content renders, including the worked examples (Haas VF-2, Cummins genset, Atlas Copco compressor, hospital UPS, forklift fleet).
9. Toggle airplane mode → Handbook still works (offline test).
10. Sign out → confirm Sign In screen reappears with no registration UI.

Once all 10 boxes are ticked, click **Send for review** in Play Console.

---

## 7. If Google Play rejects again

Most common follow-up rejection reasons and the one-line fix:

- **"App access form not satisfactory"** → Demo creds in App access don't match the working credentials. Re-run the seed endpoint and re-paste.
- **"Permission usage not justified"** → Update the in-app permission rationale strings (in `app.json` → `expo.android.permissions`) to be specific about *why* you need each one.
- **"Background location"** → We don't request it. If a reviewer sees this, point them to `app.json` showing only `CAMERA` and `POST_NOTIFICATIONS`.
- **"Target API level"** → Bump `expo.android.compileSdkVersion` and rebuild.

For everything else, send the full review-response template (same one as
Apple, in `apple-review-response-2026-05-22.md`, with "App Store" search-and-replaced for "Google Play").
