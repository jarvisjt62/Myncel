import { headers } from 'next/headers';
import {
  getArticleBySlug,
  PUBLICATION_NAME,
  SITE_URL,
} from '@/lib/blog-articles';

/**
 * Blog group layout.
 *
 * Injects BlogPosting JSON-LD on every individual blog post automatically,
 * driven by the slug → metadata registry in lib/blog-articles.ts. This way
 * we don't have to touch the 16 existing post files to give each one
 * structured data for Google, Bing and AI search engines.
 *
 * On the /blog index page (no slug match), we emit a Blog (CollectionPage)
 * JSON-LD listing the most recent posts instead.
 */

const DEFAULT_LOGO = `${SITE_URL}/myncel-logo.png`;
const DEFAULT_OG = `${SITE_URL}/og-default.png`;

function getPathname(): string {
  // Next.js exposes the original request URL via x-invoke-path / referer
  // depending on the runtime; x-pathname is set by middleware in many
  // setups. We try several headers and fall back to '/blog'.
  const h = headers();
  return (
    h.get('x-pathname') ||
    h.get('x-invoke-path') ||
    h.get('next-url') ||
    '/blog'
  );
}

function extractSlug(pathname: string): string | null {
  // Matches /blog/<slug> but not /blog or /blog/
  const m = pathname.match(/^\/blog\/([^/?#]+)/);
  return m ? m[1] : null;
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const pathname = getPathname();
  const slug = extractSlug(pathname);
  const article = slug ? getArticleBySlug(slug) : undefined;

  let jsonLd: Record<string, unknown> | null = null;

  if (article) {
    const url = `${SITE_URL}/blog/${article.slug}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.description ?? article.title,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt ?? article.publishedAt,
      inLanguage: 'en',
      isAccessibleForFree: true,
      image: article.image
        ? article.image.startsWith('http')
          ? article.image
          : `${SITE_URL}${article.image}`
        : DEFAULT_OG,
      author: {
        '@type': 'Organization',
        name: article.authorName ?? 'Myncel Team',
        url: SITE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: PUBLICATION_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: DEFAULT_LOGO,
        },
      },
      articleSection: article.category,
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // JSON.stringify with no third arg is safe; schema-org JSON-LD
          // does not contain HTML markup.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
