# Google OAuth Verification — Demo Video Recording Kit

**Project:** `greenlist-43ba1`
**Scope under review:** `https://www.googleapis.com/auth/spreadsheets` (restricted)
**Target length:** 90–120 seconds
**Output format:** MP4, 1080p, unlisted YouTube link

This is a complete, shot-by-shot script that addresses the **5 specific reasons** Google rejected the previous submission. Follow it exactly and you should pass the first time.

---

## 0. Pre-Recording Checklist (do this BEFORE you hit record)

### 0.1 Recorder — pick ONE (no watermarks!)
- ✅ **Loom** (free) — https://www.loom.com/download → records to MP4, no watermark on free tier (5 min limit, you'll need 2)
- ✅ **Windows Game Bar** — press `Win+G` → click record button (built into Windows 10/11, no watermark, no limit)
- ✅ **OBS Studio** (free) — https://obsproject.com (overkill but bulletproof)
- ❌ **DO NOT use** the recorder you used last time (it stamps "SCREEN RECORDER" / "SCREEN.TM" watermarks — this was rejection reason #1)

### 0.2 Browser setup
- Use **Google Chrome** (Incognito mode is fine)
- **Maximize the window but DO NOT use F11 fullscreen** — the address bar MUST be visible the entire time
- Zoom level: 100% (`Ctrl+0`)
- Close all other tabs

### 0.3 Test user setup
- Pick ONE Gmail account you'll use for the whole video. Suggestion: create a fresh one like `myncel.demo.review@gmail.com`
- Add it as a Test User:
  1. Go to https://console.cloud.google.com/apis/credentials/consent?project=greenlist-43ba1
  2. Scroll to **Test users** → **Add users** → enter the email → Save
- Sign in to that Gmail account in Chrome **before recording**, so it's the only Google session active
- **Sign out of all other Google accounts in this browser** (rejection reason #5: multiple emails confused the reviewer)

### 0.4 Disconnect any existing Google Sheets connection
- Sign in to https://www.myncel.com as the super admin
- Go to **Settings → Integrations → Google Sheets → Disconnect**
- This is critical: the reviewer needs to see the **fresh consent flow**, not a "Reconnect" button

### 0.5 Prepare a row of data to export
- Go to **Work Orders** in Myncel and make sure you have at least 2–3 visible work orders (so the resulting Sheet looks meaningful)

---

## 1. The Script — 9 shots, ~110 seconds total

> **No voiceover required.** Use Loom's built-in caption feature OR add a single text overlay per shot in post (a 5-second free edit in any video tool). Captions matter — Google's reviewers often have audio off.

### Shot 1 — App identification (0:00–0:08, 8 sec)
- **Show:** Browser address bar with `https://www.myncel.com` clearly visible, sign-in page loaded
- **Caption:** *"Myncel — CMMS for manufacturers. App requesting `spreadsheets` scope: greenlist-43ba1"*
- **Action:** Hover the URL bar so it's selected/highlighted for 2 seconds, then click into the email field

### Shot 2 — Sign in as super admin (0:08–0:18, 10 sec)
- **Show:** Email + password fields
- **Caption:** *"Signing in as a super-admin user — only super admins can connect platform integrations"*
- **Action:** Type email, type password, click Sign In. Land on `/dashboard`. The address bar must show `https://www.myncel.com/dashboard`

### Shot 3 — Navigate to integrations (0:18–0:25, 7 sec)
- **Show:** Click **Settings** → **Integrations**
- **Caption:** *"Settings → Integrations — where Google Sheets is connected"*
- **Action:** URL becomes `https://www.myncel.com/settings/integrations`. Pause 2 seconds on the integrations list so the reviewer can read it

### Shot 4 — Click "Connect" on Google Sheets (0:25–0:32, 7 sec)
- **Show:** The Google Sheets card with a **Connect** button
- **Caption:** *"Clicking Connect initiates the OAuth flow"*
- **Action:** Hover the Connect button for 1 second, then click. Browser navigates to Google

### Shot 5 — Show the unverified-app warning AND the bypass (0:32–0:48, 16 sec) ⭐ CRITICAL
- **Show:** The red ⚠️ "Google hasn't verified this app" page
- **Caption:** *"Currently in Testing mode — verification in progress"*
- **Action — DO ALL OF THIS SLOWLY:**
  1. Pause 2 seconds on the warning page
  2. **Highlight the URL bar** — the URL must clearly show `accounts.google.com/o/oauth2/v2/auth/...` (rejection reason #2)
  3. Click **"Advanced"** (or "Show Advanced")
  4. Pause 1 second so the new "Go to myncel (unsafe)" link is visible
  5. Click **"Go to myncel.com (unsafe)"**

### Shot 6 — The real consent screen (0:48–1:00, 12 sec) ⭐ CRITICAL
- **Show:** "myncel wants access to your Google Account" page
- **Caption:** *"Real Google consent screen — accounts.google.com — requesting Sheets scope"*
- **Action:**
  1. Pause 2 seconds
  2. **Move the cursor up to the address bar** so the reviewer sees `accounts.google.com/signin/oauth/...` clearly (rejection reason #2 again — this is the #1 thing reviewers check)
  3. Scroll down inside the consent dialog to show the Sheets permission text: *"See, edit, create, and delete all your Google Sheets spreadsheets"*
  4. Pause 2 seconds on that scope text
  5. Click **Continue** (or **Allow**)

### Shot 7 — Return to Myncel, success state (1:00–1:08, 8 sec)
- **Show:** Browser navigates back to `https://www.myncel.com/settings/integrations`. Google Sheets card now shows **Connected ✓**
- **Caption:** *"OAuth complete. Token stored server-side, used only by the super-admin platform integration."*
- **Action:** Pause 3 seconds on the Connected state

### Shot 8 — Demonstrate the scope is actually used (1:08–1:35, 27 sec) ⭐ MOST CRITICAL
> This is rejection reason #4 — the previous video never proved the scope was used. THIS shot is what actually saves you.

- **Show:** Navigate to **Work Orders** (`/dashboard/work-orders` or wherever your export lives)
- **Caption:** *"Demonstrating spreadsheets scope usage — exporting work orders to Google Sheets"*
- **Action:**
  1. Click **Export → Google Sheets** (or whatever your export button is called)
  2. Wait for the success toast / message ("Exported to Google Sheets" with a link)
  3. **Click the link** to open the resulting Sheet in a new tab
  4. New tab loads `https://docs.google.com/spreadsheets/d/...` — pause 3 seconds
  5. Show the actual exported data (work order ID, machine, status columns visible)

### Shot 9 — Wrap-up (1:35–1:50, 15 sec)
- **Show:** Switch back to the Myncel tab → integrations page
- **Caption:** *"This is a platform-managed integration. End users do not trigger OAuth — only the super admin does. Token is stored server-side and reused for all org exports."*
- **Action:** Pause on the Connected card, then end recording.

---

## 2. Post-Recording Checklist

- [ ] Watch the video back end-to-end
- [ ] Confirm: NO watermarks anywhere
- [ ] Confirm: address bar visible during Shots 5, 6, 8
- [ ] Confirm: full URL `accounts.google.com/...` visible during consent
- [ ] Confirm: only ONE Google account email visible the whole video
- [ ] Confirm: Shot 8 actually opens the exported Google Sheet
- [ ] Confirm: total length is between 90 and 180 seconds
- [ ] Upload to YouTube as **Unlisted** (NOT private — reviewers can't access private)
- [ ] Test the unlisted link in an incognito window — make sure it plays

---

## 3. Email Reply Template

When you reply to Google with the new video link:

> Subject: Re: OAuth Verification — greenlist-43ba1 — Updated Demo Video
>
> Hi Google Trust & Safety team,
>
> Thank you for the previous feedback. I have re-recorded the demo video addressing each concern from your last review:
>
> 1. **Watermark removed** — recorded with Loom, no third-party branding
> 2. **Browser URL visible throughout** — full `accounts.google.com` URL is clearly shown during the consent flow (timestamp 0:48–1:00)
> 3. **Unverified-app bypass demonstrated step-by-step** — Advanced → "Go to myncel.com (unsafe)" → consent (timestamp 0:32–0:48)
> 4. **Scope usage demonstrated** — after granting consent, the app exports work-order data to a new Google Sheet, which is then opened to verify the data was written (timestamp 1:08–1:35). This directly demonstrates the `https://www.googleapis.com/auth/spreadsheets` scope in action.
> 5. **Single test user throughout** — the entire flow uses one Gmail account ([your test user email]) which is registered as a Test User on the OAuth consent screen.
>
> **Updated demo video (unlisted YouTube):** [paste link here]
>
> **Architecture note:** This integration is **platform-managed**. Only super admins of myncel.com (currently 1 account) ever trigger this OAuth flow. The resulting token is stored server-side and used by the platform to fulfill export requests from sub-organizations — end users never see the consent screen. The scope is essential because we write tabular CMMS data (work orders, maintenance reports, parts inventory) to user-specified Google Sheets for reporting workflows.
>
> **Privacy policy:** https://www.myncel.com/privacy
> **Homepage:** https://www.myncel.com
> **App name in console:** myncel
>
> Please let me know if you need anything else.
>
> Thank you,
> [Your name]

---

## 4. Common Re-Rejection Reasons (avoid these on re-submission)

| Reviewer says | What it means | Prevention |
|---|---|---|
| "Cannot verify the OAuth screen is genuine" | Address bar wasn't visible | Shot 5 + Shot 6 — keep URL bar in frame |
| "Scope usage not demonstrated" | You consented but didn't USE the scope | Shot 8 — actually export and open the sheet |
| "Privacy policy URL doesn't match" | Branding domain mismatch | Make sure OAuth consent screen lists exactly `myncel.com` and the privacy URL is `https://www.myncel.com/privacy` |
| "App branding inconsistent" | Logo/name in OAuth ≠ logo/name in app | In Cloud Console → OAuth consent screen → upload the same Myncel logo that's on myncel.com |
| "Domain not verified" | Webmaster verification missing | https://search.google.com/search-console — verify `myncel.com` ownership |

---

## 5. If This Round Also Fails

You always have the cancel-and-stay-in-Testing-mode fallback (Path A from our chat). The architecture genuinely doesn't need verification — only super admins (≤100 forever) ever hit OAuth. So this video is a "nice-to-have," not a blocker.
