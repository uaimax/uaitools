"""Background tasks para o módulo de investimentos."""

import json
from datetime import datetime, timedelta
from typing import Any, Dict

from celery import shared_task
from django.utils import timezone

from apps.investments.models import Portfolio, StrategyTemplate
from apps.investments.services.data_freshness_manager import DataFreshnessManager
from apps.investments.services.performance_calculator import PerformanceCalculator
from apps.investments.services.strategy_validator import StrategyValidator
from apps.investments.services.context_analyzer import ContextAnalyzer
from apps.investments.services.brapi_provider import BrapiProvider
from apps.investments.services.bcb_provider import BCBProvider


def _debug_log(location: str, message: str, data: dict, hypothesis_id: str = "A"):
    """Log de debug para análise de hipóteses."""
    try:
        log_entry = {
            "id": f"log_{int(timezone.now().timestamp() * 1000)}",
            "timestamp": int(timezone.now().timestamp() * 1000),
            "location": location,
            "message": message,
            "data": data,
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": hypothesis_id,
        }
        with open("/home/uaimax/projects/uaitools/.cursor/debug.log", "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass  # Ignorar erros de logging


@shared_task(name="investments.update_market_data")
def update_market_data() -> Dict[str, Any]:
    """Atualiza dados de mercado a cada 5 minutos durante pregão (10h-17h).

    Atualiza:
    - Cotações de ativos na carteira
    - Dados fundamentalistas
    - Histórico de dividendos (se necessário)
    - Selic, IBOV
    """
    freshness_manager = DataFreshnessManager()
    brapi = BrapiProvider()
    bcb = BCBProvider()

    # #region agent log
    _debug_log(
        "tasks.py:48",
        "DataFreshnessManager instanciado",
        {"methods": [m for m in dir(freshness_manager) if not m.startswith("_")]},
        "A",
    )
    # #endregion

    updated_count = 0
    errors = []

    try:
        # Coletar portfolios e agrupar por workspace
        portfolios = Portfolio.objects.select_related("workspace").all()
        workspace_tickers: Dict[Any, set] = {}  # workspace -> set de tickers

        for portfolio in portfolios:
            workspace = portfolio.workspace
            if workspace not in workspace_tickers:
                workspace_tickers[workspace] = set()
            for asset in portfolio.assets.all():
                workspace_tickers[workspace].add(asset.ticker)

        # #region agent log
        _debug_log(
            "tasks.py:70",
            "Portfolios e workspaces coletados",
            {
                "portfolios_count": portfolios.count(),
                "workspaces_count": len(workspace_tickers),
                "total_tickers": sum(len(tickers) for tickers in workspace_tickers.values()),
            },
            "B",
        )
        # #endregion

        # Processar cada workspace separadamente
        for workspace, tickers in workspace_tickers.items():
            # Atualizar cotações
            for ticker in tickers:
                try:
                    # #region agent log
                    _debug_log(
                        "tasks.py:85",
                        "Verificando se precisa atualizar cotação",
                        {"workspace_id": workspace.id, "ticker": ticker},
                        "A",
                    )
                    # #endregion
                    # Verificar se precisa atualizar (usa is_fresh que requer workspace)
                    if not freshness_manager.is_fresh(workspace, "quote", ticker):
                        quote = brapi.get_quote(ticker)
                        if quote:
                            # #region agent log
                            _debug_log(
                                "tasks.py:93",
                                "Atualizando dados de cotação",
                                {"workspace_id": workspace.id, "ticker": ticker},
                                "B",
                            )
                            # #endregion
                            freshness_manager.mark_updated(workspace, "quote", ticker)
                            updated_count += 1
                except Exception as e:
                    errors.append(f"Erro ao atualizar cotação {ticker}: {str(e)}")

            # Atualizar dados fundamentalistas
            for ticker in tickers:
                try:
                    # #region agent log
                    _debug_log(
                        "tasks.py:107",
                        "Verificando se precisa atualizar fundamental",
                        {"workspace_id": workspace.id, "ticker": ticker},
                        "A",
                    )
                    # #endregion
                    if not freshness_manager.is_fresh(workspace, "fundamental", ticker):
                        fundamental = brapi.get_fundamental_data(ticker)
                        if fundamental:
                            # #region agent log
                            _debug_log(
                                "tasks.py:115",
                                "Atualizando dados fundamentalistas",
                                {"workspace_id": workspace.id, "ticker": ticker},
                                "B",
                            )
                            # #endregion
                            freshness_manager.mark_updated(workspace, "fundamental", ticker)
                            updated_count += 1
                except Exception as e:
                    errors.append(f"Erro ao atualizar fundamental {ticker}: {str(e)}")

        # Atualizar Selic e IBOV (dados globais, processar uma vez por workspace)
        processed_workspaces = set()
        for workspace in workspace_tickers.keys():
            if workspace in processed_workspaces:
                continue
            processed_workspaces.add(workspace)
            try:
                # #region agent log
                _debug_log(
                    "tasks.py:135",
                    "Verificando se precisa atualizar contexto de mercado",
                    {"workspace_id": workspace.id, "data_type": "market_context"},
                    "A",
                )
                # #endregion
                if not freshness_manager.is_fresh(workspace, "market_context"):
                    bcb.get_selic_rate()
                    bcb.get_ipca()
                    brapi.get_quote("^BVSP")  # IBOV
                    # #region agent log
                    _debug_log(
                        "tasks.py:143",
                        "Atualizando contexto de mercado",
                        {"workspace_id": workspace.id, "data_type": "market_context"},
                        "B",
                    )
                    # #endregion
                    freshness_manager.mark_updated(workspace, "market_context")
                    updated_count += 1
            except Exception as e:
                errors.append(f"Erro ao atualizar contexto de mercado: {str(e)}")

        return {
            "success": True,
            "updated_count": updated_count,
            "errors": errors,
            "timestamp": timezone.now().isoformat(),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": timezone.now().isoformat(),
        }


@shared_task(name="investments.revalidate_strategies")
def revalidate_strategies() -> Dict[str, Any]:
    """Revalida todas as estratégias ativas diariamente (18h).

    Valida:
    - Critérios ainda fazem sentido no mercado atual
    - Condições de mercado são adequadas
    - Sugere ajustes quando necessário
    """
    validator = StrategyValidator()
    templates = StrategyTemplate.objects.filter(is_active=True)

    validated_count = 0
    needs_review_count = 0
    errors = []

    for template in templates:
        try:
            # Buscar portfolios que usam esta estratégia
            portfolios = Portfolio.objects.filter(workspace=template.workspace)

            for portfolio in portfolios:
                validation = validator.validate_strategy(portfolio, template)

                if validation.validation_status == "needs_review":
                    needs_review_count += 1

                validated_count += 1

        except Exception as e:
            errors.append(f"Erro ao validar estratégia {template.id}: {str(e)}")

    return {
        "success": True,
        "validated_count": validated_count,
        "needs_review_count": needs_review_count,
        "errors": errors,
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(name="investments.calculate_performance")
def calculate_performance() -> Dict[str, Any]:
    """Calcula performance semanalmente (domingo, 20h).

    Calcula:
    - Retorno total
    - DY realizado
    - Taxa de aderência
    - Score de performance
    - Comparação com IBOV
    """
    calculator = PerformanceCalculator()
    templates = StrategyTemplate.objects.filter(is_active=True)

    calculated_count = 0
    errors = []

    # Período: última semana
    period_end = timezone.now().date()
    period_start = period_end - timedelta(days=7)

    for template in templates:
        try:
            portfolios = Portfolio.objects.filter(workspace=template.workspace)

            for portfolio in portfolios:
                performance = calculator.calculate_strategy_performance(
                    template,
                    portfolio,
                    period_start,
                    period_end,
                )

                if performance:
                    calculated_count += 1

        except Exception as e:
            errors.append(f"Erro ao calcular performance {template.id}: {str(e)}")

    # Atualizar scores de todas as estratégias
    try:
        calculator.update_all_performance_scores()
    except Exception as e:
        errors.append(f"Erro ao atualizar scores: {str(e)}")

    return {
        "success": True,
        "calculated_count": calculated_count,
        "errors": errors,
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(name="investments.analyze_profiles")
def analyze_profiles() -> Dict[str, Any]:
    """Re-analisa perfis dos investidores semanalmente (domingo, 21h).

    Analisa:
    - Perfil do investidor (risco, horizonte, objetivo)
    - Comportamento (aderência, frequência)
    - Atualiza InvestorProfile
    """
    analyzer = ContextAnalyzer()
    portfolios = Portfolio.objects.all()

    analyzed_count = 0
    errors = []

    for portfolio in portfolios:
        try:
            # Analisar contexto completo
            context = analyzer.analyze_user_context(portfolio)

            # Atualizar perfil (se necessário)
            # TODO: Implementar atualização de InvestorProfile baseado em context
            analyzed_count += 1

        except Exception as e:
            errors.append(f"Erro ao analisar perfil {portfolio.id}: {str(e)}")

    return {
        "success": True,
        "analyzed_count": analyzed_count,
        "errors": errors,
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(name="investments.cleanup_cache")
def cleanup_cache() -> Dict[str, Any]:
    """Limpa cache antigo diariamente (02h).

    Remove:
    - Cache expirado
    - Dados de freshness antigos
    - Otimiza DataFreshness
    """
    freshness_manager = DataFreshnessManager()

    cleaned_count = 0
    errors = []

    try:
        # Limpar registros de freshness muito antigos (mais de 30 dias)
        from apps.investments.models import DataFreshness

        cutoff_date = timezone.now() - timedelta(days=30)
        old_records = DataFreshness.objects.filter(
            last_updated__lt=cutoff_date,
        )

        cleaned_count = old_records.count()
        old_records.delete()

    except Exception as e:
        errors.append(f"Erro ao limpar cache: {str(e)}")

    return {
        "success": True,
        "cleaned_count": cleaned_count,
        "errors": errors,
        "timestamp": timezone.now().isoformat(),
    }


