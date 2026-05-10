import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.myncel.com'
  const now = new Date()

  // Helper to create entries with consistent formatting
  const entry = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] = 'monthly',
    priority: number = 0.5,
    lastModified: Date = now
  ) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  })

  return [
    // ─── Core Pages ───────────────────────────────────────────
    entry('/', 'weekly', 1.0),
    entry('/pricing', 'weekly', 0.9),
    entry('/products', 'monthly', 0.9),
    entry('/solutions', 'monthly', 0.8),
    entry('/customers', 'monthly', 0.8),
    entry('/demo', 'monthly', 0.8),

    // ─── Company ──────────────────────────────────────────────
    entry('/about', 'monthly', 0.7),
    entry('/careers', 'weekly', 0.7),
    entry('/contact', 'monthly', 0.7),
    entry('/changelog', 'weekly', 0.6),
    entry('/support', 'monthly', 0.7),
    entry('/help', 'monthly', 0.6),
    entry('/status', 'daily', 0.5),

    // ─── Legal ────────────────────────────────────────────────
    entry('/privacy', 'yearly', 0.3),
    entry('/terms', 'yearly', 0.3),
    entry('/cookies', 'yearly', 0.3),
    entry('/security', 'monthly', 0.4),
    entry('/accessibility', 'yearly', 0.3),

    // ─── Auth ─────────────────────────────────────────────────
    entry('/signup', 'monthly', 0.8),

    // ─── Product Pages ────────────────────────────────────────
    entry('/products/monitoring', 'monthly', 0.8),
    entry('/products/scheduling', 'monthly', 0.8),
    entry('/products/work-orders', 'monthly', 0.8),
    entry('/products/analytics', 'monthly', 0.8),
    entry('/products/alerts', 'monthly', 0.8),
    entry('/products/inventory', 'monthly', 0.8),
    entry('/products/mobile', 'monthly', 0.7),
    entry('/products/preventive', 'monthly', 0.8),
    entry('/products/reports', 'monthly', 0.7),
    entry('/products/downtime', 'monthly', 0.7),
    entry('/products/downtime-reports', 'monthly', 0.7),
    entry('/products/sensors', 'monthly', 0.7),
    entry('/products/team', 'monthly', 0.7),

    // ─── Solution Pages ───────────────────────────────────────
    entry('/solutions/metal-fabrication', 'monthly', 0.7),
    entry('/solutions/plastics', 'monthly', 0.7),
    entry('/solutions/food-beverage', 'monthly', 0.7),
    entry('/solutions/auto-parts', 'monthly', 0.7),
    entry('/solutions/electronics', 'monthly', 0.7),
    entry('/solutions/woodworking', 'monthly', 0.7),
    entry('/solutions/small', 'monthly', 0.6),
    entry('/solutions/growing', 'monthly', 0.6),
    entry('/solutions/midsize', 'monthly', 0.6),

    // ─── Blog ─────────────────────────────────────────────────
    entry('/blog', 'daily', 0.8),
    entry('/blog/hidden-cost-reactive-maintenance', 'monthly', 0.6),
    entry('/blog/preventive-maintenance-program', 'monthly', 0.6),
    entry('/blog/maintenance-kpis-plant-manager', 'monthly', 0.6),
    entry('/blog/cnc-machine-maintenance-checklist', 'monthly', 0.6),
    entry('/blog/preventive-vs-predictive-maintenance', 'monthly', 0.6),
    entry('/blog/cmms-roi-calculation', 'monthly', 0.6),
    entry('/blog/haccp-maintenance-records', 'monthly', 0.6),
    entry('/blog/hydraulic-system-maintenance', 'monthly', 0.6),
    entry('/blog/spreadsheet-to-cmms-migration', 'monthly', 0.6),

    // ─── Guides ───────────────────────────────────────────────
    entry('/guides', 'monthly', 0.7),
    entry('/guides/pm-checklist', 'monthly', 0.7),
    entry('/guides/equipment-lifespan', 'monthly', 0.6),
    entry('/guides/roi-calculator', 'monthly', 0.6),

    // ─── Docs ─────────────────────────────────────────────────
    entry('/docs', 'weekly', 0.7),
    entry('/docs/api', 'monthly', 0.6),
    entry('/docs/iot-guides', 'monthly', 0.6),
    entry('/docs/protocols', 'monthly', 0.6),


    // ─── New Industry Solution Pages ────────────────────────────────────
    entry('/solutions/hotels', 'monthly', 0.8),
    entry('/solutions/hospitals', 'monthly', 0.8),
    entry('/solutions/warehouses', 'monthly', 0.8),
    entry('/solutions/oil-gas', 'monthly', 0.8),

    // ─── Location Pages ──────────────────────────────────────────────────
    entry('/locations/united-states', 'monthly', 0.8),
    entry('/locations/canada', 'monthly', 0.8),
    entry('/locations/europe', 'monthly', 0.8),
    entry('/locations/west-africa', 'monthly', 0.8),

    // ─── New Blog Articles ───────────────────────────────────────────────
    entry('/blog/hotel-generator-hvac-monitoring', 'monthly', 0.7),
    entry('/blog/hospital-equipment-monitoring-compliance', 'monthly', 0.7),
    entry('/blog/warehouse-refrigeration-monitoring', 'monthly', 0.7),
    entry('/blog/iot-monitoring-oil-gas', 'monthly', 0.7),
    entry('/blog/reduce-generator-downtime-nigeria-ghana', 'monthly', 0.7),
    entry('/blog/equipment-monitoring-software-west-africa', 'monthly', 0.7),

    // ─── Conversion Pages ────────────────────────────────────────────────
    entry('/free-trial', 'monthly', 0.9),
    entry('/partners', 'monthly', 0.8),

    // ─── Webinars ─────────────────────────────────────────────
    entry('/webinars', 'monthly', 0.6),
  ]
}