'use client';

import { useEffect, useState } from 'react';

/**
 * MobileSplashOverlay
 *
 * A guaranteed-visible 2-second branded splash rendered inside the
 * Capacitor WebView. Used INSTEAD OF the native @capacitor/splash-screen
 * plugin because the native plugin's behaviour is inconsistent across
 * vendor skins (Samsung One UI overrides the launch theme; Sony does
 * not; etc.).
 *
 * Implementation notes:
 *   - Detection runs on the CLIENT only (no SSR mismatch). The overlay
 *     is initially hidden and only shown after we confirm we're in the
 *     Capacitor WebView. This way the splash never accidentally
 *     appears on the public website.
 *   - Dismissal is on a HARD TIMER (1.8s) — no readystatechange logic,
 *     no event listeners that could fail to fire. If the WebView is
 *     alive enough to render this component, it's alive enough to
 *     dismiss it 1.8s later.
 *   - We use a CSS class fade-out so the dismiss is smooth.
 *   - The splash is rendered ABOVE the page (z-index: 2147483647) so
 *     it's never possible for the page underneath to "leak" through.
 */

const SHOW_MS = 1800;
const FADE_MS = 350;

function detectCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
    return true;
  }
  if (typeof navigator !== 'undefined' && /MyncelApp\//i.test(navigator.userAgent || '')) {
    return true;
  }
  return false;
}

type Phase = 'hidden' | 'visible' | 'fading';

export default function MobileSplashOverlay() {
  const [phase, setPhase] = useState<Phase>('hidden');

  useEffect(() => {
    // Only run client-side. Detect once after mount.
    if (!detectCapacitor()) {
      setPhase('hidden');
      return;
    }
    setPhase('visible');

    const fadeTimer = window.setTimeout(() => {
      setPhase('fading');
    }, SHOW_MS);

    const hideTimer = window.setTimeout(() => {
      setPhase('hidden');
    }, SHOW_MS + FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'fading' ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #635bff 0%, #4c44d6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(99,91,255,0.25)',
          marginBottom: 20,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="52"
          height="52"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#0f172a',
          letterSpacing: '-0.02em',
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        Myncel
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          color: '#64748b',
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        Smart maintenance management
      </div>
    </div>
  );
}
