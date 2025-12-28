/**
 * Serviço de API para notas
 */

import { apiClient } from './client';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/config';
import type { Note, NoteUploadResponse } from '@/types';

export interface NotesFilters {
  box?: string;
  inbox?: boolean;
  status?: string;
  search?: string;
}

/**
 * Lista notas com filtros opcionais
 */
export async function getNotes(filters?: NotesFilters): Promise<Note[]> {
  const params = new URLSearchParams();

  if (filters?.box) {
    params.append('box', filters.box);
  }
  if (filters?.inbox) {
    params.append('inbox', 'true');
  }
  if (filters?.status) {
    params.append('status', filters.status);
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }

  const response = await apiClient.get<{ results?: Note[] } | Note[]>(
    `${API_ENDPOINTS.notes}${params.toString() ? `?${params.toString()}` : ''}`
  );

  // DRF pode retornar paginado (com results) ou array direto
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Se for objeto paginado, retornar results
  if (response.data && typeof response.data === 'object' && 'results' in response.data) {
    return (response.data as { results: Note[] }).results || [];
  }

  // Fallback: retornar array vazio
  return [];
}

/**
 * Busca detalhes de uma nota
 */
export async function getNote(noteId: string): Promise<Note> {
  const response = await apiClient.get<Note>(`${API_ENDPOINTS.notes}${noteId}/`);
  return response.data;
}

// Cache de uploads em progresso para evitar duplicação
const uploadsInProgress = new Set<string>();

/**
 * Upload de áudio (multipart/form-data)
 * Usa fetch nativo em vez de Axios para evitar problemas de Network Error
 * com FormData no React Native + ngrok/HTTPS
 */
/**
 * Detecta o tipo MIME e extensão do arquivo baseado na URI
 */
function detectAudioType(uri: string): { mimeType: string; extension: string; fileName: string } {
  const uriLower = uri.toLowerCase();

  // Detectar por extensão
  if (uriLower.endsWith('.opus') || uriLower.endsWith('.ogg')) {
    return { mimeType: 'audio/ogg; codecs=opus', extension: '.opus', fileName: 'audio.opus' };
  }
  if (uriLower.endsWith('.m4a')) {
    return { mimeType: 'audio/m4a', extension: '.m4a', fileName: 'audio.m4a' };
  }
  if (uriLower.endsWith('.mp3')) {
    return { mimeType: 'audio/mp3', extension: '.mp3', fileName: 'audio.mp3' };
  }
  if (uriLower.endsWith('.wav')) {
    return { mimeType: 'audio/wav', extension: '.wav', fileName: 'audio.wav' };
  }
  if (uriLower.endsWith('.aac')) {
    return { mimeType: 'audio/aac', extension: '.aac', fileName: 'audio.aac' };
  }
  if (uriLower.endsWith('.amr')) {
    return { mimeType: 'audio/amr', extension: '.amr', fileName: 'audio.amr' };
  }

  // Fallback: tentar extrair nome do arquivo da URI
  const fileNameMatch = uri.match(/([^/]+)\.(\w+)$/);
  if (fileNameMatch) {
    const [, name, ext] = fileNameMatch;
    const extLower = ext.toLowerCase();
    const mimeTypes: Record<string, string> = {
      opus: 'audio/ogg; codecs=opus',
      ogg: 'audio/ogg; codecs=opus',
      m4a: 'audio/m4a',
      mp3: 'audio/mp3',
      wav: 'audio/wav',
      aac: 'audio/aac',
      amr: 'audio/amr',
    };
    return {
      mimeType: mimeTypes[extLower] || 'audio/m4a',
      extension: `.${extLower}`,
      fileName: `${name}.${extLower}`,
    };
  }

  // Fallback padrão
  return { mimeType: 'audio/m4a', extension: '.m4a', fileName: 'audio.m4a' };
}

export async function uploadAudio(
  audioUri: string,
  boxId?: string,
  sourceType?: string
): Promise<NoteUploadResponse> {
  // Proteção contra chamadas duplicadas usando o URI como chave
  if (uploadsInProgress.has(audioUri)) {
    console.log('[DEBUG] Upload já em progresso para este arquivo, ignorando', { audioUri });
    throw new Error('Upload já em progresso para este arquivo');
  }

  uploadsInProgress.add(audioUri);

  // Detectar tipo de áudio automaticamente
  const audioInfo = detectAudioType(audioUri);

  // #region agent log
  console.log('[DEBUG] uploadAudio called (native fetch)', {
    audioUri,
    boxId,
    sourceType,
    detectedType: audioInfo
  });
  // #endregion

  // Importa funções de storage para obter tokens
  const { getAuthTokens } = await import('@/services/storage/secure');
  const { getWorkspaceId } = await import('@/services/storage/async');

  const tokens = await getAuthTokens();
  const workspaceId = await getWorkspaceId();

  if (!tokens?.accessToken) {
    throw new Error('Token de autenticação não encontrado');
  }

  const formData = new FormData();

  // @ts-ignore - FormData precisa de tipo específico para React Native
  formData.append('audio_file', {
    uri: audioUri,
    type: audioInfo.mimeType,
    name: audioInfo.fileName,
  } as any);

  if (boxId) {
    formData.append('box_id', boxId);
  }

  if (sourceType) {
    formData.append('source_type', sourceType);
  }

  // #region agent log
  console.log('[DEBUG] FormData created for native fetch', { hasAudioFile: true, hasBox: !!boxId, hasToken: !!tokens.accessToken, hasWorkspace: !!workspaceId });
  // #endregion

  const uploadUrl = `${API_BASE_URL}${API_ENDPOINTS.noteUpload}`;

  // #region agent log
  console.log('[DEBUG] Starting native fetch upload', { uploadUrl });
  // #endregion

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'X-Workspace-ID': workspaceId || '',
        'ngrok-skip-browser-warning': 'true',
        // NÃO definir Content-Type - fetch define automaticamente com boundary para FormData
      },
      body: formData,
    });

    // #region agent log
    console.log('[DEBUG] Native fetch response', { status: response.status, ok: response.ok, statusText: response.statusText });
    // #endregion

    if (!response.ok) {
      const errorText = await response.text();
      // #region agent log
      console.error('[DEBUG] Upload failed', { status: response.status, errorText });
      // #endregion
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // #region agent log
    console.log('[DEBUG] Upload success', { data });
    // #endregion

    // Remove do cache de uploads em progresso
    uploadsInProgress.delete(audioUri);

    return data as NoteUploadResponse;
  } catch (error: any) {
    // #region agent log
    console.error('[DEBUG] Native fetch upload error', { error: error.message });
    // #endregion

    // Remove do cache mesmo em caso de erro
    uploadsInProgress.delete(audioUri);

    throw error;
  }
}

/**
 * Atualiza transcrição de uma nota
 */
export async function updateNote(
  noteId: string,
  transcript: string
): Promise<Note> {
  const response = await apiClient.patch<Note>(`${API_ENDPOINTS.notes}${noteId}/`, {
    transcript,
  });
  return response.data;
}

/**
 * Move nota para outra caixinha
 */
export async function moveNote(noteId: string, boxId: string | null): Promise<Note> {
  const response = await apiClient.post<Note>(API_ENDPOINTS.noteMove(noteId), {
    box_id: boxId,
  });
  return response.data;
}

/**
 * Exclui uma nota
 */
export async function deleteNote(noteId: string): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.notes}${noteId}/`);
}

