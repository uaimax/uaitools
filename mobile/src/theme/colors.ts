/**
 * Design System - Cores
 * Dark theme padrão para SupBrainNote Mobile
 */

export const colors = {
  // Backgrounds
  bg: {
    base: '#0D0D0F',
    elevated: '#18181B',
    overlay: '#27272A',
  },

  // Primary (Indigo)
  primary: {
    default: '#6366F1',
    hover: '#818CF8',
    pressed: '#4F46E5',
  },

  // Text
  text: {
    primary: '#FAFAFA',
    secondary: '#A1A1AA',
    tertiary: '#71717A',
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
    idle: '#6366F1',
    active: '#EF4444',
  },

  // Box colors (8 cores automáticas)
  box: {
    1: '#6366F1', // Indigo
    2: '#8B5CF6', // Violet
    3: '#EC4899', // Pink
    4: '#F59E0B', // Amber
    5: '#10B981', // Emerald
    6: '#06B6D4', // Cyan
    7: '#3B82F6', // Blue
    8: '#F43F5E', // Rose
  },
} as const;

export type ColorKey = keyof typeof colors;
export type BoxColorKey = keyof typeof colors.box;


