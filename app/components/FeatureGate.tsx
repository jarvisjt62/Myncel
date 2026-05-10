import { db } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/admin-settings';
import Link from 'next/link';

async function getSetting(key: string): Promise<any> {
  try {
    const rec = await db.adminSetting.findUnique({ where: { key } });
    if (rec) return JSON.parse(rec.value);
  } catch {}
  return DEFAULT_SETTINGS[key]?.value;
}

export default async function FeatureGate({
  featureKey,
  featureName,
  children,
}: {
  featureKey: string;
  featureName: string;
  children: React.ReactNode;
}) {
  const enabled = await getSetting(featureKey);
  if (enabled === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#e6ebf1] p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#0a2540] mb-2">{featureName} is Disabled</h1>
          <p className="text-[#425466] text-sm mb-6">
            This feature has been disabled by your platform administrator. Please contact them if you believe this is an error.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-[#635bff] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5048e5] transition-all"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}