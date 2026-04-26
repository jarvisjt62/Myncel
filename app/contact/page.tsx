'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', size: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaLoaded, setCaptchaLoaded] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;
    
    if (window.grecaptcha) {
      setCaptchaLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setCaptchaLoaded(true);
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get reCAPTCHA token
      let captchaToken = '';
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha) {
        captchaToken = await window.grecaptcha.execute(siteKey, { action: 'contact' });
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactOptions = [
    { icon: '🎯', title: 'Book a Demo', desc: 'See Myncel in action with a live 30-minute walkthrough tailored to your industry.', action: 'Schedule now →', color: 'bg-violet-50 border-violet-200', textColor: 'text-violet-700', href: '/demo' },
    { icon: '💬', title: 'Sales Questions', desc: 'Talk to our sales team about pricing, plans, or custom enterprise requirements.', action: 'Email sales →', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700', href: 'mailto:sales@myncel.com' },
    { icon: '🛠️', title: 'Technical Support', desc: 'Already a customer? Our support team is available Mon–Fri, 8am–6pm CT.', action: 'Open support ticket →', color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700', href: '/support' },
    { icon: '📚', title: 'Help Center', desc: 'Browse guides, tutorials, and FAQs to find answers on your own time.', action: 'Visit help center →', color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700', href: '/help' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-[#f6f9fc] border-b border-[#e6ebf1] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-[#0a2540] mb-3">Talk to our team</h1>
            <p className="text-lg text-[#425466]">Get a personalized demo, ask about pricing, or tell us about your specific maintenance challenges. We respond within one business day.</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Left: contact options */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#0a2540]">How can we help?</h2>
              {contactOptions.map((item, i) => (
                <Link key={i} href={item.href} className={`block border rounded-xl p-5 ${item.color} hover:shadow-md transition-shadow`}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-bold text-[#0a2540] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#425466] mb-3">{item.desc}</p>
                  <span className={`font-semibold text-sm ${item.textColor}`}>{item.action}</span>
                </Link>
              ))}
            </div>

            {/* Right: Form */}
            <div className="md:col-span-2">
              {sent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#0a2540] mb-2">Message sent!</h3>
                  <p className="text-[#425466] mb-6">Thanks for reaching out. We'll get back to you within one business day.</p>
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', size: '', message: '' }); }} className="text-[#635bff] font-semibold hover:underline">Send another message →</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-[#e6ebf1] rounded-2xl p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-[#0a2540] mb-6">Send us a message</h2>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Name *</label>
                      <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Email *</label>
                      <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Company</label>
                      <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Your company name" className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Company size</label>
                      <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 bg-white">
                        <option value="">Select size</option>
                        <option value="1-10">1–10 employees</option>
                        <option value="11-50">11–50 employees</option>
                        <option value="51-200">51–200 employees</option>
                        <option value="200+">200+ employees</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Message *</label>
                    <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your maintenance challenges..." className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 resize-none" />
                  </div>

                  {/* reCAPTCHA badge */}
                  {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                    <p className="text-xs text-[#8898aa] mb-4">This form is protected by reCAPTCHA.</p>
                  )}

                  <button type="submit" disabled={loading} className="w-full bg-[#635bff] text-white py-3.5 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Sending...
                      </>
                    ) : 'Send message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}