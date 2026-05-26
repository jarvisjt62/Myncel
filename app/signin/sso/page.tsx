'use client';

/**
 * /signin/sso — workspace-slug entry page for SAML SSO.
 *
 * The user types their workspace slug (e.g. "acme-manufacturing") and
 * we redirect to /api/auth/saml/<slug>/login which kicks off the SAML
 * AuthnRequest. If the slug doesn't exist or doesn't have SSO enabled,
 * the API returns 404 and we surface a friendly error.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SsoSignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialError = params.get('error');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === 'sso_not_configured'
      ? 'That workspace does not have SSO configured. Try password sign-in instead.'
      : null
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!trimmed) {
      setError('Enter your workspace slug.');
      return;
    }
    setLoading(true);
    // We can't call the API as JSON because the IdP redirect needs a
    // top-level navigation — just push the browser there.
    window.location.href = `/api/auth/saml/${trimmed}/login`;
  };

  return (
    <div className="min-h-[100dvh] bg-[#f6f9fc] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-[#e6ebf1] p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[#0a2540]">Sign in with SSO</h1>
          <p className="mt-1 text-sm text-[#425466]">
            Enter your workspace slug. We&rsquo;ll redirect you to your identity provider.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#0a2540]">
                Workspace slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-manufacturing"
                autoFocus
                className="w-full min-h-11 px-3 py-2.5 border border-[#e6ebf1] rounded-lg text-base sm:text-sm text-[#0a2540] placeholder-[#c0ccda] focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
              />
              <p className="mt-1 text-xs text-[#8898aa]">
                If you don&rsquo;t know your slug, ask your Myncel administrator.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 bg-[#635bff] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors disabled:opacity-60"
            >
              {loading ? 'Redirecting…' : 'Continue to IdP →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-sm text-[#635bff] hover:text-[#4f46e5]"
            >
              ← Back to password sign-in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SsoSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-[#f6f9fc] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#635bff] border-t-transparent rounded-full" />
        </div>
      }
    >
      <SsoSignInForm />
    </Suspense>
  );
}
