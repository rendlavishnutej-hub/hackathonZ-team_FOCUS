/**
 * FOCUS Design System - Theme Tokens
 * This file serves as the single source of truth for design tokens.
 * All styling (colors, spacing, typography, etc.) should match these tokens.
 */

export const DESIGN_TOKENS = {
  colors: {
    bgBase: '#0A0A0F',
    bgSurface: '#13131A',
    bgGlass: 'rgba(255, 255, 255, 0.04)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#F5F5F7',
    textSecondary: '#9C9CA8',
    accentStart: '#7C5CFF', // Violet
    accentEnd: '#22D3D0', // Teal
    success: '#3DD68C',
    warning: '#F5B942',
    error: '#F1583D',
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
