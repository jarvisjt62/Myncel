import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Analytics & Reporting — Maintenance Data Insights',
  description: 'Understand your true maintenance costs, identify your most problem-prone equipment, and track your team\'s performance over time with powerful analytics.',
  alternates: { canonical: 'https://myncel.com/products/analytics' },
};

export default function Analytics() {
  const features = [
    {
      icon: '📈',
      title: 'Uptime & Downtime Tracking',
      desc: 'See exactly how much uptime each machine achieves. Track downtime by cause, duration, and frequency. Identify your biggest problem areas.',
    },
    {
      icon: '💰',
      title: 'Cost Per Machine Reports',
      desc: 'Know the true cost of ownership for every piece of equipment. Factor in labor, parts, downtime, and lost production to make informed replacement decisions.',
    },
    {
      icon: '👨‍🔧',
      title: 'Technician Performance',
      desc: 'Track completion rates, average time per task, and first-time fix rates. Recognize top performers and identify training opportunities.',
    },
    {
      icon: '📊',
      title: 'Trend Analysis',
      desc: 'Spot patterns over time. Are breakdowns increasing? Is PM compliance improving? See the trends that matter to your operation.',
    },
    {
      icon: '🗓️',
      title: 'Custom Date Ranges',
      desc: 'Analyze any time period—last week, last quarter, last year, or custom ranges. Compare periods to measure improvement.',
    },
    {
      icon: '📄',
      title: 'Export to PDF & CSV',
      desc: 'Download reports for meetings, presentations, or record-keeping. Share insights with stakeholders who don\'t use the system.',
    },
  ];

  const metrics = [
    { metric: 'Overall Equipment Effectiveness (OEE)', desc: 'Composite measure of availability, performance, and quality' },
    { metric: 'Mean Time Between Failures (MTBF)', desc: 'Average time between equipment breakdowns' },
    { metric: 'Mean Time To Repair (MTTR)', desc: 'Average time to restore equipment to operation' },
    { metric: 'Planned vs Unplanned Ratio', desc: 'Percentage of maintenance that was scheduled vs reactive' },
    { metric: 'PM Compliance Rate', desc: 'Percentage of scheduled maintenance completed on time' },
    { metric: 'Maintenance Cost per Unit', desc: 'Total maintenance spend divided by production output' },
  ];

  const stats = [
    { value: '100%', label: 'Visibility into costs' },
    { value: '5min', label: 'Report generation' },
    { value: '50+', label: 'Built-in metrics' },
    { value: '∞', label: 'Custom reports' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-indigo-300 to-blue-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Analytics & Reporting</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Analytics & Reporting
              <span className="block text-indigo-600">Turn maintenance data into business decisions.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Understand your true maintenance costs, identify your most problem-prone equipment, and track your team\'s performance over time. Monthly reports delivered automatically.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Key Metrics */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Key Metrics</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Industry-standard KPIs built in</h2>
            <p className="text-[#425466] mt-3 max-w-xl mx-auto">Track the metrics that matter most to maintenance operations.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((m, i) => (
              <div key={i} className="border border-[#e6ebf1] rounded-xl p-5">
                <h3 className="font-bold text-[#0a2540] mb-2">{m.metric}</h3>
                <p className="text-sm text-[#425466]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Powerful analytics, simple interface</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#e6ebf1] hover:shadow-lg transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to see your data clearly?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}