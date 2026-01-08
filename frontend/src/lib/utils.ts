/**
 * Utility functions
 *
 * Funções utilitárias comuns para o projeto.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS usando clsx e tailwind-merge
 *
 * Esta função é útil para combinar classes CSS condicionalmente
 * e resolver conflitos de classes do Tailwind CSS.
 *
 * @param inputs - Classes CSS a serem combinadas
 * @returns String com classes CSS combinadas
 *
 * @example
 * cn("text-red-500", condition && "font-bold", "p-4")
 * // Retorna: "text-red-500 font-bold p-4" se condition for true
 *
 * @example
 * cn("px-2 py-1", "px-4")
 * // Retorna: "py-1 px-4" (tailwind-merge resolve conflitos)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

