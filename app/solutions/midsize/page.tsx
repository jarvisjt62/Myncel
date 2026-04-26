import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Mid-Size Plants Maintenance Software — For 30-100+ Machines',
  description: 'Multi-facility management, custom reports, API access, and dedicated support. Everything larger operations need without the enterprise price tag.',
  alternates: { canonical: 'https://myncel.com/solutions/midsize' },
};

export default function MidsizePlants() {
  const features = [
    { icon: '🏭', title: 'Multiple Facilities', desc: 'Manage maintenance across multiple plants from a single dashboard. Compare performance and share best practices.' },
    { icon: '📊', title: 'Custom KPI Dashboards', desc: 'Build dashboards that show the metrics that matter to your operation. Track what\'s important to your business.' },
    { icon: '🔌', title: 'API & Integrations', desc: 'Connect Myncel to your ERP, accounting system, or custom applications. Build the workflows you need.' },
    { icon: '👨‍💼', title: 'Dedicated Account Manager', desc: 'Get a named contact who knows your operation. Strategic guidance and priority support when you need it.' },
    { icon: '⚡', title: 'Priority Support SLA', desc: 'Guaranteed response times for support requests. Your issues get priority attention.' },
    { icon: '📈', title: 'Unlimited Machines', desc: 'No limit on equipment, users, or facilities. Grow without worrying about hitting caps.' },
  ];

  const pricing = {
    name: 'Enterprise Plan',
    price: '$299',
    period: '/month',
    machines: '30-100+ machines',
    features: ['Unlimited facilities', 'Unlimited machines', 'API access', 'Custom dashboards', 'Dedicated account manager', 'Priority support SLA'],
  };

  const stats = [
    { value: 'Unlimited', label: 'Machines & users' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '4hr', label: 'Support response' },
    { value: 'Custom', label: 'Integrations' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-purple-300 to-indigo-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Mid-Size Plants</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Mid-Size Plants
              <span className="block text-purple-600">Enterprise features without the enterprise price.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Multi-facility management, custom reports, API access, and dedicated support. Everything larger operations need without the $50K+ enterprise price tag.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Talk to sales</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-purple-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-purple-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Enterprise-grade capabilities</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-purple-50 rounded-xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-sm text-[#425466]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Multi-Facility</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Manage all your plants in one place</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">📍</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Location Dashboard</h3>
              <p className="text-sm text-[#425466]">See an overview of each facility\'s maintenance status. Know where problems exist at a glance.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Best Practice Sharing</h3>
              <p className="text-sm text-[#425466]">Copy schedules, task templates, and best practices between facilities. Standardize your maintenance.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Compare Performance</h3>
              <p className="text-sm text-[#425466]">See which facilities have the best uptime, compliance, and cost metrics. Learn from your top performers.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="section-label">Pricing</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Simple enterprise pricing</h2>
          </div>
          <div className="bg-purple-600 rounded-2xl p-8 max-w-md mx-auto shadow-xl">
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-2">{pricing.name}</h3>
              <div className="text-4xl font-bold mb-1">{pricing.price}<span className="text-lg text-purple-200">{pricing.period}</span></div>
              <div className="text-sm text-purple-200 mb-6">{pricing.machines}</div>
              <ul className="space-y-3 mb-8 text-left">
                {pricing.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-purple-100">
                    <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="block w-full bg-white text-purple-600 font-bold py-3 rounded-lg hover:bg-purple-50 transition-colors text-center">
                Talk to sales →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-purple-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready for enterprise-grade maintenance?</h2>
          <p className="text-purple-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-purple-600 font-bold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors">Talk to sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}