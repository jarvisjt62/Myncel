'use client';

import '../components/theme.css';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ThemeProvider, ThemeToggle } from '../components/ThemeProvider';
import NotificationBell from '../components/NotificationBell';
import GlobalSearch from '../components/GlobalSearch';

type UserSidebarProps = {
  user: {
    name: string;
    email: string;
    role: string;
    organizationName: string;
  };
  children: React.ReactNode;
};

function UserShellInner({ user, children }: UserSidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine active nav item from URL
  const getActiveItem = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/dashboard/hmi')) return 'hmi';
    if (pathname.startsWith('/dashboard/iot-simulator')) return 'iot-simulator';
    if (pathname.startsWith('/dashboard/notifications')) return 'notifications';
    if (pathname.startsWith('/equipment/qr-labels')) return 'qr-labels';
    if (pathname.startsWith('/equipment/floor-plan')) return 'floor-plan';
    if (pathname.startsWith('/equipment')) return 'equipment';
    if (pathname.startsWith('/work-orders') || pathname.includes('workorders')) return 'workorders';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/setup')) return 'setup';
    if (pathname.startsWith('/docs/api')) return 'api-docs';
    if (pathname.startsWith('/docs/iot-guides')) return 'iot-guides';
    if (pathname.startsWith('/docs/protocols')) return 'protocols';
    if (pathname.startsWith('/docs')) return 'docs';
    if (pathname.startsWith('/org/dashboard')) return 'org-dashboard';
    return 'dashboard';
  };

  const active = getActiveItem();

  const navLink = (href: string, id: string, label: string, icon: React.ReactNode, badge?: React.ReactNode) => {
    const isActive = active === id;
    return (
      <Link
        key={id}
        href={href}
        onClick={() => setSidebarOpen(false)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? 'bg-[#635bff]/10 text-[#635bff]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span className={isActive ? 'text-[#635bff]' : 'text-[var(--text-muted)]'}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {badge}
      </Link>
    );
  };

  const Sidebar = () => (
    <aside className="w-60 flex flex-col h-full" style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-1.5">
          <img src="/logo.png" alt="Myncel" className="w-9 h-9" />
          <div>
            <div className="font-bold text-sm text-[var(--text-primary)]">Myncel</div>
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {user.organizationName}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">

        {/* Main nav */}
        {navLink('/dashboard', 'dashboard', 'Dashboard',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        )}

        {navLink('/dashboard#equipment', 'equipment', 'Equipment',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}

        {navLink('/dashboard#workorders', 'workorders', 'Work Orders',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )}

        {navLink('/dashboard#schedules', 'schedules', 'Schedules',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}

        {navLink('/dashboard#alerts', 'alerts', 'Alerts',
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )}

        {/* IoT & Tools section */}
        <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>IoT & Tools</p>

          {navLink('/dashboard/hmi', 'hmi', 'HMI Monitor',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>,
            <span className="text-[9px] bg-[#635bff]/10 text-[#635bff] px-1.5 py-0.5 rounded-full font-semibold">Live</span>
          )}

          {navLink('/dashboard/iot-simulator', 'iot-simulator', 'IoT Simulator',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>,
            <span className="text-[9px] bg-[#0ea5e9]/10 text-[#0ea5e9] px-1.5 py-0.5 rounded-full font-semibold">New</span>
          )}

          {navLink('/equipment/qr-labels', 'qr-labels', 'QR Labels',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 17.5a.5.5 0 11-1 0 .5.5 0 011 0zM6 7.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          )}
        </div>

        {/* Docs & Guides section */}
        <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Docs & Guides</p>

          {navLink('/docs/api', 'api-docs', 'API Docs',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          )}

          {navLink('/docs/iot-guides', 'iot-guides', 'Wiring Guides',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}

          {navLink('/docs/protocols', 'protocols', 'Protocols',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          )}

          {navLink('/setup', 'setup', 'Setup Wizard',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>,
            <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold">Start</span>
          )}
        </div>

        {/* Settings */}
        <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
          {navLink('/settings', 'settings', 'Settings',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          )}

          {navLink('/settings/api-keys', 'api-keys', 'API Keys',
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          )}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#635bff] flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
            <p className="text-xs font-medium truncate" style={{ color: 'var(--accent)', opacity: 0.85 }}>{user.role}</p>
          </div>
        </div>

        {/* Org Admin Panel — only for OWNER and ADMIN */}
        {(user.role === 'OWNER' || user.role === 'ADMIN') && (
          <Link
            href="/org/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-1 ${
              active === 'org-dashboard'
                ? 'bg-[#635bff]/10 text-[#635bff]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className={active === 'org-dashboard' ? 'text-[#635bff]' : 'text-[var(--text-secondary)]'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <span className="flex-1 text-left">Org Admin Panel</span>
            <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold uppercase">
              {user.role}
            </span>
          </Link>
        )}

        {user.email === 'admin@myncel.com' && (
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-1 text-[#635bff] bg-[#635bff]/10 hover:bg-[#635bff]/20"
          >
            <span>🛡️</span>
            <span className="flex-1 text-left">Admin Panel</span>
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-xs font-medium text-[var(--text-secondary)] hover:text-red-500 flex items-center gap-1.5 transition-colors mt-1 py-1.5 px-2 rounded-lg hover:bg-red-500/10"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );

  // Compute page title from path
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/dashboard/hmi')) return 'HMI Monitor';
    if (pathname.startsWith('/dashboard/iot-simulator')) return 'IoT Simulator';
    if (pathname.startsWith('/dashboard/notifications')) return 'Notifications';
    if (pathname.startsWith('/equipment/qr-labels')) return 'QR Labels';
    if (pathname.startsWith('/equipment/floor-plan')) return 'Floor Plan';
    if (pathname.startsWith('/equipment')) return 'Equipment';
    if (pathname.startsWith('/settings/api-keys')) return 'API Keys';
    if (pathname.startsWith('/settings/integrations')) return 'Integrations';
    if (pathname.startsWith('/settings/notifications')) return 'Notification Settings';
    if (pathname.startsWith('/settings/team')) return 'Team';
    if (pathname.startsWith('/settings/security')) return 'Security';
    if (pathname.startsWith('/settings/webhooks')) return 'Webhooks';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/setup')) return 'Setup Wizard';
    if (pathname.startsWith('/docs/api')) return 'API Docs';
    if (pathname.startsWith('/docs/iot-guides')) return 'Wiring Guides';
    if (pathname.startsWith('/docs/protocols')) return 'Protocols';
    if (pathname.startsWith('/docs')) return 'Documentation';
    if (pathname.startsWith('/org/dashboard')) return 'Org Admin Panel';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-col fixed h-full z-10 w-60">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-60 flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
        {/* Top bar */}
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-nav)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[var(--text-primary)]">{getPageTitle()}</h1>
              <p className="text-xs text-[var(--text-muted)]">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <GlobalSearch />
            </div>
            <NotificationBell />
            {user.email === 'admin@myncel.com' && (
              <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-[#635bff] bg-[#635bff]/10 hover:bg-[#635bff]/20 px-3 py-1.5 rounded-lg transition-colors border border-[rgba(99,91,255,0.25)]">
                🛡️ Admin Panel
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function UserSidebar({ user, children }: UserSidebarProps) {
  return (
    <ThemeProvider themeClass="dash-theme" defaultTheme="light" storageKey="myncel-dashboard-theme">
      <UserShellInner user={user} children={children} />
    </ThemeProvider>
  );
}