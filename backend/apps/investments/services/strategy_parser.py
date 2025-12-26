"""Parser para extrair regras estruturadas de estratégias em texto livre."""

import re
from typing import Dict, Any, Optional


class StrategyParser:
    """Parser de estratégias de investimento em texto livre."""

    # Palavras-chave para identificar tipo de estratégia
    DIVIDENDOS_KEYWORDS = [
        "dividendo", "dividendos", "dy", "dividend yield", "renda", "payout",
        "distribuição", "proventos", "jcp", "juros sobre capital próprio"
    ]
    VALUE_KEYWORDS = [
        "value", "valor", "barato", "descontado", "p/l baixo", "p/vp baixo",
        "roe", "retorno sobre patrimônio", "empresas sólidas", "fundamentos"
    ]
    GROWTH_KEYWORDS = [
        "growth", "crescimento", "crescer", "expansão", "receita crescente",
        "lucro crescente", "empresas em crescimento"
    ]

    def parse(self, raw_text: str) -> Dict[str, Any]:
        """Parseia texto livre em regras estruturadas.

        Args:
            raw_text: Texto livre da estratégia do usuário

        Returns:
            Dicionário com:
            - strategy_type: tipo identificado
            - criteria: critérios extraídos
            - raw_text: texto original
        """
        text_lower = raw_text.lower()

        # Identificar tipo de estratégia
        strategy_type = self._identify_strategy_type(text_lower)

        # Extrair critérios numéricos
        criteria = self._extract_criteria(text_lower, strategy_type)

        return {
            "strategy_type": strategy_type,
            "criteria": criteria,
            "raw_text": raw_text,
        }

    def _identify_strategy_type(self, text: str) -> Optional[str]:
        """Identifica o tipo de estratégia baseado em palavras-chave."""
        dividendos_score = sum(1 for keyword in self.DIVIDENDOS_KEYWORDS if keyword in text)
        value_score = sum(1 for keyword in self.VALUE_KEYWORDS if keyword in text)
        growth_score = sum(1 for keyword in self.GROWTH_KEYWORDS if keyword in text)

        scores = {
            "dividendos": dividendos_score,
            "value": value_score,
            "growth": growth_score,
        }

        max_score = max(scores.values())
        if max_score == 0:
            return None

        # Se múltiplos tipos têm score alto, é híbrida
        high_scores = [k for k, v in scores.items() if v > 0]
        if len(high_scores) > 1:
            return "hibrida"

        return max(scores, key=scores.get)

    def _extract_criteria(self, text: str, strategy_type: Optional[str]) -> Dict[str, Any]:
        """Extrai critérios numéricos do texto."""
        criteria = {}

        # Dividend Yield mínimo
        dy_patterns = [
            r"dy\s*(?:de|>|maior|mínimo|min)\s*(\d+(?:[.,]\d+)?)\s*%?",
            r"dividend\s*yield\s*(?:de|>|maior|mínimo|min)\s*(\d+(?:[.,]\d+)?)\s*%?",
            r"dividendos\s*(?:de|>|maior|mínimo|min)\s*(\d+(?:[.,]\d+)?)\s*%?",
        ]
        for pattern in dy_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = float(match.group(1).replace(",", "."))
                criteria["dividend_yield_min"] = value / 100  # Converter para decimal
                break

        # P/L máximo
        pl_patterns = [
            r"p/l\s*(?:de|<|menor|máximo|max)\s*(\d+(?:[.,]\d+)?)",
            r"price[\s-]?to[\s-]?earnings\s*(?:de|<|menor|máximo|max)\s*(\d+(?:[.,]\d+)?)",
        ]
        for pattern in pl_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = float(match.group(1).replace(",", "."))
                criteria["pe_ratio_max"] = value
                break

        # P/VP máximo
        pvp_patterns = [
            r"p/vp\s*(?:de|<|menor|máximo|max)\s*(\d+(?:[.,]\d+)?)",
            r"price[\s-]?to[\s-]?book\s*(?:de|<|menor|máximo|max)\s*(\d+(?:[.,]\d+)?)",
        ]
        for pattern in pvp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = float(match.group(1).replace(",", "."))
                criteria["price_to_book_max"] = value
                break

        # Anos de dividendos
        anos_patterns = [
            r"(\d+)\s*anos?\s*(?:de\s*)?dividendos?",
            r"dividendos?\s*(?:há|por|durante)\s*(\d+)\s*anos?",
        ]
        for pattern in anos_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                criteria["anos_dividendos_min"] = int(match.group(1))
                break

        # ROE mínimo
        roe_patterns = [
            r"roe\s*(?:de|>|maior|mínimo|min)\s*(\d+(?:[.,]\d+)?)\s*%?",
            r"retorno\s*sobre\s*patrimônio\s*(?:de|>|maior|mínimo|min)\s*(\d+(?:[.,]\d+)?)\s*%?",
        ]
        for pattern in roe_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = float(match.group(1).replace(",", "."))
                criteria["roe_min"] = value / 100 if value > 1 else value
                break

        return criteria



