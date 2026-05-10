'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-[#635bff]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 000-5.656M6.343 6.343a9 9 0 000 12.728m3.535-3.536a4 4 0 010-5.656M12 12h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0a2540] mb-3">You're offline</h1>
        <p className="text-[#425466] mb-6 leading-relaxed">
          It looks like you don't have an internet connection right now. Some features of Myncel require connectivity to load.
        </p>
        <p className="text-sm text-[#8898aa] mb-8">
          Any work orders or data you've recently viewed may still be available from cache.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#635bff] text-white font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}