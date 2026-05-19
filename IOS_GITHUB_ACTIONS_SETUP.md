# iOS Build via GitHub Actions — Step-by-Step Setup

This guide gets you from **zero iOS work done** to **a `.ipa` file ready for TestFlight**, all without owning a Mac.

GitHub Actions provides free `macos-latest` runners (2,000 free minutes/month for private repos, unlimited for public). Each build takes ~15–25 min, so you can do dozens of builds for free.

---

## 0. What we're building

You already have a **Capacitor** mobile shell at:
```
C:\Users\kelly\Myncel_Project\myncel-webview
```

That folder contains an `ios/` subdirectory (Capacitor created it when you ran `npx cap add ios`). We'll push that whole project to a GitHub repo so Actions can build it on a Mac runner.

> **Note:** The `Myncel/myncel-mobile/` folder in your current repo is the older **Expo** version. That's a different project — leave it alone. iOS builds will run against the **Capacitor** project on your Windows machine.

---

## 1. Apple Developer Portal — One-Time Setup (~30 min)

You're already enrolled in the Apple Developer Program. Now you need three things from Apple's developer portal:

### 1a. Create the App ID (Bundle Identifier)

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **+** → **App IDs** → **App** → Continue
3. Description: `Myncel`
4. Bundle ID: **Explicit** → `com.jarvisitconsults.myncel`
   *(Must match `appId` in your Capacitor `capacitor.config.ts`)*
