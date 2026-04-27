'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlanDef {
  id: string;
  name: string;
  price: number | null;
  priceMonthly: number | null;
  priceYearly: number | null;
  description: string;
  color: string;
  badge: string;
  popular?: boolean;
  limits: { machines: number | string; users: number | string; workOrders: number | string; storage: string };
  features: readonly string[];
  notIncluded: readonly string[];
}

interface Props {
  orgId: string;
  orgName: string;
  plan: string;
  planData: PlanDef;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  isTrialExpired: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripe: boolean;
  usage: { machines: number; users: number; workOrders: number };
  plans: PlanDef[];
  userRole: string;
  stripeConfigured: boolean;
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | string }) {
  const isUnlimited = limit === 'Unlimited';
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / (limit as number)) * 100));
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#635bff';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
        {isUnlimited ? (
          <div className="h-full rounded-full" style={{ width: '100%', background: 'var(--accent)', opacity: 0.3 }} />
        ) : (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }}
          />
        )}
      </div>
    </div>
  );
}

const PLAN_ORDER = ['TRIAL', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE'];

export default function BillingClient({
  orgId, orgName, plan, planData, trialEndsAt, trialDaysLeft, isTrialExpired,
  subscriptionStatus, currentPeriodEnd, cancelAtPeriodEnd, hasStripe,
  usage, plans, userRole, stripeConfigured,
}: Props) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const currentPlanIdx = PLAN_ORDER.indexOf(plan);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'ENTERPRISE') {
      window.open('mailto:sales@myncel.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }
    if (planId === plan) return;

    setLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingInterval }),
      });
      const data = await res.json();

      if (data.demo) {
        showToast('success', `Demo mode: Would redirect to Stripe Checkout for ${planId} plan. Configure STRIPE_SECRET_KEY to enable payments.`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('error', data.error || 'Failed to create checkout session');
      }
    } catch {
      showToast('error', 'Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();

      if (data.demo) {
        showToast('success', 'Demo mode: Stripe Customer Portal not configured. Add STRIPE_SECRET_KEY.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('error', data.error || 'Failed to open billing portal');
      }
    } catch {
      showToast('error', 'Failed to open billing portal.');
    } finally {
      setLoading(null);
    }
  };

  const statusBadge = () => {
    if (isTrialExpired) return { text: 'Trial Expired', color: '#ef4444', bg: '#fef2f2' };
    if (plan === 'TRIAL') return { text: `Trial — ${trialDaysLeft}d left`, color: '#f59e0b', bg: '#fffbeb' };
    if (subscriptionStatus === 'active') return { text: 'Active', color: '#10b981', bg: '#ecfdf5' };
    if (subscriptionStatus === 'past_due') return { text: 'Payment Past Due', color: '#ef4444', bg: '#fef2f2' };
    if (subscriptionStatus === 'canceled') return { text: 'Canceled', color: '#6b7280', bg: '#f9fafb' };
    if (subscriptionStatus === 'trialing') return { text: 'Trialing', color: '#8b5cf6', bg: '#f5f3ff' };
    return { text: 'Free', color: '#6b7280', bg: '#f9fafb' };
  };

  const badge = statusBadge();

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Billing & Plans</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your subscription and billing details for {orgName}.</p>
      </div>

      {/* Demo mode notice */}
      {!stripeConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Demo Mode — Stripe Not Configured</p>
              <p className="text-xs text-amber-700 mt-1">
                To enable real payments, add your Stripe keys to the environment:
                <code className="ml-1 px-1 py-0.5 bg-amber-100 rounded font-mono">STRIPE_SECRET_KEY</code>,{' '}
                <code className="px-1 py-0.5 bg-amber-100 rounded font-mono">STRIPE_PUBLISHABLE_KEY</code>,{' '}
                and price IDs for each plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial expiry warning */}
      {isTrialExpired && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">🔒</div>
            <div className="flex-1">
              <p className="font-semibold text-red-800">Your free trial has ended</p>
              <p className="text-sm text-red-700 mt-0.5">Upgrade now to continue using Myncel without interruption.</p>
            </div>
            <button
              onClick={() => handleUpgrade('GROWTH')}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Trial countdown */}
      {plan === 'TRIAL' && !isTrialExpired && trialDaysLeft <= 7 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⏰</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">
                {trialDaysLeft === 0 ? 'Your trial expires today!' : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Upgrade to keep your data and avoid service interruption.</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel at period end notice */}
      {cancelAtPeriodEnd && currentPeriodEnd && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📅</span>
            <div className="flex-1">
              <p className="font-semibold text-orange-800 text-sm">Subscription scheduled to cancel</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Your subscription will end on {new Date(currentPeriodEnd).toLocaleDateString()}. You can reactivate at any time.
              </p>
            </div>
            <button onClick={handlePortal} disabled={loading === 'portal'}
              className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors flex-shrink-0 disabled:opacity-50">
              {loading === 'portal' ? 'Loading…' : 'Reactivate'}
            </button>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {planData.name} Plan
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                {badge.text}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{planData.description}</p>

            {currentPeriodEnd && !cancelAtPeriodEnd && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Next billing date: {new Date(currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {plan === 'TRIAL' && trialEndsAt && !isTrialExpired && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Trial ends: {new Date(trialEndsAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasStripe && (
              <button onClick={handlePortal} disabled={loading === 'portal'}
                className="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
                {loading === 'portal' ? 'Loading…' : '⚙️ Manage Billing'}
              </button>
            )}
            {plan !== 'ENTERPRISE' && plan !== 'PROFESSIONAL' && (
              <button
                onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 bg-[#635bff] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors">
                Upgrade Plan ↓
              </button>
            )}
          </div>
        </div>

        {/* Usage meters */}
        <div className="mt-6 pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-6" style={{ borderColor: 'var(--border)' }}>
          <UsageBar label="Machines" used={usage.machines} limit={planData.limits.machines} />
          <UsageBar label="Team Members" used={usage.users} limit={planData.limits.users} />
          <UsageBar label="Work Orders (Total)" used={usage.workOrders} limit={planData.limits.workOrders} />
        </div>
      </div>

      {/* Plan comparison */}
      <div id="plans-section">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Available Plans</h3>

          {/* Billing interval toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
            {(['monthly', 'yearly'] as const).map(interval => (
              <button
                key={interval}
                onClick={() => setBillingInterval(interval)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={billingInterval === interval
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--text-secondary)', background: 'transparent' }
                }
              >
                {interval === 'monthly' ? 'Monthly' : (
                  <span className="flex items-center gap-1.5">
                    Yearly
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                      background: billingInterval === 'yearly' ? 'rgba(255,255,255,0.2)' : '#dcfce7',
                      color: billingInterval === 'yearly' ? '#fff' : '#15803d',
                    }}>Save 20%</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.filter(p => p.id !== 'TRIAL').map(p => {
            const isCurrent = p.id === plan;
            const planIdx = PLAN_ORDER.indexOf(p.id);
            const isDowngrade = planIdx < currentPlanIdx;
            const displayPrice = billingInterval === 'yearly' ? p.priceYearly : p.priceMonthly;

            return (
              <div
                key={p.id}
                className="rounded-xl border p-5 flex flex-col relative transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: p.popular ? '#635bff' : isCurrent ? '#10b981' : 'var(--border)',
                  boxShadow: p.popular ? '0 0 0 2px rgba(99,91,255,0.15)' : undefined,
                }}
              >
                {/* Popular badge */}
                {p.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#635bff] text-white text-xs font-bold rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    Current Plan
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{p.name}</h4>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {p.price === null ? (
                    <div>
                      <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Custom</span>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Contact us for pricing</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
                        ${displayPrice}
                      </span>
                      <span className="text-sm pb-1" style={{ color: 'var(--text-secondary)' }}>
                        /mo{billingInterval === 'yearly' ? ' billed yearly' : ''}
                      </span>
                    </div>
                  )}
                  {billingInterval === 'yearly' && p.priceMonthly && p.priceYearly && (
                    <p className="text-xs mt-1 text-emerald-600 font-medium">
                      Save ${(p.priceMonthly - p.priceYearly) * 12}/year
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="grid grid-cols-2 gap-2 mb-5 p-3 rounded-lg" style={{ background: 'var(--bg-surface-2)' }}>
                  {[
                    { label: 'Machines', val: p.limits.machines },
                    { label: 'Users', val: p.limits.users },
                    { label: 'Work Orders', val: p.limits.workOrders },
                    { label: 'Storage', val: p.limits.storage },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-5 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                  {p.notIncluded.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs opacity-40" style={{ color: 'var(--text-secondary)' }}>
                      <span className="mt-0.5 flex-shrink-0">✗</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {isCurrent ? (
                  <button disabled className="w-full py-2.5 rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed"
                    style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                    Current Plan
                  </button>
                ) : p.id === 'ENTERPRISE' ? (
                  <button onClick={() => handleUpgrade(p.id)}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                    style={{ background: p.color }}>
                    Contact Sales →
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(p.id)}
                    disabled={loading === p.id}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    style={
                      isDowngrade
                        ? { border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }
                        : { background: '#635bff', color: '#fff' }
                    }
                  >
                    {loading === p.id ? 'Loading…' : isDowngrade ? 'Downgrade' : `Upgrade to ${p.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing FAQ */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Billing FAQ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              q: 'Can I change my plan at any time?',
              a: 'Yes. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.',
            },
            {
              q: 'What payment methods are accepted?',
              a: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor.',
            },
            {
              q: 'What happens when my trial ends?',
              a: 'After the trial, your account is restricted. Your data is preserved for 30 days while you choose a plan.',
            },
            {
              q: 'Is there a long-term contract?',
              a: 'No. All plans are month-to-month. Annual billing is available at a 20% discount with no long-term commitment.',
            },
            {
              q: 'Can I get a refund?',
              a: "We offer a 30-day money-back guarantee for new subscribers. Contact support@myncel.com and we'll issue a full refund.",
            },
            {
              q: 'What is included in Enterprise?',
              a: 'Enterprise includes unlimited everything, SLA guarantees, dedicated support, on-premise options, and custom integrations. Contact sales@myncel.com.',
            },
          ].map(item => (
            <div key={item.q} className="p-4 rounded-lg" style={{ background: 'var(--bg-surface-2)' }}>
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{item.q}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Need help with billing?</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Our support team typically responds within 2 hours on business days.</p>
          </div>
          <a href="mailto:billing@myncel.com"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
            Contact Billing Support
          </a>
        </div>
      </div>
    </div>
  );
}