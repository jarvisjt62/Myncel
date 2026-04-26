import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Changelog — What's New in Myncel",
  description: 'Stay up to date with the latest Myncel features, improvements, and bug fixes.',
  alternates: { canonical: 'https://myncel.com/changelog' },
  openGraph: {
    title: "Myncel Changelog — Latest Features & Updates",
    description: "New features, improvements, and fixes shipped regularly.",
    url: 'https://myncel.com/changelog',
  },
};

async function getFeatureFlags() {
  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile('/tmp/myncel-feature-flags.json', 'utf8');
    return JSON.parse(data);
  } catch {
    return { customersPageEnabled: false, changelogEnabled: false, changelogNote: '' };
  }
}

export default async function Changelog() {
  const flags = await getFeatureFlags();

  const releases = [
    {
      version: '2.4.0',
      date: 'December 15, 2025',
      type: 'Major Release',
      typeColor: 'bg-violet-100 text-violet-700',
      highlights: ['Parts Inventory module', 'Bulk work order creation', 'Advanced analytics dashboard'],
      changes: [
        { type: 'new', text: 'Parts Inventory — track spare parts, set reorder levels, and auto-deduct on work order completion' },
        { type: 'new', text: 'Bulk work order creation — create up to 50 work orders at once from a CSV template' },
        { type: 'new', text: 'Advanced analytics dashboard with 12 new KPI charts and custom date ranges' },
        { type: 'new', text: 'Zapier integration — connect Myncel to 6,000+ apps with no code' },
        { type: 'improved', text: 'Work order photo uploads now support up to 10 photos per order (was 3)' },
        { type: 'improved', text: 'Email alerts now include a one-click "Mark Done" button so technicians never have to log in just to complete a task' },
        { type: 'fixed', text: 'Fixed a bug where recurring schedules with leap year dates would skip February 29' },
        { type: 'fixed', text: 'Fixed SMS alerts not sending in EST timezone after midnight' },
      ],
    },
    {
      version: '2.3.2',
      date: 'November 28, 2025',
      type: 'Bug Fix',
      typeColor: 'bg-rose-100 text-rose-700',
      highlights: ['Performance improvements', 'Mobile fixes'],
      changes: [
        { type: 'improved', text: 'Dashboard load time reduced by 60% for accounts with 30+ machines' },
        { type: 'improved', text: 'Mobile work order form now saves progress automatically every 30 seconds' },
        { type: 'fixed', text: 'Fixed work order due dates showing incorrect timezone on mobile' },
        { type: 'fixed', text: 'Fixed equipment list sorting reverting to default after navigating away' },
        { type: 'fixed', text: 'Fixed a rare issue where the analytics chart would show NaN for new accounts with no completed work orders' },
      ],
    },
    {
      version: '2.3.0',
      date: 'November 10, 2025',
      type: 'Feature Release',
      typeColor: 'bg-blue-100 text-blue-700',
      highlights: ['Multi-facility support', 'Technician roles', 'API v2'],
      changes: [
        { type: 'new', text: 'Multi-facility support — manage equipment across multiple locations' },
        { type: 'new', text: 'Technician role — new user type that only sees their assigned work orders' },
        { type: 'new', text: 'API v2 — faster, more consistent REST API with webhook support for all major events' },
        { type: 'new', text: 'Equipment QR codes — print QR codes for machines that link directly to their work order creation page' },
        { type: 'improved', text: 'Schedule templates — save and reuse maintenance schedule templates across multiple machines' },
        { type: 'fixed', text: 'Fixed an edge case where deleting a machine would not delete its associated open work orders' },
      ],
    },
    {
      version: '2.2.0',
      date: 'October 20, 2025',
      type: 'Feature Release',
      typeColor: 'bg-blue-100 text-blue-700',
      highlights: ['SMS alerts', 'Downtime tracking', 'CSV import'],
      changes: [
        { type: 'new', text: 'SMS notifications — get text alerts for overdue tasks and critical equipment events' },
        { type: 'new', text: 'Downtime tracking — log unplanned stoppages and link them to equipment for root-cause analysis' },
        { type: 'new', text: 'CSV import — bulk import equipment from a spreadsheet' },
        { type: 'new', text: 'Maintenance cost tracking — attach parts and labor costs to work orders for per-machine cost reports' },
        { type: 'improved', text: 'Dashboard redesigned with separate Equipment Status and Open Work Orders panels' },
      ],
    },
    {
      version: '2.1.0',
      date: 'September 30, 2025',
      type: 'Feature Release',
      typeColor: 'bg-blue-100 text-blue-700',
      highlights: ['Work order photos', 'Slack integration', 'Recurring task templates'],
      changes: [
        { type: 'new', text: 'Work order photos — technicians can attach photos from their phone when completing a task' },
        { type: 'new', text: 'Slack integration — get Myncel alerts and work order updates directly in your Slack channels' },
        { type: 'new', text: 'Recurring task templates — create reusable task checklists for common PM procedures' },
        { type: 'improved', text: 'Work order completion now requires a notes field before closing high-priority orders' },
        { type: 'fixed', text: 'Fixed scheduled export emails not sending on weekends' },
      ],
    },
    {
      version: '2.0.0',
      date: 'September 1, 2025',
      type: 'Major Release',
      typeColor: 'bg-violet-100 text-violet-700',
      highlights: ['Complete UI redesign', 'Mobile web app', 'New pricing plans'],
      changes: [
        { type: 'new', text: 'Complete UI redesign — cleaner, faster interface based on feedback from 150+ customers' },
        { type: 'new', text: 'Mobile web app — progressive web app experience for technicians on the shop floor' },
        { type: 'new', text: 'New pricing plans — Starter ($79), Growth ($149), Professional ($299)' },
        { type: 'new', text: 'Analytics module — uptime tracking, work order trends, and team performance metrics' },
        { type: 'improved', text: 'Navigation completely redesigned with faster access to all major features' },
        { type: 'fixed', text: 'Dozens of bug fixes and performance improvements from the v1.x series' },
      ],
    },
  ];

  const typeStyles: Record<string, string> = {
    new: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    improved: 'bg-blue-50 text-blue-700 border-blue-200',
    fixed: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  if (!flags.changelogEnabled) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f0f4f8] flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-[#8898aa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#0a2540] mb-3">Changelog Coming Soon</h1>
          <p className="text-[#425466] max-w-md mb-8 leading-relaxed">
            We're preparing detailed release notes for each version. Check back soon for a full history of features, improvements, and bug fixes.
          </p>
          <div className="flex gap-4">
            <Link href="/docs" className="bg-[#635bff] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#4f46e5] transition-colors">
              View documentation
            </Link>
            <Link href="/" className="border border-[#e6ebf1] text-[#425466] font-semibold px-6 py-3 rounded-lg hover:bg-[#f6f9fc] transition-colors">
              Back to home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Admin announcement banner */}
      {flags.changelogNote && (
        <div className="bg-violet-50 border-b border-violet-200 py-3">
          <div className="max-w-6xl mx-auto px-6">
            <p className="text-sm text-violet-800 text-center">{flags.changelogNote}</p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-[#f6f9fc] border-b border-[#e6ebf1] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="section-label">Changelog</span>
              <h1 className="text-4xl font-bold text-[#0a2540] mb-2">What's new in Myncel</h1>
              <p className="text-[#425466]">New features, improvements, and bug fixes — shipped regularly.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/docs" className="btn-stripe-primary text-sm">View docs →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Legend */}
      <section className="py-5 border-b border-[#e6ebf1] bg-white">
        <div className="max-w-4xl mx-auto px-6 flex items-center gap-4">
          <span className="text-xs text-[#8898aa] font-semibold uppercase tracking-wide">Legend:</span>
          {[
            { type: 'new', label: 'New Feature' },
            { type: 'improved', label: 'Improvement' },
            { type: 'fixed', label: 'Bug Fix' },
          ].map(item => (
            <span key={item.type} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${typeStyles[item.type]}`}>
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* Releases */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          {releases.map((release, i) => (
            <div key={i} className="border border-[#e6ebf1] rounded-2xl overflow-hidden">
              <div className="bg-[#f6f9fc] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e6ebf1]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#0a2540]">v{release.version}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${release.typeColor}`}>{release.type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2 flex-wrap">
                    {release.highlights.map(h => (
                      <span key={h} className="text-xs text-[#425466] bg-white border border-[#e6ebf1] px-2.5 py-1 rounded-full">{h}</span>
                    ))}
                  </div>
                  <span className="text-sm text-[#8898aa] whitespace-nowrap">{release.date}</span>
                </div>
              </div>
              <div className="px-6 py-5">
                <ul className="space-y-3">
                  {release.changes.map((change, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 capitalize ${typeStyles[change.type]}`}>
                        {change.type}
                      </span>
                      <span className="text-sm text-[#425466] leading-relaxed">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-14 bg-[#f6f9fc] border-t border-[#e6ebf1]">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-2">Stay up to date</h2>
          <p className="text-[#425466] text-sm mb-6">Get notified when we ship new features. Monthly digest — no spam.</p>
          <div className="flex gap-3">
            <input type="email" placeholder="you@company.com"
              className="flex-1 px-4 py-2.5 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
            <button className="bg-[#635bff] text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors whitespace-nowrap">
              Subscribe →
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}