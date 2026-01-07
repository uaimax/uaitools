"""Development settings alias.

Este arquivo existe apenas para compatibilidade com variáveis de ambiente
que podem estar configuradas como 'config.settings.development'.
Redireciona para dev.py.
"""

from .dev import *  # noqa: F403, F401

