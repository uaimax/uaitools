/** Store Zustand para gerenciamento de autenticação. */

import { create } from "zustand";
import { apiClient } from "@/config/api";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  workspace: {
    id: number;
    name: string;
    slug: string;
  } | null;
  is_superuser?: boolean;
  is_staff?: boolean;
  permissions?: string[];
  created_at: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  workspace_name?: string;
  accepted_terms?: boolean;
  accepted_privacy?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

/** Store de autenticação usando Zustand.
 *
 * Gerencia estado do usuário, login, registro e logout.
 * Usa localStorage para workspace_id.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  /** Carrega o perfil do usuário atual. */
  refreshProfile: async () => {
    try {
      const response = await apiClient.get("/auth/profile/");
      const user = response.data;
      set({ user });

      // Salvar workspace_id no localStorage para o interceptor
      const isSuperUser = user.is_superuser || false;
      let currentWorkspaceId = localStorage.getItem("workspace_id");
      const userWorkspaceSlug = user.workspace?.slug;

      // Apenas limpar valores vazios
      if (currentWorkspaceId && currentWorkspaceId.length < 1) {
        console.warn("refreshProfile: valor vazio detectado:", currentWorkspaceId, "- limpando...");
        localStorage.removeItem("workspace_id");
        currentWorkspaceId = null;
      }

      if (user.workspace) {
        if (!currentWorkspaceId) {
          console.log("refreshProfile: definindo workspace_id do usuário:", userWorkspaceSlug);
          localStorage.setItem("workspace_id", userWorkspaceSlug);
        } else {
          console.log("refreshProfile: mantendo workspace selecionado:", currentWorkspaceId);
        }
      } else {
        if (!isSuperUser) {
          console.log("refreshProfile: usuário sem workspace, limpando localStorage");
          localStorage.removeItem("workspace_id");
        } else {
          console.log("refreshProfile: super admin sem workspace, mantendo workspace selecionado se houver");
        }
      }
    } catch (error) {
      set({ user: null });
      localStorage.removeItem("workspace_id");
    }
  },

  /** Login do usuário usando email. */
  login: async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login/", { email, password });
    const user = response.data.user;
    set({ user });

    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
    }

    if (user.workspace) {
      localStorage.setItem("workspace_id", user.workspace.slug);
    }
  },

  /** Registro de novo usuário. */
  register: async (data: RegisterData) => {
    const response = await apiClient.post("/auth/register/", data);
    const user = response.data.user;
    set({ user });

    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
    }

    if (user.workspace) {
      localStorage.setItem("workspace_id", user.workspace.slug);
    }
  },

  /** Logout do usuário. */
  logout: async () => {
    try {
      await apiClient.post("/auth/logout/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      set({ user: null });
      localStorage.removeItem("workspace_id");
      localStorage.removeItem("access_token");
    }
  },
}));

/** Hook de conveniência para usar o store de autenticação.
 *
 * Mantém compatibilidade com o hook anterior `useAuth()`.
 */
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    loading: store.loading,
    login: store.login,
    register: store.register,
    logout: store.logout,
    refreshProfile: store.refreshProfile,
  };
};

