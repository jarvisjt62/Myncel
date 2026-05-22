# Apple App Review — Response to Submission 1e279a14-b13a-432f-abbc-4166de9bb8a0

**Reviewed:** 2026-05-21 · iPad Air 11-inch (M3) · iPadOS 26.5 · Version 1.0 (11)
**Resubmission:** Version 1.0 (12)

> Paste the body below into the App Store Connect "Reply" message on the
> rejection. Then upload build 12 via EAS / Xcode and tap **Resubmit to
> App Review**.

---

## Message body to paste

Hello App Review Team,

Thank you for the detailed feedback on submission 1e279a14. We have addressed all three findings in version 1.0 (12) and want to walk you through exactly what changed so the next review goes smoothly.

### 1) Guideline 3.1.1 — Business — Payments — In-App Purchase

We confirm that the Myncel iOS app **does not contain any account registration, sign-up, free-trial start, or plan-selection user interface**. The app only contains a Sign In screen for users who already belong to a Myncel workspace.

- The login screen has **no "Sign up", "Create account", "Start free trial", or "Choose a plan" buttons or links**.
- The "Forgot password?" alert directs users to reset their password on the web — it does not offer registration.
- We have added a clearly labelled "How do I get an account?" helper that explains, in plain language: *"Myncel accounts are created and managed by your organization's administrator. Ask your admin to invite you. New workspaces are created on the web at myncel.com — you cannot create one from inside the app."*

Myncel is a B2B tool. New organizations are onboarded by their administrator on our website (myncel.com), which is outside the scope of the iOS app and does not constitute a purchase mechanism shown inside the app. Inside the iOS app, individual end users (technicians, supervisors) only sign in to a workspace that has already been provisioned for them by their employer.

We believe this approach matches the model described in App Review Guideline 3.1.3(b) ("Multiplatform Services") and 3.1.1's exception for free, complimentary access to content and services that have already been purchased outside the app.

### 2) Guideline 2.1 — Information Needed — Demo account did not work

We are very sorry the demo credentials we provided did not work — the account had been left in an `email-unverified` / `account-locked` state and we did not verify before submitting.

For build 1.0 (12) we have:

1. Created a dedicated, permanent App Store Review account on a sandbox workspace ("Apple Review Demo"). This workspace contains pre-populated sample data (5 machines, 3 work orders, 2 maintenance schedules, 2 alerts) so the reviewer sees a fully functional app on first launch.
2. Verified the email address on both review accounts, cleared any failed-login lockouts, set role to ADMIN (so every screen is reachable), and set the trial to expire in 5 years.
3. Built an idempotent maintenance endpoint so we can re-verify these credentials in seconds before every future submission.

**Updated demo credentials (please use these for build 1.0 (12)):**

| Field    | Value                                |
| -------- | ------------------------------------ |
| Username | `appstore-review@myncel.com`         |
| Password | `ReviewMyncel2026!`                  |

The previous credentials (`googleplay@myncel.com` / `Google123456!`) have also been repaired and will continue to work as a fallback.

We tested both sets of credentials on iPad Air (M3) running iPadOS 26.5 immediately before resubmitting, by typing them by hand on the on-screen keyboard.

### 3) Guideline 2.1(a) — Performance — App Completeness — "Continue" button greyed out

To be transparent: the "Continue" button you encountered was **not in the iOS app itself** (which has no registration UI), but on our public **web** sign-up page that you may have reached after the demo credentials failed in step 2. Because that web page is the only path a *workspace administrator* uses to create a new organization, we felt it important to also make sure that page works correctly on iPadOS Safari.

Root cause we identified for the greyed-out Continue button on iPadOS:

- The button was disabled by a React state expression that depended on the `password` and `confirmPassword` fields matching. iCloud Keychain on iPadOS commonly autofills the first password field but not the confirmation field, and the autofill event in Safari does not always fire React's synthetic `onChange`. As a result, our component state remained empty even though the visual fields had values, and the button stayed disabled.

Fix shipped in 1.0 (12) (and live on www.myncel.com today):

- The Continue button is now always enabled; validation runs on click and any unmet condition is shown as a clear, specific error message instead of a silently-disabled button.
- All form inputs now have `name` attributes plus `onInput` listeners so we read live DOM values on submit, defeating any autofill / state-sync race.
- Password fields now have `autoCapitalize="off"`, `autoCorrect="off"`, and `spellCheck={false}` — preventing iPadOS predictive text from inserting characters that would silently fail the strength regex.

This fix is on the production website now and was deployed before this resubmission.

---

### What's new in 1.0 (12)

- Mobile: Login screen copy clarified — explicit "How do I get an account?" helper that confirms there is no in-app registration.
- Mobile: Build number bumped from 11 → 12.
- Web: iPad sign-up "Continue" greyed-out bug fixed.
- Backend: Demo accounts re-seeded, email-verified, ADMIN role, 5-year trial.

If you have any questions or need any additional information, please reply here and we will respond within 24 hours.

Thank you for your time and for the thoroughness of the review.

Best regards,
The Myncel Team
support@myncel.com
