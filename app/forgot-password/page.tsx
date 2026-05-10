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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) { setError('Please enter your email address.'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Please enter a valid email address.'); return; }

    setLoading(true);

    try {
      // Get reCAPTCHA token
      let captchaToken = '';
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha) {
        captchaToken = await window.grecaptcha.execute(siteKey, { action: 'forgot_password' });
      }

      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), captchaToken }),
      });

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
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
          <Link href="/signin" className="text-sm text-[#635bff] font-medium hover:underline">← Back to sign in</Link>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">

          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-[#635bff]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-[#0a2540] mb-2">Forgot your password?</h1>
                <p className="text-[#425466] text-sm">No worries. Enter your email and we'll send you a reset link.</p>
              </div>

              {/* Card */}
              <div className="bg-white rounded-2xl border border-[#e6ebf1] shadow-sm p-8">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1.5 uppercase tracking-wide">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourcompany.com"
                      autoComplete="email"
                      autoFocus
                      required
                      className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#0a2540] placeholder-[#c0ccda] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#635bff] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending reset link…
                      </>
                    ) : (
                      'Send reset link →'
                    )}
                  </button>
                </form>
              </div>

              <p className="text-center text-xs text-[#8898aa] mt-6">
                Remember your password?{' '}
                <Link href="/signin" className="text-[#635bff] hover:underline">Sign in</Link>
              </p>
            </>
          ) : (
            /* Success state */
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-[#0a2540] mb-2">Check your inbox</h1>
                <p className="text-[#425466] text-sm">We've sent a password reset link to</p>
                <p className="font-semibold text-[#0a2540] text-sm mt-1">{email}</p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e6ebf1] shadow-sm p-8 space-y-4">
                <div className="flex items-start gap-3 text-sm text-[#425466]">
                  <div className="w-5 h-5 rounded-full bg-[#635bff]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#635bff] text-xs font-bold">1</span>
                  </div>
                  <p>Check your email inbox (and spam folder, just in case).</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-[#425466]">
                  <div className="w-5 h-5 rounded-full bg-[#635bff]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#635bff] text-xs font-bold">2</span>
                  </div>
                  <p>Click the reset link in the email — it expires in <strong>1 hour</strong>.</p>
                </div>
                <div className="flex items-start gap-3 text-sm text-[#425466]">
                  <div className="w-5 h-5 rounded-full bg-[#635bff]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#635bff] text-xs font-bold">3</span>
                  </div>
                  <p>Create your new password and sign in.</p>
                </div>

                <div className="pt-2 border-t border-[#e6ebf1]">
                  <p className="text-xs text-[#8898aa] mb-3">Didn't receive the email?</p>
                  <button onClick={() => { setSubmitted(false); setEmail(''); }} className="w-full border border-[#e6ebf1] text-[#425466] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f6f9fc] transition-all">Try a different email address</button>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link href="/signin" className="text-sm text-[#635bff] font-medium hover:underline">← Back to sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}