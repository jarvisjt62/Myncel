import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Metal Fabrication Maintenance Software — CNC & Press Brake PM',
  description: 'Myncel helps metal fabrication shops maintain CNC machines, press brakes, laser cutters, and welding equipment. Reduce unplanned downtime and extend equipment life.',
  alternates: { canonical: 'https://www.myncel.com/solutions/metal-fabrication' },
  openGraph: {
    title: 'Myncel for Metal Fabrication — CNC & Press Brake Maintenance Software',
    description: 'Track maintenance for all your fabrication equipment in one system. CNC machines, press brakes, laser cutters, and welders. Free 30-day trial.',
    url: 'https://www.myncel.com/solutions/metal-fabrication',
  },
};

export default function MetalFabrication() {
  const equipment = [
    { name: 'CNC Machines', icon: '🔩', tasks: ['Spindle lubrication', 'Way cleaning', 'Tool changer maintenance', 'Coolant checks'] },
    { name: 'Press Brakes', icon: '⚙️', tasks: ['Hydraulic fluid checks', 'Back gauge calibration', 'Ram alignment', 'Die inspection'] },
    { name: 'Laser Cutters', icon: '📡', tasks: ['Lens cleaning', 'Gas pressure checks', 'Beam alignment', 'Cutting head maintenance'] },
    { name: 'Welding Equipment', icon: '⚡', tasks: ['Wire feed inspection', 'Gas flow verification', 'Contact tip replacement', 'Ground clamp checks'] },
  ];

  const challenges = [
    { icon: '⚙️', challenge: 'Multiple machine types', solution: 'Unified tracking for all equipment—CNC, press brakes, lasers, welders—in one system.' },
    { icon: '🔧', challenge: 'Specialized maintenance', solution: 'Custom task templates for each machine type with manufacturer-recommended intervals.' },
    { icon: '📊', challenge: 'Production pressure', solution: 'Schedule maintenance during planned downtime. Prevent unexpected breakdowns.' },
    { icon: '👥', challenge: 'Small teams', solution: 'Simple interface your whole team can use. No training required.' },
  ];

  const stats = [
    { value: '43%', label: 'Less unplanned downtime' },
    { value: '20 min', label: 'Average setup time' },
    { value: '99.2%', label: 'On-time PM completion' },
    { value: '$18K', label: 'Average annual savings' },
  ];

  const testimonials = [
    { quote: 'We went from constant firefighting to planned maintenance. Myncel paid for itself in the first month.', author: 'Mike R.', company: 'Precision Metal Works, Ohio', machines: '12 CNC machines' },
    { quote: 'Finally, a system our guys actually use. Setup took 20 minutes and we were tracking every machine.', author: 'Sarah T.', company: 'Midwest Fabrication, Indiana', machines: '8 press brakes, 4 lasers' },
    { quote: 'Our customers ask for maintenance records now. Myncel gives us instant documentation for every job.', author: 'Dave L.', company: 'Pacific Precision Fabrication, California', machines: 'Full fab shop' },
  ];

  const howItWorks = [
    { step: 1, title: 'Add your equipment', desc: 'Import machines in bulk or add one by one. Pre-built templates for CNC, press brakes, lasers, and more.' },
    { step: 2, title: 'Set PM schedules', desc: 'Choose manufacturer intervals or customize based on usage. Automatic reminders keep you on track.' },
    { step: 3, title: 'Track everything', desc: 'Technicians log work from their phones. Complete history for every machine, always accessible.' },
    { step: 4, title: 'Prevent breakdowns', desc: 'Get alerts before problems happen. See what\'s due, what\'s overdue, and what needs attention.' },
  ];

  const trustBadges = [
    'ISO 9001 Ready',
    'AS9100 Compatible',
    'ITAR Compliant',
    'SOC 2 Certified',
  ];

  const roiItems = [
    { label: 'Average CNC downtime cost', value: '$200-500/hour' },
    { label: 'Breakdowns prevented per year', value: '8-12 incidents' },
    { label: 'Maintenance time saved', value: '15+ hours/week' },
    { label: 'ROI typical payback period', value: '30-60 days' },
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
                Metal Fabrication
                <span className="block text-slate-600 text-3xl lg:text-4xl mt-2">Keep your shop floor running at full capacity.</span>
              </h1>
              <p className="text-xl text-[#425466] leading-relaxed mb-8">
                CNC machines, press brakes, laser cutters, and welding equipment require strict PM schedules. Myncel helps you stay on top of every machine in your fab shop.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
                <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Talk to an expert</Link>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">✓ 30-day free trial</span>
                <span className="flex items-center gap-1">✓ No credit card required</span>
                <span className="flex items-center gap-1">✓ Cancel anytime</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
              <h3 className="font-bold text-[#0a2540] mb-4 text-center">Calculate Your Savings</h3>
              <div className="space-y-3">
                {roiItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-[#425466]">{item.label}</span>
                    <span className="font-bold text-[#0a2540]">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">Based on data from 500+ fabrication shops using Myncel</p>
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

      {/* Trust Badges */}
      <section className="py-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-600">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {badge}
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
            <p className="text-[#425466] mt-4 max-w-2xl mx-auto">Pre-configured maintenance templates for every machine type in your shop. Just select your equipment and start tracking.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{eq.icon}</div>
                <h3 className="font-bold text-[#0a2540] text-lg mb-4">{eq.name}</h3>
                <ul className="space-y-2">
                  {eq.tasks.map((task, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-[#425466]">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* How It Works */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Up and running in under an hour</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="w-10 h-10 bg-slate-700 text-white rounded-full flex items-center justify-center font-bold mb-4">{item.step}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{item.title}</h3>
                <p className="text-sm text-[#425466]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Challenges We Solve</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">We understand metal fabrication</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {challenges.map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors">
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
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="section-label">Testimonials</span>
            <h2 className="text-3xl font-bold text-[#0a2540]">What fab shops say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(star => (
                    <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#425466] mb-4 italic">"{t.quote}"</p>
                <p className="text-sm font-semibold text-[#0a2540]">{t.author}</p>
                <p className="text-xs text-[#8898aa]">{t.company}</p>
                <p className="text-xs text-slate-400 mt-1">{t.machines}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Compliance */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-4">Customer quality audits? No problem.</h2>
          <p className="text-[#425466] mb-8">Your customers want maintenance records. Myncel stores every inspection, repair, and PM task automatically. Export complete equipment history for audits in seconds.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-slate-50 px-6 py-4 rounded-lg">
              <div className="font-bold text-[#0a2540]">ISO 9001</div>
              <div className="text-xs text-slate-500">Documentation ready</div>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-lg">
              <div className="font-bold text-[#0a2540]">AS9100</div>
              <div className="text-xs text-slate-500">Aerospace compliant</div>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-lg">
              <div className="font-bold text-[#0a2540]">ITAR</div>
              <div className="text-xs text-slate-500">Defense compatible</div>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-lg">
              <div className="font-bold text-[#0a2540]">IATF 16949</div>
              <div className="text-xs text-slate-500">Automotive ready</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to transform your maintenance?</h2>
          <p className="text-slate-300 mb-8 text-lg">Join 500+ fabrication shops using Myncel. Start your free 30-day trial today.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-slate-700 font-bold px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-slate-500 text-white font-medium px-8 py-3 rounded-lg hover:bg-slate-600 transition-colors">Talk to an expert</Link>
          </div>
          <p className="text-slate-400 text-sm mt-6">No credit card required • Setup in 20 minutes • Cancel anytime</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}