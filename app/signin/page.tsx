'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function SignInForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const message = searchParams.get('message');

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

    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      // Get reCAPTCHA token
      let captchaToken = '';
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha) {
        captchaToken = await window.grecaptcha.execute(siteKey, { action: 'signin' });
      }

      const result = await signIn('credentials', {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        captchaToken,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Redirect admin users to admin dashboard
        const isAdmin = form.email.toLowerCase().trim() === 'admin@myncel.com';
        router.push(isAdmin ? '/admin' : callbackUrl);
        router.refresh();
      }
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
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#635bff] font-medium hover:underline">Sign up free →</Link>
          </p>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0a2540] mb-2">Welcome back</h1>
            <p className="text-[#425466] text-sm">Sign in to your Myncel dashboard</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#e6ebf1] shadow-sm p-8">

            {message && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5 text-sm text-green-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {message === 'password-reset' && 'Password updated successfully. Please sign in.'}
                {message === 'registered' && 'Account created! Please sign in.'}
              </div>
            )}

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
                <label className="block text-xs font-semibold text-[#0a2540] mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@yourcompany.com"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#0a2540] placeholder-[#c0ccda] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#0a2540] uppercase tracking-wide">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[#635bff] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#0a2540] placeholder-[#c0ccda] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#635bff] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign in →'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e6ebf1]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#8898aa]">New to Myncel?</span>
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full border border-[#e6ebf1] text-[#425466] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f6f9fc] hover:border-[#c9d7e3] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create a free account
            </Link>
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

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#635bff] border-t-transparent rounded-full" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}