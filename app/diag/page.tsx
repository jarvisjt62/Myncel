'use client';

import { useEffect, useState } from 'react';

/**
 * Diagnostics page for the Capacitor mobile app.
 *
 * When the user reports a mobile-app bug, asking them to send ONE screenshot
 * of /diag tells us:
 *   - Which platform (iOS / Android / web / Capacitor preview)
 *   - The exact safe-area insets the device reports
 *   - The viewport / window dimensions in landscape vs portrait
 *   - Whether the Capacitor bridge is loaded and what plugins are available
 *   - Network online/offline state
 *   - User agent (full string)
 *   - Screen orientation
 *
 * This eliminates 90% of "guess what the device is doing" bug-fix cycles.
 *
 * Linked from the Profile screen footer with a small "Diagnostics" link.
 */
export default function DiagnosticsPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const collect = () => {
      const cap: any = (typeof window !== 'undefined' && (window as any).Capacitor) || null;
      const html = typeof document !== 'undefined' ? document.documentElement : null;
      const body = typeof document !== 'undefined' ? document.body : null;
      const cs = html ? getComputedStyle(html) : null;

      const readVar = (name: string) => (cs ? cs.getPropertyValue(name).trim() : '');
      const readEnv = (name: string) => {
        if (!html) return '';
        // Use a probe element to read env() values precisely.
        const probe = document.createElement('div');
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.padding = `env(${name}, 0px)`;
        document.body.appendChild(probe);
        const px = getComputedStyle(probe).paddingTop;
        document.body.removeChild(probe);
        return px;
      };

      const out: Record<string, any> = {
        '── Platform ──': '',
        userAgent: navigator.userAgent,
        platform: cap?.getPlatform ? cap.getPlatform() : 'web',
        isNativePlatform: !!cap?.isNativePlatform?.(),
        capacitorClassOnHtml: html?.classList.contains('capacitor-app') || false,
        capacitorPreviewMode: html?.classList.contains('capacitor-preview') || false,
        capacitorPlugins: cap?.Plugins ? Object.keys(cap.Plugins) : [],

        '── Viewport ──': '',
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
        documentClientWidth: document.documentElement.clientWidth,
        documentClientHeight: document.documentElement.clientHeight,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        orientation: window.screen?.orientation?.type || 'unknown',
        orientationAngle: typeof window.orientation !== 'undefined' ? window.orientation : 'n/a',

        '── Safe-area insets (env) ──': '',
        env_safe_area_inset_top: readEnv('safe-area-inset-top'),
        env_safe_area_inset_bottom: readEnv('safe-area-inset-bottom'),
        env_safe_area_inset_left: readEnv('safe-area-inset-left'),
        env_safe_area_inset_right: readEnv('safe-area-inset-right'),

        '── CSS variables (resolved) ──': '',
        var_safe_area_top: readVar('--safe-area-top'),
        var_safe_area_bottom: readVar('--safe-area-bottom'),
        var_safe_area_left: readVar('--safe-area-left'),
        var_safe_area_right: readVar('--safe-area-right'),
        var_capacitor_status_bar_height: readVar('--capacitor-status-bar-height'),

        '── Network ──': '',
        online: navigator.onLine,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',

        '── Display ──': '',
        displayModeStandalone: window.matchMedia?.('(display-mode: standalone)').matches || false,
        displayModeFullscreen: window.matchMedia?.('(display-mode: fullscreen)').matches || false,
        prefersDarkScheme: window.matchMedia?.('(prefers-color-scheme: dark)').matches || false,
        prefersReducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,

        '── Document ──': '',
        bodyClasses: body?.className || '',
        htmlClasses: html?.className || '',
        location: typeof location !== 'undefined' ? location.href : '',
      };

      setData(out);
    };

    collect();
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    const onResize = () => collect();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  // Re-collect on tick so values that change (online, orientation) stay live.
  useEffect(() => {
    if (tick === 0) return;
    const cap: any = (typeof window !== 'undefined' && (window as any).Capacitor) || null;
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        windowInnerWidth: window.innerWidth,
        windowInnerHeight: window.innerHeight,
        online: navigator.onLine,
        orientation: window.screen?.orientation?.type || 'unknown',
        orientationAngle: typeof window.orientation !== 'undefined' ? window.orientation : 'n/a',
      };
    });
  }, [tick]);

  const togglePreviewMode = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('capacitor-preview') === '1' || localStorage.getItem('myncel-capacitor-preview') === '1') {
      localStorage.removeItem('myncel-capacitor-preview');
      url.searchParams.delete('capacitor-preview');
    } else {
      localStorage.setItem('myncel-capacitor-preview', '1');
      url.searchParams.set('capacitor-preview', '1');
    }
    window.location.href = url.toString();
  };

  const copyToClipboard = () => {
    if (!data) return;
    const text = Object.entries(data)
      .map(([k, v]) => (k.startsWith('──') ? `\n${k}` : `  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`))
      .join('\n');
    navigator.clipboard?.writeText(text).then(
      () => alert('Diagnostics copied to clipboard'),
      () => alert('Could not copy — please screenshot instead')
    );
  };

  if (!data) {
    return (
      <main style={{ padding: 16, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        Collecting diagnostics…
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#0a2540',
        background: '#fff',
        minHeight: '100dvh',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>📱 Myncel diagnostics</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        Send a screenshot of this page when reporting a mobile-app bug. Updates live every second.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={copyToClipboard}
          style={{
            padding: '8px 14px',
            background: '#635bff',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Copy as text
        </button>
        <button
          onClick={togglePreviewMode}
          style={{
            padding: '8px 14px',
            background: data.capacitorPreviewMode ? '#dc2626' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {data.capacitorPreviewMode ? 'Exit Capacitor preview' : 'Enable Capacitor preview'}
        </button>
      </div>

      <pre
        style={{
          fontSize: 11,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 12,
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {Object.entries(data)
          .map(([k, v]) => {
            if (k.startsWith('──')) return `\n${k}`;
            const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
            return `  ${k}: ${val}`;
          })
          .join('\n')}
      </pre>

      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16 }}>
        Need to debug app-specific layout from a desktop browser? Append <code>?capacitor-preview=1</code> to any
        Myncel URL or click the green button above. Persists via <code>localStorage</code>.
      </p>
    </main>
  );
}
