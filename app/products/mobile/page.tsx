import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Mobile Maintenance App — Work From Anywhere on the Shop Floor',
  description: 'Technicians access work orders, log completions, and attach photos from any smartphone. No app install needed—works in your browser.',
  alternates: { canonical: 'https://myncel.com/products/mobile' },
};

export default function Mobile() {
  const features = [
    { icon: '📱', title: 'No App Required', desc: 'Works in any mobile browser. No app store downloads, no updates to manage, no IT involvement.' },
    { icon: '📸', title: 'Photo Capture', desc: 'Attach photos to work orders directly from your phone camera. Document problems and solutions visually.' },
    { icon: '📍', title: 'QR Code Scanning', desc: 'Scan machine QR codes to instantly pull up equipment details, history, and pending tasks.' },
    { icon: '✅', title: 'Quick Completion', desc: 'Complete work orders in seconds. Tap, add notes, snap a photo, done.' },
    { icon: '🔔', title: 'Push Notifications', desc: 'Get alerts on your phone when new tasks are assigned or priorities change.' },
    { icon: '📴', title: 'Offline Mode', desc: 'Work without internet connection. Data syncs automatically when connection returns.' },
  ];

  const stats = [
    { value: '100%', label: 'Mobile-friendly' },
    { value: '0', label: 'App installs needed' },
    { value: '5sec', label: 'Task completion' },
    { value: 'Offline', label: 'Support' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>Mobile App</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              Mobile Maintenance App
              <span className="block text-rose-600">Your shop floor, in your pocket.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Technicians access work orders, log completions, and attach photos from any smartphone. No app install needed—works in your mobile browser.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Built for the shop floor</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-rose-50 rounded-xl p-6">
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
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-label">How It Works</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">Simple as opening a browser</h2>
              <p className="text-[#425466] mb-6">No complicated app deployment. Technicians simply open the Myncel website on their phone, log in, and they have everything they need.</p>
              <ul className="space-y-3">
                {['Open myncel.com on any smartphone', 'Log in with your credentials', 'See your assigned tasks instantly', 'Complete work orders on the spot'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#425466]">
                    <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8 text-center">
              <div className="bg-white rounded-xl shadow-lg p-4 max-w-xs mx-auto">
                <div className="text-left text-sm font-bold text-[#0a2540] mb-2">Your Tasks (3)</div>
                <div className="space-y-2">
                  <div className="bg-rose-50 rounded-lg p-2 text-left text-xs">
                    <div className="font-semibold text-[#0a2540]">CNC #3 - Filter Change</div>
                    <div className="text-[#8898aa]">Due today</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-left text-xs">
                    <div className="font-semibold text-[#0a2540]">Press Brake - Lubrication</div>
                    <div className="text-[#8898aa]">Due tomorrow</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-rose-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to go mobile?</h2>
          <p className="text-rose-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-rose-600 font-bold px-8 py-3 rounded-lg hover:bg-rose-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}