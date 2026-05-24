import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import MobilePageBody from './MobilePageBody';

export const metadata = {
  title: 'Mobile Maintenance App — Native iOS & Android + Mobile Web',
  description: 'Get the Myncel mobile app on iOS and Android, or use it directly in any mobile browser. Work orders, photos, QR scanning, and offline support — your shop floor in your pocket.',
  alternates: { canonical: 'https://www.myncel.com/products/mobile' },
};

/**
 * Server component shell — keeps the page-level <Navbar />, <Footer />,
 * and SEO metadata identical to before, but delegates the body to a
 * client component so we can swap platform-specific copy at runtime.
 *
 * Why: Apple App Review (Guideline 2.3.10) requires that no Android
 * references appear inside the iOS binary. The Capacitor iOS shell
 * loads this very page, so the body has to detect platform and render
 * iOS-only copy when `Capacitor.getPlatform() === 'ios'`.
 *
 * The metadata block above is for SEO crawlers and Open Graph shares,
 * NOT user-visible inside the app, so it can keep mentioning both
 * platforms. (Apple's rejection was specifically about content the
 * user sees, not <head> meta tags.)
 */
export default function Mobile() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <MobilePageBody />
      <Footer />
    </div>
  );
}
