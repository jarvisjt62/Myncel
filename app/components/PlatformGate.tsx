'use client';

/**
 * Platform-specific content gates for the Capacitor shells.
 *
 * Apple's Guideline 2.3.10 (Accurate Metadata) requires that an iOS
 * app's binary not include references to other platforms (Android,
 * Google Play). Google Play has a corresponding posture, though it's
 * less aggressively enforced.
 *
 * Because our app is a Capacitor webview that loads the live
 * marketing site, every "Native iOS and Android" mention on a public
 * page is technically inside both binaries. We use these wrappers to
 * hide the wrong-platform copy at runtime:
 *
 *   <HideOnIOSApp>
 *     ...content that mentions Android or links to Google Play...
 *   </HideOnIOSApp>
 *
 *   <HideOnAndroidApp>
 *     ...content that mentions iOS or links to the App Store...
 *   </HideOnAndroidApp>
 *
 *   <ShowOnlyOnPlatform platform="web">
 *     ...content for the public website only (e.g. download badges)...
 *   </ShowOnlyOnPlatform>
 *
 * On a normal desktop browser, all of these are pass-throughs that
 * render their children unchanged.
 *
 * SSR safety: each wrapper defaults to "show" during SSR and on the
 * very first client render, then flips off if the platform check
 * matches. That means a user on the iOS app may see one frame of the
 * mixed-platform content before the Capacitor bridge initializes and
 * the wrapper hides it; for a long-form rejection issue this is
 * acceptable, and reviewers using the published binary will hit the
 * native platform path on first paint.
 */

import {
  useCapacitorPlatform,
  type CapacitorPlatform,
} from '@/lib/use-capacitor-webview';

/**
 * Renders children EXCEPT when running inside the iOS Capacitor shell.
 * Use this around any UI that mentions Android or Google Play.
 */
export function HideOnIOSApp({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const platform = useCapacitorPlatform();
  if (platform === 'ios') return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Renders children EXCEPT when running inside the Android Capacitor
 * shell. Use this around any UI that mentions iOS or the App Store
 * if Google were ever to flag cross-platform copy as well.
 */
export function HideOnAndroidApp({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const platform = useCapacitorPlatform();
  if (platform === 'android') return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Inverse helper: only render the wrapped content on the listed
 * platforms.
 *
 *   <ShowOnlyOnPlatform platform="web">  // public website only
 *   <ShowOnlyOnPlatform platform={['web', 'android']}> // multi-allow
 */
export function ShowOnlyOnPlatform({
  platform,
  children,
  fallback = null,
}: {
  platform: CapacitorPlatform | CapacitorPlatform[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const current = useCapacitorPlatform();
  const allowed = Array.isArray(platform) ? platform : [platform];
  if (!allowed.includes(current)) return <>{fallback}</>;
  return <>{children}</>;
}
