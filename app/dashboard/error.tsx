'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0a2540] mb-3">Something went wrong</h1>
        <p className="text-[#425466] mb-6">
          We encountered an error loading the dashboard. This might be due to a database connection issue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#635bff] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#4f46e5] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/signin"
            className="border border-[#e6ebf1] text-[#425466] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-white transition-colors"
          >
            Sign in again
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-[#8898aa] mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}