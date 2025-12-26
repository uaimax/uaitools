"""Throttles customizados para rate limiting."""

from rest_framework.throttling import UserRateThrottle


class WorkspaceRateThrottle(UserRateThrottle):
    """Throttle baseado em workspace (tenant).

    Permite diferentes limites por workspace, útil para planos diferentes.
    Por padrão, usa o mesmo limite de UserRateThrottle, mas pode ser
    customizado por workspace via settings ou banco de dados.
    """

    def get_cache_key(self, request, view) -> str:
        """Gera chave de cache incluindo workspace_id."""
        if request.user and request.user.is_authenticated:
            # Incluir workspace_id na chave para isolamento por tenant
            workspace = getattr(request, "workspace", None)
            workspace_suffix = f":{workspace.id}" if workspace else ""
            ident = f"{request.user.id}{workspace_suffix}"
        else:
            ident = self.get_ident(request)

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }

    def get_rate(self) -> str:
        """Obtém rate do throttle.

        Pode ser customizado por workspace no futuro.
        """
        return super().get_rate()


class LoggingRateThrottle(WorkspaceRateThrottle):
    """Throttle específico para endpoint de logs.

    Limite: 100 logs/hora por workspace.
    """

    scope = "logging"

    def get_rate(self) -> str:
        """Limite: 100 logs/hora por workspace."""
        return "100/hour"


