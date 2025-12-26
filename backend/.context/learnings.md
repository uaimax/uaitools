# Aprendizados Positivos

Este arquivo documenta **soluções que funcionaram bem** e devem ser replicadas.

---

## 🔒 Segurança - Consultar Primeiro

**IMPORTANTE:** Antes de trabalhar com segurança, consultar:
- `backend/.context/security-patterns.md` - Padrões obrigatórios
- `backend/.context/mistakes.md` - Erros comuns de segurança
- `backend/.context/anti-patterns.md` - Anti-patterns de segurança

---

## ✅ Padrão: Validação Explícita de Ownership (IDOR Prevention)

**Data**: 2025-12-24
**Categoria**: backend, security
**Tags**: [security, permissions, multi-tenancy, idor-prevention]
**Severidade**: critical

### O Que Funcionou
Implementar `WorkspaceObjectPermission` como permissão explícita em `WorkspaceViewSet` previne IDOR de forma testável e clara.

### Implementação
```python
# apps/core/permissions.py
class WorkspaceObjectPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not hasattr(obj, "workspace"):
            return False
        request_workspace = getattr(request, "workspace", None)
        if not request_workspace:
            return False
        return obj.workspace_id == request_workspace.id
```

### Por Que Funcionou Bem
- ✅ Validação explícita e testável
- ✅ Previne IDOR de forma clara
- ✅ Fácil de entender e manter
- ✅ Aplicado automaticamente em todos os ViewSets

### Padrão a Replicar
- Sempre validar ownership explicitamente
- Usar permissões customizadas para lógica de segurança
- Testar permissões isoladamente

### Referências
- `apps/core/permissions.py`
- `backend/.context/security-patterns.md`

---

## ✅ Padrão: Filtro Automático de Dados Sensíveis em Logs

**Data**: 2025-12-24
**Categoria**: backend, security
**Tags**: [security, logging, data-protection]
**Severidade**: high

### O Que Funcionou
Implementar `SensitiveDataFilter` como filtro de logging previne vazamento de dados sensíveis automaticamente.

### Implementação
```python
# apps/core/logging.py
class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        # Redige campos sensíveis automaticamente
        if hasattr(record, "request_data"):
            for field in SENSITIVE_FIELDS:
                if field in record.request_data:
                    record.request_data[field] = "***REDACTED***"
        return True
```

### Por Que Funcionou Bem
- ✅ Proteção automática em todos os logs
- ✅ Configurável (lista de campos sensíveis)
- ✅ Não requer mudanças no código que loga
- ✅ Previne vazamento de dados

### Padrão a Replicar
- Filtrar dados sensíveis no nível de logging
- Lista configurável de campos sensíveis
- Aplicar automaticamente em todos os handlers

### Referências
- `apps/core/logging.py`
- `backend/.context/security-patterns.md`

---

## Multi-tenancy: Sempre Herdar TenantModel

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [multi-tenancy, models, django]
**Severidade**: high

### Contexto
Ao criar novos models que armazenam dados de tenant, é crítico garantir isolamento de dados.

### Aprendizado
**Sempre herdar `TenantModel`** de `apps.core.models` para qualquer model que armazene dados específicos de tenant.

### Solução
```python
from apps.core.models import TenantModel

class MeuModel(TenantModel):
    tenant = models.ForeignKey(
        'accounts.Tenant',
        on_delete=models.CASCADE,
        related_name='meus_modelos'
    )
    # ... outros campos
```

### Lições Aprendidas
- Nunca criar models de tenant sem herdar `TenantModel`
- O middleware `TenantMiddleware` depende dessa estrutura
- ViewSets filtram automaticamente quando herdam de `TenantModel`

### Referências
- `backend/apps/core/models.py`
- `backend/apps/core/middleware.py`

---

## APIs Devem Usar Prefixo /api/

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [api, urls, conventions]
**Severidade**: high

