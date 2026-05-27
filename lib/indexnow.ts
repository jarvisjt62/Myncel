/**
 * IndexNow ping helper.
 *
 * IndexNow is a free protocol jointly run by Microsoft Bing and Yandex
 * (and several smaller engines) that lets a site instantly notify
 * search engines when a URL is created, updated, or deleted. Instead
 * of waiting for the crawler to randomly revisit, the engine fetches
 * within seconds.
 *
 * Spec: https://www.indexnow.org/
 *
 * How it works:
 *   1. We host a key file at https://www.myncel.com/<KEY>.txt that
 *      contains exactly the key string. This proves we control the
 *      domain. (Implemented in app/[indexnowKey].txt/route.ts.)
 *   2. We POST a JSON body to https://api.indexnow.org/indexnow with
 *      our host, the key, the key file location, and a list of URLs.
 *   3. Bing + Yandex pick it up; the URL is queued for crawl within
 *      ~minutes typically, usually under an hour.
 *
 * The key itself is not secret \u2014 it lives in plaintext at /<key>.txt.
 * It just has to (a) be 8\u201364 hex chars and (b) match what's in the
 * file. Rotating it is a matter of changing this constant + Vercel
 * redeploy.
 */

export const INDEXNOW_KEY = '6f15997d251fb46b76a51f75eb6ba815';
export const INDEXNOW_HOST = 'www.myncel.com';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowResult {
  ok: boolean;
  status: number;
  statusText: string;
  submitted: number;
  body?: string;
  error?: string;
}

/**
 * Submit a batch of URLs to IndexNow. Per the spec:
 *   - Up to 10 000 URLs per request
 *   - All URLs must belong to INDEXNOW_HOST (no cross-domain batches)
 *   - HTTP 200 means accepted (the engines crawl asynchronously)
 *   - HTTP 202 means accepted but key validation pending (still ok)
 *   - HTTP 400/403/422/429 are real errors worth surfacing
 *
 * We never throw \u2014 callers (admin button, post-publish hook) want a
 * structured result they can log/display, not an exception that
 * crashes the request that triggered it.
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  // Filter out anything that doesn't belong to our host. IndexNow
  // rejects mixed-host batches with 422, so be defensive.
  const cleaned = Array.from(
    new Set(
      urls
        .map((u) => u.trim())
        .filter((u) => u.startsWith(`https://${INDEXNOW_HOST}/`)),
    ),
  );

  if (cleaned.length === 0) {
    return {
      ok: false,
      status: 0,
      statusText: 'no-urls',
      submitted: 0,
      error: 'No valid URLs to submit. URLs must start with https://' + INDEXNOW_HOST + '/',
    };
  }

  const body = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: cleaned,
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'Myncel-IndexNow/1.0 (+https://www.myncel.com)',
      },
      body: JSON.stringify(body),
      // No caching whatsoever \u2014 this is a one-shot side effect.
      cache: 'no-store',
    });

    let text = '';
    try {
      text = await res.text();
    } catch {
      /* body might be empty for 200/202 */
    }

    const ok = res.status === 200 || res.status === 202;
    return {
      ok,
      status: res.status,
      statusText: res.statusText,
      submitted: cleaned.length,
      body: text || undefined,
    };
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      statusText: 'fetch-error',
      submitted: cleaned.length,
      error: e?.message || String(e),
    };
  }
}

/**
 * Convenience: submit a single URL.
 */
export function submitUrlToIndexNow(url: string): Promise<IndexNowResult> {
  return submitToIndexNow([url]);
}
