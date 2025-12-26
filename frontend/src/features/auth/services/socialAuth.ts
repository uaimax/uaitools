/** Serviço para autenticação social (OAuth2/OIDC). */

import { apiClient } from '@/config/api';

export interface SocialProvider {
  provider: string;
  name: string;
}

/**
 * Busca lista de providers sociais disponíveis no backend.
 */
export const getAvailableProviders = async (): Promise<SocialProvider[]> => {
  try {
    const response = await apiClient.get('/auth/providers/');
    return response.data.providers || [];
  } catch (error) {
    console.error('Erro ao buscar providers sociais:', error);
    return [];
  }
};

/**
 * Inicia o fluxo de autenticação social com um provider.
 * @param provider - Nome do provider (google, github, microsoft, etc.)
 * @param workspaceSlug - Slug do workspace (opcional)
 */
export const initiateSocialLogin = (provider: string, workspaceSlug?: string): void => {
  // Gerar state com workspace_slug e nonce para segurança
  const slug = workspaceSlug || localStorage.getItem('workspace_id') || null;
  const stateData = {
    workspace_slug: slug,
    nonce: crypto.randomUUID(),
  };

  const state = btoa(JSON.stringify(stateData));

  // Redirecionar para endpoint OAuth do backend
  // Usa a mesma baseURL do apiClient para garantir consistência
  const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
  // Remove trailing slash se existir e adiciona o path
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const redirectUri = `${baseUrl}/auth/social/${provider}/login/?state=${state}`;

  window.location.href = redirectUri;
};

