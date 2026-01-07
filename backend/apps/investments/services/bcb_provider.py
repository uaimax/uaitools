"""Provider para dados do Banco Central do Brasil."""

from decimal import Decimal
from typing import Any, Dict, Optional
from datetime import datetime, timedelta

import requests


class BCBProvider:
    """Provider para dados do Banco Central do Brasil."""

    BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs"

    # Códigos das séries do BCB
    SELIC_SERIES_CODE = 432  # Taxa Selic
    IPCA_SERIES_CODE = 433  # IPCA acumulado 12 meses

    def __init__(self) -> None:
        """Inicializa o provider."""
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "SaaS-Bootstrap/1.0",
        })

    def get_selic_rate(self) -> Optional[Decimal]:
        """Busca taxa Selic atual.

        Returns:
            Taxa Selic em decimal (ex: 0.0875 para 8.75%) ou None se erro
        """
        try:
            # Buscar último valor disponível
            url = f"{self.BASE_URL}/{self.SELIC_SERIES_CODE}/dados/ultimos/1"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            data = response.json()
            if data and len(data) > 0:
                # Último valor da série
                last_value = data[-1].get("valor")
                if last_value:
                    # Converter de percentual para decimal (ex: 8.75 -> 0.0875)
                    return Decimal(str(last_value)) / Decimal("100")
        except Exception:
            pass

        return None

    def get_ipca(self) -> Optional[Decimal]:
        """Busca IPCA acumulado 12 meses atual.

        Returns:
            IPCA em decimal (ex: 0.0450 para 4.50%) ou None se erro
        """
        try:
            # Buscar último valor disponível
            url = f"{self.BASE_URL}/{self.IPCA_SERIES_CODE}/dados/ultimos/1"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            data = response.json()
            if data and len(data) > 0:
                # Último valor da série
                last_value = data[-1].get("valor")
                if last_value:
                    # Converter de percentual para decimal (ex: 4.50 -> 0.0450)
                    return Decimal(str(last_value)) / Decimal("100")
        except Exception:
            pass

        return None

    def get_market_indices(self) -> Dict[str, Any]:
        """Busca índices de mercado.

        Returns:
            Dicionário com índices disponíveis
        """
        # Por enquanto, retorna apenas Selic e IPCA
        # Futuramente pode incluir outros índices do BCB
        return {
            "selic": self.get_selic_rate(),
            "ipca": self.get_ipca(),
            "timestamp": datetime.now().isoformat(),
        }



