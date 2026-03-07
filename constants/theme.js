// Design System - Napolitech
// Tema moderno estilo SaaS

export const colors = {
  // Cores primárias
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F66',

  // Cores secundárias
  secondary: '#2D3436',
  secondaryLight: '#636E72',

  // Background
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceHover: '#F8F9FA',

  // Texto
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  textMuted: '#ADB5BD',
  textInverse: '#FFFFFF',

  // Status
  success: '#00C853',
  successLight: '#E8F5E9',
  warning: '#FFB300',
  warningLight: '#FFF8E1',
  error: '#FF3D00',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',

  // Borders
  border: '#E9ECEF',
  borderFocus: '#FF6B35',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
  },
  small: {
    fontSize: 14,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
  },
};

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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};
