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