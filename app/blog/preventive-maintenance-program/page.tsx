import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'How to Build a Preventive Maintenance Program for a Small Manufacturing Shop',
  description: 'A step-by-step guide to building a preventive maintenance program from scratch. Includes free PM schedule templates, equipment prioritization framework, and a 30-day implementation plan for small shops.',
  alternates: { canonical: 'https://myncel.com/blog/preventive-maintenance-program' },
  openGraph: {
    title: 'How to Build a Preventive Maintenance Program — Complete Guide',
    description: 'Step-by-step guide with free templates. Build a PM program that prevents breakdowns and saves money.',
    url: 'https://myncel.com/blog/preventive-maintenance-program',
    type: 'article',
  },
}

export default function PreventiveMaintenanceProgram() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1a3a5c] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">How-To Guide</span>
            <span className="text-gray-400 text-sm">12 min read</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            How to Build a Preventive Maintenance Program for a Small Manufacturing Shop
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            A practical, step-by-step guide — no consultants, no $50K software, no MBA required. Just a clear process that works for shops with 3 to 50 machines.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">SR</div>
            <div>
              <div className="text-white font-medium">Sarah Rodriguez</div>
              <div className="text-gray-400 text-sm">January 6, 2026 · 12 min read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* TOC */}
        <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-[#0a2540] text-lg mb-4">📋 What you'll learn</h2>
          <ul className="space-y-2">
            {[
              ['#what-is-pm', 'What preventive maintenance actually means (and doesn\'t)'],
              ['#why-pm-fails', 'Why most PM programs fail within 90 days'],
              ['#step-by-step', 'The 6-step process to build a PM program that sticks'],
              ['#pm-schedule', 'How to build your PM schedule (with a free template)'],
              ['#kpis', 'The 3 metrics that tell you if your program is working'],
              ['#tools', 'Tools that make it easier (free and paid)'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-[#635bff] hover:underline text-sm">{label as string}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="prose prose-lg max-w-none">

          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            The difference between a shop that runs smoothly and one that's constantly fighting fires usually comes down to one thing: a real preventive maintenance program. Not a spreadsheet. Not good intentions. A documented, systematic process that runs whether or not the plant manager is in the building.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            This guide walks you through exactly how to build one — from scratch, without a consultant, and without spending more than a weekend of effort. We've helped 200+ small manufacturers implement PM programs, and this is the process that works.
          </p>

          {/* What is PM */}
          <h2 id="what-is-pm" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">What Preventive Maintenance Actually Means</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Preventive maintenance (PM) is any maintenance work performed on a schedule — before a failure occurs — with the goal of extending equipment life and preventing unplanned downtime. It's the opposite of reactive maintenance, which is fixing things after they break.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            PM tasks typically fall into four categories:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { icon: '🔧', title: 'Time-based PM', desc: 'Tasks performed on a fixed calendar schedule (e.g., lubricate bearings every 30 days)' },
              { icon: '⏱️', title: 'Usage-based PM', desc: 'Tasks triggered by equipment runtime hours (e.g., change oil every 500 hours)' },
              { icon: '👁️', title: 'Condition-based PM', desc: 'Tasks triggered by observable conditions (e.g., replace filter when pressure drops below X)' },
              { icon: '📋', title: 'Predictive PM', desc: 'Using data and sensors to predict failures before they happen (vibration analysis, thermal imaging)' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-5 bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl">
                <div className="text-2xl mb-2">{icon}</div>
                <h4 className="font-bold text-[#0a2540] text-sm mb-1">{title}</h4>
                <p className="text-[#425466] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <p className="text-[#425466] leading-relaxed mb-8">
            For most small shops, starting with time-based and usage-based PM gives you 80% of the benefit. You don't need sensors or AI to dramatically reduce your breakdown rate. You just need to do the basics consistently.
          </p>

          {/* Why PM fails */}
          <h2 id="why-pm-fails" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Why Most PM Programs Fail Within 90 Days</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            We've seen this pattern dozens of times: a plant manager reads an article about PM, spends a weekend building a spreadsheet, assigns tasks to technicians, and then — three months later — the spreadsheet is out of date, nobody is following the schedule, and the shop is back to reactive maintenance.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">The three reasons PM programs fail are always the same:</p>

          <div className="space-y-4 mb-8">
            {[
              { title: 'Too complex to start', desc: 'They try to build a PM program for every machine at once. The scope becomes overwhelming and the program never gets off the ground.' },
              { title: 'No accountability mechanism', desc: 'Tasks are listed but there\'s no system to track whether they were actually done. Without accountability, compliance drops quickly.' },
              { title: 'No visible results early on', desc: 'PM takes weeks or months to show its impact. Without early wins and visible data, teams lose motivation and revert to old habits.' },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-4 p-5 border border-red-100 bg-red-50 rounded-xl">
                <span className="text-red-500 text-xl flex-shrink-0">✗</span>
                <div>
                  <h4 className="font-bold text-red-900 mb-1">{title}</h4>
                  <p className="text-red-700 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[#425466] leading-relaxed mb-8">
            The process below is specifically designed to avoid all three failure modes. Start small, build in accountability from day one, and create quick wins that build momentum.
          </p>

          {/* 6 steps */}
          <h2 id="step-by-step" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">The 6-Step Process to Build a PM Program That Sticks</h2>

          <div className="space-y-8 mb-8">
            {[
              {
                step: 1, title: 'Create your equipment inventory',
                body: 'Start by listing every piece of production equipment in your shop. For each machine, record: the manufacturer and model, year of manufacture or purchase, current condition (good/fair/poor), and its criticality to production (high/medium/low). This is your asset register — the foundation of your entire PM program. Don\'t skip it.',
                tip: 'Pro tip: Take photos of each machine\'s nameplate while you\'re doing the inventory. You\'ll need the model number when looking up manufacturer maintenance specs.'
              },
              {
                step: 2, title: 'Gather manufacturer maintenance specs',
                body: 'For each machine, find the manufacturer\'s recommended maintenance schedule. This is usually in the operator manual — check the manufacturer\'s website if you don\'t have a physical copy. Most manufacturers specify service intervals in both time (every 90 days) and usage (every 500 hours). Use these as your starting point.',
                tip: 'Can\'t find the manual? Call the manufacturer\'s service line — they\'ll usually email you a PDF for free.'
              },
              {
                step: 3, title: 'Prioritize by criticality',
                body: 'You don\'t have the time or resources to implement PM for every machine at once. Rank your equipment by how critical it is to production. High-criticality machines: if they go down, production stops entirely. Medium: they slow you down but you can work around them. Low: inconvenient but not production-stopping. Start with your top 5–10 high-criticality machines.',
              },
              {
                step: 4, title: 'Build your PM task list for each machine',
                body: 'For each high-priority machine, create a list of specific PM tasks with: the task description (e.g., "Check hydraulic fluid level and top off if below MIN line"), the frequency (daily, weekly, monthly, quarterly, annually, or by hours), the estimated time to complete, the parts/consumables needed, and who is responsible.',
              },
              {
                step: 5, title: 'Set up your tracking system',
                body: 'This is where most shops make a mistake — they use a spreadsheet. As we discussed earlier, spreadsheets are passive. You need a system that actively reminds you when tasks are due, tracks completion, and gives you visibility into your overall compliance rate. More on tools below.',
              },
              {
                step: 6, title: 'Run your first month, then review',
                body: 'Launch your PM program for just your top 5 machines. After 30 days, review: What percentage of tasks were completed on time? Were any tasks skipped repeatedly? Did you catch any issues during PM that would have become breakdowns? Use this data to refine your process before expanding to more equipment.',
                tip: 'Celebrate the first prevented breakdown. When a technician finds a worn bearing during a PM check and replaces it before it fails, make sure the team knows what was avoided. It builds buy-in.'
              },
            ].map(({ step, title, body, tip }) => (
              <div key={step} className="border border-[#e6ebf1] rounded-2xl overflow-hidden">
                <div className="bg-[#635bff] px-6 py-3 flex items-center gap-3">
                  <span className="text-white font-bold text-lg">Step {step}</span>
                  <span className="text-purple-200 font-medium">{title}</span>
                </div>
                <div className="p-6">
                  <p className="text-[#425466] leading-relaxed mb-4">{body}</p>
                  {tip && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                      💡 {tip}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PM Schedule template */}
          <h2 id="pm-schedule" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">How to Build Your PM Schedule</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            A PM schedule is simply a calendar of maintenance tasks. Here's a simple format that works for any shop:
          </p>

          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0a2540] text-white">
                  {['Machine', 'Task', 'Frequency', 'Est. Time', 'Assigned To', 'Next Due'].map(h => (
                    <th key={h} className="text-left p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['CNC Mill #1', 'Check coolant level & pH', 'Daily', '5 min', 'Operator', 'Every shift'],
                  ['CNC Mill #1', 'Clean chip conveyor', 'Daily', '10 min', 'Operator', 'Every shift'],
                  ['CNC Mill #1', 'Lubricate spindle bearings', 'Weekly', '15 min', 'Tech A', 'Every Monday'],
                  ['CNC Mill #1', 'Replace coolant', 'Monthly', '45 min', 'Tech A', '1st of month'],
                  ['Hydraulic Press', 'Check fluid level', 'Weekly', '5 min', 'Operator', 'Every Monday'],
                  ['Hydraulic Press', 'Inspect hoses & fittings', 'Monthly', '20 min', 'Tech B', '1st of month'],
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

          {/* KPIs */}
          <h2 id="kpis" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">The 3 Metrics That Tell You If Your Program Is Working</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { metric: 'PM Compliance Rate', formula: '(Tasks completed on time ÷ Total tasks scheduled) × 100', target: 'Target: >85%', desc: 'The most fundamental metric. Below 70%, your program isn\'t functioning. Above 90%, you\'re doing great.' },
              { metric: 'Mean Time Between Failures', formula: 'Total uptime hours ÷ Number of failures', target: 'Target: Increasing month-over-month', desc: 'As your PM program matures, this number should go up. If it\'s flat or falling, your PM tasks need adjustment.' },
              { metric: 'Planned vs. Unplanned Ratio', formula: 'Planned maintenance hours ÷ Total maintenance hours', target: 'Target: >70% planned', desc: 'World-class shops run 80–90% planned maintenance. Most small shops start at 20–30% planned. Track the trend.' },
            ].map(({ metric, formula, target, desc }) => (
              <div key={metric} className="p-5 bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl">
                <h4 className="font-bold text-[#0a2540] text-sm mb-2">{metric}</h4>
                <div className="text-xs font-mono bg-white border border-[#e6ebf1] rounded p-2 mb-2 text-[#635bff]">{formula}</div>
                <div className="text-xs font-bold text-emerald-600 mb-2">{target}</div>
                <p className="text-xs text-[#425466]">{desc}</p>
              </div>
            ))}
          </div>

          {/* Tools */}
          <h2 id="tools" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Tools That Make It Easier</h2>

          <div className="space-y-3 mb-8">
            {[
              { name: 'Myncel (Recommended)', price: 'From $79/mo', desc: 'Built specifically for small manufacturers. Handles PM scheduling, work orders, alerts, parts inventory, and analytics. Setup in 15 minutes.', badge: 'Best for small shops' },
              { name: 'Google Sheets / Excel', price: 'Free', desc: 'Good for getting started if you have zero budget. Limited by the passive nature of spreadsheets — no automatic alerts or accountability tracking.', badge: null },
              { name: 'Fiix CMMS', price: 'From $45/user/mo', desc: 'More powerful than Myncel for larger operations. More complex to set up. Better suited for 50+ machine operations.', badge: null },
              { name: 'UpKeep', price: 'From $45/user/mo', desc: 'Mobile-first CMMS with strong work order management. Good choice if your technicians are primarily mobile.', badge: null },
            ].map(({ name, price, desc, badge }) => (
              <div key={name} className="flex gap-4 p-5 border border-[#e6ebf1] rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[#0a2540] text-sm">{name}</h4>
                    {badge && <span className="text-xs bg-[#635bff] text-white px-2 py-0.5 rounded-full">{badge}</span>}
                  </div>
                  <p className="text-[#425466] text-sm">{desc}</p>
                </div>
                <div className="text-sm font-semibold text-[#635bff] whitespace-nowrap">{price}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Get your free PM checklist template</h3>
            <p className="text-purple-100 mb-6">Download our Ultimate PM Checklist — a ready-to-use template used by 200+ manufacturers. Includes task lists for CNC machines, hydraulic presses, compressors, conveyors, and more.</p>
            <Link href="/guides/pm-checklist" className="inline-block bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Download free checklist →
            </Link>
          </div>
        </div>

        {/* Related */}
        <div className="mt-16 pt-12 border-t border-[#e6ebf1]">
          <h3 className="text-xl font-bold text-[#0a2540] mb-6">Related articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/blog/hidden-cost-reactive-maintenance', tag: 'Strategy', title: 'The Hidden Cost of Reactive Maintenance' },
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