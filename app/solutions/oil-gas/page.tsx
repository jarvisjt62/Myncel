import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Myncel for Oil & Gas — Equipment Monitoring & Maintenance Management Software',
  description: 'Myncel helps oil and gas operators and service companies monitor field equipment, pumps, compressors, generators, separators, and critical assets. Manage work orders, track maintenance history, and reduce operational downtime.',
  alternates: { canonical: 'https://www.myncel.com/solutions/oil-gas' },
  openGraph: {
    title: 'Myncel for Oil & Gas — Field Equipment Monitoring & Maintenance Management',
    description: 'Monitor pumps, compressors, generators, separators, and critical oilfield equipment from one dashboard. Manage work orders and reduce downtime with Myncel.',
    url: 'https://www.myncel.com/solutions/oil-gas',
  },
};

const equipment = [
  { icon: '⛽', name: 'Pumps & Pump Jacks', desc: 'Track pump performance, service intervals, seal replacements, bearing inspections, and failure history across all field locations.' },
  { icon: '🔄', name: 'Compressors', desc: 'Monitor reciprocating and screw compressors with scheduled oil changes, valve inspections, filter replacements, and performance tracking.' },
  { icon: '⚡', name: 'Generators & Power Units', desc: 'Track field generator service intervals, load test records, fuel system maintenance, and runtime hours across remote locations.' },
  { icon: '🛢️', name: 'Separators & Vessels', desc: 'Log inspection schedules, pressure relief valve tests, internal inspections, and regulatory compliance records for production vessels.' },
  { icon: '🔧', name: 'Wellhead Equipment', desc: 'Maintain service records for Christmas trees, wellhead valves, flow control equipment, and safety systems.' },
  { icon: '🚛', name: 'Fleet & Mobile Equipment', desc: 'Track service intervals, pre-trip inspections, and repair history for trucks, cranes, vac units, and all mobile field equipment.' },
];

const benefits = [
  { val: '45%', label: 'Reduction in unplanned field failures', sub: 'through preventive scheduling' },
  { val: '100%', label: 'Asset history stored', sub: 'for every piece of equipment' },
  { val: 'Multi-site', label: 'Visibility across all locations', sub: 'fields, yards, and offices' },
  { val: '30 days', label: 'Free trial', sub: 'no credit card required' },
];

const features = [
  { icon: '📊', title: 'Multi-Location Asset Dashboard', desc: 'See the real-time status of equipment across all field locations, production sites, yards, and facilities from one centralized dashboard.' },
  { icon: '🔔', title: 'Field Alert Notifications', desc: 'Receive instant alerts when equipment requires attention, misses a scheduled service, or shows signs of potential failure. Alerts reach field supervisors and office teams simultaneously.' },
  { icon: '📋', title: 'Work Order Management', desc: 'Create, assign, and track maintenance work orders for any asset at any location. Field technicians receive assignments on their phones and log completions with notes and photos.' },
  { icon: '📅', title: 'Runtime & Calendar-Based PM', desc: 'Schedule preventive maintenance by calendar days, operating hours, or production cycles. Myncel calculates due dates automatically and notifies the right people.' },
  { icon: '📁', title: 'Compliance & Inspection Records', desc: 'Store all inspection reports, regulatory compliance records, pressure tests, and safety documentation in a searchable equipment timeline.' },
  { icon: '👥', title: 'Field & Office Role Management', desc: 'Assign field supervisors, maintenance engineers, and technicians with appropriate access. Office management sees reporting; field teams see their tasks.' },
];

const useCases = [
  {
    title: 'Compressor PM Scheduling',
    desc: 'An oil and gas production company was managing compressor maintenance through spreadsheets and phone calls. After setting up Myncel, recurring PM tasks were created for each compressor, assigned to field technicians automatically, and completion records were stored with photos from the field.',
    tag: 'Preventive Maintenance',
  },
  {
    title: 'Multi-Site Equipment Visibility',
    desc: 'An oilfield services company operating across 5 field locations needed one place to see all equipment status. Myncel organized assets by location, allowing the operations manager to see the maintenance status of all field equipment without calling each site supervisor.',
    tag: 'Multi-Location Management',
  },
  {
    title: 'Regulatory Inspection Compliance',
    desc: 'A production operator needed to track mandatory vessel inspections and pressure relief valve tests for regulatory compliance. Myncel created recurring inspection work orders, stored completion records with timestamps, and made the documentation available for regulatory review instantly.',
    tag: 'Regulatory Compliance',
  },
];

export default function OilGasSolution() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a1a2e] pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-orange-400 to-red-400 top-[-100px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-yellow-400 to-orange-400 bottom-0 left-[-50px] opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-orange-200 font-medium mb-6">
              ⛽ Myncel for Oil & Gas Operations
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Keep your field equipment running. Every day, every location.
            </h1>
            <p className="text-xl text-orange-100 leading-relaxed mb-8 max-w-2xl">
              Myncel helps oil and gas operators and service companies monitor critical field equipment, manage maintenance work orders, track compliance records, and reduce unplanned downtime across all locations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3 text-base">
                Start free trial →
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors">
                Book a demo
              </Link>
            </div>
            <p className="text-orange-300 text-sm mt-4">Free for 30 days · No credit card required · Setup in 15 minutes</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f6f9fc] border-b border-[#e6ebf1] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-[#635bff] mb-1">{b.val}</div>
                <div className="text-sm font-medium text-[#0a2540]">{b.label}</div>
                <div className="text-xs text-[#8898aa] mt-1">{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Equipment Coverage</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Built for the demands of oilfield and industrial operations.
            </h2>
            <p className="text-[#425466] mt-4 text-lg">
              From wellhead to facility, Myncel helps you track every critical asset and never miss a scheduled service.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {equipment.map((eq, i) => (
              <div key={i} className="stripe-card p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{eq.icon}</div>
                <h3 className="font-semibold text-[#0a2540] text-lg mb-2">{eq.name}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{eq.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Everything oil and gas teams need to stay on top of maintenance.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="feature-card p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Real-World Use Cases</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              How oil and gas teams use Myncel every day.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <div key={i} className="stripe-card p-6">
                <span className="inline-block bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">{uc.tag}</span>
                <h3 className="font-bold text-[#0a2540] text-lg mb-3">{uc.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start managing your field equipment better today.
          </h2>
          <p className="text-purple-200 text-lg mb-8">
            Try Myncel free for 30 days. No credit card required. Set up your first assets in under 15 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-[#635bff] font-semibold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors">
              Start free trial →
            </Link>
            <Link href="/contact" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Talk to our team
            </Link>
          </div>
          <p className="text-purple-300 text-sm mt-4">Free for 30 days · No credit card · Cancel anytime</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}