import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Myncel — Equipment Monitoring & Maintenance Management Software in West Africa',
  description: 'Myncel helps factories, hotels, hospitals, warehouses, and oil & gas companies in Nigeria, Ghana, and West Africa monitor equipment, manage maintenance, reduce downtime, and track asset history. Try free for 30 days.',
  alternates: { canonical: 'https://www.myncel.com/locations/west-africa' },
  openGraph: {
    title: 'Myncel — Machine Monitoring & Maintenance Software for West Africa',
    description: 'Nigerian and Ghanaian factories, hotels, hospitals, warehouses, and industrial facilities use Myncel to monitor equipment, manage maintenance, and reduce downtime. Try free for 30 days.',
    url: 'https://www.myncel.com/locations/west-africa',
  },
};

const countries = [
  { flag: '🇳🇬', name: 'Nigeria', desc: 'Lagos, Abuja, Port Harcourt, Kano, Ogun State, and across Nigeria.' },
  { flag: '🇬🇭', name: 'Ghana', desc: 'Accra, Tema, Kumasi, Takoradi, and across Ghana.' },
  { flag: '🇸🇳', name: 'Senegal', desc: 'Dakar and major industrial cities.' },
  { flag: '🇨🇮', name: 'Côte d\'Ivoire', desc: 'Abidjan and major commercial centers.' },
];

const sectors = [
  { icon: '🏭', name: 'Manufacturing & Factories', desc: 'Nigerian and Ghanaian manufacturers in food processing, beverages, cement, chemicals, plastics, and FMCG use Myncel to monitor production equipment, manage preventive maintenance, and reduce costly breakdowns.', href: '/solutions/metal-fabrication' },
  { icon: '🏨', name: 'Hotels & Commercial Buildings', desc: 'Hotels in Lagos, Abuja, Accra, and Kumasi use Myncel to monitor generators, HVAC systems, elevators, pumps, cold rooms, and critical building infrastructure — especially during frequent power fluctuations.', href: '/solutions/hotels' },
  { icon: '🏥', name: 'Hospitals & Healthcare', desc: 'Private and public hospitals across Nigeria and Ghana use Myncel to monitor critical facility equipment, maintain compliance records, manage biomedical assets, and respond faster to infrastructure issues.', href: '/solutions/hospitals' },
  { icon: '📦', name: 'Warehouses & Logistics', desc: 'Warehouses, cold storage, and logistics companies in West Africa use Myncel to monitor refrigeration, track equipment service intervals, and protect temperature-sensitive goods.', href: '/solutions/warehouses' },
  { icon: '⛽', name: 'Oil & Gas', desc: 'Nigerian oil and gas operators, service companies, and downstream facilities use Myncel to track field equipment, manage PM programs, store inspection records, and maintain operational visibility.', href: '/solutions/oil-gas' },
  { icon: '⚡', name: 'Generator & Power Management', desc: 'In regions where power supply is unreliable, Myncel helps businesses monitor and maintain generators, inverter systems, and backup power infrastructure to minimize downtime from power disruptions.', href: '/solutions/hotels' },
];

const painPoints = [
  { icon: '⚡', title: 'Unreliable Power Supply', desc: 'Generators are critical in Nigeria and Ghana. Myncel helps businesses monitor generator health, track service intervals, and receive alerts before a generator fails at the worst time.' },
  { icon: '🌡️', title: 'Harsh Operating Conditions', desc: 'Heat, dust, and humidity accelerate equipment wear. Myncel helps teams schedule more frequent preventive maintenance and track asset condition over time.' },
  { icon: '📋', title: 'Paper-Based Maintenance', desc: 'Many West African businesses still manage maintenance through paper, WhatsApp, or spreadsheets. Myncel replaces these with a structured digital system that works on any smartphone.' },
  { icon: '💰', title: 'High Cost of Breakdowns', desc: 'Emergency repairs, imported spare parts, and production stoppages are expensive in West Africa. Myncel reduces these costs by helping teams catch problems early.' },
  { icon: '👷', title: 'Managing Field Technicians', desc: 'Tracking what maintenance has been done, by whom, and when is a common challenge. Myncel gives managers full visibility over all technician work orders and completions.' },
  { icon: '📱', title: 'Mobile-First Workforce', desc: 'Myncel is designed to work on any smartphone — no special hardware, no laptop required. Technicians in the field can receive tasks, log completions, and upload photos from their phones.' },
];

