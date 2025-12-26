/** Hooks TanStack Query para autenticação. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";
import { useAuthStore, type User, type RegisterData } from "@/stores/auth-store";

/** Query key factory para auth. */
export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
};

/** Hook para buscar perfil do usuário atual. */
export function useProfile(options?: { enabled?: boolean }) {
  const { setUser } = useAuthStore();

  return useQuery<User, Error>({
    queryKey: authKeys.profile(),
    enabled: options?.enabled !== false, // Por padrão, sempre tenta buscar
    queryFn: async () => {
      const response = await apiClient.get<User>("/auth/profile/");
      const user = response.data;

      // Atualizar store Zustand
      setUser(user);

      // Gerenciar workspace_id no localStorage
      const isSuperUser = user.is_superuser || false;
      let currentWorkspaceId = localStorage.getItem("workspace_id");
      const userWorkspaceSlug = user.workspace?.slug;

      if (currentWorkspaceId && currentWorkspaceId.length < 1) {
        console.warn("useProfile: valor vazio detectado:", currentWorkspaceId, "- limpando...");
        localStorage.removeItem("workspace_id");
        currentWorkspaceId = null;
      }

      if (user.workspace) {
        if (!currentWorkspaceId) {
          console.log("useProfile: definindo workspace_id do usuário:", userWorkspaceSlug);
          if (userWorkspaceSlug) {
            localStorage.setItem("workspace_id", userWorkspaceSlug);
          }
        } else {
          console.log("useProfile: mantendo workspace selecionado:", currentWorkspaceId);
        }
      } else {
        if (!isSuperUser) {
          console.log("useProfile: usuário sem workspace, limpando localStorage");
          localStorage.removeItem("workspace_id");
        } else {
          console.log("useProfile: super admin sem workspace, mantendo workspace selecionado se houver");
        }
      }

      return user;
    },
    retry: false, // Não retry em caso de erro 401
  });
}

/** Hook para mutation de login. */
export function useLoginMutation() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<
    { user: User; access?: string },
    Error,
    { email: string; password: string }
  >({
    mutationFn: async ({ email, password }) => {
      const response = await apiClient.post<{ user: User; access?: string }>("/auth/login/", {
        email,
        password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Atualizar store Zustand
      setUser(data.user);

      // Armazenar JWT se fornecido
      if (data.access) {
        localStorage.setItem("access_token", data.access);
      }

      // Salvar workspace_id no localStorage
      if (data.user.workspace) {
        localStorage.setItem("workspace_id", data.user.workspace.slug);
      }

      // Invalidar e refetch profile
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}

/** Hook para mutation de registro. */
export function useRegisterMutation() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<
    { user: User; access?: string },
    Error,
    RegisterData
  >({
    mutationFn: async (data) => {
      const response = await apiClient.post<{ user: User; access?: string }>("/auth/register/", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Atualizar store Zustand
      setUser(data.user);

      // Armazenar JWT se fornecido
      if (data.access) {
        localStorage.setItem("access_token", data.access);
      }

      // Salvar workspace_id no localStorage
      if (data.user.workspace) {
        localStorage.setItem("workspace_id", data.user.workspace.slug);
      }

      // Invalidar e refetch profile
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}

/** Hook para mutation de logout. */
export function useLogoutMutation() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.post("/auth/logout/");
    },
    onSuccess: () => {
      // Limpar store Zustand
      setUser(null);

      // Limpar localStorage
      localStorage.removeItem("workspace_id");
      localStorage.removeItem("access_token");

      // Limpar todas as queries
      queryClient.clear();
    },
  });
}

/** Hook para mutation de solicitação de reset de senha. */
export function usePasswordResetRequestMutation() {
  return useMutation<
    { message: string },
    Error,
    { email: string }
  >({
    mutationFn: async ({ email }) => {
      const response = await apiClient.post<{ message: string }>("/auth/password-reset-request/", {
        email,
      });
      return response.data;
    },
  });
}

/** Hook para mutation de confirmação de reset de senha. */
export function usePasswordResetConfirmMutation() {
  return useMutation<
    { message: string },
    Error,
    { token: string; new_password: string }
  >({
    mutationFn: async ({ token, new_password }) => {
      const response = await apiClient.post<{ message: string }>("/auth/password-reset-confirm/", {
        token,
        new_password,
      });
      return response.data;
    },
  });
}