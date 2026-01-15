/** Hooks para gerenciar threads. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface Thread {
  id: string;
  workspace_id: string;
  title: string;
  box?: string;
  box_name?: string;
  is_global: boolean;
  pinned_summary?: string;
  created_by?: string;
  created_by_email?: string;
  last_message_at: string;
  last_message_preview?: string;
  messages_count: number;
  created_at: string;
  updated_at: string;
}

export interface ThreadMessage {
  id: string;
  workspace_id: string;
  thread: string;
  role: "user" | "assistant";
  content: string;
  notes_referenced: string[];
  created_by?: string;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
}

interface CreateThreadRequest {
  title?: string;
  box_id?: string;
  box_ids?: string[];
  is_global?: boolean;
}

interface CreateMessageRequest {
  content: string;
  note_ids?: string[];
}

interface PinSummaryRequest {
  summary: string;
}

/** Lista threads com filtros opcionais. */
export function useThreads(
  filters?: { box?: string; global?: boolean },
  options?: { enabled?: boolean }
) {
  return useQuery<Thread[]>({
    queryKey: ["bau_mental", "threads", filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.box) params.append("box", filters.box);
        if (filters?.global) params.append("global", "true");

        const response = await apiClient.get(
          `/bau-mental/threads/?${params.toString()}`
        );
        const data = response.data?.results || response.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar threads:", error);
        throw error; // Re-throw para que o React Query possa tratar o erro
      }
    },
    retry: 1,
    enabled: options?.enabled !== false, // Por padrão, habilitado
  });
}

/** Busca uma thread específica. */
export function useThread(id: string | null) {
  return useQuery<Thread>({
    queryKey: ["bau_mental", "threads", id || "null"],
    queryFn: async () => {
      if (!id) {
        throw new Error("id é obrigatório");
      }
      const response = await apiClient.get(`/bau-mental/threads/${id}/`);
      return response.data;
    },
    enabled: !!id && id !== "undefined",
  });
}

/** Busca mensagens de uma thread. */
export function useThreadMessages(threadId: string | null) {
  return useQuery<ThreadMessage[]>({
    queryKey: ["bau_mental", "threads", threadId || "null", "messages"],
    queryFn: async () => {
      if (!threadId) {
        throw new Error("threadId é obrigatório");
      }
      const response = await apiClient.get(
        `/bau-mental/threads/${threadId}/messages/`
      );
      return response.data || [];
    },
    enabled: !!threadId && threadId !== "undefined",
  });
}

/** Cria uma nova thread. */
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateThreadRequest) => {
      const response = await apiClient.post("/bau-mental/threads/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "threads"] });
    },
  });
}

/** Adiciona mensagem à thread. */
export function useAddThreadMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      ...data
    }: CreateMessageRequest & { threadId: string }) => {
      const response = await apiClient.post(
        `/bau-mental/threads/${threadId}/messages/`,
        data
      );
      return response.data;
    },
    onSuccess: async (data, variables) => {
      // Refetch imediatamente para garantir que as mensagens apareçam
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["bau_mental", "threads", variables.threadId, "messages"],
        }),
        queryClient.refetchQueries({
          queryKey: ["bau_mental", "threads", variables.threadId],
        }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "threads"] });
    },
  });
}

/** Fixa síntese na thread. */
export function usePinThreadSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threadId,
      summary,
    }: PinSummaryRequest & { threadId: string }) => {
      const response = await apiClient.post(
        `/bau-mental/threads/${threadId}/pin/`,
        { summary }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bau_mental", "threads", variables.threadId],
      });
    },
  });
}

/** Atualiza thread (ex: título). */
export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string; title?: string }) => {
      const response = await apiClient.patch(`/bau-mental/threads/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "threads"] });
    },
  });
}

/** Deleta thread. */
export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/bau-mental/threads/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "threads"] });
    },
  });
}
