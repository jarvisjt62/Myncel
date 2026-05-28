'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobilePricingFallback from '../components/MobilePricingFallback';
import { useIsCapacitorWebview } from '../../lib/use-capacitor-webview';
import {
  SUPPORTED_CURRENCIES,
  convertUsdToLocal,
  formatCurrency,
  getCurrencyDef,
  getFxMeta,
} from '../../lib/pricing/currencies';

const STORAGE_KEY = 'myncel.pricing.currency';

interface Props {
  initialCountry: string | null;
  initialCurrency: string;
}

export default function PricingClient({ initialCountry, initialCurrency }: Props) {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>(initialCurrency);

  // Compliance: hide all pricing inside the Capacitor mobile app to avoid
  // Google Play "currency differences with prominent display price"
  // rejection. (Phase 1 narrows the gap, but the historic compliance
  // hide stays in place inside the native shells until we re-verify.)
  // See: docs/google-play-pricing-compliance.md
  //
  // IMPORTANT: this early return MUST come AFTER every useState call.
  const isMobileApp = useIsCapacitorWebview();

  // After hydration, prefer a manually-saved currency from localStorage.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_CURRENCIES.some(c => c.code === saved) && saved !== currency) {
        setCurrency(saved);
      }
    } catch {
      /* SSR / privacy mode — ignore */
    }
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCurrencyChange(next: string) {
    setCurrency(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  if (isMobileApp) {
    return <MobilePricingFallback />;
  }

  const fxMeta = getFxMeta();
  const currencyDef = getCurrencyDef(currency);
  const isUsd = currencyDef.code === 'USD';

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 49,
      annualPrice: 39,
      desc: 'Perfect for small maintenance teams.',
      color: 'text-violet-600',
      features: [
        { text: 'Up to 25 machines', included: true },
        { text: 'Up to 10 users', included: true },
        { text: '500 work orders/month', included: true },
        { text: 'Advanced reporting', included: true },
        { text: 'Email & SMS notifications', included: true },
        { text: 'API access', included: true },
        { text: 'QR code labels', included: true },
        { text: 'Integrations (Slack, Zapier)', included: true },
        { text: 'IoT sensor data', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Start free trial',
      featured: false,
    },
    {
      name: 'Growth',
      monthlyPrice: 99,
      annualPrice: 79,
      desc: 'For growing maintenance operations.',
      color: 'text-white',
      features: [
        { text: 'Up to 100 machines', included: true },
        { text: 'Up to 25 users', included: true },
        { text: '2,000 work orders/month', included: true },
        { text: 'Full analytics suite', included: true },
        { text: 'IoT sensor integration', included: true },
        { text: 'All notifications', included: true },
        { text: 'API access + webhooks', included: true },
        { text: 'Priority email support', included: true },
        { text: 'All integrations', included: true },
        { text: 'Custom dashboards', included: true },
        { text: 'Dedicated account manager', included: false },
        { text: 'SLA guarantee', included: false },
      ],
      cta: 'Start free trial',
      featured: true,
    },
    {
      name: 'Professional',
      monthlyPrice: 249,
      annualPrice: 199,
      desc: 'Advanced features for large teams.',
      color: 'text-indigo-600',
      features: [
        { text: 'Up to 500 machines', included: true },
        { text: 'Up to 100 users', included: true },
        { text: '10,000 work orders/month', included: true },
        { text: 'Full analytics + custom reports', included: true },
        { text: 'IoT + SCADA integration', included: true },
        { text: 'All notifications + PagerDuty', included: true },
        { text: 'Full API access', included: true },
        { text: 'Priority phone support', included: true },
        { text: 'All integrations + custom', included: true },
        { text: 'White-label options', included: true },
        { text: 'SSO / SAML', included: true },
      ],
      cta: 'Start free trial',
      featured: false,
    },
  ];

  const faqs = [
    { q: 'Is there really a 30-day free trial?', a: 'Yes. Every new account gets 30 days free — no credit card required. You get full, Professional-level access during your trial.' },
    { q: 'What happens after the trial ends?', a: 'Your data is preserved and your account becomes restricted after the trial until you choose a paid plan. You can upgrade from billing settings when you are ready.' },
    { q: 'Can I switch plans at any time?', a: 'Absolutely. Upgrade or downgrade anytime from your billing settings. Upgrades take effect immediately. Downgrades apply at the next billing cycle.' },
    { q: 'Do you offer annual billing?', a: 'Yes! Annual billing saves you 2 months — effectively 17% off. Toggle the switch above to see annual pricing.' },
    { q: 'What counts as a "machine"?', a: 'Any piece of equipment you track in Myncel — CNC machines, conveyors, compressors, forklifts, HVAC units, etc. Each one counts as one machine toward your plan limit.' },
    { q: 'Is there a setup or implementation fee?', a: 'No. Never. Setup is free and typically takes 15 minutes. No consultants. No onboarding fees. Just create an account and start adding machines.' },
    { q: 'Do you offer custom Enterprise plans?', a: 'Yes. For operations that need unlimited machines, unlimited users, unlimited work orders, multiple facilities, or specific compliance requirements, we offer custom Enterprise plans with dedicated support. Contact us to discuss.' },
    { q: 'What payment methods do you accept?', a: 'All major credit and debit cards (Visa, Mastercard, Amex, Discover). Annual plans can also pay by ACH bank transfer or check. Contact us for invoiced billing.' },
    {
      q: `Why am I seeing prices in ${currencyDef.name}?`,
      a: isUsd
        ? 'You are seeing prices in US Dollars (USD), our reference currency. If you are visiting from outside the United States, use the currency selector at the top of this page to view prices in your local currency. At checkout, Stripe will charge in your local currency at the live exchange rate of that day.'
        : `We detected you are visiting from ${initialCountry ?? 'outside the US'}, so prices are shown in ${currencyDef.name} (${currencyDef.code}) for convenience. Our reference currency is US Dollars; the local price you see is the USD price converted at the latest mid-market exchange rate. Your bank may apply a small spread at checkout, so the final amount on your statement can vary by ~1–3%. You can switch back to USD or any other currency using the selector at the top of this page.`,
    },
  ];

  function formatPlanPrice(usd: number): string {
    const { amount, currency: def } = convertUsdToLocal(usd, currency);
    return formatCurrency(amount, def.code);
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="py-20 bg-[#f6f9fc] border-b border-[#e6ebf1]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="section-label">Pricing</span>
          <h1 className="text-5xl font-bold text-[#0a2540] mb-4">Simple, transparent CMMS software pricing</h1>
          <p className="text-xl text-[#425466] mb-8">Start free for 30 days with preventive maintenance software, work order management software, equipment maintenance software, and predictive maintenance analytics included. No credit card. No setup fees. Cancel anytime.</p>

          {/* Currency + annual selector row */}
          <div className="flex flex-col items-center gap-4">
            {/* Currency selector */}
            <div className="inline-flex items-center gap-2 bg-white border border-[#e6ebf1] rounded-full px-3 py-1.5 shadow-sm text-sm">
              <span className="text-[#8898aa]">Show prices in:</span>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-transparent font-semibold text-[#0a2540] focus:outline-none cursor-pointer pr-1"
                aria-label="Currency"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Annual toggle — standard switch */}
            <div className="inline-flex items-center gap-3">
              <span
                className={`text-sm font-medium cursor-pointer select-none ${!annual ? 'text-[#0a2540]' : 'text-[#8898aa]'}`}
                onClick={() => setAnnual(false)}
              >
                Monthly
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                onClick={() => setAnnual(!annual)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:ring-offset-2 ${annual ? 'bg-[#635bff]' : 'bg-[#cbd5e1]'}`}
                aria-label="Toggle annual billing"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${annual ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
              <span
                className={`text-sm font-medium cursor-pointer select-none ${annual ? 'text-[#0a2540]' : 'text-[#8898aa]'}`}
                onClick={() => setAnnual(true)}
              >
                Annual
                <span className="ml-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Save 17%</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => {
              const usdPrice = annual ? plan.annualPrice : plan.monthlyPrice;
              const monthlyUsd = plan.monthlyPrice;
              return (
                <div key={plan.name} className={`rounded-2xl p-8 border ${plan.featured ? 'bg-[#635bff] border-transparent shadow-2xl shadow-purple-200 scale-105' : 'bg-white border-[#e6ebf1]'}`}>
                  {plan.featured && (
                    <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">✨ Most Popular</div>
                  )}
                  <div className={`text-sm font-bold mb-1 ${plan.featured ? 'text-purple-200' : plan.color}`}>{plan.name}</div>
                  <div className={`text-5xl font-bold mb-1 ${plan.featured ? 'text-white' : 'text-[#0a2540]'}`}>
                    {formatPlanPrice(usdPrice)}
                  </div>
                  <div className={`text-sm mb-2 ${plan.featured ? 'text-purple-200' : 'text-[#8898aa]'}`}>
                    per month{annual ? ', billed annually' : ''}
                  </div>
                  {annual && (
                    <div className={`text-xs mb-3 line-through ${plan.featured ? 'text-purple-300' : 'text-[#c0ccda]'}`}>
                      {formatPlanPrice(monthlyUsd)}/mo monthly
                    </div>
                  )}
                  {!isUsd && (
                    <div className={`text-[10px] mb-3 ${plan.featured ? 'text-purple-200/80' : 'text-[#8898aa]'}`}>
                      Reference price: ${usdPrice} USD
                    </div>
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

          {/* FX disclosure */}
          {!isUsd && (
            <p className="mt-6 text-center text-xs text-[#8898aa] max-w-2xl mx-auto leading-relaxed">
              Prices shown in {currencyDef.name} ({currencyDef.code}) are converted from US Dollars at the latest
              mid-market exchange rate (last refreshed {new Date(fxMeta.fetchedAt).toLocaleDateString()}). Final amount
              charged at checkout is set by Stripe in your local currency and may vary by ~1–3% depending on your
              bank's spread. You can switch back to USD using the selector above.
            </p>
          )}

          {/* Enterprise */}
          <div className="mt-8 bg-[#f6f9fc] border border-[#e6ebf1] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-[#0a2540] mb-1">Enterprise</h3>
              <p className="text-[#425466] text-sm max-w-lg">Unlimited machines, unlimited users, unlimited work orders, custom integrations, dedicated support, SLA guarantees, and invoiced billing. Let's build the right plan for your operation.</p>
            </div>
            <Link href="/contact" className="flex-shrink-0 btn-stripe-secondary px-6 py-3 text-sm">Contact sales →</Link>
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 bg-[#f6f9fc]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-8 text-center">Full CMMS software feature comparison</h2>
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
                  { feature: 'Machines', starter: '25', growth: '100', pro: '500' },
                  { feature: 'Users', starter: '10', growth: '25', pro: '100' },
                  { feature: 'Storage', starter: '5GB', growth: '20GB', pro: '100GB' },
                  { feature: 'Work orders/month', starter: '500', growth: '2,000', pro: '10,000' },
                  { feature: 'Work orders', starter: '✓', growth: '✓', pro: '✓' },
                  { feature: 'QR code labels', starter: '✓', growth: '✓', pro: '✓' },
                  { feature: 'Email alerts', starter: '✓', growth: '✓', pro: '✓' },
                  { feature: 'SMS alerts', starter: '—', growth: '✓', pro: '✓' },
                  { feature: 'IoT sensor data', starter: '—', growth: '✓', pro: '✓' },
                  { feature: 'Advanced analytics', starter: '—', growth: '✓', pro: '✓' },
                  { feature: 'Custom reports', starter: '—', growth: '—', pro: '✓' },
                  { feature: 'API access', starter: '✓', growth: '✓ + webhooks', pro: 'Full API access' },
                  { feature: 'Integrations', starter: 'Slack, Zapier', growth: 'All integrations', pro: 'All + custom' },
                  { feature: 'Support', starter: 'Standard', growth: 'Priority email', pro: 'Priority phone' },
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

      {/* Switching from another CMMS — internal comparison links for SEO */}
      <section className="py-16 bg-[#f6f9fc] border-t border-[#e6ebf1]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0a2540] mb-3">Comparing Myncel to another CMMS?</h2>
            <p className="text-[#425466]">See side-by-side feature and pricing comparisons.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/compare/myncel-vs-upkeep" className="group rounded-lg border border-[#e6ebf1] bg-white px-4 py-3 text-center text-sm font-semibold text-[#0a2540] transition hover:border-[#635bff] hover:text-[#635bff]">
              vs UpKeep <span className="text-[#635bff] group-hover:translate-x-0.5 inline-block transition">→</span>
            </Link>
            <Link href="/compare/myncel-vs-limble" className="group rounded-lg border border-[#e6ebf1] bg-white px-4 py-3 text-center text-sm font-semibold text-[#0a2540] transition hover:border-[#635bff] hover:text-[#635bff]">
              vs Limble <span className="text-[#635bff] group-hover:translate-x-0.5 inline-block transition">→</span>
            </Link>
            <Link href="/compare/myncel-vs-fiix" className="group rounded-lg border border-[#e6ebf1] bg-white px-4 py-3 text-center text-sm font-semibold text-[#0a2540] transition hover:border-[#635bff] hover:text-[#635bff]">
              vs Fiix <span className="text-[#635bff] group-hover:translate-x-0.5 inline-block transition">→</span>
            </Link>
            <Link href="/compare/myncel-vs-maintainx" className="group rounded-lg border border-[#e6ebf1] bg-white px-4 py-3 text-center text-sm font-semibold text-[#0a2540] transition hover:border-[#635bff] hover:text-[#635bff]">
              vs MaintainX <span className="text-[#635bff] group-hover:translate-x-0.5 inline-block transition">→</span>
            </Link>
          </div>
          <div className="mt-6 text-center">
            <Link href="/compare" className="text-sm font-semibold text-[#635bff] hover:text-[#4f46e5]">
              See all CMMS comparisons →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#635bff]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start your free trial today</h2>
          <p className="text-purple-200 mb-8 text-lg">30 days free. No credit card. Setup in 15 minutes.</p>
          <Link href="/signup" className="bg-white text-[#635bff] font-bold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors text-base">
            Get started free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
