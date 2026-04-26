import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'HACCP Maintenance Records: What You Need and How to Store Them',
  description: 'Food manufacturers face unique compliance requirements. Here\'s exactly what maintenance records FDA and USDA auditors look for — and how to keep them organized.',
  alternates: { canonical: 'https://myncel.com/blog/haccp-maintenance-records' },
  openGraph: {
    title: 'HACCP Maintenance Records: FDA & USDA Requirements Explained',
    description: 'What maintenance records food manufacturers need for FDA and USDA audits.',
    url: 'https://myncel.com/blog/haccp-maintenance-records',
    type: 'article',
  },
}

const requiredRecords = [
  {
    category: 'Preventive Controls',
    icon: '📋',
    records: [
      'Scheduled maintenance activities for food-contact equipment',
      'Verification that maintenance was completed as scheduled',
      'Corrective actions taken when maintenance was not completed on time',
      'Records of any maintenance that affected food safety',
    ],
  },
  {
    category: 'Sanitation Records',
    icon: '🧼',
    records: [
      'Cleaning and sanitation schedules for food-contact surfaces',
      'Completion logs for each sanitation activity',
      'Chemical concentrations and contact times',
      'Pre-operational inspection sign-offs',
    ],
  },
  {
    category: 'Equipment Calibration',
    icon: '⚖️',
    records: [
      'Calibration schedules for temperature, pressure, and weight measuring devices',
      'Calibration results and technician sign-off',
      'Out-of-calibration findings and corrective actions',
      'Equipment used for calibration (and its own calibration certificate)',
    ],
  },
  {
    category: 'Pest Control',
    icon: '🚫',
    records: [
      'Pest control service logs from licensed exterminator',
      'Findings and treatments applied',
      'Follow-up inspections after treatment',
      'Structural maintenance records related to pest entry points',
    ],
  },
]

