import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HomePageClient from './HomePageClient';

// Force dynamic so the session check runs on every request
// (Next.js would otherwise statically render this page).
export const dynamic = 'force-dynamic';

/**
 * Root landing page.
 *
 * IMPORTANT: If the user is already signed in (session cookie present),
 * we redirect them straight to /dashboard. This is critical for the
 * mobile app (Android & iOS Capacitor shells) — when the user reopens
 * the app, the WebView reloads `https://www.myncel.com/` from scratch,
 * but their auth cookie persists. Without this redirect, the user sees
 * the marketing landing page even though they're already signed in.
 *
 * Super admins are routed to /admin.
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

  // Anonymous visitor → render the marketing landing page
  return <HomePageClient />;
}
