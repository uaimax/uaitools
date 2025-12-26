# Cache e Performance - Guia Rápido

## 📋 Visão Geral

O bootstrap inclui três sistemas estruturais para performance e proteção:

1. **Cache Strategy** (Redis) - Melhora performance de queries frequentes
2. **Rate Limiting** (Throttling) - Protege APIs de abuso
3. **Logging Estruturado** - Facilita debugging e monitoramento

---

## 🚀 Cache Strategy

### Configuração

**Variáveis de ambiente:**
```bash
REDIS_CACHE_URL=redis://localhost:6379/1
CACHE_DEFAULT_TIMEOUT=300  # 5 minutos
```

### Uso Básico

```python
from apps.core.cache import cache_get_or_set, get_cache_key
from django.core.cache import cache

# Cache simples
key = "user_count"
count = cache_get_or_set(key, lambda: User.objects.count(), timeout=60)

# Cache com isolamento por tenant
workspace_id = request.workspace.id
key = get_cache_key("user_profile", user_id, workspace_id=workspace_id)
profile = cache_get_or_set(key, fetch_user, timeout=300, workspace_id=workspace_id)
```

### Uso em ViewSets

**Opção 1: Mixin automático**
```python
from apps.core.mixins import CacheMixin
from apps.core.viewsets import WorkspaceViewSet

class LeadViewSet(CacheMixin, WorkspaceViewSet):
    cache_timeout = 300  # 5 minutos
    cache_actions = ['list', 'retrieve']  # Apenas estas ações
```

**Opção 2: Manual em views**
```python
from apps.core.cache import cache_get_or_set, get_cache_key

def my_view(request):
    cache_key = get_cache_key("my_data", workspace_id=request.workspace.id)
    data = cache_get_or_set(
        cache_key,
        lambda: expensive_operation(),
        timeout=300,
        workspace_id=request.workspace.id,
    )
    return Response(data)
```

### Invalidação

```python
from apps.core.cache import cache_invalidate_workspace, cache_invalidate_pattern

# Invalidar todo cache de um workspace
cache_invalidate_workspace(workspace_id)

# Invalidar padrão específico
cache_invalidate_pattern("user_profile:*")
```

### Exemplos Implementados

- ✅ `workspaces_list_view` - Cache de 5 minutos
- ✅ `legal_terms_view` - Cache de 1 hora
- ✅ `legal_privacy_view` - Cache de 1 hora

---

## 🛡️ Rate Limiting

### Configuração

**Variáveis de ambiente:**
```bash
API_THROTTLE_ANON=100/hour      # Usuários não autenticados
API_THROTTLE_USER=1000/hour     # Usuários autenticados
```

### Limites Padrão

- **Anônimos**: 100 requisições/hora
- **Autenticados**: 1000 requisições/hora

### Uso Customizado

**Throttle por workspace (útil para planos diferentes):**
```python
from apps.core.throttles import WorkspaceRateThrottle

class MyViewSet(viewsets.ModelViewSet):
    throttle_classes = [WorkspaceRateThrottle]
```

**Throttle específico por view:**
```python
from rest_framework.throttling import UserRateThrottle

class MyViewSet(viewsets.ModelViewSet):
    throttle_classes = [UserRateThrottle]
    throttle_scope = 'custom'
```

**Configurar scope customizado em settings:**
```python
REST_FRAMEWORK = {
    # ...
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "custom": "500/hour",  # Scope customizado
    },
}
```

### Headers de Resposta

O DRF inclui automaticamente headers informativos:
- `X-RateLimit-Limit`: Limite total
- `X-RateLimit-Remaining`: Requisições restantes
- `X-RateLimit-Reset`: Timestamp de reset

---

## 📝 Logging Estruturado

### Configuração

**Variáveis de ambiente:**
```bash
LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=text         # 'text' (dev) ou 'json' (prod)
```

### Uso

```python
import logging

logger = logging.getLogger('apps')

# Log simples
logger.info("Operação realizada")

# Log com contexto extra (útil para JSON)
logger.info("Operação realizada", extra={
    "user_id": user.id,
    "workspace_id": workspace.id,
    "action": "create_lead",
})
```

### Loggers Disponíveis

- `django`: Logs do Django framework
- `django.request`: Apenas erros de requisição HTTP
- `apps`: Logs das aplicações customizadas

### Arquivos

- **Console**: Sempre ativo (stdout/stderr)
- **Arquivo**: `backend/logs/django.log`
  - Rotação automática: 10MB, 5 backups
  - Formato: Texto em dev, JSON em prod

### Formato JSON (Produção)

Quando `LOG_FORMAT=json`, logs são estruturados:
```json
{
  "asctime": "2025-12-24T01:34:51",
  "name": "apps.leads.viewsets",
  "levelname": "INFO",
  "message": "Lead criado",
  "pathname": "/path/to/file.py",
  "lineno": 42,
  "user_id": "uuid-here",
  "workspace_id": "uuid-here"
}
```

---

## 🔧 Troubleshooting

### Cache não funciona

1. Verificar se Redis está rodando: `redis-cli ping`
2. Verificar `REDIS_CACHE_URL` no `.env`
3. Verificar logs do Django para erros de conexão

### Rate limiting muito restritivo

1. Ajustar `API_THROTTLE_ANON` e `API_THROTTLE_USER` no `.env`
2. Usar throttle customizado por view se necessário
3. Desabilitar temporariamente: `throttle_classes = []`

### Logs não aparecem

1. Verificar `LOG_LEVEL` (pode estar muito alto)
2. Verificar permissões do diretório `backend/logs/`
3. Verificar formato: `LOG_FORMAT=text` para desenvolvimento

---

## 📚 Referências

- [Django Cache Framework](https://docs.djangoproject.com/en/5.0/topics/cache/)
- [DRF Throttling](https://www.django-rest-framework.org/api-guide/throttling/)
- [Python Logging](https://docs.python.org/3/library/logging.html)


