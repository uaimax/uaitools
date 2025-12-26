/** Hooks para gerenciar anotações (notes). */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface Note {
  id: string;
  workspace_id: string;
  box?: string;
  box_name?: string;
  audio_file: string;
  audio_url?: string;
  transcript?: string;
  source_type: "memo" | "group_audio";
  source_type_display: string;
  processing_status: "pending" | "processing" | "completed" | "failed";
  processing_status_display: string;
  ai_confidence?: number;
  duration_seconds?: number;
  file_size_bytes?: number;
  metadata: Record<string, any>;
  is_in_inbox: boolean;
  created_at: string;
  updated_at: string;
}

interface NotesFilters {
  box?: string;
  inbox?: boolean;
  status?: string;
  search?: string;
}

/** Busca anotações com filtros opcionais. */
export function useNotes(filters?: NotesFilters) {
  return useQuery<Note[]>({
    queryKey: ["supbrainnote", "notes", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.box) params.append("box", filters.box);
      if (filters?.inbox) params.append("inbox", "true");
      if (filters?.status) params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);

      const response = await apiClient.get(`/supbrainnote/notes/?${params.toString()}`);
      return response.data;
    },
    refetchInterval: (data) => {
      // Se há anotações processando, refetch a cada 3 segundos
      const hasProcessing = data?.some(note =>
        note.processing_status === "pending" || note.processing_status === "processing"
      );
      return hasProcessing ? 3000 : false;
    },
  });
}

/** Busca uma anotação específica. */
export function useNote(id: string | null) {
  return useQuery<Note>({
    queryKey: ["supbrainnote", "notes", id],
    queryFn: async () => {
      const response = await apiClient.get(`/supbrainnote/notes/${id}/`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: (data) => {
      // Se está processando, refetch a cada 3 segundos
      if (data?.processing_status === "pending" || data?.processing_status === "processing") {
        return 3000;
      }
      return false;
    },
  });
}

/** Upload de áudio. */
export function useUploadAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { audio_file: File; box_id?: string; source_type?: "memo" | "group_audio" }) => {
      const formData = new FormData();
      formData.append("audio_file", data.audio_file);
      if (data.box_id) formData.append("box_id", data.box_id);
      if (data.source_type) formData.append("source_type", data.source_type);

      const response = await apiClient.post("/supbrainnote/notes/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "notes"] });
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "boxes"] });
    },
  });
}

/** Move anotação para outra caixinha. */
export function useMoveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, box_id }: { id: string; box_id?: string | null }) => {
      const response = await apiClient.post(`/supbrainnote/notes/${id}/move/`, { box_id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "notes"] });
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "boxes"] });
    },
  });
}

/** Deleta uma anotação. */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/supbrainnote/notes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "notes"] });
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "boxes"] });
    },
  });
}

