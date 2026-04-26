import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: '10 Maintenance KPIs Every Plant Manager Should Track',
  description: 'MTBF, MTTR, OEE, schedule compliance — here\'s what each metric means, how to calculate it, and how to start tracking it without complex software.',
  alternates: { canonical: 'https://myncel.com/blog/maintenance-kpis-plant-manager' },
  openGraph: {
    title: '10 Maintenance KPIs Every Plant Manager Should Track',
    description: 'MTBF, MTTR, schedule compliance — what each metric means and how to track it.',
    url: 'https://myncel.com/blog/maintenance-kpis-plant-manager',
    type: 'article',
  },
}

const kpis = [
  {
    num: 1,
    name: 'PM Schedule Compliance',
    formula: '(PM tasks completed on time ÷ Total PM tasks scheduled) × 100',
    target: 'Target: >85%',
    why: 'This is the single most important leading indicator of your maintenance program\'s health. If compliance drops below 70%, you\'re essentially running reactive maintenance — you just don\'t know it yet.',
    howToTrack: 'Track every scheduled PM task and whether it was completed by its due date. Myncel calculates this automatically from your work order data.',
  },
  {
    num: 2,
    name: 'Mean Time Between Failures (MTBF)',
    formula: 'Total uptime hours ÷ Number of unplanned failures',
    target: 'Target: Increasing month-over-month',
    why: 'MTBF tells you how reliable your equipment is. A rising MTBF means your PM program is working. A flat or declining MTBF means something is being missed.',
    howToTrack: 'Log every unplanned failure as a work order. Track machine run hours. Myncel calculates MTBF per machine automatically.',
  },
  {
    num: 3,
    name: 'Mean Time To Repair (MTTR)',
    formula: 'Total repair time ÷ Number of repairs',
    target: 'Target: <4 hours for most equipment',
    why: 'MTTR measures your maintenance team\'s efficiency. A high MTTR might indicate parts availability issues, skill gaps, or poor documentation. Track it per machine type to find patterns.',
    howToTrack: 'Record the start and completion time on every work order. Myncel tracks this automatically when technicians update work order status.',
  },
  {
    num: 4,
    name: 'Planned vs. Unplanned Maintenance Ratio',
    formula: 'Planned maintenance hours ÷ Total maintenance hours',
    target: 'Target: >70% planned (world class: >90%)',
    why: 'This ratio is the most telling measure of your maintenance maturity. Most reactive shops run at 20-30% planned. As your PM program matures, this number should climb steadily toward 80-90%.',
    howToTrack: 'Categorize all work orders as planned (PM, scheduled) or unplanned (breakdown, emergency). Compare totals each month.',
  },
  {
    num: 5,
    name: 'Maintenance Cost as % of Replacement Asset Value (RAV)',
    formula: '(Annual maintenance spend ÷ Total asset replacement value) × 100',
    target: 'Target: 2-4% for manufacturing equipment',
    why: 'This benchmark tells you whether you\'re over- or under-investing in maintenance. Spending less than 2% usually means you\'re deferring maintenance. Spending more than 6% suggests reactive practices or aging equipment.',
    howToTrack: 'Track all maintenance labor, parts, and contractor costs against your equipment registry. Requires knowing replacement values for your machines.',
  },
  {
    num: 6,
    name: 'Work Order Backlog',
    formula: 'Number of open work orders older than X days',
    target: 'Target: Zero work orders >30 days old',
    why: 'A growing backlog is an early warning sign that your team is overwhelmed or tasks are being ignored. Review the backlog weekly and investigate any work order that\'s been open longer than 30 days.',
    howToTrack: 'Sort your open work orders by creation date. Myncel shows overdue work orders prominently in the dashboard.',
  },
  {
    num: 7,
    name: 'Emergency Work Order Rate',
    formula: '(Emergency work orders ÷ Total work orders) × 100',
    target: 'Target: <10%',
    why: 'Emergency work orders are the most expensive type of maintenance — they carry premium labor rates, expedited parts costs, and production losses. Track this rate monthly and investigate any machine generating frequent emergencies.',
    howToTrack: 'Flag work orders as "Emergency" vs "Routine" vs "Scheduled." Review the percentage each month.',
  },
  {
    num: 8,
    name: 'Parts Availability (First-Time Fix Rate)',
    formula: '(Work orders completed without parts delay ÷ Total work orders) × 100',
    target: 'Target: >80%',
    why: 'Parts delays are a major driver of extended downtime. If your technicians frequently can\'t complete a repair because a part isn\'t in stock, your inventory management needs attention.',
    howToTrack: 'Track whether each work order was delayed waiting for parts. Build this into your work order closure process.',
  },
  {
    num: 9,
    name: 'Maintenance Cost Per Machine',
    formula: 'Total maintenance spend on a machine ÷ Months tracked',
    target: 'Target: Declining or stable over time',
    why: 'Tracking cost per machine reveals your most expensive equipment. If one machine consistently costs more than comparable units, it may be a candidate for major overhaul or replacement.',
    howToTrack: 'Log labor hours and parts costs on every work order. Myncel\'s analytics show cost per machine automatically.',
  },
  {
    num: 10,
    name: 'Technician Utilization Rate',
    formula: '(Productive maintenance hours ÷ Total available hours) × 100',
    target: 'Target: 60-75% (leaves room for planning and training)',
    why: 'Utilization that\'s too low suggests overstaffing or poor planning. Utilization over 85% means your team has no buffer for unexpected failures — leading to rushed repairs and higher risk.',
    howToTrack: 'Track time-on-task through work order completion. Compare against scheduled hours per week.',
  },
]

