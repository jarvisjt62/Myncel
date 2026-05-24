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
 *   - Uses the real Myncel logo from /logo.png so the splash matches
 *     the rest of the brand instead of a generic shield icon.
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
      {/* Real Myncel logo */}
      <img
        src="/logo.png"
        alt="Myncel"
        style={{
          width: 96,
          height: 96,
          objectFit: 'contain',
          marginBottom: 20,
          // subtle drop shadow for visual weight on white background
          filter: 'drop-shadow(0 8px 24px rgba(99,91,255,0.15))',
        }}
      />
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
