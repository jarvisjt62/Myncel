'use client';

import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeProvider';

interface Props {
  isAdmin: boolean;
  user: { name: string; email: string };
}

export default function SettingsPageClient({ isAdmin, user }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page Title */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your account and organization settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          <Link href="/settings" className="block px-4 py-3 rounded-lg bg-[#635bff] text-white font-medium">
            Profile
          </Link>
          <Link href="/settings/security" className="block px-4 py-3 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-surface-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
          >
            Security
          </Link>
          <Link href="/settings/team" className="block px-4 py-3 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-surface-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
          >
            Team
          </Link>
          <Link href="/settings/notifications" className="block px-4 py-3 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-surface-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
          >
            Notifications
          </Link>
          <Link href="/settings/integrations" className="block px-4 py-3 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-surface-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
          >
            Integrations
          </Link>
          {isAdmin && (
            <Link href="/settings/billing" className="block px-4 py-3 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-surface-2)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
            >
              Billing
            </Link>
          )}
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 space-y-6">

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
                { href: '/settings/security', label: '🔒 Security & Password', desc: 'Change password, 2FA' },
                { href: '/settings/team', label: '👥 Team Management', desc: 'Manage team members' },
                { href: '/settings/notifications', label: '🔔 Notifications', desc: 'Email & push preferences' },
                { href: '/settings/api-keys', label: '🔑 API Keys', desc: 'Manage API access keys' },
                { href: '/settings/integrations', label: '🔌 Integrations', desc: 'Connect external services' },
                { href: '/settings/webhooks', label: '🪝 Webhooks', desc: 'Configure webhooks' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col p-4 rounded-lg border transition-all hover:shadow-sm"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <span className="font-medium text-sm">{link.label}</span>
                  <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{link.desc}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}