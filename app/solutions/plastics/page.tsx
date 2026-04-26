import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Plastics & Injection Molding Maintenance Software',
  description: 'Myncel helps plastics manufacturers maintain injection molding machines, extruders, and granulators. Track maintenance by machine cycles, not just calendar days.',
  alternates: { canonical: 'https://myncel.com/solutions/plastics' },
};

export default function Plastics() {
  const equipment = [
    { name: 'Injection Molding Machines', tasks: ['Barrel cleaning', 'Nozzle inspection', 'Screw wear checks', 'Hydraulic system maintenance'] },
    { name: 'Extruders', tasks: ['Screw inspection', 'Die cleaning', 'Barrel temperature checks', 'Drive system maintenance'] },
    { name: 'Granulators', tasks: ['Blade sharpening', 'Screen replacement', 'Bearing lubrication', 'Safety interlock checks'] },
    { name: 'Mold Maintenance', tasks: ['Cavity cleaning', 'Ejector pin inspection', 'Cooling channel cleaning', 'Surface treatment'] },
  ];

  const stats = [
    { value: '38%', label: 'Fewer mold defects' },
    { value: '$18K', label: 'Average annual savings' },
    { value: '99.5%', label: 'Cycle-based compliance' },
    { value: '60%', label: 'Less reactive maintenance' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-blue-300 to-indigo-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Plastics & Injection Molding</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Plastics & Injection Molding
              <span className="block text-blue-600">Maintain quality through better maintenance.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Injection molding machines, extruders, and granulators need cycle-based maintenance tracking. Myncel tracks by machine cycles, not just calendar days.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Talk to an expert</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-blue-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Coverage */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Equipment Coverage</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for plastics manufacturing</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-blue-50 rounded-2xl p-6">
                <h3 className="font-bold text-[#0a2540] text-lg mb-4">{eq.name}</h3>
                <ul className="space-y-2">
                  {eq.tasks.map((task, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[#425466]">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cycle-based Maintenance */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-label">Cycle-Based Tracking</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">Maintenance based on actual usage</h2>
              <p className="text-[#425466] mb-6">Injection molds and extrusion screws wear based on cycles run, not calendar days. Myncel tracks actual machine cycles and schedules maintenance when it\'s truly needed.</p>
              <ul className="space-y-3">
                {['Track cycles, shots, or hours of operation', 'Schedule mold cleaning after N cycles', 'Plan screw inspections based on wear', 'Reduce defects with timely maintenance'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#425466]">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">10,000</div>
              <div className="text-[#425466]">cycles since last mold cleaning</div>
              <div className="mt-4 bg-white rounded-lg p-4 text-sm">
                <div className="text-amber-600 font-semibold">⚠️ Maintenance Due</div>
                <div className="text-[#425466] mt-1">Mold #12 - Cavity cleaning recommended</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to improve your mold maintenance?</h2>
          <p className="text-blue-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}