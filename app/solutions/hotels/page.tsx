import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Myncel for Hotels & Commercial Buildings — Equipment Monitoring Software',
  description: 'Myncel helps hotels monitor generators, HVAC systems, elevators, pumps, refrigeration, and critical facility equipment. Reduce downtime, manage maintenance work orders, and protect guest experience.',
  alternates: { canonical: 'https://www.myncel.com/solutions/hotels' },
  openGraph: {
    title: 'Myncel for Hotels — Facility Equipment Monitoring & Maintenance Management',
    description: 'Monitor generators, HVAC, elevators, pumps, and critical hotel equipment from one dashboard. Reduce breakdowns, manage work orders, and protect guest experience with Myncel.',
    url: 'https://www.myncel.com/solutions/hotels',
  },
};

const equipment = [
  { icon: '⚡', name: 'Generators & UPS', desc: 'Monitor backup power systems 24/7. Get alerts before a generator fails during peak occupancy.' },
  { icon: '❄️', name: 'HVAC Systems', desc: 'Track air handling units, chillers, cooling towers, and fan coil units across all floors and zones.' },
  { icon: '🛗', name: 'Elevators & Escalators', desc: 'Log inspection schedules, service history, and compliance records for all vertical transport assets.' },
  { icon: '💧', name: 'Water & Pump Systems', desc: 'Monitor booster pumps, hot water systems, swimming pool equipment, and water treatment assets.' },
  { icon: '🍽️', name: 'Kitchen & Cold Rooms', desc: 'Track refrigeration units, cold room temperatures, commercial kitchen equipment, and laundry machines.' },
  { icon: '🔒', name: 'Access & Fire Systems', desc: 'Maintain service records for fire suppression, emergency lighting, access control, and security systems.' },
];

const benefits = [
  { val: '40%', label: 'Reduction in emergency repair callouts', sub: 'by catching issues early' },
  { val: '15 min', label: 'Average setup time', sub: 'per property' },
  { val: '100%', label: 'Equipment history stored', sub: 'for every asset' },
  { val: '24/7', label: 'Monitoring visibility', sub: 'even when staff are off-site' },
];

const features = [
  {
    title: 'Real-Time Equipment Dashboard',
    desc: 'See the live status of every critical asset across your property — generators, HVAC, pumps, elevators, cold rooms, and more — from one screen.',
    icon: '📊',
  },
  {
    title: 'Instant Alert Notifications',
    desc: 'Receive alerts by email, SMS, or in-app notification the moment an asset requires attention, goes offline, or crosses a defined threshold.',
    icon: '🔔',
  },
  {
    title: 'Work Order Management',
    desc: 'Create, assign, and track maintenance tasks for every piece of equipment. Technicians receive assignments on their phones and log completions instantly.',
    icon: '📋',
  },
  {
    title: 'Full Equipment History',
    desc: 'Every alert, repair, inspection, and maintenance action is stored in a complete timeline for each asset. Useful for audits, insurance, and compliance.',
    icon: '📁',
  },
  {
    title: 'Scheduled Preventive Maintenance',
    desc: 'Set recurring maintenance tasks by days, weeks, or months. Myncel automatically calculates due dates and notifies the right team member.',
    icon: '📅',
  },
  {
    title: 'Multi-Property Support',
    desc: 'Manage equipment across multiple hotel properties or locations from one organization account. Each property gets its own location and asset list.',
    icon: '🏨',
  },
];

const useCases = [
  {
    title: 'Generator Failure Prevention',
    desc: 'A hotel in Lagos experienced frequent generator failures during peak seasons. After connecting the generator to Myncel, the facilities team received an early warning alert about abnormal temperature readings. The issue was fixed before the generator failed — protecting 200+ guest rooms from a power outage.',
    tag: 'Generator Monitoring',
  },
  {
    title: 'HVAC Maintenance Compliance',
    desc: 'A commercial hotel group in Accra needed to track quarterly HVAC servicing across 3 properties. Myncel created recurring work orders for each unit, assigned them to the right technician per property, and stored the completion records automatically.',
    tag: 'HVAC Management',
  },
  {
    title: 'Cold Room Temperature Monitoring',
    desc: 'A hotel kitchen team was manually checking cold room temperatures twice a day. With Myncel, temperature thresholds were configured and alerts were sent directly to the chef and facilities manager when readings drifted outside safe ranges.',
    tag: 'Cold Room Alerts',
  },
];

export default function HotelsSolution() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a3a5c] pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-blue-400 to-cyan-400 top-[-100px] right-[-100px] opacity-20" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-purple-400 to-indigo-400 bottom-0 left-[-50px] opacity-20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 font-medium mb-6">
              🏨 Myncel for Hotels & Commercial Buildings
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Keep your hotel running when it matters most.
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl">
              Myncel helps hotel and facility teams monitor critical equipment, receive alerts, manage maintenance work orders, and protect guest experience — from one dashboard.
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

      {/* Equipment Types */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="section-label">Equipment Coverage</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] leading-tight">
              Monitor every critical asset in your property.
            </h2>
            <p className="text-[#425466] mt-4 text-lg">
              Hotels depend on dozens of critical systems. Myncel gives your facilities team visibility over all of them from one dashboard.
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
              Everything your facilities team needs.
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
              How hotel teams use Myncel every day.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <div key={i} className="stripe-card p-6">
                <span className="inline-block bg-[#f0f4ff] text-[#635bff] text-xs font-semibold px-3 py-1 rounded-full mb-4">{uc.tag}</span>
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
            Start monitoring your hotel equipment today.
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