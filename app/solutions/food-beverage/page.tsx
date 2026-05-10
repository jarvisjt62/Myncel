import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Food & Beverage CMMS Software — Free Setup + 30-Day Trial',
  description:
    'CMMS software for food and beverage manufacturers. Manage preventive maintenance, work orders, equipment maintenance records, sanitation tasks, calibration schedules, and audit-ready history. Free setup plus a 30-day trial.',
  alternates: { canonical: 'https://www.myncel.com/solutions/food-beverage' },
  openGraph: {
    title: 'Food & Beverage CMMS Software — Free Setup + 30-Day Trial',
    description:
      'Help your plant organize equipment, preventive maintenance, work orders, downtime, sanitation tasks, calibration schedules, and maintenance records with Myncel.',
    url: 'https://www.myncel.com/solutions/food-beverage',
    type: 'website',
  },
};

export default function FoodBeverage() {
  const painPoints = [
    {
      icon: '📋',
      title: 'Spreadsheets and paper logs',
      desc: 'Replace scattered maintenance sheets, handwritten logs, and whiteboards with one searchable equipment maintenance system.',
    },
    {
      icon: '⏱️',
      title: 'Missed preventive maintenance',
      desc: 'Schedule recurring PM tasks for mixers, conveyors, fillers, packaging equipment, refrigeration systems, and utilities.',
    },
    {
      icon: '🧾',
      title: 'Hard-to-find audit records',
      desc: 'Keep completed work orders, sanitation tasks, calibration checks, notes, photos, and history tied to each asset.',
    },
    {
      icon: '🔧',
      title: 'Slow work order follow-up',
      desc: 'Create, assign, track, and close maintenance work orders so supervisors know what is open, overdue, and complete.',
    },
  ];

  const equipment = [
    'Packaging lines',
    'Filling equipment',
    'Mixing tanks',
    'Conveyors',
    'Refrigeration systems',
    'Freezers and cold rooms',
    'Baking and cooking equipment',
    'Pumps and motors',
    'Compressors',
    'Boilers and utilities',
    'Scales and meters',
    'Sanitation equipment',
  ];

  const setupSteps = [
    {
      number: '01',
      title: 'Send your starter equipment list',
      desc: 'Start with a spreadsheet, photo list, or even a simple list of your most critical production and facility assets.',
    },
    {
      number: '02',
      title: 'We help configure your first workflows',
      desc: 'Myncel helps set up core assets, preventive maintenance schedules, work order categories, and basic team roles.',
    },
    {
      number: '03',
      title: 'Run a real 30-day trial',
      desc: 'Your team can test real maintenance tasks, complete work orders, and review maintenance history before deciding.',
    },
  ];

  const useCases = [
    'Preventive maintenance software for recurring PM schedules',
    'Work order management software for maintenance requests and repairs',
    'Equipment maintenance software for asset records and service history',
    'Predictive maintenance software foundations using readings, alerts, and downtime trends',
    'Calibration tracking for thermometers, scales, meters, and QA equipment',
    'Sanitation and inspection task tracking for food safety workflows',
    'Downtime visibility for production and packaging equipment',
    'Mobile-friendly task completion for technicians and supervisors',
  ];

  const stats = [
    { value: 'Free', label: 'setup assistance' },
    { value: '30 days', label: 'full trial access' },
    { value: 'No card', label: 'required to start' },
    { value: '1 place', label: 'for records and work orders' },
  ];

  const faqs = [
    {
      q: 'What is included in the free setup?',
      a: 'Myncel can help you create your starter equipment list, set up initial preventive maintenance schedules, configure basic work order categories, and prepare a simple workflow your team can test during the trial.',
    },
    {
      q: 'Is this only for large food manufacturers?',
      a: 'No. The offer is useful for small, mid-size, and growing food and beverage plants, including co-packers, contract manufacturers, private label producers, bakeries, beverage plants, cold chain operations, and packaging teams.',
    },
    {
      q: 'Can we use it for compliance-related maintenance records?',
      a: 'Yes. Myncel helps keep maintenance history, completed tasks, notes, photos, and timestamps organized by asset. This can make records easier to find when your team needs maintenance documentation for internal reviews or audits.',
    },
    {
      q: 'Do we need sensors or IoT hardware to start?',
      a: 'No. You can start with equipment records, preventive maintenance, and work orders. If you later want equipment readings, alerts, or sensor integrations, Myncel can support that as you grow.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[620px] h-[620px] bg-gradient-to-br from-green-300 to-emerald-400 top-[-220px] right-[-120px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm mb-4">
            <Link href="/solutions" className="hover:underline">Solutions</Link>
            <span>/</span>
            <span>Food & Beverage</span>
          </div>
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Free setup + 30-day trial for food and beverage manufacturers
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-[#0a2540] leading-tight mb-6">
              CMMS software for food and beverage plants that need maintenance under control.
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8 max-w-3xl">
              Myncel helps food and beverage manufacturers manage equipment maintenance software, preventive maintenance software, work order management software, and audit-ready maintenance records from one simple platform.
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free setup →</Link>
              <Link href="/demo" className="btn-stripe-secondary px-6 py-3">Book a 15-minute demo</Link>
            </div>
            <p className="text-sm text-[#64748b]">
              Built for maintenance teams managing packaging lines, refrigeration, filling equipment, sanitation tasks, calibration schedules, and production assets.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-green-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-green-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Why Myncel</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">
              Replace scattered maintenance tracking with one organized system
            </h2>
            <p className="text-[#425466] text-lg max-w-3xl mx-auto">
              Food and beverage teams need uptime, sanitation discipline, calibration visibility, and reliable maintenance records. Myncel gives maintenance and operations teams a practical CMMS without a heavy implementation project.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {painPoints.map((item, i) => (
              <div key={i} className="bg-green-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-[#0a2540] text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-[#425466] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="section-label">Free Setup Offer</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">
                We help you get your first maintenance workflow live
              </h2>
              <p className="text-[#425466] text-lg mb-8">
                You do not need to spend weeks preparing for a trial. Start with your most important assets and Myncel can help turn them into a working equipment list, PM schedule, and work order process.
              </p>
              <div className="space-y-5">
                {setupSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0a2540] mb-1">{step.title}</h3>
                      <p className="text-[#425466] text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e6ebf1] shadow-sm p-8">
              <h3 className="text-2xl font-bold text-[#0a2540] mb-4">What your team can test</h3>
              <ul className="space-y-3">
                {useCases.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#425466]">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block w-full bg-green-600 text-white text-center font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">
                Claim free setup →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Equipment</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">
              Track the assets that keep production moving
            </h2>
            <p className="text-[#425466] text-lg max-w-3xl mx-auto">
              Use Myncel for production equipment, facility assets, utilities, cold chain systems, and QA-related maintenance tasks.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-white border border-[#e6ebf1] rounded-full px-5 py-2 text-sm font-medium text-[#0a2540] shadow-sm">
                {eq}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0a2540]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-green-300 uppercase tracking-[0.18em] text-xs font-bold">Audit-ready history</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mt-3 mb-4">
                Find maintenance records faster when the plant needs proof
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                When a supervisor, QA lead, customer, or auditor asks for maintenance history, your team should not have to dig through binders, spreadsheets, emails, and photos. Myncel keeps completed work orders and asset history searchable.
              </p>
              <Link href="/demo" className="inline-block bg-white text-[#0a2540] font-bold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors">
                See how records work →
              </Link>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
              <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0a2540]">Packaging Line PM</span>
                  <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Complete</span>
                </div>
                <p className="text-sm text-[#425466]">Inspect belts, guards, sensors, and lubrication points.</p>
                <div className="text-xs text-[#8898aa] mt-2">Completed by: Maintenance Team · Today</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0a2540]">Scale Calibration</span>
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">Due soon</span>
                </div>
                <p className="text-sm text-[#425466]">Monthly calibration task for QA measurement equipment.</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0a2540]">Refrigeration Alert</span>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">Open</span>
                </div>
                <p className="text-sm text-[#425466]">Create and assign corrective work order before downtime escalates.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">FAQ</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Questions about the food and beverage trial</h2>
          </div>
          <div className="space-y-5">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-[#e6ebf1] rounded-2xl p-6">
                <h3 className="font-bold text-[#0a2540] mb-3">{faq.q}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-green-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to test Myncel in your plant?
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            Claim free setup and a 30-day trial for your food or beverage manufacturing team. No credit card required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-green-600 font-bold px-8 py-3 rounded-lg hover:bg-green-50 transition-colors">
              Start free setup →
            </Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-green-700 transition-colors">
              Talk to an expert
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}