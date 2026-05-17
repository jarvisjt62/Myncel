'use client';

import { useEffect } from 'react';

/**
 * CapacitorSplashHide
 *
 * Mounted once globally (inside <Providers>). When running inside the
 * Capacitor WebView shell, this component explicitly hides the native
 * splash screen after a minimum visible duration AND once the page is
 * ready.
 *
 * IMPORTANT — we use the Capacitor bridge global (window.Capacitor.Plugins.SplashScreen)
 * NOT a dynamic import of '@capacitor/splash-screen'. Reasons:
 *   1. The Next.js bundle served from https://www.myncel.com cannot resolve
 *      '@capacitor/splash-screen' at runtime (the package only exists in the
 *      Capacitor shell's node_modules, not in the deployed web bundle).
 *   2. Capacitor injects window.Capacitor.Plugins.<PluginName> at runtime
 *      whenever a plugin is registered in the native shell. So as long as
 *      @capacitor/splash-screen is in the shell's package.json (it is) and
 *      synced, window.Capacitor.Plugins.SplashScreen.hide() works directly
 *      with no module resolution needed.
 *
 * Tunables:
 *   MIN_VISIBLE_MS — minimum time the splash must remain on screen
 *   MAX_VISIBLE_MS — hard upper bound safety net
 */

const MIN_VISIBLE_MS = 2500;
const MAX_VISIBLE_MS = 7000;

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        SplashScreen?: {
          hide: (opts?: { fadeOutDuration?: number }) => Promise<void>;
          show?: (opts?: any) => Promise<void>;
        };
      };
    };
  }
}

function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = window.Capacitor;
  return !!cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform();
}

function getSplashScreenPlugin() {
  if (typeof window === 'undefined') return null;
  return window.Capacitor?.Plugins?.SplashScreen ?? null;
}

export default function CapacitorSplashHide() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startedAt = Date.now();
    let hidden = false;

    // Log capacitor state immediately so we can see in chrome://inspect
    // exactly what's happening even if the bridge isn't ready yet.
    console.log('[myncel-splash] mount. window.Capacitor=', !!window.Capacitor,
      'isNative=', !!window.Capacitor?.isNativePlatform?.(),
      'plugin=', !!getSplashScreenPlugin());

    if (!isCapacitorNative()) {
      console.log('[myncel-splash] not running in Capacitor — skipping splash hide');
      return;
    }

    // Mark <body> so global CSS can apply safe-area padding. This makes
    // the top header / bottom nav respect Samsung / iOS system bars.
    try {
      document.body.classList.add('capacitor-app');
    } catch {}

    const hide = async (reason: string) => {
      if (hidden) return;
      hidden = true;
      const plugin = getSplashScreenPlugin();
      if (!plugin) {
        console.warn(`[myncel-splash] hide(${reason}): SplashScreen plugin not on window.Capacitor.Plugins — skipping`);
        return;
      }
      try {
        await plugin.hide({ fadeOutDuration: 400 });
        console.log(`[myncel-splash] ✅ hidden (reason=${reason}, t=${Date.now() - startedAt}ms)`);
      } catch (e) {
        console.warn('[myncel-splash] hide() threw', e);
      }
    };

    // Schedule the hide once the minimum visible duration has elapsed AND
    // the page is ready. Plus a hard timeout safety net.
    const minTimer = window.setTimeout(() => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        void hide('ready+min');
      } else {
        const onReady = () => void hide('readystatechange');
        document.addEventListener('readystatechange', onReady, { once: true });
        // Also try again on load
        window.addEventListener('load', () => void hide('window.load'), { once: true });
      }
    }, MIN_VISIBLE_MS);

    const maxTimer = window.setTimeout(() => void hide('max-timeout'), MAX_VISIBLE_MS);

    // Belt-and-suspenders: also try to hide on any visibility change
    // (some Android variants delay readyState).
    const onVis = () => {
      if (document.visibilityState === 'visible' && Date.now() - startedAt >= MIN_VISIBLE_MS) {
        void hide('visibility');
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return null;
}
