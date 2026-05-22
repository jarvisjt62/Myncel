# EAS Build 1.0 (13) — Pre-Stage Plan

**Status:** READY TO FIRE the moment Apple approves build 1.0 (12).
**Target:** iOS App Store + Google Play Store (parity push).
**Branch:** `main` @ commit `940e9d4` (or later if more commits land).

---

## 0. Trigger condition

Do NOT run this until **either**:

- ✅ Apple sends "Ready for Sale" / "Ready for Distribution" email for build 1.0 (12), **or**
- ⛔ Apple rejects build 1.0 (12) again — in which case STOP and read the new rejection notes before re-applying this plan.

**Why wait?** If you build 1.0 (13) while (12) is still "Waiting for Review" or "In Review", the new build supersedes (12) in the same version slot and forces Apple to start over. We want (12) to land first so the rejection officially closes.

---

## 1. What's already done (no action needed)

| Item | State | File / Commit |
|---|---|---|
| iOS `buildNumber` bumped | `12` → next bump to `13` is in step 3 | `myncel-mobile/app.json` |
| Android `versionCode` bumped | `1` → `12` (parity) | `myncel-mobile/app.json` (commit `940e9d4`) |
| Bundled offline handbook JSON | 83 KB, 14 chapters, 5 worked examples | `myncel-mobile/src/handbook/content.json` |
| Native HandbookListScreen | Searchable, filters by title/section/body | `myncel-mobile/src/screens/HandbookListScreen.tsx` |
| Native HandbookChapterScreen | Renders body, bullets, steps, callouts | `myncel-mobile/src/screens/HandbookChapterScreen.tsx` |
| Profile tab → ProfileNavigator stack | Hosts Profile + Handbook screens | `myncel-mobile/src/navigation/RootNavigator.tsx` |
| "📖 Handbook (offline)" entry on Profile screen | First settings row | `myncel-mobile/src/screens/ProfileScreen.tsx` |
| Demo accounts seeded in production DB | `appstore-review@myncel.com` + `googleplay@myncel.com` | Verified live via `/api/mobile/login` JWT |
| App Store Connect review notes draft | 1,830 chars, B2B explanation | `docs/apple-review-notes-field.md` |
| Google Play Console review notes draft | App access + Data safety + 10-step pre-flight | `docs/google-play-review-notes.md` |

---

## 2. What build 1.0 (13) adds on top of (12)

1. **Native offline handbook** inside the iOS + Android apps (no internet needed) — directly addresses the "more details, more examples" rewrite.
2. **Android `versionCode: 12`** parity — required for Google Play submission (Play Console rejects builds with the same versionCode as a previously-uploaded one).
3. **Apple-review-friendly Profile entry point** — a reviewer can open the handbook from the bottom-nav Profile tab without an internet connection.

**No breaking changes. No new permissions. No new server endpoints.**

---

## 3. The fire-when-ready checklist

Run these in order, top to bottom, on your local Windows PowerShell **after Apple approves (12)**.

### 3.1 Pull the latest main + bump build numbers

```powershell
cd C:\path\to\Myncel
git checkout main
git pull origin main
```

Then edit `myncel-mobile/app.json`:

```jsonc
"ios": {
  "buildNumber": "13",   // 12 → 13
  ...
},
"android": {
  "versionCode": 13,     // 12 → 13
  ...
}
```

Commit:

```powershell
cd myncel-mobile
git add app.json
git commit -m "chore(mobile): bump iOS buildNumber 12->13, Android versionCode 12->13"
git push origin main
```

> **Why bump Android too?** Google Play rejects re-uploads of an already-uploaded versionCode. Build (12) will be uploaded to Play in *this* same submission cycle, so (13) needs a fresh number.

### 3.2 (Optional but recommended) Re-bundle the handbook

If you've edited `lib/handbook/content.ts` since commit `940e9d4`, re-run the bundle step so the mobile app gets the latest content:

```powershell
cd C:\path\to\Myncel
npm install --no-save typescript
.\node_modules\.bin\tsc lib\handbook\content.ts --outDir tmp-handbook --target es2020 --module esnext --moduleResolution node --esModuleInterop --skipLibCheck

node --input-type=module -e "import('./tmp-handbook/content.js').then(async m => { const fs = await import('fs'); fs.writeFileSync('myncel-mobile/src/handbook/content.json', JSON.stringify(m.HANDBOOK_CHAPTERS, null, 2)); console.log('wrote', m.HANDBOOK_CHAPTERS.length, 'chapters'); })"

Remove-Item -Recurse -Force tmp-handbook
```

Then:

