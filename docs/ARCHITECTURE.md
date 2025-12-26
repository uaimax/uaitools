# Arquitetura e Decisões Técnicas

## Princípios de Design

### 1. Preparado para Separação Futura

O projeto foi estruturado para facilitar migração de "tudo junto" para "serviços separados" sem quebrar código.

**Cuidados implementados:**
- ✅ APIs sempre com prefixo `/api/`
- ✅ URLs configuráveis via variáveis de ambiente
- ✅ CORS preparado (desabilitado quando junto)
- ✅ ALLOWED_HOSTS configurável
- ✅ BASE_DIR robusto

### 2. URLs e Roteamento

**Regra Ouro:** Todas as APIs devem usar prefixo `/api/`

```python
# ✅ Correto
urlpatterns = [
    path("api/", include("api.urls")),  # Todas as APIs aqui
]

# ❌ Nunca fazer
urlpatterns = [
    path("leads/", ...),  # Sem prefixo - difícil separar depois
]
```

**Benefícios:**
- Facilita proxy reverso quando separar
- Identificação clara de rotas de API
- Migração sem quebrar URLs

### 3. Variáveis de Ambiente

**Sempre usar variáveis de ambiente, nunca hardcoded:**

```python
# ✅ Correto
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
API_URL = os.environ.get("API_URL", "/api")

# ❌ Nunca fazer
FRONTEND_URL = "https://meusite.com"  # Hardcoded
```

### 4. CORS (Cross-Origin Resource Sharing)

**Estado atual:** Desabilitado (tudo no mesmo domínio)

**Quando separar:**
1. Instalar `django-cors-headers`
2. Habilitar `CORS_ENABLED=True`
3. Configurar `FRONTEND_URL`
4. CORS será configurado automaticamente

### 5. Estrutura de Pastas

```
backend/
├── api/              # Roteamento de versões da API
│   └── v1/          # Versão 1 da API
├── apps/             # Apps Django modulares
│   └── core/        # App base (models, managers, tasks)
│       └── tasks/   # Tasks assíncronas (Celery)
├── config/          # Projeto Django (settings, urls, celery)
└── ...

frontend/             # React SPA + Tailwind CSS (Fase 4)
```

**Importante:** Código frontend nunca no backend, código backend nunca no frontend.

### 6. Versionamento de API

**Estrutura URL-based:** Todas as APIs são versionadas via URL (`/api/v1/`, `/api/v2/`, etc.)

```python
# api/urls.py
urlpatterns = [
    path("v1/", include("api.v1.urls")),  # Versão atual
    # path("v2/", include("api.v2.urls")),  # Futuro
]
```

**Benefícios:**
- Facilita evolução da API sem quebrar clientes existentes
- Permite manter múltiplas versões simultaneamente
- Migração gradual de clientes

**Configuração:**
- `API_VERSION` em `settings/base.py` (padrão: "v1")
- `SPECTACULAR_SETTINGS["SCHEMA_PATH_PREFIX"]` ajustado automaticamente

### 7. Soft Deletes

**Implementação:** Todos os models base (`WorkspaceModel`, `BaseModel`) incluem soft delete.

```python
from apps.core.models import WorkspaceModel

class MeuModel(WorkspaceModel):
    # Herda automaticamente deleted_at e métodos soft_delete()/restore()
    pass
```

**Managers:**
- `objects`: Filtra automaticamente registros deletados
- `all_objects`: Acesso sem filtro (inclui deletados)
- `with_deleted()`: Queryset incluindo deletados
- `only_deleted()`: Apenas registros deletados

**ViewSets:**
- `WorkspaceViewSet.destroy()` realiza soft delete automaticamente
- Registros não são removidos do banco, apenas marcados com `deleted_at`

**Benefícios:**
- Compliance e auditoria
- Recuperação de dados
- Histórico completo

### 8. UUIDs como Primary Keys

**Models críticos usam UUID:** `Workspace`, `User`, `AuditLog`

```python
from apps.core.models import UUIDPrimaryKeyMixin

class Workspace(UUIDPrimaryKeyMixin, models.Model):
    # id é UUID automaticamente
    pass
```

**Benefícios:**
- Segurança: não expõe contagem de registros
- Distribuição: melhor para sistemas distribuídos
- Unicidade global

**Mixin disponível:** `UUIDPrimaryKeyMixin` em `apps/core/models.py`

### 9. Jobs Assíncronos (Celery)

**Configuração:** Celery configurado e pronto para uso.

**Estrutura:**
```
apps/core/tasks/
├── __init__.py      # Importa tasks para descoberta automática
└── example.py       # Task de exemplo
```

