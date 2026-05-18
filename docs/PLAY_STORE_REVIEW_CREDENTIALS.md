# Google Play Console — App Access / Reviewer Credentials

Google Play Console review rejected the build because they need a working
demo account to sign in with and review the app's features. This doc
explains how to create the account and submit the credentials.

## TL;DR

1. From your project root, run:

   ```cmd
   cd C:\Users\kelly\Myncel_Project\Myncel
   npx ts-node scripts/create-demo-account.ts
   ```

   The script prints credentials at the end. Default:

   - **Username:** `googleplay@myncel.com`
   - **Password:** `GooglePlay2026!`

2. In Play Console go to **Policy → App content → App access**
   (or **Dashboard → App access**), click **Manage**, choose
   **All or some functionality is restricted**, and add an entry:

   | Field | Value |
   |---|---|
   | Name | Main demo account (email + password) |
   | Username | `googleplay@myncel.com` |
   | Password | `GooglePlay2026!` |
   | Any other information | (paste the block from the next section) |

3. Click **Save**, then go to the **Publishing overview** in the left
   sidebar and click **Send X changes for review**.

The next reviewer will be able to sign in and walk through every screen.

## What to paste into "Any other information"

```
Login URL (mobile app and web): the app opens directly to /signin

Demo account
  Email:    googleplay@myncel.com
  Password: GooglePlay2026!

This account has the OWNER role on the "Demo Manufacturing Co."
organization with a Professional plan active for 2 years, so every
feature is unlocked. Sample machines, work orders, and maintenance
tasks are pre-seeded so the dashboard is populated.

How to navigate:
  1. Tap "Sign in" on the splash screen
  2. Enter the credentials above
  3. The dashboard opens with KPIs, machines, and work orders visible
  4. The bottom tab bar (mobile) / left sidebar (tablet) provides
     access to: Dashboard, Work Orders, Equipment, Schedules, Alerts,
     Reports, Parts, Roles, Settings
  5. The "+ New Work Order" / "Add Machine" / "Schedule PM" Quick
     Actions on the dashboard demonstrate the core CMMS create flows

There is NO 2-step verification, NO trial gate, NO email verification
step required for this account — it is pre-verified server-side and
will sign in immediately.

Support: support@myncel.com
```

## Re-running the script

The script is **idempotent** — running it again:

- Resets the demo password back to the default (in case it was changed
  during testing)
- Re-verifies the email
- Clears any account lockout from failed login attempts
- Does NOT re-create sample data if it already exists (so a reviewer's
  in-app changes are preserved on re-runs)

Use this whenever Google rejects a build with the "credentials don't
work" error — just re-run, then resubmit.

## Customizing the credentials

If you want different credentials (recommended for security: rotate
after each review cycle), set env vars:

```cmd
set DEMO_EMAIL=play-review-2026q1@myncel.com
set DEMO_PASSWORD=AnotherStrongPass#456
npx ts-node scripts/create-demo-account.ts
```

Then paste the new credentials into Play Console.

## Why this is needed

Myncel's sign-in flow normally requires:
1. A registered user record
2. A bcrypt-hashed password match
3. Email verification (the user clicks a link sent to their inbox)
4. An active organization (not suspended) with a non-expired plan

Google's reviewers can't receive verification emails, can't pay for
trials, and can't create accounts. The demo script bypasses (3) by
pre-setting `emailVerified` to the current timestamp, and bypasses (4)
by setting the org's `plan = PROFESSIONAL` and `trialEndsAt` 2 years
out.

## Apple App Store Connect

The same credentials work for App Store Connect's "App Review
Information" section. Paste the same email/password under:

  App Store Connect → My App → App Privacy → App Review Information
    → Sign-in required → Yes
    → User name: googleplay@myncel.com
    → Password:  GooglePlay2026!
    → Notes:     (paste the same block as above)
