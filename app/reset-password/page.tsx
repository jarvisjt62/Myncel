'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Password strength checker
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getStrength(form.password);
  const strengthLabel = ['', 'Very weak', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor = ['', '#f85149', '#f0a500', '#f0a500', '#3fb950', '#3fb950'][strengthScore];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push('/signin?message=password-reset');
      }, 3000);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
        <nav className="bg-white border-b border-[#e6ebf1] px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-[#0a2540] w-fit">
              <div className="w-7 h-7 rounded-lg bg-[#635bff] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              Myncel
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Invalid reset link</h1>
            <p className="text-[#425466] text-sm mb-6">This password reset link is invalid or has expired.</p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 bg-[#635bff] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-[#e6ebf1] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-[#0a2540]">
            <div className="w-7 h-7 rounded-lg bg-[#635bff] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            Myncel
          </Link>
          <Link href="/signin" className="text-sm text-[#635bff] font-medium hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">

          {!success ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-[#635bff]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-[#0a2540] mb-2">Set new password</h1>
                <p className="text-[#425466] text-sm">
                  Choose a strong password for your Myncel account.
                </p>
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
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1.5 uppercase tracking-wide">
                      New password
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      autoFocus
                      required
                      className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#0a2540] placeholder-[#c0ccda] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all"
                    />
                    {/* Password strength bar */}
                    {form.password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor: i <= strengthScore ? strengthColor : '#e6ebf1',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-xs" style={{ color: strengthColor }}>
                          {strengthLabel}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1.5 uppercase tracking-wide">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={form.confirm}
                      onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                      required
                      className="w-full px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-sm text-[#0a2540] placeholder-[#c0ccda] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20 transition-all"
                    />
                    {form.confirm.length > 0 && form.password !== form.confirm && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                    {form.confirm.length > 0 && form.password === form.confirm && (
                      <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                    )}
                  </div>

                  {/* Requirements */}
                  <div className="bg-[#f6f9fc] rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-[#425466] mb-2">Password requirements:</p>
                    {[
                      { label: 'At least 8 characters', met: form.password.length >= 8 },
                      { label: 'At least one uppercase letter', met: /[A-Z]/.test(form.password) },
                      { label: 'At least one number', met: /[0-9]/.test(form.password) },
                    ].map(({ label, met }) => (
                      <div key={label} className="flex items-center gap-2">
                        <svg
                          className={`w-3.5 h-3.5 flex-shrink-0 ${met ? 'text-green-500' : 'text-[#c0ccda]'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-xs ${met ? 'text-[#0a2540]' : 'text-[#8898aa]'}`}>{label}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || form.password !== form.confirm || form.password.length < 8}
                    className="w-full bg-[#635bff] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Updating password…
                      </>
                    ) : (
                      'Update password →'
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-[#0a2540] mb-2">Password updated!</h1>
              <p className="text-[#425466] text-sm mb-6">
                Your password has been changed successfully. Redirecting you to sign in…
              </p>
              <div className="bg-white rounded-2xl border border-[#e6ebf1] shadow-sm p-6">
                <div className="flex items-center justify-center gap-2 text-sm text-[#425466]">
                  <svg className="w-4 h-4 animate-spin text-[#635bff]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirecting to sign in…
                </div>
                <div className="mt-4 pt-4 border-t border-[#e6ebf1]">
                  <Link
                    href="/signin?message=password-reset"
                    className="text-sm text-[#635bff] font-medium hover:underline"
                  >
                    Click here if not redirected →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#635bff] border-t-transparent rounded-full" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}