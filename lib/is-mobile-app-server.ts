/**
 * isMobileAppRequest
 *
 * Server-side detection of the Myncel Capacitor mobile app.
 *
 * The Capacitor shell is configured (in capacitor.config.json) with
 * `appendUserAgent: "MyncelApp/1.0"`, which appends that token to the
 * webview's User-Agent string for both Android and iOS builds.
 *
 * Use this in Server Components / route handlers to redirect mobile
 * app users differently from desktop visitors. For example:
 *
 *   const ua = (await headers()).get('user-agent') ?? '';
 *   if (isMobileAppRequest(ua)) redirect('/signin');
 *
 * Returns false on missing/empty UA so we never accidentally redirect
 * desktop browsers that happen to be misbehaving.
 */
export function isMobileAppRequest(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return /MyncelApp\//i.test(userAgent);
}
