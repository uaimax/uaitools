/** Hook para acessar informações do tenant (workspace) atual. */

import { useAuthStore, type User } from "@/stores/auth-store";

/**
 * Tipo para representar informações do tenant.
 */
export interface TenantInfo {
  tenant: User["workspace"];
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
}

/**
 * Hook para acessar informações do tenant atual de forma consistente.
 * Para super admins, considera o tenant selecionado no localStorage.
 * Para usuários normais, usa o tenant do workspace do usuário.
 *
 * @returns Objeto com informações do tenant atual
 *
 * @example
 * const { tenant, tenantId, tenantName } = useTenant();
 * if (tenantId) {
 *   console.log(`Tenant atual: ${tenantName} (${tenantId})`);
 * }
 */
export function useTenant(): TenantInfo {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.is_superuser || false;

  // Para super admin, verificar se há um tenant selecionado no localStorage
  // que seja diferente do tenant do usuário
  const selectedWorkspaceId = localStorage.getItem("workspace_id");
  const userWorkspaceSlug = user?.workspace?.slug || null;


  // Se for super admin e houver um tenant selecionado no localStorage,
  // usar esse tenant (mesmo que seja diferente do tenant do usuário)
  // Caso contrário, usar o tenant do usuário
  const effectiveSlug = (isSuperAdmin && selectedWorkspaceId) ? selectedWorkspaceId : userWorkspaceSlug;

  // Para super admin, o tenant pode ser diferente do user.workspace
  // Nesse caso, retornamos apenas o slug (não temos o objeto tenant completo)
  const tenant = (effectiveSlug === userWorkspaceSlug) ? (user?.workspace ?? null) : null;
  const tenantId = tenant?.id.toString() ?? (effectiveSlug || null);
  const tenantName = tenant?.name ?? null;
  const tenantSlug = effectiveSlug;


  return {
    tenant,
    tenantId,
    tenantName,
    tenantSlug,
  };
}
