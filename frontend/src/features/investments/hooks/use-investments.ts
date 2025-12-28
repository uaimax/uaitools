/** Hooks TanStack Query para gerenciamento de investments. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

// Types
export interface Portfolio {
  id: string;
  workspace_id: number;
  portfolio_type: "acoes_br";
  name?: string;
  total_invested: number;
  assets_count: number;
  created_at: string;
  updated_at: string;
  workspace_name?: string;
}

export interface Asset {
  id: string;
  workspace_id: number;
  portfolio: string;
  portfolio_name?: string;
  ticker: string;
  quantity: string;
  average_price: string;
  total_invested: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Strategy {
  id: string;
  workspace_id: number;
  portfolio: string;
  portfolio_name?: string;
  raw_text: string;
  parsed_rules: {
    strategy_type?: string;
    criteria?: Record<string, any>;
    raw_text?: string;
  };
  strategy_type?: "dividendos" | "value" | "growth" | "hibrida";
  strategy_type_display?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioStatus {
  status: "ok" | "attention";
  alerts: Array<{
    ticker: string;
    type: string;
    message: string;
    current?: number;
    required?: number;
  }>;
  total_alerts?: number;
  message?: string;
}

export interface InvestmentRecommendation {
  recommendation: {
    total_amount: number;
    allocations: Array<{
      ticker: string;
      quantity?: number;
      unit_price?: number;
      amount: number;
      reason: string;
    }>;
    remaining_balance?: number;
    strategy_type?: string;
    reasoning?: string;
    message?: string;
  };
  error?: string;
}

export interface Quote {
  ticker: string;
  price: number;
  change_percent: number;
  market_cap?: number;
  volume?: number;
  pe_ratio?: number;
  price_to_book?: number;
  dividend_yield?: number;
}

// Filters
export interface PortfoliosFilters {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface AssetsFilters {
  portfolio?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface StrategiesFilters {
  portfolio?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Query keys - usando funções para evitar referência circular
const baseKey = ["investments"] as const;

export const investmentsKeys = {
  all: baseKey,
  portfolios: {
    all: () => [...baseKey, "portfolios"] as const,
    lists: () => [...baseKey, "portfolios", "list"] as const,
    list: (filters?: PortfoliosFilters) =>
      [...baseKey, "portfolios", "list", filters] as const,
    details: () => [...baseKey, "portfolios", "detail"] as const,
    detail: (id: string) => [...baseKey, "portfolios", "detail", id] as const,
    status: (id: string) => [...baseKey, "portfolios", "detail", id, "status"] as const,
  },
  assets: {
    all: () => [...baseKey, "assets"] as const,
    lists: () => [...baseKey, "assets", "list"] as const,
    list: (filters?: AssetsFilters) =>
      [...baseKey, "assets", "list", filters] as const,
    details: () => [...baseKey, "assets", "detail"] as const,
    detail: (id: string) => [...baseKey, "assets", "detail", id] as const,
  },
  strategies: {
    all: () => [...baseKey, "strategies"] as const,
    lists: () => [...baseKey, "strategies", "list"] as const,
    list: (filters?: StrategiesFilters) =>
      [...baseKey, "strategies", "list", filters] as const,
    details: () => [...baseKey, "strategies", "detail"] as const,
    detail: (id: string) => [...baseKey, "strategies", "detail", id] as const,
  },
  quotes: {
    all: () => [...baseKey, "quotes"] as const,
    detail: (ticker: string) => [...baseKey, "quotes", ticker] as const,
  },
};

// Portfolio hooks
export function usePortfolios(filters?: PortfoliosFilters) {
  return useQuery<Portfolio[], Error>({
    queryKey: investmentsKeys.portfolios.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.ordering) params.append("ordering", filters.ordering);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.page_size) params.append("page_size", filters.page_size.toString());

      const queryString = params.toString();
      const url = `/investments/portfolios/${queryString ? `?${queryString}` : ""}`;
      const response = await apiClient.get<Portfolio[] | { results: Portfolio[] }>(url);
      return Array.isArray(response.data)
        ? response.data
        : (response.data as { results: Portfolio[] }).results || [];
    },
  });
}

export function usePortfolio(id: string | null) {
  return useQuery<Portfolio, Error>({
    queryKey: investmentsKeys.portfolios.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<Portfolio>(`/investments/portfolios/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function usePortfolioStatus(id: string | null) {
  return useQuery<PortfolioStatus, Error>({
    queryKey: investmentsKeys.portfolios.status(id!),
    queryFn: async () => {
      const response = await apiClient.get<PortfolioStatus>(
        `/investments/portfolios/${id}/status/`
      );
      return response.data;
    },
    enabled: !!id,
    refetchInterval: 60000, // Refetch a cada minuto
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation<Portfolio, Error, Partial<Portfolio>>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Portfolio>("/investments/portfolios/", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas para forçar atualização
      queryClient.invalidateQueries({ queryKey: investmentsKeys.portfolios.all() });
      // Também invalidar estratégias pois uma nova estratégia pode ter sido criada
      queryClient.invalidateQueries({ queryKey: investmentsKeys.strategies.all() });
    },
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation<Portfolio, Error, { id: string; data: Partial<Portfolio> }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<Portfolio>(
        `/investments/portfolios/${id}/`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: investmentsKeys.portfolios.lists() });
      queryClient.invalidateQueries({
        queryKey: investmentsKeys.portfolios.detail(variables.id),
      });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/investments/portfolios/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentsKeys.portfolios.lists() });
    },
  });
}

export function useAnalyzeInvestment() {
  return useMutation<InvestmentRecommendation, Error, { portfolioId: string; amount: number }>(
    {
      mutationFn: async ({ portfolioId, amount }) => {
        const response = await apiClient.post<InvestmentRecommendation>(
          `/investments/portfolios/${portfolioId}/analyze/`,
          { amount }
        );
        return response.data;
      },
    }
  );
}

// Asset hooks
export function useAssets(filters?: AssetsFilters) {
  return useQuery<Asset[], Error>({
    queryKey: investmentsKeys.assets.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.portfolio) params.append("portfolio", filters.portfolio);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.ordering) params.append("ordering", filters.ordering);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.page_size) params.append("page_size", filters.page_size.toString());

      const queryString = params.toString();
      const url = `/investments/assets/${queryString ? `?${queryString}` : ""}`;
      const response = await apiClient.get<Asset[] | { results: Asset[] }>(url);
      return Array.isArray(response.data)
        ? response.data
        : (response.data as { results: Asset[] }).results || [];
    },
  });
}

export function useAsset(id: string | null) {
  return useQuery<Asset, Error>({
    queryKey: investmentsKeys.assets.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<Asset>(`/investments/assets/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation<Asset, Error, Partial<Asset>>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Asset>("/investments/assets/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentsKeys.assets.lists() });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation<Asset, Error, { id: string; data: Partial<Asset> }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<Asset>(`/investments/assets/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: investmentsKeys.assets.lists() });
      queryClient.invalidateQueries({ queryKey: investmentsKeys.assets.detail(variables.id) });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/investments/assets/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentsKeys.assets.lists() });
    },
  });
}

export function useUpdatePortfolioPrices() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; updated_count: number; errors: string[]; message: string },
    Error,
    string
  >({
    mutationFn: async (portfolioId) => {
      const response = await apiClient.post<{
        success: boolean;
        updated_count: number;
        errors: string[];
        message: string;
      }>(`/investments/portfolios/${portfolioId}/update-prices/`);
      return response.data;
    },
    onSuccess: (_, portfolioId) => {
      queryClient.invalidateQueries({ queryKey: investmentsKeys.assets.lists() });
      queryClient.invalidateQueries({ queryKey: investmentsKeys.portfolios.detail(portfolioId) });
    },
  });
}

// Strategy hooks
export function useStrategies(filters?: StrategiesFilters) {
  return useQuery<Strategy[], Error>({
    queryKey: investmentsKeys.strategies.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.portfolio) params.append("portfolio", filters.portfolio);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.ordering) params.append("ordering", filters.ordering);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.page_size) params.append("page_size", filters.page_size.toString());

      const queryString = params.toString();
      const url = `/investments/strategies/${queryString ? `?${queryString}` : ""}`;
      const response = await apiClient.get<Strategy[] | { results: Strategy[] }>(url);
      return Array.isArray(response.data)
        ? response.data
        : (response.data as { results: Strategy[] }).results || [];
    },
  });
}

export function useStrategy(portfolioId: string | null) {
  return useQuery<Strategy, Error>({
    queryKey: investmentsKeys.strategies.detail(portfolioId!),
    queryFn: async () => {
      // Buscar estratégia pelo portfolio_id
      const response = await apiClient.get<{ results: Strategy[] } | Strategy[]>(
        `/investments/strategies/?portfolio=${portfolioId}`
      );
      const strategies = Array.isArray(response.data)
        ? response.data
        : (response.data as { results: Strategy[] }).results || [];

      if (!strategies || strategies.length === 0) {
        throw new Error("Estratégia não encontrada");
      }

      return strategies[0];
    },
    enabled: !!portfolioId,
  });
}

export function useCreateStrategy() {
  const queryClient = useQueryClient();

  return useMutation<Strategy, Error, Partial<Strategy>>({
    mutationFn: async (data) => {
      const response = await apiClient.post<Strategy>("/investments/strategies/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentsKeys.strategies.lists() });
    },
  });
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient();

  return useMutation<Strategy, Error, { id: string; data: Partial<Strategy> }>({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<Strategy>(
        `/investments/strategies/${id}/`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: investmentsKeys.strategies.lists() });
      queryClient.invalidateQueries({
        queryKey: investmentsKeys.strategies.detail(variables.id),
      });
    },
  });
}

// Quote hooks
export function useQuote(ticker: string | null) {
  return useQuery<Quote, Error>({
    queryKey: investmentsKeys.quotes.detail(ticker!),
    queryFn: async () => {
      const response = await apiClient.get<Quote>(`/investments/quotes/${ticker}/`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutos (cache)
  });
}

