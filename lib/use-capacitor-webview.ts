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

/* ------------------------------------------------------------------ */
/* Platform detection                                                  */
/*                                                                     */
/* Apple App Review rejected build 1.0(12) under Guideline 2.3.10      */
/* (Accurate Metadata) for showing Android references inside the iOS  */
/* app. We need to know which native platform the Capacitor shell is  */
/* running on so we can hide cross-platform copy on the iOS-only       */
/* surfaces.                                                           */
/* ------------------------------------------------------------------ */

export type CapacitorPlatform = 'ios' | 'android' | 'web';

/**
 * Detects which native platform the Capacitor shell is running on.
 *
 *  - 'ios'     => iPhone / iPad Capacitor app
 *  - 'android' => Android Capacitor app
 *  - 'web'     => regular browser (also returned during SSR)
 *
 * Detection order:
 *   1. window.Capacitor.getPlatform() — official API, returns
 *      'ios' / 'android' / 'web' directly.
 *   2. User-agent fallback — Capacitor appends `MyncelApp/<v>` plus
 *      the underlying OS strings ("iPhone", "iPad", "Android"). Used
 *      for the brief moment before the bridge initializes.
 *   3. Defaults to 'web' on SSR or when neither signal is present.
 */
function detectCapacitorPlatform(): CapacitorPlatform {
  if (typeof window === 'undefined') return 'web';

  const cap = (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
  if (cap && typeof cap.getPlatform === 'function') {
    const p = cap.getPlatform();
    if (p === 'ios' || p === 'android') return p;
  }

  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent;
    // Only trust UA if the MyncelApp marker is present — otherwise we'd
    // false-positive every iPhone Safari user as "iOS app".
    if (/MyncelApp/i.test(ua)) {
      if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
      if (/Android/i.test(ua)) return 'android';
    }

    // Query-string testing flag: ?myncel-app=ios or =android
    if (typeof window !== 'undefined' && window.location?.search) {
      if (/[?&]myncel-app=ios\b/.test(window.location.search)) return 'ios';
      if (/[?&]myncel-app=android\b/.test(window.location.search)) return 'android';
    }
  }

  return 'web';
}

/**
 * React hook returning the current Capacitor platform.
 *
 * Like `useIsCapacitorWebview`, this is SSR-safe (returns 'web' during
 * SSR, then re-runs on the client and re-renders with the detected
 * platform).
 *
 * Use `useIsIOSApp()` / `useIsAndroidApp()` for the most common cases.
 */
export function useCapacitorPlatform(): CapacitorPlatform {
  const [platform, setPlatform] = useState<CapacitorPlatform>('web');

  useEffect(() => {
    setPlatform(detectCapacitorPlatform());
    const timer = setTimeout(() => {
      setPlatform(detectCapacitorPlatform());
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return platform;
}

/**
 * Convenience hook: true only when running inside the iOS Capacitor
 * shell (com.myncel.app on iPhone/iPad). Use this to hide Android
 * references on user-facing pages — Apple requires this under
 * Guideline 2.3.10.
 */
export function useIsIOSApp(): boolean {
  return useCapacitorPlatform() === 'ios';
}

/**
 * Convenience hook: true only when running inside the Android
 * Capacitor shell.
 */
export function useIsAndroidApp(): boolean {
  return useCapacitorPlatform() === 'android';
}
