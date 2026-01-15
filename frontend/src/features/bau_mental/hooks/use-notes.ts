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
  days_until_expiration?: number;
  is_audio_expired?: boolean;
  created_by?: string;
  created_by_email?: string;
  last_edited_by?: string;
  last_edited_by_email?: string;
  last_edited_at?: string;
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
    queryKey: ["bau_mental", "notes", filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.box) params.append("box", filters.box);
        if (filters?.inbox) params.append("inbox", "true");
        if (filters?.status) params.append("status", filters.status);
        if (filters?.search) params.append("search", filters.search);

        const response = await apiClient.get(`/bau-mental/notes/?${params.toString()}`);
        // API pode retornar paginado (results) ou array direto
        const data = response.data?.results || response.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar anotações:", error);
        return [];
      }
    },
    retry: 1,
    refetchInterval: (data) => {
      // Se há anotações processando, refetch a cada 3 segundos
      if (!data || !Array.isArray(data)) return false;
      const hasProcessing = data.some(note =>
        note.processing_status === "pending" || note.processing_status === "processing"
      );
      return hasProcessing ? 3000 : false;
    },
  });
}

/** Busca uma anotação específica. */
export function useNote(id: string | null) {
  return useQuery<Note>({
    queryKey: ["bau_mental", "notes", id],
    queryFn: async () => {
      const response = await apiClient.get(`/bau-mental/notes/${id}/`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Se está processando, refetch a cada 3 segundos
      const data = query.state.data;
      if (data?.processing_status === "pending" || data?.processing_status === "processing") {
        return 3000;
      }
      return false;
    },
  });
}

/** Valida se uma string é um UUID válido. */
function isValidUUID(str: string | null | undefined): boolean {
  if (!str || typeof str !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str.trim());
}

/** Upload de áudio. */
export function useUploadAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { audio_file: File; box_id?: string | null; source_type?: "memo" | "group_audio" }) => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-notes.ts:100',message:'Iniciando upload de áudio',data:{file_name:data.audio_file.name,file_size:data.audio_file.size,box_id:data.box_id,source_type:data.source_type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      const formData = new FormData();
      formData.append("audio_file", data.audio_file);
      // Só adiciona box_id se for um UUID válido
      if (isValidUUID(data.box_id)) {
        formData.append("box_id", data.box_id!.trim());
      }
      if (data.source_type) formData.append("source_type", data.source_type);

      try {
        const response = await apiClient.post("/bau-mental/notes/upload/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-notes.ts:115',message:'Upload bem-sucedido',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        return response.data;
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-notes.ts:120',message:'Erro no upload',data:{error_status:error?.response?.status,error_message:error?.response?.data?.detail||error?.message,is_429:error?.response?.status===429},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion

        // Re-throw para que o componente possa tratar
        throw error;
      }
    },
    retry: false, // Desabilitar retries automáticos para evitar loops
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "notes"] });
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "boxes"] });
    },
  });
}

/** Move anotação para outra caixinha. */
export function useMoveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, box_id }: { id: string; box_id?: string | null }) => {
      const response = await apiClient.post(`/bau-mental/notes/${id}/move/`, { box_id });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "notes"] });
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "boxes"] });
    },
  });
}

/** Atualiza uma anotação. */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, transcript }: { id: string; transcript: string }) => {
      const response = await apiClient.patch(`/bau-mental/notes/${id}/`, { transcript });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "notes"] });
      queryClient.setQueryData(["bau_mental", "notes", data.id], data);
    },
  });
}

/** Deleta uma anotação. */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/bau-mental/notes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "notes"] });
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "boxes"] });
    },
  });
}

/** Cria nota a partir de texto. */
export function useCreateTextNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { text: string; box_id?: string }) => {
      const response = await apiClient.post("/bau-mental/notes/create-text/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "notes"] });
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "boxes"] });
    },
  });
}

/** Upload de arquivo para caixinha. */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      box_id?: string;
      processing_mode?: "single" | "split_paragraphs" | "split_lines";
    }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      if (data.box_id) formData.append("box_id", data.box_id);
      if (data.processing_mode) formData.append("processing_mode", data.processing_mode);

      const response = await apiClient.post(
        "/bau-mental/notes/upload-file/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "notes"] });
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "boxes"] });
    },
  });
}

