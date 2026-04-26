import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Food & Beverage Maintenance Software — FDA & HACCP Compliance',
  description: 'Meet HACCP and FDA compliance requirements with scheduled sanitation, calibration, and inspection records automatically stored and audit-ready.',
  alternates: { canonical: 'https://myncel.com/solutions/food-beverage' },
};

export default function FoodBeverage() {
  const complianceFeatures = [
    { icon: '📋', title: 'HACCP Compliance', desc: 'Schedule and document all HACCP-required maintenance tasks. Automatic records that satisfy auditors.' },
    { icon: '🔬', title: 'FDA Requirements', desc: 'Meet 21 CFR Part 11 requirements for electronic records. Audit trails, signatures, and secure storage.' },
    { icon: '🧪', title: 'Calibration Tracking', desc: 'Track calibration schedules for thermometers, scales, pH meters, and all measuring equipment.' },
    { icon: '🧼', title: 'Sanitation Schedules', desc: 'Plan and document sanitation cycles. Ensure food contact surfaces are cleaned on schedule.' },
  ];

  const equipment = [
    'Processing equipment', 'Packaging machines', 'Refrigeration systems', 'Mixing tanks', 'Conveyor systems', 'Filling equipment',
  ];

  const stats = [
    { value: '100%', label: 'Audit pass rate' },
    { value: '5x', label: 'Faster compliance docs' },
    { value: '0', label: 'Missed calibrations' },
    { value: '24/7', label: 'Audit-ready records' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-green-300 to-emerald-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Food & Beverage</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Food & Beverage
              <span className="block text-green-600">Compliance made simple.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Meet HACCP and FDA compliance requirements with scheduled sanitation, calibration, and inspection records automatically stored and audit-ready.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Talk to an expert</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-green-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-green-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Compliance Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for food safety requirements</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {complianceFeatures.map((f, i) => (
              <div key={i} className="bg-green-50 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{f.icon}</div>
                  <div>
                    <h3 className="font-bold text-[#0a2540] text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-[#425466]">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Equipment</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Track all your food production equipment</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-white border border-[#e6ebf1] rounded-full px-5 py-2 text-sm font-medium text-[#0a2540]">
                {eq}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Ready */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-label">Audit Ready</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">Be ready for any inspection</h2>
              <p className="text-[#425466] mb-6">When auditors ask for maintenance records, you\'ll have them in seconds. Every task, every calibration, every cleaning—documented and searchable.</p>
              <ul className="space-y-3">
                {['Generate compliance reports instantly', 'Electronic signatures for all records', 'Complete audit trail for every action', 'Export records for auditors in PDF format'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#425466]">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-8">
              <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0a2540]">Sanitation Log</span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Complete</span>
                </div>
                <div className="text-sm text-[#425466]">Mixer #3 - Post-shift cleaning</div>
                <div className="text-xs text-[#8898aa] mt-1">Completed by: J. Smith • 2 hours ago</div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0a2540]">Calibration</span>
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">Due Tomorrow</span>
                </div>
                <div className="text-sm text-[#425466]">Thermometer #7 - Monthly calibration</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to simplify compliance?</h2>
          <p className="text-green-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-green-600 font-bold px-8 py-3 rounded-lg hover:bg-green-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-green-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}