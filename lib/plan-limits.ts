import { db } from '@/lib/db';

// ===== Plan Tier Order =====
// TRIAL_RESTRICTED is the lowest tier — used when a trial expires without upgrading.
// Active TRIAL users are mapped to PROFESSIONAL via getEffectivePlan(), giving them
// FULL access to all features during the trial period. TRIAL does NOT appear in this
// array — it is always resolved to PROFESSIONAL (active) or TRIAL_RESTRICTED (expired).
export const PLAN_ORDER = ['TRIAL_RESTRICTED', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'] as const;
export type PlanId = (typeof PLAN_ORDER)[number];

// Internal plan IDs including TRIAL (used in DB / session)
export type RawPlanId = PlanId | 'TRIAL';

export function getPlanTier(plan: string): number {
  const idx = PLAN_ORDER.indexOf(plan as PlanId);
  return idx === -1 ? 0 : idx;
}

export function isPlanAtLeast(plan: string, requiredPlan: PlanId): boolean {
  return getPlanTier(plan) >= getPlanTier(requiredPlan);
}

// ===== Trial Expiry Detection =====
// Active TRIAL → mapped to PROFESSIONAL (full access to everything except Enterprise).
// This means trial users experience the full product before choosing a plan.
// Expired TRIAL → mapped to TRIAL_RESTRICTED (very limited access).
export function getEffectivePlan(plan: string, trialEndsAt: Date | null): string {
  if (plan !== 'TRIAL') return plan;
  if (!trialEndsAt) return 'PROFESSIONAL'; // No expiry set = still active = full access
  if (new Date(trialEndsAt) < new Date()) {
    return 'TRIAL_RESTRICTED'; // Trial has expired
  }
  return 'PROFESSIONAL'; // Trial still active = full access
}

// ===== Resource Limits per Plan =====
export interface PlanLimits {
  machines: number | null;       // null = unlimited
  users: number | null;
  workOrders: number | null;     // per month
  storage: string;               // display string like "5GB"
}

export const PLAN_RESOURCE_LIMITS: Record<PlanId, PlanLimits> = {
  TRIAL_RESTRICTED: {
    // Expired trial = very limited access (incentive to upgrade)
    machines: 5,
    users: 2,
    workOrders: 10,
    storage: '100MB',
  },
  STARTER: {
    machines: 25,
    users: 10,
    workOrders: 500,
    storage: '5GB',
  },
  GROWTH: {
    machines: 100,
    users: 25,
    workOrders: 2000,
    storage: '20GB',
  },
  PROFESSIONAL: {
    machines: 500,
    users: 100,
    workOrders: 10000,
    storage: '100GB',
  },
  ENTERPRISE: {
    machines: null, // unlimited
    users: null,
    workOrders: null,
    storage: 'Unlimited',
  },
};

// ===== Feature Flags per Plan =====
// Each feature lists the minimum plan required.
// Active TRIAL users resolve to PROFESSIONAL, so they get ALL features up to Professional.
// TRIAL_RESTRICTED is below STARTER, so expired trials get almost nothing.
export const FEATURE_MINIMUM_PLAN: Record<string, PlanId> = {
  // Starter features
  'feature.reporting.advanced': 'STARTER',
  'feature.notifications.sms': 'STARTER',
  'feature.api.access': 'STARTER',
  'feature.qr.labels': 'STARTER',
  'feature.integrations.slack': 'STARTER',
  'feature.integrations.zapier': 'STARTER',

  // Growth features (active TRIAL users get these since TRIAL → PROFESSIONAL ≥ GROWTH)
  'feature.analytics.full': 'GROWTH',
  'feature.iot.sensors': 'GROWTH',
  'feature.notifications.all': 'GROWTH',
  'feature.api.webhooks': 'GROWTH',
  'feature.support.priority_email': 'GROWTH',
  'feature.integrations.all': 'GROWTH',
  'feature.dashboards.custom': 'GROWTH',

  // Professional features (NOT available during trial — premium differentiators)
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

// ===== Helper: Check if a feature is available for a plan =====
export function hasFeature(plan: string, featureKey: string): boolean {
  const minPlan = FEATURE_MINIMUM_PLAN[featureKey];
  if (!minPlan) return true; // Unknown feature = allow by default
  return isPlanAtLeast(plan, minPlan);
}

// ===== Helper: Get the minimum plan required for a feature =====
export function getRequiredPlan(featureKey: string): PlanId | null {
  return FEATURE_MINIMUM_PLAN[featureKey] || null;
}

// ===== Helper: Get upgrade message for a feature =====
export function getUpgradeMessage(featureKey: string): string {
  const required = FEATURE_MINIMUM_PLAN[featureKey];
  if (!required) return '';
  const planName = required.charAt(0) + required.slice(1).toLowerCase();
  return `This feature requires the ${planName} plan or higher. Upgrade to unlock it.`;
}

// ===== Server-side: Get organization plan and check limits =====
// Always returns the EFFECTIVE plan (TRIAL → GROWTH or TRIAL_RESTRICTED)
export async function getOrgPlan(orgId: string): Promise<PlanId> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, trialEndsAt: true },
  });
  const rawPlan = (org?.plan as string) || 'TRIAL';
  const effectivePlan = getEffectivePlan(rawPlan, org?.trialEndsAt ?? null);
  return effectivePlan as PlanId;
}

