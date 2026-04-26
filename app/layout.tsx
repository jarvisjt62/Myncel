import type { Metadata } from 'next';
import './globals.css';
import LiveChat from './components/LiveChat';
import Providers from './components/Providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://myncel.com'),
  title: {
    default: 'Myncel — AI Predictive Maintenance Software for Small Manufacturers',
    template: '%s | Myncel',
  },
  description: 'Myncel helps small manufacturers prevent equipment breakdowns with AI-powered predictive maintenance scheduling, work orders, alerts, and analytics. Setup in 15 minutes. Free for 3 months.',
  keywords: [
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
  authors: [{ name: 'Myncel', url: 'https://myncel.com' }],
  creator: 'Myncel',
  publisher: 'Myncel',
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
    url: 'https://myncel.com',
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