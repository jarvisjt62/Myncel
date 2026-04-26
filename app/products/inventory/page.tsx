import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Parts Inventory — Spare Parts Management System',
  description: 'Track spare parts, set reorder points, and link parts to specific machines. When a work order is completed, parts are automatically deducted from inventory.',
  alternates: { canonical: 'https://myncel.com/products/inventory' },
};

export default function PartsInventory() {
  const features = [
    {
      icon: '📦',
      title: 'Parts Catalog',
      desc: 'Maintain a complete catalog of all spare parts in your facility. Include part numbers, descriptions, specifications, and compatible machines.',
    },
    {
      icon: '⚠️',
      title: 'Minimum Stock Alerts',
      desc: 'Set reorder points for every part. Get automatic alerts when stock falls below minimum levels so you never run out of critical components.',
    },
    {
      icon: '🏭',
      title: 'Supplier Management',
      desc: 'Store supplier information, lead times, and pricing. Know exactly where to order and how long it will take to arrive.',
    },
    {
      icon: '🔄',
      title: 'Auto-Deduct on Completion',
      desc: 'Parts used on work orders are automatically deducted from inventory. No manual counting—accurate stock levels in real time.',
    },
    {
      icon: '💵',
      title: 'Cost Tracking',
      desc: 'Track the value of your inventory and the cost of parts consumed. Understand where your maintenance budget is going.',
    },
    {
      icon: '📝',
      title: 'Purchase Order Templates',
      desc: 'Generate purchase orders directly from low stock alerts. Pre-filled with supplier info and part details for quick ordering.',
    },
  ];

  const stats = [
    { value: '95%', label: 'Stock accuracy' },
    { value: '80%', label: 'Less emergency orders' },
    { value: '$12K', label: 'Avg annual savings' },
    { value: '0', label: 'Stockout surprises' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 py-20 lg:py-28">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="gradient-blob w-[600px] h-[600px] bg-gradient-to-br from-rose-300 to-pink-400 top-[-200px] right-[-100px] opacity-30" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Parts Inventory</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Parts Inventory
              <span className="block text-rose-600">Never be caught without the part you need.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Track spare parts, set reorder points, and link parts to specific machines. When a work order is completed, parts are automatically deducted from inventory.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-rose-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-rose-200 text-sm">{stat.label}</div>
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
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Complete inventory control</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-rose-50 rounded-2xl p-6 hover:shadow-lg transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-2">{f.title}</h3>
                <p className="text-[#425466] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Stay stocked without the effort</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-rose-600 mx-auto mb-4">1</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Add Your Parts</h3>
              <p className="text-[#425466] text-sm">Enter part details, current stock, and minimum levels. Link parts to the machines they fit.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-rose-600 mx-auto mb-4">2</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Use Parts Naturally</h3>
              <p className="text-[#425466] text-sm">Technicians log parts on work orders. Inventory updates automatically. No extra steps required.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-rose-600 mx-auto mb-4">3</div>
              <h3 className="text-lg font-bold text-[#0a2540] mb-2">Get Alerts & Reorder</h3>
              <p className="text-[#425466] text-sm">When stock runs low, Myncel alerts you. Generate purchase orders with one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-rose-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to take control of your inventory?</h2>
          <p className="text-rose-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="bg-white text-rose-600 font-bold px-8 py-3 rounded-lg hover:bg-rose-50 transition-colors">Start free trial →</Link>
            <Link href="/contact" className="border border-white text-white font-medium px-8 py-3 rounded-lg hover:bg-rose-700 transition-colors">Talk to an expert</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}