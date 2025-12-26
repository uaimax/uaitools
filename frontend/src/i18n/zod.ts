/** Helper para obter mensagens de validação Zod traduzidas. */

import i18next from "i18next";

/** Retorna mensagens de validação traduzidas para usar em schemas Zod. */
export function getZodMessages() {
  const t = i18next.t.bind(i18next);

  return {
    required: () => t("common:validation.required"),
    invalidEmail: () => t("common:validation.invalid_email"),
    minLength: (min: number) => t("common:validation.min_length", { min }),
    maxLength: (max: number) => t("common:validation.max_length", { max }),
    passwordMin: (min: number = 8) => t("common:validation.min_length", { min }),
    passwordMismatch: () => t("common:validation.password_mismatch"),
    invalid: () => t("common:validation.invalid"),
  };
}

