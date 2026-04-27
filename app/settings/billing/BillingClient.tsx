'use client';

import { useState, useEffect } from 'react';
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

// Payment gateway definitions
const GATEWAYS = [
  {
    id: 'stripe',
    name: 'Credit / Debit Card',
    description: 'Visa, Mastercard, Amex, Discover',
    icon: '💳',
    logos: ['VISA', 'MC', 'AMEX'],
    color: '#635bff',
    subtitle: 'Powered by Stripe — PCI DSS compliant',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account or balance',
    icon: '🅿️',
    logos: ['PP'],
    color: '#003087',
    subtitle: 'Buyer protection included',
  },
  {
    id: 'bank',
    name: 'Bank Transfer (ACH)',
    description: 'Direct debit from US bank account',
    icon: '🏦',
    logos: ['ACH'],
    color: '#10b981',
    subtitle: 'For annual plans — 3–5 business days',
  },
];

function GatewayLogoBadge({ type }: { type: string }) {
  const styles: Record<string, { bg: string; color: string; text: string }> = {
    VISA:  { bg: '#1a1f71', color: '#fff',    text: 'VISA' },
    MC:    { bg: '#eb001b', color: '#fff',    text: 'MC' },
    AMEX:  { bg: '#2e77bc', color: '#fff',    text: 'AMEX' },
    PP:    { bg: '#003087', color: '#fff',    text: 'PayPal' },
    ACH:   { bg: '#10b981', color: '#fff',    text: 'ACH' },
  };
  const s = styles[type] ?? { bg: '#6b7280', color: '#fff', text: type };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800,
      background: s.bg, color: s.color, letterSpacing: '0.03em',
    }}>{s.text}</span>
  );
}

