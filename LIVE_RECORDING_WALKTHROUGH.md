# 🎬 LIVE RECORDING WALKTHROUGH — Google OAuth Verification Video

**Follow this document step-by-step WHILE recording.** Each section has an exact script to read + what to do on screen. Total time: ~90 seconds of final video.

---

## ✅ PRE-FLIGHT CHECKLIST (do this before you press record)

Check each box before you start:

- [ ] Vercel has successfully deployed commit `fdda35f` (or later). Check https://vercel.com/dashboard — status should be ✅ Ready
- [ ] You can open https://www.myncel.com and the site loads
- [ ] You can log in to Myncel
- [ ] You have **at least 3 work orders** created (any status). If you don't, go to Dashboard → Work Orders → + New Work Order and create 3 quick ones
- [ ] You have a screen recorder ready:
  - **Free options:** Loom (recommended — auto-uploads to a shareable link), OBS Studio, or macOS built-in (Cmd + Shift + 5)
  - **Settings:** 1080p, system audio ON, microphone ON
- [ ] Sign out of Google in your browser so the OAuth consent screen appears fresh (or use Incognito/Private window)
- [ ] Have this document open on a second monitor / phone so you can read the script while recording
- [ ] Open Google Cloud Console in a tab: https://console.cloud.google.com/apis/credentials (logged in as the account that owns the Myncel OAuth client)
- [ ] Close all unrelated apps / browser tabs / notifications

---

## 🎥 RECORDING SCRIPT (read each line aloud while doing the action)

### SCENE 1 — Intro (0:00 – 0:05) — 5 seconds

**👁 SHOW:** Google Cloud Console → APIs & Services → Credentials → click the Myncel OAuth 2.0 Client ID

**🗣 SAY:**
> "Hi, this is the verification demo for Myncel. This is our OAuth 2.0 Client ID in Google Cloud Console."

---

### SCENE 2 — ⚠️ SHOW SCOPES IN OAUTH CONSENT SCREEN CONFIG (0:05 – 0:20) — 15 seconds

This is **REJECTION POINT #1** from Google. Do not skip this.

**👁 SHOW:** In the left sidebar, click **OAuth consent screen**. Scroll down to the **Scopes for Google APIs** section.

**🗣 SAY:**
> "On the OAuth consent screen configuration page, you can see the single sensitive scope Myncel requests: `https://www.googleapis.com/auth/spreadsheets`. This is the only Google scope our application uses."

**🎯 CRITICAL:** Zoom in with your cursor hover so the scope text is clearly readable. Hold on this view for at least 3 full seconds.

---

### SCENE 3 — Homepage & Public Pages (0:20 – 0:30) — 10 seconds

**👁 SHOW:** Open new tab → go to https://www.myncel.com

**🗣 SAY:**
> "Myncel is a maintenance management platform for manufacturing facilities."

**👁 SHOW:** Click **Privacy** link in the footer. Show https://www.myncel.com/privacy briefly.

**🗣 SAY:**
> "Our privacy policy at myncel.com/privacy and terms at myncel.com/terms are publicly accessible."

**👁 SHOW:** Click back button.

---

### SCENE 4 — Log In and Initiate Connect (0:30 – 0:45) — 15 seconds

**👁 SHOW:**
1. Click "Sign In" → log in with your account
2. Once in the dashboard, navigate to **Settings → Integrations**
3. Find the **Google Sheets** card
4. Click the **Connect** button

**🗣 SAY:**
> "A logged-in user goes to Settings, then Integrations, and clicks Connect on the Google Sheets card to authorize the application."

---

### SCENE 5 — ⚠️ OAUTH CONSENT SCREEN: CLICK THE "i" / EXPAND TO SHOW SCOPE URL (0:45 – 1:00) — 15 seconds

This is **REJECTION POINT #2** from Google. You MUST show the full scope URL on screen.

**👁 SHOW:** Google's OAuth consent screen appears.

On the consent screen, next to the permission line that says **"See, edit, create, and delete all your Google Sheets spreadsheets"**, there is a **small info icon (ⓘ)** or **chevron (▾)**. **CLICK IT.**

When you click, a popover appears showing the full scope URL:
```
https://www.googleapis.com/auth/spreadsheets
```

📸 **See the reference image `google_oauth_scope_reference.png` in this repo — that's exactly what reviewers need to see on screen.**

**🗣 SAY (while the popover is visible):**
> "On the consent screen, I click the information icon next to the permission. This reveals the exact scope URL being requested: `https://www.googleapis.com/auth/spreadsheets`. This is the sensitive scope under verification."

**🎯 CRITICAL:** Keep the popover on screen for at least 4 full seconds so Google reviewers can read the URL clearly.

**👁 SHOW:** Click **Allow**. You'll be redirected back to Myncel's integrations page. The Google Sheets card now shows "Connected" status.

---

### SCENE 6 — ⚠️ USE THE SCOPE: Export to Sheets (1:00 – 1:25) — 25 seconds

This is **REJECTION POINT #3** from Google — demonstrating the scope in actual use.

**👁 SHOW:** On the now-connected Google Sheets card, there's a green **"📊 Export to Sheets ▾"** dropdown button. Click it → select **"Work Orders"**.

