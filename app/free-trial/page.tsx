import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Start Your Free 30-Day Trial | Myncel Equipment Monitoring',
  description: 'Try Myncel free for 30 days. No credit card required. Monitor all your equipment, automate maintenance schedules, and manage your facility from one dashboard.',
  alternates: { canonical: 'https://www.myncel.com/free-trial' },
  openGraph: {
    title: 'Start Your Free 30-Day Trial | Myncel',
    description: 'No credit card required. Get full access to Myncel for 30 days. Monitor equipment, automate maintenance, manage work orders across all your sites.',
    url: 'https://www.myncel.com/free-trial',
    type: 'website',
  },
};

const included = [
  { icon: '🏭', label: 'Unlimited asset registration', desc: 'Add every piece of equipment across all your sites — generators, HVAC, pumps, machinery, and more.' },
  { icon: '🔔', label: 'Automated maintenance scheduling', desc: 'Set service intervals and let Myncel automatically create and assign work orders when maintenance is due.' },
  { icon: '📱', label: 'Mobile app for technicians', desc: 'Your field team receives work orders on their phones, logs completions, and adds photos — all offline-capable.' },
  { icon: '📊', label: 'Multi-site dashboard', desc: 'See maintenance status across every location from one consolidated management view.' },
  { icon: '📁', label: 'Full maintenance history', desc: 'Every completed work order is stored permanently against the asset — full audit trail from day one.' },
  { icon: '⚡', label: 'Threshold alerts', desc: 'Set custom alert thresholds and get notified immediately when equipment readings drift outside normal ranges.' },
  { icon: '👥', label: 'Unlimited team members', desc: 'Add your entire maintenance team — technicians, supervisors, managers — with role-based access.' },
  { icon: '🔗', label: 'IoT sensor integration', desc: 'Connect compatible sensors to stream live equipment data directly into your asset dashboards.' },
];

const steps = [
  { number: '01', title: 'Create your account', desc: 'Sign up in under 2 minutes. No credit card, no commitment, no IT setup required.' },
  { number: '02', title: 'Add your first assets', desc: 'Register your critical equipment — start with your generators, then expand to other assets at your own pace.' },
  { number: '03', title: 'Configure maintenance schedules', desc: 'Set service intervals for each asset. Myncel calculates due dates and creates work orders automatically.' },
  { number: '04', title: 'Invite your team', desc: 'Add your technicians and supervisors. They receive work order notifications on their phones immediately.' },
  { number: '05', title: 'Watch your first work orders run', desc: 'Your maintenance programme is live. Track completions, view compliance, and see every asset\'s history in real time.' },
];

const faqs = [
  {
    q: 'Is a credit card required to start the trial?',
    a: 'No. You can start your 30-day free trial with just an email address. No payment information is required until you decide to continue after the trial ends.',
  },
  {
    q: 'What happens after 30 days?',
    a: 'After your trial ends, you can choose a plan that fits your needs. All your data — assets, maintenance history, work orders — is preserved. If you choose not to continue, you can export your data before your account is closed.',
  },
  {
    q: 'Is there a limit on how many assets or users I can add during the trial?',
    a: 'No. The trial gives you full access to all Myncel features with no artificial limits. You can add all your assets and invite your entire team so you can evaluate the platform properly.',
  },
  {
    q: 'Does the mobile app work without internet?',
    a: 'Yes. Technicians can view assigned work orders, log completions, add notes and photos, and update asset readings while offline. Data syncs automatically when connectivity is restored.',
  },
  {
    q: 'Can I connect IoT sensors during the trial?',
    a: 'Yes. If you have compatible sensors, you can connect them during the trial and start streaming live equipment data into Myncel. Our support team can help with sensor setup.',
  },
  {
    q: 'What kind of support is available during the trial?',
    a: 'Full support is available throughout your trial — email, chat, and video onboarding sessions. We want you to get real value from the trial, so we\'re invested in helping you set up properly.',
  },
  {
    q: 'We have facilities in multiple countries. Can we trial across all sites?',
    a: 'Absolutely. Myncel is designed for multi-site operations. You can add sites in Nigeria, Ghana, the UK, the US, or any other location and manage them all from one account during your trial.',
  },
];

const sectors = [
  { emoji: '🏭', name: 'Manufacturing', desc: 'Production machinery, compressors, hydraulics' },
  { emoji: '🏨', name: 'Hotels & Hospitality', desc: 'Generators, HVAC, cold rooms, elevators' },
  { emoji: '🏥', name: 'Hospitals & Healthcare', desc: 'Medical equipment, UPS, refrigeration' },
  { emoji: '❄️', name: 'Warehouses & Cold Chain', desc: 'Refrigeration, conveyors, dock equipment' },
  { emoji: '⛽', name: 'Oil & Gas', desc: 'Pumps, compressors, separators, fleet' },
  { emoji: '📡', name: 'Telecom & Data', desc: 'Generators, cooling, UPS, infrastructure' },
];