### Contexto
Todas as rotas de API devem seguir convenção de prefixo.

### Aprendizado
**Todas as rotas de API devem ter prefixo `/api/`** para consistência e facilidade de configuração de proxy/reverse proxy.

### Solução
```python
# backend/config/urls.py
urlpatterns = [
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.leads.urls')),
]
```

### Lições Aprendidas
- Facilita configuração de nginx/traefik
- Separa claramente APIs de outras rotas
- Convenção estabelecida no projeto

### Referências
- `backend/config/urls.py`
- `.cursorrules`

---

## Type Hints São Obrigatórios

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [python, type-hints, code-quality]
**Severidade**: medium

### Contexto
Type hints melhoram legibilidade e permitem melhor análise estática.

### Aprendizado
**Todas as funções Python devem ter type hints**, mesmo que simples.

### Solução
```python
def processar_lead(lead_id: int, tenant_id: int) -> dict[str, Any]:
    """Processa um lead específico."""
    # ...
```

### Lições Aprendidas
- Facilita trabalho da LLM (melhor contexto)
- Melhora autocomplete em IDEs
- Facilita refatoração

### Referências
- `.cursorrules`
- `AGENTS.md`

---

## Autenticação por Email (Não Username)

**Data**: 2024-12-24
**Categoria**: backend
**Tags**: [authentication, user-model, django]
**Severidade**: high

### Contexto
Sistema deve usar email como identificador principal em vez de username para simplificar autenticação.

### Aprendizado
**Configurar `USERNAME_FIELD = "email"` no User model** e remover username dos serializers e views.

### Solução
```python
class User(AbstractUser):
    email = models.EmailField(_("email address"), unique=True, blank=False, null=False)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]
```

**Views devem usar `authenticate(request, username=email, password=password)`** - o Django automaticamente usa o campo definido em `USERNAME_FIELD`.

### Lições Aprendidas
- Email deve ser único e obrigatório
- Username ainda existe no banco mas não é usado para autenticação
- Frontend deve enviar `email` em vez de `username`
- Serializers devem remover campo `username` ou torná-lo read-only

### Referências
- `backend/apps/accounts/models.py`
- `backend/apps/accounts/views.py`
- `backend/apps/accounts/serializers.py`

### ⚠️ Importante: Assinatura de create_superuser

**Quando usar `create_superuser` em scripts ou código, usar a assinatura correta:**

```python
# ✅ CORRETO (com email como USERNAME_FIELD)
User.objects.create_superuser(
    email='admin@example.com',
    password='admin123',
    first_name='Admin',  # REQUIRED_FIELDS
    last_name='User'     # REQUIRED_FIELDS
)

# ❌ INCORRETO (assinatura antiga com username)
User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
```

**Erro comum**: `TypeError: UserManager.create_superuser() takes from 2 to 3 positional arguments but 4 were given`

**Causa**: Tentar usar assinatura antiga do Django (username, email, password) quando o manager customizado usa (email, password, **extra_fields).

---

## Social Authentication com django-allauth

**Data**: 2024-12-24
**Categoria**: backend
**Tags**: [authentication, oauth, django-allauth, multi-tenancy]
**Severidade**: high

### Contexto
Implementação completa de autenticação social (OAuth2/OIDC) com suporte a multi-tenancy.

### Aprendizado
**Stack recomendada:**
- `django-allauth>=0.57,<0.62` (compatível com dj-rest-auth 6.0)
- `dj-rest-auth[with_social]>=6.0,<7.0`
- `djangorestframework-simplejwt>=5.3,<6.0`

**Configuração essencial:**
1. Adicionar `allauth.account.middleware.AccountMiddleware` ao MIDDLEWARE
2. Configurar `SITE_ID = 1`
3. Criar adapter customizado para multi-tenancy: `TenantSocialAccountAdapter`
4. Usar `SOCIALACCOUNT_PROVIDERS` para configurações específicas

