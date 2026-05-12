# Google OAuth Verification Video — RECORDING SCRIPT v3

This script addresses Google's two specific rejection points:

1. **"Video doesn't display the scopes on the Services Page"**
2. **"Does not sufficiently demonstrate how the application utilizes the `https://www.googleapis.com/auth/spreadsheets` scope"**

**Total video length: ~90 seconds**

---

## WHAT'S NEW (since last rejection)

We built a **real export-to-Google-Sheets feature** so the scope is genuinely used:

- `POST /api/integrations/google-sheets/export` creates a new Google Sheet and writes your work orders into it
- UI button added at `/settings/integrations` → Google Sheets card → **"📊 Export to Sheets"**
- After deployment, anyone who connects Google Sheets can click the button and see the scope in action

---

## RECORDING CHECKLIST (before you press record)

- [ ] Deploy the latest code (push already done — wait for Vercel deploy to complete on www.myncel.com)
- [ ] Log out of Google in your browser, or use a fresh profile
- [ ] Create at least 3-5 work orders in Myncel so the exported sheet has visible data
- [ ] Open screen recorder (Loom, OBS, or macOS Cmd+Shift+5)
- [ ] Record at 1080p, include audio narration

---

## VIDEO SCRIPT (read aloud while recording)

### PART 1 — Show the OAuth Client ID (5 seconds)

**Screen:** Google Cloud Console → APIs & Services → Credentials → click the OAuth 2.0 Client ID for Myncel.

**Narrate:**
> "This is the OAuth Client ID for Myncel, Client ID [read last 6 chars of client ID], submitted for verification."

### PART 2 — Show the OAuth Consent Screen config with Scopes (15 seconds) ⚠️ CRITICAL

**Screen:** In Google Cloud Console → **OAuth consent screen** → scroll down to the **Scopes** section.

**Narrate:**
> "In the OAuth consent screen configuration, you can see the sensitive scope we are requesting: `https://www.googleapis.com/auth/spreadsheets`. This is the only scope Myncel requests from Google."

**Zoom in on the scopes list so the text is clearly readable.**

### PART 3 — Show the Homepage + Privacy Policy (10 seconds)

**Screen:** Navigate to `https://www.myncel.com`

**Narrate:**
> "This is Myncel, a maintenance management platform for manufacturing and facilities. The homepage, privacy policy, and terms of service are all publicly accessible at myncel.com/privacy and myncel.com/terms."

Click the Privacy link, show the page briefly, click back.

### PART 4 — Log In and Trigger OAuth (20 seconds)

**Screen:** Log into Myncel → Settings → Integrations → click **"Connect"** on the Google Sheets card.

**Narrate:**
> "A user connects Google Sheets from the Integrations settings. This redirects to Google's OAuth consent screen."

### PART 5 — Consent Screen: CLICK THE SERVICES LINK (15 seconds) ⚠️ CRITICAL

**Screen:** On the Google consent screen that appears, you'll see text like:
> "Myncel wants access to your Google Account"
> "This will allow Myncel to: See, edit, create, and delete all your Google Sheets spreadsheets"

**↓↓↓ CLICK THE "Services" LINK / TRUST SECTION ↓↓↓**

At the bottom of the consent screen there's usually an expandable section or a link that shows the full list of scopes. **Click it. Make sure the scope `https://www.googleapis.com/auth/spreadsheets` is clearly visible on screen for at least 3 seconds.**

**Narrate:**
> "On the consent screen, I click to expand the Services section. This displays the exact scope being requested: `https://www.googleapis.com/auth/spreadsheets`. The user reviews this and clicks Allow."

Click **Allow**. You'll be redirected back to Myncel's integrations page with "Google Sheets Connected".

### PART 6 — USE THE SCOPE: Export Work Orders (25 seconds) ⚠️ CRITICAL

**Screen:** On the Integrations page, the Google Sheets card now shows a **"📊 Export to Sheets"** button.

**Narrate:**
> "Now I demonstrate how Myncel uses the spreadsheets scope. I click 'Export to Sheets'. Myncel calls the Google Sheets API using the access token to create a brand new spreadsheet and write the organization's work orders into it."

**Click the button.** A new browser tab automatically opens showing the newly-created Google Sheet.

**Narrate (while the sheet is visible):**
> "The new spreadsheet was created in the user's Google Drive and populated with work order data — work order number, title, machine, priority, status, created date, and due date. This is the only use of the spreadsheets scope: creating and writing to sheets on the user's behalf when they export their maintenance data."

**Stay on the spreadsheet for 5+ seconds so reviewers can clearly see data was written.**

### PART 7 — Optional: Show it in Google Drive (5 seconds)

**Screen:** Open `drive.google.com` in a new tab. The newly-created file appears at the top of Recent.

**Narrate:**
> "The spreadsheet is now in the user's Drive and they have full ownership of it."

### PART 8 — Close (5 seconds)

**Narrate:**
> "That concludes the demo. Myncel uses the Google Sheets scope solely to create and populate spreadsheets when the user clicks Export. Thank you for reviewing."

---

## POST-PRODUCTION

- Upload to YouTube as **Unlisted** (NOT private — Google's reviewers need to view it)
- Video title: `Myncel — Google Sheets API Scope Demo (Verification)`
- Description: paste this script or a brief summary

---

## SUBMIT TO GOOGLE

In the OAuth verification response form:

- **YouTube link:** new unlisted URL
- **Response to rejection:** paste this text:

> We have addressed both feedback points. (1) The new demo video at [NEW YOUTUBE LINK] displays the `https://www.googleapis.com/auth/spreadsheets` scope on the OAuth consent screen's Services / Trust section between 0:45–0:58. (2) Starting at 1:05, the video demonstrates the scope in use: after authorization, the user clicks "Export to Sheets" in Myncel's Integrations page, which calls `sheets.googleapis.com/v4/spreadsheets` to create a new spreadsheet, then writes the user's work order data into it. The new spreadsheet is shown populated with data in the user's own Google Drive. This export functionality is live at https://www.myncel.com/settings/integrations — source code is at /app/api/integrations/google-sheets/export/route.ts in our repo.

---

## KEY URLs FOR GOOGLE REVIEWERS

- Homepage: https://www.myncel.com
- Privacy: https://www.myncel.com/privacy
- Terms: https://www.myncel.com/terms
- App scope usage (requires login): https://www.myncel.com/settings/integrations

---

## ⚠️ COMMON MISTAKES TO AVOID

1. **Don't skip the "Services" link click** — that's the #1 rejection reason. The scope must be visible on-screen, not just in the URL.
2. **Don't record at 720p or lower** — reviewers need to read the scope text clearly. Use 1080p.
3. **Don't use a private/internal YouTube link** — unlisted only.
4. **Don't cut the "data being written" part short** — show the populated sheet for 5+ seconds.
5. **Don't narrate in a language other than English** — Google's review team reviews in English.
