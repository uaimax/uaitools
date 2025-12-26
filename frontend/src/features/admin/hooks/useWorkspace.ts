/** Hook para acessar informações do workspace atual. */

import { useState, useEffect } from "react";
import { useAuthStore, type User } from "@/stores/auth-store";

/**
 * Tipo para representar informações do workspace.
 */
export interface WorkspaceInfo {
  workspace: User["workspace"];
  workspaceId: string | null;
  workspaceName: string | null;
  workspaceSlug: string | null;
}

/**
 * Hook para acessar informações do workspace atual de forma consistente.
 * Para super admins, considera o workspace selecionado no localStorage.
 * Para usuários normais, usa o workspace do usuário.
 *
 * @returns Objeto com informações do workspace atual
 *
 * @example
 * const { workspace, workspaceId, workspaceName } = useWorkspace();
 * if (workspaceId) {
 *   console.log(`Workspace atual: ${workspaceName} (${workspaceId})`);
 * }
 */
export function useWorkspace(): WorkspaceInfo {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.is_superuser || false;

  // Estado para forçar re-render quando localStorage mudar
  const [workspaceIdFromStorage, setWorkspaceIdFromStorage] = useState<string | null>(
    () => localStorage.getItem("workspace_id")
  );

  // Listener para mudanças no localStorage (quando outro componente muda o workspace)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "workspace_id") {
        setWorkspaceIdFromStorage(e.newValue);
      }
    };

    // Listener para eventos de storage (de outras abas/janelas)
    window.addEventListener("storage", handleStorageChange);

    // Listener customizado para mudanças na mesma janela
    // (localStorage.setItem não dispara storage event na mesma janela)
    const handleCustomStorageChange = () => {
      setWorkspaceIdFromStorage(localStorage.getItem("workspace_id"));
    };

    // Usar evento customizado para detectar mudanças na mesma janela
    window.addEventListener("workspace-changed", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("workspace-changed", handleCustomStorageChange);
    };
  }, []);

  // Para super admin, verificar se há um workspace selecionado no localStorage
  // que seja diferente do workspace do usuário
  const selectedWorkspaceId = workspaceIdFromStorage;
  const userWorkspaceSlug = user?.workspace?.slug || null;

  // Se for super admin e houver um workspace selecionado no localStorage,
  // usar esse workspace (mesmo que seja diferente do workspace do usuário)
  // Caso contrário, usar o workspace do usuário
  const effectiveSlug = (isSuperAdmin && selectedWorkspaceId) ? selectedWorkspaceId : userWorkspaceSlug;

  // Para super admin, o workspace pode ser diferente do user.workspace
  // Nesse caso, retornamos apenas o slug (não temos o objeto workspace completo)
  const workspace = (effectiveSlug === userWorkspaceSlug) ? (user?.workspace ?? null) : null;
  const workspaceId = workspace?.id.toString() ?? (effectiveSlug || null);
  const workspaceName = workspace?.name ?? null;
  const workspaceSlug = effectiveSlug;

  return {
    workspace,
    workspaceId,
    workspaceName,
    workspaceSlug,
  };
}