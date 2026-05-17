# Myncel — Mobile Push Notifications

This document describes how the Capacitor mobile shell (Android + iOS) wires
up push notifications so that users receive alerts (new alert, work order
assigned, status change, …) with the **Myncel notification icon** even when
the app is in the background.

The web bundle already ships with everything needed on the JavaScript /
server side:

| Layer | File | Purpose |
| --- | --- | --- |
| Client init | `lib/native-notifications.ts` | Detects Capacitor, requests permission, registers device token, mirrors foreground pushes as local notifications. |
| Bootstrap | `app/components/NotificationsBootstrap.tsx` | Calls `initNativeNotifications()` once the user is signed in. Mounted in `<Providers>` so it runs on every page. |
| Device registration API | `app/api/notifications/devices/route.ts` | `POST` upserts an FCM/APNs token, `DELETE` removes it. Uses Next-Auth session, so the Capacitor WebView authenticates with cookies — no extra JWT. |
| Server fan-out | `lib/notifications/push.ts` | `sendPushToUser(userId, payload)` dispatches via Expo push for legacy tokens and FCM HTTP v1 for Capacitor tokens. Auto-cleans dead tokens. |
| Trigger point | `lib/notify.ts` | `createNotification()` now also calls `sendPushToUser()` so every existing in-app notification (alerts, work orders, mentions, …) automatically goes out as a push. |

---

## 1. Capacitor mobile-shell repo (one-time setup)

Inside the **separate** Capacitor wrapper repo (the one that bundles the
production WebView app already published to Play Store):

```bash
npm i @capacitor/push-notifications @capacitor/local-notifications
npx cap sync
```

### `capacitor.config.ts` — register the plugins

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myncel.app',
  appName: 'Myncel',
  webDir: 'out',
  server: { url: 'https://myncel.com', androidScheme: 'https' },
  plugins: {
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
    LocalNotifications: {
      smallIcon: 'ic_stat_myncel',
      iconColor: '#635bff',
      sound: 'default',
    },
  },
};

export default config;
```

---

## 2. Android

### 2.1 Notification icon (Myncel branding)

Android requires the small icon used in the status bar to be **white-on-transparent**.
Generate it with [Android Asset Studio →
Notification icons](https://romannurik.github.io/AndroidAssetStudio/icons-notification.html)
from the existing Myncel logo, then drop the resulting PNGs into:

```
android/app/src/main/res/drawable-mdpi/ic_stat_myncel.png   24×24
android/app/src/main/res/drawable-hdpi/ic_stat_myncel.png   36×36
android/app/src/main/res/drawable-xhdpi/ic_stat_myncel.png  48×48
android/app/src/main/res/drawable-xxhdpi/ic_stat_myncel.png 72×72
android/app/src/main/res/drawable-xxxhdpi/ic_stat_myncel.png 96×96
```

The `largeIcon` (full-color Myncel logo) is the standard launcher icon —
`@mipmap/ic_launcher` — and is already in place.

### 2.2 `AndroidManifest.xml`

Add inside `<application>`:

```xml
<!-- Default Myncel notification icon + accent color -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_stat_myncel" />
<meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_accent" />
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="myncel-default" />
```

And `android/app/src/main/res/values/colors.xml`:

```xml
<color name="notification_accent">#635bff</color>
```

### 2.3 `google-services.json`

Drop the Firebase project's `google-services.json` into
`android/app/google-services.json`. The Firebase Gradle plugin is already
applied by Capacitor's default project template.

### 2.4 Notification channel

Created at runtime by `lib/native-notifications.ts` via
`LocalNotifications.createChannel()`. ID: `myncel-default`, importance HIGH,
vibration + light enabled, accent color `#635bff`.

---

## 3. iOS

### 3.1 Capabilities

In Xcode, open `App.xcworkspace`, select the `App` target, and under
**Signing & Capabilities** add:

- **Push Notifications**
- **Background Modes** → tick **Remote notifications**

### 3.2 `Info.plist`

The above capability checkboxes write the following automatically — verify they
appear:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

### 3.3 APNs key

In the [Apple Developer portal](https://developer.apple.com/account/resources/authkeys/list)
create an APNs auth key (`.p8`), then upload it in the Firebase console under
**Project settings → Cloud Messaging → Apple app configuration**.

### 3.4 Notification icon

iOS uses the app icon for the small icon (no separate notification icon
needed). The Myncel app icon set in `App/Assets.xcassets/AppIcon.appiconset`
is already configured.

---

## 4. Production environment variables

Set these on the Vercel project (or wherever the Next.js API runs):

```
FCM_PROJECT_ID=myncel-prod
FCM_CLIENT_EMAIL=firebase-adminsdk-xxx@myncel-prod.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Get them from **Firebase Console → Project settings → Service accounts →
Generate new private key**. Replace real newlines in the private key with
`\n` so it fits on a single line.

If these are absent, the server-side push helper logs a notice and skips
sending — everything else (in-app, email, SMS) still works.

---

## 5. End-to-end flow

```
┌──────────────────────────────┐
│  Server: createNotification  │  (e.g. work order assigned)
└────────────┬─────────────────┘
             │
             ├── db.notification.create()        → in-app bell
             ├── sendPushToUser(userId, …)
             │     ├── Expo  ─►  exp.host
             │     └── FCM v1 ─► fcm.googleapis.com
             │            ├── Android  ─► device shows banner
             │            │              icon: ic_stat_myncel
             │            │              channel: myncel-default
             │            └── iOS APNs ─► device shows banner
             │                            uses app icon
             ▼
┌──────────────────────────────┐
│ Capacitor WebView foreground │
│  pushNotificationReceived    │
│  → LocalNotifications.schedule│  (so an open app still beeps)
└──────────────────────────────┘
```

Tapping a notification routes the user to the deep-link path encoded in the
data payload (`link` field), e.g. `/dashboard?tab=alerts&alertId=xyz`.

---

## 6. Testing

### Local browser fallback

```js
// In the DevTools console of myncel.com
await Notification.requestPermission();
new Notification('Test', { body: 'Hello' });
```

### Native (Android)

1. Plug in a device, run `npx cap run android`.
2. Sign in.
3. Trigger an alert or assign a work order from another tab.
4. The phone should show a heads-up banner with the white Myncel icon and
   purple accent color, tapping it deep-links into the app.

### Server-side smoke test

```bash
curl -X POST https://myncel.com/api/notifications/test \
  -H 'cookie: <your session cookie>' \
  -H 'content-type: application/json' \
  -d '{ "title": "Push test", "message": "Hello from Myncel" }'
```
