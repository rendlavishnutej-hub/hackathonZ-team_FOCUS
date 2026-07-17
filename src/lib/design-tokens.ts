/**
 * FOCUS Design System - Theme Tokens
 * This file serves as the single source of truth for design tokens.
 * All styling (colors, spacing, typography, etc.) should match these tokens.
 */

export const DESIGN_TOKENS = {
  colors: {
    cream: '#fef9f2',
    primary: '#000000',
    onPrimary: '#ffffff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f8f3ec',
    surfaceContainer: '#f2ede6',
    surfaceContainerHigh: '#ece7e1',
    surfaceVariant: '#e6e2db',
    onSurface: '#1d1c18',
    onSurfaceVariant: '#45464d',
    outline: '#76777d',
    outlineVariant: '#c6c6cd',
    accentYellow: '#ffe24c',
    accentBlue: '#bec6e0',
    accentPink: '#ffafd3',
    accentGreen: '#86efac',
    accentPurple: '#d3579a',
    bgBase: '#fef9f2',
    bgSurface: '#ffffff',
    bgGlass: 'rgba(255, 255, 255, 0.7)',
    borderSubtle: '#e6e2db',
    textPrimary: '#1d1c18',
    textSecondary: '#45464d',
    accentStart: '#bec6e0',
    accentEnd: '#7c839b',
    success: '#16a34a',
    warning: '#b45309',
    error: '#dc2626',
  },
  fonts: {
    display: 'var(--font-display)', // Anton
    body: 'var(--font-body)', // Inter
    mono: 'var(--font-mono)', // JetBrains Mono
  },
  spacing: {
    base: '4px',
    scale: {
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '24px',
      6: '32px',
      7: '48px',
      8: '64px',
      9: '96px',
    },
  },
  radius: {
    small: '8px',
    medium: '16px',
    large: '24px',
  },
  shadows: {
    colored: '0 8px 32px rgba(124, 92, 255, 0.12)',
  },
  motion: {
    durations: {
      micro: 150,
      panel: 300,
      page: 500,
    },
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // expo-out
  },
};
