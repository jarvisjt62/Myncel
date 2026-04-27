'use client';

import '../components/theme.css';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';

interface NavItem { href: string; label: string; icon: string; exact?: boolean; external?: boolean; }
interface NavSection { label: string; items: NavItem[]; }
interface ExternalLink { href: string; label: string; icon: string; }

interface Props {
  children: React.ReactNode;
  navSections: NavSection[];
  externalLinks: ExternalLink[];
  userName: string;
}

function AdminShell({ children, navSections, externalLinks, userName }: Props) {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)', transition: 'background-color 0.2s, color 0.2s' }}
    >
      {/* Top Nav */}
      <nav
        className="px-3 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50"
        style={{ backgroundColor: 'var(--bg-nav)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="Myncel" className="w-8 sm:w-10 h-8 sm:h-10" />
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>Myncel</span>
            <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--accent)' }}>Admin</span>
            <span
              className="text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ml-0.5 sm:ml-1 hidden sm:inline-block"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            >
              SUPER ADMIN
            </span>
          </div>
        </div>

        {/* Right: User dropdown only */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-1.5 sm:gap-2 transition-colors px-2 sm:px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs sm:text-sm font-medium hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
              {userName.split(' ')[0]}
            </span>
            <svg
              className="w-3 h-3 hidden sm:block transition-transform duration-200"
              style={{ color: 'var(--text-secondary)', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl shadow-lg z-50 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              {/* User info header */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{userName}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Super Admin</p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/admin/account"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Account
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </div>

              {/* Divider + Sign out */}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <a
                  href="/api/auth/signout"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar (desktop) */}
        <aside
          className="hidden lg:block w-56 min-h-screen pt-4 px-3 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
        >
          <nav className="space-y-0.5">
            {navSections.map((section) => (
              <div key={section.label}>
                <p
                  className="text-xs uppercase tracking-wider px-3 mb-2 mt-4 first:mt-2 font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group"
                      style={{
                        backgroundColor: active ? 'var(--bg-hover)' : '',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: active ? '600' : undefined,
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '';
                          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                      {active && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--accent)' }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* External Links */}
          <div className="pb-4 pt-4 mt-4 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-wider px-3 mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
              External
            </p>
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
                <svg className="w-3 h-3 ml-auto opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </aside>

        {/* Mobile Bottom Nav */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2 overflow-x-auto"
          style={{ backgroundColor: 'var(--bg-nav)', borderTop: '1px solid var(--border)' }}
        >
          <div className="flex gap-1 justify-around">
            {navSections[0].items.slice(0, 5).map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all text-xs"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main
          className="flex-1 p-3 sm:p-6 min-h-screen overflow-y-auto pb-20 lg:pb-6"
          style={{ backgroundColor: 'var(--bg-page)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayoutClient({ children, navSections, externalLinks, userName }: Props) {
  return (
    <ThemeProvider
      themeClass="admin-theme"
      defaultTheme="light"
      storageKey="myncel-admin-theme"
      style={{ minHeight: '100vh' }}
    >
      <AdminShell
        navSections={navSections}
        externalLinks={externalLinks}
        userName={userName}
      >
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}