'use client';

import dynamic from 'next/dynamic';

const ScanContent = dynamic(() => import('./ScanContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
      <div className="text-[var(--text-secondary)]">Loading scanner...</div>
    </div>
  ),
});

export default function BarcodeScanPage() {
  return <ScanContent />;
}
