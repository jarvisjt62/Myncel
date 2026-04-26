import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'How to Calculate the True ROI of Your CMMS',
  description: 'Before and after metrics, avoided downtime costs, labor efficiency — a practical formula for calculating the exact return on your maintenance software investment.',
  alternates: { canonical: 'https://myncel.com/blog/cmms-roi-calculation' },
  openGraph: {
    title: 'How to Calculate the True ROI of Your CMMS',
    description: 'A practical formula for calculating your actual CMMS return on investment.',
    url: 'https://myncel.com/blog/cmms-roi-calculation',
    type: 'article',
  },
}

export default function CMSROICalculation() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#2a1a5c] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Analytics & Metrics</span>
            <span className="text-gray-400 text-sm">10 min read</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            How to Calculate the True ROI of Your CMMS
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Before and after metrics, avoided downtime costs, labor efficiency — a practical formula for calculating the exact return on your maintenance software investment.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">DP</div>
            <div>
              <div className="text-white font-medium">David Park</div>
              <div className="text-gray-400 text-sm">October 31, 2025 · 10 min read</div>
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
              ['#why-hard', 'Why CMMS ROI is hard to measure'],
              ['#baseline', 'Step 1: Establish your baseline (before numbers)'],
              ['#savings', 'Step 2: Identify the 5 savings categories'],
              ['#formula', 'Step 3: Run the ROI formula'],
              ['#example', 'A worked example: 15-machine fab shop'],
              ['#tracking', 'Step 4: Track ROI over time'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-[#635bff] hover:underline">{label as string}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="prose prose-lg max-w-none">

          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            "Can you show me the ROI?" It's the question every maintenance manager eventually faces when justifying a CMMS investment to ownership. The honest answer is: yes, you can — but it requires capturing the right data before and after implementation.
          </p>

          <h2 id="why-hard" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Why CMMS ROI Is Hard to Measure</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            The challenge with maintenance ROI is that most of the value is in things that <em>didn't</em> happen — breakdowns that were prevented, emergency calls that weren't made, overtime that wasn't paid. Proving a negative requires establishing a credible baseline.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            The shops that struggle to show ROI are usually the ones that implemented a CMMS without capturing any before-metrics. They know things got better, but they can't quantify it. Don't make that mistake.
          </p>

          <h2 id="baseline" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Step 1: Establish Your Baseline</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Before you go live with any maintenance software, capture these numbers for the last 6–12 months. Pull them from your existing records — even if those records are imperfect spreadsheets and repair invoices.
          </p>

          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0a2540] text-white">
                  {['Metric', 'How to Find It', 'Where to Record It'].map(h => (
                    <th key={h} className="text-left p-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['# of unplanned breakdowns/month', 'Count emergency repair calls or invoices', 'Your baseline doc'],
                  ['Avg. hours of unplanned downtime/month', 'Estimate from production records or operator memory', 'Your baseline doc'],
                  ['Avg. cost per breakdown', 'Add labor + parts + expedite fees per incident', 'Your baseline doc'],
                  ['Total annual repair spend', 'Sum all maintenance invoices + labor', 'Your baseline doc'],
                  ['# of PMs completed on time (%)', 'Review scheduled vs. actual in existing records', 'Your baseline doc'],
                  ['Admin time spent on maintenance planning', 'Ask your maintenance manager to estimate', 'Your baseline doc'],
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
            Estimates are fine at this stage. The goal is a credible baseline, not a perfect accounting. Document your methodology — you'll need to defend these numbers later.
          </p>

          <h2 id="savings" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Step 2: Identify the 5 Savings Categories</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            CMMS ROI comes from five distinct savings categories. Not all of them will apply to every shop — but most shops will see meaningful savings in at least three.
          </p>

          <div className="space-y-6 mb-8">
            {[
              {
                num: 1,
                title: 'Reduced unplanned downtime',
                formula: '(Before breakdowns/month − After breakdowns/month) × Avg. hours/breakdown × Hourly downtime cost',
                typical: 'Typical reduction: 35–55% in first year',
                note: 'This is usually the largest single savings category. Even reducing breakdowns by 2 per month at $2,000/incident is $48,000/year.',
              },
              {
                num: 2,
                title: 'Lower emergency repair costs',
                formula: '(Emergency repair $ before − Emergency repair $ after) per month × 12',
                typical: 'Typical reduction: 25–40% of emergency spend',
                note: 'Emergency repairs carry premium labor rates (1.5–3x), expedited parts, and overnight shipping. PM prevents most of these.',
              },
              {
                num: 3,
                title: 'Parts inventory optimization',
                formula: '(Overstocked parts before − Right-stocked parts after) × Part carrying cost',
                typical: 'Typical savings: 15–25% of parts inventory value',
                note: 'When you track parts consumption by machine, you stop over-ordering "just in case" and stop emergency-ordering because you ran out.',
              },
              {
                num: 4,
                title: 'Labor efficiency gains',
                formula: 'Admin time saved per week × Hourly cost × 52 weeks',
                typical: 'Typical: 2–5 hours/week for a maintenance manager',
                note: 'Time previously spent on scheduling, paperwork, chasing technicians, and pulling data for reports is eliminated or greatly reduced.',
              },
              {
                num: 5,
                title: 'Extended equipment lifespan',
                formula: 'Equipment replacement cost × 20% life extension ÷ Remaining useful life years',
                typical: 'Hard to quantify annually, but significant over 5–10 years',
                note: 'Properly maintained equipment lasts 20–30% longer. On a $150,000 CNC, that\'s $30,000–$45,000 in deferred capital expenditure.',
              },
            ].map(({ num, title, formula, typical, note }) => (
              <div key={num} className="border border-[#e6ebf1] rounded-2xl overflow-hidden">
                <div className="bg-[#635bff] px-5 py-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white text-[#635bff] font-bold flex items-center justify-center text-xs">{num}</span>
                  <span className="text-white font-semibold">{title}</span>
                </div>
                <div className="p-5">
                  <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-lg p-3 mb-3">
                    <div className="text-xs font-semibold text-[#8898aa] mb-1">Formula</div>
                    <div className="text-xs font-mono text-[#635bff]">{formula}</div>
                  </div>
                  <div className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mb-3">{typical}</div>
                  <p className="text-sm text-[#425466]">{note}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 id="formula" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Step 3: Run the ROI Formula</h2>

          <div className="bg-[#0a2540] rounded-2xl p-6 mb-8 font-mono">
            <div className="text-white text-sm space-y-3">
              <div className="text-purple-300 font-bold">Total Annual Savings</div>
              <div className="text-white pl-4">= Downtime savings</div>
              <div className="text-white pl-4">+ Emergency repair savings</div>
              <div className="text-white pl-4">+ Parts optimization savings</div>
              <div className="text-white pl-4">+ Labor efficiency savings</div>
              <div className="text-white pl-4">+ Equipment lifespan savings</div>
              <div className="border-t border-white/20 mt-4 pt-4">
                <div className="text-purple-300 font-bold">Annual ROI %</div>
                <div className="text-white pl-4">= ((Total Annual Savings − Annual CMMS Cost) ÷ Annual CMMS Cost) × 100</div>
              </div>
              <div className="border-t border-white/20 mt-4 pt-4">
                <div className="text-purple-300 font-bold">Payback Period (months)</div>
                <div className="text-white pl-4">= Annual CMMS Cost ÷ (Total Annual Savings ÷ 12)</div>
              </div>
            </div>
          </div>

          <h2 id="example" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">A Worked Example: 15-Machine Fabrication Shop</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Here's a realistic example based on data from a 15-machine metal fabrication shop in the Midwest that implemented Myncel in early 2024.
          </p>

          <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-8">
            <h4 className="font-bold text-[#0a2540] mb-4">Before numbers (baseline)</h4>
            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              {[
                ['Unplanned breakdowns/month', '6'],
                ['Avg. hours/breakdown', '7'],
                ['Hourly downtime cost', '$1,800'],
                ['Emergency repair spend/year', '$54,000'],
                ['Maintenance admin time/week', '6 hours'],
                ['Maintenance manager hourly cost', '$38'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-1 border-b border-[#e6ebf1]">
                  <span className="text-[#425466]">{label}</span>
                  <span className="font-semibold text-[#0a2540]">{val}</span>
                </div>
              ))}
            </div>

            <h4 className="font-bold text-[#0a2540] mb-4">After numbers (12 months with Myncel)</h4>
            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              {[
                ['Unplanned breakdowns/month', '2.5 (−58%)'],
                ['Emergency repair spend/year', '$28,000 (−48%)'],
                ['Admin time saved/week', '3.5 hours'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-1 border-b border-[#e6ebf1]">
                  <span className="text-[#425466]">{label}</span>
                  <span className="font-semibold text-emerald-600">{val}</span>
                </div>
              ))}
            </div>

            <h4 className="font-bold text-[#0a2540] mb-4">ROI Calculation</h4>
            <div className="space-y-2 text-sm">
              {[
                ['Downtime savings', '(6−2.5) × 7 hrs × $1,800 × 12 mo', '$529,200'],
                ['Emergency repair savings', '$54,000 − $28,000', '$26,000'],
                ['Labor efficiency', '3.5 hrs × $38 × 52 wks', '$6,916'],
                ['Total annual savings', '', '$562,116'],
                ['Annual Myncel cost (Growth plan)', '', '$1,788'],
                ['Annual ROI', '($562,116 − $1,788) ÷ $1,788', '31,335%'],
                ['Payback period', '$1,788 ÷ ($562,116 ÷ 12)', '< 1 month'],
              ].map(([label, formula, val]) => (
                <div key={label} className={`flex justify-between py-2 border-b border-[#e6ebf1] ${label.includes('Total') || label.includes('ROI') || label.includes('Payback') ? 'font-bold' : ''}`}>
                  <div>
                    <span className="text-[#0a2540]">{label}</span>
                    {formula && <span className="text-[#8898aa] text-xs ml-2">({formula})</span>}
                  </div>
                  <span className={label.includes('ROI') || label.includes('Payback') || label.includes('savings') ? 'text-emerald-600' : 'text-[#0a2540]'}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 id="tracking" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Step 4: Track ROI Over Time</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            ROI typically improves in the second and third year as your PM program matures, your parts inventory stabilizes, and your technicians get faster at using the system. Build a simple monthly scorecard that compares your current metrics against your baseline.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8">
            <h4 className="font-bold text-blue-900 mb-3">Monthly ROI scorecard (5 numbers to track)</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>1. Unplanned breakdowns this month vs. baseline</li>
              <li>2. PM compliance rate (% completed on time)</li>
              <li>3. Total maintenance spend vs. same month last year</li>
              <li>4. Emergency work orders as % of total</li>
              <li>5. Open work order backlog (should be decreasing)</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Use our ROI calculator</h3>
            <p className="text-purple-100 mb-6">Enter your facility's numbers and see your estimated annual savings and payback period with Myncel.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/guides/roi-calculator" className="inline-block bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                Try the ROI calculator →
              </Link>
              <Link href="/signup" className="inline-block bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white hover:text-[#635bff] transition-colors">
                Start free trial
              </Link>
            </div>
          </div>
        </div>

        {/* Related */}
        <div className="mt-16 pt-12 border-t border-[#e6ebf1]">
          <h3 className="text-xl font-bold text-[#0a2540] mb-6">Related articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/blog/maintenance-kpis-plant-manager', tag: 'Analytics', title: '10 Maintenance KPIs Every Plant Manager Should Track' },
              { href: '/blog/hidden-cost-reactive-maintenance', tag: 'Strategy', title: 'The Hidden Cost of Reactive Maintenance' },
              { href: '/blog/preventive-maintenance-program', tag: 'How-To', title: 'How to Build a Preventive Maintenance Program' },
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