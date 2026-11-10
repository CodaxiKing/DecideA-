/**
 * Design tokens do DecideAí. Fonte: design/canvas/app.css.
 * Nenhuma tela deve usar cor, raio ou espaço fora daqui.
 */

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  blue: string;
  onBlue: string;
  lilac: string;
  onLilac: string;
  sky: string;
  danger: string;
  scrim: string;
}

export const colors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#F8F6FF',
    surface: '#EDE8FD',
    surfaceStrong: '#DCD3FB',
    text: '#1B1036',
    textMuted: '#574C74',
    primary: '#5A2BE0',
    onPrimary: '#FFFFFF',
    primarySoft: '#DCD3FB',
    blue: '#2159DB',
    onBlue: '#FFFFFF',
    lilac: '#B9A2FF',
    onLilac: '#1B1036',
    sky: '#C9DCFF',
    danger: '#B4233F',
    scrim: 'rgba(20,10,45,0.55)',
  },
  dark: {
    background: '#110B20',
    surface: '#1F1736',
    surfaceStrong: '#32274F',
    text: '#F4F0FF',
    textMuted: '#BBB1D6',
    primary: '#9478FF',
    onPrimary: '#140B2A',
    primarySoft: '#352863',
    blue: '#74A1FF',
    onBlue: '#0D1A3A',
    lilac: '#B9A2FF',
    onLilac: '#1B1036',
    sky: '#23375F',
    danger: '#FF8FA5',
    scrim: 'rgba(0,0,0,0.65)',
  },
};

/** Cores fixas da roda da marca, iguais nos dois temas. */
export const wheelColors = ['#5A2BE0', '#B9A2FF', '#2159DB', '#C9DCFF', '#1B1036', '#8E6CF5'] as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 20, xl: 24 } as const;

export const radius = { sm: 16, md: 24, lg: 32, pill: 999 } as const;

/** Alvo de toque mínimo (requisito de acessibilidade do plano). */
export const minTouch = 44;

export const fontFamily = {
  display: 'BricolageGrotesque_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemiBold: 'Figtree_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.display, fontSize: 48, lineHeight: 50, letterSpacing: -1.2 },
  title1: { fontFamily: fontFamily.display, fontSize: 36, lineHeight: 38, letterSpacing: -0.9 },
  title2: { fontFamily: fontFamily.display, fontSize: 26, lineHeight: 28, letterSpacing: -0.65 },
  title3: { fontFamily: fontFamily.display, fontSize: 20, lineHeight: 22, letterSpacing: -0.5 },
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fontFamily.bodySemiBold, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20 },
  smallStrong: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, lineHeight: 16 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Sombra só para o que flutua (modal e folha inferior). */
export const floatingShadow = {
  shadowColor: '#140A2D',
  shadowOpacity: 0.28,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: -6 },
  elevation: 12,
} as const;

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
}

export function buildTheme(scheme: ColorScheme): Theme {
  return { scheme, colors: colors[scheme] };
}
