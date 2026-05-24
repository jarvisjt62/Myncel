# Apple App Review Rejection — Fix Tracker

Submission ID: 1e279a14-b13a-432f-abbc-4166de9bb8a0
Reviewed: May 24, 2026 on iPad Air 11-inch (M3)
Version reviewed: 1.0 (12)

## Issue 1 — Guideline 2.3.10 (Accurate Metadata)

> "Revise the app's binary to remove Android references."

The Capacitor iOS shell loads the live website. Reviewer saw Android
references on user-facing pages reachable from inside the app.

- [ ] Extend `useIsCapacitorWebview()` hook to also report platform
      (`ios` / `android` / `web`) via `Capacitor.getPlatform()`
- [ ] Build `<HideOnIOSApp>` wrapper component (mirror of `<PriceGateMobile>`)
- [ ] Patch `app/products/mobile/page.tsx` — title, meta, copy mention
      "Native iOS & Android" + "Get it from Google Play"
- [ ] Patch `app/components/Navbar.tsx` — mobile mega-menu copy mentions
      "Native iOS and Android apps"
- [ ] Patch `app/HomePageClient.tsx` — `heroMetrics` "iOS + Android" stat
- [ ] Verify TypeScript clean

## Issue 2 — Guideline 5.1.1(v) (Account Deletion)

> "App supports account creation but does not include an option to
> initiate account deletion."

Required behavior (per user):
- 14-day grace period (Option A2)
- Password re-authentication required to initiate
- Block OWNERs of multi-user orgs (must transfer ownership first)
- In-app, completable without leaving the app

- [ ] Prisma schema: add `deletionRequestedAt` field on User model
- [ ] API route: `POST /api/user/delete-account` (re-auth + initiate)
- [ ] API route: `POST /api/user/delete-account/cancel` (within grace)
- [ ] Block sign-in for users with `deletionRequestedAt` set
      (NextAuth callback)
- [ ] Cron-style endpoint: `POST /api/cron/purge-deleted-accounts`
      (executes hard delete after 14 days)
- [ ] Settings UI: new "Delete Account" section in
      `app/settings/security/page.tsx` (or new `/settings/account/`)
- [ ] Confirmation modal with password field
- [ ] Post-deletion redirect + sign-out
- [ ] Verify TypeScript clean

## Verification

- [ ] All TypeScript passes (`npx tsc --noEmit`)
- [ ] Manual test the delete flow on local
- [ ] Commit on feature branch `fix/apple-resubmission`
- [ ] Merge to main, push, wait for Vercel
- [ ] Provide user with screen-recording instructions for Apple
- [ ] Provide user with Apple appeal/resubmission text

## Out of scope (per user: "just do what Apple requires")

- Logged-in pages with Android references (settings, scan, dashboard)
  unless reviewer logs in. Will re-evaluate if Apple flags again.
- Layout-level structured data `"operatingSystem": "Web, iOS, Android"`
  in `app/layout.tsx` — that's metadata for SEO crawlers, not
  user-visible UI.
- Anything not strictly required to address the two cited guidelines.
