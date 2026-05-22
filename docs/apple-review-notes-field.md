# App Store Connect — "App Review Notes" field

This is the short paragraph that goes into the **App Information → App Review Information → Notes** field in App Store Connect (NOT the longer Resolution Center reply, which lives in `apple-review-response-2026-05-22.md`).

Apple's reviewer always reads this field before opening the build. Pre-filling it with a clean B2B explanation pre-empts the 3.1.1 IAP question and gives the reviewer everything they need to test the app.

---

## Where to paste this

1. App Store Connect → **My Apps** → Myncel → **App Information** (or, on a new submission, the build's **App Review Information** tab).
2. Find the **Notes** text area (limit: 2,000 characters).
3. Paste the block below. Hit **Save**.

---

## Paste-ready notes (under 2,000 chars)

```
Myncel is a business-to-business Computerized Maintenance Management System (CMMS) for facilities, manufacturers, hospitals, and fleet operators. Customer organizations purchase a workspace on our website (myncel.com); their employees — technicians, supervisors, and operators — then sign in to that already-provisioned workspace using the iOS app to do maintenance work on the floor.

The iOS app is sign-in only. There is no account registration, no plan selection, no free-trial start, no in-app purchase, and no payment UI of any kind. Workspaces and billing are managed exclusively on the web by an authorized admin at the customer organization. The mobile app exists so the employees of those customer organizations can do their job — view assigned work orders, scan equipment QR codes, complete checklists, attach photos, and receive push alerts — even when they are offline on a shop floor.

We believe this places Myncel under Guideline 3.1.3(b) (Multiplatform Services) and the 3.1.1 exception for free, complimentary access to a service the customer already purchased outside the app.

DEMO ACCOUNT FOR REVIEW (admin role; pre-loaded with 5 machines, 3 work orders, 2 schedules, and 2 alerts so every screen has data):

  Username: appstore-review@myncel.com
  Password: ReviewMyncel2026!

A second working account is also available as a fallback:

  Username: googleplay@myncel.com
  Password: Google123456!

Both were verified by hand on iPad Air (M3) / iPadOS 26.5 immediately before this submission. Push notifications are enabled by default after sign-in. Offline mode works without any network. Tapping "Handbook" inside the Profile tab opens the full bundled user manual offline.

If anything is unclear, please contact us at appstore-support@myncel.com — we monitor this mailbox during the review window and reply within 2 business hours.
```

(Character count: ~1,830 — well under the 2,000-char field limit.)

---

## Notes for the submitter

- **Demo account toggle**: also fill in the "Sign-in required" / "Demo account" fields in App Store Connect with the *same* credentials. Reviewers sometimes use the form fields instead of the free-text Notes, and a mismatch can re-trigger 2.1.
- **Phone number / contact email**: keep the existing contact email (`appstore-support@myncel.com`) and your real phone. Apple sometimes calls.
- **Demo video**: optional, but a 30-second screen recording of "open app → sign in → tap a work order → mark in progress → mark complete" reduces back-and-forth on most submissions.
- **Resolution Center reply**: paste the full message from `apple-review-response-2026-05-22.md` into the Resolution Center thread *as well*. The Notes field is read before testing; the reply lives inside the rejection thread. Both should agree.
