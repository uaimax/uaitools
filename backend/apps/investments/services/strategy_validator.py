"""Validador de estratégias."""

from typing import Any, Dict
from datetime import datetime

from apps.investments.models import (
    Portfolio,
    StrategyTemplate,
    StrategyValidation,
)
from apps.investments.services.bcb_provider import BCBProvider
from apps.investments.services.brapi_provider import BrapiProvider
from apps.investments.services.context_analyzer import ContextAnalyzer


class StrategyValidator:
    """Validador de estratégias."""

    def __init__(self) -> None:
        """Inicializa o validador."""
        self.brapi = BrapiProvider()
        self.bcb = BCBProvider()
        self.context_analyzer = ContextAnalyzer()

    def validate_strategy(
        self,
        portfolio: Portfolio,
        strategy_template: StrategyTemplate,
    ) -> StrategyValidation:
        """Valida uma estratégia para uma carteira.

        Args:
            portfolio: Carteira a validar
            strategy_template: Template de estratégia a validar

        Returns:
            StrategyValidation criado
        """
        # Analisar contexto
        context = self.context_analyzer.analyze_user_context(portfolio)
        market_context = context.get("market_context", {})
        portfolio_health = context.get("portfolio_health", {})

        # Validar critérios
        criteria = strategy_template.base_criteria
        validation_result = self._validate_criteria(
            criteria,
            portfolio_health,
            market_context,
        )

        # Determinar status
        validation_status = self._determine_status(validation_result)

        # Gerar ajustes sugeridos
        suggested_adjustments = self._generate_adjustments(
            validation_result,
            criteria,
            market_context,
        )

        # Criar registro de validação
        validation = StrategyValidation.objects.create(
            workspace=portfolio.workspace,
            portfolio=portfolio,
            strategy_template=strategy_template,
            validation_status=validation_status,
            validation_result=validation_result,
            suggested_adjustments=suggested_adjustments,
            validated_by="ai",
        )

        # Atualizar status do template
        from django.utils import timezone
        strategy_template.validation_status = validation_status
        strategy_template.last_validated = timezone.now()
        strategy_template.save(update_fields=["validation_status", "last_validated"])

        return validation

    def _validate_criteria(
        self,
        criteria: Dict[str, Any],
        portfolio_health: Dict[str, Any],
        market_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Valida critérios da estratégia.

        Returns:
            Dicionário com resultado da validação
        """
        result = {
            "criteria_valid": True,
            "market_conditions_ok": True,
            "issues": [],
            "warnings": [],
        }

        # Validar diversificação
        min_diversification = criteria.get("min_diversification", 0)
        diversification_score = portfolio_health.get("diversification_score", 0)
        if diversification_score < min_diversification:
            result["criteria_valid"] = False
            result["issues"].append(
                f"Diversificação abaixo do mínimo: {diversification_score:.2%} < {min_diversification:.2%}"
            )

        # Validar concentração
        max_concentration = criteria.get("max_concentration_per_asset", 1.0)
        allocations = portfolio_health.get("allocations", [])
        for allocation in allocations:
            if allocation.get("allocation_pct", 0) > max_concentration * 100:
                result["warnings"].append(
                    f"Concentração alta em {allocation['ticker']}: {allocation['allocation_pct']:.2f}%"
                )

        # Validar contexto de mercado
        selic = market_context.get("selic")
        if selic and selic > 0.15:  # Selic > 15%
            result["warnings"].append("Taxa Selic alta pode afetar estratégia de dividendos")

        return result

    def _determine_status(self, validation_result: Dict[str, Any]) -> str:
        """Determina status da validação.

        Returns:
            Status: 'valid', 'needs_review', 'invalid', 'warning'
        """
        if not validation_result.get("criteria_valid"):
            return "invalid"
        if validation_result.get("warnings"):
            return "warning"
        if validation_result.get("issues"):
            return "needs_review"
        return "valid"

    def _generate_adjustments(
        self,
        validation_result: Dict[str, Any],
        criteria: Dict[str, Any],
        market_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Gera ajustes sugeridos.

        Returns:
            Dicionário com ajustes sugeridos
        """
        adjustments = {}

        # Ajustes baseados em warnings
        if validation_result.get("warnings"):
            adjustments["recommendations"] = [
                "Considere reduzir concentração em ativos individuais",
                "Diversifique mais a carteira",
            ]

        # Ajustes baseados em contexto de mercado
        selic = market_context.get("selic")
        if selic and selic > 0.12:
            adjustments["dy_adjustment"] = "Reduzir DY mínimo em 1pp devido a Selic alta"

        return adjustments

