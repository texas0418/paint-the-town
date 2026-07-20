// W4nder theme — warm & moody.
// Wine + terracotta + champagne. Light and dark palettes share token names so
// components written against one work in both. Use hooks/useTheme to get the
// active palette; the default export is the light palette for legacy screens.

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentDark: string;
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
  primary: '#6E2B43', // deep wine
  primaryLight: '#9C4A66',
  primaryDark: '#471A2C',

  secondary: '#C96F4A', // terracotta — CTAs
  secondaryLight: '#E39A6F',
  secondaryDark: '#A55234',

  accent: '#F5E3DA', // blush cream — icon/selection tint
  accentDark: '#B9808F', // dusty rose — "why it matches" notes

  success: '#4A7C59',
  successLight: '#6FA07E',
  warning: '#D9A05B',
  error: '#B93A3A',

  background: '#FAF3ED', // warm cream
  surface: '#FFFDFB',
  surfaceSecondary: '#F3E9E1',

  text: '#2B1E23',
  textSecondary: '#6F5A61',
  textTertiary: '#A08A90',
  textLight: '#FFF9F5',

  border: '#EADBD2',
  borderLight: '#F3EAE3',

  overlay: 'rgba(23, 12, 17, 0.5)',
  overlayLight: 'rgba(23, 12, 17, 0.3)',

  cardShadow: 'rgba(110, 43, 67, 0.08)',

  gradient: {
    primary: ['#6E2B43', '#9C4A66'],
    sunset: ['#C96F4A', '#E39A6F'],
    ocean: ['#B9808F', '#F5E3DA'],
    night: ['#471A2C', '#6E2B43'],
  },
};

export const darkColors: ThemeColors = {
  primary: '#A64D68', // rose wine — filled controls on dark
  primaryLight: '#D98CA4',
  // "dark variant" flips light on dark surfaces (used as text on accent tint)
  primaryDark: '#F0D4DD',

  secondary: '#C97A52',
  secondaryLight: '#E3A587',
  secondaryDark: '#A55234',

  accent: '#3C2A33', // plum tint — icon/selection bg
  accentDark: '#D9A5B5',

  success: '#7FB08F',
  successLight: '#9CC4A8',
  warning: '#E0AC6C',
  error: '#E06553',

  background: '#1B1216', // plum black
  surface: '#251A21',
  surfaceSecondary: '#2F2229',

  text: '#F5EAE6',
  textSecondary: '#C9B4BC',
  textTertiary: '#93808A',
  textLight: '#FFF9F5',

  border: '#3D2D36',
  borderLight: '#332631',

  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  cardShadow: 'rgba(0, 0, 0, 0.4)',

  gradient: {
    primary: ['#471A2C', '#8E3B55'],
    sunset: ['#A55234', '#C97A52'],
    ocean: ['#3C2A33', '#5C3F4D'],
    night: ['#12090D', '#471A2C'],
  },
};

// Legacy default: hidden/unconverted screens keep importing this statically.
const colors = lightColors;
export default colors;
