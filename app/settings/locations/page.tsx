import { Suspense } from 'react';
import LocationsClient from './LocationsClient';

export const dynamic = 'force-dynamic';

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading locations…</div>}>
      <LocationsClient />
    </Suspense>
  );
}
