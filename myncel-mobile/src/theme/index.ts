/**
 * Myncel mobile theme — mirrors the Stripe-inspired palette from the web app.
 * Single source of truth for colors, spacing, typography, and shadows.
 */

export const colors = {
  // Brand
  primary: '#635bff',
  primaryDark: '#4f46e5',
  primaryLight: '#a5a1ff',
  primaryBg: 'rgba(99, 91, 255, 0.10)',

  // Text
  text: '#0a2540',
  textSecondary: '#425466',
  textMuted: '#8898aa',
  textOnPrimary: '#ffffff',

  // Surfaces
  bg: '#ffffff',
  bgPage: '#f6f9fc',
  bgSurface: '#ffffff',
  bgSurface2: '#f0f4f8',
  bgSidebar: '#ffffff',

  // Borders
  border: '#e6ebf1',
  borderLight: '#f0f4f8',

  // Semantic
  success: '#09825d',
  successLight: '#cbf4c9',
  successBg: '#ecfdf5',
  warning: '#c44b00',
  warningBg: '#fff7ed',
  danger: '#cd3d64',
  dangerBg: '#fef2f2',
  info: '#0570de',
  infoBg: '#eff6ff',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Status badge colors
  status: {
    open: { bg: '#dbeafe', text: '#1d4ed8' },
    inProgress: { bg: '#ede9fe', text: '#6d28d9' },
    onHold: { bg: '#fef3c7', text: '#b45309' },
    completed: { bg: '#d1fae5', text: '#047857' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280' },
  },

  // Priority badge colors
  priority: {
    critical: { bg: '#fee2e2', text: '#b91c1c' },
    high: { bg: '#ffedd5', text: '#c2410c' },
    medium: { bg: '#fef3c7', text: '#b45309' },
    low: { bg: '#f3f4f6', text: '#6b7280' },
  },

  // Severity (alerts)
  severity: {
    critical: { bg: '#fee2e2', text: '#b91c1c' },
    high: { bg: '#ffedd5', text: '#c2410c' },
    medium: { bg: '#fef3c7', text: '#b45309' },
    low: { bg: '#dbeafe', text: '#1d4ed8' },
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,

  // Font weights (cross-platform safe)
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
};

export const theme: Theme = { colors, spacing, radius, typography, shadows };
