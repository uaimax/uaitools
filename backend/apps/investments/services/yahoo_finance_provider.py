"""Provider para buscar dados de cotações via Yahoo Finance API (yfinance)."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from decimal import Decimal

import yfinance as yf
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)


class YahooFinanceProvider:
    """Provider para buscar cotações e dados fundamentalistas via Yahoo Finance."""

    CACHE_TIMEOUT = 300  # 5 minutos
    DIVIDEND_CACHE_TIMEOUT = 3600  # 1 hora

    def __init__(self) -> None:
        """Inicializa o provider."""
        pass

    def _get_cache_key(self, ticker: str, endpoint: str = "fundamental") -> str:
        """Gera chave de cache."""
        return f"yahoo:{endpoint}:{ticker.upper()}"

    def _convert_ticker(self, ticker: str) -> str:
        """Converte ticker brasileiro para formato Yahoo Finance.

        Args:
            ticker: Código do ativo (ex: CPFE3, TAEE11)

        Returns:
            Ticker no formato Yahoo Finance (ex: CPFE3.SA)
        """
        ticker = ticker.upper().strip()
        # Se já tem .SA, retornar como está
        if ticker.endswith(".SA"):
            return ticker
        # Adicionar .SA para ações brasileiras
        return f"{ticker}.SA"

    def get_fundamental_data(
        self, ticker: str, use_cache: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Busca dados fundamentalistas de um ticker.

        Args:
            ticker: Código do ativo (ex: CPFE3, TAEE11)
            use_cache: Se True, usa cache de 5 minutos

        Returns:
            Dicionário com dados fundamentalistas ou None se erro
        """
        ticker = ticker.upper()
        cache_key = self._get_cache_key(ticker, "fundamental")

        # Verificar cache
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached

        try:
            yahoo_ticker = self._convert_ticker(ticker)
            yf_ticker = yf.Ticker(yahoo_ticker)
            info = yf_ticker.info

            if not info or len(info) == 0:
                logger.warning(f"Nenhum dado encontrado para {ticker} no Yahoo Finance")
                return None

            # Extrair dados fundamentalistas
            # Preferir trailingAnnualDividendYield (já em decimal) sobre dividendYield (percentual)
            dividend_yield = info.get("trailingAnnualDividendYield") or info.get("forwardDividendYield")
            if dividend_yield is None:
                # Se não tiver, tentar dividendYield e converter de percentual para decimal
                dividend_yield_raw = info.get("dividendYield")
                if dividend_yield_raw is not None:
                    dividend_yield = float(dividend_yield_raw)
                    # Se > 1, assumir que está em percentual e converter
                    if dividend_yield > 1.0:
                        dividend_yield = dividend_yield / 100.0
            else:
                dividend_yield = float(dividend_yield)

            pe_ratio = info.get("trailingPE") or info.get("forwardPE")
            price_to_book = info.get("priceToBook")
            earnings_per_share = info.get("trailingEps") or info.get("forwardEps")
            current_price = info.get("currentPrice") or info.get("regularMarketPrice")
            market_cap = info.get("marketCap")

            result = {
                "ticker": ticker,
                "price": Decimal(str(current_price)) if current_price else None,
                "pe_ratio": float(pe_ratio) if pe_ratio is not None else None,
                "price_to_book": float(price_to_book) if price_to_book is not None else None,
                "dividend_yield": dividend_yield,
                "earnings_per_share": float(earnings_per_share) if earnings_per_share is not None else None,
                "market_cap": market_cap,
            }

            # Salvar no cache
            if use_cache:
                cache.set(cache_key, result, self.CACHE_TIMEOUT)

            return result

        except Exception as e:
            logger.error(f"Erro ao buscar dados fundamentalistas de {ticker} no Yahoo Finance: {e}")
            return None

    def get_dividend_history(
        self, ticker: str, use_cache: bool = True, workspace=None
    ) -> Optional[Dict[str, Any]]:
        """Busca histórico de dividendos de um ticker.

        Args:
            ticker: Código do ativo
            use_cache: Se True, usa cache de 1 hora
            workspace: Workspace (ignorado, mantido para compatibilidade)

        Returns:
            Dicionário com histórico de dividendos ou None se erro
        """
        ticker = ticker.upper()
        cache_key = self._get_cache_key(ticker, "dividends")

        # Verificar cache
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached

        try:
            yahoo_ticker = self._convert_ticker(ticker)
            yf_ticker = yf.Ticker(yahoo_ticker)
            dividends_series = yf_ticker.dividends

            if dividends_series is None or len(dividends_series) == 0:
                logger.info(f"Nenhum histórico de dividendos encontrado para {ticker}")
                return None

            # Filtrar últimos 12 meses
            now = timezone.now()
            one_year_ago = now - timedelta(days=365)

            dividends = []
            total_last_12_months = Decimal("0")

            for date, value in dividends_series.items():
                # Converter pandas Timestamp para datetime
                if hasattr(date, "to_pydatetime"):
                    div_date = date.to_pydatetime()
                else:
                    div_date = datetime.fromisoformat(str(date))

                # Tornar timezone-aware se necessário
                if div_date.tzinfo is None:
                    div_date = timezone.make_aware(div_date)

                # Filtrar apenas últimos 12 meses
                if div_date >= one_year_ago:
                    div_value = Decimal(str(value))
                    dividends.append({
                        "date": div_date.isoformat(),
                        "type": "Dividendo",
                        "value": float(div_value),
                    })
                    total_last_12_months += div_value

            result = {
                "ticker": ticker,
                "dividends": dividends,
                "total_last_12_months": float(total_last_12_months),
                "count": len(dividends),
            }

            # Salvar no cache
            if use_cache:
                cache.set(cache_key, result, self.DIVIDEND_CACHE_TIMEOUT)

            return result

        except Exception as e:
            logger.error(f"Erro ao buscar histórico de dividendos de {ticker} no Yahoo Finance: {e}")
            return None

    def get_quote(self, ticker: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """Busca cotação atual de um ticker.

        Nota: Este método é opcional, pois Brapi é mais rápido para cotações.
        Implementado para completude.

        Args:
            ticker: Código do ativo
            use_cache: Se True, usa cache de 5 minutos

        Returns:
            Dicionário com dados da cotação ou None se erro
        """
        ticker = ticker.upper()
        cache_key = self._get_cache_key(ticker, "quote")

        # Verificar cache
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached

        try:
            yahoo_ticker = self._convert_ticker(ticker)
            yf_ticker = yf.Ticker(yahoo_ticker)
            info = yf_ticker.info
            hist = yf_ticker.history(period="1d")

            if not info or len(hist) == 0:
                return None

            current_price = info.get("currentPrice") or info.get("regularMarketPrice")
            if not current_price and len(hist) > 0:
                current_price = float(hist["Close"].iloc[-1])

            # Calcular variação percentual
            change_percent = 0.0
            if len(hist) > 1:
                prev_close = float(hist["Close"].iloc[-2])
                current = float(hist["Close"].iloc[-1])
                if prev_close > 0:
                    change_percent = ((current - prev_close) / prev_close) * 100

            result = {
                "ticker": ticker,
                "price": Decimal(str(current_price)) if current_price else None,
                "change_percent": Decimal(str(change_percent)),
                "market_cap": info.get("marketCap"),
                "volume": info.get("volume") or info.get("regularMarketVolume"),
            }

            # Salvar no cache
            if use_cache:
                cache.set(cache_key, result, self.CACHE_TIMEOUT)

            return result

        except Exception as e:
            logger.error(f"Erro ao buscar cotação de {ticker} no Yahoo Finance: {e}")
            return None

