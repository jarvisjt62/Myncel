import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Myncel for Warehouses & Cold-Chain Facilities — Equipment Monitoring Software',
  description: 'Myncel helps warehouses and cold-chain facilities monitor refrigeration units, conveyors, forklifts, dock doors, generators, HVAC, and critical logistics equipment. Manage maintenance, reduce downtime, and protect stored goods.',
  alternates: { canonical: 'https://www.myncel.com/solutions/warehouses' },
  openGraph: {
    title: 'Myncel for Warehouses — Equipment Monitoring & Maintenance Management',
    description: 'Monitor refrigeration, conveyors, forklifts, dock doors, and critical warehouse equipment from one dashboard. Reduce downtime and protect operations with Myncel.',
    url: 'https://www.myncel.com/solutions/warehouses',
  },
};

const equipment = [
  { icon: '🧊', name: 'Refrigeration & Cold Rooms', desc: 'Monitor cold storage units, blast freezers, refrigerated docking bays, and temperature-controlled zones with threshold alerts.' },
  { icon: '🏭', name: 'Conveyors & Sorters', desc: 'Track conveyor belt systems, sorting lines, and automated material handling equipment with scheduled lubrication and inspection records.' },
  { icon: '🚜', name: 'Forklifts & Material Handling', desc: 'Log service intervals, battery maintenance, pre-shift inspection records, and repair history for your entire forklift and material-handling fleet.' },
  { icon: '🚪', name: 'Dock Doors & Loading Equipment', desc: 'Track dock leveler maintenance, dock door systems, loading dock seals, vehicle restraints, and dock safety equipment.' },
  { icon: '⚡', name: 'Generators & Power Systems', desc: 'Monitor backup generators, UPS systems, and electrical infrastructure so power disruptions to refrigeration and operations are caught early.' },
  { icon: '❄️', name: 'HVAC & Climate Control', desc: 'Maintain air handling units, evaporative coolers, ventilation systems, and climate control equipment across all warehouse zones.' },
];

const benefits = [
  { val: '35%', label: 'Reduction in unexpected breakdowns', sub: 'through preventive scheduling' },
  { val: '100%', label: 'Cold chain maintenance records', sub: 'stored and audit-ready' },
  { val: '15 min', label: 'Average setup time', sub: 'no IT support needed' },
  { val: '30 days', label: 'Free trial', sub: 'no credit card required' },
];

const features = [
  { icon: '📊', title: 'Live Equipment Dashboard', desc: 'See the real-time status of all warehouse assets — refrigeration, conveyors, forklifts, generators, and dock systems — from one screen.' },
  { icon: '🌡️', title: 'Temperature Threshold Alerts', desc: 'Set safe temperature ranges for cold rooms and refrigerated zones. Receive instant alerts when readings drift outside defined limits.' },
  { icon: '📋', title: 'Work Order Management', desc: 'Create, assign, and close maintenance tasks for any asset. Technicians receive work orders on their phones and log completions instantly.' },
  { icon: '📅', title: 'Preventive Maintenance Schedules', desc: 'Configure recurring maintenance for every asset. Myncel calculates due dates and notifies technicians automatically.' },
  { icon: '📁', title: 'Full Equipment History', desc: 'Every alert, repair, inspection, and maintenance event is stored in a timeline for each asset — useful for audits and supplier claims.' },
  { icon: '👥', title: 'Team & Role Management', desc: 'Assign warehouse supervisors, maintenance leads, and technicians with the right access level for their role.' },
];

const useCases = [
  {
    title: 'Cold Room Temperature Compliance',
    desc: 'A food distribution warehouse needed to maintain continuous temperature logs for regulatory compliance. Myncel stored all threshold alerts, technician responses, and corrective actions automatically, making their next audit straightforward.',
    tag: 'Cold Chain Compliance',
  },
  {
    title: 'Conveyor Breakdown Prevention',
    desc: 'A large e-commerce fulfillment warehouse was experiencing frequent conveyor stoppages during peak periods. After scheduling preventive maintenance and lubrication tasks in Myncel, conveyor-related downtime dropped significantly in the first quarter.',
    tag: 'Conveyor Maintenance',
  },
  {
    title: 'Forklift Fleet Service Tracking',
    desc: 'A logistics company needed to track service intervals across 18 forklifts at 2 warehouse locations. Myncel created a machine profile for each forklift, scheduled recurring services, and stored all repair and inspection records in one place.',
    tag: 'Fleet Management',
  },
];

const roiItems = [
  { label: 'Cold chain failure prevention', value: '$50K-$500K' },
  { label: 'Conveyor downtime reduction', value: '40%' },
  { label: 'Forklift lifecycle extension', value: '2-3 years' },
  { label: 'Audit prep time savings', value: '80%' },
  { label: 'Energy cost optimization', value: '15-25%' },
];

const trustBadges = [
  { icon: '🏆', name: 'GCCA Member', desc: 'Global Cold Chain Alliance' },
  { icon: '✓', name: 'FSMA Ready', desc: 'Food Safety Modernization Act' },
  { icon: '📦', name: 'GDP Compliant', desc: 'Good Distribution Practice' },
  { icon: '🔒', name: 'SOC 2 Type II', desc: 'Data Security Certified' },
];

