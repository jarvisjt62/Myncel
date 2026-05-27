import type { Metadata } from 'next';
import './globals.css';
import LiveChat from './components/LiveChat';
import Providers from './components/Providers';
import VersionGate from './components/VersionGate';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.myncel.com'),
  title: {
    default: 'Myncel — CMMS Software for Predictive Maintenance & Work Orders',
    template: '%s | Myncel',
  },
  description: 'CMMS software for small manufacturers, hotels, and facilities. Schedule preventive maintenance, manage work orders, and cut downtime — live in 30 minutes.',
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
  /* ─── Search-engine ownership verifications ─────────────────────────
     Each value is read from an env var so secrets never live in git.
     Set these in Vercel → Settings → Environment Variables:
       NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
       NEXT_PUBLIC_BING_SITE_VERIFICATION       (Bing Webmaster Tools)
       NEXT_PUBLIC_YANDEX_VERIFICATION          (Yandex Webmaster)
       NEXT_PUBLIC_PINTEREST_VERIFICATION       (Pinterest, optional)
       NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION (Meta Business, optional)
     If an env var is unset the corresponding tag simply isn't rendered.
   ────────────────────────────────────────────────────────────────── */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: {
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION
        ? { 'p:domain_verify': process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION
        ? { 'facebook-domain-verification': process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION }
        : {}),
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
        {/* JSON-LD: FAQPage — ten high-value buyer questions answered.
             AI search engines (Perplexity, ChatGPT search, Claude, Gemini)
             cite FAQ schema heavily, and Google may show them as rich
             snippets in classic search results too. Keep answers concise
             (one paragraph) and free of marketing fluff so LLMs reuse them.
         */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Myncel?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Myncel is CMMS (computerized maintenance management system) software for small and mid-size manufacturers, hotels, hospitals, warehouses, and oil & gas operators. It combines preventive maintenance scheduling, work order management, parts inventory, IoT sensor monitoring, and analytics in one platform that runs on web, Android, and iOS." }
                },
                {
                  "@type": "Question",
                  "name": "How is Myncel different from UpKeep, Limble, or Fiix?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Myncel focuses on small manufacturers and facility teams that find legacy CMMS tools too expensive and slow to deploy. Customers are typically live in under 30 minutes, the mobile app works offline, and built-in IoT sensor support means predictive maintenance does not require a separate platform. Pricing starts at $79/month versus $35–80 per user per month for incumbents." }
                },
                {
                  "@type": "Question",
                  "name": "How much does Myncel cost?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Plans start at $79/month for the Starter plan, $149/month for Professional, and $299/month for Enterprise. A 14-day free trial is available with no credit card required. Annual billing includes two months free." }
                },
                {
                  "@type": "Question",
                  "name": "Does Myncel work offline on mobile?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Yes. The Myncel mobile app for Android and iOS caches work orders, machines, and parts so technicians can continue working in poor-signal areas. Updates sync automatically once connectivity returns." }
                },
                {
                  "@type": "Question",
                  "name": "What kinds of equipment does Myncel monitor?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Myncel tracks any asset that needs scheduled maintenance: CNC lathes and mills, injection molders, hydraulic presses, conveyors, HVAC, generators, refrigeration, boilers, pumps, motors, robots, and bottling lines. IoT integration supports vibration, temperature, current, and pressure sensors over Wi-Fi, MQTT, Modbus, and BACnet." }
                },
                {
                  "@type": "Question",
                  "name": "Can Myncel import data from a spreadsheet?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Yes. The Equipment, Work Orders, and Parts modules each include a CSV import that maps your existing columns to Myncel fields. Most customers migrate their full Excel maintenance history in under an hour." }
                },
                {
                  "@type": "Question",
                  "name": "Does Myncel support multi-site organizations?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Yes. Organizations can manage multiple plants or facilities from a single dashboard, with role-based permissions, per-site reports, and consolidated KPIs across all locations." }
                },
                {
                  "@type": "Question",
                  "name": "What integrations does Myncel offer?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Built-in integrations include Google Sheets (export reports and data), QuickBooks (sync work orders as invoices, sync parts as items), Slack (send digests and alerts), and a public REST API plus webhooks for custom workflows." }
                },
                {
                  "@type": "Question",
                  "name": "Is Myncel suitable for hotels, hospitals, and warehouses, not just factories?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Yes. Myncel is industry-agnostic and powers maintenance for hotels (HVAC, generators, kitchen equipment), hospitals (medical equipment compliance and audit logs), warehouses (refrigeration, conveyors, MHE), and oil & gas operators (remote pumps, compressors, separators)." }
                },
                {
                  "@type": "Question",
                  "name": "How does Myncel help with HACCP, FDA, or ISO audits?",
                  "acceptedAnswer": { "@type": "Answer", "text": "Every work order, inspection, and sensor reading is timestamped and exportable as PDF or CSV. Maintenance Reports generate audit-ready logs covering the requested period. Permission roles ensure only authorized staff can edit historical records." }
                }
              ]
            })
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <LiveChat />
          <VersionGate />
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