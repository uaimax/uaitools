/** Hooks TanStack Query para gerenciamento de tenants. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";
import { useAuthStore } from "@/stores/auth-store";

export interface Tenant {
  id: string | number;
  name: string;
  slug?: string;
}

export interface TenantsResponse {
  count?: number;
  results?: Tenant[];
  // Pode retornar array direto também
}

/** Query key factory para tenants. */
export const tenantsKeys = {
  all: ["tenants"] as const,
  lists: () => [...tenantsKeys.all, "list"] as const,
  list: () => [...tenantsKeys.lists()] as const,
};

/** Hook para buscar lista de tenants disponíveis.
 *
 * Para super admin, retorna todos os tenants.
 * Para usuários normais, retorna apenas seus próprios tenants.
 */
export function useTenants() {
  const user = useAuthStore((state) => state.user);

  return useQuery<Tenant[], Error>({
    queryKey: tenantsKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<TenantsResponse | Tenant[]>("/tenants/");
      // Backend pode retornar { results: [] } ou [] diretamente
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      return data;
    },
    enabled: !!user, // Só buscar se houver usuário autenticado
  });
}

/** Hook para trocar o tenant atual.
 *
 * Atualiza o localStorage e invalida queries relacionadas.
 */
export function useSwitchTenant() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (tenantSlug: string) => {
      // Validar se o tenant existe na lista antes de trocar
      const tenants = queryClient.getQueryData<Tenant[]>(tenantsKeys.list());
      if (!tenants) {
        throw new Error("Lista de tenants não disponível");
      }

      const tenant = tenants.find((t) => (t.slug || t.id.toString()) === tenantSlug);
      if (!tenant) {
        throw new Error("Tenant não encontrado");
      }

      // Se for "none", apenas limpar
      if (tenantSlug === "none" || !tenantSlug) {
        localStorage.removeItem("workspace_id");
        return;
      }

      // Salvar o slug correto
      const validSlug = tenant.slug || tenant.id.toString();
      localStorage.setItem("workspace_id", validSlug);
    },
    onSuccess: () => {
      // Invalidar todas as queries que dependem do tenant
      queryClient.invalidateQueries();
    },
  });
}

