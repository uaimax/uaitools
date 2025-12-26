/** Helper para traduzir erros do TanStack Query/Axios. */

import i18next from "i18next";
import { AxiosError } from "axios";

/** Traduz erros do TanStack Query/Axios em mensagens amigáveis. */
export function translateQueryError(error: unknown): string {
  const t = i18next.t.bind(i18next);

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const errorData = error.response?.data;

    // Prioridade 1: Mensagem específica do backend (já traduzida)
    if (errorData?.error) {
      return errorData.error;
    }
    if (errorData?.detail) {
      return errorData.detail;
    }
    if (errorData?.non_field_errors) {
      const errors = Array.isArray(errorData.non_field_errors)
        ? errorData.non_field_errors
        : [errorData.non_field_errors];
      return errors.join(", ");
    }

    // Prioridade 2: Mensagens baseadas no código de status HTTP
    if (status) {
      switch (status) {
        case 400:
          return t("auth:messages.validation_error", {
            defaultValue: t("common:errors.unknown"),
          });
        case 401:
          // Verificar se é erro de login específico
          if (errorData?.error) {
            return errorData.error;
          }
          return t("auth:messages.invalid_credentials", {
            defaultValue: t("common:errors.unauthorized"),
          });
        case 403:
          return t("auth:messages.forbidden", {
            defaultValue: t("common:errors.forbidden"),
          });
        case 404:
          return t("auth:messages.not_found", {
            defaultValue: t("common:errors.not_found"),
          });
        case 500:
        case 502:
        case 503:
          return t("auth:messages.server_error", {
            defaultValue: t("common:errors.server_error"),
          });
        default:
          // Para outros códigos de status, usar mensagem genérica
          if (status >= 500) {
            return t("auth:messages.server_error", {
              defaultValue: t("common:errors.server_error"),
            });
          }
      }
    }

    // Prioridade 3: Erros de rede/timeout
    if (error.code === "ERR_NETWORK" || error.message.includes("Network Error")) {
      return t("auth:messages.network_error", {
        defaultValue: t("common:errors.network_error"),
      });
    }
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return t("auth:messages.timeout_error", {
        defaultValue: "A requisição demorou muito para responder. Tente novamente.",
      });
    }

    // Prioridade 4: Mensagem do erro original (se for amigável)
    if (error.message && !error.message.includes("status code")) {
      return error.message;
    }
  }

  // Erro genérico
  if (error instanceof Error) {
    // Se a mensagem contém "status code", usar mensagem genérica traduzida
    if (error.message.includes("status code")) {
      return t("auth:messages.login_failed", {
        defaultValue: t("common:errors.unknown"),
      });
    }
    return error.message;
  }

  return t("common:errors.unknown");
}

/** Obtém mensagem de erro amigável para erros de autenticação. */
export function getAuthErrorMessage(error: unknown): string {
  const t = i18next.t.bind(i18next);

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const errorData = error.response?.data;

    // Mensagem específica do backend
    if (errorData?.error) {
      // Mapear mensagens específicas do backend para mensagens amigáveis
      if (errorData.error.includes("Credenciais inválidas") || errorData.error.includes("Invalid credentials")) {
        return t("auth:messages.invalid_credentials");
      }
      if (errorData.error.includes("Usuário inativo") || errorData.error.includes("User inactive")) {
        return t("auth:messages.user_inactive");
      }
      return errorData.error;
    }

    // Mensagem baseada no status
    if (status === 401) {
      return t("auth:messages.invalid_credentials");
    }
  }

  // Usar função genérica como fallback
  return translateQueryError(error);
}



