/** Configuração do cliente HTTP para API. */

import axios from "axios";
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";

/** URL base da API.
 *
 * Em desenvolvimento: usa VITE_API_URL do .env (deve incluir /v1 se for URL completa)
 * Em produção (junto): '/api/v1' (relativo, versionado)
 * Em produção (separado): VITE_API_URL do .env (deve incluir /v1)
 *
 * Garante que sempre termina com /v1 se for URL completa, ou usa /api/v1 se relativo
 */
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;

  if (!envUrl) {
    // Sem VITE_API_URL: usa relativo /api/v1
    return "/api/v1";
  }

  // Se é URL completa (http://...)
  if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) {
    // Remove trailing slash e garante que termina com /v1
    const cleanUrl = envUrl.replace(/\/$/, "");
    if (cleanUrl.endsWith("/v1")) {
      return cleanUrl;
    }
    // Se não termina com /v1, adiciona
    return `${cleanUrl}/v1`;
  }

  // Se é relativo, garante que começa com / e termina com /v1
  const cleanUrl = envUrl.startsWith("/") ? envUrl : `/${envUrl}`;
  if (cleanUrl.endsWith("/v1")) {
    return cleanUrl;
  }
  return cleanUrl.endsWith("/") ? `${cleanUrl}v1` : `${cleanUrl}/v1`;
};

const API_URL = getApiUrl();

/** Cliente HTTP configurado para API do backend.
 *
 * Características:
 * - Base URL configurável via variável de ambiente
 * - Credenciais incluídas (cookies/sessão)
 * - Timeout de 30 segundos
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Para cookies/sessão Django
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Interceptador de requisições para adicionar header X-Workspace-ID, JWT e CSRF token. */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Adicionar header X-Workspace-ID se disponível
    let workspaceId = localStorage.getItem("workspace_id");

    // Apenas limpar valores vazios (não validar slugs - o backend valida)
    if (workspaceId && workspaceId.length < 1) {
      console.warn("apiClient: valor vazio detectado no localStorage:", workspaceId, "- limpando...")
      localStorage.removeItem("workspace_id");
      workspaceId = null;
    }

    if (workspaceId && config.headers) {
      config.headers["X-Workspace-ID"] = workspaceId;
      console.log("apiClient: enviando X-Workspace-ID =", workspaceId, "para", config.url)
    } else {
      console.log("apiClient: SEM X-Workspace-ID (workspace_id não encontrado no localStorage)")
    }

    // Adicionar JWT token se disponível (prioridade sobre session)
    const accessToken = localStorage.getItem("access_token");
    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Obter CSRF token dos cookies (se disponível e não usando JWT)
    if (!accessToken && config.headers) {
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1];

      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/** Interceptador de respostas para tratamento de erros. */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Tratamento de erros comuns
    if (error.response?.status === 401) {
      // Não autenticado - limpar dados
      localStorage.removeItem("workspace_id");
      localStorage.removeItem("access_token");
      // Redirecionamento será feito pelo componente ProtectedRoute
    }
    if (error.response?.status === 403) {
      // Não autorizado
      console.error("Acesso negado:", error.response.data);
    }
    if (error.response?.status === 500) {
      // Erro interno - pode ser workspace inválido no localStorage
      // Verificar se o erro menciona workspace não encontrado
      const errorData = error.response.data;
      const currentWorkspaceId = localStorage.getItem("workspace_id");

      // Se o workspace_id atual é "teste" ou outro valor suspeito, limpar
      if (currentWorkspaceId === "teste" || (currentWorkspaceId && currentWorkspaceId.length < 2)) {
        console.warn("Workspace inválido detectado no localStorage:", currentWorkspaceId, "- limpando...");
        localStorage.removeItem("workspace_id");
        // Recarregar página para aplicar correção
        window.location.reload();
        return Promise.reject(error);
      }

      // Verificar se o erro menciona workspace não encontrado
      if (errorData && typeof errorData === 'object') {
        const errorDetail = (errorData as any).detail || (errorData as any).error || '';
        if (typeof errorDetail === 'string' && (
          errorDetail.includes('workspace') ||
          errorDetail.includes('Workspace')
        )) {
          console.warn("Erro relacionado a workspace, limpando localStorage...");
          localStorage.removeItem("workspace_id");
          // Recarregar página para aplicar correção
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
