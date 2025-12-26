"""Settings module router.

Carrega settings baseado na variavel de ambiente DJANGO_ENV.
Default: dev
"""

import os

env = os.environ.get("DJANGO_ENV", "dev")

if env == "prod":
    from .prod import *  # noqa: F403, F401
else:
    from .dev import *  # noqa: F403, F401

