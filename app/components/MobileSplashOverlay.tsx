'use client';

import { useEffect, useState } from 'react';
import { useIsCapacitorWebview } from '@/lib/use-capacitor-webview';

/**
 * MobileSplashOverlay
 *
 * Renders a full-screen branded splash inside the Capacitor WebView for
 * a guaranteed 2 seconds on every cold load. This is much more reliable
 * than the native @capacitor/splash-screen plugin, which behaves
 * inconsistently across vendor skins (e.g. Samsung One UI strips the
 * launch theme and replaces it with its own icon-zoom; Sony preserves
 * it, etc.).
 *
 * We render this only when the page is loaded inside the Capacitor
 * shell (detected via window.Capacitor.isNativePlatform() OR the
 * "MyncelApp/" UA token). On the public website it's a no-op.
 *
 * Once the splash duration elapses AND the document is interactive,
 * we fade out and unmount.
 */

const MIN_VISIBLE_MS = 2000;

export default function MobileSplashOverlay() {
  const isMobileApp = useIsCapacitorWebview();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!isMobileApp) {
      setVisible(false);
      return;
    }
    const startedAt = Date.now();
    let cancelled = false;

    const dismiss = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        setFading(true);
        window.setTimeout(() => {
          if (!cancelled) setVisible(false);
        }, 350); // matches the CSS transition
      }, remaining);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      dismiss();
    } else {
      const onReady = () => dismiss();
      document.addEventListener('readystatechange', onReady, { once: true });
      window.addEventListener('load', onReady, { once: true });
    }

    // Hard upper bound so a stuck page never traps the user behind the splash
    const safety = window.setTimeout(() => {
      if (cancelled) return;
      setFading(true);
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, 350);
    }, 6000);

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
    };
  }, [isMobileApp]);

  if (!isMobileApp || !visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647, // sit above absolutely everything
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 350ms ease-out',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Shield logo */}
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

      {/* Wordmark */}
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

      {/* Tagline */}
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
