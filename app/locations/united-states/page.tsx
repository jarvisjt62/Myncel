import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Myncel — Equipment Monitoring & Maintenance Management Software in the United States',
  description: 'Myncel helps US factories, hotels, hospitals, warehouses, and oil & gas companies monitor equipment, manage maintenance work orders, reduce downtime, and track asset history. Try free for 30 days.',
  alternates: { canonical: 'https://www.myncel.com/locations/united-states' },
  openGraph: {
    title: 'Myncel — Machine Monitoring & Maintenance Software for US Businesses',
    description: 'US factories, hotels, hospitals, warehouses, and industrial facilities use Myncel to monitor equipment, manage maintenance, and reduce downtime. Try free for 30 days.',
    url: 'https://www.myncel.com/locations/united-states',
  },
};

const sectors = [
  { icon: '🏭', name: 'Manufacturing & Factories', desc: 'US manufacturers use Myncel to monitor production equipment, schedule preventive maintenance, manage work orders, and reduce costly unplanned downtime.', href: '/solutions/metal-fabrication' },
  { icon: '🏨', name: 'Hotels & Commercial Buildings', desc: 'Hotel facility teams across the US use Myncel to monitor generators, HVAC systems, elevators, pumps, and critical building infrastructure.', href: '/solutions/hotels' },
  { icon: '🏥', name: 'Hospitals & Healthcare', desc: 'US healthcare facilities use Myncel to maintain compliance records, monitor critical equipment, manage biomedical assets, and track all maintenance activity.', href: '/solutions/hospitals' },
  { icon: '📦', name: 'Warehouses & Logistics', desc: 'US warehouses and cold-chain operators use Myncel to monitor refrigeration, track forklift service intervals, manage conveyor maintenance, and protect operations.', href: '/solutions/warehouses' },
  { icon: '⛽', name: 'Oil & Gas', desc: 'US oil and gas operators and service companies use Myncel to track field equipment, schedule compressor and pump maintenance, and store compliance records.', href: '/solutions/oil-gas' },
  { icon: '🏢', name: 'Facility Management', desc: 'Facility management companies across the US use Myncel to manage maintenance for multiple client properties from one centralized dashboard.', href: '/solutions/hotels' },
];

const stats = [
  { val: '$260K', label: 'Average annual cost of unplanned downtime', sub: 'for US small manufacturers' },
  { val: '30%', label: 'Reduction in unplanned breakdowns', sub: 'within the first 6 months' },
  { val: '15 min', label: 'Average setup time', sub: 'no IT department needed' },
  { val: '$79/mo', label: 'Starting price', sub: 'less than one hour of downtime' },
];

export default function UnitedStatesLocation() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a3a5c] pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-blue-400 to-indigo-400 top-[-100px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-purple-400 to-blue-400 bottom-0 left-[-50px] opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 font-medium mb-6">
              🇺🇸 Myncel in the United States
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Equipment monitoring and maintenance management software for US businesses.
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl">
              Myncel helps factories, hotels, hospitals, warehouses, and industrial facilities across the United States monitor critical equipment, manage maintenance, reduce downtime, and keep complete asset records — from one dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3 text-base">
                Start free trial →
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors">
                Book a demo
              </Link>
            </div>
            <p className="text-blue-300 text-sm mt-4">Free for 30 days · No credit card required · Setup in 15 minutes</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f6f9fc] border-b border-[#e6ebf1] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-[#635bff] mb-1">{s.val}</div>
                <div className="text-sm font-medium text-[#0a2540]">{s.label}</div>
                <div className="text-xs text-[#8898aa] mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Industries We Serve</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Myncel works for every industry in the United States.
            </h2>
            <p className="text-[#425466] mt-4 text-lg">
              From small manufacturing shops in Michigan to hotel chains in Florida and oil and gas operators in Texas, Myncel helps US organizations protect their equipment and reduce maintenance costs.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sectors.map((s, i) => (
              <Link key={i} href={s.href} className="stripe-card p-6 hover:shadow-md transition-shadow group">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-[#0a2540] text-lg mb-2 group-hover:text-[#635bff] transition-colors">{s.name}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{s.desc}</p>
                <div className="mt-4 text-[#635bff] text-sm font-medium">Learn more →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Myncel */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Why US Businesses Choose Myncel</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Simple, affordable, and built for real operations teams.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '⚡', title: 'Setup in 15 minutes', desc: 'No consultants, no IT department, no 6-month implementation. Add your machines, configure alerts, and go.' },
              { icon: '💰', title: 'Costs less than one hour of downtime', desc: 'Starting at $79/month, Myncel pays for itself the first time it helps your team catch a problem early.' },
              { icon: '📱', title: 'Works on any device', desc: 'Your team can manage work orders, receive alerts, and view equipment status from any smartphone, tablet, or computer.' },
              { icon: '🔒', title: 'Enterprise-grade security', desc: 'All data encrypted at rest and in transit. SOC 2 compliance in progress. Your equipment data stays private.' },
              { icon: '🤝', title: 'US-based customer support', desc: 'Real support from real people. Our team is available to help you get the most out of Myncel from day one.' },
              { icon: '📈', title: 'Scales with your business', desc: 'Start with a handful of machines and grow to hundreds. Myncel scales with your operation without changing your workflow.' },
            ].map((f, i) => (
              <div key={i} className="feature-card p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join US businesses already using Myncel.
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
          <p className="text-purple-300 text-sm mt-4">Free for 30 days · No credit card · Cancel anytime</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}