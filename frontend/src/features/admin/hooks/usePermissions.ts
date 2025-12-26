/** Hook para verificar permissões RBAC de forma centralizada. */

import { useAuth } from "@/stores/auth-store";
import { checkPermission, hasAnyPermission, hasAllPermissions, type Permission, type PermissionSet } from "@/lib/admin/rbac";

/**
 * Retorno do hook usePermissions.
 */
export interface UsePermissionsReturn {
  /** Verifica se o usuário tem uma permissão específica */
  hasPermission: (permission: Permission) => boolean;
  /** Verifica se o usuário tem pelo menos uma das permissões (OR) */
  hasAnyPermission: (permissions: Permission[]) => boolean;
  /** Verifica se o usuário tem todas as permissões (AND) */
  hasAllPermissions: (permissions: Permission[]) => boolean;
  /** Array de permissões do usuário atual */
  permissions: PermissionSet;
}

/**
 * Hook para verificar permissões RBAC de forma centralizada.
 * Usa as permissões do usuário autenticado para verificar acesso.
 *
 * @returns Objeto com funções de verificação de permissão
 *
 * @example
 * const { hasPermission } = usePermissions();
 * if (hasPermission("leads.view")) {
 *   // Mostrar lista de leads
 * }
 *
 * @example
 * const { hasAnyPermission } = usePermissions();
 * if (hasAnyPermission(["leads.view", "leads.create"])) {
 *   // Usuário pode ver ou criar leads
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();

  const userPermissions: PermissionSet = user?.permissions ?? [];

  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(userPermissions, permission);
  };

  const hasAny = (permissions: Permission[]): boolean => {
    return hasAnyPermission(userPermissions, permissions);
  };

  const hasAll = (permissions: Permission[]): boolean => {
    return hasAllPermissions(userPermissions, permissions);
  };

  return {
    hasPermission,
    hasAnyPermission: hasAny,
    hasAllPermissions: hasAll,
    permissions: userPermissions,
  };
}