**Criar nova task:**
```python
from celery import shared_task

@shared_task
def minha_task(parametro: str) -> str:
    """Minha task assíncrona."""
    # Lógica aqui
    return resultado
```

**Configuração:**
- Broker: Redis (configurável via `CELERY_BROKER_URL`)
- Result Backend: Redis (configurável via `CELERY_RESULT_BACKEND`)
- Timezone: Mesmo do Django (`TIME_ZONE`)

**Executar worker:**
```bash
celery -A config worker -l info
```

**Executar beat (tarefas periódicas):**
```bash
celery -A config beat -l info
```

### 10. Cache Strategy (Redis)

**Configuração:** Cache usando Redis (DB 1, separado do Celery que usa DB 0).

```python
from apps.core.cache import cache_get_or_set, get_cache_key

# Exemplo de uso
def get_user_profile(user_id, workspace_id):
    key = get_cache_key("user_profile", user_id, workspace_id=workspace_id)
    return cache_get_or_set(
        key,
        lambda: User.objects.get(id=user_id),
        timeout=300,  # 5 minutos
        workspace_id=workspace_id,
    )
```

**Características:**
- Isolamento por tenant (chaves incluem `workspace_id`)
- Timeout configurável via `CACHE_DEFAULT_TIMEOUT`
- Fallback graceful se Redis cair (`IGNORE_EXCEPTIONS=True`)
- Compressão automática para economizar memória

**Configuração:**
- `REDIS_CACHE_URL` em `.env` (padrão: `redis://localhost:6379/1`)
- `CACHE_DEFAULT_TIMEOUT` em `.env` (padrão: 300 segundos)

### 11. Rate Limiting (API Throttling)

**Configuração:** Throttling nativo do DRF com suporte a multi-tenancy.

```python
# Em ViewSet específico
from rest_framework.throttling import UserRateThrottle
from apps.core.throttles import WorkspaceRateThrottle

class MyViewSet(viewsets.ModelViewSet):
    throttle_classes = [WorkspaceRateThrottle]
    throttle_scope = 'custom'  # Opcional
```

**Limites padrão:**
- Anônimos: 100 requisições/hora
- Autenticados: 1000 requisições/hora

**Configuração via `.env`:**
```bash
API_THROTTLE_ANON=100/hour
API_THROTTLE_USER=1000/hour
```

**Throttle customizado:** `WorkspaceRateThrottle` em `apps/core/throttles.py` permite diferentes limites por workspace (útil para planos diferentes).

### 12. Logging Estruturado

**Configuração:** Logging configurável por ambiente (texto em dev, JSON em produção).

**Formato:**
- **Desenvolvimento**: Texto legível (`LOG_FORMAT=text`)
- **Produção**: JSON estruturado (`LOG_FORMAT=json`)

**Configuração via `.env`:**
```bash
LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=json         # 'text' ou 'json'
```

**Loggers disponíveis:**
- `django`: Logs do Django
- `django.request`: Apenas erros de requisição
- `apps`: Logs das aplicações customizadas

**Arquivos:**
- Console: Sempre ativo
- Arquivo: `backend/logs/django.log` (rotação automática, 10MB, 5 backups)

**Uso:**
```python
import logging

logger = logging.getLogger('apps')
logger.info("Operação realizada", extra={
    "user_id": user.id,
    "workspace_id": workspace.id,
})
```

### 13. Sistema de Logging Híbrido (Sentry/GlitchTip + Banco)

**Configuração:** Sistema que usa Sentry ou GlitchTip quando configurado, ou banco de dados como fallback.

**Funcionamento:**
- **Se Sentry/GlitchTip configurado**: Todos os logs vão para Sentry (SaaS) ou GlitchTip (self-hosted)
- **Se NÃO configurado**: Logs são salvos no banco via `ApplicationLog`

**Suporte a GlitchTip:**
- GlitchTip é uma alternativa open-source ao Sentry
- Compatível com a API do Sentry (usa os mesmos SDKs)
- Funciona com self-hosted ou instância hospedada
- Configure o DSN do GlitchTip no lugar do DSN do Sentry

**Backend:**
```python
from apps.core.services.error_logger import log_error

# Log automático via middleware (exceções não tratadas)
# Ou manual:
log_error(
    level="ERROR",
    message="Erro ao processar",
    error_type="ValueError",
    stack_trace=traceback.format_exc(),
    request=request,
)
```

**Frontend:**
```typescript
import { logError } from "./lib/error-logger";

// Log manual
logError(new Error("Algo deu errado"), { userId: "123" });

// Log automático: window.onerror e unhandledrejection já capturados
```

