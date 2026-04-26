import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Growing Operations Maintenance Software — For 10-30 Machines',
  description: 'For shops that have outgrown spreadsheets. Track everything, automate scheduling, and reduce breakdowns with a real maintenance system.',
  alternates: { canonical: 'https://myncel.com/solutions/growing' },
};

export default function GrowingOperations() {
  const features = [
    { icon: '👥', title: 'Multi-Technician Work Orders', desc: 'Assign tasks to specific technicians. Track who\'s working on what. Balance workload across your growing team.' },
    { icon: '📱', title: 'SMS + Email Alerts', desc: 'Reach your team wherever they are. Text messages ensure urgent tasks get attention immediately.' },
    { icon: '📊', title: 'Advanced Analytics', desc: 'Understand maintenance costs, identify problem machines, and track team performance with detailed reports.' },
    { icon: '📦', title: 'Parts Inventory', desc: 'Track spare parts, set reorder points, and know exactly what you have in stock. No more emergency parts runs.' },
    { icon: '🔄', title: 'Shift-Based Scheduling', desc: 'Schedule maintenance across multiple shifts. Ensure the right tasks are assigned to the right shift.' },
    { icon: '🏭', title: 'Multi-Area Tracking', desc: 'Organize machines by production area or cell. See what\'s happening across your growing facility.' },
  ];

  const pricing = {
    name: 'Professional Plan',
    price: '$149',
    period: '/month',
    machines: '10-30 machines',
    features: ['Unlimited users', 'SMS + Email alerts', 'Advanced analytics', 'Parts inventory', 'Shift scheduling', 'Up to 3 facilities'],
  };

  const stats = [
    { value: '60%', label: 'Less scheduling effort' },
    { value: '35%', label: 'Fewer breakdowns' },
    { value: '3', label: 'Facilities supported' },
    { value: 'Unlimited', label: 'Team members' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-indigo-300 to-purple-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Growing Operations</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Growing Operations
              <span className="block text-indigo-600">Ready when you've outgrown spreadsheets.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              For shops with 10-30 machines that need a real maintenance system without enterprise complexity. Track everything, automate scheduling, and reduce breakdowns.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/pricing" className="btn-stripe-secondary px-6 py-3">View pricing</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-indigo-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-indigo-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Scale your maintenance operation</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-indigo-50 rounded-xl p-6">
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
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Most popular for growing shops</h2>
          </div>
          <div className="bg-indigo-600 rounded-2xl p-8 max-w-md mx-auto shadow-xl">
            <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">Most Popular</div>
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-2">{pricing.name}</h3>
              <div className="text-4xl font-bold mb-1">{pricing.price}<span className="text-lg text-indigo-200">{pricing.period}</span></div>
              <div className="text-sm text-indigo-200 mb-6">{pricing.machines}</div>
              <ul className="space-y-3 mb-8 text-left">
                {pricing.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-indigo-100">
                    <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full bg-white text-indigo-600 font-bold py-3 rounded-lg hover:bg-indigo-50 transition-colors text-center">
                Start free trial →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to scale your maintenance?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-indigo-600 font-bold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}