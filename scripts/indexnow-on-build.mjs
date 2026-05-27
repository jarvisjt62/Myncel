// scripts/indexnow-on-build.mjs
//
// Auto-IndexNow ping during Vercel production builds.
//
// Strategy
// --------
// On every successful production build we send IndexNow a small batch:
//   1. A fixed "core" list of high-value marketing URLs
//      (homepage, pricing, products, /compare hub + every comparison page).
//   2. Every blog article whose `publishedAt` (or `updatedAt`) is within the
//      last 36 hours — captures the "I just shipped a post" case without
//      requiring a state file (which Vercel builds can't write back to git).
//
// Idempotency
// -----------
// IndexNow tolerates repeats (Bing/Yandex docs explicitly allow 10k URLs/day).
// Re-pinging the same URL over multiple deploys is harmless.
//
// Guards
// ------
//   - Only runs when VERCEL_ENV === 'production' (preview & local skip).
//   - Failures never break the build (try/catch + always exit 0).
//   - Uses the same IndexNow key/host as lib/indexnow.ts.
//
// Hook
// ----
// Wired into package.json `vercel-build` so it runs after `next build`.
// We call it via Node directly (no transpile needed) since this file is .mjs.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const INDEXNOW_KEY = '6f15997d251fb46b76a51f75eb6ba815';
const INDEXNOW_HOST = 'www.myncel.com';
const SITE_URL = 'https://www.myncel.com';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const FRESHNESS_HOURS = 36;

// Fixed marketing URL set — re-submitted every prod deploy so any copy/SEO
// changes propagate quickly. Keep this list short and high-value.
const CORE_URLS = [
  '/',
  '/pricing',
  '/products',
  '/blog',
  '/compare',
  '/compare/myncel-vs-upkeep',
  '/compare/myncel-vs-limble',
  '/compare/myncel-vs-fiix',
  '/compare/myncel-vs-maintainx',
];

function log(...args) {
  console.log('[indexnow-on-build]', ...args);
}

function shouldRun() {
  // Allow opt-out via env var.
  if (process.env.INDEXNOW_DISABLE === '1') {
    log('skip: INDEXNOW_DISABLE=1');
    return false;
  }
  // Allow explicit opt-in for local testing.
  if (process.env.INDEXNOW_FORCE === '1') {
    log('force: INDEXNOW_FORCE=1');
    return true;
  }
  // Vercel sets VERCEL_ENV to 'production' | 'preview' | 'development'.
  // Only ping search engines on production deploys to avoid leaking preview URLs
  // and prevent accidental pings during local `npm run build`.
  if (process.env.VERCEL_ENV !== 'production') {
    log(`skip: VERCEL_ENV=${process.env.VERCEL_ENV || '(unset)'}`);
    return false;
  }
  return true;
}

/**
 * Parse lib/blog-articles.ts to extract { slug, publishedAt, updatedAt }
 * without needing TypeScript or imports — keeps this script dependency-free.
 *
 * The file is human-edited and follows a stable shape; we use a forgiving
 * regex pass and tolerate failures (an empty list just means we ping core
 * URLs only, never breaks the build).
 */
function readBlogArticles() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const filePath = join(here, '..', 'lib', 'blog-articles.ts');
    const src = readFileSync(filePath, 'utf8');

    const articles = [];
    // Match each `{ ... }` object inside the BLOG_ARTICLES array, in source order.
    // We don't try to parse the full TS — we just look for slug + publishedAt + updatedAt fields.
    const objRe = /\{\s*slug:\s*['"]([^'"]+)['"][\s\S]*?\}/g;
    let m;
    while ((m = objRe.exec(src)) !== null) {
      const block = m[0];
      const slug = m[1];
      const pubMatch = block.match(/publishedAt:\s*['"]([^'"]+)['"]/);
      const updMatch = block.match(/updatedAt:\s*['"]([^'"]+)['"]/);
      if (!pubMatch) continue;
      articles.push({
        slug,
        publishedAt: pubMatch[1],
        updatedAt: updMatch ? updMatch[1] : pubMatch[1],
      });
    }
    return articles;
  } catch (err) {
    log('warn: could not read lib/blog-articles.ts —', err.message);
    return [];
  }
}

function recentArticleUrls(articles) {
  const cutoff = Date.now() - FRESHNESS_HOURS * 3600 * 1000;
  const fresh = articles.filter((a) => {
    const ts = Date.parse(a.updatedAt || a.publishedAt);
    return Number.isFinite(ts) && ts >= cutoff;
  });
  return fresh.map((a) => `/blog/${a.slug}`);
}

async function pingIndexNow(urlList) {
  const urlList_full = urlList.map((p) => (p.startsWith('http') ? p : `${SITE_URL}${p}`));
  const body = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList_full,
  };
  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  log(`POST IndexNow → HTTP ${res.status} (${urlList_full.length} URL${urlList_full.length === 1 ? '' : 's'})`);
  if (res.status >= 400) {
    const text = await res.text().catch(() => '');
    log(`  body: ${text.slice(0, 200)}`);
  }
}

async function main() {
  if (!shouldRun()) return;

  const articles = readBlogArticles();
  const recent = recentArticleUrls(articles);

  // De-dupe (a recent post might be in CORE_URLS via /blog index — but actual
  // blog posts aren't in CORE_URLS, so this is mostly defensive).
  const all = Array.from(new Set([...CORE_URLS, ...recent]));

  log(`found ${articles.length} article(s) in registry, ${recent.length} within ${FRESHNESS_HOURS}h`);
  log(`pinging ${all.length} URL(s) total`);

  try {
    await pingIndexNow(all);
  } catch (err) {
    log('error (non-fatal):', err.message);
  }
}

// Always exit 0 — never break the build.
main().catch((err) => {
  log('unexpected error (non-fatal):', err.message);
}).finally(() => {
  process.exit(0);
});
