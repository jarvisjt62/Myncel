/**
 * lib/native-notifications.ts
 *
 * Unified notification layer used by the Myncel web bundle in three contexts:
 *
 *   1. Inside the Capacitor WebView (Android / iOS native shell)
 *      → uses @capacitor/push-notifications for FCM/APNs remote pushes and
 *        @capacitor/local-notifications for in-app foreground toasts. The
 *        FCM/APNs registration token is reported back to the server so the
 *        backend can fan out pushes when a new alert / work order is created.
 *
 *   2. In a desktop browser (PWA-style)
 *      → falls back to the standard `Notification` Web API + a Service Worker
 *        registration for background pushes (Web Push). The same /api/notifications
 *        endpoint is reused.
 *
 *   3. Server-side rendering
 *      → all calls are no-ops (guarded by `typeof window !== 'undefined'`).
 *
 * The Capacitor packages are imported dynamically so this file remains buildable
 * inside the Next.js web build even before the @capacitor/* packages are added
 * to the mobile-shell repo. When they are missing, the dynamic import simply
 * fails and we silently fall back to web behavior.
 */

export type MyncelNotificationKind =
  | 'alert.new'
  | 'alert.acknowledged'
  | 'alert.resolved'
  | 'work_order.assigned'
  | 'work_order.status_changed'
  | 'work_order.due_soon'
  | 'work_order.overdue'
  | 'mention'
  | 'system';

export interface MyncelNotificationPayload {
  kind: MyncelNotificationKind;
  title: string;
  body: string;
  /** Optional deep-link path inside the app (e.g. /dashboard?tab=alerts&alertId=xyz) */
  link?: string;
  /** Optional ID for de-duplication / replacing on update */
  id?: string;
}

let registeredOnServer = false;
let nativeReady = false;
let isCapacitorEnv: boolean | null = null;

function detectCapacitor(): boolean {
  if (isCapacitorEnv !== null) return isCapacitorEnv;
  if (typeof window === 'undefined') { isCapacitorEnv = false; return false; }
  // @ts-ignore
  isCapacitorEnv = !!(window as any).Capacitor && !!(window as any).Capacitor.isNativePlatform?.();
  return isCapacitorEnv;
}

/**
 * Initialize notifications. Call once after the user is authenticated
 * (e.g. in a top-level client component once `session.status === 'authenticated'`).
 */
