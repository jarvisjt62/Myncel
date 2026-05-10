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
    ],
    sitemap: 'https://www.myncel.com/sitemap.xml',
    host: 'https://www.myncel.com',
  }
}