import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Solutions — Maintenance Software by Industry & Shop Size',
  description: 'Myncel works for metal fabrication, plastics, food & beverage, auto parts, electronics, and woodworking shops. Find the right maintenance solution for your industry and team size.',
  alternates: { canonical: 'https://myncel.com/solutions' },
  openGraph: {
    title: 'Myncel Solutions — Maintenance Software for Every Manufacturing Industry',
    description: 'Industry-specific maintenance solutions for small and mid-size manufacturers. Metal fab, food & beverage, plastics, auto parts and more.',
    url: 'https://myncel.com/solutions',
  },
}

export default function Solutions() {
  const industries = [
    {
      icon: '🔩',
      name: 'Metal Fabrication',
      desc: 'CNC machines, press brakes, laser cutters, and welding equipment require strict PM schedules. Myncel helps you stay on top of every machine in your fab shop.',
      stats: [{ val: '43%', label: 'less unplanned downtime' }, { val: '2.1h', label: 'avg setup time' }],
      href: '/solutions/metal-fabrication',
      color: 'bg-slate-50 border-slate-200',
      badge: 'bg-slate-100 text-slate-700',
    },
    {
      icon: '🏭',
      name: 'Plastics & Injection Molding',
      desc: 'Injection molding machines, extruders, and granulators need cycle-based maintenance tracking. Myncel tracks by machine cycles, not just calendar days.',
      stats: [{ val: '38%', label: 'fewer mold defects' }, { val: '$18K', label: 'avg annual savings' }],
      href: '/solutions/plastics',
      color: 'bg-blue-50 border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
    },
    {
      icon: '🍽️',
      name: 'Food & Beverage',
      desc: 'Meet HACCP and FDA compliance requirements with scheduled sanitation, calibration, and inspection records automatically stored and audit-ready.',
      stats: [{ val: '100%', label: 'audit pass rate' }, { val: '5x', label: 'faster compliance docs' }],
      href: '/solutions/food-beverage',
      color: 'bg-green-50 border-green-200',
      badge: 'bg-green-100 text-green-700',
    },
    {
      icon: '🚗',
      name: 'Auto Parts Manufacturing',
      desc: 'Keep stamping presses, assembly lines, and testing equipment running at peak performance. Track OEE metrics and prevent costly line stoppages.',
      stats: [{ val: '99.2%', label: 'uptime achieved' }, { val: '27%', label: 'maintenance cost reduction' }],
      href: '/solutions/auto-parts',
      color: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-700',
    },
    {
      icon: '💡',
      name: 'Electronics Assembly',
      desc: 'SMT lines, wave soldering, reflow ovens, and AOI machines require precise calibration schedules. Myncel tracks every interval down to the minute.',
      stats: [{ val: '52%', label: 'less rework' }, { val: '99.7%', label: 'calibration compliance' }],
      href: '/solutions/electronics',
      color: 'bg-yellow-50 border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-700',
    },
    {
      icon: '🪵',
      name: 'Woodworking & Furniture',
      desc: 'From panel saws to CNC routers and finishing lines, Myncel keeps your woodworking equipment in top shape and your production schedule on track.',
      stats: [{ val: '31%', label: 'less blade waste' }, { val: '4.2x', label: 'ROI in first year' }],
      href: '/solutions/woodworking',
      color: 'bg-amber-50 border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
    },
  ];

  const sizes = [
    {
      name: 'Small Shops',
      sub: '1–10 machines',
      desc: 'Perfect for owner-operators and small teams. Get set up in 15 minutes and immediately know what maintenance is coming up. No IT help needed.',
      features: ['Quick setup — no training required', 'Simple dashboard built for small teams', 'Email alerts for due tasks', 'Mobile-friendly for shop floor use'],
      price: 'Starting at $79/mo',
      href: '/solutions/small',
      featured: false,
    },
    {
      name: 'Growing Operations',
      sub: '10–30 machines',
      desc: 'For shops that have outgrown spreadsheets and need a real system without enterprise complexity. Track everything, automate scheduling, and reduce breakdowns.',
      features: ['Multi-technician work orders', 'SMS + email alerts', 'Advanced analytics', 'Parts inventory tracking', 'Shift-based scheduling'],
      price: 'Starting at $149/mo',
      href: '/solutions/growing',
      featured: true,
    },
    {
      name: 'Mid-size Plants',
      sub: '30–100+ machines',
      desc: 'Multi-facility management, custom reports, API access, and dedicated support. Everything larger operations need without the $50K+ enterprise price tag.',
      features: ['Multiple facilities', 'Custom KPI dashboards', 'API & integrations', 'Dedicated account manager', 'Priority support SLA'],
      price: 'Starting at $299/mo',
      href: '/solutions/midsize',
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#f0fff8] to-[#f0f4ff] py-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-emerald-200 to-teal-300 top-[-150px] right-[-100px] opacity-40" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-blue-200 to-indigo-300 top-[100px] right-[300px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="max-w-3xl">
            <span className="section-label">Solutions</span>
            <h1 className="text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Built for your industry.{' '}
              <span className="gradient-text">Sized for your team.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Whether you run a 3-machine fab shop or a 50-machine plastics plant, Myncel has a solution designed for your specific maintenance challenges.
            </p>
            <div className="flex gap-4">
              <Link href="/signup" className="btn-stripe-primary text-base px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary text-base px-6 py-3">Talk to an expert</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">By Industry</span>
            <h2 className="text-4xl font-bold text-[#0a2540]">Solutions for every shop floor</h2>
            <p className="text-[#425466] mt-3 max-w-xl mx-auto">Every industry has unique maintenance requirements. Myncel adapts to yours.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {industries.map((ind, i) => (
              <Link key={i} href={ind.href} className={`border rounded-2xl p-7 hover:shadow-lg transition-all group block ${ind.color}`}>
                <div className="text-3xl mb-4">{ind.icon}</div>
                <h3 className="font-bold text-[#0a2540] text-lg mb-2">{ind.name}</h3>
                <p className="text-sm text-[#425466] leading-relaxed mb-5">{ind.desc}</p>
                <div className="flex gap-4 mb-4">
                  {ind.stats.map((s) => (
                    <div key={s.label}>
                      <div className="font-bold text-[#0a2540]">{s.val}</div>
                      <div className="text-xs text-[#8898aa]">{s.label}</div>
                    </div>
                  ))}
                </div>
                <span className="text-sm font-semibold text-[#635bff] group-hover:underline">Explore solution →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* By size */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">By Team Size</span>
            <h2 className="text-4xl font-bold text-[#0a2540]">Find the right fit for your operation</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {sizes.map((s, i) => (
              <div key={i} className={`rounded-2xl p-8 border ${s.featured ? 'bg-[#635bff] border-transparent shadow-2xl shadow-purple-200' : 'bg-white border-[#e6ebf1]'}`}>
                {s.featured && <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Most Popular</div>}
                <h3 className={`text-xl font-bold mb-0.5 ${s.featured ? 'text-white' : 'text-[#0a2540]'}`}>{s.name}</h3>
                <p className={`text-sm mb-4 ${s.featured ? 'text-purple-200' : 'text-[#8898aa]'}`}>{s.sub}</p>
                <p className={`text-sm leading-relaxed mb-6 ${s.featured ? 'text-purple-100' : 'text-[#425466]'}`}>{s.desc}</p>
                <ul className="space-y-2.5 mb-6">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <svg className={`w-4 h-4 flex-shrink-0 ${s.featured ? 'text-purple-200' : 'text-[#635bff]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={s.featured ? 'text-purple-100' : 'text-[#425466]'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <p className={`text-sm font-bold mb-4 ${s.featured ? 'text-purple-200' : 'text-[#635bff]'}`}>{s.price}</p>
                <Link href="/signup" className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${s.featured ? 'bg-white text-[#635bff] hover:bg-purple-50' : 'bg-[#635bff] text-white hover:bg-[#4f46e5]'}`}>
                  Start free trial →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="section-label">Why Myncel</span>
            <h2 className="text-4xl font-bold text-[#0a2540]">How we compare</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#e6ebf1]">
                  <th className="text-left py-3 pr-6 text-[#8898aa] font-semibold">Feature</th>
                  <th className="text-center py-3 px-4 text-[#635bff] font-bold">Myncel</th>
                  <th className="text-center py-3 px-4 text-[#8898aa] font-semibold">Spreadsheets</th>
                  <th className="text-center py-3 px-4 text-[#8898aa] font-semibold">Enterprise CMMS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Setup time', sentinel: '15 minutes', sheets: '1–2 days', enterprise: '3–6 months' },
                  { feature: 'Cost per month', sentinel: '$79–$299', sheets: 'Free (but costly)', enterprise: '$2,000–$10,000+' },
                  { feature: 'Mobile access', sentinel: '✓', sheets: '~', enterprise: '✓' },
                  { feature: 'Automatic alerts', sentinel: '✓', sheets: '✗', enterprise: '✓' },
                  { feature: 'Work order photos', sentinel: '✓', sheets: '✗', enterprise: '✓' },
                  { feature: 'Parts inventory', sentinel: '✓', sheets: '~', enterprise: '✓' },
                  { feature: 'Built for small shops', sentinel: '✓', sheets: '✓', enterprise: '✗' },
                  { feature: 'No IT help needed', sentinel: '✓', sheets: '✓', enterprise: '✗' },
                  { feature: 'Real support', sentinel: '✓', sheets: '✗', enterprise: '$$$' },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-[#f6f9fc] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                    <td className="py-3 pr-6 text-[#0a2540] font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-semibold text-[#635bff]">{row.sentinel}</td>
                    <td className="py-3 px-4 text-center text-[#8898aa]">{row.sheets}</td>
                    <td className="py-3 px-4 text-center text-[#8898aa]">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0a2540]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Find your solution today</h2>
          <p className="text-[#8898aa] mb-8 text-lg">3-month free trial. No credit card. Cancel anytime.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="bg-[#635bff] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#4f46e5] transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-[#2a4a7f] text-white font-medium px-8 py-3 rounded-lg hover:bg-[#1e3a5f] transition-colors">Talk to sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}