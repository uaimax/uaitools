/**
 * Design System - Tipografia
 * Escala tipográfica usando fontes nativas do sistema
 */

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontWeight: '700' as const,
  },
  title1: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
    fontWeight: '600' as const,
  },
  title2: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
    fontWeight: '600' as const,
  },
  title3: {
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
    fontWeight: '400' as const,
  },
  captionSmall: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    fontWeight: '500' as const,
  },
  // Aliases para compatibilidade
  headline6: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
    fontWeight: '600' as const,
  },
  headline4: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  },
} as const;

export type TypographyKey = keyof typeof typography;


