/** Hooks TanStack Query para gerenciamento de leads. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";
import type { Lead } from "@/config/resources/leads";

export interface LeadsFilters {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface LeadsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Lead[];
}

/** Query key factory para leads. */
export const leadsKeys = {
  all: ["leads"] as const,
  lists: () => [...leadsKeys.all, "list"] as const,
  list: (filters?: LeadsFilters) => [...leadsKeys.lists(), filters] as const,
  details: () => [...leadsKeys.all, "detail"] as const,
  detail: (id: string | number) => [...leadsKeys.details(), id] as const,
};

/** Hook para buscar lista de leads com paginação e filtros. */
export function useLeads(filters?: LeadsFilters) {
  return useQuery<LeadsResponse, Error>({
    queryKey: leadsKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.ordering) params.append("ordering", filters.ordering);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.page_size) params.append("page_size", filters.page_size.toString());

      const queryString = params.toString();
      const url = `/leads/${queryString ? `?${queryString}` : ""}`;
      const response = await apiClient.get<LeadsResponse>(url);
      return response.data;
    },
  });
}

/** Hook para buscar um lead específico por ID. */
export function useLead(id: string | number | null) {
  return useQuery<Lead, Error>({
    queryKey: leadsKeys.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<Lead>(`/leads/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
}

/** Hook para criar um novo lead. */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation<Lead, Error, Partial<Lead>>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Lead>("/leads/", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar lista de leads para refetch
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}

/** Hook para atualizar um lead existente. */
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation<Lead, Error, { id: string | number; data: Partial<Lead> }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<Lead>(`/leads/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar lista e detalhe do lead atualizado
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadsKeys.detail(variables.id) });
    },
  });
}

/** Hook para deletar um lead. */
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string | number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/leads/${id}/`);
    },
    onSuccess: () => {
      // Invalidar lista de leads para refetch
      queryClient.invalidateQueries({ queryKey: leadsKeys.lists() });
    },
  });
}



