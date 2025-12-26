/** Serviço para buscar documentos legais (Termos e Política de Privacidade). */

import { apiClient } from '@/config/api';

export interface LegalDocument {
  content: string;
  version: number;
  last_updated: string;
}

/**
 * Busca os Termos e Condições renderizados para a empresa atual.
 */
export const getTerms = async (): Promise<LegalDocument> => {
  const response = await apiClient.get('/legal/terms/');
  return response.data;
};

/**
 * Busca a Política de Privacidade renderizada para a empresa atual.
 */
export const getPrivacyPolicy = async (): Promise<LegalDocument> => {
  const response = await apiClient.get('/legal/privacy/');
  return response.data;
};