const howItWorks = [
  { step: '1', title: 'Add Your Assets', desc: 'Import equipment from spreadsheets or add manually. We support refrigeration, conveyors, forklifts, dock doors, and more.' },
  { step: '2', title: 'Set Temperature Alerts', desc: 'Configure threshold alerts for cold rooms and freezers. Get instant notifications via SMS, email, or push.' },
  { step: '3', title: 'Schedule Maintenance', desc: 'Create preventive maintenance schedules for each asset. Assign technicians and track completions automatically.' },
  { step: '4', title: 'Generate Audit Reports', desc: 'Export complete maintenance and temperature logs for FSMA, FDA, and customer audits in one click.' },
];

const testimonials = [
  {
    quote: "Before Myncel, we were scrambling during FDA audits. Now we generate complete cold chain compliance reports in minutes. The temperature alert system alone has prevented three potential spoilage incidents this year.",
    name: "Marcus Thompson",
    title: "Facilities Manager",
    company: "FreshFlow Distribution (200K sq ft cold storage)",
  },
  {
    quote: "Our conveyor system was breaking down weekly during peak season. After implementing Myncel's preventive maintenance schedules, we had zero unplanned conveyor stoppages during Black Friday week.",
    name: "Jennifer Wu",
    title: "Operations Director",
    company: "SpeedLog Fulfillment (3 distribution centers)",
  },
  {
    quote: "Managing 45 forklifts across two warehouses was a paperwork nightmare. Myncel gives us complete visibility into service history, inspections, and upcoming maintenance. Our fleet utilization improved by 22%.",
    name: "David Martinez",
    title: "Warehouse Manager",
    company: "Gulf Coast Logistics",
  },
];

export default function WarehousesSolution() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a2a40] pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-amber-400 to-orange-400 top-[-100px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-yellow-400 to-amber-400 bottom-0 left-[-50px] opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-amber-200 font-medium mb-6">
                🏭 Myncel for Warehouses & Cold-Chain Facilities
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Protect your operations, your cold chain, and your team.
              </h1>
              <p className="text-xl text-amber-100 leading-relaxed mb-8">
                Myncel helps warehouse and logistics teams monitor critical equipment, manage maintenance work orders, track refrigeration compliance, and reduce unexpected downtime from one dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="btn-stripe-primary px-6 py-3 text-base">
                  Start free trial →
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors">
                  Book a demo
                </Link>
              </div>
              <p className="text-amber-300 text-sm mt-4">Free for 30 days · No credit card required · Setup in 15 minutes</p>
            </div>
            
            {/* ROI Calculator Box */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
              <h3 className="font-bold text-[#0a2540] mb-4 text-center text-lg">Calculate Your Savings</h3>
              <div className="space-y-3">
                {roiItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-[#425466]">{item.label}</span>
                    <span className="font-bold text-[#0a2540]">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-amber-50 rounded-lg text-center">
                <div className="text-xs text-amber-600 font-medium mb-1">AVERAGE ANNUAL SAVINGS</div>
                <div className="text-2xl font-bold text-amber-700">$85,000 - $250,000</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-lg font-bold text-amber-600">
                  {badge.icon}
                </div>
                <div>
                  <div className="font-semibold text-[#0a2540] text-sm">{badge.name}</div>
                  <div className="text-xs text-[#8898aa]">{badge.desc}</div>
                </div>
              </div>
            ))}
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

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="section-label">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Get started in under 15 minutes.
            </h2>
            <p className="text-[#425466] mt-4">No IT support needed. No complex integrations. Just results.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative p-6 bg-[#f6f9fc] rounded-xl">
                <div className="w-10 h-10 bg-[#635bff] text-white rounded-lg flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-[#0a2540] text-lg mb-2">{item.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Equipment Coverage</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Monitor every asset that keeps your warehouse running.
            </h2>
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
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Everything your warehouse maintenance team needs.
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
              How warehouse teams use Myncel every day.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <div key={i} className="stripe-card p-6">
                <span className="inline-block bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">{uc.tag}</span>
                <h3 className="font-bold text-[#0a2540] text-lg mb-3">{uc.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="section-label">Customer Stories</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Trusted by warehouse and logistics teams worldwide.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#f6f9fc] rounded-xl p-6 border border-slate-200">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-[#425466] text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="border-t border-slate-200 pt-4">
                  <div className="font-semibold text-[#0a2540]">{t.name}</div>
                  <div className="text-sm text-[#8898aa]">{t.title}</div>
                  <div className="text-sm text-[#635bff]">{t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start protecting your warehouse operations today.
          </h2>
          <p className="text-purple-200 text-lg mb-8">
            Try Myncel free for 30 days. No credit card required. Connect your first assets in under 15 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-[#635bff] font-semibold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors">
              Start free trial →
            </Link>
            <Link href="/contact" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Talk to our team
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}