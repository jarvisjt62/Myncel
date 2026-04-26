import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Electronics Assembly Maintenance Software — SMT & Calibration',
  description: 'SMT lines, wave soldering, reflow ovens, and AOI machines require precise calibration schedules. Myncel tracks every interval down to the minute.',
  alternates: { canonical: 'https://myncel.com/solutions/electronics' },
};

export default function Electronics() {
  const equipment = [
    { name: 'SMT Lines', tasks: ['Feeder calibration', 'Nozzle inspection', 'Vision system checks', 'Conveyor alignment'] },
    { name: 'Wave Soldering', tasks: ['Solder pot analysis', 'Flux management', 'Preheat calibration', 'Wave height checks'] },
    { name: 'Reflow Ovens', tasks: ['Profile verification', 'Belt inspection', 'Zone calibration', 'Nitrogen levels'] },
    { name: 'AOI Machines', tasks: ['Camera calibration', 'Lighting checks', 'Software updates', 'Library updates'] },
  ];

  const stats = [
    { value: '52%', label: 'Less rework' },
    { value: '99.7%', label: 'Calibration compliance' },
    { value: '0', label: 'Missed calibrations' },
    { value: '$25K', label: 'Average annual savings' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-amber-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-yellow-300 to-amber-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-yellow-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Electronics Assembly</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Electronics Assembly
              <span className="block text-yellow-600">Precision maintenance for precision manufacturing.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              SMT lines, wave soldering, reflow ovens, and AOI machines require precise calibration schedules. Myncel tracks every interval down to the minute.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Talk to an expert</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-yellow-500">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-yellow-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Equipment Coverage</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for electronics manufacturing</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-yellow-50 rounded-2xl p-6">
                <h3 className="font-bold text-[#0a2540] text-lg mb-4">{eq.name}</h3>
                <ul className="space-y-2">
                  {eq.tasks.map((task, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[#425466]">
                      <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Calibration Management</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Never miss a calibration deadline</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <h3 className="font-bold text-[#0a2540] text-lg mb-4">📊 Calibration Scheduling</h3>
              <p className="text-sm text-[#425466] mb-4">Set up calibration schedules for every piece of equipment that requires it. Myncel tracks due dates and sends reminders before calibration is due.</p>
              <ul className="space-y-2 text-sm text-[#425466]">
                <li>• ISO 9001 compliance tracking</li>
                <li>• Calibration certificates storage</li>
                <li>• Out-of-tolerance alerts</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <h3 className="font-bold text-[#0a2540] text-lg mb-4">📋 Audit Trail</h3>
              <p className="text-sm text-[#425466] mb-4">Every calibration is logged with date, technician, results, and certificates. Be ready for any quality audit with complete documentation.</p>
              <ul className="space-y-2 text-sm text-[#425466]">
                <li>• Complete calibration history</li>
                <li>• Export reports for auditors</li>
                <li>• Trend analysis over time</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-yellow-500">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to improve your calibration management?</h2>
          <p className="text-yellow-100 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-yellow-600 font-bold px-8 py-3 rounded-lg hover:bg-yellow-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}