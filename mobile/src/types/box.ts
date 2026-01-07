/**
 * Tipos relacionados a caixinhas
 */

export interface Box {
  id: string;
  name: string;
  color: string; // hex color
  description: string | null;
  note_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBoxRequest {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateBoxRequest {
  name?: string;
  color?: string;
  description?: string;
}


