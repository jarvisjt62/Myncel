import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import HomePageClient from './HomePageClient';
import { isMobileAppRequest } from '@/lib/is-mobile-app-server';

// Force dynamic so the session check runs on every request
// (Next.js would otherwise statically render this page).
export const dynamic = 'force-dynamic';

/**
 * Root landing page.
 *
 * Routing rules:
 *   - Signed-in super admin (admin@myncel.com)  → /admin
 *   - Signed-in user with an organization        → /dashboard
 *   - Signed-in user without an organization     → /onboarding
 *   - Anonymous visitor in the Capacitor mobile  → /signin
 *     app (User-Agent contains "MyncelApp/")
 *   - Anonymous visitor in a desktop browser     → marketing landing page
 *
 * Why mobile gets a different anonymous route: the Capacitor
 * Android/iOS shell is the actual product, not a marketing surface.
 * Showing public marketing copy on app launch is confusing and is
 * also a frequent App Store / Play Store reviewer complaint
 * ("looks like a website wrapper, not an app").
 */
export default async function Home() {
  const session = await getServerSession(authOptions).catch(() => null);

  if (session?.user) {
    // Super admin → admin dashboard
    if (session.user.email === 'admin@myncel.com') {
      redirect('/admin');
    }
    // Regular signed-in user → user dashboard
    if (session.user.organizationId) {
      redirect('/dashboard');
    }
    // Signed in but no org yet → onboarding
    redirect('/onboarding');
  }

  // Anonymous + inside the Capacitor mobile app → straight to sign-in.
  // We detect this server-side via the User-Agent token appended by
  // capacitor.config.json (`appendUserAgent: "MyncelApp/1.0"`). If the
  // shell is rebuilt without that token we fall through and the user
  // simply sees the public landing page — safe default.
  const userAgent = (await headers()).get('user-agent');
  if (isMobileAppRequest(userAgent)) {
    redirect('/signin');
  }

  // Anonymous web visitor → marketing landing page.
  return <HomePageClient />;
}
