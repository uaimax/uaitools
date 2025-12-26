"""Provider para buscar dados de cotações via Brapi API."""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from decimal import Decimal

import requests
from django.core.cache import cache
from django.utils import timezone


class BrapiProvider:
    """Provider para buscar cotações e dados fundamentalistas via Brapi."""

    BASE_URL = "https://brapi.dev/api"
    CACHE_TIMEOUT = 300  # 5 minutos

    def __init__(self) -> None:
        """Inicializa o provider."""
        self.token = os.getenv("BRAPI_TOKEN", "")

    def _get_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições."""
        headers = {"Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _get_cache_key(self, ticker: str, endpoint: str = "quote") -> str:
        """Gera chave de cache."""
        return f"brapi:{endpoint}:{ticker.upper()}"

    def get_quote(self, ticker: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """Busca cotação atual de um ticker.

        Args:
            ticker: Código do ativo (ex: TAEE11, PETR4)
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
            # BRAPI aceita token como query param ou header
            url = f"{self.BASE_URL}/quote/{ticker}"
            params = {}
            if self.token:
                params["token"] = self.token

            response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                # Brapi retorna lista de resultados
                if "results" in data and len(data["results"]) > 0:
                    quote_data = data["results"][0]
                    # Normalizar estrutura - BRAPI pode retornar price ou regularMarketPrice
                    price_value = quote_data.get("regularMarketPrice") or quote_data.get("price") or 0
                    change_value = quote_data.get("regularMarketChangePercent") or quote_data.get("changePercent") or 0

                    result = {
                        "ticker": quote_data.get("symbol", ticker),
                        "price": Decimal(str(price_value)),
                        "change_percent": Decimal(str(change_value)),
                        "market_cap": quote_data.get("marketCap"),
                        "volume": quote_data.get("regularMarketVolume") or quote_data.get("volume"),
                    }
                    # Salvar no cache
                    if use_cache:
                        cache.set(cache_key, result, self.CACHE_TIMEOUT)
                    return result
            return None
        except Exception as e:
            # Log error mas não quebra o fluxo
            print(f"Erro ao buscar cotação de {ticker}: {e}")
            return None

    def get_fundamental_data(self, ticker: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """Busca dados fundamentalistas de um ticker.

        Args:
            ticker: Código do ativo
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
            # Brapi tem endpoint específico para dados fundamentalistas
            url = f"{self.BASE_URL}/quote/{ticker}"
            params = {}
            if self.token:
                params["token"] = self.token

            response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if "results" in data and len(data["results"]) > 0:
                    quote_data = data["results"][0]
                    # Extrair dados fundamentalistas disponíveis
                    result = {
                        "ticker": quote_data.get("symbol", ticker),
                        "price": Decimal(str(quote_data.get("regularMarketPrice", 0))),
                        "pe_ratio": quote_data.get("trailingPE"),  # P/L
                        "price_to_book": quote_data.get("priceToBook"),  # P/VP
                        "dividend_yield": quote_data.get("dividendYield"),  # DY
                        "earnings_per_share": quote_data.get("trailingEps"),
                        "market_cap": quote_data.get("marketCap"),
                    }
                    # Salvar no cache
                    if use_cache:
                        cache.set(cache_key, result, self.CACHE_TIMEOUT)
                    return result
            return None
        except Exception as e:
            print(f"Erro ao buscar dados fundamentalistas de {ticker}: {e}")
            return None

    def get_multiple_quotes(self, tickers: list[str], use_cache: bool = True) -> Dict[str, Optional[Dict[str, Any]]]:
        """Busca cotações de múltiplos tickers de uma vez.

        Args:
            tickers: Lista de códigos de ativos
            use_cache: Se True, usa cache

        Returns:
            Dicionário {ticker: dados} ou {ticker: None} se erro
        """
        results = {}
        for ticker in tickers:
            results[ticker] = self.get_quote(ticker, use_cache)
        return results

    def get_dividend_history(
        self, ticker: str, use_cache: bool = True, workspace=None
    ) -> Optional[Dict[str, Any]]:
        """Busca histórico de dividendos de um ticker.

        Estratégia para economizar requisições:
        1. Verifica cache (1 hora)
        2. Verifica banco de dados (última atualização < 24h)
        3. Só faz requisição à BRAPI se necessário
        4. Salva no banco após buscar

        Args:
            ticker: Código do ativo
            use_cache: Se True, usa cache e banco
            workspace: Workspace para salvar no banco (opcional)

        Returns:
            Dicionário com histórico de dividendos ou None se erro
        """
        ticker = ticker.upper()
        cache_key = self._get_cache_key(ticker, "dividends")
        cache_timeout = 3600  # 1 hora

        # 1. Verificar cache primeiro (mais rápido)
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached

        # 2. Verificar banco de dados (evita requisição se atualizado recentemente)
        if use_cache and workspace:
            try:
                from apps.investments.models import DividendHistory

                # Buscar histórico no banco
                history = DividendHistory.objects.filter(
                    ticker=ticker, workspace=workspace
                ).first()

                # Se existe e foi atualizado nas últimas 24h, usar do banco
                if history and history.last_updated:
                    hours_since_update = (timezone.now() - history.last_updated).total_seconds() / 3600
                    if hours_since_update < 24:
                        result = {
                            "ticker": ticker,
                            "dividends": history.dividends_data,
                            "total_last_12_months": float(history.total_last_12_months),
                            "average_monthly": float(history.average_monthly),
                            "regularity_score": float(history.regularity_score),
                        }
                        # Atualizar cache
                        cache.set(cache_key, result, cache_timeout)
                        return result
            except Exception as e:
                # Se der erro ao acessar banco, continuar com requisição
                print(f"Erro ao buscar histórico no banco para {ticker}: {e}")

        # 3. Fazer requisição à BRAPI (só se necessário)
        try:
            url = f"{self.BASE_URL}/quote/{ticker}"
            params = {}
            if self.token:
                params["token"] = self.token

            response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if "results" in data and len(data["results"]) > 0:
                    quote_data = data["results"][0]

                    # Extrair dividendos (estrutura pode variar)
                    dividends_raw = quote_data.get("dividendsHistory") or quote_data.get("dividends") or []

                    if not dividends_raw:
                        return None

                    # Processar dividendos
                    dividends = []
                    total_last_12_months = Decimal("0")
                    now = timezone.now()
                    one_year_ago = now - timedelta(days=365)

                    for div in dividends_raw:
                        div_date_str = div.get("date") or div.get("paymentDate") or div.get("exDate")
                        div_value = div.get("value") or div.get("amount") or div.get("dividend") or 0
                        div_type = div.get("type") or "Dividendo"

                        if div_date_str and div_value:
                            try:
                                # Tentar parsear data
                                div_date = datetime.fromisoformat(div_date_str.replace("Z", "+00:00"))
                                if div_date.tzinfo is None:
                                    div_date = timezone.make_aware(div_date)

                                # Filtrar apenas últimos 12 meses
                                if div_date >= one_year_ago:
                                    dividends.append({
                                        "date": div_date_str,
                                        "type": div_type,
                                        "value": float(div_value),
                                        "ex_date": div.get("exDate") or div.get("ex_date"),
                                        "payment_date": div.get("paymentDate") or div.get("payment_date") or div_date_str,
                                    })
                                    total_last_12_months += Decimal(str(div_value))
                            except (ValueError, AttributeError):
                                # Se não conseguir parsear data, incluir mesmo assim
                                dividends.append({
                                    "date": div_date_str,
                                    "type": div_type,
                                    "value": float(div_value),
                                    "ex_date": div.get("exDate") or div.get("ex_date"),
                                    "payment_date": div.get("paymentDate") or div.get("payment_date") or div_date_str,
                                })
                                total_last_12_months += Decimal(str(div_value))

                    # Ordenar por data (mais recente primeiro) e pegar últimos 12
                    dividends = sorted(dividends, key=lambda x: x["date"], reverse=True)[:12]

                    # Calcular média mensal
                    average_monthly = total_last_12_months / Decimal("12") if total_last_12_months > 0 else Decimal("0")

                    # Calcular score de regularidade (simplificado)
                    # Score baseado em quantidade de pagamentos nos últimos 12 meses
                    num_payments = len(dividends)
                    if num_payments >= 12:
                        regularity_score = Decimal("1.0")  # Muito regular
                    elif num_payments >= 6:
                        regularity_score = Decimal("0.8")  # Regular
                    elif num_payments >= 4:
                        regularity_score = Decimal("0.6")  # Moderado
                    else:
                        regularity_score = Decimal("0.4")  # Irregular

                    result = {
                        "ticker": ticker,
                        "dividends": dividends,
                        "total_last_12_months": float(total_last_12_months),
                        "average_monthly": float(average_monthly),
                        "regularity_score": float(regularity_score),
                    }

                    # 4. Salvar no cache
                    if use_cache:
                        cache.set(cache_key, result, cache_timeout)

                    # 5. Salvar no banco (se workspace fornecido)
                    if workspace:
                        try:
                            from apps.investments.models import DividendHistory

                            DividendHistory.objects.update_or_create(
                                ticker=ticker,
                                workspace=workspace,
                                defaults={
                                    "dividends_data": dividends,
                                    "total_last_12_months": total_last_12_months,
                                    "average_monthly": average_monthly,
                                    "regularity_score": regularity_score,
                                }
                            )
                        except Exception as e:
                            # Não quebrar se der erro ao salvar
                            print(f"Erro ao salvar histórico no banco para {ticker}: {e}")

                    return result
            return None
        except Exception as e:
            print(f"Erro ao buscar histórico de dividendos de {ticker}: {e}")
            return None

