import { Suspense } from 'react';
import AISettingsClient from './AISettingsClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'AI & Predictive Maintenance — Settings',
  description: 'Configure anomaly detection, predictive forecasts, model selection, and alert sensitivity for your organization.',
};

export default function AISettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--text-secondary)]">Loading AI settings…</div>}>
      <AISettingsClient />
    </Suspense>
  );
}
