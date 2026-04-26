'use client'
// Metadata is handled in layout for client components - SEO via page-level head;
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 79,
      desc: 'Perfect for small shops with a handful of machines.',
      color: 'text-violet-600',
      features: [
        { text: 'Up to 10 machines', included: true },
        { text: 'Unlimited technician accounts', included: true },
        { text: 'Smart scheduling & due dates', included: true },
        { text: 'Digital work orders', included: true },
        { text: 'Email alerts & notifications', included: true },
        { text: '14-day maintenance history', included: true },
        { text: 'Mobile-friendly interface', included: true },
        { text: 'SMS notifications', included: false },
        { text: 'Parts inventory tracking', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'API access', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Start free trial',
      featured: false,
    },
    {
      name: 'Growth',
      monthlyPrice: 149,
      desc: 'The sweet spot for growing maintenance teams.',
      color: 'text-white',
      features: [
        { text: 'Up to 30 machines', included: true },
        { text: 'Unlimited technician accounts', included: true },
        { text: 'Smart scheduling & due dates', included: true },
        { text: 'Digital work orders + photos', included: true },
        { text: 'Email + SMS alerts', included: true },
        { text: '1-year maintenance history', included: true },
        { text: 'Mobile-friendly interface', included: true },
        { text: 'SMS notifications', included: true },
        { text: 'Parts inventory tracking', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'API access', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Start free trial',
      featured: true,
    },
    {
      name: 'Professional',
      monthlyPrice: 299,
      desc: 'For larger operations that need the full suite.',
      color: 'text-indigo-600',
      features: [
        { text: 'Unlimited machines', included: true },
        { text: 'Unlimited technician accounts', included: true },
        { text: 'Smart scheduling & due dates', included: true },
        { text: 'Digital work orders + photos', included: true },
        { text: 'All alert types', included: true },
        { text: 'Unlimited history', included: true },
        { text: 'Mobile-friendly interface', included: true },
        { text: 'SMS notifications', included: true },
        { text: 'Parts inventory tracking', included: true },
        { text: 'Custom analytics & reports', included: true },
        { text: 'API access & webhooks', included: true },
        { text: 'Priority support + SLA', included: true },
      ],
      cta: 'Start free trial',
      featured: false,
    },
  ];

  const faqs = [
    { q: 'Is there really a 3-month free trial?', a: 'Yes. Every new account gets 3 full months free — no credit card required. You get full access to the Growth plan during your trial.' },
    { q: 'What happens after the trial ends?', a: 'We\'ll remind you 2 weeks before your trial ends. You choose which plan to subscribe to (or we\'ll automatically move you to Starter). No surprises.' },
    { q: 'Can I switch plans at any time?', a: 'Absolutely. Upgrade or downgrade anytime from your billing settings. Upgrades take effect immediately. Downgrades apply at the next billing cycle.' },
    { q: 'Do you offer annual billing?', a: 'Yes! Annual billing saves you 2 months — effectively 17% off. Toggle the switch above to see annual pricing.' },
    { q: 'What counts as a "machine"?', a: 'Any piece of equipment you track in Myncel — CNC machines, conveyors, compressors, forklifts, HVAC units, etc. Each one counts as one machine toward your plan limit.' },
    { q: 'Is there a setup or implementation fee?', a: 'No. Never. Setup is free and typically takes 15 minutes. No consultants. No onboarding fees. Just create an account and start adding machines.' },
    { q: 'Do you offer custom Enterprise plans?', a: 'Yes. For operations with 100+ machines, multiple facilities, or specific compliance requirements, we offer custom Enterprise plans with dedicated support. Contact us to discuss.' },
    { q: 'What payment methods do you accept?', a: 'All major credit and debit cards (Visa, Mastercard, Amex, Discover). Annual plans can also pay by ACH bank transfer or check. Contact us for invoiced billing.' },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="py-20 bg-[#f6f9fc] border-b border-[#e6ebf1]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="section-label">Pricing</span>
          <h1 className="text-5xl font-bold text-[#0a2540] mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-[#425466] mb-8">Start free for 3 months. No credit card. No setup fees. Cancel anytime.</p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-[#e6ebf1] rounded-full px-4 py-2 shadow-sm">
            <span className={`text-sm font-medium ${!annual ? 'text-[#0a2540]' : 'text-[#8898aa]'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-11 h-6 rounded-full relative transition-colors ${annual ? 'bg-[#635bff]' : 'bg-[#e6ebf1]'}`}
            >
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow ${annual ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-[#0a2540]' : 'text-[#8898aa]'}`}>
              Annual
              <span className="ml-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Save 17%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => {
              const price = annual ? Math.round(plan.monthlyPrice * 10 / 12) : plan.monthlyPrice;
              return (
                <div key={plan.name} className={`rounded-2xl p-8 border ${plan.featured ? 'bg-[#635bff] border-transparent shadow-2xl shadow-purple-200 scale-105' : 'bg-white border-[#e6ebf1]'}`}>
                  {plan.featured && (
                    <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">✨ Most Popular</div>
                  )}
                  <div className={`text-sm font-bold mb-1 ${plan.featured ? 'text-purple-200' : plan.color}`}>{plan.name}</div>
                  <div className={`text-5xl font-bold mb-1 ${plan.featured ? 'text-white' : 'text-[#0a2540]'}`}>
                    ${price}
                  </div>
                  <div className={`text-sm mb-2 ${plan.featured ? 'text-purple-200' : 'text-[#8898aa]'}`}>
                    per month{annual ? ', billed annually' : ''}
                  </div>
                  {annual && (
                    <div className={`text-xs mb-3 line-through ${plan.featured ? 'text-purple-300' : 'text-[#c0ccda]'}`}>${plan.monthlyPrice}/mo monthly</div>
                  )}
                  <p className={`text-sm mb-6 ${plan.featured ? 'text-purple-100' : 'text-[#425466]'}`}>{plan.desc}</p>

                  <Link href="/signup" className={`block text-center py-3 px-4 rounded-xl text-sm font-bold transition-all mb-6 ${
                    plan.featured ? 'bg-white text-[#635bff] hover:bg-purple-50' : 'bg-[#635bff] text-white hover:bg-[#4f46e5]'
                  }`}>
                    {plan.cta} →
                  </Link>

                  <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${plan.featured ? 'text-purple-300' : 'text-[#8898aa]'}`}>What's included</div>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f.text} className={`flex items-center gap-2.5 text-sm ${!f.included ? 'opacity-40' : ''}`}>
                        {f.included ? (
                          <svg className={`w-4 h-4 flex-shrink-0 ${plan.featured ? 'text-purple-200' : 'text-[#635bff]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 flex-shrink-0 text-[#c0ccda]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className={plan.featured ? 'text-purple-100' : 'text-[#425466]'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Enterprise */}
          <div className="mt-8 bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-[#0a2540] mb-1">Enterprise</h3>
              <p className="text-[#425466] text-sm max-w-lg">100+ machines, multiple facilities, custom integrations, dedicated support, SLA guarantees, and invoiced billing. Let's build the right plan for your operation.</p>
            </div>
            <Link href="/contact" className="flex-shrink-0 btn-stripe-secondary px-6 py-3 text-sm">Contact sales →</Link>
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 bg-[#f6f9fc]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-8 text-center">Full feature comparison</h2>
          <div className="bg-white border border-[#e6ebf1] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-[#e6ebf1] bg-[#f6f9fc]">
                  <th className="text-left px-6 py-4 font-semibold text-[#8898aa]">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold text-[#0a2540]">Starter</th>
                  <th className="text-center px-4 py-4 font-bold text-[#635bff] bg-[#f0f4ff]">Growth</th>
                  <th className="text-center px-4 py-4 font-semibold text-[#0a2540]">Professional</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Machines', starter: '10', growth: '30', pro: 'Unlimited' },
                  { feature: 'Technician accounts', starter: 'Unlimited', growth: 'Unlimited', pro: 'Unlimited' },
                  { feature: 'Facilities', starter: '1', growth: '3', pro: 'Unlimited' },
                  { feature: 'Maintenance history', starter: '14 days', growth: '1 year', pro: 'Unlimited' },
                  { feature: 'Work orders', starter: '✓', growth: '✓', pro: '✓' },
                  { feature: 'Work order photos', starter: '—', growth: '✓', pro: '✓' },
                  { feature: 'Email alerts', starter: '✓', growth: '✓', pro: '✓' },
                  { feature: 'SMS alerts', starter: '—', growth: '✓', pro: '✓' },
                  { feature: 'Parts inventory', starter: '—', growth: '✓', pro: '✓' },
                  { feature: 'Advanced analytics', starter: '—', growth: '✓', pro: '✓' },
                  { feature: 'Custom reports', starter: '—', growth: '—', pro: '✓' },
                  { feature: 'API access', starter: '—', growth: '—', pro: '✓' },
                  { feature: 'Zapier integration', starter: '—', growth: '—', pro: '✓' },
                  { feature: 'Support', starter: 'Email', growth: 'Email + Chat', pro: 'Priority + Phone' },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-[#f6f9fc] ${i % 2 === 1 ? 'bg-[#fafbfc]' : ''}`}>
                    <td className="px-6 py-3 text-[#0a2540] font-medium">{row.feature}</td>
                    <td className="px-4 py-3 text-center text-[#425466]">{row.starter}</td>
                    <td className="px-4 py-3 text-center font-semibold text-[#635bff] bg-[#f0f4ff]/50">{row.growth}</td>
                    <td className="px-4 py-3 text-center text-[#425466]">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#0a2540] text-center mb-10">Pricing FAQ</h2>
          <div className="divide-y divide-[#e6ebf1]">
            {faqs.map((faq, i) => (
              <div key={i} className="py-5">
                <button className="w-full flex items-center justify-between text-left gap-4" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold text-[#0a2540]">{faq.q}</span>
                  <svg className={`w-5 h-5 text-[#8898aa] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && <p className="mt-3 text-[#425466] text-sm leading-relaxed">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start your free trial today</h2>
          <p className="text-purple-200 mb-8 text-lg">3 months free. No credit card. Setup in 15 minutes.</p>
          <Link href="/signup" className="bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors text-base">
            Get started free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}