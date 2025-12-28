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
 * Transcreve áudio sem criar nota (para perguntas)
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  const { getAuthTokens } = await import('@/services/storage/secure');
  const { getWorkspaceId } = await import('@/services/storage/async');
  const { API_BASE_URL } = await import('@/constants/config');

  const tokens = await getAuthTokens();
  const workspaceId = await getWorkspaceId();

  if (!tokens?.accessToken) {
    throw new Error('Token de autenticação não encontrado');
  }

  const formData = new FormData();

  // Detectar tipo MIME do áudio
  const extension = audioUri.split('.').pop()?.toLowerCase();
  const audioMimeType = extension === 'm4a' ? 'audio/m4a' :
                        extension === 'mp3' ? 'audio/mpeg' :
                        extension === 'wav' ? 'audio/wav' :
                        extension === 'ogg' || extension === 'opus' ? 'audio/ogg; codecs=opus' :
                        extension === 'aac' ? 'audio/aac' :
                        extension === 'amr' ? 'audio/amr' :
                        extension === 'webm' ? 'audio/webm' :
                        extension === 'flac' ? 'audio/flac' :
                        'audio/m4a';

  const filename = audioUri.split('/').pop() || 'recording.m4a';

  // @ts-ignore - FormData precisa de tipo específico para React Native
  formData.append('audio_file', {
    uri: audioUri,
    type: audioMimeType,
    name: filename,
  } as any);

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.query}transcribe/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'X-Workspace-ID': workspaceId || '',
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transcrição falhou: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.transcript;
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

