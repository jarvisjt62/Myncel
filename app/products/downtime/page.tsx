import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Downtime Tracking — Know Why Machines Stop',
  description: 'Track every minute of downtime by cause, machine, and shift. Identify patterns, reduce unplanned stops, and improve OEE.',
  alternates: { canonical: 'https://myncel.com/products/downtime' },
};

export default function Downtime() {
  const features = [
    { icon: '⏱️', title: 'Real-Time Tracking', desc: 'Log downtime as it happens. Know exactly when machines stop and why.' },
    { icon: '📊', title: 'Cause Analysis', desc: 'Categorize downtime by cause—breakdown, changeover, material shortage, or planned.' },
    { icon: '🏭', title: 'Machine Comparison', desc: 'See which machines have the most downtime. Focus improvement efforts where they matter.' },
    { icon: '📈', title: 'OEE Calculation', desc: 'Automatically calculate Overall Equipment Effectiveness from availability, performance, and quality.' },
  ];

  const stats = [
    { value: '100%', label: 'Downtime visibility' },
    { value: '30%', label: 'Less unplanned stops' },
    { value: 'Real-time', label: 'Alerts' },
    { value: '15min', label: 'Setup time' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-rose-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 text-red-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Downtime Tracking</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Downtime Tracking
              <span className="block text-red-600">Every minute counts.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Track every minute of downtime by cause, machine, and shift. Identify patterns, reduce unplanned stops, and improve Overall Equipment Effectiveness (OEE).
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-red-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-red-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Understand your downtime</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-red-50 rounded-2xl p-6">
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
            <span className="section-label">Downtime Categories</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Know why machines stop</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {['Breakdown', 'Changeover', 'Material Shortage', 'Planned Maintenance', 'No Operator', 'Quality Issue', 'Tool Change', 'Other'].map((cat, i) => (
              <div key={i} className="bg-white border border-[#e6ebf1] rounded-xl p-4 text-center">
                <div className="font-semibold text-[#0a2540]">{cat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-red-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to reduce downtime?</h2>
          <p className="text-red-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-red-600 font-bold px-8 py-3 rounded-lg hover:bg-red-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}