5. Capabilities: enable **Push Notifications** (you'll need this later) — leave others off
6. Click Continue → Register

### 1b. Create the App in App Store Connect

1. Go to https://appstoreconnect.apple.com/apps
2. Click **+** → **New App**
3. Platform: **iOS**
4. Name: `Myncel`
5. Primary Language: English (U.S.)
6. Bundle ID: pick the `com.jarvisitconsults.myncel` you just created
7. SKU: `myncel-ios-001` (any unique string)
8. User Access: Full Access
9. Click Create

### 1c. Generate the App Store Connect API Key (for automated TestFlight upload)

1. Go to https://appstoreconnect.apple.com/access/integrations/api
2. Click **Team Keys** tab → **Generate API Key** (or **+**)
3. Name: `GitHub Actions Myncel`
4. Access: **App Manager** (lets it upload to TestFlight)
5. Click Generate
6. **Download the `.p8` file** (you only get one chance — save it locally as `AuthKey_XXXXXXXXXX.p8`)
7. Note the **Key ID** (e.g. `ABCD1234EF`) shown in the table
8. Note the **Issuer ID** at the top of the page (a UUID)

You now have three values to save somewhere safe:
- `APP_STORE_CONNECT_API_KEY_ID` = the Key ID
- `APP_STORE_CONNECT_API_ISSUER_ID` = the Issuer ID
- The `.p8` file contents (we'll base64-encode it)

---

## 2. Code Signing — The "Match" Approach (recommended)

Apple requires a signing certificate + provisioning profile to build. The cleanest way to manage these without a Mac is **fastlane match**, which stores them in a private git repo, encrypted.

### 2a. Create a private GitHub repo for signing assets

1. Go to https://github.com/new
2. Repo name: `myncel-ios-certificates`
3. Visibility: **Private** ← critical
4. Initialize with a README (just so it's not empty)

### 2b. Generate a Personal Access Token for fastlane to read this repo

1. https://github.com/settings/tokens?type=beta → **Generate new token (fine-grained)**
2. Name: `fastlane match — myncel-ios-certificates`
3. Repository access: Only select repositories → pick `myncel-ios-certificates`
4. Permissions → Repository → **Contents: Read and write**
5. Generate → copy the token (starts with `github_pat_...`)

Save as `MATCH_GIT_BASIC_AUTH` (we'll combine it with username in step 4).

### 2c. The first match run — done by GitHub Actions

We'll add a one-time bootstrap workflow that, when manually triggered, generates the cert + profile and stores them encrypted in `myncel-ios-certificates`. You don't need a Mac for this — the workflow runs on a macOS runner.

---

## 3. Push Your Capacitor Project to a GitHub Repo

You have two clean options:

### Option A (recommended): Add `myncel-webview/` as a separate repo

1. On Windows, open PowerShell in `C:\Users\kelly\Myncel_Project\myncel-webview`
2. Create a new GitHub repo `myncel-webview` (private)
3. Run:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: Capacitor shell"
   git branch -M main
   git remote add origin https://github.com/jarvisjt62/myncel-webview.git
   git push -u origin main
   ```

### Option B: Add it as a folder inside the existing `Myncel` repo

Less clean but possible. Skip if you're not sure — Option A is what this guide assumes.

---

## 4. Add GitHub Secrets (in the `myncel-webview` repo)

Go to: `https://github.com/jarvisjt62/myncel-webview/settings/secrets/actions`

Click **New repository secret** for each:

| Secret name | Value |
|---|---|
| `APPLE_TEAM_ID` | Your 10-character Team ID (find at https://developer.apple.com/account → Membership) |
| `APP_STORE_CONNECT_API_KEY_ID` | The Key ID from step 1c |
| `APP_STORE_CONNECT_API_ISSUER_ID` | The Issuer ID from step 1c |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | The full contents of the `.p8` file (open in Notepad, paste everything including `-----BEGIN PRIVATE KEY-----` lines) |
| `MATCH_PASSWORD` | A strong password you make up (used to encrypt the certs in `myncel-ios-certificates`). Save it in 1Password — losing it means starting over. |
| `MATCH_GIT_URL` | `https://github.com/jarvisjt62/myncel-ios-certificates.git` |
| `MATCH_GIT_BASIC_AUTH` | Base64 of `jarvisjt62:<your_PAT_from_step_2b>`. Run in PowerShell: `[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("jarvisjt62:github_pat_..."))` |
| `KEYCHAIN_PASSWORD` | Another strong password you make up (used only inside the macOS runner; can be anything) |

---

## 5. Add the GitHub Actions Workflow Files

Two workflow files go in `myncel-webview/.github/workflows/`:

1. **`ios-bootstrap.yml`** — Run **once** to generate the signing certs (manual trigger)
2. **`ios-build.yml`** — Runs on every push to build + upload to TestFlight

Both files are in this repo at `Myncel/docs/github-actions-templates/`. Copy them into the `myncel-webview` repo.

---

## 6. The first build

1. Push the workflow files to `myncel-webview/main`
2. Go to repo → **Actions** tab → **iOS Bootstrap (run once)** → **Run workflow** → pick `main` → Run
3. Wait ~10 min. This creates the cert in `myncel-ios-certificates` and uploads it to Apple.
4. Once green ✅, every subsequent push to `main` triggers `ios-build.yml`, which:
   - Installs Capacitor + npm deps
   - Runs `npx cap sync ios`
   - Pulls the certs via fastlane match
   - Builds the `.ipa`
   - Uploads to TestFlight automatically

You'll get an email from Apple ~10 min after the build finishes saying "Myncel build 1 (1.0.0) is now available on TestFlight."

---

## 7. What you need to do on Windows BEFORE the first push

Make sure these files exist in `myncel-webview/`:

```
myncel-webview/
├── ios/                          ← created by `npx cap add ios`
│   └── App/
│       ├── App.xcworkspace
│       ├── App.xcodeproj
│       └── App/Info.plist
├── capacitor.config.ts           ← appId must be com.jarvisitconsults.myncel
├── package.json                  ← must list @capacitor/ios as a dependency
└── .github/workflows/
    ├── ios-bootstrap.yml
    └── ios-build.yml
```

If `ios/` doesn't exist yet, on Windows in your Capacitor project run:
```powershell
npm install @capacitor/ios
npx cap add ios
```

Then commit:
```powershell
git add ios/ package.json package-lock.json
git commit -m "Add iOS Capacitor project"
git push
```

---

## 8. Cost summary

- Apple Developer Program: $99/year (already paid ✅)
- GitHub Actions macOS minutes: **$0** (you're under the free tier)
- App Store Connect: Free
- TestFlight: Free
- **Total ongoing: $0/month**

Compare to:
- Mac mini M2: ~$600
- MacBook Air M2: ~$1,000
- MacInCloud rental: ~$30/month
- Codemagic / Expo EAS: ~$30–$100/month

---

## 9. Troubleshooting checklist

If `ios-build.yml` fails:

| Error | Fix |
|---|---|
| `No code signing identity found` | The bootstrap workflow didn't run. Run it from the Actions tab. |
| `Invalid API key` | Re-check `APP_STORE_CONNECT_API_KEY_CONTENT` includes the BEGIN/END lines. |
| `match: Could not find a profile` | Bundle ID mismatch. Check `capacitor.config.ts` `appId` matches the App ID in Apple portal. |
| `pod install failed` | Add `cd ios/App && pod install` step before build. The template already does this. |
| `Build succeeded but TestFlight upload failed` | API key role is wrong — must be **App Manager**, not Developer. Regenerate. |

---

## What's next after this works

1. Build will appear in TestFlight within ~10 min of push
2. Add yourself as an internal tester at https://appstoreconnect.apple.com/apps → My App → TestFlight
3. Install TestFlight on your iPhone, accept the invite, install Myncel
4. Once happy, submit for App Store review (separate workflow we can add later)

Ready to start? See the workflow file templates in `docs/github-actions-templates/` and tell me which step you want help with first.
