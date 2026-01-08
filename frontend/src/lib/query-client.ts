/**
 * Query Client - Configuração do TanStack Query (React Query)
 *
 * Cria e exporta uma instância configurada do QueryClient
 * para ser usada em toda a aplicação.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Configuração padrão do QueryClient
 *
 * - staleTime: Tempo que os dados são considerados frescos (5 minutos)
 * - cacheTime: Tempo que os dados ficam em cache antes de serem garbage collected (10 minutos)
 * - retry: Número de tentativas em caso de falha
 * - refetchOnWindowFocus: Recarregar dados quando a janela recebe foco
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo que os dados são considerados frescos (não refetch automaticamente)
      staleTime: 5 * 60 * 1000, // 5 minutos
      // Tempo que os dados ficam em cache
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
      // Número de tentativas em caso de erro
      retry: 1,
      // Refetch quando a janela recebe foco
      refetchOnWindowFocus: false,
      // Refetch quando reconecta à rede
      refetchOnReconnect: true,
    },
    mutations: {
      // Não retry mutations por padrão (evita duplicação de dados)
      retry: false,
    },
  },
});

