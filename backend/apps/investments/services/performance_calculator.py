"""Calculador de performance de estratégias."""

from decimal import Decimal
from typing import Any, Dict
from datetime import datetime, timedelta, date

from apps.investments.models import (
    Asset,
    DividendReceived,
    Portfolio,
    StrategyPerformance,
    StrategyTemplate,
    Transaction,
)
from apps.investments.services.market_data_provider import MarketDataProvider


class PerformanceCalculator:
    """Calculador de performance de estratégias."""

    def __init__(self) -> None:
        """Inicializa o calculador."""
        self.brapi = MarketDataProvider()

    def calculate_performance(
        self,
        portfolio: Portfolio,
        strategy_template: StrategyTemplate,
        period_start: date | None = None,
        period_end: date | None = None,
    ) -> StrategyPerformance:
        """Calcula performance de uma estratégia.

        Args:
            portfolio: Carteira a calcular
            strategy_template: Template de estratégia
            period_start: Início do período (padrão: 3 meses atrás)
            period_end: Fim do período (padrão: hoje)

        Returns:
            StrategyPerformance criado
        """
        if not period_end:
            period_end = date.today()
        if not period_start:
            # 3 meses atrás
            period_start = date.today() - timedelta(days=90)

        # Calcular retorno total
        total_return = self._calculate_total_return(portfolio, period_start, period_end)

        # Calcular DY realizado
        dividend_yield_realized = self._calculate_dividend_yield_realized(
            portfolio,
            period_start,
            period_end,
        )

        # Contar recomendações (por enquanto, usar transações como proxy)
        recommendations_followed, recommendations_total = self._count_recommendations(
            portfolio,
            period_start,
            period_end,
        )

        # Calcular taxa de aderência
        adherence_rate = (
            Decimal(str(recommendations_followed)) / Decimal(str(recommendations_total))
            if recommendations_total > 0
            else Decimal("0")
        )

        # Calcular score de performance
        # Score = (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2) * 100
        performance_score = (
            total_return * Decimal("0.4")
            + dividend_yield_realized * Decimal("0.4")
            + adherence_rate * Decimal("0.2")
        ) * Decimal("100")

        # Comparar com IBOV
        vs_ibovespa = self._compare_with_ibov(period_start, period_end, total_return)

        # Criar registro de performance
        performance = StrategyPerformance.objects.create(
            workspace=portfolio.workspace,
            portfolio=portfolio,
            strategy_template=strategy_template,
            period_start=period_start,
            period_end=period_end,
            total_return=float(total_return),
            dividend_yield_realized=float(dividend_yield_realized),
            recommendations_followed=recommendations_followed,
            recommendations_total=recommendations_total,
            adherence_rate=float(adherence_rate),
            performance_score=float(performance_score),
            vs_ibovespa=float(vs_ibovespa),
        )

        # Atualizar score do template
        strategy_template.performance_score = performance_score / Decimal("20")  # Converter para 0-5
        strategy_template.save(update_fields=["performance_score"])

        return performance

    def _calculate_total_return(
        self,
        portfolio: Portfolio,
        period_start: date,
        period_end: date,
    ) -> Decimal:
        """Calcula retorno total no período.

        Returns:
            Retorno total em decimal (ex: 0.15 para 15%)
        """
        # Por enquanto, retornar 0 (implementação simplificada)
        # Futuramente, calcular baseado em valor inicial vs valor final
        return Decimal("0")

    def _calculate_dividend_yield_realized(
        self,
        portfolio: Portfolio,
        period_start: date,
        period_end: date,
    ) -> Decimal:
        """Calcula DY realizado no período.

        Returns:
            DY realizado em decimal
        """
        # Buscar dividendos recebidos no período
        dividends = DividendReceived.objects.filter(
            portfolio=portfolio,
            payment_date__gte=period_start,
            payment_date__lte=period_end,
        )

        total_dividends = sum(d.total_net for d in dividends)

        # Calcular valor investido médio no período
        total_invested = portfolio.get_total_invested()

        if total_invested > 0:
            return Decimal(str(total_dividends)) / Decimal(str(total_invested))
        return Decimal("0")

    def _count_recommendations(
        self,
        portfolio: Portfolio,
        period_start: date,
        period_end: date,
    ) -> tuple[int, int]:
        """Conta recomendações seguidas e total.

        Returns:
            Tupla (seguidas, total)
        """
        # Por enquanto, usar transações como proxy
        transactions = Transaction.objects.filter(
            portfolio=portfolio,
            created_at__date__gte=period_start,
            created_at__date__lte=period_end,
        )

        total = transactions.count()
        followed = transactions.filter(recommendation_id__isnull=False).count()

        return followed, total

    def _compare_with_ibov(
        self,
        period_start: date,
        period_end: date,
        portfolio_return: Decimal,
    ) -> Decimal:
        """Compara retorno com IBOV.

        Returns:
            Diferença percentual vs IBOV
        """
        # Por enquanto, retornar 0 (implementação simplificada)
        # Futuramente, buscar variação do IBOV no período
        return Decimal("0")

