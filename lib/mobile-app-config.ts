/**
 * Mobile app store configuration — feature-flagged.
 *
 * The iOS and Android badges only render when their respective env var
 * is set to 'true'. This lets us deploy the UI before the apps are
 * approved, then flip the switch in Vercel the moment Apple emails
 * "Ready for Sale" / Google promotes the build to Production track —
 * no code deploy required.
 *
 * Env vars to set in Vercel (Production scope) on approval day:
 *   NEXT_PUBLIC_IOS_APP_LIVE=true
 *   NEXT_PUBLIC_IOS_APP_ID=<numeric Apple ID, e.g. 6471234567>
 *   NEXT_PUBLIC_ANDROID_APP_LIVE=true
 *
 * Defaults: both flags are 'false' (badges hidden) so production stays
 * clean until you intentionally flip them.
 */

const IOS_APP_LIVE = process.env.NEXT_PUBLIC_IOS_APP_LIVE === 'true';
const ANDROID_APP_LIVE = process.env.NEXT_PUBLIC_ANDROID_APP_LIVE === 'true';

// Once Apple emails "Ready for Sale", grab the App ID from App Store
// Connect → My Apps → Myncel → App Information → "Apple ID" field, and
// either set NEXT_PUBLIC_IOS_APP_ID in Vercel OR replace the fallback
// here.
const IOS_APP_ID = process.env.NEXT_PUBLIC_IOS_APP_ID || '0000000000';

// Android package is fixed in myncel-mobile/app.json.
const ANDROID_PACKAGE = 'com.jarvisitconsults.myncel';

export const MOBILE_APP_LINKS = {
  ios: {
    enabled: IOS_APP_LIVE,
    url: `https://apps.apple.com/app/myncel/id${IOS_APP_ID}`,
    label: 'Download on the App Store',
  },
  android: {
    enabled: ANDROID_APP_LIVE,
    url: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
    label: 'Get it on Google Play',
  },
} as const;

export function anyMobileAppLive(): boolean {
  return MOBILE_APP_LINKS.ios.enabled || MOBILE_APP_LINKS.android.enabled;
}
