/**
 * IndexNow key file.
 *
 * Bing/Yandex hit https://www.myncel.com/<KEY>.txt to verify we own
 * the domain. The body must be EXACTLY the key, nothing else.
 *
 * Spec: https://www.indexnow.org/documentation
 *
 * The route segment uses the literal key as the path. If you ever
 * rotate the key in lib/indexnow.ts, also rename this folder to match.
 */

import { INDEXNOW_KEY } from '@/lib/indexnow';

export const dynamic = 'force-static';

export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
