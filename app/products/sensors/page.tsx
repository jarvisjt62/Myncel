import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'IoT Sensors — Real-Time Equipment Monitoring',
  description: 'Connect vibration, temperature, and pressure sensors to Myncel for automated readings and predictive maintenance alerts.',
  alternates: { canonical: 'https://myncel.com/products/sensors' },
};

export default function Sensors() {
  const sensorTypes = [
    { name: 'Vibration Sensors', desc: 'Detect bearing wear and imbalance before failure', icon: '📳' },
    { name: 'Temperature Sensors', desc: 'Monitor motor and bearing temperatures continuously', icon: '🌡️' },
    { name: 'Pressure Sensors', desc: 'Track hydraulic and pneumatic system pressure', icon: '⏱️' },
    { name: 'Current Sensors', desc: 'Monitor electrical load and detect anomalies', icon: '⚡' },
  ];

  const benefits = [
    '24/7 automated monitoring',
    'Early warning detection',
    'Reduced inspection time',
    'Predictive maintenance',
    'Historical trend analysis',
    'Integration with work orders',
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 text-cyan-600 font-semibold text-sm mb-4">
            <Link href="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>IoT Sensors</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#0a2540] leading-tight mb-6">
              IoT Sensors
              <span className="block text-cyan-600">Connect your machines to the future.</span>
            </h1>
            <p className="text-xl text-[#425466] leading-relaxed mb-8">
              Connect vibration, temperature, and pressure sensors for automated readings. Get real-time insights and predictive maintenance alerts—before problems happen.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="btn-stripe-primary px-6 py-3">Start free trial →</Link>
              <Link href="/contact" className="btn-stripe-secondary px-6 py-3">Request demo</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="section-label">Sensor Types</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540]">Monitor what matters</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sensorTypes.map((s, i) => (
              <div key={i} className="bg-cyan-50 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-[#0a2540] mb-2">{s.name}</h3>
                <p className="text-sm text-[#425466]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f6f9fc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-label">Benefits</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#0a2540] mb-4">Why connect sensors?</h2>
              <p className="text-[#425466] mb-6">IoT sensors transform maintenance from reactive to predictive. Know about problems before they cause downtime.</p>
              <ul className="space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#425466]">
                    <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl p-8 text-center">
              <div className="text-6xl font-bold text-cyan-600 mb-2">98%</div>
              <div className="text-[#425466]">Of failures predicted early</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cyan-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to connect your machines?</h2>
          <p className="text-cyan-200 mb-8 text-lg">Start your free 3-month trial. No credit card required.</p>
          <Link href="/signup" className="inline-block bg-white text-cyan-600 font-bold px-8 py-3 rounded-lg hover:bg-cyan-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}