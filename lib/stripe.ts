import Stripe from 'stripe';
import https from 'https';
import http from 'http';

// Create a custom HTTP agent with aggressive keepAlive for serverless environments
// This helps prevent ECONNRESET/EPIPE errors in Vercel Functions
const stripeHttpAgent = new https.Agent({
  keepAlive: true,
  keepAliveInitialDelay: 1000, // Start keepalive probes after 1 second
  timeout: 90000, // 90 second timeout for the agent
  maxSockets: 50,
  maxFreeSockets: 10,
});

// Also create an HTTP agent for completeness
const stripeHttpAgentInsecure = new http.Agent({
  keepAlive: true,
  keepAliveInitialDelay: 1000,
  timeout: 90000,
  maxSockets: 50,
  maxFreeSockets: 10,
});

// Initialize Stripe with enhanced configuration for serverless
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  {
    apiVersion: '2024-11-20.acacia' as any,
    typescript: true,
    maxNetworkRetries: 5, // Increased to 5 retries
    timeout: 60000, // 60 second timeout for each request
    telemetry: true,
    httpAgent: stripeHttpAgent, // Custom agent with keepAlive
    // Enable app info for better support from Stripe
    appInfo: {
      name: 'Myncel CMMS',
      version: '1.0.0',
    },
  }
);

// Billing plan definitions
export const BILLING_PLANS = [
  {
    id: 'TRIAL',
    name: 'Free Trial',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    description: 'Full access to all features — experience the complete product free for 30 days',
    color: '#f59e0b',
    badge: 'Trial',
    limits: {
      machines: 500,
      users: 100,
      workOrders: 10000,
      storage: '100GB',
    },
    features: [
      'Up to 500 machines',
      'Up to 100 users',
      '10,000 work orders/month',
      'Full analytics + custom reports',
      'IoT + SCADA integration',
      'All notifications + PagerDuty',
      'Full API access + webhooks',
      'Priority phone support',
      'All integrations + custom',
      'Custom dashboards',
      'White-label options',
      'SSO / SAML',
    ],
    notIncluded: [],
  },
  {
    id: 'TRIAL_RESTRICTED',
    name: 'Trial Expired',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    description: 'Trial expired — upgrade to continue using advanced features',
    color: '#ef4444',
    badge: 'Expired',
    limits: {
      machines: 5,
      users: 2,
      workOrders: 10,
      storage: '100MB',
    },
    features: [
      'Up to 5 machines (view-only)',
      'Up to 2 users',
      '10 work orders/month',
      'Basic reporting',
      'Email notifications',
    ],
    notIncluded: [
      'API access',
      'SMS notifications',
      'QR code labels',
      'IoT sensor data',
      'Advanced analytics',
      'Webhooks',
      'All integrations',
      'Priority support',
      'Custom dashboards',
    ],
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 49,
    priceMonthly: 49,
    priceYearly: 39, // per month billed yearly
    stripePriceIdMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || null,
    stripePriceIdYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || null,
    description: 'Perfect for small maintenance teams',
    color: '#0ea5e9',
    badge: 'Popular',
    limits: {
      machines: 25,
      users: 10,
      workOrders: 500,
      storage: '5GB',
    },
    features: [
      'Up to 25 machines',
      'Up to 10 users',
      '500 work orders/month',
      'Advanced reporting',
      'Email & SMS notifications',
      'API access',
      'QR code labels',
      'Integrations (Slack, Zapier)',
    ],
    notIncluded: [
      'IoT sensor data',
      'Priority support',
    ],
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    price: 99,
    priceMonthly: 99,
    priceYearly: 79, // per month billed yearly
    stripePriceIdMonthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID || null,
    stripePriceIdYearly: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID || null,
    description: 'For growing maintenance operations',
    color: '#8b5cf6',
    badge: 'Most Popular',
    popular: true,
    limits: {
      machines: 100,
      users: 25,
      workOrders: 2000,
      storage: '20GB',
    },
    features: [
      'Up to 100 machines',
      'Up to 25 users',
      '2,000 work orders/month',
      'Full analytics suite',
      'IoT sensor integration',
      'All notifications',
      'API access + webhooks',
      'Priority email support',
      'All integrations',
      'Custom dashboards',
    ],
    notIncluded: [
      'Dedicated account manager',
      'SLA guarantee',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 249,
    priceMonthly: 249,
    priceYearly: 199, // per month billed yearly
    stripePriceIdMonthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || null,
    stripePriceIdYearly: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || null,
    description: 'Advanced features for large teams',
    color: '#f59e0b',
    badge: 'Pro',
    limits: {
      machines: 500,
      users: 100,
      workOrders: 10000,
      storage: '100GB',
    },
    features: [
      'Up to 500 machines',
      'Up to 100 users',
      '10,000 work orders/month',
      'Full analytics + custom reports',
      'IoT + SCADA integration',
      'All notifications + PagerDuty',
      'Full API access',
      'Priority phone support',
      'All integrations + custom',
      'White-label options',
      'SSO / SAML',
    ],
    notIncluded: [],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: null, // Custom pricing
    priceMonthly: null,
    priceYearly: null,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    description: 'Custom pricing for enterprise needs',
    color: '#0a2540',
    badge: 'Enterprise',
    limits: {
      machines: 'Unlimited',
      users: 'Unlimited',
      workOrders: 'Unlimited',
      storage: 'Unlimited',
    },
    features: [
      'Unlimited machines',
      'Unlimited users',
      'Unlimited work orders',
      'Custom SLA guarantee',
      'Dedicated account manager',
      'On-premise deployment option',
      'Custom integrations',
      'Security audit & compliance',
      '24/7 dedicated support',
      'Training & onboarding',
    ],
    notIncluded: [],
  },
] as const;

export type PlanId = 'TRIAL' | 'TRIAL_RESTRICTED' | 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';

export function getPlanById(id: string) {
  return BILLING_PLANS.find(p => p.id === id) || BILLING_PLANS[0];
}

export function getPlanOrder(planId: string): number {
  // TRIAL is at Professional level because active trials get full access to all features
  // TRIAL_RESTRICTED is the lowest — for expired trials
  const order: Record<string, number> = {
    TRIAL_RESTRICTED: 0, STARTER: 1, GROWTH: 2, TRIAL: 3, PROFESSIONAL: 3, ENTERPRISE: 4,
  };
  return order[planId] ?? 0;
}

export function isUpgrade(fromPlan: string, toPlan: string): boolean {
  return getPlanOrder(toPlan) > getPlanOrder(fromPlan);
}