import { Suspense } from 'react';
import ApprovalsClient from './ApprovalsClient';

export const dynamic = 'force-dynamic';

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading approvals…</div>}>
      <ApprovalsClient />
    </Suspense>
  );
}