const stats = [
  { val: '₦50M+', label: 'Average annual cost of unplanned downtime', sub: 'for Nigerian manufacturers' },
  { val: '30%', label: 'Reduction in unplanned breakdowns', sub: 'within the first 6 months' },
  { val: '15 min', label: 'Average setup time', sub: 'works on any smartphone' },
  { val: '30 days', label: 'Free trial', sub: 'no credit card required' },
];

export default function WestAfricaLocation() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a2a10] pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-green-400 to-emerald-500 top-[-100px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-yellow-400 to-green-400 bottom-0 left-[-50px] opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-green-200 font-medium mb-6">
              🌍 Myncel in West Africa — Nigeria · Ghana · Senegal · Côte d'Ivoire
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Smart equipment monitoring built for West African businesses.
            </h1>
            <p className="text-xl text-green-100 leading-relaxed mb-8 max-w-2xl">
              Myncel helps factories, hotels, hospitals, warehouses, and industrial facilities in Nigeria, Ghana, and across West Africa monitor critical equipment, manage maintenance work orders, and reduce costly downtime — from one simple dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3 text-base">Start free trial →</Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors">Book a demo</Link>
            </div>
            <p className="text-green-300 text-sm mt-4">Free for 30 days · No credit card required · Works on any smartphone</p>
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="bg-[#f6f9fc] border-b border-[#e6ebf1] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-sm text-[#8898aa] font-medium uppercase tracking-wider text-center mb-6">Available across West Africa including</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {countries.map((c, i) => (
              <div key={i} className="flex flex-col items-center bg-white border border-[#e6ebf1] rounded-xl p-4 text-center">
                <span className="text-3xl mb-2">{c.flag}</span>
                <span className="font-semibold text-[#0a2540] text-sm">{c.name}</span>
                <span className="text-xs text-[#8898aa] mt-1">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-[#e6ebf1] py-12">
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

      {/* Pain Points */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Built for West African Realities</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Myncel understands the unique challenges of doing business in West Africa.
            </h2>
            <p className="text-[#425466] mt-4 text-lg">
              From generator dependence to mobile-first workforces and paper-based maintenance tracking, Myncel is designed to solve the real problems West African businesses face every day.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {painPoints.map((p, i) => (
              <div key={i} className="feature-card p-6">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-semibold text-[#0a2540] mb-2">{p.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{p.desc}</p>
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
              Myncel works for every industry in West Africa.
            </h2>
            <p className="text-[#425466] mt-4 text-lg">
              From large manufacturing groups in Lagos to hotel chains in Accra and oil and gas service companies in Port Harcourt, Myncel helps West African organizations protect their equipment and reduce maintenance costs.
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

      {/* Testimonial/Quote */}
      <section className="py-16 bg-[#0a2540]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-4xl text-[#635bff] mb-6">"</div>
          <p className="text-xl text-white leading-relaxed mb-6">
            In Nigeria, equipment maintenance is often reactive — we fix things when they break. Myncel helps teams switch to a proactive approach that saves money and protects operations, even with the power and infrastructure challenges we face daily.
          </p>
          <div className="text-[#8898aa] text-sm">Myncel — Built for African Operations</div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join West African businesses already using Myncel.
          </h2>
          <p className="text-purple-200 text-lg mb-8">
            Try Myncel free for 30 days. No credit card required. Works on any smartphone. Setup in 15 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-[#635bff] font-semibold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">Talk to our team</Link>
          </div>
          <p className="text-purple-300 text-sm mt-4">Free for 30 days · No credit card · Cancel anytime · Works on any smartphone</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}