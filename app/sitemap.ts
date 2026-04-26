import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://myncel.com'
  const lastModified = new Date()

  return [
    // Core pages - highest priority
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/products`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/solutions`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/customers`, lastModified, changeFrequency: 'monthly', priority: 0.8 },

    // Auth
    { url: `${baseUrl}/signup`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/signin`, lastModified, changeFrequency: 'monthly', priority: 0.5 },

    // Company
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/changelog`, lastModified, changeFrequency: 'weekly', priority: 0.6 },

    // Resources
    { url: `${baseUrl}/blog`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/docs`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/guides`, lastModified, changeFrequency: 'monthly', priority: 0.7 },

    // Solution pages
    { url: `${baseUrl}/solutions/metal-fabrication`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/solutions/plastics`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/solutions/food-beverage`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/solutions/auto-parts`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/solutions/electronics`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/solutions/woodworking`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/solutions/small`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/solutions/growing`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/solutions/midsize`, lastModified, changeFrequency: 'monthly', priority: 0.6 },

    // Product pages
    { url: `${baseUrl}/products/monitoring`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/products/scheduling`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/products/work-orders`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/products/analytics`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/products/alerts`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/products/inventory`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/products/mobile`, lastModified, changeFrequency: 'monthly', priority: 0.6 },

    // Blog posts
    { url: `${baseUrl}/blog/hidden-cost-reactive-maintenance`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/preventive-maintenance-program`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/maintenance-kpis-plant-manager`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/cnc-machine-maintenance-checklist`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/preventive-vs-predictive-maintenance`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/cmms-roi-calculation`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/haccp-maintenance-records`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog/hydraulic-system-maintenance`, lastModified, changeFrequency: 'monthly', priority: 0.6 },

    // Lead magnet
    { url: `${baseUrl}/guides/pm-checklist`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ]
}