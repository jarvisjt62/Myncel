import { Suspense } from 'react';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading reports…</div>}>
      <ReportsClient />
    </Suspense>
  );
}
