'use client';

/**
 * PriceGateMobile
 *
 * Client-side guard that hides any page containing hardcoded USD prices
 * when the page is rendered inside the Myncel Capacitor mobile app
 * (com.myncel.app). In the mobile app, it renders the
 * MobilePricingFallback (a price-free "manage your plan from a web
 * browser" card) instead of the page's normal contents.
 *
 * Why: Google Play rejected build #2 with "Subscriptions: Currency
 * differences with prominent display price." Rather than touch every
 * marketing page individually, any page that mentions a USD price
 * (e.g. /solutions, /solutions/small, /locations/united-states) can
 * wrap its body in <PriceGateMobile>.
 *
 * On a normal desktop browser this is a no-op pass-through.
 *
 * Usage:
 *   <PriceGateMobile>
 *     <YourPageContents />
 *   </PriceGateMobile>
 */

import { useIsCapacitorWebview } from '@/lib/use-capacitor-webview';
import MobilePricingFallback from './MobilePricingFallback';

export default function PriceGateMobile({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobileApp = useIsCapacitorWebview();
  if (isMobileApp) return <MobilePricingFallback />;
  return <>{children}</>;
}