export async function checkPlanLimit(
  orgId: string,
  resource: 'machines' | 'users' | 'workOrders'
): Promise<{ allowed: boolean; current: number; limit: number | null; plan: PlanId }> {
  const plan = await getOrgPlan(orgId);
  const limits = PLAN_RESOURCE_LIMITS[plan];
  const limit = limits[resource];

  // Unlimited
  if (limit === null) {
    return { allowed: true, current: 0, limit: null, plan };
  }

  // Count current usage
  let current: number;
  switch (resource) {
    case 'machines':
      current = await db.machine.count({ where: { organizationId: orgId } });
      break;
    case 'users':
      current = await db.user.count({ where: { organizationId: orgId } });
      break;
    case 'workOrders': {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      current = await db.workOrder.count({
        where: {
          organizationId: orgId,
          createdAt: { gte: startOfMonth },
        },
      });
      break;
    }
    default:
      current = 0;
  }

  return {
    allowed: current < limit,
    current,
    limit,
    plan,
  };
}

export async function checkPlanFeature(
  orgId: string,
  featureKey: string
): Promise<{ allowed: boolean; plan: PlanId; requiredPlan: PlanId | null; upgradeMessage: string }> {
  const plan = await getOrgPlan(orgId);
  const requiredPlan = getRequiredPlan(featureKey);
  const allowed = hasFeature(plan, featureKey);
  const upgradeMessage = allowed ? '' : getUpgradeMessage(featureKey);

  return { allowed, plan, requiredPlan, upgradeMessage };
}

// ===== Client-safe plan features (no DB calls) =====
// Used by client components to check plan features without API calls
export const PLAN_FEATURES_DISPLAY: Record<string, { label: string; included: string[]; notIncluded: string[] }> = {
  TRIAL_RESTRICTED: {
    label: 'Trial Expired',
    included: ['Up to 5 machines (view-only)', 'Up to 2 users', '10 work orders/month', 'Basic reporting', 'Email notifications'],
    notIncluded: ['API access', 'SMS notifications', 'QR code labels', 'IoT sensor data', 'Advanced analytics', 'Webhooks', 'All integrations', 'Priority support', 'Custom dashboards', 'SCADA integration', 'PagerDuty', 'SSO / SAML', 'White-label'],
  },
  STARTER: {
    label: 'Starter',
    included: ['Up to 25 machines', 'Up to 10 users', '500 work orders/month', 'Advanced reporting', 'Email & SMS notifications', 'API access', 'QR code labels', 'Integrations (Slack, Zapier)'],
    notIncluded: ['IoT sensor data', 'Priority support', 'Webhooks', 'Custom dashboards', 'All integrations'],
  },
  TRIAL: {
    // TRIAL = full Professional-level access during the 30-day trial
    label: 'Free Trial (Full Access)',
    included: ['Up to 500 machines', 'Up to 100 users', '10,000 work orders/month', 'Full analytics + custom reports', 'IoT + SCADA integration', 'All notifications + PagerDuty', 'Full API access + webhooks', 'Priority phone support', 'All integrations + custom', 'White-label options', 'SSO / SAML', 'Custom dashboards'],
    notIncluded: [],
  },
  GROWTH: {
    label: 'Growth',
    included: ['Up to 100 machines', 'Up to 25 users', '2,000 work orders/month', 'Full analytics suite', 'IoT sensor integration', 'All notifications', 'API access + webhooks', 'Priority email support', 'All integrations', 'Custom dashboards'],
    notIncluded: ['Dedicated account manager', 'SLA guarantee', 'SCADA integration', 'PagerDuty', 'SSO / SAML', 'White-label'],
  },
  PROFESSIONAL: {
    label: 'Professional',
    included: ['Up to 500 machines', 'Up to 100 users', '10,000 work orders/month', 'Full analytics + custom reports', 'IoT + SCADA integration', 'All notifications + PagerDuty', 'Full API access', 'Priority phone support', 'All integrations + custom', 'White-label options', 'SSO / SAML'],
    notIncluded: ['Dedicated account manager', 'On-premise deployment', 'Security audit & compliance', 'Custom SLA guarantee'],
  },
  ENTERPRISE: {
    label: 'Enterprise',
    included: ['Unlimited machines', 'Unlimited users', 'Unlimited work orders', 'Custom SLA guarantee', 'Dedicated account manager', 'On-premise deployment option', 'Custom integrations', 'Security audit & compliance', '24/7 dedicated support', 'Training & onboarding'],
    notIncluded: [],
  },
};