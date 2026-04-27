'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/settings',               label: 'Profile',       icon: '👤' },
  { href: '/settings/security',      label: 'Security',      icon: '🔒' },
  { href: '/settings/team',          label: 'Team',          icon: '👥' },
  { href: '/settings/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/settings/integrations',  label: 'Integrations',  icon: '🔌' },
  { href: '/settings/billing',       label: 'Billing',       icon: '💳' },
  { href: '/settings/api-keys',      label: 'API Keys',      icon: '🔑' },
  { href: '/settings/webhooks',      label: 'Webhooks',      icon: '🪝' },
];

export default function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Exact match for /settings, prefix match for sub-pages
  const isActive = (href: string) => {
    if (href === '/settings') return pathname === '/settings';
    return pathname.startsWith(href);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage your account and organization settings
        </p>
      </div>

      <div className="flex gap-6">
        {/* ── Persistent sidebar ── */}
        <aside className="w-52 flex-shrink-0">
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={
                    active
                      ? {
                          background: 'var(--accent)',
                          color: '#fff',
                        }
                      : {
                          color: 'var(--text-secondary)',
                          background: 'transparent',
                        }
                  }
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-surface-2)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}