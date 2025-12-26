/** Hooks para o sistema inteligente de investimentos. */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

// Types
export interface StrategyTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "dividendos" | "value" | "growth" | "hibrida";
  base_criteria: Record<string, any>;
  performance_score: number;
  performance_score_display: string;
  is_active: boolean;
  validation_status: string;
}

export interface InvestorProfile {
  id: string;
  portfolio: string;
  risk_tolerance: "conservador" | "moderado" | "arrojado";
  investment_horizon: "curto" | "medio" | "longo";
  primary_goal: "renda_passiva" | "crescimento" | "preservacao";
  experience_level: "iniciante" | "intermediario" | "avancado";
  total_invested: number;
  average_dividend_yield: number;
  diversification_score: number;
  concentration_risk: number;
  confidence_score: number;
}

export interface UserPreferences {
  id: string;
  portfolio: string;
  excluded_sectors: string[];
  preferred_sectors: string[];
  additional_criteria?: string;
  restrictions: Record<string, any>;
}

export interface SmartRecommendation {
  recommendation: {
    total_amount: number;
    allocations: Array<{
      ticker: string;
      quantity: number;
      unit_price: number;
      amount: number;
      reason: string;
    }>;
    remaining_balance: number;
    reasoning: string;
  };
  strategy_used: {
    id: string;
    name: string;
    slug: string;
    category: string;
    performance_score: number;
  } | null;
  context_analyzed: {
    profile: InvestorProfile | null;
    market_context: Record<string, any>;
  };
}

export interface PortfolioContext {
  profile: InvestorProfile | null;
  current_strategy: any;
  recommended_strategy: {
    id: string;
    name: string;
    slug: string;
    category: string;
    performance_score: number;
  } | null;
  market_context: {
    selic: number | null;
    ipca: number | null;
    ibov: {
      price: number | null;
      change_percent: number | null;
    } | null;
  };
  portfolio_health: {
    total_invested: number;
    total_assets: number;
    diversification_score: number;
    concentration_risk: number;
    average_dividend_yield: number;
  };
}

export interface PortfolioChatMessage {
  id: string;
  portfolio: string;
  message: string;
  is_from_user: boolean;
  ai_response?: string;
  ai_confidence?: number;
  created_at: string;
}

// Query keys
const smartKeys = {
  all: ["investments", "smart"] as const,
  strategyTemplates: {
    all: () => [...smartKeys.all, "strategy-templates"] as const,
    list: () => [...smartKeys.all, "strategy-templates", "list"] as const,
  },
  portfolioContext: (id: string) => [...smartKeys.all, "portfolio", id, "context"] as const,
  portfolioPreferences: (id: string) => [...smartKeys.all, "portfolio", id, "preferences"] as const,
  portfolioChat: (id: string) => [...smartKeys.all, "portfolio", id, "chat"] as const,
};

// Hooks
export function useStrategyTemplates() {
  return useQuery<StrategyTemplate[], Error>({
    queryKey: smartKeys.strategyTemplates.list(),
    queryFn: async () => {
      const response = await apiClient.get<{ templates: StrategyTemplate[] } | StrategyTemplate[]>(
        "/investments/strategy-templates/?is_active=true"
      );
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      return (data as { templates: StrategyTemplate[] }).templates || [];
    },
  });
}

export function usePortfolioContext(portfolioId: string | null) {
  return useQuery<PortfolioContext, Error>({
    queryKey: smartKeys.portfolioContext(portfolioId!),
    queryFn: async () => {
      const response = await apiClient.get<PortfolioContext>(
        `/investments/portfolios/${portfolioId}/context/`
      );
      return response.data;
    },
    enabled: !!portfolioId,
  });
}

export function usePortfolioPreferences(portfolioId: string | null) {
  return useQuery<UserPreferences, Error>({
    queryKey: smartKeys.portfolioPreferences(portfolioId!),
    queryFn: async () => {
      const response = await apiClient.get<UserPreferences>(
        `/investments/portfolios/${portfolioId}/preferences/`
      );
      return response.data;
    },
    enabled: !!portfolioId,
  });
}

export function useUpdatePortfolioPreferences() {
  const queryClient = useQueryClient();

  return useMutation<
    UserPreferences,
    Error,
    { portfolioId: string; data: Partial<UserPreferences> }
  >({
    mutationFn: async ({ portfolioId, data }) => {
      const response = await apiClient.put<UserPreferences>(
        `/investments/portfolios/${portfolioId}/preferences/`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: smartKeys.portfolioPreferences(variables.portfolioId),
      });
    },
  });
}

export function useSmartRecommendation() {
  return useMutation<
    SmartRecommendation,
    Error,
    { portfolioId: string; amount: number; userPreference?: string }
  >({
    mutationFn: async ({ portfolioId, amount, userPreference }) => {
      const response = await apiClient.post<SmartRecommendation>(
        `/investments/portfolios/${portfolioId}/smart-recommendation/`,
        {
          amount,
          user_preference: userPreference,
        }
      );
      return response.data;
    },
  });
}

export function usePortfolioChat(portfolioId: string | null) {
  return useQuery<PortfolioChatMessage[], Error>({
    queryKey: smartKeys.portfolioChat(portfolioId!),
    queryFn: async () => {
      const response = await apiClient.get<{ messages: PortfolioChatMessage[] }>(
        `/investments/portfolios/${portfolioId}/chat/`
      );
      return response.data.messages || [];
    },
    enabled: !!portfolioId,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    PortfolioChatMessage,
    Error,
    { portfolioId: string; message: string }
  >({
    mutationFn: async ({ portfolioId, message }) => {
      const response = await apiClient.post<PortfolioChatMessage>(
        `/investments/portfolios/${portfolioId}/chat/`,
        { message }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: smartKeys.portfolioChat(variables.portfolioId),
      });
    },
  });
}

export function useValidateStrategy() {
  return useMutation<
    any,
    Error,
    { portfolioId: string; strategyTemplateId: string }
  >({
    mutationFn: async ({ portfolioId, strategyTemplateId }) => {
      const response = await apiClient.post(
        `/investments/portfolios/${portfolioId}/validate-strategy/`,
        { strategy_template_id: strategyTemplateId }
      );
      return response.data;
    },
  });
}

export function useStrategyPerformance() {
  return useQuery<
    any,
    Error,
    any,
    [string, string, string, string | undefined, string | undefined]
  >({
    queryKey: ["investments", "smart", "strategy-performance"],
    queryFn: async ({ queryKey }) => {
      // Este hook será usado com parâmetros dinâmicos
      return null;
    },
    enabled: false,
  });
}

