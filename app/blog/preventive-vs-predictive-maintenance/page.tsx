import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'The Difference Between Preventive and Predictive Maintenance',
  description: 'Preventive vs. predictive vs. reactive maintenance — what each approach costs, where each works best, and how to combine them effectively.',
  alternates: { canonical: 'https://myncel.com/blog/preventive-vs-predictive-maintenance' },
  openGraph: {
    title: 'Preventive vs. Predictive vs. Reactive Maintenance: What\'s the Difference?',
    description: 'What each maintenance approach costs and where each one works best.',
    url: 'https://myncel.com/blog/preventive-vs-predictive-maintenance',
    type: 'article',
  },
}

export default function PreventiveVsPredictive() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1a2a5c] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Maintenance Strategy</span>
            <span className="text-gray-400 text-sm">7 min read</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            The Difference Between Preventive and Predictive Maintenance
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Preventive vs. predictive vs. reactive maintenance — what each approach costs, where each works best, and how small manufacturers should combine them.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">SC</div>
            <div>
              <div className="text-white font-medium">Sarah Chen</div>
              <div className="text-gray-400 text-sm">November 7, 2025 · 7 min read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-[#0a2540] text-lg mb-4">📋 In this article</h2>
          <ul className="space-y-2 text-sm">
            {[
              ['#reactive', 'Reactive maintenance: what it is and when it makes sense'],
              ['#preventive', 'Preventive maintenance: the foundation of a reliable program'],
              ['#predictive', 'Predictive maintenance: powerful but not for everyone'],
              ['#comparison', 'Head-to-head comparison'],
              ['#right-approach', 'Which approach is right for your shop?'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-[#635bff] hover:underline">{label as string}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="prose prose-lg max-w-none">

          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            The maintenance industry loves its acronyms and jargon. PM, PdM, RCM, CBM — it can feel like you need a glossary just to follow the conversation. But the underlying concepts are straightforward, and understanding the differences helps you make better decisions about where to invest your maintenance budget.
          </p>

          <h2 id="reactive" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Reactive Maintenance: Fix It When It Breaks</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Reactive maintenance (also called corrective or breakdown maintenance) is exactly what it sounds like: you wait for something to fail, then fix it. No schedule, no planning — just response.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h4 className="font-bold text-green-900 mb-3">When reactive makes sense</h4>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• Low-criticality equipment where downtime has minimal impact</li>
                <li>• Equipment with no pattern of age-related failure</li>
                <li>• Cheap, easily replaceable components (light bulbs, fuses)</li>
                <li>• Equipment where repair cost is less than prevention cost</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h4 className="font-bold text-red-900 mb-3">When reactive is a problem</h4>
              <ul className="text-sm text-red-800 space-y-2">
                <li>• Production-critical equipment where downtime stops the line</li>
                <li>• Equipment where failure causes safety risks</li>
                <li>• Machines where one failure cascades to others</li>
                <li>• Equipment with long lead times on parts or service</li>
              </ul>
            </div>
          </div>

          <p className="text-[#425466] leading-relaxed mb-8">
            The problem for most small manufacturers is that they run reactive maintenance everywhere — including on equipment where it's genuinely costly. The typical small shop spends 3-4x more on reactive repairs than they would on planned maintenance for the same equipment.
          </p>

          <h2 id="preventive" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Preventive Maintenance: Scheduled, Systematic Care</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Preventive maintenance (PM) is maintenance performed on a fixed schedule — before failure occurs — to extend equipment life and prevent unplanned downtime. Tasks are triggered by time (every 90 days), usage (every 500 run hours), or a combination of both.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            PM is the workhorse of manufacturing maintenance. It's not glamorous, but it accounts for the vast majority of maintenance value at most facilities. Industry data consistently shows that a well-executed PM program prevents 70-80% of all equipment failures.
          </p>

          <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-8">
            <h4 className="font-bold text-[#0a2540] mb-3">What makes PM work</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '📅', title: 'Consistent scheduling', desc: 'Tasks run on a fixed calendar or usage-based trigger, not when someone remembers' },
                { icon: '✅', title: 'Accountability', desc: 'Every task is assigned to a specific person and tracked to completion' },
                { icon: '📊', title: 'History', desc: 'Every completed PM is logged with timestamp, technician, parts used, and any findings' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="text-center p-4">
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="font-bold text-[#0a2540] text-sm mb-1">{title}</div>
                  <div className="text-xs text-[#425466]">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <h2 id="predictive" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Predictive Maintenance: Data-Driven Precision</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Predictive maintenance (PdM) uses real-time data — vibration measurements, thermal imaging, oil analysis, ultrasonic testing — to predict when equipment is likely to fail. Instead of maintaining on a fixed schedule, you maintain when the data says it's needed.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            The appeal is obvious: instead of replacing a bearing every 6 months whether it needs it or not, you replace it exactly when the vibration signature tells you it's about to fail. In theory, this maximizes parts life, minimizes unnecessary maintenance work, and catches failures before they happen.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-bold text-amber-900 mb-1">The reality for small manufacturers</h4>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Predictive maintenance requires significant upfront investment — vibration analyzers, thermal cameras, oil analysis subscriptions, and the expertise to interpret the data. For a 10-50 machine shop, the ROI calculation rarely works out. Most small manufacturers are better served by excellent preventive maintenance than by mediocre predictive maintenance.
                </p>
              </div>
            </div>
          </div>

          <h2 id="comparison" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Head-to-Head Comparison</h2>

          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0a2540] text-white">
                  {['', 'Reactive', 'Preventive', 'Predictive'].map(h => (
                    <th key={h} className="text-left p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['When work happens', 'After failure', 'On schedule', 'When data indicates need'],
                  ['Upfront cost', 'Low', 'Low–medium', 'High'],
                  ['Ongoing cost', 'High (emergency rates)', 'Medium', 'Medium–high'],
                  ['Downtime impact', 'High (unplanned)', 'Low', 'Very low'],
                  ['Parts utilization', 'Variable', 'Some waste', 'Optimized'],
                  ['Data requirements', 'None', 'Minimal', 'Substantial'],
                  ['Best for', 'Non-critical equipment', 'Most manufacturing equipment', 'High-value, critical assets'],
                  ['Implementation complexity', 'None', 'Low–medium', 'High'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f6f9fc]'}>
                    <td className="p-3 border-b border-[#e6ebf1] font-medium text-[#0a2540]">{row[0]}</td>
                    <td className="p-3 border-b border-[#e6ebf1] text-[#425466]">{row[1]}</td>
                    <td className="p-3 border-b border-[#e6ebf1] text-[#425466] bg-purple-50">{row[2]}</td>
                    <td className="p-3 border-b border-[#e6ebf1] text-[#425466]">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 id="right-approach" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Which Approach Is Right for Your Shop?</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Most maintenance professionals agree: the answer isn't choosing one approach, it's using the right approach for each piece of equipment. Here's a simple framework:
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                label: 'Low criticality equipment',
                approach: 'Reactive',
                color: 'bg-gray-100 border-gray-300',
                textColor: 'text-gray-700',
                desc: 'If it goes down, it\'s inconvenient but not production-stopping. Let it run to failure and fix it when it breaks.',
              },
              {
                label: 'Medium criticality equipment',
                approach: 'Preventive',
                color: 'bg-purple-50 border-purple-300',
                textColor: 'text-purple-700',
                desc: 'The backbone of your maintenance program. Schedule regular PMs based on manufacturer specs and operating hours.',
              },
              {
                label: 'High criticality equipment',
                approach: 'Preventive + Condition Monitoring',
                color: 'bg-blue-50 border-blue-300',
                textColor: 'text-blue-700',
                desc: 'Your most critical assets. Run a strong PM program and add manual condition checks (vibration feel, temperature, noise) at regular intervals.',
              },
            ].map(({ label, approach, color, textColor, desc }) => (
              <div key={label} className={`flex gap-4 p-5 border rounded-xl ${color}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white ${textColor}`}>{approach}</span>
                  </div>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[#425466] leading-relaxed mb-8">
            For most small manufacturers with 5–50 machines, the highest-ROI investment is building an excellent preventive maintenance program. Get PM compliance above 85%, build a complete maintenance history, and reduce your reactive maintenance ratio below 30%. Do that first — then consider whether predictive techniques make sense for specific high-value assets.
          </p>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Build your preventive maintenance program</h3>
            <p className="text-purple-100 mb-6">Myncel makes it easy to schedule PMs, track compliance, and build the maintenance history that drives better decisions.</p>
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
              { href: '/blog/hidden-cost-reactive-maintenance', tag: 'Strategy', title: 'The Hidden Cost of Reactive Maintenance' },
              { href: '/blog/maintenance-kpis-plant-manager', tag: 'Analytics', title: '10 Maintenance KPIs Every Plant Manager Should Track' },
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