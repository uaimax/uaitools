"""Constantes para estratégia padrão de investimentos em dividendos."""

# Alocação-alvo por setor/ativo (percentual da carteira)
TARGET_ALLOCATION = {
    # Setores defensivos e perenes
    "financeiro": {
        "BBAS3": 15.0,  # Banco do Brasil
        "BBDC4": 10.0,  # Bradesco
        "ITUB4": 10.0,  # Itaú
        "BBSE3": 5.0,   # BB Seguridade
    },
    "energia": {
        "TAEE11": 10.0,  # Taesa
        "CPFE3": 8.0,    # CPFL Energia
        "ELET3": 7.0,    # Centrais Elétricas
    },
    "utilities": {
        "SANB11": 8.0,   # Sanepar
        "SAPR11": 5.0,   # Sanepar
    },
    "consumo": {
        "VIVT3": 5.0,   # Telefônica
    },
    # Máximo por ativo individual
    "max_per_asset": 20.0,
    # Máximo por setor
    "max_per_sector": 35.0,
}

# Regras da estratégia padrão
# Esta estrutura será usada como base para parsed_rules["criteria"]
DEFAULT_STRATEGY_RULES = {
    "dividend_yield_min": 0.08,  # 8% mínimo
    "price_ceiling_multiplier": 0.08,  # Preço teto = dividendo / 0.08
    "excluded_sectors": ["mineração", "armas", "defesa"],
    "allowed_exchanges": ["B3"],  # Apenas B3
    "defensive_sectors_only": True,
    "strategy_type": "dividendos",
}

# Estrutura completa para parsed_rules (usado quando não há estratégia definida)
DEFAULT_PARSED_RULES = {
    "strategy_type": "dividendos",
    "criteria": DEFAULT_STRATEGY_RULES.copy(),
}

# Setores permitidos (defensivos e perenes)
ALLOWED_SECTORS = [
    "financeiro",
    "energia",
    "utilities",
    "consumo",
    "telecomunicações",
    "água e saneamento",
    "distribuição",
]

