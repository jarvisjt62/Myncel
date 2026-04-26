import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Maintenance Reports — Automated Insights & Analytics',
  description: 'Generate maintenance reports automatically. Track costs, compliance, and performance with customizable dashboards and exports.',
  alternates: { canonical: 'https://myncel.com/products/reports' },
};

export default function Reports() {
  const reportTypes = [
    { name: 'Maintenance Costs', desc: 'Track labor, parts, and total cost by machine, area, or time period', icon: '💰' },
    { name: 'PM Compliance', desc: 'See completion rates for scheduled preventive maintenance tasks', icon: '✅' },
    { name: 'Downtime Analysis', desc: 'Understand when, why, and how long machines are down', icon: '⏱️' },
    { name: 'Work Order Summary', desc: 'Overview of created, completed, and open work orders', icon: '📋' },
    { name: 'Parts Usage', desc: 'Track parts consumption and inventory value changes', icon: '📦' },
    { name: 'Team Performance', desc: 'Monitor technician productivity and completion metrics', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Reports</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Maintenance Reports
              <span className="block text-indigo-600">Data-driven decisions made easy.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Generate maintenance reports automatically. Track costs, compliance, and performance with customizable dashboards and exports to PDF and CSV.
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
            <span className="section-label">Report Types</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built-in reports for every need</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((r, i) => (
              <div key={i} className="bg-indigo-50 rounded-xl p-6">
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{r.name}</h3>
                <p className="text-sm text-[#425466]">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Powerful reporting made simple</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">📧</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Email Delivery</h3>
              <p className="text-sm text-[#425466]">Schedule reports to be delivered to your inbox automatically. Daily, weekly, or monthly.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">📄</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Export Anywhere</h3>
              <p className="text-sm text-[#425466]">Download reports in PDF for presentations or CSV for further analysis in spreadsheets.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Custom Date Ranges</h3>
              <p className="text-sm text-[#425466]">Analyze any time period. Compare performance across weeks, months, or quarters.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready for better insights?</h2>
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