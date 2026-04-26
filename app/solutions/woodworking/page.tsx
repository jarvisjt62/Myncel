import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Woodworking & Furniture Maintenance Software',
  description: 'From panel saws to CNC routers and finishing lines, Myncel keeps your woodworking equipment in top shape and your production schedule on track.',
  alternates: { canonical: 'https://myncel.com/solutions/woodworking' },
};

export default function Woodworking() {
  const equipment = [
    { name: 'Panel Saws', tasks: ['Blade inspection', 'Scoring blade adjustment', 'Dust extraction checks', 'Rip fence calibration'] },
    { name: 'CNC Routers', tasks: ['Spindle maintenance', 'Tool changes', 'Vacuum hold-down checks', 'Dust collection'] },
    { name: 'Edge Banders', tasks: ['Glue pot cleaning', 'Pressure roller inspection', 'End trimming blades', 'Temperature settings'] },
    { name: 'Sanders', tasks: ['Belt replacement', 'Dust extraction', 'Pressure settings', 'Table alignment'] },
  ];

  const stats = [
    { value: '31%', label: 'Less blade waste' },
    { value: '4.2x', label: 'ROI in first year' },
    { value: '99%', label: 'On-time completion' },
    { value: '45%', label: 'Less rework' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-amber-300 to-orange-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Woodworking & Furniture</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Woodworking & Furniture
              <span className="block text-amber-600">Keep your shop running smoothly.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              From panel saws to CNC routers and finishing lines, Myncel keeps your woodworking equipment in top shape and your production schedule on track.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Talk to an expert</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-amber-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-amber-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Equipment Coverage</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for woodworking shops</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-amber-50 rounded-2xl p-6">
                <h3 className="font-bold text-[#0a2540] text-lg mb-4">{eq.name}</h3>
                <ul className="space-y-2">
                  {eq.tasks.map((task, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[#425466]">
                      <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Purpose-built for woodworking</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">🪚</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Blade & Tool Tracking</h3>
              <p className="text-sm text-[#425466]">Track blade usage and plan sharpening or replacement before quality suffers. Know exactly when tools need attention.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">🌫️</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Dust Collection</h3>
              <p className="text-sm text-[#425466]">Schedule filter changes and dust collection maintenance. Keep your air clean and your machines running.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
              <div className="text-3xl mb-4">📅</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Production Integration</h3>
              <p className="text-sm text-[#425466]">Schedule maintenance around production runs. Plan blade changes between jobs to minimize downtime.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-amber-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to improve your woodworking maintenance?</h2>
          <p className="text-amber-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-amber-600 font-bold px-8 py-3 rounded-lg hover:bg-amber-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}