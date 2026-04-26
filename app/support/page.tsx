'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', priority: '', category: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaLoaded, setCaptchaLoaded] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;
    if (window.grecaptcha) { setCaptchaLoaded(true); return; }
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
      let captchaToken = '';
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha) {
        captchaToken = await window.grecaptcha.execute(siteKey, { action: 'support' });
      }

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captchaToken }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit ticket'); setLoading(false); return; }
      setSubmitted(true);
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const categories = ['Dashboard & Navigation', 'Equipment & Machines', 'Work Orders', 'Scheduling & PM', 'Reports & Analytics', 'Notifications & Alerts', 'Mobile App', 'Account & Billing', 'Integration Issues', 'Other'];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f6f9fc] to-white py-16 border-b border-[#e6ebf1]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <nav className="text-sm text-[#8898aa] mb-4">
            <Link href="/" className="hover:text-[#635bff]">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-[#0a2540]">Technical Support</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0a2540] mb-4">Technical Support</h1>
          <p className="text-lg text-[#425466] max-w-2xl mx-auto">Having trouble? Our support team is here to help. Submit a ticket and we'll get back to you within 24 hours.</p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-12 bg-[#f6f9fc]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6 text-center">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Live Chat</h3>
              <p className="text-sm text-[#425466] mb-3">Chat with our support team in real-time</p>
              <p className="text-xs text-[#8898aa]">Mon–Fri, 8am–6pm CT</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6 text-center">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Email Support</h3>
              <p className="text-sm text-[#425466] mb-3">support@myncel.com</p>
              <p className="text-xs text-[#8898aa]">Response within 24 hours</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e6ebf1] p-6 text-center">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="font-bold text-[#0a2540] mb-2">Help Center</h3>
              <p className="text-sm text-[#425466] mb-3">Browse guides and tutorials</p>
              <Link href="/help" className="text-sm text-[#635bff] font-semibold hover:underline">Visit Help Center →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6">
          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0a2540] mb-2">Ticket Submitted!</h3>
              <p className="text-[#425466] mb-6">We've received your support request and will respond within 24 hours.</p>
              <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', priority: '', category: '', message: '' }); }} className="text-[#635bff] font-semibold hover:underline">Submit another ticket →</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-[#e6ebf1] rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0a2540] mb-6">Submit a Support Ticket</h2>
              
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

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

              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 bg-white">
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Subject *</label>
                  <input type="text" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of the issue" className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 bg-white">
                    <option value="">Select priority</option>
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Message *</label>
                <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe your issue in detail..." className="w-full px-4 py-3 border border-[#e6ebf1] rounded-lg text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 resize-none" />
              </div>

              {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                <p className="text-xs text-[#8898aa] mb-4">This form is protected by reCAPTCHA.</p>
              )}

              <button type="submit" disabled={loading} className="w-full bg-[#635bff] text-white py-3.5 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Submitting...
                  </>
                ) : 'Submit Ticket →'}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}