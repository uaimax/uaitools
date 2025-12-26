/** Hooks TanStack Query para dashboard. */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface DashboardStats {
  total_leads: number;
  new_leads: number;
  converted_leads: number;
  total_revenue?: number;
}

/** Query key factory para dashboard. */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

/** Hook para buscar estatísticas do dashboard. */
export function useDashboardStats() {
  return useQuery<DashboardStats, Error>({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<DashboardStats>("/dashboard/stats/");
        return response.data;
      } catch (err: any) {
        // Se endpoint não existe (404), retornar dados vazios
        if (err.response?.status === 404) {
          return {
            total_leads: 0,
            new_leads: 0,
            converted_leads: 0,
          };
        }
        throw err;
      }
    },
  });
}



