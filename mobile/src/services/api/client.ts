/**
 * Cliente HTTP configurado (Axios)
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, TIMEOUTS, API_ENDPOINTS } from '@/constants/config';
import { getAuthTokens } from '@/services/storage/secure';
import { getWorkspaceId } from '@/services/storage/async';

/**
 * Cria instância do Axios com configurações padrão
 */
export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUTS.api,
    headers: {
      'Content-Type': 'application/json',
      // Header necessário para ngrok free (bypass do warning page)
      'ngrok-skip-browser-warning': 'true',
    },
  });

  // Interceptor de request: adiciona token e workspace
  client.interceptors.request.use(
    async (config) => {
      // #region agent log
      const logData1 = {location:'client.ts:26',message:'Request interceptor entry',data:{url:config.url,baseURL:config.baseURL,method:config.method,headers:Object.keys(config.headers || {})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      console.log('[DEBUG]', JSON.stringify(logData1, null, 2));
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData1)}).catch((e)=>console.error('[DEBUG FETCH ERROR]',e));
      // #endregion

      // Para FormData, remove Content-Type para que Axios defina automaticamente com boundary
      // No React Native, FormData pode não ser detectado via instanceof
      // Verifica se é FormData checando se tem o método append ou se é um objeto com _parts
      const isFormData =
        config.data instanceof FormData ||
        (config.data && typeof config.data === 'object' &&
         (typeof (config.data as any).append === 'function' ||
          (config.data as any)._parts !== undefined));

      if (isFormData) {
        delete config.headers['Content-Type'];
        // #region agent log
        console.log('[DEBUG] FormData detected, removed Content-Type');
        fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:38',message:'FormData detected',data:{hasContentType:!!config.headers['Content-Type']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }

      // Endpoints públicos não precisam de token/workspace
      const publicEndpoints = [
        API_ENDPOINTS.login,
        API_ENDPOINTS.register,
        API_ENDPOINTS.passwordResetRequest,
        API_ENDPOINTS.passwordResetConfirm,
      ];

      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        config.url?.includes(endpoint)
      );

      // #region agent log
      const logData2 = {location:'client.ts:40',message:'Public endpoint check',data:{url:config.url,isPublicEndpoint,publicEndpoints,matchedEndpoint:publicEndpoints.find(e=>config.url?.includes(e))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      console.log('[DEBUG]', JSON.stringify(logData2, null, 2));
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch((e)=>console.error('[DEBUG FETCH ERROR]',e));
      // #endregion

      // Adiciona token de autenticação (apenas para endpoints protegidos)
      if (!isPublicEndpoint) {
        const tokens = await getAuthTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
      }

      // Adiciona workspace ID (apenas para endpoints protegidos)
      // O workspace pode vir do user após login, não precisa no login
      if (!isPublicEndpoint) {
        const workspaceId = await getWorkspaceId();
        if (workspaceId) {
          config.headers['X-Workspace-ID'] = workspaceId;
        }
      }

      // #region agent log
      const logData3 = {location:'client.ts:58',message:'Request headers before send',data:{headers:Object.keys(config.headers || {}),hasAuth:!!config.headers?.Authorization,hasWorkspace:!!config.headers?.['X-Workspace-ID'],fullUrl:`${config.baseURL}${config.url}`,allHeaders:config.headers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
      console.log('[DEBUG]', JSON.stringify(logData3, null, 2));
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch((e)=>console.error('[DEBUG FETCH ERROR]',e));
      // #endregion

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de response: trata erros comuns
  client.interceptors.response.use(
    (response) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:65',message:'Response success',data:{url:response.config.url,status:response.status,headers:Object.keys(response.headers || {})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return response;
    },
    async (error) => {
      // #region agent log
      const logData4 = {location:'client.ts:70',message:'Response error',data:{url:error.config?.url,status:error.response?.status,statusText:error.response?.statusText,headers:error.response?.headers,data:error.response?.data,message:error.message,code:error.code,fullError:JSON.stringify(error.response?.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
      console.log('[DEBUG ERROR]', JSON.stringify(logData4, null, 2));
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData4)}).catch((e)=>console.error('[DEBUG FETCH ERROR]',e));
      // #endregion

      // Tratar erros de rede (Network request failed)
      if (error.code === 'ERR_NETWORK' || error.message === 'Network request failed') {
        // #region agent log
        console.warn('[API Client] Network error, pode ser temporário', {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        });
        // #endregion

        // Normalizar erro de rede para facilitar tratamento
        const networkError = new Error('Erro de conexão. Verifique sua internet.');
        (networkError as any).isNetworkError = true;
        (networkError as any).originalError = error;
        return Promise.reject(networkError);
      }

      // 502/503: Backend indisponível (Bad Gateway / Service Unavailable)
      if (error.response?.status === 502 || error.response?.status === 503) {
        // #region agent log
        console.warn('[API Client] Backend indisponível (502/503)', {
          url: error.config?.url,
          status: error.response?.status,
        });
        // #endregion

        // Normalizar erro de backend indisponível
        const backendError = new Error('Servidor temporariamente indisponível. Tente novamente em instantes.');
        (backendError as any).isBackendError = true;
        (backendError as any).status = error.response?.status;
        (backendError as any).originalError = error;
        return Promise.reject(backendError);
      }

      // 500: Erro interno do servidor
      if (error.response?.status === 500) {
        // #region agent log
        console.warn('[API Client] Erro interno do servidor (500)', {
          url: error.config?.url,
        });
        // #endregion

        const serverError = new Error('Erro interno do servidor. Tente novamente mais tarde.');
        (serverError as any).isServerError = true;
        (serverError as any).originalError = error;
        return Promise.reject(serverError);
      }

      // 401: Token expirado ou inválido
      if (error.response?.status === 401) {
        // TODO: Implementar refresh token
        // Por enquanto, apenas rejeita o erro
      }

      // 429: Rate limit - aguardar um pouco antes de retry
      if (error.response?.status === 429) {
        // #region agent log
        console.warn('[API Client] Rate limit atingido, aguardando antes de retry');
        // #endregion
        // Não fazer retry automático, deixar o polling tentar novamente
        const rateLimitError = new Error('Muitas requisições. Aguarde um momento e tente novamente.');
        (rateLimitError as any).isRateLimitError = true;
        (rateLimitError as any).originalError = error;
        return Promise.reject(rateLimitError);
      }

      // Se a resposta contém HTML (erro do NGINX/CapRover), normalizar
      if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype html>')) {
        const htmlError = new Error('Servidor temporariamente indisponível. Tente novamente em instantes.');
        (htmlError as any).isBackendError = true;
        (htmlError as any).status = error.response?.status || 502;
        (htmlError as any).originalError = error;
        return Promise.reject(htmlError);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

// Instância singleton
export const apiClient = createApiClient();

