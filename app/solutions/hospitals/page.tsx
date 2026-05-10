import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Myncel for Hospitals & Healthcare Facilities — Equipment Monitoring Software',
  description: 'Myncel helps hospitals and healthcare facilities monitor critical equipment including generators, HVAC, medical gas systems, refrigeration, and facility infrastructure. Manage maintenance work orders and keep equipment history for compliance.',
  alternates: { canonical: 'https://www.myncel.com/solutions/hospitals' },
  openGraph: {
    title: 'Myncel for Hospitals — Critical Equipment Monitoring & Maintenance Management',
    description: 'Monitor generators, HVAC, medical gas, refrigeration, and critical hospital infrastructure from one dashboard. Manage work orders and maintain compliance records with Myncel.',
    url: 'https://www.myncel.com/solutions/hospitals',
  },
};

const equipment = [
  { icon: '⚡', name: 'Backup Generators & UPS', desc: 'Critical power backup systems must be 100% reliable. Myncel monitors generator health, tracks service intervals, and alerts teams before failures occur.' },
  { icon: '❄️', name: 'HVAC & Ventilation', desc: 'Air handling units, clean room systems, negative pressure rooms, and ventilation infrastructure require strict maintenance schedules and documentation.' },
  { icon: '🧊', name: 'Medical Refrigeration', desc: 'Monitor blood bank refrigerators, pharmacy cold storage, vaccine storage, and laboratory freezers with threshold alerts for temperature excursions.' },
  { icon: '💧', name: 'Water & Plumbing Systems', desc: 'Track boiler systems, hot and cold water infrastructure, sterilization equipment, and water treatment systems with scheduled maintenance records.' },
  { icon: '🔧', name: 'Sterilization Equipment', desc: 'Autoclaves, washer-disinfectors, and sterilization systems require cycle-based maintenance tracking and full compliance documentation.' },
  { icon: '🏥', name: 'Facility Infrastructure', desc: 'Elevators, access control, fire suppression, emergency lighting, nurse call systems, and medical gas pipelines tracked in one place.' },
];

const benefits = [
  { val: '100%', label: 'Equipment history for audits', sub: 'every action recorded' },
  { val: '24/7', label: 'Critical asset visibility', sub: 'never miss an alert' },
  { val: '50%', label: 'Faster maintenance response', sub: 'with instant work orders' },
  { val: '30 days', label: 'Free trial', sub: 'no credit card needed' },
];

const features = [
  {
    title: 'Critical Asset Monitoring',
    desc: 'Monitor the health and status of all critical hospital infrastructure in real time. Know the status of every generator, HVAC unit, refrigerator, and facility system at a glance.',
    icon: '🖥️',
  },
  {
    title: 'Compliance-Ready Records',
    desc: 'Every maintenance action, inspection, and repair is stored with timestamps, technician details, notes, and completion status. Ready for audits, accreditation, and regulatory review at any time.',
    icon: '📋',
  },
  {
    title: 'Threshold Alerts',
    desc: 'Configure safe operating ranges for critical assets. Receive instant alerts when equipment readings exceed thresholds — temperature, runtime, pressure, or custom parameters.',
    icon: '🔔',
  },
  {
    title: 'Work Order Management',
    desc: 'Create, assign, and track maintenance work orders from any device. Technicians receive tasks on their phones and log completions with notes and evidence.',
    icon: '📝',
  },
  {
    title: 'Preventive Maintenance Schedules',
    desc: 'Set recurring maintenance tasks for every asset. Myncel calculates due dates automatically and notifies assigned technicians in advance so nothing is missed.',
    icon: '📅',
  },
  {
    title: 'Role-Based Access',
    desc: 'Hospital administrators, facilities managers, and biomedical technicians each get the right level of access. Managers see everything; technicians see their assigned tasks.',
    icon: '👥',
  },
];

const useCases = [
  {
    title: 'Generator Compliance Tracking',
    desc: 'A private hospital needed to document monthly generator test runs and annual load bank tests for accreditation purposes. Myncel created recurring work orders for each test, stored completion records, and produced a clean audit trail for the accreditation team.',
    tag: 'Compliance & Audit',
  },
  {
    title: 'Pharmacy Cold Storage Alerts',
    desc: 'A hospital pharmacy was manually logging refrigerator temperatures twice daily on paper forms. After configuring Myncel with temperature threshold alerts, the pharmacy team received an instant notification when a refrigerator compressor started failing, preventing medication spoilage.',
    tag: 'Temperature Monitoring',
  },
  {
    title: 'Biomedical Equipment Service History',
    desc: 'A hospital biomedical department used Myncel to register all medical equipment and log every service, calibration, and repair. When a piece of equipment needed replacement, the team had a complete service history to support the procurement justification.',
    tag: 'Equipment History',
  },
];

