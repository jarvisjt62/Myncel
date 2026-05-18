# Google Play Console / App Store — Reviewer Credentials

Google Play (and Apple) reject builds when the reviewer can't sign in
to test the app. This doc walks through the no-script process.

## TL;DR — 4 steps, ~5 minutes

### 1. Sign up the demo account through the normal flow

On any device or in your browser, go to <https://www.myncel.com/signup>
and register a new account using credentials you don't mind sharing
with reviewers. Suggested:

- **Email:** `googleplay@myncel.com` (use a Gmail alias you control or
  a real inbox you can access for the verification email)
- **Password:** `GooglePlay2026!` (or any strong password — you'll
  give this to Google)
- **Organization name:** `Demo Manufacturing Co.`

> The signup flow will send a verification email. You can either click
> the link from your inbox **OR skip it** — step 3 below verifies the
> email server-side anyway.

### 2. (Optional) Verify the email by clicking the link

If you have access to the inbox, just click the link. Done.

If not, skip to step 3 — the admin panel will mark it verified.

### 3. Open the admin panel and click "Prep for Review"

1. Sign in as `admin@myncel.com` and go to
   <https://www.myncel.com/admin/users>
2. Find the row for `googleplay@myncel.com`
3. In the **Actions** column, click the orange **🛒 Prep for Review**
   button
4. Confirm the dialog

That single click does everything the reviewer needs:

- ✅ Marks the email as **verified** server-side (no inbox required)
- ✅ Disables 2FA on the account
- ✅ Clears any account lockout / failed login counter
- ✅ Bumps the user's organization to the **PROFESSIONAL plan** with
  `trialEndsAt` 2 years out and `subscriptionStatus = active` —
  no paywall blocks any feature
- ✅ Logs an `ADMIN_PREPARED_FOR_STORE_REVIEW` audit entry

The button changes to a green **✓ Ready for review** badge for a few
seconds when it succeeds.

You can re-click this button any time (e.g. after Google rejects again
or after a credential rotation) — it's idempotent.

### 4. Submit the credentials in Play Console

In Play Console, go to **Policy → App content → App access** (or
**Dashboard → App access**), click **Manage**, choose
**"All or some functionality is restricted"**, and add an entry:

| Field | Value |
|---|---|
| **Name** | Main demo account (email + password) |
| **Username** | `googleplay@myncel.com` |
| **Password** | `GooglePlay2026!` |
| **Any other information** | *(see paste-block below)* |

Paste this into "Any other information":

```
Demo account
  Email:    googleplay@myncel.com
  Password: GooglePlay2026!

This account has the OWNER role on "Demo Manufacturing Co." with a
PROFESSIONAL plan active for 2 years — every feature is unlocked.

How to navigate:
  1. Tap "Sign in" on the splash screen
  2. Enter the credentials above
  3. The dashboard opens with KPIs, machines, and work orders visible
  4. The bottom tab bar (mobile) provides access to: Dashboard,
     Work Orders, Equipment, Schedules, Alerts, Reports, Parts,
     Roles, Settings
  5. The Quick Actions on the dashboard ("New Work Order", "Add
     Machine", "Schedule PM", "Maintenance Report") demonstrate the
     core CMMS create flows.

There is NO 2-step verification, NO trial gate, NO email verification
step required for this account — it is pre-verified server-side and
will sign in immediately.

Support: support@myncel.com
```

Click **Save**, then go to **Publishing overview** in the left
sidebar and click **Send X changes for review**.

The next reviewer will be able to sign in and walk through every
screen.

## Apple App Store Connect

Same flow. Paste the same email/password under:

  App Store Connect → My App → App Privacy → App Review Information
    → Sign-in required: Yes
    → User name: googleplay@myncel.com
    → Password:  GooglePlay2026!
    → Notes:     (paste the same block as above)

## Re-running before the next review cycle

If you rotate the password (recommended every few review cycles):

1. Sign in as the demo user, go to Settings → Account, change password
2. Sign back in as `admin@myncel.com` → /admin/users → click
   **🛒 Prep for Review** again on the demo user (resets 2FA, lockout,
   plan, etc.)
3. Update the password in Play Console > App access
4. Resubmit

## Why the "Prep for Review" button is needed

Myncel's sign-in flow normally requires:

1. A registered user record (created at signup)
2. A bcrypt-hashed password match
3. **Email verification** — user clicks a link sent to their inbox
4. An active organization (not suspended) with a non-expired plan
5. No 2FA challenge (or a working TOTP for the reviewer)

Google's reviewers can't receive verification emails, can't pay for
trials, can't share TOTP secrets, and won't email you for help. The
"Prep for Review" button bypasses (3), (4), and (5) for the demo
account in one click — leaving (1) and (2) intact so the reviewer
still genuinely authenticates.
