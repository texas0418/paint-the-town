import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from '@/constants/colors';

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

/** Active theme, following the system light/dark setting. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
