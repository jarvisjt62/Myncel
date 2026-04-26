import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'CNC Machine Maintenance Checklist: Daily, Weekly, Monthly & Annual Tasks',
  description: 'A complete CNC machine maintenance checklist covering daily, weekly, monthly, quarterly, and annual tasks for CNC mills, lathes, and machining centers. Free printable PDF included.',
  alternates: { canonical: 'https://myncel.com/blog/cnc-machine-maintenance-checklist' },
  openGraph: {
    title: 'CNC Machine Maintenance Checklist (Daily, Weekly, Monthly)',
    description: 'Free printable CNC maintenance checklist for mills, lathes, and machining centers. Prevent breakdowns and extend machine life.',
    url: 'https://myncel.com/blog/cnc-machine-maintenance-checklist',
    type: 'article',
  },
}

const checklistData = {
  daily: [
    { task: 'Check coolant level and top off if below MIN line', time: '2 min', critical: true },
    { task: 'Check coolant concentration (should be 6–10% for most applications)', time: '3 min', critical: true },
    { task: 'Inspect coolant for contamination, smell, or discoloration', time: '1 min', critical: false },
    { task: 'Clean chip conveyor and chip collection area', time: '10 min', critical: true },
    { task: 'Wipe down exterior surfaces and control panel', time: '5 min', critical: false },
    { task: 'Check lubrication system oil level (way lube)', time: '2 min', critical: true },
    { task: 'Inspect all axes for smooth movement (jog each axis)', time: '3 min', critical: true },
    { task: 'Check for any unusual noises or vibration during warm-up', time: '5 min', critical: true },
    { task: 'Verify tool holders are properly seated and clean', time: '3 min', critical: false },
    { task: 'Clean and inspect spindle taper', time: '3 min', critical: true },
    { task: 'Check air pressure at machine inlet (should be 80–100 PSI)', time: '1 min', critical: true },
    { task: 'Drain water separator on air line', time: '1 min', critical: false },
  ],
  weekly: [
    { task: 'Lubricate all greased points per manufacturer spec', time: '15 min', critical: true },
    { task: 'Clean and inspect linear guide rails and ball screws', time: '20 min', critical: true },
    { task: 'Check and clean coolant tank strainer/filter', time: '10 min', critical: true },
    { task: 'Inspect all coolant lines and nozzles for blockage', time: '10 min', critical: false },
    { task: 'Check hydraulic fluid level (if applicable)', time: '3 min', critical: true },
    { task: 'Inspect all electrical connections in control cabinet (visual only)', time: '10 min', critical: false },
    { task: 'Clean control cabinet air filters', time: '10 min', critical: true },
    { task: 'Inspect tool changer mechanism and clean as needed', time: '15 min', critical: true },
    { task: 'Check all limit switches and home position sensors', time: '10 min', critical: false },
    { task: 'Verify spindle orientation and reference positions', time: '5 min', critical: false },
  ],
  monthly: [
    { task: 'Replace coolant if contaminated or pH out of range', time: '60 min', critical: true },
    { task: 'Full lubrication of all axes — check auto-lube pump function', time: '30 min', critical: true },
    { task: 'Inspect and clean spindle air purge ports', time: '15 min', critical: false },
    { task: 'Check spindle bearing temperature during operation', time: '10 min', critical: true },
    { task: 'Inspect all belts for wear, cracking, or proper tension', time: '20 min', critical: true },
    { task: 'Check and adjust axis backlash if needed', time: '30 min', critical: false },
    { task: 'Inspect all safety guards and interlocks', time: '15 min', critical: true },
    { task: 'Clean and inspect chip auger motor', time: '20 min', critical: false },
    { task: 'Check hydraulic system pressure and filter condition', time: '15 min', critical: true },
    { task: 'Inspect all hoses and fittings for leaks or wear', time: '20 min', critical: true },
    { task: 'Back up machine parameters and programs', time: '15 min', critical: true },
    { task: 'Clean and lubricate pallet changer (if equipped)', time: '20 min', critical: false },
  ],
  quarterly: [
    { task: 'Replace spindle oil (if oil-lubricated spindle)', time: '45 min', critical: true },
    { task: 'Perform geometric accuracy check (squareness, flatness)', time: '60 min', critical: true },
    { task: 'Calibrate tool length measurement system', time: '30 min', critical: false },
    { task: 'Inspect and repack ball screw nuts if needed', time: '90 min', critical: false },
    { task: 'Replace hydraulic filter (check pressure differential first)', time: '30 min', critical: true },
    { task: 'Inspect all motor brushes (if brush-type servo motors)', time: '45 min', critical: false },
    { task: 'Clean and inspect rotary encoder seals', time: '30 min', critical: false },
    { task: 'Check axis drive amplifier cooling fans', time: '15 min', critical: true },
  ],
  annual: [
    { task: 'Complete way lube oil system flush and refill', time: '90 min', critical: true },
    { task: 'Replace all coolant — full tank clean and flush', time: '120 min', critical: true },
    { task: 'Full spindle inspection (runout, taper contact, bearing play)', time: '120 min', critical: true },
    { task: 'Replace all air filters in control cabinet', time: '30 min', critical: true },
    { task: 'Inspect and clean all electrical terminals for corrosion', time: '60 min', critical: false },
    { task: 'Replace backup battery in CNC controller', time: '15 min', critical: true },
    { task: 'Full geometric and volumetric accuracy calibration', time: '180 min', critical: true },
    { task: 'Inspect all linear rails for wear and replace if needed', time: '120 min', critical: false },
    { task: 'Professional spindle repair/rebuild assessment', time: 'Schedule', critical: false },
  ],
}

