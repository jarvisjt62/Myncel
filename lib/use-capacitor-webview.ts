/**
 * useIsCapacitorWebview
 *
 * Detects whether the current page is being rendered inside the Myncel
 * Capacitor mobile app (the `com.myncel.app` shell that loads the live
 * Next.js site inside a native WebView).
 *
 * Used to hide pricing on public marketing pages when viewed inside the
 * mobile app, to comply with Google Play's "Subscriptions: currency
 * differences with prominent display price" policy. Reviewers from any
 * country must not see a USD price hardcoded into the app.
 *
 * Detection strategy (most reliable first):
 *   1. window.Capacitor.isNativePlatform() — the official Capacitor API,
 *      injected by the native bridge. Always true in the app, always
 *      false in a normal browser.
 *   2. User-Agent fallback — if `?myncel-app=1` was appended OR the UA
 *      contains "MyncelApp" (we set this via Capacitor's
 *      appendUserAgent in capacitor.config). Used for the brief moment
 *      before the Capacitor bridge initializes.
 *   3. SSR — always returns false. The component re-renders on the
 *      client once the bridge is detected.
 *
 * NEVER trust this for security; it is a UX/compliance signal only. A
 * sophisticated user can spoof either the global or the UA.
 */

import { useEffect, useState } from 'react';

// We do NOT redeclare `window.Capacitor` here — that augmentation
// already lives in `app/components/CapacitorSplashHide.tsx` and any
// duplicate declaration with even slightly different shape causes
// TS2717 "Subsequent property declarations must have the same type".
// Instead we read it via a local cast at the call site.
type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function detectCapacitorWebview(): boolean {
  if (typeof window === 'undefined') return false;

  // Primary: official Capacitor API
  const cap = (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
    return true;
  }

  // Fallback: user-agent string. We append "MyncelApp/<version>" via
  // Capacitor's `appendUserAgent` config so the webview is recognizable
  // even before the bridge has fully initialized.
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    if (/MyncelApp/i.test(navigator.userAgent)) return true;
  }

  // Fallback: explicit query flag (for testing on desktop)
  if (typeof window !== 'undefined' && window.location?.search) {
    if (/[?&]myncel-app=1/.test(window.location.search)) return true;
  }

  return false;
}

export function useIsCapacitorWebview(): boolean {
  // Default to `false` so SSR matches the desktop experience. The hook
  // re-runs on the client and flips to `true` if the bridge is present.
  const [isWebview, setIsWebview] = useState(false);

  useEffect(() => {
    setIsWebview(detectCapacitorWebview());

    // Capacitor's bridge can be injected slightly after the React tree
    // mounts on slower devices. Re-check once on the next tick.
    const timer = setTimeout(() => {
      setIsWebview(detectCapacitorWebview());
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  return isWebview;
}

/**
 * Synchronous variant for places that can't use a hook (rare).
 * Always returns `false` during SSR.
 */
export function isCapacitorWebviewSync(): boolean {
  return detectCapacitorWebview();
}
