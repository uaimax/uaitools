/**
 * Design System - Espaçamento
 * Sistema baseado em múltiplos de 4px
 */

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Helper para obter valor de espaçamento
 */
export const getSpacing = (key: SpacingKey): number => spacing[key];