export default function FreeTrial() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a2540] via-[#1a3a5c] to-[#0d1f3c] pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            30-day free trial · No credit card required
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Full access to Myncel,<br />
            <span className="text-[#635bff]">free for 30 days</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Register your assets, automate your maintenance schedules, give your team mobile work orders, and see the difference structured equipment management makes — before you pay a cent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/signup"
              className="inline-block bg-[#635bff] text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-[#5a52e8] transition-colors shadow-lg shadow-purple-500/30"
            >
              Start free trial →
            </Link>
            <Link
              href="/demo"
              className="inline-block bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Book a demo instead
            </Link>
          </div>
          <p className="text-gray-400 text-sm">No credit card · No commitment · Full access · Cancel anytime</p>
        </div>
      </div>

      {/* Social proof bar */}
      <div className="bg-[#f6f9fc] border-y border-[#e6ebf1] py-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: '500+', label: 'Facilities monitored' },
              { stat: '12,000+', label: 'Assets tracked' },
              { stat: '98%', label: 'Trial-to-paid conversion' },
              { stat: '4.9/5', label: 'Average trial rating' },
            ].map((item, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-[#0a2540]">{item.stat}</div>
                <div className="text-sm text-[#425466]">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's included */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">Everything included. No restrictions.</h2>
          <p className="text-[#425466] text-lg max-w-2xl mx-auto">Your 30-day trial is not a limited demo — it is full access to the complete Myncel platform. Every feature, every integration, every team member.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {included.map((item, i) => (
            <div key={i} className="bg-white border border-[#e6ebf1] rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-[#0a2540] mb-2">{item.label}</h3>
              <p className="text-[#425466] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#f6f9fc] border-y border-[#e6ebf1]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">Up and running in under an hour</h2>
            <p className="text-[#425466] text-lg">No lengthy onboarding. No IT project. No professional services engagement. Just sign up and start.</p>
          </div>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-[#635bff] text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
                  {step.number}
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-[#0a2540] text-lg mb-1">{step.title}</h3>
                  <p className="text-[#425466] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sectors */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a2540] mb-4">Built for your industry</h2>
          <p className="text-[#425466] text-lg max-w-2xl mx-auto">Myncel is used by facility and maintenance teams across multiple sectors. Whichever industry you are in, the platform adapts to your assets and your workflows.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector, i) => (
            <div key={i} className="bg-white border border-[#e6ebf1] rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
              <span className="text-3xl">{sector.emoji}</span>
              <div>
                <h3 className="font-bold text-[#0a2540] mb-1">{sector.name}</h3>
                <p className="text-[#425466] text-sm">{sector.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/solutions" className="text-[#635bff] font-medium hover:underline">View all industry solutions →</Link>
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-gradient-to-br from-[#635bff] to-[#4f46e5] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">"</div>
          <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8">
            We set up Myncel for our three generators and HVAC systems in one afternoon. By the end of the first week our maintenance team was already completing scheduled work orders on their phones. Within 60 days we had our first full month with zero unplanned breakdowns.
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">FM</div>
            <div className="text-left">
              <div className="text-white font-medium">Facility Manager</div>
              <div className="text-purple-200 text-sm">4-star hotel, Lagos, Nigeria</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#0a2540] mb-4">Free trial FAQ</h2>
          <p className="text-[#425466]">Common questions about the Myncel free trial.</p>
        </div>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-[#e6ebf1] rounded-2xl p-6">
              <h3 className="font-bold text-[#0a2540] mb-3">{faq.q}</h3>
              <p className="text-[#425466] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-[#0a2540] py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start protecting your equipment today
          </h2>
          <p className="text-gray-300 text-lg mb-10">
            Join hundreds of facilities that use Myncel to reduce unplanned breakdowns, automate maintenance, and get full visibility over their equipment — starting with a free 30-day trial.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#635bff] text-white font-semibold px-10 py-4 rounded-xl text-lg hover:bg-[#5a52e8] transition-colors shadow-lg shadow-purple-500/40 mb-6"
          >
            Start your free trial →
          </Link>
          <p className="text-gray-400 text-sm">
            No credit card required · Full access for 30 days · Cancel anytime
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Prefer to talk first?{' '}
            <Link href="/demo" className="text-[#635bff] hover:underline">Book a 20-minute demo →</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}