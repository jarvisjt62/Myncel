# Myncel Mobile

Native iOS + Android companion app for [Myncel](https://www.myncel.com), a CMMS (Computerized Maintenance Management System) for tracking machines, work orders, maintenance schedules, and alerts.

Built with **Expo SDK 51 + React Native + TypeScript**. The app shares its visual identity (Stripe-inspired purple `#635bff`, rounded cards, clean typography) with the Myncel web app, and talks to the same backend over a dedicated `/api/mobile/*` JSON API secured with JWT bearer tokens.

---

## Features

- 🔐 Email + password sign-in (issues a 30-day JWT, stored in **Expo Secure Store**)
- 📊 **Dashboard** — counts of machines, open work orders, overdue tasks, unread alerts; recent activity
- ⚙️ **Equipment** — browse machines, drill into work orders / tasks / alerts per machine
- 📝 **Work Orders** — list (with status / assignee filters), detail, status updates, completion notes from the field
- 📅 **Schedules** — upcoming preventive maintenance tasks, sorted by next-due date
- 🔔 **Alerts** — incident feed with mark-read and resolve actions
- 👤 **Profile** — user info, organization, sign-out
- 🔔 **Push Notifications** — Expo push tokens registered against the backend; deep-link tap-through
- 🎯 Permission gates that mirror the web `<Can>` component — managers/admins see editing actions, members see read-only views

---

## Tech stack

| Layer            | Choice                                                         |
| ---------------- | -------------------------------------------------------------- |
| Framework        | Expo SDK 51 (managed workflow), React Native 0.74              |
| Language         | TypeScript (strict path aliases via `@/*` → `./src/*`)         |
| Navigation       | React Navigation v6 (bottom tabs + native stacks)              |
| State / data     | React Context + Axios + simple per-screen `useEffect` fetching |
| Storage          | `expo-secure-store` for JWT + cached user                      |
| Push             | `expo-notifications` + Expo push service                       |
| Build / release  | EAS Build + EAS Submit                                         |
| Bundle ID        | `com.jarvisitconsults.myncel` (iOS + Android)                  |

---

## Project structure

```
myncel-mobile/
├── App.tsx                       # Root: providers + RootNavigator + push handler
├── index.ts                      # registerRootComponent(App)
├── app.json                      # Expo manifest (icons, splash, plugins, deep links)
├── eas.json                      # Build profiles: development, preview, production
├── babel.config.js
├── tsconfig.json
├── assets/                       # icon, splash, adaptive-icon, favicon, notification-icon
└── src/
    ├── api/
    │   ├── client.ts             # Axios instance + JWT interceptor + 401 handler
    │   ├── endpoints.ts          # Typed wrappers for /api/mobile/* and /api/*
    │   └── types.ts              # Shared types mirroring the Prisma schema
    ├── auth/
    │   ├── AuthContext.tsx       # signIn / signOut / refresh, token rehydration
    │   └── Can.tsx               # Permission gate component
    ├── components/               # Button, Card, Badge, EmptyState, ScreenContainer
    ├── navigation/
    │   ├── RootNavigator.tsx     # NavigationContainer + tabs + nested stacks
    │   ├── icons.tsx             # SVG tab icons
    │   └── types.ts              # Param lists for stacks / tabs
    ├── screens/                  # Login, Dashboard, Equipment*, WorkOrders*, Schedules, Alerts*, Profile
    ├── theme/                    # Colors, spacing, typography (Stripe-style)
    └── utils/
        ├── date.ts               # date-fns helpers
        └── push.ts               # Push token registration + sync
```

---

## Backend contract

The mobile app uses a dedicated set of API routes under `app/api/mobile/`:

| Method | Path                                | Purpose                                                |
| ------ | ----------------------------------- | ------------------------------------------------------ |
| POST   | `/api/mobile/login`                 | email + password → `{ token, user }`                   |
| GET    | `/api/mobile/me`                    | Current user (validates bearer token)                  |
| POST   | `/api/mobile/logout`                | Discards push token (JWT is stateless on the client)   |
| POST   | `/api/mobile/push-token`            | Register / refresh an Expo push token                  |
| DELETE | `/api/mobile/push-token?token=…`    | Remove an Expo push token                              |
| GET    | `/api/mobile/dashboard`             | Counts + recent work orders / tasks / alerts           |
| GET    | `/api/mobile/machines`              | Org's machines with counts                             |
| GET    | `/api/mobile/machines/:id`          | Single machine + related work orders / tasks / alerts  |
| GET    | `/api/mobile/work-orders`           | Filterable: `?status=…&assignedToMe=1`                 |
| GET    | `/api/mobile/work-orders/:id`       | Single work order with parts + assignee + creator      |
| PATCH  | `/api/mobile/work-orders/:id`       | Update status / completion notes / actual minutes      |
| GET    | `/api/mobile/maintenance-tasks`     | Active maintenance schedules                           |
| GET    | `/api/mobile/alerts`                | Filterable: `?unread=1`                                |
| GET    | `/api/mobile/alerts/:id`            | Single alert                                           |
| PATCH  | `/api/mobile/alerts/:id`            | `{ isRead?, isResolved? }`                             |

All endpoints (except `/api/mobile/login`) require:

```
Authorization: Bearer <jwt>
```

JWTs are signed with `MOBILE_JWT_SECRET` (falling back to `NEXTAUTH_SECRET`), expire in 30 days, and embed `{ sub, email, role, organizationId }`.

### New Prisma model

```prisma
model MobilePushToken {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String   @unique
  platform   String   // "ios" | "android"
  deviceName String?
  appVersion String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  lastUsedAt DateTime @default(now())

  @@index([userId])
  @@map("mobile_push_tokens")
}
```

After pulling these changes in the main `Myncel/` project, run:

```bash
npx prisma migrate dev --name add_mobile_push_tokens
```

(or `npx prisma db push` for a quick dev sync).

---

## Configuration

### `app.json` extras

The mobile app reads its API base URL from `Constants.expoConfig.extra.apiBaseUrl`:

```jsonc
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://www.myncel.com"
    }
  }
}
```

To point at a local backend (e.g. `http://192.168.1.20:3000`) edit this value before running the dev client. **Do not use `localhost`** from a physical device — use your machine's LAN IP.

### Environment

For the **backend**, set in production (Vercel):

```
MOBILE_JWT_SECRET=<a long random string, e.g. `openssl rand -hex 64`>
```

If unset, `NEXTAUTH_SECRET` is used as a fallback.

---

## Local development

```bash
# 1. Install dependencies
cd myncel-mobile
npm install

# 2. (One-time) Log in to Expo
npx expo login

# 3. Run the dev client
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS / Android) or press `i` / `a` to open in a simulator/emulator.

> If you've added native modules that aren't in the prebuilt Expo Go (none currently), use `npx expo run:ios` / `npx expo run:android` to build a custom dev client.

---

## Production builds (EAS)

`eas.json` defines three profiles:

| Profile       | Distribution | Channel       |
| ------------- | ------------ | ------------- |
| `development` | internal     | development   |
| `preview`     | internal     | preview       |
| `production`  | store        | production    |

```bash
# 1. Install / log in to EAS CLI (one time)
npm install -g eas-cli
eas login

# 2. Configure once per project
eas build:configure

# 3. Build a TestFlight / internal Android APK
eas build --profile preview --platform all

# 4. Build for the App Store + Play Store
eas build --profile production --platform all

# 5. Submit
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

### Required credentials

- **Apple**: Apple Developer account ($99/yr), Team ID, App Store Connect API key. EAS will guide you through provisioning profile + distribution cert generation.
- **Google**: Play Console account ($25 one-time), service-account JSON key with "Release manager" role for `eas submit`.

### Bundle IDs

- iOS: `com.jarvisitconsults.myncel`
- Android: `com.jarvisitconsults.myncel`

---

## Push notifications

1. On first login, the app calls `registerForPushNotificationsAsync()` (in `src/utils/push.ts`).
2. Expo returns an `ExponentPushToken[…]`.
3. The token is `POST`-ed to `/api/mobile/push-token` with platform + device name + app version.
4. The backend stores it in `mobile_push_tokens`, keyed by token (one row per device).
5. On notification tap, `App.tsx` reads `notification.data.deepLink` (e.g. `myncel://work-orders/123`) and the navigator routes the user to the right screen.

To send a push from the backend:

```ts
// Send via Expo's push service:
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: pushToken,
    title: 'Work order assigned',
    body: 'WO-2026-0042 — Replace bearing on Mixer #3',
    data: { deepLink: 'myncel://work-orders/abc123' },
  }),
})
```

---

## Releasing checklist

1. ☐ Bump `expo.version` and `expo.ios.buildNumber` / `expo.android.versionCode` in `app.json`
2. ☐ Update `CHANGELOG` if you keep one
3. ☐ Run `eas build --profile production --platform all`
4. ☐ Test the build internally (TestFlight + Internal App Sharing)
5. ☐ `eas submit --profile production --platform ios` (TestFlight → App Store review)
6. ☐ `eas submit --profile production --platform android` (Internal track → Production)
7. ☐ Tag the release in git: `git tag mobile-v1.0.0 && git push --tags`

---

## App Store / Play Store metadata

You'll be asked for the following at submission time. Keep these in `store/` once written:

- **Name**: Myncel
- **Subtitle (iOS)**: Maintenance, simplified.
- **Short description (Android, 80 chars)**: Track machines, work orders, and maintenance — all from your phone.
- **Full description**: ~3000 chars, focus on use cases (manufacturing floor managers, facility maintenance, fleet ops).
- **Keywords (iOS, 100 chars)**: cmms, maintenance, work order, equipment, preventive, machine, repair, facility
- **Category**: Business / Productivity
- **Screenshots**: Need 6.7" iPhone (1290×2796), 6.5" iPhone (1284×2778), iPad 12.9" (2048×2732), and Android phone + 7"/10" tablet variants. Use the dashboard, work order list, work order detail, alerts list, and profile screens.
- **Privacy policy URL**: `https://www.myncel.com/privacy`
- **Support URL**: `https://www.myncel.com/support`
- **Marketing URL**: `https://www.myncel.com`

---

## Troubleshooting

**"Network Error" on login**
The mobile device can't reach the API base URL. From a physical device, `localhost` resolves to the device, not your dev machine — use the LAN IP and ensure both are on the same network.

**401 immediately after login**
Check `MOBILE_JWT_SECRET` is set on the backend. If missing, the JWT verifies fine on the same instance but breaks across deploys when `NEXTAUTH_SECRET` rotates.

**Push token not arriving**
Push only works on physical devices, not simulators. On Android, ensure `google-services.json` is configured for Firebase if you've ejected; for managed Expo, you don't need this — the Expo push service handles it.

**Builds fail with "iOS bundle identifier already exists"**
Someone else in your Apple Developer team registered it. Either choose a new ID in `app.json` or have an admin transfer ownership.

---

## License

Proprietary — © Jarvis IT Consults. All rights reserved.
