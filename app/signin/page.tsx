'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AuthRouteClass from '../components/AuthRouteClass';
import { useIsCapacitorWebview } from '@/lib/use-capacitor-webview';

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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const message = searchParams.get('message');
  // In the Capacitor mobile app there is nowhere meaningful to link
  // to from the auth header — the public landing page is hidden in
  // the mobile UX. So we render the brand mark as a plain (unlinked)
  // element on mobile, and as a link on the public website.
  const isMobileApp = useIsCapacitorWebview();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('myncel_remembered_email');
    if (rememberedEmail) {
      setForm(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }

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
        try {
          captchaToken = await window.grecaptcha.execute(siteKey, { action: 'signin' });
        } catch (_e) {
          captchaToken = '';
        }
      }

      const normalizedEmail = form.email.toLowerCase().trim();

      const result = await signIn('credentials', {
        email: normalizedEmail,
        password: form.password,
        captchaToken,
        rememberMe: rememberMe ? 'true' : 'false',
        redirect: false,
      });

      if (result?.error) {
        // NextAuth wraps authorize errors as CredentialsSignin.
        // Hit the side-channel endpoint to detect actionable states
        // (email-verification needed, account scheduled for
        // deletion). The endpoint only confirms states for which the
        // user has already supplied an email + password, so it does
        // not meaningfully widen the existing enumeration surface.
        const verifyCheck = await fetch('/api/auth/check-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        }).catch(() => null);
        if (verifyCheck?.ok) {
          const vData = await verifyCheck.json();
          if (vData.deletionPending) {
            const days = vData.daysRemaining ?? 14;
            setError(
              `This account is scheduled for permanent deletion in ${days} day${days === 1 ? '' : 's'}. Contact support@myncel.com from this email address to recover it.`
            );
            setLoading(false);
            return;
          }
          if (vData.needsVerification) {
            router.push('/verify-email?email=' + encodeURIComponent(form.email));
            return;
          }
        }
        setError('Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        if (rememberMe) {
          localStorage.setItem('myncel_remembered_email', normalizedEmail);
        } else {
          localStorage.removeItem('myncel_remembered_email');
        }

        // Redirect admin users to admin dashboard
        const isAdmin = normalizedEmail === 'admin@myncel.com';
        router.push(isAdmin ? '/admin' : callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-mobile-shell min-h-[100dvh] bg-[#f6f9fc] flex flex-col">
      <AuthRouteClass />
      {/* Nav */}
      <nav className="auth-mobile-nav bg-white border-b border-[#e6ebf1] px-4 pb-3 sm:px-6 sm:pb-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {isMobileApp ? (
            // In the mobile app there's no public landing page, so the
            // brand mark is a non-interactive element rather than a link.
            <div className="flex items-center gap-2 font-bold text-lg text-[#0a2540]">
              <img src="/logo.png" alt="Myncel" className="w-8 h-8" />
              Myncel
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#0a2540]">
              <img src="/logo.png" alt="Myncel" className="w-8 h-8" />
              Myncel
            </Link>
          )}
          <p className="text-xs sm:text-sm text-[#425466]">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#635bff] font-medium hover:underline">Sign up free →</Link>
          </p>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 sm:items-center sm:py-16">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a2540] mb-2">Welcome back</h1>
            <p className="text-[#425466] text-sm">Sign in to your Myncel dashboard</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#e6ebf1] shadow-sm p-5 sm:p-8">

            {message && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5 text-sm text-green-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {message === 'password-reset' && 'Password updated successfully. Please sign in.'}
                {message === 'registered' && 'Account created! Please check your email to verify your account before signing in.'}
                {message === 'verified' && '✅ Email verified successfully! You can now sign in.'}
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
                  className="w-full min-h-11 px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-base sm:text-sm text-[#0a2540] placeholder-[#c0ccda] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all"
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                    className="w-full min-h-11 px-3 py-2.5 pr-14 border border-[#e6ebf1] rounded-lg text-base sm:text-sm text-[#0a2540] placeholder-[#c0ccda] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-1 flex min-h-11 w-11 items-center justify-center text-[#8898aa] hover:text-[#635bff] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
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
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#425466] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#c9d7e3] text-[#635bff] accent-[#635bff] focus:ring-[#635bff]"
                />
                <span>Remember me on this device</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-11 bg-[#635bff] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
              className="w-full min-h-11 border border-[#e6ebf1] text-[#425466] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f6f9fc] hover:border-[#c9d7e3] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create a free account
            </Link>

            {/* SSO sign-in entry — for orgs that have configured SAML.
                Sends the user to a thin /signin/sso page where they
                enter their workspace slug and get redirected to the
                IdP. */}
            <Link
              href="/signin/sso"
              className="mt-3 w-full min-h-11 border border-[#e6ebf1] text-[#425466] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f6f9fc] hover:border-[#c9d7e3] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.66 0 3-1.34 3-3S13.66 5 12 5 9 6.34 9 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm5-7l4 4-4 4" />
              </svg>
              Sign in with SSO (SAML)
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
      <div className="auth-mobile-shell min-h-[100dvh] bg-[#f6f9fc] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#635bff] border-t-transparent rounded-full" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}