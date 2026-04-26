import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'The Hidden Cost of Reactive Maintenance: What Your Spreadsheet Isn\'t Telling You',
  description: 'Most small manufacturers track maintenance in spreadsheets — or don\'t track it at all. Here\'s what reactive maintenance is really costing you, with real numbers, and how to fix it without a $50,000 CMMS.',
  alternates: { canonical: 'https://myncel.com/blog/hidden-cost-reactive-maintenance' },
  openGraph: {
    title: 'The Hidden Cost of Reactive Maintenance',
    description: 'What reactive maintenance is really costing your shop — and how to fix it for less than one hour of downtime.',
    url: 'https://myncel.com/blog/hidden-cost-reactive-maintenance',
    type: 'article',
  },
}

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Article Header */}
      <div className="bg-gradient-to-br from-[#0a2540] to-[#1a3a5c] pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-[#635bff] text-white text-xs font-semibold px-3 py-1 rounded-full">Maintenance Strategy</span>
            <span className="text-gray-400 text-sm">8 min read</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6">
            The Hidden Cost of Reactive Maintenance: What Your Spreadsheet Isn't Telling You
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Most small manufacturers track maintenance in spreadsheets — or don't track it at all. Here's what that's really costing you, and how to fix it without a $50,000 CMMS implementation.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#635bff] flex items-center justify-center text-white font-bold text-sm">MJ</div>
            <div>
              <div className="text-white font-medium">Marcus Johnson</div>
              <div className="text-gray-400 text-sm">December 18, 2025 · Updated January 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Body */}
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Table of Contents */}
        <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-12">
          <h2 className="font-bold text-[#0a2540] text-lg mb-4">📋 In this article</h2>
          <ul className="space-y-2">
            {[
              ['#the-real-numbers', 'The real numbers behind reactive maintenance'],
              ['#hidden-costs', '5 hidden costs most plant managers miss'],
              ['#spreadsheet-problem', 'Why spreadsheets make it worse'],
              ['#the-fix', 'The fix: preventive maintenance without the enterprise price tag'],
              ['#getting-started', 'How to get started this week'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-[#635bff] hover:underline text-sm">{label as string}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="prose prose-lg max-w-none">

          <p className="text-xl text-[#425466] leading-relaxed mb-8">
            It happens the same way every time. A machine goes down on a Tuesday morning. Your best machinist is halfway through a rush order. The part you need isn't in stock. You're on the phone with a repair tech who can't come until Thursday. By Friday, you've lost $18,000 in production, paid $2,400 in emergency service fees, and your customer is furious.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            And the worst part? You knew that machine had been running rough for three weeks. Someone even wrote it on a sticky note.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            This is reactive maintenance — and it's the silent profit killer in thousands of small manufacturing shops across the United States. Most owners know it's a problem. What they don't know is exactly how much it's costing them. That's what we're going to break down today.
          </p>

          {/* Section 1 */}
          <h2 id="the-real-numbers" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">The Real Numbers Behind Reactive Maintenance</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Let's start with data. According to a study by the Aberdeen Group, unplanned downtime costs industrial manufacturers an average of <strong>$260,000 per hour</strong>. That's for large manufacturers — for a small shop running 2–3 shifts, the number is smaller but the proportional impact is often larger, since small shops have less financial buffer.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            More relevant to the shops we work with: our own data from 200+ manufacturers using Myncel shows that the average small manufacturer (5–50 machines) experiences:
          </p>

          <div className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { stat: '4.2 hours', label: 'Average unplanned downtime per machine per month' },
                { stat: '$1,847', label: 'Average cost per unplanned downtime incident' },
                { stat: '67%', label: 'Of breakdowns that showed warning signs 2+ weeks before failure' },
                { stat: '3.4x', label: 'More expensive to fix reactively vs. preventively' },
              ].map(({ stat, label }) => (
                <div key={stat} className="text-center">
                  <div className="text-3xl font-bold text-[#635bff] mb-1">{stat}</div>
                  <div className="text-sm text-[#425466]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[#425466] leading-relaxed mb-8">
            That last number is the one that should stop you cold: <strong>67% of breakdowns showed warning signs at least two weeks before failure.</strong> They weren't random. They were predictable. They were preventable. Your shop just didn't have a system to catch them.
          </p>

          {/* Section 2 */}
          <h2 id="hidden-costs" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">5 Hidden Costs Most Plant Managers Miss</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            When a machine goes down, most managers look at two costs: the repair bill and the lost production time. But reactive maintenance creates a cascade of costs that never show up on a single line item. Here are the five that hurt the most:
          </p>

          <div className="space-y-6 mb-8">
            {[
              {
                num: '1',
                title: 'Emergency Service Premiums',
                body: 'When you call a repair tech urgently, you pay emergency rates — typically 1.5x to 3x the normal labor rate. A job that would cost $800 on a scheduled basis becomes $2,400 on an emergency call. Across a 20-machine shop with 3–4 emergency calls per month, that premium alone can run $4,000–$8,000/month.'
              },
              {
                num: '2',
                title: 'Parts at Retail Price (or Worse)',
                body: 'Scheduled maintenance lets you order parts in advance, buy in bulk, and negotiate with suppliers. Emergency repairs mean buying whatever part is available, at full retail, often with overnight shipping. We\'ve seen shops pay $800 for a bearing that\'s $45 on a scheduled order.'
              },
              {
                num: '3',
                title: 'Labor Inefficiency & Overtime',
                body: 'When a machine goes down unexpectedly, your team has to scramble. Other jobs get delayed. Workers stand around waiting. Supervisors spend hours managing the crisis instead of running production. And if you\'re behind on a customer order, overtime kicks in — at 1.5x pay — to catch up.'
              },
              {
                num: '4',
                title: 'Customer Relationship Damage',
                body: 'This one is almost impossible to put a number on, but it\'s real. Late deliveries due to equipment failures erode trust with customers. Some will absorb it once. Very few will absorb it twice. The cost of losing a customer worth $50,000/year in annual revenue because of repeated delays is far higher than any repair bill.'
              },
              {
                num: '5',
                title: 'Secondary Equipment Damage',
                body: 'This is the sneaky one. When one machine fails because of deferred maintenance, it often damages connected equipment or causes quality problems that aren\'t discovered until products are already in process — or worse, already shipped. A $500 seal failure becomes a $12,000 hydraulic rebuild because the original problem was ignored.'
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="flex gap-4 p-6 bg-white border border-[#e6ebf1] rounded-2xl">
                <div className="w-8 h-8 rounded-full bg-[#635bff] text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">{num}</div>
                <div>
                  <h3 className="font-bold text-[#0a2540] mb-2">{title}</h3>
                  <p className="text-[#425466] text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Section 3 */}
          <h2 id="spreadsheet-problem" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">Why Spreadsheets Make It Worse</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            Almost every small manufacturer we talk to tracks maintenance in one of three ways: a spreadsheet, a whiteboard, or someone's head. All three have the same fundamental problem — they're passive. They require a human to remember to check them, update them, and act on them. And in a busy shop, that almost never happens consistently.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            Spreadsheets in particular create a false sense of control. You have a document. It has dates on it. It looks organized. But it can't send you an alert when a machine is overdue for service. It can't tell you that the same compressor has gone down four times in six months. It can't calculate that your average repair cost per machine went up 34% last quarter.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-bold text-amber-900 mb-1">The spreadsheet illusion</h4>
                <p className="text-amber-800 text-sm leading-relaxed">
                  A spreadsheet gives you the feeling of having a maintenance program without actually giving you one. Real maintenance management requires automation, alerts, and accountability — things no spreadsheet can provide.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[#425466] leading-relaxed mb-8">
            The other problem with spreadsheets is that they don't create accountability. When maintenance tasks are assigned in a spreadsheet, there's no way to know if they were actually done, who did them, what parts were used, or how long it took. That data is critical — not just for compliance, but for understanding your true maintenance costs and predicting future failures.
          </p>

          {/* Section 4 */}
          <h2 id="the-fix" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">The Fix: Preventive Maintenance Without the Enterprise Price Tag</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            For years, the solution to this problem was enterprise CMMS software — systems like SAP PM, IBM Maximo, or Infor EAM. These are genuinely powerful tools. They're also genuinely expensive: typically $50,000–$200,000 to implement, plus $20,000–$50,000/year in licensing and support. That's not a realistic option for a shop with 10–50 machines.
          </p>

          <p className="text-[#425466] leading-relaxed mb-6">
            The good news is that the core functionality that prevents 80% of breakdowns — PM scheduling, work orders, alerts, and basic analytics — doesn't require a six-figure investment. Modern maintenance software built specifically for small manufacturers can deliver all of this for $79–$299/month. That's less than one hour of downtime.
          </p>

          <p className="text-[#425466] leading-relaxed mb-8">
            The key features that move the needle most for small shops are:
          </p>

          <ul className="space-y-3 mb-8">
            {[
              'Automated PM scheduling that calculates due dates based on run hours or calendar intervals — and sends alerts before tasks are overdue',
              'Digital work orders that create accountability: who did the job, when, what parts were used, how long it took',
              'A maintenance history for every machine — so you can spot repeat failures and chronic problems before they become catastrophic',
              'Real-time alerts via email or SMS so the right person knows immediately when something needs attention',
              'Basic dashboards that show you your most expensive machines, most common failure modes, and overall maintenance costs',
            ].map((item) => (
              <li key={item} className="flex gap-3 text-[#425466]">
                <span className="text-[#635bff] font-bold mt-1">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Section 5 */}
          <h2 id="getting-started" className="text-2xl font-bold text-[#0a2540] mt-12 mb-6">How to Get Started This Week</h2>

          <p className="text-[#425466] leading-relaxed mb-6">
            The biggest mistake shops make is trying to build the perfect maintenance program before starting. You don't need perfect. You need something. Here's a simple 3-step process to go from reactive to preventive in one week:
          </p>

          <div className="space-y-4 mb-8">
            {[
              {
                step: 'Day 1–2: Inventory your equipment',
                desc: 'Make a list of every machine in your shop. For each one, write down: the manufacturer\'s recommended service intervals, the last time it was serviced, and any known issues. This is your starting data set.'
              },
              {
                step: 'Day 3–4: Prioritize by risk',
                desc: 'Not all machines are equal. Which ones, if they went down, would halt your entire production? Start there. Build PM schedules for your top 5 highest-risk machines first.'
              },
              {
                step: 'Day 5–7: Set up your system',
                desc: 'Enter your equipment and PM schedules into a maintenance tracking system. Assign responsibility for each task. Set up alerts. Run your first work order. The whole process takes 2–4 hours in Myncel.'
              },
            ].map(({ step, desc }, i) => (
              <div key={step} className="flex gap-4 p-5 bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#635bff] text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">{i + 1}</div>
                <div>
                  <h4 className="font-bold text-[#0a2540] mb-1">{step}</h4>
                  <p className="text-[#425466] text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Ready to stop losing money to reactive maintenance?</h3>
            <p className="text-purple-100 mb-6">Join 200+ manufacturers who switched from spreadsheets to Myncel. Free for 3 months — no credit card required.</p>
            <Link href="/signup" className="inline-block bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Start your free trial →
            </Link>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-16 pt-12 border-t border-[#e6ebf1]">
          <h3 className="text-xl font-bold text-[#0a2540] mb-6">Related articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { href: '/blog/preventive-maintenance-program', tag: 'How-To Guide', title: 'How to Build a Preventive Maintenance Program' },
              { href: '/blog/maintenance-kpis-plant-manager', tag: 'Analytics', title: '10 Maintenance KPIs Every Plant Manager Should Track' },
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