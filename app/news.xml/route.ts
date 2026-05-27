/**
 * Google News sitemap — /news.xml
 *
 * Google News reads this dedicated XML format to surface fresh articles
 * in news.google.com and the Google News carousel within hours of
 * publication. Per Google's spec:
 *   - Include ONLY articles published in the last 2 days
 *   - Include <news:news> with publication name, language, date, title
 *   - Reference this URL from robots.ts (we do)
 *   - Submit it once in Google Search Console as a separate sitemap
 *
 * The article registry lives in lib/blog-articles.ts and is shared with
 * the BlogPosting JSON-LD layout, so adding a new post in one place
 * updates both the news sitemap and the structured data automatically.
 */

import {
  BLOG_ARTICLES,
  PUBLICATION_LANG,
  PUBLICATION_NAME,
  SITE_URL,
} from '@/lib/blog-articles';

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000; // last 48 hours
  const fresh = BLOG_ARTICLES.filter(
    (a) => new Date(a.publishedAt).getTime() >= cutoff,
  );

  const urls = fresh
    .map(
      (a) => `  <url>
    <loc>${SITE_URL}/blog/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${escape(PUBLICATION_NAME)}</news:name>
        <news:language>${PUBLICATION_LANG}</news:language>
      </news:publication>
      <news:publication_date>${a.publishedAt}</news:publication_date>
      <news:title>${escape(a.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n');

  // If nothing fresh enough, still return a valid (empty) sitemap so
  // Google doesn't 404 the URL and demote the source.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // 30-min CDN cache so the file isn't regenerated on every crawl,
      // but freshness is still well under the 48 h window.
      'Cache-Control':
        'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
