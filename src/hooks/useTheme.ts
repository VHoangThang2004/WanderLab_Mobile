import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { colors as baseColors, gradients as baseGradients } from '../theme/colors';

export function useTheme() {
  const { mode } = useThemeStore();
  const systemColorScheme = useColorScheme();

  const isDarkMode = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  const themeColors = {
    primary: baseColors.primary,
    primaryEnd: baseColors.primaryEnd,
    primaryGradient: baseColors.primaryGradient,
    
    background: isDarkMode ? baseColors.backgroundDark : baseColors.background,
    card: isDarkMode ? baseColors.cardDark : baseColors.card,
    text: isDarkMode ? baseColors.textDark : baseColors.text,
    textSecondary: isDarkMode ? baseColors.textSecondaryDark : baseColors.textSecondary,
    textTertiary: baseColors.textTertiary,
    border: isDarkMode ? baseColors.borderDark : baseColors.border,
    accent: isDarkMode ? baseColors.accentDark : baseColors.accent,
    inputBg: isDarkMode ? baseColors.inputBgDark : baseColors.inputBg,

    success: baseColors.success,
    warning: baseColors.warning,
    error: baseColors.error,
    info: baseColors.info,

    google: baseColors.google,
    facebook: baseColors.facebook,

    trustHigh: baseColors.trustHigh,
    trustMedium: baseColors.trustMedium,
    trustLow: baseColors.trustLow,

    overlay: baseColors.overlay,
    overlayLight: baseColors.overlayLight,
  };

  const themeGradients = {
    ...baseGradients,
  };

  return { colors: themeColors, gradients: themeGradients, isDarkMode };
}