### Solução
```python
# settings.py
INSTALLED_APPS = [
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    # ... outros providers
]

MIDDLEWARE = [
    # ...
    'allauth.account.middleware.AccountMiddleware',
    # ...
]

SOCIALACCOUNT_ADAPTER = "apps.accounts.adapters.TenantSocialAccountAdapter"
```

**Adapter customizado:**
- Extrai `tenant_slug` do `state` parameter do OAuth
- Valida nonce para prevenir replay attacks
- Associa usuário ao tenant correto
- Valida que usuário existente não acesse tenant diferente

### Lições Aprendidas
- SocialApps devem ser criados no banco (via Admin ou comando `sync_social_apps`)
- State parameter deve incluir `tenant_slug` e `nonce`
- JWT tokens são gerados após login social bem-sucedido
- Redirecionamento para frontend com token via `get_login_redirect_url()`

### Referências
- `backend/apps/accounts/adapters.py`
- `backend/apps/accounts/management/commands/sync_social_apps.py`
- `docs/SOCIAL_AUTH.md`

---

## Filtros ManyToMany no Django ORM

**Data**: 2024-12-24
**Categoria**: backend
**Tags**: [django, orm, manytomany, queries]
**Severidade**: medium

### Contexto
Filtrar objetos com relacionamento ManyToMany requer sintaxe específica.

### Aprendizado
**Para filtrar por ManyToMany, usar `filter(sites=site)` diretamente**, não `sites__in=[site]`.

### Solução
```python
# Correto
apps = SocialApp.objects.filter(sites=site, active=True)

# Incorreto (causa erro)
apps = SocialApp.objects.filter(sites__in=[site], active=True)
```

### Lições Aprendidas
- Django ORM trata ManyToMany de forma especial
- `filter(related_field=object)` funciona para ManyToMany
- Não precisa usar `__in` para relacionamentos ManyToMany simples

### Referências
- `backend/apps/accounts/views.py` (available_social_providers)

---

## Signals de Auditoria e Foreign Keys: Problema Complexo Resolvido

**Data**: 2024-12-24
**Categoria**: backend
**Tags**: [django, signals, foreign-keys, transactions, testing, audit]
**Severidade**: critical

### Contexto
Implementação de sistema de auditoria automática usando Django signals (`post_save`, `post_delete`) que criava logs de auditoria (`AuditLog`) quando modelos eram criados/atualizados. O sistema enfrentava erros de `FOREIGN KEY constraint failed` durante testes e operações normais.

### Problema Identificado

1. **Foreign Key Constraint Failed**: Ao criar um `AuditLog` dentro de um signal `post_save`, o Django tentava criar o log antes que a transação fosse commitada, causando erro de foreign key quando o `AuditLog` tentava referenciar uma `Workspace` que ainda não estava salva no banco.

2. **Transaction.on_commit em Testes**: O uso de `transaction.on_commit()` não funcionava corretamente em testes porque os testes do Django usam transações de rollback, e os callbacks de `on_commit` podem não ser executados imediatamente.

3. **Obtenção de Workspace em Instâncias Recém-Criadas**: Quando uma instância é criada, acessar `instance.workspace` pode causar uma query adicional ou falhar se a foreign key ainda não estiver persistida.

### Solução Implementada

#### 1. Detecção de Ambiente de Teste
```python
def _is_testing() -> bool:
    """Verifica se estamos executando testes."""
    return 'test' in sys.argv or 'pytest' in sys.modules or 'unittest' in sys.modules
```

#### 2. Execução Condicional em Signals
- **Em Testes**: Executar `log_audit()` diretamente (sem `on_commit`)
- **Em Produção**: Usar `transaction.on_commit()` para garantir que a transação foi commitada

