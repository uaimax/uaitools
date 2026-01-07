/**
 * Design System - Animações
 * Curvas de easing e durações
 */

export const easing = {
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

export const duration = {
  instant: 50,
  fast: 150,
  normal: 250,
  slow: 400,
  slower: 600,
} as const;

export type EasingKey = keyof typeof easing;
export type DurationKey = keyof typeof duration;


