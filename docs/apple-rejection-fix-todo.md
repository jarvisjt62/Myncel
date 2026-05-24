# Apple App Review Rejection — Fix Tracker

Submission ID: 1e279a14-b13a-432f-abbc-4166de9bb8a0
Reviewed: May 24, 2026 on iPad Air 11-inch (M3)
Version reviewed: 1.0 (12)

Status: **FIXES SHIPPED** — both commits merged to `main` and pushed.
Awaiting: production DB migration + screen recording + reviewer reply.

## Issue 1 — Guideline 2.3.10 (Accurate Metadata)

> "Revise the app's binary to remove Android references."

The Capacitor iOS shell loads the live website. Reviewer saw Android
references on user-facing pages reachable from inside the app.

- [x] Extend `useIsCapacitorWebview()` hook to also report platform
      (`ios` / `android` / `web`) via `Capacitor.getPlatform()`
      → `lib/use-capacitor-webview.ts`
- [x] Build `<HideOnIOSApp>` / `<HideOnAndroidApp>` /
      `<ShowOnlyOnPlatform>` wrappers
      → `app/components/PlatformGate.tsx`
- [x] Patch `app/products/mobile/page.tsx` — split into server shell +
      `MobilePageBody` client component that swaps title/copy/badges
      based on platform (iOS shows App Store only, Android shows
      Google Play only, web shows both)
- [x] Patch `app/components/Navbar.tsx` — mobile mega-menu card copy
      now switches between "Native iOS app", "Native Android app", and
      "Native iOS and Android apps"; "Get the Myncel app" download
      block in the drawer is hidden on both iOS and Android shells
- [x] Patch `app/HomePageClient.tsx` — `heroMetrics` "Mobile ready"
      stat now reads "iOS native" / "Android native" / "iOS + Android"
- [x] Verify TypeScript clean (`npx tsc --noEmit` returns 0 errors)

Commit: `8cf83c2 fix(apple-2.3.10): hide Android references inside iOS
Capacitor app`

## Issue 2 — Guideline 5.1.1(v) (Account Deletion)

> "App supports account creation but does not include an option to
> initiate account deletion."

Behavior shipped:
- 14-day grace period (Option A2) — user can recover via support
- Password re-authentication required to initiate
- Blocks OWNERs of multi-user orgs (must transfer ownership first)
- Sign-in is blocked while deletion is pending (clear error message
  with days remaining)
- Hard delete via Vercel cron after 14 days

- [x] Prisma schema: add `deletionRequestedAt DateTime?` on User model
      → `prisma/schema.prisma` + `prisma/migrations_manual.sql`
- [x] API route: `POST /api/user/delete-account` (re-auth + initiate)
      → `app/api/user/delete-account/route.ts`
- [x] API route: `POST /api/user/delete-account/cancel`
      → `app/api/user/delete-account/cancel/route.ts`
- [x] Block sign-in for users with `deletionRequestedAt` set
      → patched in `lib/auth.ts` Credentials authorize callback
- [x] Cron endpoint: `GET /api/cron/purge-deleted-accounts`
      (vercel-cron / Bearer / ?token= auth — same pattern as
      `/api/cron/notifications`); hard-deletes after 14 days
      → `app/api/cron/purge-deleted-accounts/route.ts`
- [x] Cron schedule registered in `vercel.json` — daily 03:00 UTC
- [x] Settings UI: red-bordered "Delete Account" section
      → `app/settings/security/DeleteAccountSection.tsx` + mounted in
      `app/settings/security/page.tsx`
- [x] Confirmation modal with type-DELETE field + password field
- [x] Post-deletion redirect to `/account-deleted` + sign-out
      → `app/account-deleted/page.tsx`
- [x] Verify TypeScript clean

Commit: `2ada53b fix(apple-5.1.1v): add in-app account deletion with
14-day grace period`

## Production deployment checklist

- [x] Merge `fix/apple-resubmission` → `main` (fast-forward)
- [x] Push `main` to GitHub (Vercel auto-deploys)
- [ ] **Run DB migration on production Postgres** before reviewer
      retests, otherwise the API will fail with "column
      `deletionRequestedAt` does not exist":

      ```sql
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);

      CREATE INDEX IF NOT EXISTS "users_deletionRequestedAt_idx"
        ON "users" ("deletionRequestedAt")
        WHERE "deletionRequestedAt" IS NOT NULL;
      ```

      (This is already in `prisma/migrations_manual.sql` — run it the
      same way you ran prior manual migrations.)
- [ ] Confirm `CRON_SECRET` env var exists on Vercel (already used by
      `/api/cron/notifications`, so should already be set)
- [ ] Smoke test on production:
      1. Sign in as a non-OWNER (or solo-owner) account
      2. Settings → Security → scroll to Delete Account
      3. Click "Delete account" → type DELETE + password → submit
      4. Confirm redirect to `/account-deleted`
      5. Try to sign back in → should get the
         "scheduled for deletion in 14 days" error
- [ ] No iOS rebuild required — Capacitor shell loads the live site,
      so the Vercel deploy is the binary change

## Reviewer-facing deliverables (next step for user)

- [ ] Record screen recording on physical iOS device showing:
      sign-in → Settings → Security → Delete Account → modal →
      `/account-deleted` page (Apple explicitly required this)
- [ ] Reply to App Review in App Store Connect, attach the recording,
      and paste the reply text from
      `docs/apple-resubmission-reply.md`

## Out of scope (per user: "just do what Apple requires")

- Logged-in pages with Android references (settings, scan, dashboard)
  unless reviewer logs in. Will re-evaluate if Apple flags again.
- Layout-level structured data `"operatingSystem": "Web, iOS, Android"`
  in `app/layout.tsx` — that's metadata for SEO crawlers, not
  user-visible UI.
- Anything not strictly required to address the two cited guidelines.