export default function MaintenanceKPIs() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1a3a5c] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Analytics & Metrics</span>
            <span className="text-gray-400 text-sm">6 min read</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            10 Maintenance KPIs Every Plant Manager Should Track
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            MTBF, MTTR, schedule compliance — here's what each metric means, how to calculate it, and how to start tracking it without complex software.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">DP</div>
            <div>
              <div className="text-white font-medium">David Park</div>
              <div className="text-gray-400 text-sm">December 5, 2025 · 6 min read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-[#0a2540] text-lg mb-4">📋 In this article</h2>
          <ul className="space-y-2">
            {kpis.map(k => (
              <li key={k.num}>
                <a href={`#kpi-${k.num}`} className="text-[#635bff] hover:underline text-sm">{k.num}. {k.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            You can't improve what you don't measure. Most plant managers know this — but knowing which maintenance metrics to track, and what "good" looks like, is another matter entirely. Here are the 10 KPIs that give you the clearest picture of your maintenance program's health.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            A quick note before we dive in: you don't need to track all 10 of these at once. If you're just starting out, begin with PM Schedule Compliance and Planned vs. Unplanned Ratio. Get those right first, then layer in additional metrics as your program matures.
          </p>

          <div className="space-y-10 mb-8">
            {kpis.map(kpi => (
              <div key={kpi.num} id={`kpi-${kpi.num}`} className="border border-[#e6ebf1] rounded-2xl overflow-hidden">
                <div className="bg-[#0a2540] px-6 py-4 flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-[#635bff] text-white font-bold flex items-center justify-center text-sm flex-shrink-0">{kpi.num}</span>
                  <h2 className="text-white font-bold text-lg">{kpi.name}</h2>
                </div>
                <div className="p-6">
                  <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl p-4 mb-4">
                    <div className="text-xs font-semibold text-[#8898aa] uppercase tracking-wider mb-1">Formula</div>
                    <div className="font-mono text-sm text-[#635bff]">{kpi.formula}</div>
                  </div>
                  <div className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-4">{kpi.target}</div>
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-[#8898aa] uppercase tracking-wider mb-1">Why it matters</div>
                    <p className="text-[#425466] text-sm leading-relaxed">{kpi.why}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#8898aa] uppercase tracking-wider mb-1">How to track it</div>
                    <p className="text-[#425466] text-sm leading-relaxed">{kpi.howToTrack}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-[#0a2540] mb-3">Where to Start</h3>
            <p className="text-[#425466] text-sm leading-relaxed mb-3">
              If you're tracking maintenance in spreadsheets today, start by capturing three things on every work order:
            </p>
            <ul className="text-sm text-[#425466] space-y-2">
              <li className="flex gap-2"><span className="text-[#635bff] font-bold">1.</span> Was this work planned or unplanned?</li>
              <li className="flex gap-2"><span className="text-[#635bff] font-bold">2.</span> How long did it take (start to finish)?</li>
              <li className="flex gap-2"><span className="text-[#635bff] font-bold">3.</span> What parts were used and at what cost?</li>
            </ul>
            <p className="text-[#425466] text-sm leading-relaxed mt-3">
              With just these three data points, you can calculate 7 of the 10 KPIs above. Start there, then layer in more data over time.
            </p>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Track all 10 KPIs automatically</h3>
            <p className="text-purple-100 mb-6">Myncel calculates MTBF, MTTR, PM compliance, and more from your work order data — no spreadsheets required.</p>
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
              { href: '/blog/hidden-cost-reactive-maintenance', tag: 'Strategy', title: 'The Hidden Cost of Reactive Maintenance' },
              { href: '/blog/preventive-maintenance-program', tag: 'How-To', title: 'How to Build a Preventive Maintenance Program' },
              { href: '/blog/cmms-roi-calculation', tag: 'Analytics', title: 'How to Calculate the True ROI of a CMMS' },
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