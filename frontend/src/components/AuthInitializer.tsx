/** Componente para inicializar autenticação usando TanStack Query. */

import { useEffect } from "react";
import { useProfile } from "@/features/auth/hooks/use-auth-queries";
import { useAuthStore } from "@/stores/auth-store";

interface AuthInitializerProps {
  children: React.ReactNode;
}

/** Componente que inicializa o perfil do usuário ao carregar a aplicação. */
export function AuthInitializer({ children }: AuthInitializerProps) {
  const { setLoading, setUser } = useAuthStore();

  // Verificar se está em uma rota pública (não precisa de autenticação)
  const isPublicRoute = typeof window !== 'undefined' && (
    window.location.pathname === '/login' ||
    window.location.pathname === '/register' ||
    window.location.pathname === '/forgot-password' ||
    window.location.pathname === '/reset-password' ||
    window.location.pathname.startsWith('/oauth/callback')
  );

  // Só buscar perfil se não estiver em rota pública e tiver token
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('access_token');
  const shouldFetchProfile = !isPublicRoute && hasToken;

  const { data: user, isLoading, isError } = useProfile({
    enabled: shouldFetchProfile,
  });

  useEffect(() => {
    if (user) {
      setUser(user);
    }
    // Em rotas públicas, não mostrar loading
    if (isPublicRoute) {
      setLoading(false);
    } else {
      setLoading(isLoading);
    }
  }, [user, isLoading, isPublicRoute, setLoading, setUser]);

  // Se houver erro (401), limpar usuário (mas não em rotas públicas)
  useEffect(() => {
    if (isError && !isPublicRoute) {
      setUser(null);
      setLoading(false);
    } else if (isPublicRoute) {
      // Em rotas públicas, garantir que loading é false
      setLoading(false);
    }
  }, [isError, isPublicRoute, setLoading, setUser]);

  return <>{children}</>;
}

