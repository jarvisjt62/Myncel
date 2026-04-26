import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Auto Parts Manufacturing Maintenance Software',
  description: 'Keep stamping presses, assembly lines, and testing equipment running at peak performance. Track OEE metrics and prevent costly line stoppages.',
  alternates: { canonical: 'https://myncel.com/solutions/auto-parts' },
};

export default function AutoParts() {
  const equipment = [
    { name: 'Stamping Presses', tasks: ['Die maintenance', 'Lubrication schedules', 'Hydraulic inspections', 'Tonnage monitoring'] },
    { name: 'Assembly Lines', tasks: ['Conveyor maintenance', 'Robot calibration', 'Torque tool checks', 'Safety sensor testing'] },
    { name: 'Testing Equipment', tasks: ['Calibration schedules', 'Sensor verification', 'Software updates', 'Fixture inspection'] },
    { name: 'CNC Machines', tasks: ['Tool changes', 'Spindle maintenance', 'Coolant management', 'Way lubrication'] },
  ];

  const stats = [
    { value: '99.2%', label: 'Uptime achieved' },
    { value: '27%', label: 'Maintenance cost reduction' },
    { value: '15min', label: 'Setup time' },
    { value: '3x', label: 'ROI first year' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-rose-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-red-300 to-rose-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-red-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Auto Parts Manufacturing</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Auto Parts Manufacturing
              <span className="block text-red-600">Keep the line running.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Keep stamping presses, assembly lines, and testing equipment running at peak performance. Track OEE metrics and prevent costly line stoppages.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Talk to an expert</Link>
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
            <span className="section-label">Equipment Coverage</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for automotive manufacturing</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-red-50 rounded-2xl p-6">
                <h3 className="font-bold text-[#0a2540] text-lg mb-4">{eq.name}</h3>
                <ul className="space-y-2">
                  {eq.tasks.map((task, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[#425466]">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span className="section-label">Why Myncel</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for the speed of automotive</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Fast Response</h3>
              <p className="text-sm text-[#425466]">When a press goes down, every minute costs thousands. Myncel alerts your team instantly and tracks resolution time.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-bold text-[#0a2540] mb-2">OEE Tracking</h3>
              <p className="text-sm text-[#425466]">Monitor availability, performance, and quality metrics. Identify bottlenecks and improvement opportunities.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Preventive Focus</h3>
              <p className="text-sm text-[#425466]">Shift from reactive firefighting to planned maintenance. Reduce unplanned downtime and extend equipment life.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-red-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to improve your maintenance?</h2>
          <p className="text-red-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-red-600 font-bold px-8 py-3 rounded-lg hover:bg-red-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-red-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}