/**
 * RBAC - Role-Based Access Control
 * 
 * Sistema de controle de acesso baseado em permissões.
 */

/**
 * Tipo de permissão (string no formato "recurso.ação")
 * Exemplos: "leads.view", "leads.create", "leads.update", "leads.delete"
 */
export type Permission = string;

/**
 * Set de permissões (array de strings)
 */
export type PermissionSet = Permission[];

/**
 * Verifica se um set de permissões contém uma permissão específica
 * 
 * @param userPermissions - Permissões do usuário
 * @param permission - Permissão a verificar
 * @returns true se o usuário tem a permissão
 * 
 * @example
 * const userPerms = ["leads.view", "leads.create"];
 * checkPermission(userPerms, "leads.view"); // true
 * checkPermission(userPerms, "leads.delete"); // false
 */
export function checkPermission(
  userPermissions: PermissionSet,
  permission: Permission
): boolean {
  return userPermissions.includes(permission);
}

/**
 * Verifica se o usuário tem pelo menos uma das permissões (OR)
 * 
 * @param userPermissions - Permissões do usuário
 * @param permissions - Permissões a verificar
 * @returns true se o usuário tem pelo menos uma das permissões
 * 
 * @example
 * const userPerms = ["leads.view"];
 * hasAnyPermission(userPerms, ["leads.view", "leads.create"]); // true
 * hasAnyPermission(userPerms, ["leads.create", "leads.delete"]); // false
 */
export function hasAnyPermission(
  userPermissions: PermissionSet,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => userPermissions.includes(permission));
}

/**
 * Verifica se o usuário tem todas as permissões (AND)
 * 
 * @param userPermissions - Permissões do usuário
 * @param permissions - Permissões a verificar
 * @returns true se o usuário tem todas as permissões
 * 
 * @example
 * const userPerms = ["leads.view", "leads.create"];
 * hasAllPermissions(userPerms, ["leads.view", "leads.create"]); // true
 * hasAllPermissions(userPerms, ["leads.view", "leads.delete"]); // false
 */
export function hasAllPermissions(
  userPermissions: PermissionSet,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => userPermissions.includes(permission));
}

