import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Small Shop Maintenance Software — For 1-10 Machines',
  description: 'Perfect for owner-operators and small teams. Get set up in 15 minutes and immediately know what maintenance is coming up. No IT help needed.',
  alternates: { canonical: 'https://myncel.com/solutions/small' },
};

export default function SmallShops() {
  const features = [
    { icon: '⚡', title: 'Quick Setup', desc: 'No training required. Add your machines, set your schedules, and you\'re running in under 15 minutes.' },
    { icon: '📱', title: 'Simple Dashboard', desc: 'Built for small teams. See what\'s due, what\'s overdue, and what\'s coming at a glance.' },
    { icon: '📧', title: 'Email Alerts', desc: 'Get notified when tasks are due. Stay on top of maintenance without checking the system constantly.' },
    { icon: '📲', title: 'Mobile-Friendly', desc: 'Access from any smartphone on the shop floor. No app to install—works in your browser.' },
    { icon: '💰', title: 'Affordable', desc: 'Starting at $79/month. Less than one hour of downtime costs.' },
    { icon: '🚫', title: 'No IT Required', desc: 'No servers to maintain, no software to install. Everything runs in the cloud.' },
  ];

  const pricing = {
    name: 'Starter Plan',
    price: '$79',
    period: '/month',
    machines: '1-10 machines',
    features: ['Unlimited users', 'Email alerts', 'Basic analytics', 'Mobile access', '1 facility'],
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-emerald-300 to-teal-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Small Shops</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Small Shops
              <span className="block text-emerald-600">Maintenance made simple for 1-10 machines.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Perfect for owner-operators and small teams. Get set up in 15 minutes and immediately know what maintenance is coming up. No IT help needed.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/pricing" className="btn-stripe-secondary px-6 py-3">View pricing</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Everything you need, nothing you don't</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-emerald-50 rounded-xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-sm text-[#425466]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="section-label">Pricing</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Simple, affordable pricing</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#e6ebf1] p-8 max-w-md mx-auto">
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#0a2540] mb-2">{pricing.name}</h3>
              <div className="text-4xl font-bold text-emerald-600 mb-1">{pricing.price}<span className="text-lg text-[#8898aa]">{pricing.period}</span></div>
              <div className="text-sm text-[#8898aa] mb-6">{pricing.machines}</div>
              <ul className="space-y-3 mb-8 text-left">
                {pricing.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#425466]">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors text-center">
                Start free trial →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-emerald-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to get organized?</h2>
          <p className="text-emerald-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-emerald-600 font-bold px-8 py-3 rounded-lg hover:bg-emerald-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}