"""Mixins úteis para ViewSets."""

from typing import TYPE_CHECKING

from rest_framework.response import Response

if TYPE_CHECKING:
    from rest_framework.request import Request


class CacheMixin:
    """Mixin para adicionar cache em ViewSets.

    Exemplo de uso:
        class MyViewSet(CacheMixin, WorkspaceViewSet):
            cache_timeout = 300  # 5 minutos
            cache_actions = ['list', 'retrieve']  # Apenas estas ações

            def list(self, request):
                # Cache será aplicado automaticamente
                return super().list(request)
    """

    cache_timeout = 300  # 5 minutos padrão
    cache_actions = ["list", "retrieve"]  # Ações que devem usar cache

    def dispatch(self, request, *args, **kwargs):
        """Aplica cache antes de processar a requisição."""
        # Obter ação do kwargs ou determinar depois
        action = kwargs.get("action")
        if not action:
            # Se não estiver no kwargs, determinar pela view
            view_action = getattr(self, "action", None)
            if view_action:
                action = view_action

        # Verificar se esta ação deve usar cache
        if action and action in self.cache_actions:
            from apps.core.cache import get_cache_key

            workspace = getattr(request, "workspace", None)
            workspace_id = str(workspace.id) if workspace else None

            # Gerar chave única baseada na URL e parâmetros
            cache_key_parts = [
                self.__class__.__name__.lower(),
                action or "unknown",
                request.path,
                str(sorted(request.query_params.items())),
            ]
            cache_key = get_cache_key(
                ":".join(cache_key_parts),
                workspace_id=workspace_id,
            )

            # Tentar obter do cache
            from django.core.cache import cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                return Response(cached_response)

            # Processar normalmente
            response = super().dispatch(request, *args, **kwargs)

            # Armazenar no cache se for sucesso
            if response.status_code == 200:
                cache.set(cache_key, response.data, self.cache_timeout)

            return response

        # Não usar cache para esta ação
        return super().dispatch(request, *args, **kwargs)

