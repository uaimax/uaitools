/** Hooks para gerenciar compartilhamento de caixinhas. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface BoxShare {
  id: string;
  box: string;
  box_name: string;
  shared_with: string;
  shared_with_email: string;
  permission: "read" | "write";
  invited_by?: string;
  invited_by_email?: string;
  status: "pending" | "accepted";
  created_at: string;
  accepted_at?: string;
}

export interface BoxShareInvite {
  id: string;
  email: string;
  permission: "read" | "write";
  expires_at: string;
  created_at: string;
}

/** Busca compartilhamentos de uma caixinha. */
export function useBoxShares(boxId: string | null) {
  return useQuery<BoxShare[]>({
    queryKey: ["bau_mental", "boxes", boxId, "shares"],
    queryFn: async () => {
      if (!boxId) return [];
      const response = await apiClient.get(`/bau-mental/boxes/${boxId}/shares/`);
      return response.data || [];
    },
    enabled: !!boxId,
  });
}

/** Compartilha caixinha com usuário ou envia convite por email. */
export function useShareBox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boxId,
      user_id,
      email,
      permission = "read",
    }: {
      boxId: string;
      user_id?: string;
      email?: string;
      permission?: "read" | "write";
    }) => {
      const response = await apiClient.post(`/bau-mental/boxes/${boxId}/share/`, {
        user_id,
        email,
        permission,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bau_mental", "boxes", variables.boxId, "shares"],
      });
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "boxes"] });
    },
  });
}

/** Atualiza permissão de compartilhamento. */
export function useUpdateSharePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boxId,
      shareId,
      permission,
    }: {
      boxId: string;
      shareId: string;
      permission: "read" | "write";
    }) => {
      const response = await apiClient.patch(
        `/bau-mental/boxes/${boxId}/shares/${shareId}/`,
        { permission }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bau_mental", "boxes", variables.boxId, "shares"],
      });
    },
  });
}

/** Remove compartilhamento. */
export function useRemoveShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boxId, shareId }: { boxId: string; shareId: string }) => {
      await apiClient.delete(`/bau-mental/boxes/${boxId}/shares/${shareId}/`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bau_mental", "boxes", variables.boxId, "shares"],
      });
      queryClient.invalidateQueries({ queryKey: ["bau_mental", "boxes"] });
    },
  });
}

