import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Smart Scheduling — Automated Maintenance Task Scheduling',
  description: 'Never miss a maintenance task again. Set up recurring schedules by days, hours, or production cycles. Myncel automatically calculates every due date.',
  alternates: { canonical: 'https://myncel.com/products/scheduling' },
};

export default function SmartScheduling() {
  const features = [
    {
      icon: '🔄',
      title: 'Recurring Task Templates',
      desc: 'Create maintenance task templates that repeat on your schedule. Daily inspections, weekly lubrication, monthly calibrations, annual overhauls—set it once and let Myncel handle the rest.',
    },
    {
      icon: '📅',
      title: 'Due Date Auto-Calculation',
      desc: 'Myncel automatically calculates when each task is due based on your defined intervals. See upcoming tasks weeks or months in advance and plan your resources accordingly.',
    },
    {
      icon: '🏭',
      title: 'Multi-Machine Scheduling',
      desc: 'Apply the same maintenance schedule to multiple machines at once. Update a template and all related tasks update automatically—saving hours of data entry.',
    },
    {
      icon: '🌡️',
      title: 'Seasonal Adjustments',
      desc: 'Account for seasonal variations in maintenance needs. Increase cooling system checks in summer, heating system checks in winter. Myncel adjusts schedules automatically.',
    },
    {
      icon: '🏖️',
      title: 'Holiday & Shutdown Planning',
      desc: 'Mark facility shutdowns and holidays. Myncel reschedules maintenance tasks around these periods so your team isn\'t scheduled to work when the plant is closed.',
    },
    {
      icon: '⚠️',
      title: 'Schedule Conflict Detection',
      desc: 'Myncel warns you when multiple major maintenance tasks are scheduled for the same time. Balance workload across your team and avoid bottlenecks.',
    },
  ];

  const intervalTypes = [
    { type: 'Calendar Days', example: 'Every 30 days', use: 'Regular inspections, lubrication' },
    { type: 'Operating Hours', example: 'Every 500 hours', use: 'Oil changes, filter replacements' },
    { type: 'Production Cycles', example: 'Every 10,000 cycles', use: 'Die maintenance, tooling changes' },
    { type: 'Meter Readings', example: 'Every 5,000 units', use: 'Quality checks, adjustments' },
  ];

  const stats = [
    { value: '98%', label: 'Tasks completed on time' },
    { value: '60%', label: 'Less scheduling effort' },
    { value: '35%', label: 'Fewer breakdowns' },
    { value: '0', label: 'Missed maintenance' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-blue-300 to-cyan-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Smart Scheduling</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Smart Scheduling
              <span className="block text-blue-600">Never miss a maintenance task again.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Set up recurring maintenance schedules by days, operating hours, or production cycles. Myncel automatically calculates every due date and surfaces what needs attention before it becomes a breakdown.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-blue-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interval Types */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Flexibility</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Schedule maintenance your way</h2>
            <p className="text-[#425466] mt-3 max-w-xl mx-auto">Different equipment needs different maintenance intervals. Myncel supports them all.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {intervalTypes.map((item, i) => (
              <div key={i} className="bg-blue-50 rounded-2xl p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">{item.example}</div>
                <div className="font-semibold text-[#0a2540] mb-1">{item.type}</div>
                <div className="text-sm text-[#425466]">{item.use}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Powerful scheduling made simple</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#e6ebf1] hover:shadow-lg transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Set it and forget it</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">1</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Create Task Templates</h3>
              <p className="text-[#425466] text-sm">Define what needs to be done, how often, and on which machines. Include checklists, parts needed, and estimated time.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">2</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Assign to Machines</h3>
              <p className="text-[#425466] text-sm">Link templates to individual machines or groups. One template can generate hundreds of scheduled tasks automatically.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4">3</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Let Myncel Run</h3>
              <p className="text-[#425466] text-sm">Tasks appear on the calendar automatically. Technicians get notified. Managers see what\'s coming. Everything runs smoothly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to automate your maintenance scheduling?</h2>
          <p className="text-blue-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}