/**
 * Shared blog article registry.
 *
 * Source of truth for slug → title + publish date. Used by:
 *   - app/news.xml/route.ts        (Google News sitemap, last 48 h)
 *   - app/blog/layout.tsx          (BlogPosting JSON-LD on every post)
 *   - app/sitemap.ts (optional)    (richer <lastmod> hints)
 *
 * When you publish a new article:
 *   1. Add a folder under app/blog/<slug>/page.tsx
 *   2. Prepend an entry below with a fresh ISO publishedAt
 *   That's it. News sitemap + JSON-LD update automatically.
 */

export interface BlogArticle {
  slug: string;
  title: string;
  description?: string;
  publishedAt: string;   // ISO 8601 UTC, e.g. 2025-12-22T09:00:00Z
  updatedAt?: string;    // optional; defaults to publishedAt
  image?: string;        // absolute or site-relative; defaults to og-default
  authorName?: string;   // defaults to "Myncel Team"
  category?: string;
}

// Most recent first. Articles older than 48 h are auto-excluded from news.xml
// but always included in BlogPosting JSON-LD.
export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'reduce-generator-downtime-nigeria-ghana',
    title: 'How to Reduce Generator Downtime: West Africa Field Notes',
    description: 'Practical playbook for reducing generator downtime in Nigeria and Ghana, with real fuel-quality, load-bank and PM scheduling tactics.',
    publishedAt: '2025-12-22T09:00:00Z',
    category: 'Field Operations',
  },
  {
    slug: 'equipment-monitoring-software-west-africa',
    title: 'Equipment Monitoring Software for West Africa: A Practical Guide',
    description: 'Choosing equipment monitoring software that works on patchy networks, prepaid data plans and shared mobile devices.',
    publishedAt: '2025-12-21T09:00:00Z',
    category: 'Buyer Guide',
  },
  {
    slug: 'hidden-cost-reactive-maintenance',
    title: 'The Hidden Cost of Reactive Maintenance',
    description: 'Reactive maintenance looks cheap until you add overtime, expedited shipping, scrap, downtime and HR churn. Here\'s the real number.',
    publishedAt: '2025-12-18T09:00:00Z',
    category: 'Strategy',
  },
  {
    slug: 'preventive-maintenance-program',
    title: 'How to Build a Preventive Maintenance Program from Scratch',
    description: 'A 30-day rollout plan for PM programs: asset register, criticality, task libraries, PM intervals, KPIs and review cadence.',
    publishedAt: '2025-12-12T09:00:00Z',
    category: 'Implementation',
  },
  {
    slug: 'maintenance-kpis-plant-manager',
    title: '10 Maintenance KPIs Every Plant Manager Should Track',
    description: 'MTBF, MTTR, PM compliance, schedule attainment, wrench time and seven more KPIs with formulas and target ranges.',
    publishedAt: '2025-12-05T09:00:00Z',
    category: 'KPIs',
  },
  {
    slug: 'cnc-machine-maintenance-checklist',
    title: 'CNC Machine Maintenance Checklist: Complete Guide for 2026',
    description: 'Daily, weekly, monthly and annual CNC checklist covering spindle, way oil, coolant, ballscrews, controls and accuracy verification.',
    publishedAt: '2025-11-28T09:00:00Z',
    category: 'Checklists',
  },
  {
    slug: 'spreadsheet-to-cmms-migration',
    title: 'From Spreadsheet to CMMS: A Migration Story',
    description: 'How a 60-asset facility moved from Excel to a CMMS in 21 days — column mappings, CSV import gotchas and team adoption tactics.',
    publishedAt: '2025-11-21T09:00:00Z',
    category: 'Case Study',
  },
  {
    slug: 'haccp-maintenance-records',
    title: 'HACCP Maintenance Records: What You Need and How to Store Them',
    description: 'Exactly which maintenance records HACCP audits expect, retention periods, and how to keep them retrieval-ready in a CMMS.',
    publishedAt: '2025-11-14T09:00:00Z',
    category: 'Compliance',
  },
  {
    slug: 'preventive-vs-predictive-maintenance',
    title: 'Preventive vs Predictive Maintenance: Which Strategy Is Right?',
    description: 'When time-based PM beats predictive, when sensors pay off, and how to combine both without over-engineering your program.',
    publishedAt: '2025-11-07T09:00:00Z',
    category: 'Strategy',
  },
  {
    slug: 'cmms-roi-calculation',
    title: 'How to Calculate the ROI of a CMMS Investment',
    description: 'A defensible ROI model for CMMS purchases — downtime avoided, labor saved, parts inventory reduction and audit risk.',
    publishedAt: '2025-10-30T09:00:00Z',
    category: 'Buyer Guide',
  },
  {
    slug: 'hydraulic-system-maintenance',
    title: 'Hydraulic System Maintenance: A Hands-On Guide',
    description: 'Contamination control, fluid analysis, hose inspection and pressure-testing routines that keep hydraulic systems alive longer.',
    publishedAt: '2025-10-23T09:00:00Z',
    category: 'How-To',
  },
  {
    slug: 'hotel-generator-hvac-monitoring',
    title: 'Hotel Generator and HVAC Monitoring: Reduce Guest Disruptions',
    description: 'How hotels in Africa and the Middle East monitor backup power and HVAC to protect occupancy revenue and brand reputation.',
    publishedAt: '2025-10-16T09:00:00Z',
    category: 'Industry',
  },
  {
    slug: 'hospital-equipment-monitoring-compliance',
    title: 'Hospital Equipment Monitoring and Compliance',
    description: 'JCI / DOH-ready equipment monitoring: cold chain, biomeds, life-safety logs and the audit trail you need to pass surveys.',
    publishedAt: '2025-10-10T09:00:00Z',
    category: 'Healthcare',
  },
  {
    slug: 'warehouse-refrigeration-monitoring',
    title: 'Warehouse Refrigeration Monitoring: Avoid Spoilage and Audits',
    description: 'Cold storage temperature monitoring patterns that prevent spoilage claims and keep FDA / FSMA audits short.',
    publishedAt: '2025-10-03T09:00:00Z',
    category: 'Cold Chain',
  },
  {
    slug: 'iot-monitoring-oil-gas',
    title: 'IoT Monitoring for Oil and Gas Operations',
    description: 'Where IoT sensors actually pay off in upstream and midstream operations — and where they\'re still not worth the wire.',
    publishedAt: '2025-09-26T09:00:00Z',
    category: 'Oil & Gas',
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug);
}

export const PUBLICATION_NAME = 'Myncel';
export const PUBLICATION_LANG = 'en';
export const SITE_URL = 'https://www.myncel.com';
