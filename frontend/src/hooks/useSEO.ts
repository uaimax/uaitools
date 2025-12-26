/** Hook para gerenciar SEO dinâmico (título e meta description). */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth-store";

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noindex?: boolean;
}

/**
 * Hook para gerenciar SEO dinâmico.
 *
 * Atualiza automaticamente:
 * - <title>
 * - <meta name="description">
 * - <meta name="keywords">
 * - Open Graph tags
 * - Twitter Card tags
 * - robots meta tag
 *
 * @param config - Configuração de SEO
 * @param dynamicData - Dados dinâmicos para interpolação (ex: { name: "Lead Name" })
 */
export function useSEO(config: SEOConfig, dynamicData?: Record<string, string | number | undefined>) {
  const { t, i18n } = useTranslation(["common", "seo"]);
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    // Função para interpolar variáveis em strings
    const interpolate = (str: string, data?: Record<string, string | number | undefined>): string => {
      if (!data) return str;
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key]?.toString() || match;
      });
    };

    // Obter valores padrão
    const defaultTitle = t("seo:default.title", { defaultValue: "SaaS Bootstrap" });
    const defaultDescription = t("seo:default.description", {
      defaultValue: "Plataforma SaaS completa para gerenciamento de negócios",
    });
    const siteName = t("seo:site_name", { defaultValue: "SaaS Bootstrap" });

    // Construir título
    let title = config.title || defaultTitle;
    if (dynamicData) {
      title = interpolate(title, dynamicData);
    }

    // Adicionar nome do site se não estiver incluído
    if (!title.includes(siteName)) {
      title = `${title} | ${siteName}`;
    }

    // Construir descrição
    let description = config.description || defaultDescription;
    if (dynamicData) {
      description = interpolate(description, dynamicData);
    }

    // Construir keywords
    let keywords = config.keywords || "";
    if (dynamicData && keywords) {
      keywords = interpolate(keywords, dynamicData);
    }

    // Construir URL completa
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const currentUrl = `${baseUrl}${location.pathname}${location.search}`;

    // Atualizar <title>
    document.title = title;

    // Atualizar ou criar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    // Atualizar ou criar meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", keywords);
    }

    // Open Graph tags
    const ogTitle = config.ogTitle || title;
    const ogDescription = config.ogDescription || description;
    const ogImage = config.ogImage || `${baseUrl}/og-image.png`;
    const ogType = config.ogType || "website";

    const updateOrCreateMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateOrCreateMeta("og:title", ogTitle);
    updateOrCreateMeta("og:description", ogDescription);
    updateOrCreateMeta("og:image", ogImage);
    updateOrCreateMeta("og:type", ogType);
    updateOrCreateMeta("og:url", currentUrl);
    updateOrCreateMeta("og:site_name", siteName);
    updateOrCreateMeta("og:locale", i18n.language);

    // Twitter Card tags
    const twitterCard = config.twitterCard || "summary_large_image";
    const updateOrCreateMetaName = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateOrCreateMetaName("twitter:card", twitterCard);
    updateOrCreateMetaName("twitter:title", ogTitle);
    updateOrCreateMetaName("twitter:description", ogDescription);
    updateOrCreateMetaName("twitter:image", ogImage);

    // Robots meta tag
    if (config.noindex) {
      let metaRobots = document.querySelector('meta[name="robots"]');
      if (!metaRobots) {
        metaRobots = document.createElement("meta");
        metaRobots.setAttribute("name", "robots");
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute("content", "noindex, nofollow");
    } else {
      // Remover noindex se existir
      const metaRobots = document.querySelector('meta[name="robots"]');
      if (metaRobots && metaRobots.getAttribute("content")?.includes("noindex")) {
        metaRobots.setAttribute("content", "index, follow");
      }
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl);

    // Language
    const html = document.documentElement;
    html.setAttribute("lang", i18n.language);

    // Cleanup function (opcional, mas não necessário pois queremos manter as tags)
  }, [config, dynamicData, location, t, i18n, user]);
}

