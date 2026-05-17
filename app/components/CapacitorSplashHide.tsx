'use client';

import { useEffect } from 'react';

/**
 * CapacitorSplashHide
 *
 * Mounted once globally (inside <Providers>). When running inside the
 * Capacitor WebView shell, this component dynamically imports
 * @capacitor/splash-screen and explicitly calls SplashScreen.hide() after
 * a short delay.
 *
 * We set `launchAutoHide: false` in capacitor.config.json so the native
 * splash stays visible until we tell it to go away. This way:
 *   - The user always sees the full-frame Myncel splash PNG (with logo)
 *     for at least 2 seconds — not a half-second flash
 *   - The fade-out happens after the page has hydrated, so there is no
 *     gap between splash hiding and the dashboard appearing
 *
 * Safe on the desktop web build — the dynamic import fails silently when
 * the @capacitor/splash-screen package isn't present (and on non-Capacitor
 * environments `window.Capacitor` is undefined, so we no-op).
 *
 * Tunables:
 *   MIN_VISIBLE_MS — minimum time the splash must remain on screen,
 *     measured from the moment this component mounts. Even on a
 *     blazing-fast connection where the page is interactive in 200ms,
 *     the splash will stay up for this long.
 *
 *   MAX_VISIBLE_MS — hard upper bound. If for any reason the page is
 *     unusually slow we still hide the splash so the user is never
 *     stuck looking at it.
 */

const MIN_VISIBLE_MS = 2000;
const MAX_VISIBLE_MS = 6000;

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  // @ts-ignore
  const cap = (window as any).Capacitor;
  return !!cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform();
}

export default function CapacitorSplashHide() {
  useEffect(() => {
    if (!isCapacitorNative()) return;

    const startedAt = Date.now();
    let hidden = false;

    const hide = async (reason: string) => {
      if (hidden) return;
      hidden = true;
      try {
        // Hide the @capacitor/splash-screen package's splash at runtime.
        // We use the same webpackIgnore pattern as native-notifications.ts so
        // the desktop web build doesn't try to bundle this package.
        const __spec = '@capacitor/splash-screen';
        const mod: any = await import(/* webpackIgnore: true */ /* @vite-ignore */ __spec)
          .catch(() => null);
        const SplashScreen: any = mod?.SplashScreen ?? mod?.default?.SplashScreen ?? null;
        if (!SplashScreen) {
          console.log('[myncel-splash] plugin not found, splash will time out on its own');
          return;
        }
        await SplashScreen.hide({ fadeOutDuration: 400 }).catch(() => {});
        console.log(`[myncel-splash] hidden (reason=${reason}, t=${Date.now() - startedAt}ms)`);
      } catch (e) {
        console.warn('[myncel-splash] hide() failed', e);
      }
    };

    // Schedule the hide once the minimum visible duration has elapsed AND
    // the page is ready to be shown (or the max timeout fires first).
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const minTimer = window.setTimeout(() => {
      // After the minimum splash duration, hide once the document is
      // interactive/complete. If it already is, hide immediately.
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        void hide('ready+min');
      } else {
        const onReady = () => void hide('readystatechange');
        document.addEventListener('readystatechange', onReady, { once: true });
      }
    }, remaining);

    // Safety net: hide no matter what after MAX_VISIBLE_MS
    const maxTimer = window.setTimeout(() => void hide('max-timeout'), MAX_VISIBLE_MS);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
    };
  }, []);

  return null;
}
