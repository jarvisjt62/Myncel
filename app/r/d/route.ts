import { NextResponse } from 'next/server';

/**
 * SMS-safe dashboard redirect.
 *
 * SMS apps (iMessage, Android Messages, WhatsApp, etc.) auto-fetch any URL
 * sent in a message and render an Open Graph / Twitter card preview.
 *
 * A bare 302 didn't fully solve it, because some preview crawlers do NOT
 * follow redirects — they fall back to the apex/root domain's metadata,
 * which still has the Myncel logo OG image.
 *
 * Solution: return a tiny HTML page that:
 *   1. Explicitly DECLARES empty Open Graph / Twitter card metadata
 *      (overrides whatever the root layout would emit, prevents fallback to
 *      the homepage card).
 *   2. Sets X-Robots-Tag headers telling crawlers not to preview.
 *   3. Uses meta-refresh + JavaScript to redirect real human visitors to
 *      /dashboard immediately.
 *
 * Result: SMS apps see HTML with no preview-able image -> no card rendered.
 * Real users tap the link -> instant redirect to dashboard.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get('to');
  let target = '/dashboard';
  if (to && /^\/[A-Za-z0-9_\-\/?=&#%.]*$/.test(to)) {
    target = to;
  }
  const dest = new URL(target, url.origin).toString();

  // Minimal HTML with EXPLICITLY empty OG/Twitter tags. The empty content
  // attributes tell the crawler "no preview available" rather than letting
  // it fall back to the site's root metadata.
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
<meta name="referrer" content="no-referrer">
<meta property="og:title" content="">
<meta property="og:description" content="">
<meta property="og:image" content="">
<meta property="og:type" content="website">
<meta property="og:site_name" content="">
<meta name="twitter:card" content="">
<meta name="twitter:title" content="">
<meta name="twitter:description" content="">
<meta name="twitter:image" content="">
<meta http-equiv="refresh" content="0;url=${dest}">
<title></title>
<style>html,body{background:#fff;margin:0;padding:0}</style>
</head>
<body>
<script>window.location.replace(${JSON.stringify(dest)});</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
