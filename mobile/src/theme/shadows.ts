/**
 * Design System - Sombras e Elevação
 * Dark theme usa bordas sutis ao invés de sombras tradicionais
 */

export const elevation = {
  0: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  1: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  2: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 2,
  },
  3: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export type ElevationKey = keyof typeof elevation;

