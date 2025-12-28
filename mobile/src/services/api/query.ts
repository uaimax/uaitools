/**
 * Serviço de API para consultas com IA
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/config';

export interface QueryResponse {
  answer: string;
  sources: Array<{
    note_id: string;
    excerpt: string;
    date: string;
    box_name: string;
  }>;
}

export interface QueryRequest {
  question: string;
  box_id?: string | null;
  limit?: number;
}

/**
 * Faz uma consulta com IA sobre as notas
 */
export async function askQuery(
  question: string,
  boxId?: string | null,
  limit: number = 10
): Promise<QueryResponse> {
  const response = await apiClient.post<QueryResponse>(
    `${API_ENDPOINTS.query}ask/`,
    {
      question,
      box_id: boxId || null,
      limit,
    }
  );
  return response.data;
}

