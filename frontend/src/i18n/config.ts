/** Configuração do i18next para internacionalização. */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Importar traduções comuns (nível projeto)
import ptCommon from "../locales/pt/common.json";
import enCommon from "../locales/en/common.json";
import ptSEO from "../locales/pt/seo.json";
import enSEO from "../locales/en/seo.json";

// Importar traduções de módulos (dentro de cada módulo)
import ptAuth from "../features/auth/locales/pt.json";
import enAuth from "../features/auth/locales/en.json";
import ptLeads from "../features/leads/locales/pt.json";
import enLeads from "../features/leads/locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        common: ptCommon,
        seo: ptSEO,
        auth: ptAuth,
        leads: ptLeads,
      },
      en: {
        common: enCommon,
        seo: enSEO,
        auth: enAuth,
        leads: enLeads,
      },
    },
    fallbackLng: "pt",
    defaultNS: "common",
    ns: ["common", "seo", "auth", "leads"],
    fallbackNS: ["common"],
    interpolation: {
      escapeValue: false, // React já escapa valores
    },
    detection: {
      // Ordem de detecção: localStorage > navigator > fallback
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;