export default function BillingClient({
  orgId, orgName, plan, planData, trialEndsAt, trialDaysLeft, isTrialExpired,
  subscriptionStatus, currentPeriodEnd, cancelAtPeriodEnd, hasStripe,
  usage, plans, userRole, stripeConfigured,
}: Props) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string>('stripe');
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [activeGateways, setActiveGateways] = useState<Record<string, boolean>>({
    stripe: true, paypal: true, ach: true, applePay: true, googlePay: true,
  });

  // Fetch active gateways from admin settings
  useEffect(() => {
    fetch('/api/billing/gateways')
      .then(r => r.json())
      .then(data => setActiveGateways(data))
      .catch(() => {});
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const currentPlanIdx = PLAN_ORDER.indexOf(plan);

  const handleUpgrade = (planId: string) => {
    if (planId === 'ENTERPRISE') {
      window.open('mailto:sales@myncel.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }
    if (planId === plan) return;
    // Open gateway selection modal
    setCheckoutPlanId(planId);
    setSelectedGateway('stripe');
  };

  const handleCheckout = async () => {
    if (!checkoutPlanId) return;
    setLoading(checkoutPlanId);
    setCheckoutPlanId(null);

    try {
      if (selectedGateway === 'stripe') {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: checkoutPlanId, billingInterval }),
        });
        const data = await res.json();
        if (data.demo) {
          showToast('success', `Demo mode: Would redirect to Stripe Checkout for ${checkoutPlanId}. Configure STRIPE_SECRET_KEY to enable payments.`);
          return;
        }
        if (data.url) {
          window.location.href = data.url;
        } else {
          showToast('error', data.error || 'Failed to create checkout session');
        }
      } else if (selectedGateway === 'paypal') {
        const res = await fetch('/api/billing/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: checkoutPlanId, billingInterval }),
        });
        const data = await res.json();
        if (data.demo) {
          showToast('success', `Demo mode: Would redirect to PayPal checkout for ${checkoutPlanId}. Configure PAYPAL_CLIENT_ID to enable.`);
          return;
        }
        if (data.url) {
          window.location.href = data.url;
        } else {
          showToast('error', data.error || 'Failed to create PayPal checkout');
        }
      } else if (selectedGateway === 'bank') {
        showToast('success', 'Our team will send you a bank transfer invoice within 1 business day. Please ensure you select an annual plan for ACH payments.');
        // In production: trigger an email/invoice workflow
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
    if (isTrialExpired) return { text: 'Trial Expired', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (plan === 'TRIAL') return { text: `Trial — ${trialDaysLeft}d left`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    if (subscriptionStatus === 'active') return { text: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (subscriptionStatus === 'past_due') return { text: 'Payment Past Due', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (subscriptionStatus === 'canceled') return { text: 'Canceled', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
    if (subscriptionStatus === 'trialing') return { text: 'Trialing', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
    return { text: 'Free', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  };

  const badge = statusBadge();
  const checkoutPlan = plans.find(p => p.id === checkoutPlanId);

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          maxWidth: 380,
        }}>
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.text}
        </div>
      )}

      {/* Payment Gateway Selection Modal */}
      {checkoutPlanId && checkoutPlan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setCheckoutPlanId(null)}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 480,
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Complete Your Purchase
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Upgrading to <strong style={{ color: checkoutPlan.color }}>{checkoutPlan.name}</strong>
                    {' '}— ${billingInterval === 'yearly' ? checkoutPlan.priceYearly : checkoutPlan.priceMonthly}/mo
                    {billingInterval === 'yearly' ? ' billed yearly' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setCheckoutPlanId(null)}
                  style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, lineHeight: 1 }}
                >×</button>
              </div>
            </div>

            {/* Gateway options */}
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Choose Payment Method
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {GATEWAYS.filter(gw => activeGateways[gw.id] !== false).map(gw => (
                <label
                  key={gw.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    border: selectedGateway === gw.id
                      ? `2px solid ${gw.color}`
                      : '2px solid var(--border)',
                    background: selectedGateway === gw.id
                      ? gw.color + '0d'
                      : 'var(--bg-surface-2)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="gateway"
                    value={gw.id}
                    checked={selectedGateway === gw.id}
                    onChange={() => setSelectedGateway(gw.id)}
                    style={{ display: 'none' }}
                  />
                  {/* Radio circle */}
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: selectedGateway === gw.id ? `5px solid ${gw.color}` : '2px solid var(--border)',
                    background: 'var(--bg-surface)',
                    transition: 'all 0.15s',
                  }} />
                  <div style={{ fontSize: 24, flexShrink: 0 }}>{gw.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{gw.name}</span>
                      {gw.logos.map(l => <GatewayLogoBadge key={l} type={l} />)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{gw.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{gw.subtitle}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Security note */}
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 18,
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                All transactions are encrypted and secured with 256-bit SSL. We never store your card details.
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setCheckoutPlanId(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                style={{
                  flex: 2, padding: '11px', borderRadius: 8, border: 'none',
                  background: GATEWAYS.find(g => g.id === selectedGateway)?.color ?? '#635bff',
                  color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                {selectedGateway === 'bank'
                  ? 'Request Invoice'
                  : `Pay with ${GATEWAYS.find(g => g.id === selectedGateway)?.name ?? 'Card'} →`}
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
              By completing this purchase you agree to our{' '}
              <a href="/terms" style={{ color: 'var(--accent)' }}>Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
            </p>
          </div>
        </div>
      )}

      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Billing & Plans</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your subscription and billing details for {orgName}.</p>
      </div>

      {/* Demo mode notice */}
      {!stripeConfigured && (
        <div style={{
          borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)',
          background: 'rgba(245,158,11,0.07)', padding: '14px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <p style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14, margin: 0 }}>Demo Mode — Payment Gateways Not Configured</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                To enable real payments, configure your payment gateways:
                <br />• <strong>Stripe</strong>:{' '}
                <code style={{ background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 3 }}>STRIPE_SECRET_KEY</code>{', '}
                <code style={{ background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 3 }}>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
                <br />• <strong>PayPal</strong>:{' '}
                <code style={{ background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 3 }}>PAYPAL_CLIENT_ID</code>{', '}
                <code style={{ background: 'var(--bg-surface-2)', padding: '1px 5px', borderRadius: 3 }}>PAYPAL_CLIENT_SECRET</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial expiry warning */}
      {isTrialExpired && (
        <div style={{
          borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)',
          background: 'rgba(239,68,68,0.07)', padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🔒</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: '#ef4444', margin: 0 }}>Your free trial has ended</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Upgrade now to continue using Myncel without interruption.</p>
            </div>
            <button onClick={() => handleUpgrade('GROWTH')} style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0,
            }}>
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Trial countdown */}
      {plan === 'TRIAL' && !isTrialExpired && trialDaysLeft <= 7 && (
        <div style={{
          borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)',
          background: 'rgba(245,158,11,0.07)', padding: '12px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏰</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: '#f59e0b', margin: 0, fontSize: 14 }}>
                {trialDaysLeft === 0 ? 'Your trial expires today!' : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Upgrade to keep your data and avoid service interruption.</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel at period end notice */}
      {cancelAtPeriodEnd && currentPeriodEnd && (
        <div style={{
          borderRadius: 12, border: '1px solid rgba(249,115,22,0.3)',
          background: 'rgba(249,115,22,0.07)', padding: '12px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: '#f97316', margin: 0, fontSize: 14 }}>Subscription scheduled to cancel</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Your subscription will end on {new Date(currentPeriodEnd).toLocaleDateString()}. You can reactivate at any time.
              </p>
            </div>
            <button onClick={handlePortal} disabled={loading === 'portal'}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#f97316', color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: loading === 'portal' ? 'not-allowed' : 'pointer', opacity: loading === 'portal' ? 0.6 : 1, flexShrink: 0,
              }}>
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
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: badge.bg, color: badge.color,
              }}>
                {badge.text}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{planData.description}</p>
            {currentPeriodEnd && !cancelAtPeriodEnd && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Next billing date: {new Date(currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {plan === 'TRIAL' && trialEndsAt && !isTrialExpired && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
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
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: '#635bff', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
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

      {/* Accepted payment methods strip */}
      <div style={{
        borderRadius: 10, border: '1px solid var(--border)',
        background: 'var(--bg-surface)', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
          Accepted payments:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {activeGateways.stripe !== false && <><GatewayLogoBadge type="VISA" /><GatewayLogoBadge type="MC" /><GatewayLogoBadge type="AMEX" /></>}
          {activeGateways.paypal !== false && <GatewayLogoBadge type="PP" />}
          {activeGateways.ach !== false && <GatewayLogoBadge type="ACH" />}
          {(activeGateways.applePay !== false || activeGateways.googlePay !== false) && activeGateways.stripe !== false && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {[activeGateways.applePay !== false && 'Apple Pay', activeGateways.googlePay !== false && 'Google Pay'].filter(Boolean).join(' & ')} (via Stripe)
            </span>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>🔒</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>256-bit SSL encryption</span>
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

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{p.name}</h4>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                </div>

                <div className="mb-5">
                  {p.price === null ? (
                    <div>
                      <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Custom</span>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Contact us for pricing</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>${displayPrice}</span>
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
              a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex, Discover), PayPal, ACH bank transfers, and Apple Pay / Google Pay via Stripe.',
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
              q: 'How does PayPal billing work?',
              a: 'With PayPal, you can use your PayPal balance, linked bank account, or card. Subscriptions are managed through your PayPal account portal.',
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