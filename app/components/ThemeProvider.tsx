'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface Props {
  children: React.ReactNode;
  /** CSS class applied to the wrapper div (e.g. "admin-theme", "dash-theme", "hmi-theme") */
  themeClass: string;
  /** Which mode is the default for this UI */
  defaultTheme?: Theme;
  /** localStorage key to persist preference */
  storageKey: string;
  /** Extra className to add to the wrapper div */
  className?: string;
  style?: React.CSSProperties;
}

/** Read theme from localStorage synchronously (safe: returns null on SSR) */
function getInitialTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  try {
    const saved = localStorage.getItem(storageKey) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return defaultTheme;
}

export function ThemeProvider({
  children,
  themeClass,
  defaultTheme = 'light',
  storageKey,
  className = '',
  style,
}: Props) {
  // Initialise directly from localStorage so there is no flash on mount
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme(storageKey, defaultTheme));
  const ref = useRef<HTMLDivElement>(null);

  // Apply data-theme attribute to scoped div + persist
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute('data-theme', theme);
    try { localStorage.setItem(storageKey, theme); } catch {}
  }, [theme, storageKey]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      <div ref={ref} className={`${themeClass} ${className}`} style={style}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/** Animated toggle button — reads from nearest ThemeProvider */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 select-none ${className}`}
      style={{
        background:  isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        color:       isDark ? '#e2e8f0' : '#475569',
        border:      isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
      }}
    >
      {/* Track */}
      <span
        className="relative inline-block w-8 h-[18px] rounded-full transition-colors duration-300 flex-shrink-0"
        style={{ background: isDark ? '#635bff' : '#94a3b8' }}
      >
        {/* Thumb */}
        <span
          className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-300"
          style={{ left: isDark ? '18px' : '2px' }}
        />
      </span>
      <span className="hidden sm:inline">{isDark ? 'Dark' : 'Light'}</span>
      <span>{isDark ? '🌙' : '☀️'}</span>
    </button>
  );
}