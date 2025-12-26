"""Settings module router.

Carrega settings baseado na variavel de ambiente ENVIRONMENT.
Default: development
"""

import os

env = os.environ.get("ENVIRONMENT", "development").lower()

# Mapear valores para compatibilidade
# Valores suportados: dev, prod, development, production, staging
if env in ("prod", "production"):
    from .prod import *  # noqa: F403, F401
else:
    # Default: dev ou development -> carrega dev.py
    from .dev import *  # noqa: F403, F401

