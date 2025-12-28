"""Analisador de contexto completo do usuário."""

from decimal import Decimal
from typing import Any, Dict, List
from datetime import datetime, timedelta

from apps.investments.models import (
    Asset,
    DividendReceived,
    InvestorProfile,
    Portfolio,
    StrategyTemplate,
    Transaction,
)
from apps.investments.services.bcb_provider import BCBProvider
from apps.investments.services.market_data_provider import MarketDataProvider
from apps.investments.services.sector_mapper import SectorMapper
from apps.investments.services.openai_service import OpenAIService


class ContextAnalyzer:
    """Analisador de contexto completo do usuário."""

    def __init__(self) -> None:
        """Inicializa o analisador."""
        self.brapi = MarketDataProvider()
        self.bcb = BCBProvider()
        self.sector_mapper = SectorMapper()
        self.openai = OpenAIService()

    def analyze_user_context(
        self,
        portfolio: Portfolio,
    ) -> Dict[str, Any]:
        """Analisa contexto completo do usuário.

        Args:
            portfolio: Carteira a ser analisada

        Returns:
            Dicionário com:
            - profile: Perfil inferido
            - current_strategy: Estratégia atual (se houver)
            - recommended_strategy: Estratégia recomendada
            - market_context: Contexto de mercado
            - portfolio_health: Saúde da carteira
        """
        # Analisar componentes individuais
        portfolio_analysis = self._analyze_portfolio(portfolio)
        transaction_history = self._analyze_transactions(portfolio)
        recommendation_history = self._analyze_recommendations(portfolio)
        market_context = self._analyze_market_context()

        # Inferir perfil usando IA
        inferred_profile = self._infer_profile_with_ai(
            portfolio_analysis,
            transaction_history,
            recommendation_history,
            market_context,
        )

        # Recomendar estratégia
        recommended_strategy = self._recommend_strategy(
            inferred_profile,
            portfolio_analysis,
            market_context,
        )

        return {
            "profile": inferred_profile,
            "current_strategy": self._get_current_strategy(portfolio),
            "recommended_strategy": recommended_strategy,
            "market_context": market_context,
            "portfolio_health": portfolio_analysis,
        }

    def _analyze_portfolio(self, portfolio: Portfolio) -> Dict[str, Any]:
        """Analisa carteira atual.

        Returns:
            Dicionário com análise da carteira
        """
        assets = portfolio.assets.all()
        total_invested = portfolio.get_total_invested()

        # Calcular alocação por ativo
        allocations = []
        sector_allocation = {}
        total_dividend_yield = Decimal("0")
        active_tickers = 0

        for asset in assets:
            # Buscar cotação atual
            quote = self.brapi.get_quote(asset.ticker)
            current_price = quote.get("price") if quote else asset.average_price
            current_value = asset.quantity * current_price

            allocation_pct = (current_value / total_invested * 100) if total_invested > 0 else Decimal("0")

            allocations.append({
                "ticker": asset.ticker,
                "quantity": float(asset.quantity),
                "average_price": float(asset.average_price),
                "current_price": float(current_price),
                "current_value": float(current_value),
                "allocation_pct": float(allocation_pct),
            })

            # Agrupar por setor
            sector = self.sector_mapper.get_sector(asset.ticker)
            if sector:
                if sector not in sector_allocation:
                    sector_allocation[sector] = Decimal("0")
                sector_allocation[sector] += current_value

            # Calcular DY médio
            fundamental = self.brapi.get_fundamental_data(asset.ticker)
            if fundamental and fundamental.get("dividend_yield"):
                total_dividend_yield += Decimal(str(fundamental.get("dividend_yield", 0)))
                active_tickers += 1

        # Calcular diversificação (inverso da concentração)
        # Score de 0-1: quanto mais diversificado, maior
        if allocations:
            max_allocation = max(a["allocation_pct"] for a in allocations)
            diversification_score = 1.0 - (max_allocation / 100.0) if max_allocation > 0 else 1.0
        else:
            diversification_score = 0.0

        # Calcular concentração por setor
        concentration_risk = 0.0
        if total_invested > 0:
            for sector, value in sector_allocation.items():
                sector_pct = float(value / total_invested * 100)
                if sector_pct > concentration_risk:
                    concentration_risk = sector_pct
        concentration_risk = concentration_risk / 100.0  # Normalizar para 0-1

        average_dy = (total_dividend_yield / active_tickers) if active_tickers > 0 else Decimal("0")

        return {
            "total_invested": float(total_invested),
            "total_assets": len(assets),
            "allocations": allocations,
            "sector_allocation": {k: float(v) for k, v in sector_allocation.items()},
            "diversification_score": diversification_score,
            "concentration_risk": concentration_risk,
            "average_dividend_yield": float(average_dy),
        }

    def _analyze_transactions(self, portfolio: Portfolio) -> Dict[str, Any]:
        """Analisa histórico de transações.

        Returns:
            Dicionário com análise de transações
        """
        transactions = Transaction.objects.filter(
            portfolio=portfolio,
        ).order_by("-created_at")[:50]  # Últimas 50 transações

        if not transactions.exists():
            return {
                "total_transactions": 0,
                "buy_count": 0,
                "sell_count": 0,
                "average_holding_period": 0,
                "frequency": "baixa",
            }

        buy_count = sum(1 for t in transactions if t.transaction_type == "buy")
        sell_count = sum(1 for t in transactions if t.transaction_type == "sell")

        # Calcular período médio de retenção (simplificado)
        # Para cada compra, verificar quando foi vendida
        holding_periods = []
        for transaction in transactions:
            if transaction.transaction_type == "buy":
                # Buscar venda correspondente
                sell = Transaction.objects.filter(
                    portfolio=portfolio,
                    ticker=transaction.ticker,
                    transaction_type="sell",
                    created_at__gte=transaction.created_at,
                ).first()
                if sell:
                    days = (sell.created_at - transaction.created_at).days
                    holding_periods.append(days)

        average_holding_period = sum(holding_periods) / len(holding_periods) if holding_periods else 0

        # Frequência de transações
        if transactions.count() > 20:
            frequency = "alta"
        elif transactions.count() > 10:
            frequency = "média"
        else:
            frequency = "baixa"

        return {
            "total_transactions": transactions.count(),
            "buy_count": buy_count,
            "sell_count": sell_count,
            "average_holding_period": int(average_holding_period),
            "frequency": frequency,
        }

    def _analyze_recommendations(self, portfolio: Portfolio) -> Dict[str, Any]:
        """Analisa histórico de recomendações.

        Returns:
            Dicionário com análise de recomendações
        """
        # Por enquanto, retornar estrutura vazia
        # Futuramente, quando tivermos recomendações do novo sistema, analisar aqui
        return {
            "total_recommendations": 0,
            "followed_count": 0,
            "adherence_rate": 0.0,
        }

    def _analyze_market_context(self) -> Dict[str, Any]:
        """Analisa contexto de mercado atual.

        Returns:
            Dicionário com contexto de mercado
        """
        # Buscar dados do BCB
        market_indices = self.bcb.get_market_indices()

        # Buscar IBOV
        ibov_quote = self.brapi.get_quote("^BVSP")

        return {
            "selic": float(market_indices.get("selic", 0)) if market_indices.get("selic") else None,
            "ipca": float(market_indices.get("ipca", 0)) if market_indices.get("ipca") else None,
            "ibov": {
                "price": float(ibov_quote.get("price", 0)) if ibov_quote else None,
                "change_percent": float(ibov_quote.get("change_percent", 0)) if ibov_quote else None,
            } if ibov_quote else None,
            "timestamp": datetime.now().isoformat(),
        }

    def _infer_profile_with_ai(
        self,
        portfolio_analysis: Dict[str, Any],
        transaction_history: Dict[str, Any],
        recommendation_history: Dict[str, Any],
        market_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Usa IA para inferir perfil do investidor.

        Returns:
            Dicionário com perfil inferido
        """
        if not self.openai.is_available():
            # Fallback: perfil padrão conservador
            return {
                "risk_tolerance": "conservador",
                "investment_horizon": "longo",
                "primary_goal": "renda_passiva",
                "experience_level": "iniciante",
                "confidence_score": 0.5,
            }

        # TODO: Implementar inferência com IA
        # Por enquanto, retornar perfil baseado em heurísticas simples
        diversification = portfolio_analysis.get("diversification_score", 0)
        concentration = portfolio_analysis.get("concentration_risk", 0)
        avg_dy = portfolio_analysis.get("average_dividend_yield", 0)

        # Heurísticas simples
        if diversification > 0.7 and concentration < 0.3:
            risk_tolerance = "conservador"
        elif diversification > 0.5:
            risk_tolerance = "moderado"
        else:
            risk_tolerance = "arrojado"

        if avg_dy > 0.08:
            primary_goal = "renda_passiva"
        else:
            primary_goal = "crescimento"

        return {
            "risk_tolerance": risk_tolerance,
            "investment_horizon": "longo",  # Padrão
            "primary_goal": primary_goal,
            "experience_level": "iniciante",  # Padrão
            "confidence_score": 0.6,
        }

    def _recommend_strategy(
        self,
        inferred_profile: Dict[str, Any],
        portfolio_analysis: Dict[str, Any],
        market_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Recomenda estratégia adequada baseado em contexto.

        Returns:
            Dicionário com estratégia recomendada
        """
        # Buscar templates ativos
        templates = StrategyTemplate.objects.filter(
            is_active=True,
        ).order_by("-performance_score", "-priority")

        if not templates.exists():
            return None

        # Selecionar template baseado em perfil
        risk_tolerance = inferred_profile.get("risk_tolerance", "conservador")
        primary_goal = inferred_profile.get("primary_goal", "renda_passiva")

        # Lógica simples de seleção
        recommended = None
        for template in templates:
            if primary_goal == "renda_passiva" and template.category == "dividendos":
                recommended = template
                break
            elif primary_goal == "crescimento" and template.category == "growth":
                recommended = template
                break
            elif risk_tolerance == "conservador" and template.slug == "conservador":
                recommended = template
                break

        # Se não encontrou match específico, usar o primeiro (maior score)
        if not recommended:
            recommended = templates.first()

        if recommended:
            return {
                "id": recommended.id,
                "name": recommended.name,
                "slug": recommended.slug,
                "category": recommended.category,
                "performance_score": float(recommended.performance_score),
                "description": recommended.description,
            }

        return None

    def _get_current_strategy(self, portfolio: Portfolio) -> Dict[str, Any] | None:
        """Obtém estratégia atual da carteira (se houver).

        Returns:
            Dicionário com estratégia atual ou None
        """
        # Verificar se há perfil com estratégia associada
        try:
            profile = portfolio.profile
            # Se houver perfil, pode ter estratégia associada
            # Por enquanto, retornar None
            return None
        except InvestorProfile.DoesNotExist:
            return None

