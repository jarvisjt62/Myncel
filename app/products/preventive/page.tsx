import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Preventive Maintenance — Reduce Breakdowns & Extend Equipment Life',
  description: 'Shift from reactive firefighting to planned maintenance. Schedule regular PM tasks, track compliance, and reduce unplanned downtime.',
  alternates: { canonical: 'https://myncel.com/products/preventive' },
};

export default function PreventiveMaintenance() {
  const features = [
    { icon: '📅', title: 'Automated Scheduling', desc: 'Set up recurring PM tasks once and let Myncel handle the rest. Never miss a scheduled maintenance again.' },
    { icon: '✅', title: 'Compliance Tracking', desc: 'Track PM completion rates and ensure every task gets done on time. Audit-ready records automatically.' },
    { icon: '📊', title: 'PM Effectiveness', desc: 'See if your PM program is working. Track breakdown rates before and after implementing preventive schedules.' },
    { icon: '🔄', title: 'Task Templates', desc: 'Create reusable PM checklists for each machine type. Standardize your maintenance procedures.' },
  ];

  const stats = [
    { value: '35%', label: 'Fewer breakdowns' },
    { value: '25%', label: 'Longer equipment life' },
    { value: '98%', label: 'PM compliance rate' },
    { value: '50%', label: 'Less reactive maintenance' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-green-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Preventive Maintenance</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Preventive Maintenance
              <span className="block text-teal-600">Stop problems before they start.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Shift from reactive firefighting to planned maintenance. Schedule regular PM tasks, track compliance, and reduce unplanned downtime by up to 35%.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-teal-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-teal-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Everything you need for effective PM</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-teal-50 rounded-2xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-sm text-[#425466]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Simple to implement, powerful results</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-teal-600 mx-auto mb-4">1</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Define Your PM Tasks</h3>
              <p className="text-sm text-[#425466]">Create checklists for each machine type. Include all the tasks that need regular attention.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-teal-600 mx-auto mb-4">2</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Set Your Schedules</h3>
              <p className="text-sm text-[#425466]">Define how often each task should be performed. Daily, weekly, monthly, or based on usage.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-teal-600 mx-auto mb-4">3</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Track & Improve</h3>
              <p className="text-sm text-[#425466]">Monitor compliance, see what\'s working, and continuously improve your PM program.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-teal-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to go preventive?</h2>
          <p className="text-teal-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-teal-600 font-bold px-8 py-3 rounded-lg hover:bg-teal-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}