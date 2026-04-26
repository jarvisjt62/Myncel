import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Downtime Reports — Analyze & Reduce Machine Downtime',
  description: 'Generate detailed downtime reports by cause, machine, shift, and time period. Identify patterns and reduce unplanned stops.',
  alternates: { canonical: 'https://myncel.com/products/downtime-reports' },
};

export default function DowntimeReports() {
  const reportFeatures = [
    { icon: '📊', title: 'Cause Analysis', desc: 'Break down downtime by root cause. See what\'s driving your biggest losses.' },
    { icon: '🏭', title: 'Machine Rankings', desc: 'See which machines have the most downtime. Prioritize improvement efforts.' },
    { icon: '📅', title: 'Trend Analysis', desc: 'Track downtime over time. Measure the impact of improvement initiatives.' },
    { icon: '👥', title: 'Shift Comparison', desc: 'Compare downtime across shifts. Identify training or staffing opportunities.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Downtime Reports</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Downtime Reports
              <span className="block text-orange-600">Understand every minute of lost production.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Generate detailed downtime reports by cause, machine, shift, and time period. Identify patterns and take action to reduce unplanned stops.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Powerful downtime insights</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {reportFeatures.map((f, i) => (
              <div key={i} className="bg-orange-50 rounded-xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-sm text-[#425466]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-orange-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to reduce downtime?</h2>
          <p className="text-orange-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-orange-600 font-bold px-8 py-3 rounded-lg hover:bg-orange-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}