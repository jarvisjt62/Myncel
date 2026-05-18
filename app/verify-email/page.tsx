'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthRouteClass from '../components/AuthRouteClass';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);

  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const emailParam = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;

    if ((window as any).grecaptcha) {
      setCaptchaLoaded(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src*="recaptcha/api.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setCaptchaLoaded(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setCaptchaLoaded(true);
    document.head.appendChild(script);
  }, []);

  const executeCaptcha = async () => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const grecaptcha = (window as any).grecaptcha;
    if (!siteKey || !captchaLoaded || !grecaptcha) return '';
    return grecaptcha.execute(siteKey, { action: 'verify_email_resend' });
  };

  // Auto-verify when token is present in URL
  useEffect(() => {
    if (token && !success && !error) {
      setVerifying(true);
      fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
        headers: { 'Accept': 'application/json' },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            router.replace('/verify-email?success=true');
          } else {
            router.replace(`/verify-email?error=${data.error || 'unknown'}`);
          }
        })
        .catch(() => {
          router.replace('/verify-email?error=unknown');
        });
    }
  }, [token, success, error, router]);

  // Pre-fill email if redirected from signin
  useEffect(() => {
    if (emailParam && !resendEmail) {
      setResendEmail(emailParam);
    }
  }, [emailParam]);

  // If success, redirect to signin after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/signin?verified=true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendMessage('');
    try {
      const captchaToken = await executeCaptcha();

      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim(), captchaToken }),
      });
      const data = await res.json();
      setResendMessage(data.message || 'If an account exists, a new verification link has been sent.');
    } catch {
      setResendMessage('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Show spinner while auto-verifying token
  if (verifying && token && !success && !error) {
    return (
      <div className="auth-mobile-shell min-h-[100dvh] bg-[#f6f9fc] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e6ebf1] p-10 text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 rounded-full bg-[#635bff]/10 flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin w-8 h-8 border-4 border-[#635bff] border-t-transparent rounded-full"></div>
          </div>
          <h1 className="text-xl font-bold text-[#0a2540] mb-2">Verifying your email...</h1>
          <p className="text-[#425466] text-sm">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-mobile-shell min-h-[100dvh] bg-[#f6f9fc] flex flex-col"><AuthRouteClass />
      {/* Nav */}
      <nav className="auth-mobile-nav bg-white border-b border-[#e6ebf1] px-6 pb-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#0a2540]">
            <img src="/logo.png" alt="Myncel" className="w-8 h-8" />
            Myncel
          </Link>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e6ebf1] p-8 text-center">
            {success ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Email Verified!</h1>
                <p className="text-[#425466] text-sm mb-6">
                  Your email has been successfully verified. You can now sign in to your account.
                </p>
                <Link
                  href="/signin?verified=true"
                  className="inline-block bg-[#635bff] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5048e5] transition-all"
                >
                  Sign In →
                </Link>
                <p className="text-xs text-[#8898aa] mt-4">You'll be redirected automatically in a few seconds...</p>
              </>
            ) : error === 'expired' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Link Expired</h1>
                <p className="text-[#425466] text-sm mb-6">
                  The verification link has expired. Please request a new one below.
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="w-full bg-[#635bff] text-white font-semibold py-2.5 rounded-lg hover:bg-[#4f46e5] transition-colors disabled:opacity-60"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </form>
                {resendMessage && (
                  <p className="text-sm text-[#425466] mt-4 bg-[#f6f9fc] rounded-lg px-4 py-3">{resendMessage}</p>
                )}
              </>
            ) : error === 'invalid-token' || error === 'missing-token' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Invalid Link</h1>
                <p className="text-[#425466] text-sm mb-6">
                  This verification link is invalid or has already been used. Please request a new one.
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="w-full bg-[#635bff] text-white font-semibold py-2.5 rounded-lg hover:bg-[#4f46e5] transition-colors disabled:opacity-60"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </form>
                {resendMessage && (
                  <p className="text-sm text-[#425466] mt-4 bg-[#f6f9fc] rounded-lg px-4 py-3">{resendMessage}</p>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-[#635bff]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📧</span>
                </div>
                <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Verify Your Email</h1>
                <p className="text-[#425466] text-sm mb-6">
                  We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <p className="text-xs text-[#8898aa]">Didn't receive the email? Enter your address below:</p>
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full border border-[#e6ebf1] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="w-full bg-[#635bff] text-white font-semibold py-2.5 rounded-lg hover:bg-[#4f46e5] transition-colors disabled:opacity-60"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </form>
                {resendMessage && (
                  <p className="text-sm text-[#425466] mt-4 bg-[#f6f9fc] rounded-lg px-4 py-3">{resendMessage}</p>
                )}
              </>
            )}
          </div>

          <p className="text-center text-xs text-[#8898aa] mt-6">
            <Link href="/signin" className="hover:text-[#425466] transition-colors">← Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="auth-mobile-shell min-h-[100dvh] bg-[#f6f9fc] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#635bff] border-t-transparent rounded-full"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}