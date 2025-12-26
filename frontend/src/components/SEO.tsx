/** Componente wrapper para usar useSEO de forma declarativa. */

import { useSEO } from "@/hooks/useSEO";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noindex?: boolean;
  dynamicData?: Record<string, string | number | undefined>;
}

/**
 * Componente para gerenciar SEO de forma declarativa.
 *
 * @example
 * ```tsx
 * <SEO
 *   title="Página de Leads"
 *   description="Gerencie seus leads de forma eficiente"
 *   keywords="leads, crm, vendas"
 *   dynamicData={{ leadName: "João Silva" }}
 * />
 * ```
 */
export function SEO({ dynamicData, ...config }: SEOProps) {
  useSEO(config, dynamicData);
  return null; // Componente não renderiza nada
}

