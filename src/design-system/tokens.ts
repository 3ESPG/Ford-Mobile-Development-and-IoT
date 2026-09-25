/**
 * Ford Service Pulse — Design Tokens
 *
 * Fonte única de verdade para cor, tipografia, espaçamento, raio, elevação e movimento.
 * Nomenclatura em 3 níveis (Aula MDI 15 — Design Tokens):
 *   1. palette  → valores brutos (primitivos) da marca
 *   2. colors   → tokens semânticos (o "papel" da cor na interface)
 *   3. componentes consomem apenas tokens semânticos, nunca hex solto.
 */

export const palette = {
  // Azul Ford — cor primária da marca
  fordBlue900: "#00052E",
  fordBlue800: "#00095B",
  fordBlue700: "#0A1F7A",
  fordBlue600: "#133A9A",
  // Azul de interação (CTAs, links, foco)
  bright600: "#0562D2",
  bright500: "#066FEF",
  bright100: "#E3EEFE",
  bright50: "#F1F6FF",
  // Azul-céu (dados secundários / gráficos)
  sky500: "#2D96CD",
  sky100: "#DDF0FA",
  // Neutros
  white: "#FFFFFF",
  gray25: "#F7F8FB",
  gray50: "#F1F3F8",
  gray100: "#E6EAF2",
  gray200: "#D4DAE6",
  gray400: "#8F98AE",
  gray500: "#6B7590",
  gray700: "#3A4460",
  gray900: "#0B1330",
  // Semânticas
  green600: "#0B7A53",
  green100: "#DDF3EA",
  amber600: "#B86B00",
  amber100: "#FDF0D9",
  red600: "#C8231A",
  red100: "#FCE4E2",
  violet600: "#5B3CC4",
  violet100: "#ECE7FB"
} as const;

export const colors = {
  // Marca
  brand: palette.fordBlue800,
  brandDeep: palette.fordBlue900,
  brandMid: palette.fordBlue700,
  accent: palette.bright500,
  accentPressed: palette.bright600,
  accentSoft: palette.bright100,
  accentSubtle: palette.bright50,
  sky: palette.sky500,
  skySoft: palette.sky100,

  // Superfícies
  background: palette.gray25,
  surface: palette.white,
  surfaceMuted: palette.gray50,
  surfaceInverse: palette.fordBlue800,
  border: palette.gray100,
  borderStrong: palette.gray200,

  // Texto
  textPrimary: palette.gray900,
  textSecondary: palette.gray700,
  textMuted: palette.gray500,
  textDisabled: palette.gray400,
  textOnBrand: palette.white,
  textOnBrandMuted: "rgba(255,255,255,0.72)",

  // Estados / feedback
  success: palette.green600,
  successSoft: palette.green100,
  warning: palette.amber600,
  warningSoft: palette.amber100,
  danger: palette.red600,
  dangerSoft: palette.red100,
  info: palette.bright500,
  infoSoft: palette.bright100,
  iot: palette.violet600,
  iotSoft: palette.violet100,

  overlay: "rgba(0, 5, 46, 0.55)"
} as const;

export type Tone = "brand" | "accent" | "success" | "warning" | "danger" | "info" | "neutral" | "iot";

export const toneColors: Record<Tone, { fg: string; bg: string }> = {
  brand: { fg: colors.brand, bg: colors.accentSubtle },
  accent: { fg: colors.accent, bg: colors.accentSoft },
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
  neutral: { fg: colors.textSecondary, bg: colors.surfaceMuted },
  iot: { fg: colors.iot, bg: colors.iotSoft }
};

/** Gradiente do cabeçalho (hero) — azul Ford profundo → azul Ford */
export const gradients = {
  hero: [palette.fordBlue900, palette.fordBlue800, palette.fordBlue700] as const,
  accent: [palette.bright600, palette.bright500] as const
};

/** Escala de 4pt */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999
} as const;

export const fonts = {
  display: "Barlow_700Bold",
  displaySemi: "Barlow_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold"
} as const;

/** Escala tipográfica — cada variante define família, tamanho e altura de linha */
export const typography = {
  displayXL: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
  displayL: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 },
  displayM: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.2 },
  titleL: { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 26 },
  titleM: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  titleS: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  bodySmStrong: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14, letterSpacing: 1.1, textTransform: "uppercase" as const },
  metric: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32 },
  metricS: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  button: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 }
} as const;

export type TypographyVariant = keyof typeof typography;

export const elevation = {
  none: {},
  sm: {
    shadowColor: palette.fordBlue900,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  md: {
    shadowColor: palette.fordBlue900,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  lg: {
    shadowColor: palette.fordBlue900,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10
  }
} as const;

export const motion = {
  fast: 120,
  base: 220,
  slow: 360
} as const;

/** Área mínima de toque recomendada (Material/HIG) */
export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const touchTarget = 44;
