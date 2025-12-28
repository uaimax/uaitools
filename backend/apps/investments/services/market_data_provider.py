"""Provider unificado que combina Brapi e Yahoo Finance para dados completos."""

import logging
from typing import Any, Dict, Optional

from apps.investments.services.brapi_provider import BrapiProvider
from apps.investments.services.yahoo_finance_provider import YahooFinanceProvider

logger = logging.getLogger(__name__)


class MarketDataProvider:
    """Provider unificado que combina múltiplas fontes de dados de mercado.

    Usa Brapi como fonte primária (mais rápida) e Yahoo Finance como fallback
    para completar dados faltantes (DY, P/VP, histórico de dividendos).
    """

    def __init__(self) -> None:
        """Inicializa o provider."""
        self.brapi = BrapiProvider()
        self.yahoo = YahooFinanceProvider()

    def get_quote(self, ticker: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """Busca cotação atual de um ticker.

        Prioriza Brapi (mais rápido), usa Yahoo Finance como fallback.

        Args:
            ticker: Código do ativo
            use_cache: Se True, usa cache

        Returns:
            Dicionário com dados da cotação ou None se erro
        """
        # Priorizar Brapi (mais rápido)
        quote = self.brapi.get_quote(ticker, use_cache)
        if quote:
            return quote

        # Fallback para Yahoo Finance
        logger.info(f"Brapi não retornou cotação para {ticker}, tentando Yahoo Finance")
        return self.yahoo.get_quote(ticker, use_cache)

    def get_fundamental_data(
        self, ticker: str, use_cache: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Busca dados fundamentalistas de um ticker.

        Combina dados de Brapi e Yahoo Finance:
        - Brapi tem prioridade (mais rápido)
        - Yahoo Finance completa dados faltantes (DY, P/VP)

        Args:
            ticker: Código do ativo
            use_cache: Se True, usa cache

        Returns:
            Dicionário com dados fundamentalistas combinados ou None se erro
        """
        # Buscar dados de ambas fontes
        brapi_data = self.brapi.get_fundamental_data(ticker, use_cache)
        yahoo_data = self.yahoo.get_fundamental_data(ticker, use_cache)

        # Se nenhuma fonte retornou dados, retornar None
        if not brapi_data and not yahoo_data:
            return None

        # Começar com dados do Brapi (prioridade)
        result: Dict[str, Any] = {}
        if brapi_data:
            result = brapi_data.copy()
        elif yahoo_data:
            # Se só Yahoo Finance tem dados, usar como base
            result = yahoo_data.copy()

        # Completar dados faltantes com Yahoo Finance
        if yahoo_data:
            # Completar DY se não estiver disponível
            if not result.get("dividend_yield") and yahoo_data.get("dividend_yield") is not None:
                result["dividend_yield"] = yahoo_data["dividend_yield"]
                logger.debug(f"DY completado via Yahoo Finance para {ticker}: {yahoo_data['dividend_yield']}")

            # Completar P/VP se não estiver disponível
            if not result.get("price_to_book") and yahoo_data.get("price_to_book") is not None:
                result["price_to_book"] = yahoo_data["price_to_book"]
                logger.debug(f"P/VP completado via Yahoo Finance para {ticker}: {yahoo_data['price_to_book']}")

            # Completar P/L se não estiver disponível
            if not result.get("pe_ratio") and yahoo_data.get("pe_ratio") is not None:
                result["pe_ratio"] = yahoo_data["pe_ratio"]
                logger.debug(f"P/L completado via Yahoo Finance para {ticker}: {yahoo_data['pe_ratio']}")

            # Completar EPS se não estiver disponível
            if not result.get("earnings_per_share") and yahoo_data.get("earnings_per_share") is not None:
                result["earnings_per_share"] = yahoo_data["earnings_per_share"]

            # Completar preço se não estiver disponível
            if not result.get("price") and yahoo_data.get("price"):
                result["price"] = yahoo_data["price"]

            # Completar market cap se não estiver disponível
            if not result.get("market_cap") and yahoo_data.get("market_cap"):
                result["market_cap"] = yahoo_data["market_cap"]

        return result if result else None

    def get_dividend_history(
        self, ticker: str, use_cache: bool = True, workspace=None
    ) -> Optional[Dict[str, Any]]:
        """Busca histórico de dividendos de um ticker.

        Prioriza Brapi, usa Yahoo Finance como fallback.

        Args:
            ticker: Código do ativo
            use_cache: Se True, usa cache
            workspace: Workspace (ignorado, mantido para compatibilidade)

        Returns:
            Dicionário com histórico de dividendos ou None se erro
        """
        # Tentar Brapi primeiro
        history = self.brapi.get_dividend_history(ticker, use_cache, workspace)
        if history:
            return history

        # Fallback para Yahoo Finance
        logger.info(f"Brapi não retornou histórico de dividendos para {ticker}, tentando Yahoo Finance")
        return self.yahoo.get_dividend_history(ticker, use_cache, workspace)

    def get_multiple_quotes(
        self, tickers: list[str], use_cache: bool = True
    ) -> Dict[str, Optional[Dict[str, Any]]]:
        """Busca cotações de múltiplos tickers de uma vez.

        Usa Brapi (mais eficiente para múltiplos tickers).

        Args:
            tickers: Lista de códigos de ativos
            use_cache: Se True, usa cache

        Returns:
            Dicionário {ticker: dados} ou {ticker: None} se erro
        """
        return self.brapi.get_multiple_quotes(tickers, use_cache)


