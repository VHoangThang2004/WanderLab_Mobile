export const colors = {
  primary: '#ff3131',
  primaryEnd: '#ff914d',
  primaryGradient: ['#ff3131', '#ff5e3a', '#ff914d'] as const,

  // Light mode
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#F3F4F6',
  accent: '#FFF5F3',
  inputBg: '#F9FAFB',

  // Dark mode
  backgroundDark: '#030213',
  cardDark: '#1a1a2e',
  textDark: '#F9FAFB',
  textSecondaryDark: '#9CA3AF',
  borderDark: '#374151',
  accentDark: '#1f1020',
  inputBgDark: '#16162a',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Social
  google: '#4285F4',
  facebook: '#1877F2',

  // Trust score
  trustHigh: '#10B981',
  trustMedium: '#F59E0B',
  trustLow: '#EF4444',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
};

export const gradients = {
  primary: ['#ff3131', '#ff914d'] as [string, string],
  primaryVertical: ['#ff3131', '#ff5e3a', '#ff914d'] as [string, string, string],
  hero: ['#ff3131', '#ff5e3a', '#ff914d'] as [string, string, string],
  cardOverlay: ['transparent', 'rgba(0,0,0,0.7)'] as [string, string],
  darkBg: ['#030213', '#0f0f23'] as [string, string],
};
