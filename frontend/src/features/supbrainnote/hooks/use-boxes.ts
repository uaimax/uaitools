/** Hooks para gerenciar caixinhas (boxes). */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface Box {
  id: string;
  workspace_id: string;
  name: string;
  color?: string;
  description?: string;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

/** Busca todas as caixinhas do workspace. */
export function useBoxes() {
  return useQuery<Box[]>({
    queryKey: ["supbrainnote", "boxes"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/supbrainnote/boxes/");
        // API pode retornar paginado (results) ou array direto
        const data = response.data?.results || response.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar caixinhas:", error);
        return [];
      }
    },
    retry: 1,
  });
}

/** Busca uma caixinha específica. */
export function useBox(id: string | null) {
  return useQuery<Box>({
    queryKey: ["supbrainnote", "boxes", id],
    queryFn: async () => {
      const response = await apiClient.get(`/supbrainnote/boxes/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
}

/** Cria uma nova caixinha. */
export function useCreateBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; color?: string; description?: string }) => {
      const response = await apiClient.post("/supbrainnote/boxes/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "boxes"] });
    },
  });
}

/** Atualiza uma caixinha. */
export function useUpdateBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; color?: string; description?: string }) => {
      const response = await apiClient.patch(`/supbrainnote/boxes/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "boxes"] });
    },
  });
}

/** Deleta uma caixinha. */
export function useDeleteBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/supbrainnote/boxes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supbrainnote", "boxes"] });
    },
  });
}

