import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/api/',
          '/admin/',
          '/settings/',
          '/org/',
          '/equipment/',
          '/purchase-orders/',
          '/analytics/',
          '/setup/',
          '/join/',
          '/_next/',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/offline',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard',
          '/api/',
          '/admin/',
          '/settings/',
          '/org/',
          '/equipment/',
          '/purchase-orders/',
          '/analytics/',
          '/setup/',
          '/join/',
        ],
      },
      // Google News crawler — explicitly allow the blog so news articles
      // can appear in news.google.com results.
      {
        userAgent: 'Googlebot-News',
        allow: ['/blog', '/blog/'],
        disallow: ['/dashboard', '/api/', '/admin/'],
      },
      // AI search / LLM crawlers — let them index marketing pages so
      // Perplexity, ChatGPT search, Claude, and Gemini can cite Myncel.
      // Block them from app/private routes for the same reason as everyone else.
      {
        userAgent: ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Claude-Web', 'Google-Extended', 'CCBot', 'anthropic-ai', 'Bytespider', 'Amazonbot', 'cohere-ai'],
        allow: ['/', '/blog', '/blog/', '/products', '/products/', '/solutions', '/solutions/', '/pricing', '/help', '/guides', '/guides/'],
        disallow: ['/dashboard', '/api/', '/admin/', '/settings/', '/org/', '/equipment/', '/purchase-orders/', '/analytics/', '/setup/', '/join/'],
      },
    ],
    // Both the regular sitemap AND the Google News sitemap so search engines
    // discover both. Google News specifically reads the news sitemap to
    // surface articles in the news feed within ~hours of publication.
    sitemap: [
      'https://www.myncel.com/sitemap.xml',
      'https://www.myncel.com/news.xml',
    ],
    host: 'https://www.myncel.com',
  }
}
