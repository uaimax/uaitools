/**
 * Design System - Cores
 * Dark theme padrão para Baú Mental Mobile
 */

export const colors = {
  // Backgrounds
  bg: {
    base: '#0D0D0F',
    elevated: '#18181B',
    overlay: '#27272A',
    surface: '#18181B', // Alias para elevated (compatibilidade)
  },

  // Primary (Gold/Treasure)
  primary: {
    default: '#D4AF37', // Gold
    hover: '#F4D03F',    // Light gold
    pressed: '#C9A961',  // Dark gold
  },

  // Text
  text: {
    primary: '#FAFAFA',
    secondary: '#A1A1AA',
    tertiary: '#71717A',
    onPrimary: '#0D0D0F', // Texto sobre fundo dourado (escuro para contraste)
  },

  // Semantic
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Recording states
  recording: {
    idle: '#D4AF37', // Gold (idle)
    active: '#EF4444', // Red (recording)
  },

  // Box colors (8 cores automáticas - tema tesouro)
  box: {
    1: '#D4AF37', // Gold
    2: '#CD7F32', // Bronze
    3: '#B87333', // Copper
    4: '#50C878', // Emerald
    5: '#F4D03F', // Light gold
    6: '#C9A961', // Dark gold
    7: '#DAA520', // Goldenrod
    8: '#FFD700', // Bright gold
  },
} as const;

export type ColorKey = keyof typeof colors;
export type BoxColorKey = keyof typeof colors.box;


