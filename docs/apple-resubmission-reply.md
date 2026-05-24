# Apple App Review — Resubmission Reply

For Submission ID: `1e279a14-b13a-432f-abbc-4166de9bb8a0`
Build: 1.0 (12) — `com.myncel.app`

Use this when replying to App Review in App Store Connect → Resolution
Center. Attach the screen recording (see `apple-screen-recording-guide.md`).

---

## Recommended reply text (copy/paste)

> Hello App Review Team,
>
> Thank you for the detailed feedback. We have addressed both issues
> in the binary that is currently live in production. No new build
> upload is required because the Myncel iOS app is a Capacitor wrapper
> around our web service — when you re-test build 1.0 (12) you will
> see the updated behavior immediately.
>
> **Guideline 2.3.10 — Android references**
>
> We added native iOS platform detection (`Capacitor.getPlatform()`)
> and now hide every user-facing Android reference inside the iOS app:
>
> - The `/products/mobile` page now reads "Native iOS app for
>   technicians" with only the App Store badge visible.
> - The "Products" mega-menu card in the navbar now reads "Native iOS
>   app" instead of "Native iOS and Android apps".
> - The home-page hero stat under "Mobile ready" now reads "iOS
>   native" instead of "iOS + Android".
> - The "Get the Myncel app" download block in the navigation drawer
>   is hidden entirely inside the iOS app.
>
> Web users on iphone/ipad Safari are unaffected — these changes only
> apply when the page is loaded inside the Capacitor iOS shell.
>
> **Guideline 5.1.1(v) — Account deletion**
>
> We have added a complete in-app account-deletion flow that does not
> require leaving the app:
>
> 1. After signing in, the user opens the side menu and taps
>    **Settings → Security**.
> 2. At the bottom of the Security page there is a red-bordered
>    "Delete account" section with a "Delete account" button.
> 3. Tapping the button opens a confirmation modal that requires the
>    user to (a) type the word `DELETE` and (b) re-enter their
>    password.
> 4. On submit, the account enters a 14-day grace period — the user
>    is signed out, redirected to `/account-deleted`, and is unable
>    to sign back in (a clear message tells them how many days remain
>    and how to contact support if they want to recover the account).
> 5. After 14 days, a scheduled background job hard-deletes the
>    account and all associated personal data.
>
> The grace period is included to protect users from accidental or
> malicious deletion; users who change their mind during those 14
> days can email support to recover the account, after which deletion
> proceeds permanently. This pattern is consistent with how Apple
> describes account deletion in 5.1.1(v) — the option to *initiate*
> deletion is fully self-service inside the app, with no requirement
> to visit a website or contact support to start the process.
>
> A screen recording captured on a physical iPhone is attached,
> showing the entire flow end-to-end:
> sign-in → Settings → Security → Delete account → modal → confirmation page.
>
> Demo credentials for re-test (same account previously provided):
>   email: <FILL IN — same demo account you submitted before>
>   password: <FILL IN>
>
> Please let us know if anything else is needed.
>
> Thank you,
> The Myncel Team
