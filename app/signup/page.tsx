'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthRouteClass from '../components/AuthRouteClass';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', companyName: '', industry: '', companySize: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<{ allowed: boolean; reason?: string; trialDays?: number; checking: boolean }>({ allowed: true, checking: true });
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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

  // Check admin platform settings (signups enabled, maintenance mode, invite-only)
  useEffect(() => {
    fetch('/api/admin/settings/public')
      .then(r => r.json())
      .then(data => {
        const s = data?.settings || {};
        if (s['platform.maintenanceMode'] === true) {
          setPlatformStatus({ allowed: false, reason: 'maintenance', checking: false });
          return;
        }
        if (s['platform.newSignups.enabled'] === false) {
          setPlatformStatus({ allowed: false, reason: 'disabled', checking: false });
          return;
        }
        if (s['security.inviteOnly.enabled'] === true) {
          setPlatformStatus({ allowed: false, reason: 'invite-only', checking: false });
          return;
        }
        const trialDays = typeof s['platform.trialDays'] === 'number' ? s['platform.trialDays'] : 14;
        setPlatformStatus({ allowed: true, trialDays, checking: false });
      })
      .catch(() => setPlatformStatus({ allowed: true, checking: false }));
  }, []);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const passwordRequirements = [
    { label: 'At least 8 characters', met: form.password.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(form.password) },
    { label: 'At least one number', met: /[0-9]/.test(form.password) },
    { label: 'At least one special character', met: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const passwordMeetsRequirements = passwordRequirements.every(req => req.met);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (!passwordMeetsRequirements) { setError('Password must include at least 8 characters, one uppercase letter, one number, and one special character.'); return; }
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

      // Show verification screen instead of auto-sign-in
      setRegisteredEmail(form.email);
      setRegistrationComplete(true);
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-mobile-shell min-h-[100dvh] bg-[#f6f9fc] flex flex-col"><AuthRouteClass />
      {/* Nav */}
      <nav className="auth-mobile-nav bg-white border-b border-[#e6ebf1] px-4 pb-3 sm:px-6 sm:pb-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#0a2540]">
            <img src="/logo.png" alt="Myncel" className="w-8 h-8" />
            Myncel
          </Link>
          <p className="text-xs sm:text-sm text-[#425466]">
            Already have an account?{' '}
            <Link href="/signin" className="text-[#635bff] font-medium hover:underline">Sign in →</Link>
          </p>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:items-center sm:py-16">
        <div className="w-full max-w-md">
          {/* Platform status block - shown when signups are disabled, invite-only, or maintenance */}
          {!platformStatus.checking && !platformStatus.allowed ? (
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6ebf1] p-5 text-center sm:p-8">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              </div>
              <h1 className="text-xl font-bold text-[#0a2540] mb-2">
                {platformStatus.reason === 'maintenance' && 'Platform Under Maintenance'}
                {platformStatus.reason === 'disabled' && 'New Sign-ups Paused'}
                {platformStatus.reason === 'invite-only' && 'Invite-Only Access'}
              </h1>
              <p className="text-[#425466] text-sm mb-6">
                {platformStatus.reason === 'maintenance' && "We're performing scheduled maintenance. Please check back shortly."}
                {platformStatus.reason === 'disabled' && 'Registration is temporarily disabled. Please contact your administrator or try again later.'}
                {platformStatus.reason === 'invite-only' && 'This platform is currently invite-only. Please contact your administrator for an invitation.'}
              </p>
              <Link href="/" className="inline-flex min-h-11 items-center justify-center bg-[#635bff] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5048e5] transition-all">Return home</Link>
            </div>
          ) : (
          <>
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6 overflow-hidden">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s <= step ? 'bg-[#635bff] text-white' : 'bg-[#e6ebf1] text-[#425466]'}`}>{s}</div>
                <span className={`min-w-0 truncate text-[11px] font-medium sm:text-xs ${s <= step ? 'text-[#635bff]' : 'text-[#425466]'}`}>{s === 1 ? 'Your account' : 'Your company'}</span>
                {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-[#635bff]' : 'bg-[#e6ebf1]'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#e6ebf1] p-5 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0a2540]">{step === 1 ? 'Create your account' : 'About your company'}</h1>
              <p className="text-[#425466] text-sm mt-1">{step === 1 ? `Free for ${platformStatus.trialDays ?? 14} days · No credit card required` : 'We\'ll personalize Myncel for your shop'}</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">{error}</div>}

            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Full name</label>
                  <input type="text" required value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Smith" className="w-full min-h-11 border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Work email</label>
                  <input type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@yourshop.com" className="w-full min-h-11 border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required minLength={8} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Create a strong password" autoComplete="new-password" className="w-full min-h-11 border border-[#e6ebf1] rounded-lg px-4 py-2.5 pr-14 text-base sm:text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                    <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute inset-y-0 right-1 flex min-h-11 w-11 items-center justify-center text-[#8898aa] hover:text-[#635bff] transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.88 4.24A10.64 10.64 0 0112 4c5 0 9 4.5 10 8a12.44 12.44 0 01-3.11 4.96M6.61 6.61C4.33 8.14 2.77 10.32 2 12c1 3.5 5 8 10 8 1.54 0 2.97-.43 4.22-1.12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2 12s3.75-7 10-7 10 7 10 7-3.75 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="bg-[#f6f9fc] rounded-lg p-3 mt-2 space-y-1.5">
                    <p className="text-xs font-semibold text-[#425466] mb-2">Password requirements:</p>
                    {passwordRequirements.map(({ label, met }) => (
                      <div key={label} className="flex items-center gap-2">
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${met ? 'text-green-500' : 'text-[#c0ccda]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-xs ${met ? 'text-[#0a2540]' : 'text-[#8898aa]'}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Confirm password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} required value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Repeat your password" autoComplete="new-password" className="w-full min-h-11 border border-[#e6ebf1] rounded-lg px-4 py-2.5 pr-14 text-base sm:text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                    <button type="button" onClick={() => setShowConfirmPassword(prev => !prev)} className="absolute inset-y-0 right-1 flex min-h-11 w-11 items-center justify-center text-[#8898aa] hover:text-[#635bff] transition-colors" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.88 4.24A10.64 10.64 0 0112 4c5 0 9 4.5 10 8a12.44 12.44 0 01-3.11 4.96M6.61 6.61C4.33 8.14 2.77 10.32 2 12c1 3.5 5 8 10 8 1.54 0 2.97-.43 4.22-1.12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2 12s3.75-7 10-7 10 7 10 7-3.75 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
                        </svg>
                      )}
                    </button>
                  </div>
                  {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {form.confirmPassword.length > 0 && form.password === form.confirmPassword && (
                    <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                  )}
                </div>
                <button type="submit" disabled={!passwordMeetsRequirements || form.password !== form.confirmPassword} className="w-full min-h-11 bg-[#635bff] text-white font-semibold py-3 rounded-lg hover:bg-[#4f46e5] transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed">Continue →</button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Company name</label>
                  <input type="text" required value={form.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Precision Parts Co." className="w-full min-h-11 border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide mb-1.5">Industry</label>
                  <select value={form.industry} onChange={e => update('industry', e.target.value)} className="w-full min-h-11 border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all bg-white">
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
                  <select value={form.companySize} onChange={e => update('companySize', e.target.value)} className="w-full min-h-11 border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all bg-white">
                    <option value="">Select range</option>
                    <option value="SMALL">1–3 machines</option>
                    <option value="GROWING">4–20 machines</option>
                    <option value="MIDSIZE">21–100 machines</option>
                    <option value="LARGE">100+ machines</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3 mt-2 sm:flex-row">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 min-h-11 border border-[#e6ebf1] text-[#425466] font-semibold py-3 rounded-lg hover:bg-[#f6f9fc] transition-colors">← Back</button>
                  <button type="submit" disabled={loading} className="flex-1 min-h-11 bg-[#635bff] text-white font-semibold py-3 rounded-lg hover:bg-[#4f46e5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
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

            {/* Registration Complete — Check Email */}
            {registrationComplete && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#0a2540] mb-2">Check Your Email</h2>
                <p className="text-[#425466] text-sm mb-4">
                  We've sent a verification link to <strong className="text-[#0a2540]">{registeredEmail}</strong>. 
                  Please click the link to verify your account before signing in.
                </p>
                <p className="text-xs text-[#8898aa] mb-6">The link expires in 24 hours.</p>
                <Link
                  href="/signin"
                  className="inline-flex min-h-11 items-center justify-center bg-[#635bff] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5048e5] transition-all"
                >
                  Go to Sign In →
                </Link>
                <div className="mt-4 pt-4 border-t border-[#e6ebf1]">
                  <p className="text-xs text-[#8898aa]">
                    Didn't receive the email?{' '}
                    <Link href="/verify-email" className="text-[#635bff] font-medium hover:underline">
                      Resend verification link
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-[#8898aa] mt-6">
            Protected by enterprise-grade encryption.{' '}
            <Link href="/privacy" className="hover:text-[#425466] transition-colors">Privacy Policy</Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}