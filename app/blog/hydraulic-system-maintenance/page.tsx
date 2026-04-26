import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Hydraulic System Maintenance: A Complete PM Checklist',
  description: 'Hydraulic failures are expensive and dangerous. This complete maintenance guide covers daily inspections, fluid analysis, seal replacement, pressure testing, and more.',
  alternates: { canonical: 'https://myncel.com/blog/hydraulic-system-maintenance' },
  openGraph: {
    title: 'Hydraulic System Maintenance: Complete PM Checklist',
    description: 'Complete hydraulic maintenance guide with daily, weekly, monthly, and annual checklists.',
    url: 'https://myncel.com/blog/hydraulic-system-maintenance',
    type: 'article',
  },
}

const checklistData = {
  daily: [
    { task: 'Check hydraulic fluid level in reservoir (should be at operating mark)', critical: true, time: '2 min' },
    { task: 'Inspect reservoir and all visible hoses for leaks', critical: true, time: '5 min' },
    { task: 'Check operating pressure gauge against normal range', critical: true, time: '1 min' },
    { task: 'Monitor system temperature (should not exceed 140°F / 60°C)', critical: true, time: '1 min' },
    { task: 'Listen for unusual noises (cavitation, knocking, or whining)', critical: true, time: '3 min' },
    { task: 'Inspect cylinder rods for scoring, pitting, or contamination', critical: false, time: '3 min' },
    { task: 'Check all visible fittings for seepage', critical: false, time: '3 min' },
  ],
  weekly: [
    { task: 'Clean breather/filler cap and inspect for contamination', critical: true, time: '10 min' },
    { task: 'Check all hose clamps and fittings for tightness', critical: true, time: '15 min' },
    { task: 'Inspect pump for vibration or heat buildup', critical: true, time: '5 min' },
    { task: 'Clean magnetic drain plug (remove, clean, reinstall)', critical: false, time: '10 min' },
    { task: 'Check pressure relief valve setting', critical: true, time: '5 min' },
    { task: 'Inspect all cylinders for rod seal leaks', critical: true, time: '10 min' },
    { task: 'Verify cooler fan operation and cooling system function', critical: false, time: '5 min' },
  ],
  monthly: [
    { task: 'Take fluid sample for analysis (contamination, viscosity, additive depletion)', critical: true, time: '15 min' },
    { task: 'Inspect all hoses for cracking, abrasion, or damage', critical: true, time: '20 min' },
    { task: 'Check all accumulator pre-charge pressures', critical: true, time: '20 min' },
    { task: 'Inspect servo and proportional valves for contamination', critical: false, time: '30 min' },
    { task: 'Check and clean heat exchanger fins', critical: true, time: '20 min' },
    { task: 'Test and verify all pressure switches and sensors', critical: false, time: '20 min' },
    { task: 'Inspect all pump drive couplings for wear', critical: true, time: '15 min' },
  ],
  quarterly: [
    { task: 'Replace return line filter', critical: true, time: '30 min' },
    { task: 'Replace pressure line filter (check differential first)', critical: true, time: '30 min' },
    { task: 'Full pressure test — check all circuits against spec', critical: true, time: '60 min' },
    { task: 'Inspect and test all safety relief valves', critical: true, time: '45 min' },
    { task: 'Check pump output volume and efficiency', critical: false, time: '45 min' },
    { task: 'Inspect all seal kits on actively-used cylinders', critical: false, time: '60 min' },
  ],
  annual: [
    { task: 'Complete fluid change — drain reservoir, flush, and refill', critical: true, time: '120 min' },
    { task: 'Replace all breather/filler assemblies', critical: true, time: '30 min' },
    { task: 'Pump inspection — internal wear measurement', critical: true, time: '180 min' },
    { task: 'Inspect and rebuild any leaking cylinders', critical: true, time: 'Variable' },
    { task: 'Calibrate all pressure gauges and transducers', critical: true, time: '60 min' },
    { task: 'Inspect all hoses and replace any showing age cracking or wear', critical: true, time: '60 min' },
    { task: 'Full system cleanliness flush to target ISO 4406 cleanliness level', critical: false, time: '240 min' },
  ],
}

