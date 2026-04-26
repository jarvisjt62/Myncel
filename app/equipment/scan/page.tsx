'use client';

import dynamic from 'next/dynamic';

const ScanContent = dynamic(() => import('./ScanContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f9fc]">
      <div className="text-[#425466]">Loading scanner...</div>
    </div>
  ),
});

export default function BarcodeScanPage() {
  return <ScanContent />;
}