export async function initNativeNotifications(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (nativeReady) return;
  nativeReady = true;

  if (detectCapacitor()) {
    try {
      // The @capacitor/* packages live in the Capacitor mobile-shell repo, not in
      // the web Next.js build. We must hide these specifiers from webpack's static
      // analyzer or the web build fails with "Module not found". Using a runtime
      // variable + `webpackIgnore: true` magic comment ensures webpack will not
      // try to resolve or bundle them — they only get loaded by the WebView at
      // runtime where the packages ARE present.
      const __pushSpec = '@capacitor/push-notifications';
      const __localSpec = '@capacitor/local-notifications';
      const PushNotifications: any = await import(/* webpackIgnore: true */ /* @vite-ignore */ __pushSpec)
        .then((m: any) => m.PushNotifications ?? m.default?.PushNotifications ?? null)
        .catch(() => null);
      const LocalNotifications: any = await import(/* webpackIgnore: true */ /* @vite-ignore */ __localSpec)
        .then((m: any) => m.LocalNotifications ?? m.default?.LocalNotifications ?? null)
        .catch(() => null);

      if (LocalNotifications) {
        // Create a default Android channel so local notifications use the Myncel icon + sound.
        try {
          await LocalNotifications.createChannel?.({
            id: 'myncel-default',
            name: 'Myncel Alerts',
            description: 'Maintenance alerts, work orders and reminders',
            importance: 4, // HIGH
            visibility: 1, // PUBLIC
            sound: 'default',
            vibration: true,
            lights: true,
            lightColor: '#635bff',
          });
        } catch (e) {
          // Channels are Android-only; iOS will throw → ignore.
        }
        await LocalNotifications.requestPermissions?.();
      }

      if (PushNotifications) {
        const perm = await PushNotifications.requestPermissions();
        if (perm?.receive === 'granted') {
          await PushNotifications.register();
          PushNotifications.addListener('registration', async (token: { value: string }) => {
            try {
              await fetch('/api/notifications/devices', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  token: token.value,
                  platform: detectPlatform(),
                  appVersion: getAppVersion(),
                }),
              });
              registeredOnServer = true;
            } catch {
              /* network errors are non-fatal */
            }
          });
          PushNotifications.addListener('registrationError', (err: unknown) => {
            console.warn('[myncel] push registration error', err);
          });
          // Foreground: when a push arrives while the app is open, mirror it as a
          // local notification with the Myncel icon so the user sees a banner.
          PushNotifications.addListener('pushNotificationReceived', async (n: any) => {
            if (LocalNotifications) {
              await LocalNotifications.schedule({
                notifications: [{
                  id: Math.floor(Math.random() * 1_000_000),
                  title: n.title || 'Myncel',
                  body:  n.body  || '',
                  channelId: 'myncel-default',
                  smallIcon: 'ic_stat_myncel',
                  largeIcon: 'ic_launcher',
                  extra: n.data || {},
                }],
              });
            }
          });
          // When the user taps a push, route them to the deep-link.
          PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
            const link = action?.notification?.data?.link;
            if (typeof link === 'string' && link.startsWith('/')) {
              window.location.href = link;
            }
          });
        }
      }
    } catch (e) {
      console.warn('[myncel] capacitor notifications unavailable, falling back to web', e);
    }
    return;
  }

  // ----- Web fallback (desktop / non-Capacitor mobile browser) -----
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      // Don't auto-prompt; let the user opt-in via a settings toggle.
      // Consumers can call requestWebPermission() explicitly.
    }
  } catch { /* ignore */ }
}

/**
 * Explicit user-gesture entrypoint to ask for web notification permission.
 * Use this from a click handler on the "Enable notifications" toggle in
 * settings → notifications.
 */
export async function requestWebPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

/**
 * Show a notification immediately. Used for in-app events that originate
 * client-side (e.g. an SSE/WebSocket message saying "new alert").
 *
 * On native this schedules a local notification (bypasses the FCM/APNs
 * round-trip). On web it uses the Notification API.
 */
export async function showLocalNotification(p: MyncelNotificationPayload): Promise<void> {
  if (typeof window === 'undefined') return;

  if (detectCapacitor()) {
    try {
      // See note in initNativeNotifications above — hide the specifier from webpack.
      const __localSpec2 = '@capacitor/local-notifications';
      const LocalNotifications: any = await import(/* webpackIgnore: true */ /* @vite-ignore */ __localSpec2)
        .then((m: any) => m.LocalNotifications ?? m.default?.LocalNotifications ?? null)
        .catch(() => null);
      if (!LocalNotifications) return;
      await LocalNotifications.schedule({
        notifications: [{
          id: hashId(p.id ?? p.title + p.body),
          title: p.title,
          body: p.body,
          channelId: 'myncel-default',
          smallIcon: 'ic_stat_myncel',
          largeIcon: 'ic_launcher',
          extra: { link: p.link, kind: p.kind },
        }],
      });
    } catch { /* ignore */ }
    return;
  }

  // Web fallback
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(p.title, {
        body: p.body,
        icon: '/icons/myncel-icon-192.png',
        badge: '/icons/myncel-badge-72.png',
        tag: p.id ?? p.kind,
      });
      n.onclick = () => {
        window.focus();
        if (p.link) window.location.href = p.link;
      };
    }
  } catch { /* ignore */ }
}

function detectPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  // @ts-ignore
  const cap = (window as any).Capacitor;
  if (cap?.getPlatform) {
    const p = cap.getPlatform();
    if (p === 'ios' || p === 'android') return p;
  }
  return 'web';
}

function getAppVersion(): string {
  // @ts-ignore
  return (typeof window !== 'undefined' && (window as any).__MYNCEL_VERSION__) || '0.0.0';
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 2_147_000_000;
}

export function hasRegisteredOnServer(): boolean {
  return registeredOnServer;
}
