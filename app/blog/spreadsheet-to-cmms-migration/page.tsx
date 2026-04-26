import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'From Spreadsheet to CMMS: A Migration Story',
  description: 'How one Michigan fabrication shop moved 5 years of Excel maintenance history into Myncel in a single afternoon — and what they learned.',
  alternates: { canonical: 'https://myncel.com/blog/spreadsheet-to-cmms-migration' },
  openGraph: {
    title: 'From Spreadsheet to CMMS: A Migration Story',
    description: 'How a Michigan fab shop moved from Excel to Myncel in one afternoon.',
    url: 'https://myncel.com/blog/spreadsheet-to-cmms-migration',
    type: 'article',
  },
}

export default function SpreadsheetToCMMS() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1a3a5c] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-rose-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Customer Stories</span>
            <span className="text-gray-400 text-sm">5 min read</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            From Spreadsheet to CMMS: A Migration Story
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            How one Michigan fabrication shop moved 5 years of Excel maintenance history into Myncel in a single afternoon — and what they learned along the way.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-sm">MJ</div>
            <div>
              <div className="text-white font-medium">Marcus Johnson</div>
              <div className="text-gray-400 text-sm">November 21, 2025 · 5 min read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        <div className="prose prose-lg max-w-none">

          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            When Dave Chen, maintenance manager at Great Lakes Fabrication in Kalamazoo, Michigan, first called us, he had a very specific problem: a spreadsheet that had grown so large it crashed Excel when he tried to sort it.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            "We started the spreadsheet when we bought our first CNC in 2019," Dave told us. "By 2024 it was 4,200 rows across three tabs. Nobody trusted it anymore. Half the team had their own versions saved locally. It was chaos."
          </p>

          <h2 className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">The Migration Fear</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            The thing that had kept Dave from switching sooner wasn't cost or effort — it was loss of history. Five years of maintenance records lived in that spreadsheet. Repair dates. Part numbers. Vendor contacts. Failure patterns that Dave had mentally catalogued over hundreds of incidents.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            "I was worried if we switched, we'd lose all that context," he said. "Our newest CNC had a bearing failure pattern I'd been tracking for two years. That data was valuable."
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">The migration fear is real — and solvable</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Most shops that delay switching to a CMMS cite fear of losing historical data. In practice, migrating your most important historical records takes 2–3 hours, and you only need the last 12–18 months of data to establish meaningful baselines.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">The Afternoon That Changed Everything</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Dave scheduled a Friday afternoon for the migration. He brought in his lead technician, Maria, who had been with the shop for eight years and knew the equipment history better than anyone.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            Here's the process they used, which took about 3 hours total:
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                step: 'Hour 1: Equipment setup',
                desc: 'Dave entered all 14 machines into Myncel — name, model, year, location. For each machine, he added the manufacturer\'s recommended PM schedule from the manual (or from memory, for older equipment). Maria added photos of each machine\'s nameplate from her phone.',
              },
              {
                step: 'Hour 2: Historical data entry',
                desc: 'Rather than importing every row of the spreadsheet, they focused on the last 12 months. Dave filtered his spreadsheet to 2024 and entered the most significant events — major repairs, parts replacements, and recurring issues — as historical work orders in Myncel. Non-critical routine entries were left behind.',
              },
              {
                step: 'Hour 3: Team setup and first alerts',
                desc: 'Dave added his four technicians to Myncel and assigned machines to each one. He set up email alerts for overdue PMs and configured the weekly summary to go to himself and the shop owner. By 5 PM, Myncel had sent the first maintenance reminder.',
              },
            ].map(({ step, desc }, i) => (
              <div key={i} className="flex gap-4 p-5 bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#635bff] text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">{i + 1}</div>
                <div>
                  <h4 className="font-bold text-[#0a2540] mb-1">{step}</h4>
                  <p className="text-[#425466] text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">What They Learned (and What Surprised Them)</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Three months after the migration, we checked back in with Dave. A few things surprised him:
          </p>

          <div className="space-y-6 mb-8">
            <div className="flex gap-4 p-6 bg-white border border-[#e6ebf1] rounded-2xl">
              <span className="text-2xl flex-shrink-0">😲</span>
              <div>
                <h4 className="font-bold text-[#0a2540] mb-2">They had more overdue PMs than they realized</h4>
                <p className="text-[#425466] text-sm leading-relaxed">
                  "Once everything was in Myncel and I could see the overdue list, I realized we had 11 past-due PM tasks across 6 machines. In the spreadsheet, things just quietly fell through the cracks. The dashboard made the backlog visible for the first time."
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-white border border-[#e6ebf1] rounded-2xl">
              <span className="text-2xl flex-shrink-0">📈</span>
              <div>
                <h4 className="font-bold text-[#0a2540] mb-2">The technicians adapted faster than expected</h4>
                <p className="text-[#425466] text-sm leading-relaxed">
                  "I expected pushback. Instead, within a week Maria was logging work orders from her phone between jobs. She said it was faster than finding the spreadsheet, opening it, scrolling to the right machine, and figuring out which tab to update."
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-white border border-[#e6ebf1] rounded-2xl">
              <span className="text-2xl flex-shrink-0">💰</span>
              <div>
                <h4 className="font-bold text-[#0a2540] mb-2">The first prevented breakdown paid for a year</h4>
                <p className="text-[#425466] text-sm leading-relaxed">
                  "Six weeks after going live, we got an alert that the hydraulic press was overdue for a seal inspection. Maria did the inspection and found a seal that was failing — caught it before it blew. That repair cost $340 scheduled. The emergency repair + downtime would have been $4,200. That one catch covered our Myncel subscription for 12 months."
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">What to Keep from Your Spreadsheet (and What to Leave Behind)</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            If you're planning a similar migration, here's what we've learned from helping dozens of shops make the switch:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h4 className="font-bold text-green-900 mb-3">✓ Worth migrating</h4>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• Last 12 months of major repairs</li>
                <li>• Known recurring failure patterns</li>
                <li>• Parts that have been replaced (and when)</li>
                <li>• Vendor/contractor contact info</li>
                <li>• Manufacturer service schedules</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h4 className="font-bold text-red-900 mb-3">✗ Leave behind</h4>
              <ul className="text-sm text-red-800 space-y-2">
                <li>• Routine daily/weekly checks from 3+ years ago</li>
                <li>• Incomplete or unverifiable entries</li>
                <li>• Duplicate records</li>
                <li>• Equipment that's been decommissioned</li>
                <li>• Data that nobody will ever reference again</li>
              </ul>
            </div>
          </div>

          <p className="text-[#425466] leading-relaxed mb-8">
            The goal isn't to preserve everything. It's to move forward with the data that actually matters — and build better habits going forward.
          </p>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Ready to make the switch?</h3>
            <p className="text-purple-100 mb-6">Myncel is built for exactly this scenario. Most shops are fully set up in 2–4 hours. Start your free trial today — no credit card required.</p>
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