export default function HydraulicMaintenance() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#3a2a10] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Equipment Guide</span>
            <span className="text-gray-400 text-sm">11 min read · Free checklist included</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            Hydraulic System Maintenance: A Complete PM Checklist
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Hydraulic failures are expensive and dangerous. This complete maintenance guide covers daily inspections, fluid analysis, seal replacement, pressure testing, and everything in between.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">TR</div>
            <div>
              <div className="text-white font-medium">Tom Reyes</div>
              <div className="text-gray-400 text-sm">October 24, 2025 · 11 min read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Download CTA */}
        <div className="bg-[#f6f9fc] border-2 border-[#635bff] rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center gap-4">
          <div className="text-4xl">🔧</div>
          <div className="flex-1">
            <h3 className="font-bold text-[#0a2540] mb-1">Download the printable version</h3>
            <p className="text-[#425466] text-sm">Get this checklist as a printable PDF — formatted for use on the shop floor.</p>
          </div>
          <Link href="/guides/pm-checklist" className="bg-[#635bff] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#4f46e5] transition-colors whitespace-nowrap text-sm">
            Download PDF →
          </Link>
        </div>

        <div className="prose prose-lg max-w-none">

          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            Hydraulic systems are among the most powerful and reliable components in manufacturing equipment — and among the most catastrophically expensive to repair when neglected. A failed hydraulic pump on a press can mean $15,000–40,000 in parts and labor, plus days of downtime. A ruptured high-pressure hose is a safety incident waiting to happen.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            The good news is that hydraulic failures are almost entirely preventable with consistent maintenance. Fluid contamination causes over 80% of all hydraulic system failures — and contamination is caught with regular fluid analysis, filter changes, and proper system cleaning practices.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
            <div className="flex gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="font-bold text-red-900 text-sm mb-1">Critical safety warning</h4>
                <p className="text-red-800 text-sm">Hydraulic systems operate under extreme pressure (1,500–5,000 PSI is common). Always follow lockout/tagout procedures and depressurize the system before performing maintenance. Never use your hand to check for hydraulic leaks — high-pressure injection injuries are life-threatening.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#0a2540] mt-12 mb-4">Understanding Hydraulic System Failure Modes</h2>
          <p className="text-[#425466] leading-relaxed mb-6">
            Before diving into the checklist, it helps to understand <em>why</em> hydraulic systems fail. The three root causes account for virtually all hydraulic failures:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '💧', title: 'Fluid Contamination', pct: '80%', desc: 'Particulate, water, and chemical contamination damages pumps, valves, and cylinders from the inside out.' },
              { icon: '🌡️', title: 'Overheating', pct: '10%', desc: 'Excessive heat degrades fluid viscosity, accelerates oxidation, and damages seals.' },
              { icon: '🔩', title: 'Mechanical Wear', pct: '10%', desc: 'Normal wear on pumps, motors, and cylinders — accelerated by contaminated or degraded fluid.' },
            ].map(({ icon, title, pct, desc }) => (
              <div key={title} className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-2xl font-bold text-[#635bff] mb-1">{pct}</div>
                <div className="font-bold text-[#0a2540] text-sm mb-2">{title}</div>
                <p className="text-xs text-[#425466]">{desc}</p>
              </div>
            ))}
          </div>

          {/* Checklist Sections */}
          {[
            { key: 'daily', label: '📅 Daily Inspection Checklist', color: 'emerald', desc: 'Daily checks take 15–20 minutes and catch the issues most likely to cause immediate failure. Make them part of the startup procedure for every shift.' },
            { key: 'weekly', label: '📆 Weekly Maintenance Checklist', color: 'blue', desc: 'Weekly tasks address components that degrade gradually. Budget 60 minutes per week for a typical hydraulic press or system.' },
            { key: 'monthly', label: '🗓️ Monthly Maintenance Checklist', color: 'purple', desc: 'Monthly maintenance includes fluid analysis and deeper inspections. Budget 2–3 hours per month for most hydraulic systems.' },
            { key: 'quarterly', label: '📊 Quarterly Maintenance Checklist', color: 'orange', desc: 'Quarterly tasks involve filter changes and pressure testing. Plan for a half-day of downtime per quarter.' },
            { key: 'annual', label: '📅 Annual Maintenance Checklist', color: 'red', desc: 'Annual service is a major event. Plan for 1–2 days of downtime and consider engaging a certified hydraulic technician for pump inspection.' },
          ].map(({ key, label, color, desc }) => {
            const tasks = checklistData[key as keyof typeof checklistData]
            const colorMap: Record<string, string> = {
              emerald: 'bg-emerald-500', blue: 'bg-blue-500',
              purple: 'bg-[#635bff]', orange: 'bg-orange-500', red: 'bg-red-500',
            }
            const bgMap: Record<string, string> = {
              emerald: 'bg-emerald-50 border-emerald-200', blue: 'bg-blue-50 border-blue-200',
              purple: 'bg-purple-50 border-purple-200', orange: 'bg-orange-50 border-orange-200',
              red: 'bg-red-50 border-red-200',
            }
            return (
              <div key={key} className="mb-12">
                <h2 className="text-2xl font-bold text-[#0a2540] mt-12 mb-3">{label}</h2>
                <p className="text-[#425466] mb-6">{desc}</p>
                <div className={`border rounded-2xl overflow-hidden ${bgMap[color]}`}>
                  <div className={`${colorMap[color]} px-4 py-2 flex items-center gap-4`}>
                    <span className="text-white text-xs font-bold w-16">CRITICAL</span>
                    <span className="text-white text-xs font-bold flex-1">TASK</span>
                    <span className="text-white text-xs font-bold w-16 text-right">TIME</span>
                  </div>
                  {tasks.map((item, i) => (
                    <div key={i} className={`flex items-center gap-4 px-4 py-3 ${i % 2 === 0 ? 'bg-white bg-opacity-60' : 'bg-white bg-opacity-30'} border-b border-white border-opacity-50`}>
                      <div className="w-16 flex-shrink-0">
                        {item.critical
                          ? <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded">Critical</span>
                          : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Standard</span>
                        }
                      </div>
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5"></div>
                        <span className="text-sm text-[#0a2540]">{item.task}</span>
                      </div>
                      <span className="text-xs text-[#425466] w-16 text-right flex-shrink-0">{item.time}</span>
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-white bg-opacity-80 flex justify-between items-center">
                    <span className="text-xs text-[#425466]">{tasks.filter(t => t.critical).length} critical tasks · {tasks.length} total tasks</span>
                  </div>
                </div>
              </div>
            )
          })}

          <h2 className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Hydraulic Fluid Analysis: What to Test and How to Read Results</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Fluid analysis is the single most cost-effective predictive maintenance tool for hydraulic systems. A $25–50 oil analysis can catch contamination issues before they cause $5,000+ in component damage.
          </p>

          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0a2540] text-white">
                  {['Test Parameter', 'What It Detects', 'Action Threshold'].map(h => (
                    <th key={h} className="text-left p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['ISO Cleanliness Code', 'Particulate contamination', 'Change fluid if >2 levels above target'],
                  ['Viscosity', 'Fluid degradation or wrong fluid mixed in', 'Change if >10% deviation from spec'],
                  ['Water content (ppm)', 'Water ingression (condensation, leaks)', 'Change if >500 ppm'],
                  ['Acid Number (AN)', 'Oxidation and additive depletion', 'Change if AN doubles from new oil'],
                  ['Particle count by size', 'Wear metal concentration', 'Investigate source if elevated'],
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

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Track all these tasks automatically</h3>
            <p className="text-purple-100 mb-6">Myncel automatically schedules your hydraulic maintenance, sends alerts before tasks are overdue, and maintains a complete service history for every machine.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-block bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                Start free trial →
              </Link>
              <Link href="/guides/pm-checklist" className="inline-block bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white hover:text-[#635bff] transition-colors">
                Download PDF checklist
              </Link>
            </div>
          </div>
        </div>

        {/* Related */}
        <div className="mt-16 pt-12 border-t border-[#e6ebf1]">
          <h3 className="text-xl font-bold text-[#0a2540] mb-6">Related articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/blog/cnc-machine-maintenance-checklist', tag: 'Equipment', title: 'CNC Machine Maintenance Checklist' },
              { href: '/blog/preventive-maintenance-program', tag: 'How-To', title: 'How to Build a Preventive Maintenance Program' },
              { href: '/blog/hidden-cost-reactive-maintenance', tag: 'Strategy', title: 'The Hidden Cost of Reactive Maintenance' },
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