```powershell
git add myncel-mobile/src/handbook/content.json
git commit -m "chore(handbook): re-bundle offline content for build 13"
git push origin main
```

If you didn't touch `lib/handbook/content.ts`, **skip this step** — `content.json` from commit `940e9d4` is fine.

### 3.3 Smoke-test locally on Expo Go (5 min)

```powershell
cd myncel-mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, then:
1. Sign in with `appstore-review@myncel.com` / `ReviewMyncel2026!`
2. Tap **Profile** tab (bottom right)
3. Tap **📖 Handbook (offline)** → should open chapter list
4. Search "Haas" → should find the **Equipment** chapter
5. Open it → scroll → confirm the Haas VF-2 worked example renders with bullets + steps
6. Tap back → search "Cummins" → confirm same chapter (genset example) renders

If all 6 work → ready to build. If any fail, fix before EAS build.

### 3.4 Fire the EAS production build

```powershell
cd myncel-mobile
npx eas-cli@latest login           # only if your token expired
npx eas-cli@latest build --platform all --profile production --non-interactive
```

Expected timing:
- iOS: ~25–35 min (macOS runner, Xcode 16.2)
- Android: ~10–15 min

You'll get two artifacts:
- iOS `.ipa` → for App Store Connect upload
- Android `.aab` → for Google Play Console upload

EAS will tag these as **iOS 1.0 (13)** and **Android 1.0 (13)** automatically (because `appVersionSource: "local"` reads `app.json`).

### 3.5 Submit to both stores

#### iOS

```powershell
npx eas-cli@latest submit --platform ios --latest
```

Or manually upload the `.ipa` via Transporter. Then in App Store Connect:
1. Create new version **1.0.1** (Apple won't let you reuse 1.0 once approved)
   - **OR** if you want to keep 1.0, this becomes version **1.1**. Recommended: **1.0.1** (point release) for "added native offline handbook" since it's not a feature addition large enough for 1.1.
2. Build → pick `1.0.1 (13)`
3. **What's New in This Version**: paste from §5 below
4. App Review Notes: re-paste `docs/apple-review-notes-field.md` (still valid)
5. Submit for review

#### Android

```powershell
npx eas-cli@latest submit --platform android --latest --track internal
```

Then in Play Console:
1. **Internal testing** → roll out to internal testers (you + your test account)
2. Wait 30 min, install on a real Android device, smoke-test
3. **Promote** internal → **Production** (or **Closed testing** first if you want to be cautious)
4. Paste `docs/google-play-review-notes.md` content into the Play submission form
5. Submit

---

## 4. Pre-staged version-bump diff (for quick paste)

When you're ready, here's the exact patch for `myncel-mobile/app.json`:

```diff
-      "buildNumber": "12",
+      "buildNumber": "13",
```

```diff
-      "versionCode": 12,
+      "versionCode": 13,
```

Optional version label change (only if you go to 1.0.1 in App Store Connect — Expo `version` field controls `CFBundleShortVersionString`):

```diff
-    "version": "1.0.0",
+    "version": "1.0.1",
```

---

## 5. Pre-written "What's New" copy

### 5.1 Apple — App Store Connect "What's New in This Version"

```
What's new in 1.0.1
• Built-in CMMS handbook now available offline inside the app — 14 chapters covering preventive maintenance, work orders, equipment integration (CNC mills, gensets, compressors, hospital UPS, forklifts) and 50+ industry terms.
• Reliability and stability improvements.
```

### 5.2 Google Play — "What's new"

```
• New: built-in offline CMMS handbook with 14 chapters, 5 worked equipment-integration examples, and a searchable glossary.
• Stability fixes.
```

(Stay under 500 chars for Play.)

---

## 6. Risk matrix & rollback plan

| Risk | Likelihood | Mitigation |
|---|---|---|
| EAS build fails (TS error, missing dep) | Low | Smoke-tested in §3.3 first |
| Apple rejects 1.0.1 (13) for new reason | Low | No new permissions, no new IAP, no registration UI changes — same review surface as (12) |
| Google Play rejects (Data safety mismatch) | Medium | Re-check the Data safety table in `docs/google-play-review-notes.md` matches actual data collection |
| Bundled handbook crashes on old Android | Very low | Pure JS, no native deps; same React Native version as (12) |
| User on (12) doesn't get offline handbook | N/A by design | (12) is the approved-but-handbookless build; (13) supersedes it within 24 h of Play rollout |

**Rollback:** if (13) breaks anything, halt rollout in Play Console (you control the % rollout slider) and pull TestFlight build from App Store Connect. (12) remains live as a fallback because Apple keeps the previously approved build until the new one is fully released.

---

## 7. Don't-forget reminders

### 7.1 Post-approval secret rotation (do AFTER Apple "Ready for Sale" on 1.0 (12))

**Why wait:** if Apple's reviewer needs to re-test the demo accounts, rotating the seed secret now would force us to reach back into `app/api/admin/seed-review-accounts/route.ts` and reset things mid-review. Once 1.0 (12) is approved we know the reviewer is done with that workspace, so rotation is safe.

**Order matters — do them in this order:**

1. **GitHub PAT** `ghp_FnDPshwm…3x2ExLMM` — **HIGH urgency** (was printed in plain text in terminal output during the launch window)
   - Go to https://github.com/settings/tokens
   - Find the token (created during build-13 prestage, likely named "myncel-deploy" or similar)
   - Click **Delete** → confirm
   - If you still need a PAT for git pushes, create a new one with `repo` scope only, set 90-day expiry, store in a password manager (1Password / Bitwarden), never paste into chat

2. **Vercel `APP_REVIEW_SEED_SECRET`** — LOW urgency, safety hygiene
   - Generate a new random value: `openssl rand -hex 32` (run in any terminal)
   - Vercel dashboard → Project (myncel) → Settings → Environment Variables
   - Find `APP_REVIEW_SEED_SECRET` → **Edit** → paste new value → save for **Production** + **Preview** + **Development**
   - Trigger a redeploy (Deployments tab → Redeploy latest production) so the new value picks up
   - Update `docs/apple-review-notes-field.md` and `docs/google-play-review-notes.md` if they reference the old value (they shouldn't — they reference the email/password, not the seed secret)

3. **Sanity check after rotation** — confirm seed endpoint still works:
   ```bash
   curl -X POST https://www.myncel.com/api/admin/seed-review-accounts \
     -H "X-Seed-Secret: <NEW_VALUE>" -H "Content-Type: application/json" -d '{}'
   ```
   Expect `200 OK` with `log: [...]` showing the upserts.

### 7.2 Other open items

- 📞 **Twilio toll-free resubmission** still pending (separate task).
- 🍎 **Find iPhone tester** for ad-hoc TestFlight before fragile feature launches (still recommended even though we're shipping without one).

### 7.3 Flip download badges live on approval day

Code is already shipped (`commit bbd6c50` on main). Badges are rendered by `app/components/AppStoreBadges.tsx`, controlled by `lib/mobile-app-config.ts`, and currently render nothing because both flags default to `false`. They appear in the **Footer** (sitewide) and the **`/products/mobile`** page (hero + dedicated download CTA section).

To flip them live:

1. **iOS** — once Apple emails "Ready for Sale" on 1.0 (12):
   - Open App Store Connect → My Apps → Myncel → **App Information**
   - Copy the numeric **Apple ID** (e.g. `6471234567`)
   - In Vercel → Project (myncel) → Settings → Environment Variables:
     - Add `NEXT_PUBLIC_IOS_APP_ID` = `<that numeric ID>` (Production)
     - Add `NEXT_PUBLIC_IOS_APP_LIVE` = `true` (Production)
   - Redeploy → iOS badge appears

2. **Android** — once you promote the Play build to Production track and rollout starts:
   - In Vercel:
     - Add `NEXT_PUBLIC_ANDROID_APP_LIVE` = `true` (Production)
   - **That's the only env var needed for Android.** Unlike Apple, Google Play uses your package name (not a numeric ID) in URLs, and the package name is already hardcoded in `lib/mobile-app-config.ts` as `com.jarvisitconsults.myncel` (it's also fixed in `myncel-mobile/app.json`). So the Play Store URL `https://play.google.com/store/apps/details?id=com.jarvisitconsults.myncel` is fully known ahead of time.
   - Redeploy → Android badge appears

3. **Verify both** by visiting:
   - https://www.myncel.com/products/mobile (hero + download section)
   - Any page footer (look for "Get the mobile app" block)
   - Hover the **Products** menu in the top navbar (look in the right-side "New Feature → Mobile App" card)
   - On a phone: open the hamburger menu → scroll to "Get the Myncel app" section
   - Click each badge — should open the live store listing.

Pre-launch (current state) the page shows a "iOS & Android apps coming soon — mobile web available today" pulse pill instead of badges, so the page never looks empty.

---

## 8. One-line summary for future-me

> When Apple emails "Ready for Sale" on 1.0 (12): pull main → bump iOS to 13 + Android to 13 in `app.json` → smoke-test on Expo Go → `eas build --platform all --profile production` → submit both. New version label is **1.0.1** on both stores. New copy is in §5. Reviewer notes are in `docs/apple-review-notes-field.md` and `docs/google-play-review-notes.md` (unchanged from (12)).