export default function CNCChecklist() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1a4a3a] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Equipment Guide</span>
            <span className="text-gray-400 text-sm">15 min read · Free checklist included</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            CNC Machine Maintenance Checklist: Daily, Weekly, Monthly & Annual Tasks
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            A complete, ready-to-use maintenance checklist for CNC mills, lathes, and machining centers. Cover every critical task at the right interval — and never miss a PM again.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">DK</div>
            <div>
              <div className="text-white font-medium">David Kim</div>
              <div className="text-gray-400 text-sm">January 12, 2026 · 15 min read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Download CTA */}
        <div className="bg-[#f6f9fc] border-2 border-[#635bff] rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center gap-4">
          <div className="text-4xl">📋</div>
          <div className="flex-1">
            <h3 className="font-bold text-[#0a2540] mb-1">Download the printable version</h3>
            <p className="text-[#425466] text-sm">Get this checklist as a printable PDF — formatted for clipboard use on the shop floor.</p>
          </div>
          <Link href="/guides/pm-checklist" className="bg-[#635bff] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#4f46e5] transition-colors whitespace-nowrap text-sm">
            Download PDF →
          </Link>
        </div>

        <div className="prose prose-lg max-w-none">

          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            CNC machines are the most valuable and complex equipment in most small manufacturing shops — and they require consistent, systematic maintenance to deliver the accuracy and uptime you depend on. A neglected CNC machine doesn't just break down; it gradually drifts out of tolerance, produces scrap, and eventually fails catastrophically.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            This checklist is based on manufacturer recommendations from Mazak, Haas, DMG Mori, Okuma, and Fanuc, combined with real-world experience from maintenance technicians at over 200 small manufacturing shops. It covers mills, lathes, and machining centers with Fanuc, Siemens, and Mitsubishi controls.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
            <div className="flex gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="font-bold text-amber-900 text-sm mb-1">Important safety note</h4>
                <p className="text-amber-800 text-sm">Always follow lockout/tagout (LOTO) procedures before performing any maintenance that requires accessing electrical, hydraulic, or pneumatic systems. Never perform maintenance on a running machine.</p>
              </div>
            </div>
          </div>

          {/* Checklist Sections */}
          {[
            { key: 'daily', label: '📅 Daily Maintenance Checklist', color: 'emerald', desc: 'These tasks should be performed at the start of every shift, or at minimum once per day. They take approximately 30–40 minutes total and prevent the majority of CNC failures.' },
            { key: 'weekly', label: '📆 Weekly Maintenance Checklist', color: 'blue', desc: 'Weekly tasks go deeper than daily checks and address components that degrade over days rather than hours. Budget 60–90 minutes per machine per week.' },
            { key: 'monthly', label: '🗓️ Monthly Maintenance Checklist', color: 'purple', desc: 'Monthly maintenance addresses system-level components and requires more time and some specialized knowledge. Budget 3–4 hours per machine per month.' },
            { key: 'quarterly', label: '📊 Quarterly Maintenance Checklist', color: 'orange', desc: 'Quarterly tasks typically require a full or half-day per machine and may need a qualified CNC technician. Plan these during scheduled downtime periods.' },
            { key: 'annual', label: '📅 Annual Maintenance Checklist', color: 'red', desc: 'Annual maintenance is a major service event. Plan for 1–2 days of downtime per machine and consider engaging the machine manufacturer\'s service team.' },
          ].map(({ key, label, color, desc }) => {
            const tasks = checklistData[key as keyof typeof checklistData]
            const colorMap: Record<string, string> = {
              emerald: 'bg-emerald-500',
              blue: 'bg-blue-500',
              purple: 'bg-[#635bff]',
              orange: 'bg-orange-500',
              red: 'bg-red-500',
            }
            const bgMap: Record<string, string> = {
              emerald: 'bg-emerald-50 border-emerald-200',
              blue: 'bg-blue-50 border-blue-200',
              purple: 'bg-purple-50 border-purple-200',
              orange: 'bg-orange-50 border-orange-200',
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
                    <span className="text-white text-xs font-bold w-20 text-right">TIME</span>
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
                      <span className="text-xs text-[#425466] w-20 text-right flex-shrink-0">{item.time}</span>
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-white bg-opacity-80 flex justify-between items-center">
                    <span className="text-xs text-[#425466]">{tasks.filter(t => t.critical).length} critical tasks · {tasks.length} total tasks</span>
                    <span className="text-xs text-[#635bff] font-medium">
                      Est. total: {tasks.reduce((acc, t) => {
                        const mins = parseInt(t.time)
                        return isNaN(mins) ? acc : acc + mins
                      }, 0)} min
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Common mistakes */}
          <h2 className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">5 Most Common CNC Maintenance Mistakes</h2>
          <div className="space-y-4 mb-8">
            {[
              { title: 'Ignoring coolant management', desc: 'Contaminated coolant is the #1 cause of preventable CNC problems. It causes corrosion, spindle bearing damage, and biological growth that clogs filters and lines. Check concentration and pH weekly.' },
              { title: 'Skipping the daily warm-up routine', desc: 'CNC machines need thermal stabilization before cutting to achieve dimensional accuracy. Skipping warm-up leads to size variation in the first parts of the day and premature thermal stress on spindle bearings.' },
              { title: 'Over-greasing or under-greasing', desc: 'More grease is not better. Over-greasing linear guides causes heat buildup and premature wear. Always use the manufacturer-specified grease type and quantity. The right amount is usually a very small bead.' },
              { title: 'Delaying battery replacement', desc: 'The CNC controller battery maintains memory for machine parameters and programs when power is off. Most batteries last 3–5 years. A failed battery means lost parameters — and a service call to reload them.' },
              { title: 'Not backing up programs and parameters', desc: 'Every machine should have its parameters backed up monthly. If the controller fails or the battery dies, you can restore from backup in minutes instead of days.' },
            ].map(({ title, desc }, i) => (
              <div key={i} className="flex gap-4 p-5 border border-[#e6ebf1] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center flex-shrink-0 text-sm">{i + 1}</div>
                <div>
                  <h4 className="font-bold text-[#0a2540] mb-1 text-sm">{title}</h4>
                  <p className="text-[#425466] text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Track all these tasks automatically</h3>
            <p className="text-purple-100 mb-6">Stop relying on paper checklists. Myncel automatically schedules your CNC maintenance, sends alerts when tasks are due, and tracks completion — for every machine in your shop.</p>
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
              { href: '/blog/preventive-maintenance-program', tag: 'How-To', title: 'How to Build a Preventive Maintenance Program' },
              { href: '/blog/hidden-cost-reactive-maintenance', tag: 'Strategy', title: 'The Hidden Cost of Reactive Maintenance' },
              { href: '/blog/hydraulic-system-maintenance', tag: 'Equipment', title: 'Hydraulic System Maintenance Guide' },
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