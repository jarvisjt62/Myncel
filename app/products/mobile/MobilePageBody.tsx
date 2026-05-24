'use client';

/**
 * Body of the /products/mobile page.
 *
 * Split out from the server-component shell so we can use the
 * `useCapacitorPlatform()` hook to swap copy at runtime.
 *
 * Apple App Review (May 24, 2026) rejected build 1.0(12) under
 * Guideline 2.3.10 (Accurate Metadata) for showing Android references
 * inside the iOS binary. This file is therefore the single
 * authoritative place where we render different feature copy for:
 *
 *   - 'ios'     — iPhone/iPad Capacitor app: only mention iOS
 *   - 'android' — Android Capacitor app: only mention Android
 *   - 'web'     — public website: mention both, show download badges
 */

import Link from 'next/link';
import AppStoreBadges from '../../components/AppStoreBadges';
import { anyMobileAppLive } from '@/lib/mobile-app-config';
import { useCapacitorPlatform } from '@/lib/use-capacitor-webview';

export default function MobilePageBody() {
  const platform = useCapacitorPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isWeb = platform === 'web';

  const appsLive = anyMobileAppLive();

  // Hero copy — plain, platform-aware, no cross-platform mention
  // inside either native shell.
  const heroTagline = isIOS
    ? 'Native iOS app for technicians on the move — plus a mobile-friendly web app for anyone who would rather skip the install. Work orders, photo capture, QR scanning, and offline support, all in one.'
    : isAndroid
      ? 'Native Android app for technicians on the move — plus a mobile-friendly web app for anyone who would rather skip the install. Work orders, photo capture, QR scanning, and offline support, all in one.'
      : 'Native iOS and Android apps for technicians on the move — plus a mobile-friendly web app for anyone who would rather skip the install. Work orders, photo capture, QR scanning, and offline support, all in one.';

  const comingSoonNote = isIOS
    ? 'iOS app available — mobile web also supported'
    : isAndroid
      ? 'Android app available — mobile web also supported'
      : 'iOS & Android apps coming soon — mobile web available today';

  // Features list — first card is platform-dependent. Everything
  // else is identical regardless of platform.
  const platformFeatureCard = isIOS
    ? {
        icon: '📱',
        title: 'Native iOS app',
        desc: 'Download Myncel from the App Store for the smoothest experience, push notifications, and offline support.',
      }
    : isAndroid
      ? {
          icon: '📱',
          title: 'Native Android app',
          desc: 'Download Myncel from Google Play for the smoothest experience, push notifications, and offline support.',
        }
      : {
          icon: '📱',
          title: 'Native iOS & Android apps',
          desc: 'Download Myncel from the App Store or Google Play for the smoothest experience, push notifications, and offline support.',
        };

  const features = [
    platformFeatureCard,
    { icon: '🌐', title: 'Or use the mobile web', desc: 'No install required — open myncel.com in any phone browser and you have everything you need.' },
    { icon: '📸', title: 'Photo capture', desc: 'Attach photos to work orders directly from your phone camera. Document problems and solutions visually.' },
    { icon: '📍', title: 'QR code scanning', desc: 'Scan machine QR codes to instantly pull up equipment details, history, and pending tasks.' },
    { icon: '✅', title: 'Quick completion', desc: 'Complete work orders in seconds. Tap, add notes, snap a photo, done.' },
    { icon: '🔔', title: 'Push notifications', desc: 'Get alerts on your phone when new tasks are assigned or priorities change.' },
  ];

  const stats = [
    { value: '100%', label: 'Mobile-friendly' },
    { value: '0', label: 'App installs needed' },
    { value: '5sec', label: 'Task completion' },
    { value: 'Offline', label: 'Support' },
  ];

  // Hero title (second line) is also platform-aware so the Apple
  // reviewer can't argue the page is "really" about Android.
  const heroSubtitle = isIOS
    ? 'Your shop floor, in your pocket.'
    : isAndroid
      ? 'Your shop floor, in your pocket.'
      : 'Your shop floor, in your pocket.';

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Mobile App</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Mobile Maintenance App
              <span className="block text-rose-600">{heroSubtitle}</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              {heroTagline}
            </p>

            {/* Download badges — only on the public website. Inside
                either native app, showing a "download" badge for the
                opposite platform would re-trigger the same App Review
                issue, and showing one for the current platform is
                nonsensical (you're already in it). */}
            {isWeb && appsLive && (
              <div className="mb-8">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-600 mb-3">
                  Get the app
                </div>
                <AppStoreBadges size="lg" placement="products-mobile-hero" />
              </div>
            )}
            {isWeb && !appsLive && (
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                {comingSoonNote}
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-rose-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-rose-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for the shop floor</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-rose-50 rounded-xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-sm text-[#425466]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-label">How It Works</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">Simple as opening a browser</h2>
              <p className="text-[#425466] mb-6">No complicated app deployment. Technicians simply open the Myncel website on their phone, log in, and they have everything they need.</p>
              <ul className="space-y-3">
                {['Open myncel.com on any smartphone', 'Log in with your credentials', 'See your assigned tasks instantly', 'Complete work orders on the spot'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#425466]">
                    <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8 text-center">
              <div className="bg-white rounded-xl shadow-lg p-4 max-w-xs mx-auto">
                <div className="text-left text-sm font-bold text-[#0a2540] mb-2">Your Tasks (3)</div>
                <div className="space-y-2">
                  <div className="bg-rose-50 rounded-lg p-2 text-left text-xs">
                    <div className="font-semibold text-[#0a2540]">CNC #3 - Filter Change</div>
                    <div className="text-[#8898aa]">Due today</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-left text-xs">
                    <div className="font-semibold text-[#0a2540]">Press Brake - Lubrication</div>
                    <div className="text-[#8898aa]">Due tomorrow</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom download CTA — same logic as hero: only on public web. */}
      {isWeb && appsLive && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="section-label">Download</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">
              Get Myncel on your phone
            </h2>
            <p className="text-[#425466] mb-8 text-lg max-w-2xl mx-auto">
              The native apps give you push notifications, offline support, and a polished UI built specifically for the shop floor. Both apps are free — sign in with your existing Myncel workspace.
            </p>
            <div className="flex justify-center">
              <AppStoreBadges size="lg" placement="products-mobile-cta" />
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-rose-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to go mobile?</h2>
          <p className="text-rose-200 mb-8 text-lg">Start your free 30-day trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-rose-600 font-bold px-8 py-3 rounded-lg hover:bg-rose-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>
    </>
  );
}
