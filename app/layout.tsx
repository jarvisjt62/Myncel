import type { Metadata } from 'next';
import './globals.css';
import LiveChat from './components/LiveChat';
import Providers from './components/Providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.myncel.com'),
  title: {
    default: 'Myncel — CMMS Software for Predictive Maintenance & Work Orders',
    template: '%s | Myncel',
  },
  description: 'Myncel is CMMS software for small manufacturers, combining predictive maintenance software, preventive maintenance software, work order management software, equipment maintenance software, alerts, and analytics to reduce downtime.',
  keywords: [
    'CMMS software',
    'predictive maintenance software',
    'preventive maintenance software',
    'work order management software',
    'equipment maintenance software',
    'predictive maintenance',
    'preventive maintenance',
    'CMMS',
    'work order software',
    'maintenance scheduling',
    'equipment tracking',
    'manufacturing software',
    'factory software',
    'downtime reduction',
    'maintenance automation',
  ],
  authors: [{ name: 'Myncel', url: 'https://www.myncel.com' }],
  creator: 'Myncel',
  publisher: 'Myncel',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/logo.png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.myncel.com',
    siteName: 'Myncel',
    title: 'Myncel — AI Predictive Maintenance Software for Small Manufacturers',
    description: 'Stop reactive maintenance. Myncel schedules PM automatically, sends alerts before machines fail, and tracks work orders — all powered by AI for less than one hour of downtime.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Myncel — AI Predictive Maintenance Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Myncel — AI Predictive Maintenance Software',
    description: 'Automated preventive maintenance for manufacturers. Never miss a PM again.',
    images: ['/logo.png'],
    creator: '@myncel',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#635bff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Myncel" />
        {/* ─── EARLY Capacitor / mobile-app detection ──────────────────
             Runs BEFORE React hydrates AND before the first paint.
             When we detect a Capacitor WebView (Samsung S24 Ultra etc.
             where env(safe-area-inset-top) bug-returns 0), we inject the
             CSS variables DIRECTLY into the <html> element's inline
             style. This way every `var(--safe-area-top, 0px)` resolves
             to 32px on the very first paint — no class-selector race.
             On normal browsers, the variables stay undefined and the
             0px fallback applies (no layout shift on desktop).
           ─────────────────────────────────────────────────────────────── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var ua = (navigator.userAgent||'').toLowerCase();
              // Force-enable Capacitor mode via ?capacitor-preview=1 query param
              // so we can debug the mobile-app layout from a desktop browser.
              var force = (location.search||'').indexOf('capacitor-preview=1') > -1
                || localStorage.getItem('myncel-capacitor-preview') === '1';
              var isCap = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
                || ua.indexOf('myncel-app')>-1
                || (ua.indexOf('android')>-1 && ua.indexOf('wv')>-1)
                || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
                || force;
              if(force){ try{localStorage.setItem('myncel-capacitor-preview','1');}catch(e){} }
              if(isCap){
                var html = document.documentElement;
                html.classList.add('capacitor-app');
                if (force) html.classList.add('capacitor-preview');
                // Inject as inline style so var() resolves on first paint
                // BEFORE the CSS bundle even loads. Hard floor 32px top,
                // 16px bottom — overridden later if @capacitor/status-bar
                // plugin reports the real height.
                html.style.setProperty('--safe-area-top', 'max(32px, env(safe-area-inset-top, 0px))');
                html.style.setProperty('--safe-area-bottom', 'max(16px, env(safe-area-inset-bottom, 0px))');
                html.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
                html.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');
                document.addEventListener('DOMContentLoaded', function(){
                  try{document.body.classList.add('capacitor-app');}catch(e){}
                });
                if(document.body){ try{document.body.classList.add('capacitor-app');}catch(e){} }

                /* ─── Capacitor download link interceptor ──────────────
                   iOS WKWebView ignores both window.print() AND <a download>.
                   The reliable fix is to open the URL with window.open(url, '_blank'),
                   which Capacitor's default link policy hands off to Safari /
                   Chrome where downloads work natively.

                   We intercept clicks on any link that:
                     (a) has a [download] attribute (server-served binary), OR
                     (b) starts with /api/ AND has format=pdf

                   IMPORTANT exclusions:
                   - blob:, data:, mailto:, tel:, javascript: schemes — these
                     are programmatic / in-memory URLs that the WebView handles
                     directly and must NEVER be rewritten. CSV export uses
                     blob: + URL.createObjectURL(); intercepting it produces a
                     404 (Vercel sees "/blob:https://..." and serves not-found).
                   - format=csv — same reason: the csvUrl path uses fetch +
                     blob; the explicit GET-as-link path also works fine in
                     Capacitor without interception.
                   - Programmatic clicks (ev.isTrusted === false) — those
                     come from explicit code paths that already know what
                     they're doing.

                   Also: only fire inside a REAL Capacitor app, not the
                   ?capacitor-preview=1 mode. Preview mode is for layout
                   debugging only; it must not change actual behavior of
                   downloads.
                   ────────────────────────────────────────────────────── */
                var isRealCap = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
                  || ua.indexOf('myncel-app') > -1
                  || (ua.indexOf('android') > -1 && ua.indexOf('wv') > -1);
                if (isRealCap) {
                  document.addEventListener('click', function(ev){
                    try {
                      if (ev.isTrusted === false) return; // programmatic click — leave alone
                      var el = ev.target;
                      while (el && el.tagName !== 'A') { el = el.parentElement; }
                      if (!el || el.tagName !== 'A') return;
                      var href = el.getAttribute('href') || '';
                      if (!href) return;
                      // Skip non-http schemes — they are handled by the WebView directly.
                      var lower = href.toLowerCase();
                      if (lower.indexOf('blob:') === 0
                          || lower.indexOf('data:') === 0
                          || lower.indexOf('mailto:') === 0
                          || lower.indexOf('tel:') === 0
                          || lower.indexOf('sms:') === 0
                          || lower.indexOf('javascript:') === 0) {
                        return;
                      }
                      var hasDownload = el.hasAttribute('download');
                      var isPdfApi = href.indexOf('/api/') === 0 && href.indexOf('format=pdf') > -1;
                      if (!hasDownload && !isPdfApi) return;
                      // Build absolute URL so the system browser doesn't get confused.
                      var absHref = href;
                      if (absHref.indexOf('http') !== 0) {
                        absHref = location.origin + (absHref.charAt(0)==='/' ? '' : '/') + absHref;
                      }
                      ev.preventDefault();
                      ev.stopPropagation();
                      // Try Capacitor's Browser plugin first (if installed in shell).
                      try {
                        var Cap = window.Capacitor;
                        if (Cap && Cap.Plugins && Cap.Plugins.Browser && typeof Cap.Plugins.Browser.open === 'function') {
                          Cap.Plugins.Browser.open({ url: absHref });
                          return;
                        }
                      } catch (_) {}
                      // Fallback: plain window.open with _blank — Capacitor's default
                      // link handler routes this to the system browser on both iOS
                      // and Android. If even that fails, last resort is location =.
                      var w = window.open(absHref, '_blank');
                      if (!w) { window.location.href = absHref; }
                    } catch (e) { /* never block the user */ }
                  }, true);
                }
              }
            }catch(e){}})();`
          }}
        />
        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Myncel",
              "url": "https://www.myncel.com",
              "logo": "https://www.myncel.com/logo.png",
              "description": "Myncel is an IoT-powered equipment monitoring and maintenance management platform for facilities teams in manufacturing, hospitality, healthcare, warehousing, oil and gas, and more.",
              "sameAs": [
                "https://twitter.com/myncel",
                "https://linkedin.com/company/myncel"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "url": "https://www.myncel.com/contact",
                "availableLanguage": ["English"]
              },
              "areaServed": ["NG", "GH", "US", "CA", "GB", "DE", "FR", "NL", "BE", "PL", "ES", "IT", "SE", "NO", "DK", "CH"]
            })
          }}
        />
        {/* JSON-LD: WebSite with Sitelinks Searchbox */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Myncel",
              "url": "https://www.myncel.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.myncel.com/blog?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* JSON-LD: SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Myncel",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web, iOS, Android",
              "url": "https://www.myncel.com",
              "offers": [
                { "@type": "Offer", "name": "Starter", "price": "79", "priceCurrency": "USD", "billingIncrement": "month" },
                { "@type": "Offer", "name": "Professional", "price": "149", "priceCurrency": "USD", "billingIncrement": "month" },
                { "@type": "Offer", "name": "Enterprise", "price": "299", "priceCurrency": "USD", "billingIncrement": "month" }
              ],
              "description": "IoT-powered equipment monitoring and maintenance management platform for facility and operations teams.",
              "featureList": [
                "Asset registry and equipment tracking",
                "Automated preventive maintenance scheduling",
                "Mobile work order management",
                "IoT sensor integration and threshold alerts",
                "Multi-site dashboard",
                "Compliance and audit records"
              ]
            })
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <LiveChat />
        </Providers>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('SW registration failed:', err);
              });
            });
          }
        `}} />
      </body>
    </html>
  );
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const, // enables env(safe-area-inset-*) under camera notches / status bars
  themeColor: '#ffffff',
};