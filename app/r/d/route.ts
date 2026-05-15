import { NextResponse } from 'next/server';

/**
 * SMS-safe dashboard redirect.
 *
 * SMS apps (iMessage, Android Messages, WhatsApp, etc.) auto-fetch any URL
 * sent in a message and render an Open Graph / Twitter card preview.
 * Linking directly to /dashboard caused the Myncel logo card to appear
 * under every SMS.
 *
 * This route is a pure HTTP 302 redirect handled in the Next.js Edge layer,
 * so the response has NO HTML body and NO Open Graph metadata. SMS link-
 * preview crawlers see only the redirect and do not render a card.
 *
 * Usage in SMS body: https://www.myncel.com/r/d
 *   -> redirects browser to /dashboard after the user clicks.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Optional: allow ?to=path for future deep links (validated to internal paths only).
  const to = url.searchParams.get('to');
  let target = '/dashboard';
  if (to && /^\/[A-Za-z0-9_\-\/?=&#%.]*$/.test(to)) {
    target = to;
  }
  const dest = new URL(target, url.origin);

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: dest.toString(),
      // Tell crawlers (incl. SMS preview bots) not to index or preview this URL.
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