**🗣 SAY:**
> "Now I demonstrate how Myncel uses the spreadsheets scope. I click Export to Sheets, then select Work Orders. Myncel calls the Google Sheets API using the user's access token."

**👁 WHAT HAPPENS:** A loading spinner briefly shows, then a new browser tab automatically opens with the newly-created Google Sheet.

**🗣 SAY (while the new spreadsheet loads):**
> "A brand new Google Sheet is created in the user's Drive and populated with their work order data — work order number, title, machine, priority, status, created date, and due date."

**🎯 CRITICAL:** Stay on the populated Google Sheet for at least 6 full seconds. Scroll down once so reviewers see the data rows. This proves the scope is genuinely used to create + write to spreadsheets.

---

### SCENE 7 — Show it in Google Drive (1:25 – 1:35) — 10 seconds (optional but recommended)

**👁 SHOW:** Open new tab → https://drive.google.com. The newly-created sheet appears at the top.

**🗣 SAY:**
> "The spreadsheet now lives in the user's own Google Drive with full ownership. They can edit it, share it, or delete it — Myncel's role ends at creation."

---

### SCENE 8 — Close (1:35 – 1:40) — 5 seconds

**🗣 SAY:**
> "That concludes the demo. Myncel's only use of the Google Sheets scope is to create and populate spreadsheets on demand when the user clicks Export. Thank you for reviewing."

**⏹ STOP RECORDING.**

---

## 📤 POST-RECORDING STEPS

### 1. Review the video

Before uploading, watch it and check:
- [ ] The scope URL `https://www.googleapis.com/auth/spreadsheets` appears on screen and is READABLE in at least 2 separate scenes (Scene 2 + Scene 5)
- [ ] The Google Sheet that was created is VISIBLE with data in it for 5+ seconds (Scene 6)
- [ ] Audio is clear and in English throughout
- [ ] No personal information is visible (email addresses are OK; passwords/tokens are NOT)

If any box is unchecked → re-record that scene.

### 2. Upload to YouTube

- Go to https://studio.youtube.com
- Click **Create → Upload video**
- Title: `Myncel - Google Sheets API Scope Demo (OAuth Verification)`
- Description:
  ```
  OAuth verification demo for Myncel showing:
  - Scope configuration in Google Cloud Console
  - Scope disclosure on the consent screen
  - Live usage of https://www.googleapis.com/auth/spreadsheets to create and populate a Google Sheet

  App: https://www.myncel.com
  Privacy: https://www.myncel.com/privacy
  Terms: https://www.myncel.com/terms
  ```
- Visibility: **Unlisted** ← must be unlisted, NOT private (Google reviewers need to view it)
- Click **Publish**
- Copy the video URL

### 3. Submit to Google's verification form

Reply to the rejection email (or use the Google Cloud verification form) and paste this response text (customize the timestamps after watching your final video):

```
We have addressed both feedback points:

1. SCOPES DISPLAY: The new demo video displays the scope
   `https://www.googleapis.com/auth/spreadsheets` in two places:
   - 00:05-00:20 — in the OAuth consent screen configuration page of
     Google Cloud Console
   - 00:45-01:00 — on the live consent screen, expanded via the info
     icon to show the full scope URL

2. SCOPE USAGE: Starting at 01:00, the video demonstrates the scope in
   actual use. After authorization, the user clicks "Export to Sheets"
   in Myncel's Integrations settings page, which calls
   sheets.googleapis.com/v4/spreadsheets to create a new spreadsheet,
   then writes the user's work order data into it. The newly-created
   spreadsheet is shown populated with real data in the user's own
   Google Drive (01:25).

The export functionality is live at:
  https://www.myncel.com/settings/integrations

Source code for the scope usage is at:
  /app/api/integrations/google-sheets/export/route.ts

Video (unlisted): [YOUR YOUTUBE URL]

Thank you for re-reviewing.
```

---

## 🆘 TROUBLESHOOTING

**Q: I don't see an info icon / chevron next to the scope on the consent screen.**
A: Depending on your Google account's UI version, the disclosure may be behind a "See more" or "▾" arrow. If you truly can't find it, just hover/highlight the permission text "See, edit, create, and delete all your Google Sheets spreadsheets" for 5 seconds — that text IS the scope description and Google accepts it.

**Q: The "Export to Sheets" button didn't open a new tab.**
A: Your browser might be blocking popups from myncel.com. Allow popups for myncel.com, reconnect, and try again. Alternatively, the result modal will show an "Open ↗" button — click that instead.

**Q: My exported spreadsheet is empty.**
A: You have zero work orders in your org. Create 3-5 work orders first, then re-export.

**Q: Can I record in multiple takes and stitch together?**
A: Yes — Loom and OBS both support this. Just make sure the narration flows and there are no awkward cuts mid-scene.

**Q: Do I need to show the Privacy Policy page?**
A: Helpful but optional. If your OAuth consent screen config in Google Cloud Console already has the correct Privacy + Terms URLs, you don't need to show them in the video — Google reviewers can verify them directly.

---

## 🎯 ONE-LINE SUMMARY

**Show scopes in 2 places (config page + consent popover) → actually create a real Google Sheet → show that sheet populated in Drive. Done.**
