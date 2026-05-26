import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SupportSection from '../components/SupportSection';

export const metadata = {
  title: 'Documentation — Myncel Setup Guides & API Reference',
  description: 'Everything you need to get started with Myncel. Setup guides, equipment configuration, work order management, API reference, integrations, and troubleshooting for small manufacturers.',
  alternates: { canonical: 'https://www.myncel.com/docs' },
  openGraph: {
    title: 'Myncel Documentation — Setup Guides & API Reference',
    description: 'Complete documentation for Myncel. Get your maintenance program running in 15 minutes.',
    url: 'https://www.myncel.com/docs',
  },
}

const sections = [
  {
    icon: '🚀',
    title: 'Getting Started',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    slug: 'getting-started',
    articles: [
      { title: 'Quick Start Guide (15 minutes)', time: '5 min', popular: true, slug: 'quick-start' },
      { title: 'Adding your first machine', time: '3 min', popular: true, slug: 'first-machine' },
      { title: 'Setting up your first schedule', time: '4 min', popular: false, slug: 'first-schedule' },
      { title: 'Inviting your team', time: '2 min', popular: false, slug: 'inviting-team' },
      { title: 'Understanding the dashboard', time: '5 min', popular: false, slug: 'dashboard-overview' },
    ],
  },
  {
    icon: '⚙️',
    title: 'Equipment Management',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    slug: 'equipment',
    articles: [
      { title: 'Adding and editing equipment', time: '4 min', popular: false, slug: 'adding-editing' },
      { title: 'Uploading equipment photos & manuals', time: '3 min', popular: false, slug: 'photos-manuals' },
      { title: 'Tracking service history', time: '5 min', popular: false, slug: 'service-history' },
      { title: 'Equipment location & facility mapping', time: '6 min', popular: false, slug: 'facility-mapping' },
      { title: 'Setting warranty expiry alerts', time: '3 min', popular: false, slug: 'warranty-alerts' },
    ],
  },
  {
    icon: '📅',
    title: 'Schedules & Tasks',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    slug: 'schedules',
    articles: [
      { title: 'Creating a maintenance schedule', time: '5 min', popular: true, slug: 'creating-schedule' },
      { title: 'Calendar vs. hour-based schedules', time: '4 min', popular: false, slug: 'calendar-vs-hour' },
      { title: 'Scheduling for multiple machines', time: '6 min', popular: false, slug: 'multiple-machines' },
      { title: 'Seasonal and shutdown scheduling', time: '5 min', popular: false, slug: 'seasonal-scheduling' },
      { title: 'Using schedule templates', time: '4 min', popular: false, slug: 'schedule-templates' },
    ],
  },
  {
    icon: '📝',
    title: 'Work Orders',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    slug: 'work-orders',
    articles: [
      { title: 'Creating and assigning work orders', time: '4 min', popular: true, slug: 'creating-assigning' },
      { title: 'Completing a work order (mobile)', time: '3 min', popular: true, slug: 'completing-mobile' },
      { title: 'Adding photos to work orders', time: '2 min', popular: false, slug: 'adding-photos' },
      { title: 'Work order priority levels', time: '3 min', popular: false, slug: 'priority-levels' },
      { title: 'Viewing work order history', time: '4 min', popular: false, slug: 'work-order-history' },
    ],
  },
  {
    icon: '🔔',
    title: 'Alerts & Notifications',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    slug: 'alerts',
    articles: [
      { title: 'Setting up email alerts', time: '3 min', popular: false, slug: 'email-alerts' },
      { title: 'Setting up SMS notifications', time: '4 min', popular: false, slug: 'sms-notifications' },
      { title: 'Configuring overdue escalations', time: '5 min', popular: false, slug: 'escalations' },
      { title: 'Team notification routing', time: '4 min', popular: false, slug: 'team-routing' },
      { title: 'Daily and weekly digest emails', time: '3 min', popular: false, slug: 'digest-emails' },
    ],
  },
  {
    icon: '📊',
    title: 'Analytics & Reports',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    slug: 'analytics',
    articles: [
      { title: 'Understanding your dashboard metrics', time: '6 min', popular: false, slug: 'dashboard-metrics' },
      { title: 'Exporting reports to PDF & CSV', time: '3 min', popular: false, slug: 'exporting-reports' },
      { title: 'Tracking equipment uptime', time: '5 min', popular: false, slug: 'tracking-uptime' },
      { title: 'Calculating maintenance costs', time: '7 min', popular: false, slug: 'calculating-costs' },
      { title: 'Sharing reports with management', time: '3 min', popular: false, slug: 'sharing-reports' },
    ],
  },
  {
    icon: '🔧',
    title: 'Parts Inventory',
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    slug: 'inventory',
    articles: [
      { title: 'Adding parts to your inventory', time: '4 min', popular: false, slug: 'adding-parts' },
      { title: 'Setting minimum stock levels', time: '3 min', popular: false, slug: 'min-stock-levels' },
      { title: 'Linking parts to equipment', time: '4 min', popular: false, slug: 'linking-parts' },
      { title: 'Parts auto-deduction on work orders', time: '5 min', popular: false, slug: 'auto-deduction' },
      { title: 'Managing suppliers', time: '4 min', popular: false, slug: 'suppliers' },
    ],
  },
  {
    icon: '🌐',
    title: 'Edge Gateway',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    slug: 'edge-gateway',
    articles: [
      { title: 'Edge gateway setup & downloads', time: '8 min', popular: true, slug: '' },
      { title: 'Modbus, OPC UA, and MQTT connector examples', time: '10 min', popular: false, slug: 'connectors' },
      { title: 'Raspberry Pi, ESP32, and Node-RED deployment', time: '7 min', popular: false, slug: 'device-agents' },
      { title: 'OBD-II (cars / light trucks / vans)', time: '6 min', popular: false, slug: 'obd2' },
      { title: 'SAE J1939 (heavy trucks / off-highway)', time: '8 min', popular: false, slug: 'j1939' },
      { title: 'NMEA 2000 (vessels / boats / yachts)', time: '8 min', popular: false, slug: 'nmea2000' },
      { title: 'MAVLink (drones / UAVs)', time: '6 min', popular: false, slug: 'mavlink' },
    ],
  },
  {
    icon: '🚛',
    title: 'Vehicles, Vessels & UAVs',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    slug: 'vehicles',
    articles: [
      { title: 'Telematics importers (Geotab, Samsara, Verizon, Motive, Fleetio)', time: '10 min', popular: true, slug: '_telematics' },
      { title: 'DVIR / vessel / UAV work-order templates', time: '12 min', popular: false, slug: '_vehicle-templates' },
    ],
  },
  {
    icon: '🤖',
    title: 'AI & Predictive Maintenance',
    color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
    slug: 'ai',
    articles: [
      { title: 'How the anomaly engine works', time: '6 min', popular: true, slug: '_ai#how-it-works' },
      { title: 'Three AI models — Statistical / Hybrid / LLM-Assisted', time: '5 min', popular: false, slug: '_ai#models' },
      { title: 'Sensitivity, severity & quiet hours', time: '4 min', popular: false, slug: '_ai#sensitivity' },
      { title: 'Per-machine overrides & feedback loop', time: '5 min', popular: false, slug: '_ai#overrides' },
    ],
  },
  {
    icon: '⚡',
    title: 'API & Integrations',
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    slug: 'api',
    articles: [
      { title: 'API overview & authentication', time: '8 min', popular: false, slug: 'api-overview' },
      { title: 'Connecting Slack notifications', time: '5 min', popular: false, slug: 'slack-integration' },
      { title: 'Zapier integration guide', time: '6 min', popular: false, slug: 'zapier-integration' },
      { title: 'Exporting to QuickBooks', time: '5 min', popular: false, slug: 'quickbooks-export' },
      { title: 'Webhook setup & events', time: '8 min', popular: false, slug: 'webhooks' },
    ],
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface)]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0a2540] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold text-[#635bff] uppercase tracking-wider bg-[#1e3a5f] px-4 py-1.5 rounded-full mb-4">Documentation</span>
            <h1 className="text-4xl font-bold text-white mb-4">Myncel Help Center</h1>
            <p className="text-[var(--text-muted)] mb-6">Everything you need to get the most out of Myncel. Search guides, tutorials, and reference docs.</p>
            {/* Search bar */}
            <div className="relative">
              <svg className="absolute left-4 top-3.5 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search documentation…"
                className="w-full pl-11 pr-4 py-3 bg-[#1e3a5f] border border-[#2a4a7f] text-white placeholder-[#8898aa] rounded-xl focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/30 text-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Popular articles */}
      <section className="py-10 bg-[var(--bg-surface)] border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Popular Articles</h2>
          <div className="flex flex-wrap gap-3">
            {sections.flatMap(s => s.articles.filter(a => a.popular).map((art) => (
              <Link key={`${s.slug}-${art.slug}`} href={s.slug === 'edge-gateway' && art.slug === '' ? '/docs/edge-gateway' : art.slug.startsWith('_') ? `/docs/${art.slug.slice(1)}` : `/docs/${s.slug}/${art.slug}`} className="flex items-center gap-2 bg-[var(--bg-page)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] hover:border-[#635bff] hover:text-[#635bff] transition-colors">
                <svg className="w-3.5 h-3.5 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {art.title}
                <span className="text-xs text-[var(--text-muted)]">{art.time}</span>
              </Link>
            )))}
          </div>
        </div>
      </section>

      {/* Docs grid */}
      <section className="py-16 bg-[var(--bg-page)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {sections.map((section) => (
              <div key={section.slug} className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all`}>
                <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border mb-4 ${section.color}`}>
                  <span>{section.icon}</span>
                  {section.title}
                </div>
                <ul className="space-y-2.5">
                  {section.articles.map((art) => (
                    <li key={art.slug}>
                      <Link href={section.slug === 'edge-gateway' && art.slug === '' ? '/docs/edge-gateway' : art.slug.startsWith('_') ? `/docs/${art.slug.slice(1)}` : `/docs/${section.slug}/${art.slug}`} className="flex items-start gap-2 text-sm text-[var(--text-secondary)] hover:text-[#635bff] group transition-colors">
                        <svg className="w-3.5 h-3.5 mt-0.5 text-[#c0ccda] group-hover:text-[#635bff] flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="leading-tight">{art.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t border-[#f6f9fc]">
                  <Link href={`/docs/${section.slug}`} className="text-xs font-semibold text-[#635bff] hover:underline">View all {section.title} docs →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SupportSection />

      <Footer />
    </div>
  );
}