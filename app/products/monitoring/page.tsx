import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Equipment Monitoring — Real-Time Machine Health Dashboard',
  description: 'Track the health and status of all your equipment in one place with Myncel\'s real-time monitoring dashboard. Know what\'s running, what\'s due for maintenance, and what needs immediate attention.',
  alternates: { canonical: 'https://myncel.com/products/monitoring' },
};

export default function EquipmentMonitoring() {
  const features = [
    {
      icon: '📊',
      title: 'Machine Health Dashboard',
      desc: 'See all your equipment at a glance with color-coded status indicators. Green means healthy, yellow needs attention, red requires immediate action. Filter by location, type, or status to find exactly what you need.',
    },
    {
      icon: '🏭',
      title: 'Location & Facility Mapping',
      desc: 'Organize machines by facility, building, floor, or production line. Visual maps show exactly where each piece of equipment is located, making it easy for technicians to find machines quickly.',
    },
    {
      icon: '📜',
      title: 'Complete Service History',
      desc: 'Every maintenance task, repair, and inspection is logged automatically. Pull up any machine\'s full service history in seconds—who worked on it, what was done, and when.',
    },
    {
      icon: '📋',
      title: 'Warranty Tracking',
      desc: 'Never miss a warranty expiration again. Myncel tracks warranty dates and alerts you before coverage ends, so you can schedule covered repairs in time.',
    },
    {
      icon: '⚙️',
      title: 'Custom Machine Fields',
      desc: 'Track the data that matters to your operation. Add custom fields for serial numbers, motor specs, filter sizes, or any other information your team needs.',
    },
    {
      icon: '📷',
      title: 'Photo Documentation',
      desc: 'Attach photos to machines and work orders. Document before/after conditions, nameplate data, or problem areas for future reference.',
    },
  ];

  const integrations = [
    { name: 'IoT Sensors', desc: 'Connect vibration, temperature, and pressure sensors for automated readings' },
    { name: 'PLC Integration', desc: 'Pull data directly from your programmable logic controllers' },
    { name: 'SCADA Systems', desc: 'Integrate with existing supervisory control systems' },
    { name: 'API Access', desc: 'Build custom integrations with our REST API' },
  ];

  const stats = [
    { value: '43%', label: 'Less unplanned downtime' },
    { value: '2.5x', label: 'Faster issue identification' },
    { value: '15min', label: 'Average setup time' },
    { value: '99.9%', label: 'System uptime SLA' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-purple-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-violet-300 to-purple-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-violet-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Equipment Monitoring</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Equipment Monitoring
              <span className="block text-violet-600">Know the health of every machine.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Real-time visibility into every machine in your facility. Track status, maintenance history, and upcoming tasks—all from one dashboard. No more walking the floor to check on equipment.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-violet-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-violet-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Everything you need to monitor your equipment</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-violet-50 rounded-2xl p-6 hover:shadow-lg transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Up and running in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-violet-600 mx-auto mb-4">1</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Add Your Machines</h3>
              <p className="text-[#425466] text-sm">Enter machine names, locations, and key details. Import from spreadsheets or add manually—takes about 2 minutes per machine.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-violet-600 mx-auto mb-4">2</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Set Up Monitoring</h3>
              <p className="text-[#425466] text-sm">Define what "healthy" looks like for each machine. Set thresholds, attach manuals, and configure alerts based on your needs.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-violet-600 mx-auto mb-4">3</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Stay Informed</h3>
              <p className="text-[#425466] text-sm">Watch your dashboard populate with real-time status. Get alerts when machines need attention. Access everything from any device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Integrations</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Connect with your existing systems</h2>
            <p className="text-[#425466] mt-3 max-w-xl mx-auto">Myncel integrates with sensors, PLCs, and enterprise systems for automated data collection.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {integrations.map((int, i) => (
              <div key={i} className="border border-[#e6ebf1] rounded-xl p-5 hover:shadow-md transition-all">
                <h3 className="font-bold text-[#0a2540] mb-1">{int.name}</h3>
                <p className="text-sm text-[#425466]">{int.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-violet-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to see your machines clearly?</h2>
          <p className="text-violet-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-violet-600 font-bold px-8 py-3 rounded-lg hover:bg-violet-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-violet-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}