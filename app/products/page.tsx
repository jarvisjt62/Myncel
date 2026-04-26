import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Products — Equipment Monitoring, Scheduling & Work Orders',
  description: 'Explore Myncel\'s full product suite: real-time equipment monitoring, smart PM scheduling, digital work orders, parts inventory, analytics, and mobile app for small manufacturers.',
  alternates: { canonical: 'https://myncel.com/products' },
  openGraph: {
    title: 'Myncel Products — Predictive Maintenance Suite for Manufacturers',
    description: 'Everything your maintenance team needs: monitoring, scheduling, work orders, alerts, analytics and more.',
    url: 'https://myncel.com/products',
  },
}

export default function Products() {
  const products = [
    {
      icon: '⚙️',
      name: 'Equipment Monitoring',
      tagline: 'Real-time visibility into every machine in your facility.',
      desc: 'Track the health and status of all your equipment in one place. Know at a glance what\'s running, what\'s due for maintenance, and what needs immediate attention — without walking the floor.',
      features: ['Machine health dashboard', 'Location & facility mapping', 'Service history log', 'Warranty tracking', 'Custom machine fields', 'Photo documentation'],
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      href: '/products/monitoring',
    },
    {
      icon: '📅',
      name: 'Smart Scheduling',
      tagline: 'Never miss a maintenance task again.',
      desc: 'Set up recurring maintenance schedules by days, operating hours, or production cycles. Myncel automatically calculates every due date and surfaces what needs attention before it becomes a breakdown.',
      features: ['Recurring task templates', 'Due date auto-calculation', 'Multi-machine scheduling', 'Seasonal adjustments', 'Holiday & shutdown planning', 'Schedule conflict detection'],
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      href: '/products/scheduling',
    },
    {
      icon: '📝',
      name: 'Digital Work Orders',
      tagline: 'From task creation to completion — fully digital.',
      desc: 'Replace paper work orders with digital ones your team can access from any device. Assign tasks, attach photos, log parts used, and track completion in real time.',
      features: ['One-click work order creation', 'Technician assignment', 'Priority levels', 'Photo & file attachments', 'Parts & labor tracking', 'Completion sign-off'],
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      href: '/products/work-orders',
    },
    {
      icon: '🔔',
      name: 'Alerts & Notifications',
      tagline: 'Your team knows what\'s happening before it becomes a crisis.',
      desc: 'Get notified by email or SMS the moment a task comes due, goes overdue, or a machine shows warning signs. Configure who gets notified, when, and how.',
      features: ['Email & SMS alerts', 'Overdue escalations', 'Custom alert rules', 'Team-based routing', 'Daily digest reports', 'Mobile push notifications'],
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      href: '/products/alerts',
    },
    {
      icon: '📊',
      name: 'Analytics & Reporting',
      tagline: 'Turn maintenance data into business decisions.',
      desc: 'Understand your true maintenance costs, identify your most problem-prone equipment, and track your team\'s performance over time. Monthly reports delivered automatically.',
      features: ['Uptime & downtime tracking', 'Cost per machine reports', 'Technician performance', 'Trend analysis', 'Custom date ranges', 'Export to PDF & CSV'],
      color: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      href: '/products/analytics',
    },
    {
      icon: '🔧',
      name: 'Parts Inventory',
      tagline: 'Never be caught without the part you need.',
      desc: 'Track spare parts, set reorder points, and link parts to specific machines. When a work order is completed, parts are automatically deducted from inventory.',
      features: ['Parts catalog', 'Minimum stock alerts', 'Supplier management', 'Auto-deduct on WO completion', 'Cost tracking', 'Purchase order templates'],
      color: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      href: '/products/inventory',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#f8f6ff] to-[#fff0f9] py-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[500px] h-[500px] bg-gradient-to-br from-purple-300 to-indigo-300 top-[-150px] right-[-100px] opacity-40" />
          <div className="gradient-blob w-[300px] h-[300px] bg-gradient-to-br from-pink-300 to-rose-200 top-[100px] right-[200px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="max-w-3xl">
            <span className="section-label">Products</span>
            <h1 className="text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Everything your maintenance team needs.{' '}
              <span className="gradient-text">Nothing they don't.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Myncel is a complete maintenance management platform built specifically for small manufacturers. Six powerful tools that work individually — or as one unified system.
            </p>
            <div className="flex gap-4">
              <Link href="/signup" className="btn-stripe-primary text-base px-6 py-3">Start free trial →</Link>
              <Link href="/pricing" className="btn-stripe-secondary text-base px-6 py-3">View pricing</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="py-24 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((p, i) => (
              <div key={i} className="bg-white border border-[#e6ebf1] rounded-2xl p-8 hover:shadow-lg transition-all group">
                <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center text-2xl mb-5`}>
                  {p.icon}
                </div>
                <h2 className="text-xl font-bold text-[#0a2540] mb-1">{p.name}</h2>
                <p className={`text-sm font-semibold ${p.text} mb-3`}>{p.tagline}</p>
                <p className="text-[#425466] text-sm leading-relaxed mb-5">{p.desc}</p>
                <ul className="grid grid-cols-2 gap-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#425466]">
                      <svg className={`w-3.5 h-3.5 ${p.text} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className={`text-sm font-semibold ${p.text} hover:underline flex items-center gap-1`}>
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration strip */}
      <section className="py-16 bg-white border-t border-[#e6ebf1]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="section-label">Integrations</span>
          <h2 className="text-3xl font-bold text-[#0a2540] mb-4">Works with your existing tools</h2>
          <p className="text-[#425466] mb-10 max-w-xl mx-auto">Myncel connects with the software your team already uses — no ripping and replacing.</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {['Slack', 'QuickBooks', 'Google Sheets', 'Zapier', 'MS Teams', 'Email'].map(tool => (
              <div key={tool} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl flex items-center justify-center text-2xl">
                  {tool === 'Slack' ? '💬' : tool === 'QuickBooks' ? '💰' : tool === 'Google Sheets' ? '📊' : tool === 'Zapier' ? '⚡' : tool === 'MS Teams' ? '💼' : '📧'}
                </div>
                <span className="text-xs text-[#8898aa] font-medium">{tool}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to stop guessing?</h2>
          <p className="text-purple-200 mb-8 text-lg">Start your free 3-month trial. No credit card. Setup in 15 minutes.</p>
          <Link href="/signup" className="bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors text-base">
            Get started free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}