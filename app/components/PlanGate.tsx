'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PlanGateProps {
  /** The feature key from FEATURE_MINIMUM_PLAN in lib/plan-limits.ts */
  featureKey: string;
  /** Human-readable feature name for display */
  featureName: string;
  children: React.ReactNode;
  /** Optional: minimum plan required (overrides featureKey lookup) */
  requiredPlan?: string;
}

interface PlanInfo {
  plan: string;
  effectivePlan: string;
  allowed: boolean;
  requiredPlan: string | null;
  upgradeMessage: string;
}

// Plan order for tier comparison.
// Active TRIAL users are mapped to GROWTH by the API (effectivePlan = 'GROWTH').
// TRIAL_RESTRICTED is for expired trials.
const PLAN_ORDER = ['TRIAL_RESTRICTED', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];

export default function PlanGate({ featureKey, featureName, children, requiredPlan }: PlanGateProps) {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing')
      .then(r => r.json())
      .then(data => {
        // effectivePlan: active TRIAL → 'PROFESSIONAL' (full access), expired TRIAL → 'TRIAL_RESTRICTED'
        const effectivePlan = data.effectivePlan || data.plan || 'PROFESSIONAL';
        const planTier = PLAN_ORDER.indexOf(effectivePlan);

        const required = requiredPlan || getRequiredPlanFromKey(featureKey);
        const requiredTier = PLAN_ORDER.indexOf(required || 'GROWTH');

        const allowed = planTier >= requiredTier;
        const requiredName = required
          ? required.charAt(0) + required.slice(1).toLowerCase()
          : '';

        setPlanInfo({
          plan: data.plan || effectivePlan,
          effectivePlan,
          allowed,
          requiredPlan: required,
          upgradeMessage: allowed ? '' : `This feature requires the ${requiredName} plan or higher.`,
        });
        setLoading(false);
      })
      .catch(() => {
        // On error, allow access (fail open)
        setPlanInfo({ plan: 'TRIAL', effectivePlan: 'PROFESSIONAL', allowed: true, requiredPlan: null, upgradeMessage: '' });
        setLoading(false);
      });
  }, [featureKey, requiredPlan]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#635bff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (planInfo?.allowed) {
    return <>{children}</>;
  }

  const requiredName = planInfo?.requiredPlan
    ? planInfo.requiredPlan.charAt(0) + planInfo.requiredPlan.slice(1).toLowerCase()
    : 'higher';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-[#e6ebf1] p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#0a2540] mb-2">{featureName} — {requiredName} Plan Required</h1>
        <p className="text-[#425466] text-sm mb-6">
          {planInfo?.upgradeMessage || `Upgrade to the ${requiredName} plan to unlock ${featureName}.`}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/settings/billing"
            className="inline-block bg-[#635bff] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#5048e5] transition-all"
          >
            Upgrade Plan
          </Link>
          <Link
            href="/dashboard"
            className="inline-block bg-gray-100 text-[#0a2540] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// Map feature keys to minimum required plans (matches lib/plan-limits.ts)
function getRequiredPlanFromKey(key: string): string | null {
  const map: Record<string, string> = {
    // Starter features
    'feature.reporting.advanced': 'STARTER',
    'feature.notifications.sms': 'STARTER',
    'feature.api.access': 'STARTER',
    'feature.qr.labels': 'STARTER',
    'feature.integrations.slack': 'STARTER',
    'feature.integrations.zapier': 'STARTER',
    // Growth features (active TRIAL users get these — effectivePlan = GROWTH)
    'feature.analytics.full': 'GROWTH',
    'feature.iot.sensors': 'GROWTH',
    'feature.notifications.all': 'GROWTH',
    'feature.api.webhooks': 'GROWTH',
    'feature.support.priority_email': 'GROWTH',
    'feature.integrations.all': 'GROWTH',
    'feature.dashboards.custom': 'GROWTH',
    // Professional features
    'feature.analytics.custom_reports': 'PROFESSIONAL',
    'feature.iot.scada': 'PROFESSIONAL',
    'feature.notifications.pagerduty': 'PROFESSIONAL',
    'feature.api.full': 'PROFESSIONAL',
    'feature.support.priority_phone': 'PROFESSIONAL',
    'feature.integrations.custom': 'PROFESSIONAL',
    'feature.whitelabel': 'PROFESSIONAL',
    'feature.sso.saml': 'PROFESSIONAL',
    // Enterprise features
    'feature.sla.custom': 'ENTERPRISE',
    'feature.support.dedicated_manager': 'ENTERPRISE',
    'feature.deployment.on_premise': 'ENTERPRISE',
    'feature.security.audit': 'ENTERPRISE',
    'feature.support.247': 'ENTERPRISE',
    'feature.training.onboarding': 'ENTERPRISE',
  };
  return map[key] || null;
}