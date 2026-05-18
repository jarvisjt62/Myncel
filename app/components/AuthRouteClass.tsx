'use client';

import { useEffect } from 'react';

/**
 * Adds `auth-route` class to <html> and <body> when the user is on an
 * auth page (signin / signup / forgot-password / verify-email).
 *
 * This serves as a fallback for older WebView engines that don't yet
 * support the CSS `:has()` selector (Android Chromium < 105). Modern
 * WebViews use `body:has(.auth-mobile-shell)` directly; older ones get
 * the styling via this class instead.
 *
 * The class is removed on unmount so non-auth pages aren't affected.
 */
export default function AuthRouteClass() {
  useEffect(() => {
    document.documentElement.classList.add('auth-route');
    document.body.classList.add('auth-route');
    return () => {
      document.documentElement.classList.remove('auth-route');
      document.body.classList.remove('auth-route');
    };
  }, []);

  return null;
}
