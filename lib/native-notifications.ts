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
 * IMPORTANT — accessing Capacitor plugins:
 *   We use the Capacitor bridge global `window.Capacitor.Plugins.<Name>`
 *   instead of `import('@capacitor/push-notifications')`. The npm packages
 *   are NOT present in the deployed Next.js bundle (they only exist in the
 *   Capacitor shell's node_modules). The Capacitor native bridge injects
 *   `window.Capacitor.Plugins.<PluginName>` at runtime for every plugin
 *   registered in the shell, so we read those globals directly.
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

function getCapPlugin(name: string): any {
  if (typeof window === 'undefined') return null;
  // @ts-ignore
  return (window as any).Capacitor?.Plugins?.[name] ?? null;
}

/**
 * Initialize notifications. Call once after the user is authenticated
 * (e.g. in a top-level client component once `session.status === 'authenticated'`).
 */
export async function initNativeNotifications(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (nativeReady) return;
  nativeReady = true;

  const inCap = detectCapacitor();
  console.log('[myncel-push] initNativeNotifications start. capacitor=' + inCap + ', platform=' + detectPlatform());

  if (inCap) {
    try {
      // Read plugins from the Capacitor bridge global. These are injected by
      // the native shell when the plugins are registered (i.e. installed in
      // the shell's package.json + `npx cap sync` ran).
      const PushNotifications: any = getCapPlugin('PushNotifications');
      const LocalNotifications: any = getCapPlugin('LocalNotifications');

      console.log('[myncel-push] plugins on bridge: PushNotifications=' + !!PushNotifications +
        ', LocalNotifications=' + !!LocalNotifications);

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
        console.log('[myncel-push] PushNotifications plugin loaded, requesting permission…');
        const perm = await PushNotifications.requestPermissions();
        console.log('[myncel-push] permission result:', perm);
        if (perm?.receive === 'granted') {
          console.log('[myncel-push] permission granted, calling register()…');

          // Wire listeners BEFORE register() so we don't miss the registration event.
          PushNotifications.addListener('registration', async (token: { value: string }) => {
            console.log('[myncel-push] ✅ FCM token received (len=' + (token?.value?.length ?? 0) + '), POSTing to /api/notifications/devices…');
            try {
              const resp = await fetch('/api/notifications/devices', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  token: token.value,
                  platform: detectPlatform(),
                  appVersion: getAppVersion(),
                }),
              });
              const j = await resp.json().catch(() => ({}));
              console.log('[myncel-push] device-register response:', resp.status, j);
              registeredOnServer = resp.ok;
            } catch (e) {
              console.warn('[myncel-push] device-register network error:', e);
            }
          });
          PushNotifications.addListener('registrationError', (err: unknown) => {
            console.warn('[myncel-push] ❌ registrationError', err);
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

          await PushNotifications.register();
          console.log('[myncel-push] register() returned, waiting for "registration" event…');
        } else {
          console.warn('[myncel-push] permission NOT granted, skipping register()');
        }
      } else {
        console.warn('[myncel-push] PushNotifications plugin not on window.Capacitor.Plugins. ' +
          'Verify @capacitor/push-notifications is installed in the shell and `npx cap sync` was run.');
      }
    } catch (e) {
      console.warn('[myncel-push] capacitor notifications init failed', e);
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
      const LocalNotifications: any = getCapPlugin('LocalNotifications');
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
