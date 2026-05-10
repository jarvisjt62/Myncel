import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Myncel — Equipment Monitoring & Maintenance Management Software in Europe',
  description: 'Myncel helps European factories, hotels, hospitals, warehouses, and industrial facilities monitor equipment, manage maintenance work orders, reduce downtime, and maintain compliance records. Try free for 30 days.',
  alternates: { canonical: 'https://www.myncel.com/locations/europe' },
  openGraph: {
    title: 'Myncel — Machine Monitoring & Maintenance Software for European Businesses',
    description: 'European manufacturers, hotels, hospitals, warehouses, and industrial facilities use Myncel to monitor equipment, manage maintenance, and reduce downtime. Try free for 30 days.',
    url: 'https://www.myncel.com/locations/europe',
  },
};

const sectors = [
  { icon: '🏭', name: 'Manufacturing & Industry', desc: 'European manufacturers in automotive, aerospace, food & beverage, chemicals, and precision engineering use Myncel to monitor production equipment and manage preventive maintenance programs.', href: '/solutions/metal-fabrication' },
  { icon: '🏨', name: 'Hotels & Hospitality', desc: 'Hotel and hospitality facility teams across Europe use Myncel to monitor generators, HVAC systems, elevators, pumps, and critical building infrastructure to protect guest experience.', href: '/solutions/hotels' },
  { icon: '🏥', name: 'Hospitals & Healthcare', desc: 'European healthcare facilities use Myncel to maintain compliance with EN standards, monitor critical equipment, manage biomedical assets, and store maintenance records for regulatory review.', href: '/solutions/hospitals' },
  { icon: '📦', name: 'Warehouses & Logistics', desc: 'European warehouses, cold-chain operators, and 3PL providers use Myncel to monitor refrigeration, manage equipment maintenance, and maintain compliance records across multiple locations.', href: '/solutions/warehouses' },
  { icon: '⛽', name: 'Oil & Gas & Energy', desc: 'European oil and gas operators, refineries, and energy companies use Myncel to track critical field equipment, manage PM schedules, and maintain regulatory inspection records.', href: '/solutions/oil-gas' },
  { icon: '🏢', name: 'Facility Management', desc: 'European facility management and property management companies use Myncel to manage equipment maintenance for multiple client properties from one centralized platform.', href: '/solutions/hotels' },
];

const stats = [
  { val: '€250K+', label: 'Average annual downtime cost', sub: 'for European manufacturers' },
  { val: '30%', label: 'Reduction in unplanned breakdowns', sub: 'within the first 6 months' },
  { val: '15 min', label: 'Average setup time', sub: 'no IT department needed' },
  { val: 'GDPR', label: 'Compliant data handling', sub: 'data encrypted at rest and in transit' },
];

const countries = [
  { flag: '🇬🇧', name: 'United Kingdom' },
  { flag: '🇩🇪', name: 'Germany' },
  { flag: '🇫🇷', name: 'France' },
  { flag: '🇳🇱', name: 'Netherlands' },
  { flag: '🇧🇪', name: 'Belgium' },
  { flag: '🇵🇱', name: 'Poland' },
  { flag: '🇪🇸', name: 'Spain' },
  { flag: '🇮🇹', name: 'Italy' },
  { flag: '🇸🇪', name: 'Sweden' },
  { flag: '🇳🇴', name: 'Norway' },
  { flag: '🇩🇰', name: 'Denmark' },
  { flag: '🇨🇭', name: 'Switzerland' },
];

export default function EuropeLocation() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a2560] pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-blue-400 to-indigo-500 top-[-100px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-yellow-400 to-blue-400 bottom-0 left-[-50px] opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 font-medium mb-6">
              🇪🇺 Myncel in Europe
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Equipment monitoring and maintenance management software for European businesses.
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl">
              Myncel helps factories, hotels, hospitals, warehouses, and industrial facilities across Europe monitor critical equipment, manage maintenance, maintain compliance records, and reduce downtime — from one dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3 text-base">Start free trial →</Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors">Book a demo</Link>
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

      {/* Countries */}
      <section className="py-12 bg-white border-b border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-sm text-[#8898aa] font-medium uppercase tracking-wider text-center mb-6">Available across Europe including</p>
          <div className="flex flex-wrap justify-center gap-4">
            {countries.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#f6f9fc] border border-[#e6ebf1] rounded-full px-4 py-2 text-sm font-medium text-[#425466]">
                <span>{c.flag}</span><span>{c.name}</span>
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">Myncel works for every industry across Europe.</h2>
            <p className="text-[#425466] mt-4 text-lg">From automotive manufacturers in Germany to hospitality groups in the UK and logistics operators in the Netherlands, Myncel helps European organizations protect equipment and reduce maintenance costs.</p>
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join European businesses already using Myncel.</h2>
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
  );
}