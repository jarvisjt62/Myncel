'use client';

import { useEffect, useState } from 'react';
import { ThemeToggle } from '../components/ThemeProvider';
import { SUPPORTED_CURRENCIES } from '@/app/lib/currency';

interface Props {
  isAdmin: boolean;
  user: { name: string; email: string };
}

export default function SettingsPageClient({ isAdmin, user }: Props) {
  const [currency, setCurrency] = useState<string>('USD');
  const [orgName, setOrgName] = useState<string>('');
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencyMsg, setCurrencyMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings/organization', { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!cancelled) {
          setCurrency(json.organization?.currency ?? 'USD');
          setOrgName(json.organization?.name ?? '');
        }
      } catch (e) {
        if (!cancelled) setCurrencyMsg({ type: 'err', text: 'Could not load organization settings' });
      } finally {
        if (!cancelled) setLoadingOrg(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function saveCurrency(newCode: string) {
    setSavingCurrency(true);
    setCurrencyMsg(null);
    try {
      const res = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Failed to save');
      }
      const json = await res.json();
      setCurrency(json.organization.currency);
      setCurrencyMsg({ type: 'ok', text: 'Currency updated. Refresh other tabs to see the change.' });
    } catch (e: any) {
      setCurrencyMsg({ type: 'err', text: e?.message ?? 'Failed to save currency' });
    } finally {
      setSavingCurrency(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Appearance / Theme */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Controls the display mode across the entire dashboard.
        </p>
        <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Theme Mode</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Toggle between light and dark interface</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Organization / Localization */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Organization & Localization</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Settings that apply to the entire organization. Currency is used everywhere costs are displayed —
          dashboards, reports, work orders, parts inventory, and exports.
        </p>

        <div className="space-y-4">
          {orgName && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Organization</label>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{orgName}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Currency
            </label>
            {loadingOrg ? (
              <div className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--bg-surface-2)' }} />
            ) : (
              <select
                value={currency}
                disabled={savingCurrency || !isAdmin}
                onChange={e => saveCurrency(e.target.value)}
                className="w-full sm:max-w-xs px-3 py-2.5 rounded-lg text-sm focus:outline-none disabled:opacity-60"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                {[...SUPPORTED_CURRENCIES]
                  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                  .map(c => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} — {c.name} ({c.code})
                    </option>
                  ))}
              </select>
            )}
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {isAdmin
                ? 'Changes take effect immediately for all users in this organization.'
                : 'Only admins and owners can change the organization currency.'}
            </p>
            {currencyMsg && (
              <p
                className="text-xs mt-2 px-2 py-1 rounded inline-block"
                style={{
                  background: currencyMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: currencyMsg.type === 'ok' ? '#059669' : '#dc2626',
                }}
              >
                {currencyMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Profile Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              defaultValue={user.name}
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input
              defaultValue={user.email}
              type="email"
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>
          <button className="bg-[#635bff] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: '/settings/security',      label: '🔒 Security & Password', desc: 'Change password, 2FA' },
            { href: '/settings/team',          label: '👥 Team Management',     desc: 'Manage team members' },
            { href: '/settings/notifications', label: '🔔 Notifications',       desc: 'Email & push preferences' },
            { href: '/settings/api-keys',      label: '🔑 API Keys',            desc: 'Manage API access keys' },
            { href: '/settings/integrations',  label: '🔌 Integrations',        desc: 'Connect external services' },
            { href: '/settings/webhooks',      label: '🪝 Webhooks',            desc: 'Configure webhooks' },
            ...(isAdmin ? [{ href: '/settings/billing', label: '💳 Billing', desc: 'Manage plan & payments' }] : []),
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="flex flex-col p-4 rounded-lg border transition-all hover:shadow-sm"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <span className="text-sm font-semibold">{link.label}</span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{link.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
