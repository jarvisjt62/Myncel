/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Performance: faster client-side navigation ──────────────────────────
  experimental: {
    optimisticClientCache: true,
  },

  // ── Compiler optimizations ───────────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ── Image optimization ───────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable XSS filter
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://unpkg.com https://js.stripe.com https://www.paypal.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.stripe.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.google.com/recaptcha/ https://vitals.vercel-insights.com https://unpkg.com",
              "frame-src https://www.google.com/recaptcha/ https://js.stripe.com https://hooks.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          // Strict Transport Security (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache public assets
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;