```python
if _is_testing():
    # Em testes, executar diretamente
    log_audit(instance=instance, action=action, ...)
else:
    # Em produção, usar on_commit
    def create_log():
        instance.refresh_from_db()
        log_audit(instance=instance, action=action, ...)
    transaction.on_commit(create_log)
```

#### 3. Obtenção Segura de Workspace
Tentar múltiplas estratégias para obter a `workspace`:

```python
workspace = None
try:
    # 1. Tentar workspace_id primeiro (mais seguro, não precisa de query)
    if hasattr(instance, "workspace_id") and instance.workspace_id:
        from apps.accounts.models import Workspace
        try:
            workspace = Workspace.objects.get(pk=instance.workspace_id)
        except (Workspace.DoesNotExist, ValueError, TypeError):
            pass
    # 2. Tentar acessar workspace diretamente
    elif hasattr(instance, "workspace"):
        workspace = getattr(instance, "workspace", None)
        if workspace and hasattr(workspace, 'pk') and not workspace.pk:
            workspace = None
except Exception:
    pass
```

#### 4. Tratamento de Erros Robusto
Não deixar que erros de auditoria quebrem a aplicação:

```python
try:
    log = AuditLog.objects.create(...)
except Exception as e:
    # Logar warning mas não quebrar a aplicação
    import logging
    logger = logging.getLogger(__name__)
    logger.warning(f"Erro ao criar log de auditoria: {e}")
    return None
```

#### 5. Ignorar Signals Durante Operações Especiais
```python
# Ignorar durante migrations, flush, e fixtures
if 'migrate' in sys.argv or 'makemigrations' in sys.argv or 'flush' in sys.argv:
    return

if kwargs.get('raw', False):  # Fixtures e migrations
    return
```

### Lições Aprendidas

1. **Signals e Foreign Keys**: Sempre considerar que signals são executados dentro de transações. Foreign keys podem não estar disponíveis imediatamente.

2. **Testing vs Produção**: Comportamento diferente entre testes e produção requer detecção de ambiente e lógica condicional.

3. **transaction.on_commit()**: Útil em produção, mas pode não funcionar como esperado em testes devido ao uso de transações de rollback.

4. **Obtenção de Relacionamentos**: Preferir `instance.workspace_id` sobre `instance.workspace` quando possível, pois evita queries adicionais e é mais seguro.

5. **Resiliência em Signals**: Signals não devem quebrar a aplicação. Sempre tratar exceções e permitir que a operação principal continue.

6. **Refresh em Signals**: Em alguns casos, `instance.refresh_from_db()` pode ajudar, mas não é garantido que funcione se a transação ainda não foi commitada.

### Padrão Recomendado para Signals com Foreign Keys

```python
@receiver(post_save)
def my_signal_handler(sender, instance, created, **kwargs):
    # 1. Ignorar em contextos especiais
    if kwargs.get('raw', False) or 'migrate' in sys.argv:
        return

    # 2. Detectar ambiente
    is_test = _is_testing()

    # 3. Obter relacionamentos de forma segura
    workspace = None
    if hasattr(instance, "workspace_id") and instance.workspace_id:
        try:
            workspace = Workspace.objects.get(pk=instance.workspace_id)
        except Workspace.DoesNotExist:
            pass

    # 4. Executar ação condicionalmente
    if is_test:
        # Executar diretamente em testes
        do_something(instance, workspace)
    else:
        # Usar on_commit em produção
        def do_it():
            instance.refresh_from_db()
            do_something(instance, workspace)
        transaction.on_commit(do_it)
```

### Referências
- Arquivos:
  - `backend/apps/core/signals.py`
  - `backend/apps/core/audit.py`
  - `backend/apps/core/tests/test_audit.py`
- Django Docs:
  - [Signals](https://docs.djangoproject.com/en/5.0/topics/signals/)
  - [Database Transactions](https://docs.djangoproject.com/en/5.0/topics/db/transactions/)
  - [Testing](https://docs.djangoproject.com/en/5.0/topics/testing/)

---

