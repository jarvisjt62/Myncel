import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PriceGateMobile from '../../components/PriceGateMobile';

export const metadata = {
  title: 'Myncel — Equipment Monitoring & Maintenance Management Software in Canada',
  description: 'Myncel helps Canadian factories, hotels, hospitals, warehouses, and oil & gas companies monitor equipment, manage maintenance, reduce downtime, and track asset history. Try free for 30 days.',
  alternates: { canonical: 'https://www.myncel.com/locations/canada' },
  openGraph: {
    title: 'Myncel — Machine Monitoring & Maintenance Software for Canadian Businesses',
    description: 'Canadian factories, hotels, hospitals, warehouses, and industrial facilities use Myncel to monitor equipment, manage maintenance, and reduce downtime. Try free for 30 days.',
    url: 'https://www.myncel.com/locations/canada',
  },
};

const sectors = [
  { icon: '🏭', name: 'Manufacturing & Factories', desc: 'Canadian manufacturers use Myncel to monitor production equipment, schedule preventive maintenance, manage work orders, and reduce costly downtime in automotive, aerospace, food processing, and industrial sectors.', href: '/solutions/metal-fabrication' },
  { icon: '🏨', name: 'Hotels & Commercial Buildings', desc: 'Hotel and commercial facility teams across Canada use Myncel to monitor generators, HVAC systems, elevators, pumps, and critical building infrastructure year-round.', href: '/solutions/hotels' },
  { icon: '🏥', name: 'Hospitals & Healthcare', desc: 'Canadian healthcare facilities use Myncel to maintain compliance records, monitor critical equipment, manage biomedical assets, and meet Health Canada facility standards.', href: '/solutions/hospitals' },
  { icon: '📦', name: 'Warehouses & Logistics', desc: 'Canadian warehouses, cold storage, and logistics operators use Myncel to monitor refrigeration, track equipment service intervals, and manage maintenance across multiple locations.', href: '/solutions/warehouses' },
  { icon: '⛽', name: 'Oil & Gas', desc: 'Canadian oil sands operators, upstream producers, and oilfield service companies use Myncel to track field equipment, manage PM schedules, and maintain compliance documentation.', href: '/solutions/oil-gas' },
  { icon: '🏢', name: 'Facility Management', desc: 'Facility management companies across Canada use Myncel to manage maintenance for multiple client properties from one centralized dashboard.', href: '/solutions/hotels' },
];

const stats = [
  { val: 'CAD $300K+', label: 'Average annual cost of unplanned downtime', sub: 'for Canadian manufacturers' },
  { val: '30%', label: 'Reduction in unplanned breakdowns', sub: 'within the first 6 months' },
  { val: '15 min', label: 'Average setup time', sub: 'no IT department needed' },
  { val: '$79/mo', label: 'Starting price USD', sub: 'less than one hour of downtime' },
];

export default function CanadaLocation() {
  return (
    <PriceGateMobile>
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a1a2e] pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-red-400 to-rose-400 top-[-100px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-purple-400 to-indigo-400 bottom-0 left-[-50px] opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-red-200 font-medium mb-6">
              🇨🇦 Myncel in Canada
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Equipment monitoring and maintenance management software for Canadian businesses.
            </h1>
            <p className="text-xl text-red-100 leading-relaxed mb-8 max-w-2xl">
              Myncel helps factories, hotels, hospitals, warehouses, and industrial facilities across Canada monitor critical equipment, manage maintenance, reduce downtime, and keep complete asset records — from one dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3 text-base">Start free trial →</Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors">Book a demo</Link>
            </div>
            <p className="text-red-300 text-sm mt-4">Free for 30 days · No credit card required · Setup in 15 minutes</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">Myncel works for every industry in Canada.</h2>
            <p className="text-[#425466] mt-4 text-lg">From automotive suppliers in Ontario to oil sands operators in Alberta and food processors in British Columbia, Myncel helps Canadian organizations protect equipment and reduce maintenance costs.</p>
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

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Canadian businesses already using Myncel.</h2>
          <p className="text-purple-200 text-lg mb-8">Try Myncel free for 30 days. No credit card required. Connect your first assets in under 15 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-[#635bff] font-semibold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">Talk to our team</Link>
          </div>
          <p className="text-purple-300 text-sm mt-4">Free for 30 days · No credit card · Cancel anytime</p>
        </div>
      </section>

      <Footer />
    </div>
    </PriceGateMobile>
  );
}