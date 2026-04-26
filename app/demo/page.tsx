import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Book a Demo — See Myncel in Action',
  description: 'Schedule a personalized 30-minute demo to see how Myncel can transform your maintenance operations.',
  alternates: { canonical: 'https://myncel.com/demo' },
};

export default function DemoPage() {
  const demoTypes = [
    {
      icon: '🏭',
      title: 'Manufacturing Operations',
      desc: 'See how Myncel helps track equipment health, schedule maintenance, and reduce downtime for manufacturing facilities.',
      duration: '30 min',
    },
    {
      icon: '⚙️',
      title: 'Maintenance Teams',
      desc: 'Learn how your maintenance team can streamline work orders, manage parts inventory, and track PM compliance.',
      duration: '30 min',
    },
    {
      icon: '📊',
      title: 'Plant Managers',
      desc: 'Discover dashboards and analytics that give you visibility into OEE, MTBF, MTTR, and maintenance costs.',
      duration: '30 min',
    },
    {
      icon: '🏢',
      title: 'Enterprise Solutions',
      desc: 'Explore custom implementations, SSO, API integrations, and dedicated support for large organizations.',
      duration: '45 min',
    },
  ];

  const benefits = [
    { icon: '✅', text: 'Personalized walkthrough tailored to your industry' },
    { icon: '✅', text: 'Live Q&A with a product specialist' },
    { icon: '✅', text: 'See real-world use cases relevant to your operations' },
    { icon: '✅', text: 'Get pricing information for your team size' },
    { icon: '✅', text: 'No commitment required' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f6f9fc] to-white py-16 border-b border-[#e6ebf1]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <nav className="text-sm text-[#8898aa] mb-4">
            <Link href="/" className="hover:text-[#635bff]">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-[#0a2540]">Book a Demo</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0a2540] mb-4">
            See Myncel in Action
          </h1>
          <p className="text-lg text-[#425466] max-w-2xl mx-auto mb-8">
            Schedule a personalized demo with our team. We'll show you how Myncel can help you reduce downtime, 
            streamline maintenance, and improve equipment reliability.
          </p>
          <a 
            href="https://calendly.com/myncel/demo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#635bff] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#4f46e5] transition-colors"
          >
            Schedule Your Demo
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-[#f6f9fc]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-[#e6ebf1] p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-6 text-center">What to Expect</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{benefit.icon}</span>
                  <span className="text-[#425466]">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Types */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-8 text-center">Choose Your Demo Focus</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {demoTypes.map((demo, i) => (
              <div key={i} className="bg-white border border-[#e6ebf1] rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-3">{demo.icon}</div>
                <h3 className="text-lg font-bold text-[#0a2540] mb-2">{demo.title}</h3>
                <p className="text-[#425466] text-sm mb-3">{demo.desc}</p>
                <span className="text-xs font-medium text-[#635bff] bg-[#635bff]/10 px-2 py-1 rounded">
                  {demo.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-[#f6f9fc]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#635bff] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Schedule</h3>
              <p className="text-sm text-[#425466]">Pick a time that works for you using our online scheduler.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#635bff] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Meet</h3>
              <p className="text-sm text-[#425466]">Join a 30-minute video call with a product specialist.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#635bff] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Get Started</h3>
              <p className="text-sm text-[#425466]">Receive a custom plan and start your free trial.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-4">Ready to transform your maintenance operations?</h2>
          <p className="text-[#425466] mb-6">Join hundreds of manufacturers who trust Myncel to keep their equipment running.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://calendly.com/myncel/demo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#635bff] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#4f46e5] transition-colors"
            >
              Schedule Demo
            </a>
            <Link href="/signup" className="border border-[#e6ebf1] text-[#0a2540] px-8 py-3 rounded-lg font-semibold hover:bg-[#f6f9fc] transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}