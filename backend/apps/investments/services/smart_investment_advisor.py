"""Gerador de recomendações inteligentes de investimento."""

from decimal import Decimal
from typing import Any, Dict, List, Optional

from apps.investments.models import (
    Asset,
    Portfolio,
    StrategyTemplate,
    UserPreferences,
)
from apps.investments.services.brapi_provider import BrapiProvider
from apps.investments.services.context_analyzer import ContextAnalyzer
from apps.investments.services.openai_service import OpenAIService
from apps.investments.services.sector_mapper import SectorMapper


class SmartInvestmentAdvisor:
    """Gerador de recomendações inteligentes."""

    def __init__(self) -> None:
        """Inicializa o advisor."""
        self.brapi = BrapiProvider()
        self.context_analyzer = ContextAnalyzer()
        self.openai = OpenAIService()
        self.sector_mapper = SectorMapper()

    def generate_recommendation(
        self,
        portfolio: Portfolio,
        amount: Decimal,
        user_preference: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Gera recomendação inteligente baseada em contexto.

        Args:
            portfolio: Carteira do usuário
            amount: Valor a ser investido
            user_preference: Preferência do usuário (ex: "mais conservador", "mais agressivo")

        Returns:
            Dicionário com recomendação completa
        """
        # 1. Analisa contexto completo
        context = self.context_analyzer.analyze_user_context(portfolio)

        # 2. Seleciona e adapta estratégia
        strategy = self._select_and_adapt_strategy(context, user_preference)

        # 3. Busca dados de mercado atualizados
        market_data = self._get_market_data(portfolio)

        # 4. Gera alocações dinamicamente
        allocations = self._generate_dynamic_allocations(
            context,
            strategy,
            market_data,
            amount,
        )

        # 5. Aplica preferências do usuário
        preferences = self._get_user_preferences(portfolio)
        if preferences:
            allocations = self._apply_user_preferences(allocations, preferences)

        # 6. Valida e ajusta
        allocations = self._validate_and_adjust(
            allocations,
            context,
            market_data,
            amount,
        )

        # 7. Gera justificativa usando IA
        reasoning = self._generate_reasoning(
            allocations,
            context,
            strategy,
            amount,
        )

        # 8. Calcula saldo restante
        total_allocated = sum(a.get("amount", 0) for a in allocations)
        remaining_balance = float(amount) - total_allocated

        return {
            "recommendation": {
                "total_amount": float(amount),
                "allocations": allocations,
                "remaining_balance": remaining_balance,
                "reasoning": reasoning,
            },
            "strategy_used": strategy,
            "context_analyzed": {
                "profile": context.get("profile"),
                "market_context": context.get("market_context"),
            },
        }

    def _select_and_adapt_strategy(
        self,
        context: Dict[str, Any],
        user_preference: Optional[str],
    ) -> Dict[str, Any]:
        """Seleciona e adapta estratégia baseado em contexto.

        Returns:
            Dicionário com estratégia selecionada e adaptada
        """
        recommended_strategy = context.get("recommended_strategy")
        if not recommended_strategy:
            # Fallback: usar primeira estratégia disponível
            template = StrategyTemplate.objects.filter(is_active=True).first()
            if template:
                recommended_strategy = {
                    "id": template.id,
                    "name": template.name,
                    "slug": template.slug,
                    "category": template.category,
                    "performance_score": float(template.performance_score),
                }

        if not recommended_strategy:
            return None

        # Buscar template completo
        try:
            template = StrategyTemplate.objects.get(id=recommended_strategy["id"])
        except StrategyTemplate.DoesNotExist:
            return recommended_strategy

        # Adaptar critérios baseado em contexto e preferência do usuário
        adapted_criteria = template.base_criteria.copy()

        # Ajustes baseados em preferência do usuário
        if user_preference:
            if "conservador" in user_preference.lower():
                # Reduzir DY mínimo, aumentar diversificação
                if "dividend_yield_min" in adapted_criteria:
                    adapted_criteria["dividend_yield_min"] = max(0.05, adapted_criteria["dividend_yield_min"] - 0.01)
                if "min_diversification" in adapted_criteria:
                    adapted_criteria["min_diversification"] = min(0.85, adapted_criteria["min_diversification"] + 0.1)
            elif "agressivo" in user_preference.lower():
                # Aumentar DY mínimo, reduzir diversificação
                if "dividend_yield_min" in adapted_criteria:
                    adapted_criteria["dividend_yield_min"] = min(0.12, adapted_criteria["dividend_yield_min"] + 0.01)
                if "min_diversification" in adapted_criteria:
                    adapted_criteria["min_diversification"] = max(0.60, adapted_criteria["min_diversification"] - 0.1)

        # Ajustes baseados em contexto de mercado
        market_context = context.get("market_context", {})
        selic = market_context.get("selic")
        if selic and selic < 0.10:  # Selic < 10%
            # Reduzir DY mínimo em 1pp
            if "dividend_yield_min" in adapted_criteria:
                adapted_criteria["dividend_yield_min"] = max(0.05, adapted_criteria["dividend_yield_min"] - 0.01)

        return {
            **recommended_strategy,
            "adapted_criteria": adapted_criteria,
            "base_criteria": template.base_criteria,
            "adaptation_logic": template.adaptation_logic,
        }

    def _get_market_data(self, portfolio: Portfolio) -> Dict[str, Any]:
        """Busca dados de mercado atualizados.

        Returns:
            Dicionário com dados de mercado
        """
        # Buscar cotações e dados fundamentalistas dos ativos na carteira
        market_data = {}

        for asset in portfolio.assets.all():
            quote = self.brapi.get_quote(asset.ticker)
            fundamental = self.brapi.get_fundamental_data(asset.ticker)

            if quote or fundamental:
                market_data[asset.ticker] = {
                    "quote": quote,
                    "fundamental": fundamental,
                }

        return market_data

    def _generate_dynamic_allocations(
        self,
        context: Dict[str, Any],
        strategy: Dict[str, Any],
        market_data: Dict[str, Any],
        amount: Decimal,
    ) -> List[Dict[str, Any]]:
        """Gera alocações dinamicamente baseado em oportunidades atuais.

        Returns:
            Lista de alocações
        """
        if not strategy:
            return []

        criteria = strategy.get("adapted_criteria", {})
        portfolio_health = context.get("portfolio_health", {})
        current_allocations = {a["ticker"]: a["allocation_pct"] for a in portfolio_health.get("allocations", [])}

        # Buscar candidatos que atendem aos critérios
        candidates = self._find_candidates(criteria, market_data)

        if not candidates:
            return []

        # Ordenar candidatos por prioridade
        # Prioridade: mais distante da alocação-alvo, melhor DY, melhor P/L
        candidates.sort(
            key=lambda x: (
                -abs(x.get("target_allocation", 0) - current_allocations.get(x["ticker"], 0)),
                -x.get("dividend_yield", 0),
                x.get("pe_ratio", 999),
            ),
            reverse=True,
        )

        # Distribuir valor entre candidatos
        allocations = []
        remaining = float(amount)

        max_concentration = criteria.get("max_concentration_per_asset", 0.15)
        max_allocation_value = float(amount) * max_concentration

        for candidate in candidates:
            if remaining <= 0:
                break

            ticker = candidate["ticker"]
            price = candidate["price"]
            target_allocation = candidate.get("target_allocation", 0)
            current_allocation = current_allocations.get(ticker, 0)

            # Se já está acima da alocação-alvo, pular
            if current_allocation >= target_allocation:
                continue

            # Calcular quanto investir neste ativo
            # Proporcional à diferença entre alocação atual e alvo
            allocation_diff = target_allocation - current_allocation
            if allocation_diff <= 0:
                continue

            # Limitar pelo máximo de concentração
            allocation_amount = min(
                remaining,
                max_allocation_value,
                float(amount) * allocation_diff,
            )

            # Calcular quantidade (arredondar para baixo)
            quantity = int(allocation_amount / price)

            if quantity > 0:
                actual_amount = quantity * price
                allocations.append({
                    "ticker": ticker,
                    "quantity": quantity,
                    "unit_price": float(price),
                    "amount": actual_amount,
                    "reason": candidate.get("reason", ""),
                })
                remaining -= actual_amount

        return allocations

    def _find_candidates(
        self,
        criteria: Dict[str, Any],
        market_data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Encontra candidatos que atendem aos critérios.

        Returns:
            Lista de candidatos
        """
        candidates = []

        # Por enquanto, usar apenas ativos já na carteira
        # Futuramente, buscar todos os ativos disponíveis na B3

        for ticker, data in market_data.items():
            quote = data.get("quote")
            fundamental = data.get("fundamental")

            if not quote or not fundamental:
                continue

            price = quote.get("price", 0)
            if not price or price <= 0:
                continue

            dy = fundamental.get("dividend_yield") if fundamental else None
            pe_ratio = fundamental.get("pe_ratio") if fundamental else None
            pb_ratio = fundamental.get("price_to_book") if fundamental else None

            # Verificar critérios
            dy_min = criteria.get("dividend_yield_min", 0)
            dy_max = criteria.get("dividend_yield_max", 1.0)
            pe_max = criteria.get("pe_ratio_max", 999)
            pb_max = criteria.get("price_to_book_max", 999)

            # Verificar setores
            sector = self.sector_mapper.get_sector(ticker)
            allowed_sectors = criteria.get("allowed_sectors", [])
            excluded_sectors = criteria.get("excluded_sectors", [])

            if sector:
                if allowed_sectors and not self.sector_mapper.is_sector_allowed(sector, allowed_sectors):
                    continue
                if excluded_sectors and self.sector_mapper.is_sector_excluded(sector, excluded_sectors):
                    continue

            # Verificar critérios numéricos
            if dy is None or dy < dy_min or dy > dy_max:
                continue
            if pe_ratio is not None and pe_ratio > pe_max:
                continue
            if pb_ratio is not None and pb_ratio > pb_max:
                continue

            # Calcular preço-teto (se aplicável)
            price_ceiling = None
            if dy and dy > 0:
                # Preço-teto = dividendo / DY mínimo
                dividend_per_share = price * dy
                price_ceiling = dividend_per_share / dy_min if dy_min > 0 else None

            if price_ceiling and price > price_ceiling:
                continue

            candidates.append({
                "ticker": ticker,
                "price": float(price),
                "dividend_yield": float(dy) if dy else 0.0,
                "pe_ratio": pe_ratio if pe_ratio else 999,
                "price_to_book": pb_ratio if pb_ratio else 999,
                "sector": sector or "desconhecido",
                "target_allocation": 0.10,  # Padrão, pode ser ajustado
                "reason": f"DY {dy*100:.1f}%, P/L {pe_ratio:.1f}, setor {sector}" if dy and pe_ratio and sector else f"Ticker {ticker}",
            })

        return candidates

    def _get_user_preferences(self, portfolio: Portfolio) -> Optional[UserPreferences]:
        """Obtém preferências do usuário.

        Returns:
            UserPreferences ou None
        """
        try:
            return portfolio.preferences
        except UserPreferences.DoesNotExist:
            return None

    def _apply_user_preferences(
        self,
        allocations: List[Dict[str, Any]],
        preferences: UserPreferences,
    ) -> List[Dict[str, Any]]:
        """Aplica preferências do usuário nas alocações.

        Returns:
            Lista de alocações filtrada
        """
        filtered = []

        excluded_sectors = preferences.excluded_sectors or []
        excluded_tickers = preferences.restrictions.get("excluded_tickers", []) if preferences.restrictions else []

        for allocation in allocations:
            ticker = allocation["ticker"]

            # Verificar tickers excluídos
            if ticker in excluded_tickers:
                continue

            # Verificar setores excluídos
            sector = self.sector_mapper.get_sector(ticker)
            if sector and excluded_sectors:
                if self.sector_mapper.is_sector_excluded(sector, excluded_sectors):
                    continue

            filtered.append(allocation)

        return filtered

    def _validate_and_adjust(
        self,
        allocations: List[Dict[str, Any]],
        context: Dict[str, Any],
        market_data: Dict[str, Any],
        amount: Decimal,
    ) -> List[Dict[str, Any]]:
        """Valida e ajusta alocações.

        Returns:
            Lista de alocações validada
        """
        # Por enquanto, retornar como está
        # Futuramente, adicionar validações mais complexas
        return allocations

    def _generate_reasoning(
        self,
        allocations: List[Dict[str, Any]],
        context: Dict[str, Any],
        strategy: Dict[str, Any],
        amount: Decimal,
    ) -> str:
        """Gera justificativa usando IA.

        Returns:
            Justificativa em texto
        """
        if not self.openai.is_available():
            # Fallback: justificativa simples
            if allocations:
                return f"Recomendação baseada na estratégia '{strategy.get('name', '')}' com foco em {strategy.get('category', '')}."
            return "Nenhuma ação recomendada no momento. Aguarde melhores oportunidades."

        # TODO: Implementar geração de justificativa com IA
        # Por enquanto, retornar justificativa simples
        if allocations:
            return f"Com base na sua carteira atual e na estratégia '{strategy.get('name', '')}', recomendo distribuir R${amount:,.2f} entre {len(allocations)} ativos que atendem aos critérios de {strategy.get('category', '')}."

        return "Nenhuma ação recomendada no momento. Aguarde melhores oportunidades de mercado."

