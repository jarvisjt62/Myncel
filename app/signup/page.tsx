'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', companyName: '', industry: '', companySize: '' });

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;
    if (window.grecaptcha) return;
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get reCAPTCHA token
      let captchaToken = '';
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha) {
        captchaToken = await window.grecaptcha.execute(siteKey, { action: 'signup' });
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captchaToken }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return; }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (signInResult?.ok) { router.push('/dashboard'); }
      else { router.push('/signin?registered=true'); }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-[#e6ebf1] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#0a2540]">
            <img src="/logo.png" alt="Myncel" className="w-8 h-8" />
            Myncel
          </Link>
          <p className="text-sm text-[#425466]">
            Already have an account?{' '}
            <Link href="/signin" className="text-[#635bff] font-medium hover:underline">Sign in →</Link>
          </p>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s <= step ? 'bg-[#635bff] text-white' : 'bg-[#e6ebf1] text-[#425466]'}`}>{s}</div>
                <span className={`text-xs font-medium ${s <= step ? 'text-[#635bff]' : 'text-[#425466]'}`}>{s === 1 ? 'Your account' : 'Your company'}</span>
                {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-[#635bff]' : 'bg-[#e6ebf1]'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#e6ebf1] p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-[#0a2540]">{step === 1 ? 'Create your account' : 'About your company'}</h1>
              <p className="text-[#425466] text-sm mt-1">{step === 1 ? 'Free for 90 days · No credit card required' : 'We\'ll personalize Myncel for your shop'}</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Full name</label>
                  <input type="text" required value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Smith" className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Work email</label>
                  <input type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@yourshop.com" className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Password</label>
                  <input type="password" required minLength={8} value={form.password} onChange={e => update('password', e.target.value)} placeholder="At least 8 characters" className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Confirm password</label>
                  <input type="password" required value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Repeat your password" className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                </div>
                <button type="submit" className="w-full bg-[#635bff] text-white font-semibold py-3 rounded-lg hover:bg-[#4f46e5] transition-colors mt-2">Continue →</button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Company name</label>
                  <input type="text" required value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Precision Parts Co." className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Industry</label>
                  <select value={form.industry} onChange={e => update('industry', e.target.value)} className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all bg-white">
                    <option value="">Select your industry</option>
                    <option value="METAL_FABRICATION">Metal Fabrication</option>
                    <option value="PLASTICS">Plastics & Injection Molding</option>
                    <option value="FOOD_BEVERAGE">Food & Beverage</option>
                    <option value="AUTO_PARTS">Auto Parts Manufacturing</option>
                    <option value="ELECTRONICS">Electronics Assembly</option>
                    <option value="WOODWORKING">Woodworking & Furniture</option>
                    <option value="OTHER">Other Manufacturing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Number of machines</label>
                  <select value={form.companySize} onChange={e => update('companySize', e.target.value)} className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all bg-white">
                    <option value="">Select range</option>
                    <option value="SMALL">1–3 machines</option>
                    <option value="GROWING">4–20 machines</option>
                    <option value="MIDSIZE">21–100 machines</option>
                    <option value="LARGE">100+ machines</option>
                  </select>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-[#e6ebf1] text-[#425466] font-semibold py-3 rounded-lg hover:bg-[#f6f9fc] transition-colors">← Back</button>
                  <button type="submit" disabled={loading} className="flex-1 bg-[#635bff] text-white font-semibold py-3 rounded-lg hover:bg-[#4f46e5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Creating...
                      </>
                    ) : 'Start free trial →'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-[#8898aa] mt-6">
            Protected by enterprise-grade encryption.{' '}
            <Link href="/privacy" className="hover:text-[#425466] transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}