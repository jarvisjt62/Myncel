# Apple App Review — Screen Recording Guide

Apple's rejection letter for build 1.0 (12) explicitly requested:

> "...a screen recording captured on a physical device that
> demonstrates: Creating a new account or signing in with the demo
> account, Navigating to the account deletion option, The complete
> account deletion flow from initiation to confirmation."

You must record this on a **physical iPhone or iPad** (not the
simulator, not a desktop screen recording). Apple verifies authenticity.

## Before you start

1. **Run the production DB migration** first (see
   `apple-rejection-fix-todo.md` — the SQL is also in
   `prisma/migrations_manual.sql`). Without it, the delete API will
   500.

2. **Create a throwaway account** specifically for the recording.
   Don't use the demo account you've been giving Apple — use a fresh
   one so the recording shows account creation if you want to cover
   that part, and so you don't have to re-create your demo account.

   The throwaway account should NOT be the OWNER of an organization
   that has other members — if it is, the delete button will be
   blocked (this is intentional, but it'll confuse the reviewer).
   Easiest: sign up fresh from the marketing site.

3. **Open the installed Myncel app** on your physical iPhone/iPad
   (TestFlight build 1.0 (12) is fine — the fix is server-side).

4. Make sure the device is connected to a working network.

## Start the screen recording

On iOS:
- Pull down Control Center
- Tap the screen-recording button (circle inside a circle)
- Wait for the 3-second countdown

## Record the following sequence

**Step 1 — Sign in (or sign up)**
- If using a fresh throwaway account: tap "Sign up", enter email +
  password, complete signup.
- If using the demo account: tap "Sign in", enter email + password,
  submit.

**Step 2 — Navigate to the deletion option**
- After landing on the dashboard / home screen, open the side menu
  (or wherever Settings is).
- Tap **Settings**.
- Tap **Security** (or scroll to it on the Settings page).
- Scroll to the very bottom — you should see a red-bordered card
  titled **"Delete Account"**.

**Step 3 — Initiate deletion**
- Tap the red **"Delete account"** button.
- The confirmation modal opens.
- In the "Type DELETE to confirm" field, type `DELETE`.
- In the password field, type your account password.
- Tap the red **"Delete my account"** button.

**Step 4 — Confirmation**
- The app signs you out and navigates to the
  `/account-deleted` page, which shows:
  - "Your account has been scheduled for deletion"
  - The 14-day recovery information
  - A support email link
  - A "Return to home" button.

**Step 5 — Verify sign-in is blocked**
- (Optional but strongly recommended for the reviewer.)
- Tap "Return to home" or navigate back to sign-in.
- Try to sign in with the same email + password you just deleted.
- You should see an error like:
  *"This account is scheduled for deletion in 14 days. Contact
  support to recover it."*

## Stop the recording

- Pull down Control Center → tap the red recording indicator → Stop.
- The video saves to Photos.

## Trim & export

- Open Photos → find the recording.
- Trim off the Control-Center pull-down at the start and any dead
  time at the end. Aim for ~45–90 seconds total.
- Export / share the video as MP4 or MOV.

## Attach to App Store Connect

1. Sign in to https://appstoreconnect.apple.com
2. My Apps → Myncel → App Review tab → open the rejected submission.
3. In the Resolution Center, paste the reply text from
   `apple-resubmission-reply.md`.
4. Attach the screen recording.
5. Click **Send / Submit**.

That's it. Apple will re-test the same build (1.0 (12)) against the
now-updated production website and should clear both rejections.

## Tips

- Keep the recording **steady and unedited** — Apple wants to see a
  continuous flow, not a montage.
- Don't blur anything — they need to see the buttons and copy.
- If you fumble a tap, just restart the recording. Don't splice
  multiple takes.
- Make sure the network is working — a failed API call mid-recording
  would look bad.
