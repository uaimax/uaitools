/** Hooks TanStack Query para gerenciamento de workspaces. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";
import { useAuthStore } from "@/stores/auth-store";

export interface Workspace {
  id: string | number;
  name: string;
  slug?: string;
}

export interface WorkspacesResponse {
  count?: number;
  results?: Workspace[];
  // Pode retornar array direto também
}

/** Query key factory para workspaces. */
export const workspacesKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspacesKeys.all, "list"] as const,
  list: () => [...workspacesKeys.lists()] as const,
};

/** Hook para buscar lista de workspaces disponíveis.
 *
 * Para super admin, retorna todos os workspaces.
 * Para usuários normais, retorna apenas seus próprios workspaces.
 */
export function useWorkspaces() {
  const user = useAuthStore((state) => state.user);

  return useQuery<Workspace[], Error>({
    queryKey: workspacesKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<WorkspacesResponse | Workspace[]>("/workspaces/");
      // Backend pode retornar { results: [] } ou [] diretamente
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      return data;
    },
    enabled: !!user, // Só buscar se houver usuário autenticado
  });
}

/** Hook para trocar o workspace atual.
 *
 * Atualiza o localStorage e invalida queries relacionadas.
 */
export function useSwitchWorkspace() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (workspaceSlug: string) => {
      // Validar se o workspace existe na lista antes de trocar
      const workspaces = queryClient.getQueryData<Workspace[]>(workspacesKeys.list());
      if (!workspaces) {
        throw new Error("Lista de workspaces não disponível");
      }

      const workspace = workspaces.find((w) => (w.slug || w.id.toString()) === workspaceSlug);
      if (!workspace) {
        throw new Error("Workspace não encontrado");
      }

      // Se for "none", apenas limpar
      if (workspaceSlug === "none" || !workspaceSlug) {
        localStorage.removeItem("workspace_id");
        // Disparar evento customizado para notificar mudança na mesma janela
        window.dispatchEvent(new Event("workspace-changed"));
        return;
      }

      // Salvar o slug correto
      const validSlug = workspace.slug || workspace.id.toString();
      localStorage.setItem("workspace_id", validSlug);

      // Disparar evento customizado para notificar mudança na mesma janela
      window.dispatchEvent(new Event("workspace-changed"));
    },
    onSuccess: () => {
      // Invalidar todas as queries que dependem do workspace
      queryClient.invalidateQueries();
    },
  });
}