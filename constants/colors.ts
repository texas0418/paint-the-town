// W4nder theme — midnight blue + warm amber.
// Light and dark palettes share token names so components written against one
// work in both. Use hooks/useTheme to get the active palette; the default
// export is the light palette for legacy screens.

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentDark: string;
  textOnPrimary: string; // secondary text on primary/gradient surfaces — light in BOTH modes
  success: string;
  successLight: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textLight: string;
  border: string;
  borderLight: string;
  overlay: string;
  overlayLight: string;
  cardShadow: string;
  gradient: {
    primary: [string, string];
    sunset: [string, string];
    ocean: [string, string];
    night: [string, string];
  };
}

export const lightColors: ThemeColors = {
  primary: '#27567F', // deep steel blue
  primaryLight: '#4A85B4',
  primaryDark: '#16344F',

  secondary: '#C9853F', // warm amber — CTAs
  secondaryLight: '#E0A86A',
  secondaryDark: '#A2691F',

  accent: '#E3EEF6', // ice blue — icon/selection tint
  accentDark: '#7FA5C0', // dusty steel — "why it matches" notes
  textOnPrimary: '#D6E4F0',

  success: '#3E7C57',
  successLight: '#66A07E',
  warning: '#D9A05B',
  error: '#C04A3A',

  background: '#F6F8FA', // cool off-white
  surface: '#FFFFFF',
  surfaceSecondary: '#EBF1F6',

  text: '#1A2530',
  textSecondary: '#596877',
  textTertiary: '#91A0AF',
  textLight: '#F7FAFC',

  border: '#DDE6ED',
  borderLight: '#EAF0F5',

  overlay: 'rgba(11, 21, 30, 0.5)',
  overlayLight: 'rgba(11, 21, 30, 0.3)',

  cardShadow: 'rgba(39, 86, 127, 0.08)',

  gradient: {
    primary: ['#27567F', '#4A85B4'],
    sunset: ['#C9853F', '#E0A86A'],
    ocean: ['#7FA5C0', '#E3EEF6'],
    night: ['#16344F', '#27567F'],
  },
};

export const darkColors: ThemeColors = {
  primary: '#3E76A6', // steel blue — filled controls on dark
  primaryLight: '#7FB3DA',
  // "dark variant" flips light on dark surfaces (used as text on accent tint)
  primaryDark: '#D6E7F4',

  secondary: '#CE9250',
  secondaryLight: '#E3AE73',
  secondaryDark: '#A2691F',

  accent: '#1E3242', // deep blue tint — icon/selection bg
  accentDark: '#8FB8D9',
  textOnPrimary: '#BCD4E8',

  success: '#6FA886',
  successLight: '#93C0A4',
  warning: '#E0AC6C',
  error: '#DB6B57',

  background: '#0F171F', // midnight
  surface: '#17222C',
  surfaceSecondary: '#1F2E3B',

  text: '#EDF3F8',
  textSecondary: '#A9BBCA',
  textTertiary: '#71869A',
  textLight: '#F7FAFC',

  border: '#2A3C4C',
  borderLight: '#223342',

  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  cardShadow: 'rgba(0, 0, 0, 0.4)',

  gradient: {
    primary: ['#16344F', '#2F6394'],
    sunset: ['#A2691F', '#CE9250'],
    ocean: ['#1E3242', '#33526B'],
    night: ['#0A1620', '#16344F'],
  },
};

// Legacy default: hidden/unconverted screens keep importing this statically.
const colors = lightColors;
export default colors;
