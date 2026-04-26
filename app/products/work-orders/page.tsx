import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Digital Work Orders — Paperless Maintenance Management',
  description: 'Replace paper work orders with digital ones your team can access from any device. Assign tasks, attach photos, log parts used, and track completion in real time.',
  alternates: { canonical: 'https://myncel.com/products/work-orders' },
};

export default function WorkOrders() {
  const features = [
    {
      icon: '⚡',
      title: 'One-Click Creation',
      desc: 'Create work orders in seconds from any device. Click a button, select a machine, describe the issue, and assign it. No forms to fill out, no paperwork to lose.',
    },
    {
      icon: '👤',
      title: 'Technician Assignment',
      desc: 'Assign work orders to specific technicians or let them claim tasks from a queue. See who\'s working on what and balance workload across your team.',
    },
    {
      icon: '🚨',
      title: 'Priority Levels',
      desc: 'Mark tasks as routine, high priority, or emergency. Emergency tasks rise to the top of everyone\'s list and trigger immediate notifications.',
    },
    {
      icon: '📸',
      title: 'Photo & File Attachments',
      desc: 'Attach photos, videos, and documents to work orders. Document problems before repair, show completed work, and share manuals or schematics.',
    },
    {
      icon: '🔧',
      title: 'Parts & Labor Tracking',
      desc: 'Log parts used and time spent on each work order. Build a complete picture of maintenance costs for every machine in your facility.',
    },
    {
      icon: '✅',
      title: 'Completion Sign-Off',
      desc: 'Technicians mark tasks complete with notes and photos. Managers review and approve. Build accountability into every maintenance task.',
    },
  ];

  const workflows = [
    { step: 'Create', desc: 'Describe the issue and assign to a technician', color: 'bg-emerald-100 text-emerald-700' },
    { step: 'Notify', desc: 'Technician receives instant alert on their device', color: 'bg-blue-100 text-blue-700' },
    { step: 'Work', desc: 'Technician completes task, logs time and parts', color: 'bg-amber-100 text-amber-700' },
    { step: 'Document', desc: 'Photos and notes attached for records', color: 'bg-purple-100 text-purple-700' },
    { step: 'Complete', desc: 'Manager reviews and closes the work order', color: 'bg-green-100 text-green-700' },
  ];

  const stats = [
    { value: '75%', label: 'Faster work order creation' },
    { value: '90%', label: 'Paper reduction' },
    { value: '4x', label: 'Better documentation' },
    { value: '0', label: 'Lost work orders' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-emerald-300 to-teal-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Digital Work Orders</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Digital Work Orders
              <span className="block text-emerald-600">From task creation to completion—fully digital.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Replace paper work orders with digital ones your team can access from any device. Assign tasks, attach photos, log parts used, and track completion in real time.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-emerald-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-emerald-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Workflow</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Simple workflow, powerful results</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {workflows.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`${item.color} rounded-full px-4 py-2`}>
                  <div className="font-bold text-sm">{item.step}</div>
                </div>
                {i < workflows.length - 1 && (
                  <svg className="w-6 h-6 text-[#8898aa] hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-5 gap-4 mt-8">
            {workflows.map((item, i) => (
              <div key={i} className="text-center text-sm text-[#425466]">
                {item.desc}
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
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Everything you need to manage work orders</h2>
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

      {/* Mobile */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-label">Mobile Ready</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">Work from anywhere on the shop floor</h2>
              <p className="text-[#425466] mb-6">Technicians don\'t need to return to a desk to check their tasks or log completions. Everything works on smartphones through the browser—no app to install.</p>
              <ul className="space-y-3">
                {['View assigned tasks from any device', 'Log completion with photos and notes', 'Scan QR codes to pull up machine info', 'Work offline—syncs when connection returns'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#425466]">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-8 text-center">
              <div className="bg-white rounded-xl shadow-lg p-4 max-w-xs mx-auto">
                <div className="text-left text-sm font-bold text-[#0a2540] mb-2">Work Order #1247</div>
                <div className="text-left text-xs text-[#425466] mb-3">CNC Machine #3 - Filter Replacement</div>
                <div className="flex gap-2 mb-3">
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">In Progress</span>
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">High Priority</span>
                </div>
                <div className="border-t pt-3 text-left text-xs text-[#8898aa]">Assigned to: Mike Chen</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to go paperless?</h2>
          <p className="text-emerald-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-emerald-600 font-bold px-8 py-3 rounded-lg hover:bg-emerald-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}