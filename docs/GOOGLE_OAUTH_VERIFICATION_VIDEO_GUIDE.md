# Google OAuth Verification — Demo Video Guide

Google rejected the OAuth verification for project `greenlist-43ba1`
(project number `157105312436`) because the demo video did not show
the OAuth consent screen with the requested scopes. This guide walks
through exactly what to record so the next submission passes.

---

## What Google wants to see

A short (60–120 second) screen recording that shows, in this exact
order:

1. Your app's homepage / a screen with your app's name and logo
   visible (so the reviewer can confirm it matches the verification
   request).
2. The user clicking a button in your app that initiates the
   "Connect Google Sheets" / OAuth flow.
3. The Google OAuth consent screen — **with the scope list visible**.
   This is the screen that says "myncel.com wants access to your
   Google Account" and lists "See, edit, create, and delete all your
   Google Sheets spreadsheets".
4. The user clicking **Allow** / **Continue**.
5. The redirect back into your app showing the integration is now
   connected (e.g. a "Connected" badge or success message).

The single scope your app requests is:

  `https://www.googleapis.com/auth/spreadsheets`

This is a **restricted scope** (it grants read/write access to all the
user's Google Sheets), which is why Google requires the verification.

---

## Step-by-step recording script

### Setup before you record

1. Make sure you have a **second Google account** to act as the test
   user (don't use your developer account). You can use any personal
   Gmail. Reviewer's note: Google's reviewers will *also* run this
   flow themselves, so the credentials don't need to be theirs — they
   just need to see it works.

2. Make sure your **Myncel app is signed in** in one browser tab as
   the demo / admin user.

3. On the **Google Cloud Console** OAuth consent screen settings,
   confirm:
   - Publishing status: **In production** (or *Testing* with the test
     user added)
   - User type: **External**
   - App name: matches what's in your video (Myncel)
   - App logo: uploaded (the green Myncel logo)
   - User support email: a real email you control
   - Authorized domain: `myncel.com`
   - Developer contact email: filled in
   - The `https://www.googleapis.com/auth/spreadsheets` scope is
     listed under "Scopes for Google APIs" with a justification

4. Have a screen-recording tool ready:
   - **Windows**: built-in Xbox Game Bar (Win + G), or OBS Studio, or
     ScreenPal (free)
   - **Mac**: built-in QuickTime or Cmd+Shift+5
   - **Browser**: Loom (free, very easy — recommended)

   Record the **entire screen** (or at least the entire browser
   window) — Google rejects videos that only show a cropped portion.

### Recording — exact 8-step script

Open a screen recorder, hit record, then do this in your browser
without stopping:

> **0:00–0:05** — Show the Myncel landing page or sign-in page so the
> domain `myncel.com` and the Myncel logo are visible in the address
> bar and on the page. This proves the app shown matches the OAuth
> verification request.

> **0:05–0:15** — Sign in to Myncel as your demo / admin account
> (`googleplay@myncel.com` is fine). The dashboard loads.

> **0:15–0:25** — In the left sidebar (or top nav, depending on your
> screen size) click **Settings → Integrations**. The Integrations
> page appears.

> **0:25–0:35** — Scroll to the **Google Sheets** card. Show that it
> currently says "Not connected" (or similar). Click the **Connect**
> button on the Google Sheets card.

> **0:35–0:50** — The browser navigates to
> `https://accounts.google.com/o/oauth2/v2/auth?...`. The Google
> account chooser appears. Click your test Google account.

> **0:50–1:10** ⭐ **THE CRITICAL FRAME** — The Google **OAuth consent
> screen** appears. Pause for **at least 5 seconds** here so the
> reviewer can clearly see:
>
>   * The blue header: **"myncel.com wants access to your Google
>     Account"** (or your verified app name)
>   * Your app logo
>   * The scope description: **"See, edit, create, and delete all
>     your Google Sheets spreadsheets"**
>   * The links to **Privacy Policy** and **Terms of Service**
>   * The **Cancel** and **Allow** / **Continue** buttons
>
> Hover the mouse over the scope description so it's obvious. **Do
> NOT click Allow yet** — Google specifically wants this screen
> visible for several seconds in the video.

> **1:10–1:15** — Click **Allow** / **Continue**.

> **1:15–1:30** — The browser redirects back to
> `https://www.myncel.com/api/integrations/google-sheets/callback?code=...`
> and then to the Integrations page. The Google Sheets card now
> shows **"Connected"** (or similar). Stop the recording.

### Optional bonus shot (recommended)

> **1:30–1:45** — Click the **Export to Sheets** button somewhere in
> the app (e.g. on the Reports tab) to demonstrate the scope is
> actually being used productively. Show a new spreadsheet open in a
> new tab with your data populated. This isn't required by Google
> but it strengthens the verification because you're showing genuine
> use of the scope.

---

## After recording

1. Upload the video to **YouTube** (Unlisted is fine — public is
   easier for reviewers but unlisted works too) or **Google Drive**
   (set sharing to "Anyone with the link can view").

   - YouTube is preferred — Google reviewers don't have to download
     anything.

2. Reply to the Google verification email with this template:

```
Hi,

Thank you for the feedback. I have re-recorded the demo video to
clearly show the OAuth consent screen workflow including the
requested scope.

Demo video: <YOUR_YOUTUBE_OR_DRIVE_LINK>

The video shows:
  • The Myncel app homepage and sign-in
  • Navigating to Settings → Integrations
  • Clicking "Connect" on the Google Sheets integration card
  • The Google account chooser
  • The OAuth consent screen with the scope visible:
      "See, edit, create, and delete all your Google Sheets
       spreadsheets" (https://www.googleapis.com/auth/spreadsheets)
  • Clicking Allow
  • Returning to the Myncel Integrations page showing the
    connection succeeded
  • [optional] Exporting a maintenance report to Google Sheets to
    demonstrate productive use of the scope

The single scope requested is:
  https://www.googleapis.com/auth/spreadsheets

This is used so users of Myncel (a CMMS / maintenance management
system) can export their work-order, equipment, and maintenance
report data to a Google Sheets spreadsheet for analysis and sharing
with team members who don't use Myncel.

Project ID: greenlist-43ba1
Project Number: 157105312436

Please let me know if anything else is needed.

Thank you,
[Your name]
[Your email]
```

3. Hit **send**. Google typically responds within 3–5 business days.

---

## Common mistakes that cause rejection

❌ **Showing only the redirect after Allow has been clicked** — Google
   wants to see the consent screen itself, not just the result.

❌ **Cropping the recording too tightly** so the URL bar isn't
   visible. Always record the entire browser window.

❌ **Not pausing on the consent screen** — record at least 5 seconds
   on that screen so the reviewer can read the scope.

❌ **Using a different domain than the one registered on the OAuth
   consent screen.** Your video must use `myncel.com` — not localhost,
   not a Vercel preview URL.

❌ **Recording in a language other than what's set on the consent
   screen settings.** Match your app's primary language.

❌ **Showing the developer's own consent screen flow with "unverified
   app" warning.** The flow should look like the one a real end-user
   would see. If you currently get a "Google hasn't verified this
   app" warning when you click Connect, add your test Google account
   to the **Test users** list in Cloud Console first; the warning
   goes away for added test users.

---

## Verification request changes (if needed)

If Google's email also flagged that the **OAuth consent screen
configuration is incomplete**, log into:

  https://console.cloud.google.com/apis/credentials/consent?project=greenlist-43ba1

and confirm the following are filled in:

| Field | Required value |
|---|---|
| App name | Myncel |
| User support email | A real inbox you read |
| App logo | 120×120 PNG of the green M logo |
| Application home page | https://www.myncel.com |
| Application privacy policy link | https://www.myncel.com/privacy |
| Application terms of service link | https://www.myncel.com/terms |
| Authorized domains | myncel.com |
| Developer contact information | Your email |

Under the **Scopes** tab, confirm there is exactly one entry:

  `https://www.googleapis.com/auth/spreadsheets`

with a **scope justification** like:

> Myncel is a maintenance management (CMMS) platform. Users connect
> their Google account so Myncel can create new spreadsheets in
> their Drive containing exports of their maintenance work orders,
> equipment lists, and PM schedules — useful for sharing with team
> members who don't use Myncel directly. The spreadsheets scope is
> required because we both create new spreadsheets (write) and
> later read them when the user opens the export. We do not access
> any pre-existing spreadsheets the user has not explicitly
> exported into via Myncel.

Click **Save and continue**, then **Submit for verification** at the
bottom of the page.

Reply to the email **after** you have:
1. Re-uploaded the new demo video, AND
2. Saved the OAuth consent screen settings, AND
3. Re-submitted the verification request.

The reviewer cannot proceed until all three are done.
