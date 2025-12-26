/** Script de teste para validar funcionalidades de i18n. */

import i18next from "i18next";

/**
 * Valida se todas as traduções necessárias estão presentes.
 */
export function validateTranslations(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const languages = ["pt", "en"];
  const namespaces = ["common", "auth", "leads"];

  // Chaves obrigatórias por namespace
  const requiredKeys: Record<string, string[]> = {
    common: [
      "actions.save",
      "actions.cancel",
      "actions.delete",
      "actions.edit",
      "actions.create",
      "actions.update",
      "validation.required",
      "validation.invalid_email",
      "errors.unknown",
      "messages.loading",
    ],
    auth: [
      "title.login",
      "title.register",
      "fields.email",
      "fields.password",
      "buttons.login",
      "buttons.register",
      "toasts.login_success",
      "toasts.login_error",
    ],
    leads: [
      "title.leads",
      "title.create_lead",
      "fields.name",
      "fields.email",
      "status.new",
      "toasts.create_success",
    ],
  };

  for (const lang of languages) {
    for (const ns of namespaces) {
      const keys = requiredKeys[ns] || [];
      for (const key of keys) {
        const fullKey = `${ns}:${key}`;
        const translation = i18next.t(fullKey, { lng: lang, ns });

        // Se a tradução retornar a própria chave, significa que não foi encontrada
        if (translation === fullKey || translation === key) {
          errors.push(`Missing translation: ${fullKey} for language ${lang}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Testa mudança de idioma.
 */
export function testLanguageChange(): boolean {
  const originalLang = i18next.language;

  try {
    // Testar mudança para inglês
    i18next.changeLanguage("en");
    if (i18next.language !== "en") {
      console.error("Failed to change language to en");
      return false;
    }

    // Testar mudança para português
    i18next.changeLanguage("pt");
    const ptLang = i18next.language;
    // Aceitar "pt" ou variações como "pt-BR"
    if (!ptLang.startsWith("pt")) {
      console.error("Failed to change language to pt");
      return false;
    }

    // Restaurar idioma original
    i18next.changeLanguage(originalLang);
    return true;
  } catch (error) {
    console.error("Error testing language change:", error);
    return false;
  }
}

/**
 * Testa fallback quando tradução não existe.
 */
export function testFallback(): boolean {
  try {
    // Tentar traduzir uma chave que não existe
    const translation = i18next.t("nonexistent:key", {
      fallbackLng: "pt",
      defaultValue: "Fallback text"
    });

    // Deve retornar o defaultValue ou a chave
    return translation === "Fallback text" || translation === "nonexistent:key";
  } catch (error) {
    console.error("Error testing fallback:", error);
    return false;
  }
}

/**
 * Executa todos os testes de i18n.
 */
export function runI18nTests(): {
  allPassed: boolean;
  results: {
    translations: boolean;
    languageChange: boolean;
    fallback: boolean;
  };
  errors: string[];
} {
  console.log("🧪 Running i18n tests...");

  const translationTest = validateTranslations();
  const languageChangeTest = testLanguageChange();
  const fallbackTest = testFallback();

  const allPassed =
    translationTest.valid &&
    languageChangeTest &&
    fallbackTest;

  const results = {
    translations: translationTest.valid,
    languageChange: languageChangeTest,
    fallback: fallbackTest,
  };

  if (allPassed) {
    console.log("✅ All i18n tests passed!");
  } else {
    console.error("❌ Some i18n tests failed");
    if (translationTest.errors.length > 0) {
      console.error("Translation errors:", translationTest.errors);
    }
  }

  return {
    allPassed,
    results,
    errors: translationTest.errors,
  };
}

