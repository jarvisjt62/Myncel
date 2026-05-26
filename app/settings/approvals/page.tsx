import { Suspense } from 'react';
import ApprovalPoliciesClient from './ApprovalPoliciesClient';

export const dynamic = 'force-dynamic';

export default function ApprovalPoliciesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading approval policies…</div>}>
      <ApprovalPoliciesClient />
    </Suspense>
  );
}
