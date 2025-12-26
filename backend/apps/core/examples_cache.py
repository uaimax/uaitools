"""Exemplos de uso do sistema de cache.

Este arquivo serve como referência de como usar o cache em diferentes cenários.
Não deve ser importado em produção.
"""

from apps.core.cache import cache_get_or_set, cache_invalidate_workspace, get_cache_key
from django.core.cache import cache


# Exemplo 1: Cache simples com timeout
def exemplo_cache_simples():
    """Cache básico sem multi-tenancy."""
    key = "user_count"
    count = cache_get_or_set(
        key,
        lambda: 100,  # Função que retorna o valor
        timeout=60,  # 1 minuto
    )
    return count


# Exemplo 2: Cache com isolamento por workspace
def exemplo_cache_workspace(workspace_id: str, user_id: str):
    """Cache isolado por workspace."""
    key = get_cache_key("user_profile", user_id, workspace_id=workspace_id)

    def fetch_user():
        # Simulação de query pesada
        from apps.accounts.models import User
        return User.objects.get(id=user_id)

    profile = cache_get_or_set(key, fetch_user, timeout=300, workspace_id=workspace_id)
    return profile


# Exemplo 3: Invalidação de cache por workspace
def exemplo_invalidar_workspace(workspace_id: str):
    """Invalida todo o cache de um workspace."""
    count = cache_invalidate_workspace(workspace_id)
    return f"Invalidadas {count} chaves"


# Exemplo 4: Cache em ViewSet
def exemplo_viewset_cache():
    """Exemplo de como usar cache em um ViewSet."""
    # Em um ViewSet:
    # from apps.core.cache import cache_get_or_set, get_cache_key
    #
    # def list(self, request):
    #     workspace = request.workspace
    #     cache_key = get_cache_key("leads_list", workspace_id=workspace.id)
    #
    #     leads = cache_get_or_set(
    #         cache_key,
    #         lambda: list(Lead.objects.filter(workspace=workspace).values()),
    #         timeout=60,
    #         workspace_id=workspace.id,
    #     )
    #     return Response(leads)
    pass


