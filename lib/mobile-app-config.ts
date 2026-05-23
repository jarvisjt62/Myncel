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

// Android package — fixed in myncel-webview/capacitor.config (the
// production Capacitor shell that's actually published to Google Play).
//
// History: the original Expo project at Myncel/myncel-mobile/ used
// `com.jarvisitconsults.myncel`, but that project was never submitted
// to a store. The live published app on Google Play is the Capacitor
// shell at C:\Users\kelly\Myncel_Project\myncel-webview with appId
// `com.myncel.app`. Always use the published id here so the Google
// Play badge deep-links to the correct listing.
const ANDROID_PACKAGE = 'com.myncel.app';

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
