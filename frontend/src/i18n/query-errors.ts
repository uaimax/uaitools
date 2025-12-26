/** Helper para traduzir erros do TanStack Query/Axios. */

import i18next from "i18next";
import { AxiosError } from "axios";

/** Traduz erros do TanStack Query/Axios. */
export function translateQueryError(error: unknown): string {
  const t = i18next.t.bind(i18next);

  if (error instanceof AxiosError) {
    // Erro do backend (já traduzido pelo backend via gettext)
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    // Erro de rede
    if (error.code === "ERR_NETWORK" || error.message.includes("Network Error")) {
      return t("common:errors.network_error");
    }
  }

  // Erro genérico
  if (error instanceof Error) {
    return error.message;
  }

  return t("common:errors.unknown");
}



