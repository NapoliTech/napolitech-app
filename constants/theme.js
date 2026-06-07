// Design System - Napolitech
// Nike-inspired: flat cards, pill buttons, bold typography, zero shadow

export const colors = {
  // Brand (preservado)
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F66',
  secondary: '#2D3436',
  secondaryLight: '#636E72',

  // Surfaces (Nike canvas/softCloud)
  background: '#FFFFFF',
  surface: '#FFFFFF',
  softCloud: '#F5F5F5',
  surfaceHover: '#F5F5F5',

  // Texto (ink puro)
  text: '#111111',
  textSecondary: '#6C757D',
  textMuted: '#9E9EA0',
  textInverse: '#FFFFFF',

  // Status (preservado)
  success: '#00C853',
  successLight: '#E8F5E9',
  warning: '#FFB300',
  warningLight: '#FFF8E1',
  error: '#FF3D00',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // Borders (hairline Nike-style)
  border: '#E5E5E5',
  borderFocus: '#FF6B35',
  hairline: '#E5E5E5',

  shadow: 'rgba(0, 0, 0, 0.06)',
  shadowDark: 'rgba(0, 0, 0, 0.10)',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 48,
};

// Nike: containers flat (sm=4), inputs moderate (md=8), buttons pill (full)
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 18,
  full: 9999,
};

export const typography = {
  // Display — grandes títulos editoriais
  display: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -1,
  },
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 35,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  utility: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
};

// Nike: sem sombras em cards — apenas hairline borders
// Shadows reservadas para modais e overlays
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

export default { colors, spacing, borderRadius, typography, shadows };