const complianceBadges = [
  { name: 'Joint Commission', desc: 'Audit-ready documentation' },
  { name: 'CMS', desc: 'Conditions of Participation' },
  { name: 'State Health Dept', desc: 'Inspection records ready' },
  { name: 'DNV GL', desc: 'NIAHO compliance support' },
];

const testimonials = [
  { quote: 'Our Joint Commission surveyor was impressed with how quickly we pulled complete maintenance records for every piece of equipment they asked about.', author: 'James M.', role: 'Director of Facilities', facility: 'Regional Medical Center, Georgia' },
  { quote: 'We caught a refrigerator temperature drift before any vaccines were compromised. The alert system paid for itself in one incident.', author: 'Patricia K.', role: 'Pharmacy Director', facility: 'Community Hospital, Texas' },
  { quote: 'Finally moved our maintenance tracking off paper and whiteboards. The team actually uses it because it\'s so simple.', author: 'Robert S.', role: 'Facilities Manager', facility: 'Critical Access Hospital, Montana' },
];

const howItWorks = [
  { step: 1, title: 'Import your assets', desc: 'Upload equipment lists or add manually. Pre-built templates for generators, HVAC, refrigeration, and more.' },
  { step: 2, title: 'Set compliance schedules', desc: 'Configure recurring PM tasks aligned with Joint Commission, CMS, and state requirements.' },
  { step: 3, title: 'Assign to your team', desc: 'Technicians get mobile access to their tasks. Complete work orders from anywhere in the facility.' },
  { step: 4, title: 'Audit with confidence', desc: 'Every action is logged automatically. Pull compliance reports in seconds when surveyors arrive.' },
];

export default function HospitalsSolution() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#0d3b2e] pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-emerald-400 to-teal-400 top-[-100px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-cyan-400 to-blue-400 bottom-0 left-[-50px] opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-emerald-200 font-medium mb-6">
                🏥 Myncel for Hospitals & Healthcare Facilities
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Critical equipment needs reliable maintenance management.
              </h1>
              <p className="text-xl text-emerald-100 leading-relaxed mb-8">
                Myncel helps hospital and healthcare facility teams monitor critical infrastructure, manage maintenance work orders, maintain compliance records, and respond faster when equipment needs attention.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="btn-stripe-primary px-6 py-3 text-base">
                  Start free trial →
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors">
                  Book a demo
                </Link>
              </div>
              <p className="text-emerald-300 text-sm mt-4">Free for 30 days · No credit card required · Setup in 15 minutes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="font-bold text-white mb-4 text-center">Compliance Ready</h3>
              <div className="grid grid-cols-2 gap-4">
                {complianceBadges.map((badge, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-4 text-center">
                    <div className="font-bold text-emerald-200">{badge.name}</div>
                    <div className="text-xs text-emerald-300/70 mt-1">{badge.desc}</div>
                  </div>
                ))}
              </div>
            </div>
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
              Built for the complexity of healthcare facilities.
            </h2>
            <p className="text-[#425466] mt-4 text-lg">
              Hospitals depend on dozens of critical systems around the clock. Myncel gives facilities and biomedical teams full visibility and control.
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

      {/* How It Works */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="section-label">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540]">Ready for your next survey</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="w-10 h-10 bg-[#635bff] text-white rounded-full flex items-center justify-center font-bold mb-4">{item.step}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{item.title}</h3>
                <p className="text-sm text-[#425466]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Everything healthcare facilities need in one platform.
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
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Real-World Use Cases</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              How healthcare teams use Myncel every day.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <div key={i} className="stripe-card p-6">
                <span className="inline-block bg-[#ecfdf5] text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">{uc.tag}</span>
                <h3 className="font-bold text-[#0a2540] text-lg mb-3">{uc.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="section-label">Testimonials</span>
            <h2 className="text-3xl font-bold text-[#0a2540]">What healthcare facilities say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(star => (
                    <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#425466] mb-4 italic text-sm">"{t.quote}"</p>
                <p className="text-sm font-semibold text-[#0a2540]">{t.author}</p>
                <p className="text-xs text-[#8898aa]">{t.role}</p>
                <p className="text-xs text-slate-400">{t.facility}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start managing your hospital equipment better today.
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