export default function HACCPRecords() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1a4030] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-teal-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Compliance</span>
            <span className="text-gray-400 text-sm">9 min read</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            HACCP Maintenance Records: What You Need and How to Store Them
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Food manufacturers face unique compliance requirements. Here's exactly what maintenance records FDA and USDA auditors look for — and how to keep them audit-ready at all times.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">LT</div>
            <div>
              <div className="text-white font-medium">Linda Torres</div>
              <div className="text-gray-400 text-sm">November 14, 2025 · 9 min read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 py-3">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This article provides general guidance. Requirements vary by facility type, product category, and regulatory body. Consult your compliance team or a food safety consultant for facility-specific requirements.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-[#0a2540] text-lg mb-4">📋 In this article</h2>
          <ul className="space-y-2 text-sm">
            {[
              ['#why-it-matters', 'Why maintenance records matter for food safety compliance'],
              ['#what-records', 'What records FDA and USDA auditors look for'],
              ['#retention', 'How long to keep records'],
              ['#common-gaps', 'The 4 most common maintenance record gaps'],
              ['#organizing', 'How to keep records audit-ready'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-[#635bff] hover:underline">{label as string}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="prose prose-lg max-w-none">

          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            Food manufacturing has always required meticulous record-keeping. But since the FDA's Food Safety Modernization Act (FSMA) expanded preventive controls requirements in 2016, maintenance records have become a central part of food safety compliance — not just an operational nicety.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            If you're running a food processing facility — whether you're FDA-regulated, USDA-inspected, or SQF/BRC certified — your maintenance records need to be complete, accurate, and retrievable on demand. Here's what that means in practice.
          </p>

          <h2 id="why-it-matters" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Why Maintenance Records Matter for Food Safety Compliance</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Under FSMA's Preventive Controls for Human Food rule (21 CFR Part 117), food manufacturers must establish, implement, and monitor preventive controls — including equipment maintenance — as part of their Food Safety Plan. And critically, they must keep records proving they did so.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            For USDA-inspected facilities (meat, poultry, egg products), similar requirements exist under HACCP regulations (9 CFR Part 417). Third-party certification schemes like SQF, BRC, FSSC 22000, and AIB also require documented maintenance programs with auditable records.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-bold text-red-900 mb-1">What auditors actually check</h4>
                <p className="text-red-800 text-sm leading-relaxed">
                  FDA inspectors don't just ask if you have a maintenance program — they ask to see the records. Common requests include: "Show me the maintenance log for your metal detector for the last 6 months" and "When was your filler last calibrated, and where's the record?" If you can't retrieve it in minutes, it's a finding.
                </p>
              </div>
            </div>
          </div>

          <h2 id="what-records" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">What Records FDA and USDA Auditors Look For</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            While requirements vary by facility type and certification scheme, most food safety audits will look for records in four categories:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {requiredRecords.map((cat) => (
              <div key={cat.category} className="border border-[#e6ebf1] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="font-bold text-[#0a2540]">{cat.category}</h3>
                </div>
                <ul className="space-y-2">
                  {cat.records.map((record, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#425466]">
                      <span className="text-[#635bff] font-bold flex-shrink-0">✓</span>
                      {record}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 id="retention" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">How Long to Keep Records</h2>

          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0a2540] text-white">
                  {['Record Type', 'FDA (FSMA)', 'USDA (HACCP)', 'SQF/BRC'].map(h => (
                    <th key={h} className="text-left p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Preventive control monitoring', '2 years', '1 year', '1 year minimum'],
                  ['Calibration records', '2 years', '1 year', '1 year minimum'],
                  ['Corrective action records', '2 years', '1 year', '1 year minimum'],
                  ['Verification records', '2 years', '1 year', 'Per scheme requirement'],
                  ['Supplier verification', '3 years', 'N/A', 'Per scheme requirement'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f6f9fc]'}>
                    {row.map((cell, j) => (
                      <td key={j} className="p-3 border-b border-[#e6ebf1] text-[#425466]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[#425466] leading-relaxed mb-8">
            When in doubt, keep records for at least 2 years from creation date. For facilities under multiple regulatory frameworks, follow the most stringent requirement.
          </p>

          <h2 id="common-gaps" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">The 4 Most Common Maintenance Record Gaps</h2>

          <div className="space-y-4 mb-8">
            {[
              {
                title: 'Maintenance performed but not documented',
                desc: 'Technicians complete the work but don\'t log it. This is especially common for quick daily tasks. If it\'s not recorded, from a compliance standpoint it didn\'t happen.',
              },
              {
                title: 'Records exist but aren\'t retrievable quickly',
                desc: 'Paper binders, local spreadsheets, or email threads mean it takes 30+ minutes to pull records for a specific machine and date range. Auditors notice — and it signals disorganization.',
              },
              {
                title: 'Corrective action records are missing',
                desc: 'When a PM was skipped or equipment was found in a degraded state, you need a corrective action record explaining what was done and when. Most shops document the repair but not the corrective action reasoning.',
              },
              {
                title: 'Calibration records are separate from maintenance records',
                desc: 'Calibration logs often live in a separate binder from maintenance logs. Auditors want to see the complete equipment history in one place — not hunt across multiple systems.',
              },
            ].map(({ title, desc }, i) => (
              <div key={i} className="flex gap-4 p-5 border border-red-100 bg-red-50 rounded-xl">
                <span className="text-red-500 text-xl flex-shrink-0 font-bold">{i + 1}</span>
                <div>
                  <h4 className="font-bold text-red-900 mb-1">{title}</h4>
                  <p className="text-red-700 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 id="organizing" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">How to Keep Records Audit-Ready</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            The key to audit readiness is that records need to be complete, timestamped, and searchable. Here's the standard that world-class food manufacturers hold themselves to:
          </p>

          <div className="space-y-4 mb-8">
            {[
              { title: 'Every task generates a record', desc: 'Whether a PM was completed or skipped, there\'s a record. If skipped: a brief note explaining why and what the corrective action was.' },
              { title: 'Records are searchable by machine, date, and task type', desc: 'When an auditor asks "show me all maintenance on Line 2 filler from January to June," you can produce it in under 5 minutes.' },
              { title: 'Records include who, what, when, and result', desc: 'Technician name (or ID), task performed, date and time completed, and any findings or issues noted.' },
              { title: 'Corrective actions are documented separately', desc: 'When something is out of spec or a task was missed, the corrective action — including root cause and resolution — is logged as a separate record linking back to the original finding.' },
              { title: 'Records are retained electronically with backups', desc: 'Paper records are vulnerable to loss, damage, and illegibility. Digital records in a centralized system are searchable, backed up, and harder to dispute.' },
            ].map(({ title, desc }, i) => (
              <div key={i} className="flex gap-3 p-4 bg-white border border-[#e6ebf1] rounded-xl">
                <span className="text-[#635bff] font-bold text-lg flex-shrink-0">✓</span>
                <div>
                  <h4 className="font-bold text-[#0a2540] text-sm mb-1">{title}</h4>
                  <p className="text-[#425466] text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Keep all your maintenance records in one place</h3>
            <p className="text-purple-100 mb-6">Myncel automatically timestamps every work order, tracks who completed it, and stores your complete maintenance history — making FDA and USDA audit prep straightforward.</p>
            <Link href="/signup" className="inline-block bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Start free trial →
            </Link>
          </div>
        </div>

        {/* Related */}
        <div className="mt-16 pt-12 border-t border-[#e6ebf1]">
          <h3 className="text-xl font-bold text-[#0a2540] mb-6">Related articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/blog/preventive-maintenance-program', tag: 'How-To', title: 'How to Build a Preventive Maintenance Program' },
              { href: '/blog/maintenance-kpis-plant-manager', tag: 'Analytics', title: '10 Maintenance KPIs Every Plant Manager Should Track' },
              { href: '/blog/cnc-machine-maintenance-checklist', tag: 'Equipment', title: 'CNC Machine Maintenance Checklist' },
            ].map(({ href, tag, title }) => (
              <Link key={href} href={href} className="block p-4 border border-[#e6ebf1] rounded-xl hover:border-[#635bff] transition-colors">
                <span className="text-xs font-semibold text-[#635bff]">{tag}</span>
                <p className="text-sm font-medium text-[#0a2540] mt-1">{title}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}