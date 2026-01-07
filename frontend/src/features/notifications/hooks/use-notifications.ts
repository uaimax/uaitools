/** Hooks para gerenciar notificações. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface Notification {
  id: string;
  type: "box_shared" | "note_created" | "note_edited" | "permission_changed" | "removed_from_box";
  type_display: string;
  title: string;
  message: string;
  related_box?: string;
  related_box_name?: string;
  related_note?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

interface NotificationFilters {
  unread?: boolean;
  type?: string;
}

/** Busca notificações do usuário. */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery<Notification[]>({
    queryKey: ["notifications", filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.unread) params.append("unread", "true");
        if (filters?.type) params.append("type", filters.type);

        const response = await apiClient.get(`/notifications/?${params.toString()}`);
        const data = response.data?.results || response.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        return [];
      }
    },
    retry: 1,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });
}

/** Busca contagem de notificações não lidas. */
export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/notifications/?unread=true");
        const data = response.data?.results || response.data || [];
        return Array.isArray(data) ? data.length : 0;
      } catch (error) {
        console.error("Erro ao buscar contagem de não lidas:", error);
        return 0;
      }
    },
    retry: 1,
    refetchInterval: 30000,
  });
}

/** Marca notificação como lida. */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch(`/notifications/${notificationId}/read/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Marca todas as notificações como lidas. */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/notifications/mark-all-read/");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Remove notificação. */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete(`/notifications/${notificationId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Desativa notificações de uma caixinha. */
export function useDismissBoxNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.post(`/notifications/${notificationId}/dismiss-box/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

