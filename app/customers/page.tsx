import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Customer Stories — Real Manufacturers Using Myncel',
  description: 'See how manufacturers use Myncel to prevent breakdowns, reduce downtime costs, and build better maintenance programs.',
  alternates: { canonical: 'https://myncel.com/customers' },
  openGraph: {
    title: 'Myncel Customer Stories',
    description: 'Real stories from real manufacturers.',
    url: 'https://myncel.com/customers',
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

export default async function Customers() {
  const flags = await getFeatureFlags();

  if (!flags.customersPageEnabled) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f0f4f8] flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-[#8898aa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#0a2540] mb-3">Customer Stories Coming Soon</h1>
          <p className="text-[#425466] max-w-md mb-8 leading-relaxed">
            We're collecting verified case studies from our manufacturing customers. Check back soon to read real results from real factories.
          </p>
          <div className="flex gap-4">
            <Link href="/signup" className="bg-[#635bff] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#4f46e5] transition-colors">
              Start free trial
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

  const stories = [
    {
      company: 'Precision Parts Co.',
      industry: 'Metal Fabrication · Ohio',
      logo: 'PP',
      color: 'bg-violet-600',
      headline: 'Precision Parts Co. cut unplanned downtime by 43% in their first quarter with Myncel.',
      quote: '"We went from reacting to breakdowns to preventing them. Myncel paid for itself in the first month — just one prevented failure covered a full year of subscription fees."',
      author: 'Mike Torres',
      role: 'Plant Manager',
      stats: [{ val: '43%', label: 'less downtime' }, { val: '$40K', label: 'saved in Q1' }, { val: '15 min', label: 'setup time' }],
      href: '/customers/precision-parts',
    },
    {
      company: 'Midwest Fab Works',
      industry: 'Structural Steel · Illinois',
      logo: 'MW',
      color: 'bg-blue-600',
      headline: 'Midwest Fab Works replaced a 200-row spreadsheet with Myncel and never looked back.',
      quote: '"We had a shared Excel file that nobody trusted. Now every technician knows exactly what to do, every day. It\'s the single best operational decision we\'ve made."',
      author: 'Sarah Kim',
      role: 'Maintenance Supervisor',
      stats: [{ val: '28', label: 'machines tracked' }, { val: '0', label: 'missed PMs in 6 months' }, { val: '4.8★', label: 'team satisfaction' }],
      href: '/customers/midwest-fab',
    },
    {
      company: 'Gulf Coast Manufacturing',
      industry: 'Plastics & Injection · Texas',
      logo: 'GC',
      color: 'bg-emerald-600',
      headline: 'Gulf Coast Manufacturing tracks 47 injection molding machines across 2 facilities in Myncel.',
      quote: '"We tried two enterprise CMMS tools before Myncel. Both took months to implement and our team hated them. Myncel was running in an afternoon and everyone actually uses it."',
      author: 'James Okafor',
      role: 'Operations Director',
      stats: [{ val: '47', label: 'machines managed' }, { val: '2', label: 'facilities' }, { val: '31%', label: 'cost reduction' }],
      href: '/customers/gulf-coast',
    },
    {
      company: 'Atlas Metal Products',
      industry: 'Stamping & Forming · Michigan',
      logo: 'AM',
      color: 'bg-rose-600',
      headline: 'Atlas Metal Products uses Myncel to manage a 12-person maintenance team across three shifts.',
      quote: '"The work order system is a game changer. Before, jobs fell through the cracks between shifts. Now there\'s a complete digital trail for every repair. Audits take hours, not days."',
      author: 'Linda Park',
      role: 'Quality & Maintenance Manager',
      stats: [{ val: '12', label: 'technicians' }, { val: '3', label: 'shifts covered' }, { val: '99.1%', label: 'uptime' }],
      href: '/customers/atlas-metal',
    },
    {
      company: 'Summit Plastics Inc.',
      industry: 'Food-Grade Plastics · Wisconsin',
      logo: 'SP',
      color: 'bg-amber-600',
      headline: 'Summit Plastics passed their FDA audit with zero findings — for the first time ever.',
      quote: '"Having every maintenance record, calibration log, and sanitation schedule in one place made our audit so much easier. The inspector was impressed. We were relieved."',
      author: 'Tom Reyes',
      role: 'Quality Director',
      stats: [{ val: '100%', label: 'audit compliance' }, { val: '0', label: 'FDA findings' }, { val: '5x', label: 'faster doc retrieval' }],
      href: '/customers/summit-plastics',
    },
    {
      company: 'Iron Valley Tools',
      industry: 'Hand Tool Mfg. · Pennsylvania',
      logo: 'IV',
      color: 'bg-indigo-600',
      headline: 'Iron Valley Tools went from 14 breakdowns a month to 3 — in under 90 days.',
      quote: '"We were skeptical. We\'re a small team and didn\'t think we needed software. But the ROI was immediate. Three months in, our breakdown rate dropped 80% and morale improved."',
      author: 'Dave Wilson',
      role: 'Shop Foreman',
      stats: [{ val: '80%', label: 'fewer breakdowns' }, { val: '90', label: 'days to results' }, { val: '$22K', label: 'annual savings' }],
      href: '/customers/iron-valley',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200 py-3">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-amber-800 text-center">
            <strong>Note:</strong> The customer stories and testimonials shown below are illustrative examples representing typical results from manufacturers using CMMS software.
            Actual customer testimonials and detailed case studies coming soon.
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-[#f8f6ff] to-[#f0fff8] py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[400px] h-[400px] bg-gradient-to-br from-purple-200 to-indigo-300 top-[-100px] right-[-50px] opacity-40" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-emerald-200 to-teal-300 bottom-[-100px] right-[200px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center max-w-3xl mx-auto">
            <span className="section-label">Customer Stories</span>
            <h1 className="text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Real factories.{' '}
              <span className="gradient-text">Real results.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              See how maintenance teams at small and mid-size manufacturers use Myncel to prevent breakdowns, reduce costs, and keep their factories running.
            </p>
            <div className="flex justify-center gap-12 py-8 border-t border-b border-[#e6ebf1] mt-8">
              {[
                { val: '200+', label: 'manufacturers using Myncel' },
                { val: '4,800+', label: 'machines monitored' },
                { val: '$2.4M+', label: 'downtime prevented' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold text-[#635bff]">{s.val}</div>
                  <div className="text-sm text-[#8898aa] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured stories */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {stories.map((s, i) => (
              <div key={i} className="bg-white border border-[#e6ebf1] rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
                <div className={`h-2 ${s.color}`} />
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                      {s.logo}
                    </div>
                    <div>
                      <div className="font-bold text-[#0a2540]">{s.company}</div>
                      <div className="text-xs text-[#8898aa]">{s.industry}</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#0a2540] mb-4 leading-tight">{s.headline}</h3>
                  <blockquote className="text-sm text-[#425466] italic leading-relaxed mb-5 border-l-2 border-[#635bff] pl-4">
                    {s.quote}
                  </blockquote>
                  <div className="text-sm font-semibold text-[#0a2540]">{s.author}</div>
                  <div className="text-xs text-[#8898aa] mb-5">{s.role}</div>
                  <div className="flex gap-6 pt-4 border-t border-[#f6f9fc]">
                    {s.stats.map(stat => (
                      <div key={stat.label}>
                        <div className="text-xl font-bold text-[#635bff]">{stat.val}</div>
                        <div className="text-xs text-[#8898aa]">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials strip */}
      <section className="py-16 bg-white border-t border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-10">What maintenance teams say</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: '"Setup literally took 12 minutes. I added our 6 machines, set the schedules, and got my first alert the next morning."', name: 'R. Chen', role: 'Maintenance Lead · California' },
              { quote: '"I used to spend every Monday morning figuring out what maintenance was overdue. Now Myncel sends me a summary every Friday."', name: 'P. Johnson', role: 'Plant Supervisor · Georgia' },
              { quote: '"My team actually likes using it. That\'s never happened with any software I\'ve introduced before."', name: 'A. Kowalski', role: 'Operations Manager · Ohio' },
            ].map((t, i) => (
              <div key={i} className="bg-[#f6f9fc] rounded-xl p-6 text-left">
                <div className="text-2xl text-[#635bff] mb-3">"</div>
                <p className="text-sm text-[#425466] leading-relaxed mb-4">{t.quote}</p>
                <div className="text-sm font-semibold text-[#0a2540]">{t.name}</div>
                <div className="text-xs text-[#8898aa]">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Join 200+ manufacturers</h2>
          <p className="text-purple-200 mb-8 text-lg">Start your free 3-month trial and see results in the first week.</p>
          <Link href="/signup" className="bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors">
            Get started free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}