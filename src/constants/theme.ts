/**
 * Vaultix Design System & Theme Tokens
 * Based on PRD Section 6.2 & 6.3
 */

export const Colors = {
  primary: '#17243A',
  secondary: '#263750',
  accent: '#4C8DDF',
  background: '#000000',
  surface: '#131A26',
  surfaceLight: '#1C2638',
  border: '#233045',
  borderFocus: '#4C8DDF',

  // Status colors
  success: '#35B779',
  warning: '#F0B64D',
  error: '#E45B63',

  // Typography colors
  textPrimary: '#FFFFFF',
  textSecondary: '#AAB8CA',
  textMuted: '#6B7A90',

  // Overlay & Alpha
  overlay: 'rgba(0, 0, 0, 0.85)',
  cardBorder: 'rgba(76, 141, 223, 0.15)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Typography = {
  fontFamily: 'Inter',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;
