import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Metal Fabrication Maintenance Software — CNC & Press Brake PM',
  description: 'Myncel helps metal fabrication shops maintain CNC machines, press brakes, laser cutters, and welding equipment. Reduce unplanned downtime and extend equipment life.',
  alternates: { canonical: 'https://myncel.com/solutions/metal-fabrication' },
};

export default function MetalFabrication() {
  const equipment = [
    { name: 'CNC Machines', tasks: ['Spindle lubrication', 'Way cleaning', 'Tool changer maintenance', 'Coolant checks'] },
    { name: 'Press Brakes', tasks: ['Hydraulic fluid checks', 'Back gauge calibration', 'Ram alignment', 'Die inspection'] },
    { name: 'Laser Cutters', tasks: ['Lens cleaning', 'Gas pressure checks', 'Beam alignment', 'Cutting head maintenance'] },
    { name: 'Welding Equipment', tasks: ['Wire feed inspection', 'Gas flow verification', 'Contact tip replacement', 'Ground clamp checks'] },
  ];

  const challenges = [
    { icon: '⚙️', challenge: 'Multiple machine types', solution: 'Unified tracking for all equipment—CNC, press brakes, lasers, welders—in one system.' },
    { icon: '🔧', challenge: 'Specialized maintenance', solution: 'Custom task templates for each machine type with manufacturer-recommended intervals.' },
    { icon: '📊', challenge: 'Production pressure', solution: 'Schedule maintenance during planned downtime. Prevent unexpected breakdowns.' },
    { icon: '👥', challenge: 'Small teams', solution: 'Simple interface your whole team can use. No training required.' },
  ];

  const stats = [
    { value: '43%', label: 'Less unplanned downtime' },
    { value: '2.1h', label: 'Average setup time' },
    { value: '99.2%', label: 'On-time PM completion' },
    { value: '$18K', label: 'Average annual savings' },
  ];

  const testimonials = [
    { quote: 'We went from constant firefighting to planned maintenance. Myncel paid for itself in the first month.', author: 'Mike R.', company: 'Precision Metal Works, Ohio' },
    { quote: 'Finally, a system our guys actually use. Setup took 20 minutes and we were tracking every machine.', author: 'Sarah T.', company: 'Midwest Fabrication, Indiana' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-gray-100 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-slate-300 to-gray-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Metal Fabrication</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Metal Fabrication
              <span className="block text-slate-600">Keep your shop floor running at full capacity.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              CNC machines, press brakes, laser cutters, and welding equipment require strict PM schedules. Myncel helps you stay on top of every machine in your fab shop.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Talk to an expert</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-700">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-slate-300 text-sm">{stat.label}</div>
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
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for your equipment</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-bold text-[#0a2540] text-lg mb-4">{eq.name}</h3>
                <ul className="space-y-2">
                  {eq.tasks.map((task, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[#425466]">
                      <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Challenges */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Challenges We Solve</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">We understand metal fabrication</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {challenges.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-[#e6ebf1]">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-[#0a2540] mb-1">{item.challenge}</h3>
                    <p className="text-sm text-[#425466]">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="section-label">Testimonials</span>
            <h2 className="text-3xl font-bold text-[#0a2540]">What fab shops say</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6">
                <p className="text-[#425466] mb-4 italic">"{t.quote}"</p>
                <p className="text-sm font-semibold text-[#0a2540]">{t.author}</p>
                <p className="text-xs text-[#8898aa]">{t.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to transform your maintenance?</h2>
          <p className="text-slate-300 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-slate-700 font-bold px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-slate-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-slate-600 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}