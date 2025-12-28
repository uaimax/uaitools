/**
 * Tipos relacionados a notas
 */

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SourceType = 'memo' | 'group_audio';

export interface Note {
  id: string;
  audio_url: string;
  transcript: string | null;
  box_id: string | null;
  box_name: string | null;
  box_color: string | null;
  created_at: string;
  updated_at: string;
  duration_seconds: number | null;
  processing_status: ProcessingStatus;
  source_type: SourceType;
  ai_confidence: number | null;
}

export interface NoteUploadResponse {
  id: string;
  processing_status: ProcessingStatus;
  message?: string;
}