**Configuração via `.env`:**
```bash
# Backend
USE_SENTRY=false        # true para usar Sentry ou GlitchTip
SENTRY_DSN=             # DSN do Sentry ou GlitchTip (se USE_SENTRY=true)
LOG_RETENTION_DAYS=7    # Dias de retenção no banco (padrão: 7)

# Frontend
VITE_SENTRY_DSN=        # DSN do Sentry (opcional)
```

**Características:**
- Captura automática de erros (frontend e backend)
- Multi-tenancy nativo (isolamento por workspace)
- Rate limiting no endpoint (100 logs/hora)
- Cleanup automático de logs antigos (task Celery)
- Batching no frontend (envia em lotes)

**Endpoints:**
- `POST /api/v1/logs/frontend/` - Recebe logs do frontend

**Model:** `ApplicationLog` em `apps/core/models.py`

**Service:** `apps/core/services/error_logger.py` - Lógica híbrida

**Middleware:** `ErrorLoggingMiddleware` - Captura exceções Django automaticamente

**Task Celery:** `cleanup_old_logs` - Remove logs > 7 dias (executa diariamente às 2h)

## Migração: Junto → Separado

### Checklist de Migração

1. **Criar dois apps no CapRover**
   - Backend: Dockerfile Location = `backend/Dockerfile`
   - Frontend: Dockerfile Location = `frontend/Dockerfile`

2. **Atualizar variáveis de ambiente:**
   ```bash
   # Backend
   FRONTEND_URL=https://meusite.com
   CORS_ENABLED=True
   ALLOWED_HOSTS=api.meusite.com

   # Frontend
   API_URL=https://api.meusite.com
   ```

3. **Instalar CORS no backend:**
   ```bash
   pip install django-cors-headers
   ```

4. **Atualizar settings (já preparado):**
   - CORS será habilitado automaticamente quando `CORS_ENABLED=True`

5. **Testar:**
   - Backend responde em `api.meusite.com`
   - Frontend consome API corretamente
   - CORS funcionando

## Convenções

### URLs
- Admin: `/manage/` (configurável via `ADMIN_URL_PREFIX`)
- APIs: `/api/v1/*` (versionado)
- Frontend: `/` (quando junto) ou domínio próprio (quando separado)

### Variáveis de Ambiente
- Sempre usar `os.environ.get()` com defaults sensatos
- Nunca hardcodar URLs, hosts, ou configurações de deploy
- Documentar no `.env.example`

### Código
- Type hints obrigatórios
- Docstrings em funções públicas
- Arquivos máximo 300 linhas
- Testes junto ao app

## Segurança Estrutural

### 13. Validação de Ownership (IDOR Prevention)

**Implementação:** `WorkspaceObjectPermission` em `apps/core/permissions.py`

**Proteção:** Previne acesso a objetos de outros workspaces (IDOR - Insecure Direct Object Reference).

**Uso automático:** Todos os ViewSets que herdam de `WorkspaceViewSet` já incluem esta validação.

**Se sobrescrever `permission_classes`:**
```python
# ✅ CORRETO: Incluir WorkspaceObjectPermission
class MyViewSet(WorkspaceViewSet):
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

# ❌ ERRADO: Remover WorkspaceObjectPermission
class MyViewSet(WorkspaceViewSet):
    permission_classes = [IsAuthenticated]  # Remove proteção!
```

**Como funciona:**
- Valida explicitamente que `obj.workspace_id == request.workspace.id`
- Aplicado automaticamente em `retrieve`, `update`, `partial_update`, `destroy`
- Retorna `403 Forbidden` se objeto não pertence ao workspace

### 14. Filtro de Dados Sensíveis em Logs

**Implementação:** `SensitiveDataFilter` em `apps/core/logging.py`

**Proteção:** Redige automaticamente campos sensíveis (senhas, tokens, chaves) antes de escrever em logs.

**Campos protegidos:**
- `password`, `password_confirm`, `old_password`, `new_password`
- `token`, `secret`, `api_key`, `access_token`, `refresh_token`
- `authorization`, `auth`, `credentials`, `private_key`, `secret_key`

**Configuração:** Aplicado automaticamente em todos os handlers de log (console e arquivo).

**Exemplo:**
```python
# Antes do filtro
logger.info("Login", extra={"request_data": {"email": "user@example.com", "password": "secret123"}})
# Log: {"email": "user@example.com", "password": "secret123"}

# Depois do filtro
# Log: {"email": "user@example.com", "password": "***REDACTED***"}
```

**Adicionar novos campos sensíveis:**
Editar `SENSITIVE_FIELDS` em `apps/core/logging.py`.

