/** Hook TanStack Query para buscar providers sociais disponíveis. */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/config/api";
import type { SocialProvider } from "../services/socialAuth";

/** Query key factory para social providers. */
export const socialProvidersKeys = {
  all: ["social-providers"] as const,
  list: () => [...socialProvidersKeys.all, "list"] as const,
};

/** Hook para buscar lista de providers sociais disponíveis. */
export function useSocialProviders() {
  return useQuery<SocialProvider[], Error>({
    queryKey: socialProvidersKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<{ providers: SocialProvider[] }>("/auth/providers/");
      return response.data.providers || [];
    },
  });
}
