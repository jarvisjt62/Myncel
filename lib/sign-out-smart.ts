'use client';

import { signOut as nextAuthSignOut } from 'next-auth/react';
import { isCapacitorWebviewSync } from '@/lib/use-capacitor-webview';

/**
 * signOutSmart
 *
 * Wrapper around next-auth's signOut() that picks the right post-logout
 * destination based on whether we're inside the Myncel Capacitor mobile
 * app or a regular browser:
 *
 *   - Mobile app (Capacitor)  → /signin
 *   - Web browser (default)   → /
 *
 * Why: the Capacitor shell is the actual product, not a marketing
 * surface. Sending mobile users to the marketing landing page on
 * sign-out is jarring and a frequent App Store / Play Store reviewer
 * complaint ("looks like a website wrapper, not an app").
 *
 * This is the synchronous detection variant — it reads the Capacitor
 * bridge directly so it works correctly the moment a button is
 * clicked (no React hook required).
 */
export function signOutSmart(opts: { callbackUrl?: string } = {}): Promise<unknown> {
  const fallback = opts.callbackUrl ?? '/';
  const target = isCapacitorWebviewSync() ? '/signin' : fallback;
  return nextAuthSignOut({ callbackUrl: target });
}
