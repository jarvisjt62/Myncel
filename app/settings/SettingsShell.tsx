'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { prefetch } from '@/app/lib/client-cache';

const NAV_ITEMS = [
  { href: '/settings',               label: 'Profile',       icon: '👤', cacheKey: null, adminOnly: false },
  { href: '/settings/security',      label: 'Security',      icon: '🔒', cacheKey: null, adminOnly: false },
  { href: '/settings/team',          label: 'Team',          icon: '👥', cacheKey: null, adminOnly: false },
  { href: '/settings/notifications', label: 'Notifications', icon: '🔔', cacheKey: 'notifications', adminOnly: false },
  { href: '/settings/integrations',  label: 'Integrations',  icon: '🔌', cacheKey: 'integrations', adminOnly: false },
  { href: '/settings/billing',       label: 'Billing',       icon: '💳', cacheKey: null, adminOnly: false },
  { href: '/settings/api-keys',      label: 'API Keys',      icon: '🔑', cacheKey: 'api-keys', adminOnly: false },
  { href: '/settings/webhooks',      label: 'Webhooks',      icon: '🪝', cacheKey: 'webhooks', adminOnly: false },
  // Visible only to OWNER / ADMIN. Routes to a per-org Emergency Broadcast page.
  { href: '/settings/emergency-broadcast', label: 'Emergency Broadcast', icon: '🚨', cacheKey: null, adminOnly: true },
];

// Map cache keys to their API endpoints for prefetching
const PREFETCH_ENDPOINTS: Record<string, string> = {
  'notifications': '/api/settings/notifications',
  'integrations': '/api/integrations',
  'api-keys': '/api/settings/api-keys',
  'webhooks': '/api/webhooks',
};

export default function SettingsShell({ children, userRole }: { children: React.ReactNode; userRole?: string | null }) {
  const pathname = usePathname();

  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
  const visibleNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  // Exact match for /settings, prefix match for sub-pages
  const isActive = (href: string) => {
    if (href === '/settings') return pathname === '/settings';
    return pathname.startsWith(href);
  };

  // Prefetch data when user hovers over a nav item
  const handlePrefetch = (cacheKey: string | null) => {
    if (!cacheKey) return;
    const endpoint = PREFETCH_ENDPOINTS[cacheKey];
    if (!endpoint) return;
    prefetch(cacheKey, async () => {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
      return null;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Page header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage your account and organization settings
        </p>
      </div>

      {/* On mobile: horizontal scrollable pill nav. On desktop: sidebar layout */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* ── Persistent nav ── */}
        <aside className="sm:w-52 flex-shrink-0">
          {/* Mobile: horizontal scroll pills */}
          <nav className="flex sm:flex-col gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:space-y-0.5 flex-nowrap sm:flex-wrap">
            {visibleNavItems.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 sm:flex-shrink sm:w-full"
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
                    // Prefetch data on hover
                    handlePrefetch(item.cacheKey);
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