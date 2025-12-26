# Core App — Análise do Módulo

> **Última atualização**: 2024-12
> **Domínio**: Base do sistema (models, middleware, audit)
> **Status**: ✅ Ativo
> **Zona**: 🟡 AMARELA (cuidado ao modificar)

---

## 🎯 Visão Geral

O app `core` fornece a **base estrutural** do sistema:
- Models base (`WorkspaceModel`, `BaseModel`)
- Middleware de multi-tenancy (`WorkspaceMiddleware`)
- Sistema de auditoria LGPD
- ViewSets base com filtro automático
- Permissões e throttling

**Este é um módulo crítico** — mudanças aqui afetam todo o sistema.

---

## 📁 Estrutura

```
apps/core/
├── models.py           # WorkspaceModel, BaseModel, UUIDPrimaryKeyMixin
├── middleware.py       # WorkspaceMiddleware, UUIDSessionMiddleware
├── managers.py         # SoftDeleteManager
├── viewsets.py         # WorkspaceViewSet (base para ViewSets)
├── permissions.py      # WorkspaceObjectPermission
├── throttles.py        # WorkspaceRateThrottle
├── audit.py            # Sistema de auditoria LGPD
├── cache.py            # Estratégias de cache
├── logging.py          # Logging estruturado
└── tasks/              # Tasks assíncronas (Celery)
```

---

## 🔐 Áreas Protegidas

### 🔴 ZONA VERMELHA — NUNCA TOCAR

```
apps/core/models.py        # WorkspaceModel, BaseModel (base do sistema)
apps/core/middleware.py    # WorkspaceMiddleware (multi-tenancy crítico)
```

**Ação**: PARAR e solicitar autorização humana.

### 🟡 ZONA AMARELA — CUIDADO

```
apps/core/viewsets.py      # WorkspaceViewSet (usado por todos os ViewSets)
apps/core/permissions.py   # WorkspaceObjectPermission (segurança)
apps/core/audit.py         # Sistema de auditoria LGPD
```

**Ação**: Criar PLAN, aguardar aprovação.

---

## 🏗️ Componentes Principais

### 1. Models Base

#### `WorkspaceModel`
Base para todos os models com multi-tenancy:

```python
class WorkspaceModel(SoftDeleteModel):
    """Base model com workspace_id e timestamps."""
    workspace = models.ForeignKey("accounts.Workspace", ...)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Características**:
- ForeignKey para `accounts.Workspace`
- Timestamps automáticos
- Soft delete automático
- Índices otimizados

#### `BaseModel`
Base para models globais (sem multi-tenancy):

```python
class BaseModel(SoftDeleteModel):
    """Base model sem workspace_id (para models globais)."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### `UUIDPrimaryKeyMixin`
Mixin para usar UUID como primary key:

```python
class UUIDPrimaryKeyMixin(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
```

### 2. Middleware

#### `WorkspaceMiddleware`
Define `request.workspace` baseado no header `X-Workspace-ID`:

```python
# Header HTTP
X-Workspace-ID: slug-da-empresa

# No código
workspace = request.workspace  # Workspace object ou None
```

**Funcionalidades**:
- Valida formato do slug (previne enumeração)
- Filtra apenas workspaces ativas
- Define usuário para auditoria LGPD
- Mantém compatibilidade com `X-Tenant-ID`

**Segurança**:
- Validação de formato (regex: `^[a-z0-9-]+$`)
- Tratamento de sessões inválidas (migração UUID)

#### `UUIDSessionMiddleware`
Limpa sessões com IDs antigos (inteiros) após migração para UUID.

### 3. ViewSets Base

#### `WorkspaceViewSet`
ViewSet base com filtro automático por workspace:

```python
class WorkspaceViewSet(viewsets.ModelViewSet):
    """Filtra automaticamente por request.workspace."""

    def get_queryset(self):
        """Filtra por workspace automaticamente."""
        queryset = super().get_queryset()
        if self.request.workspace:
            queryset = queryset.filter(workspace=self.request.workspace)
        return queryset

    def perform_create(self, serializer):
        """Define workspace automaticamente ao criar."""
        if self.request.workspace:
            serializer.save(workspace=self.request.workspace)
```

**Características**:
- Filtro automático por workspace
- Soft delete (destroy marca `deleted_at`)
- Validação de ownership (previne IDOR)

### 4. Permissões

#### `WorkspaceObjectPermission`
Valida que objetos pertencem à workspace do request:

```python
class WorkspaceObjectPermission(BasePermission):
    """Valida ownership de objetos por workspace."""
```

### 5. Auditoria LGPD

#### `audit.py`
Sistema completo de auditoria para compliance LGPD:

- Captura mudanças em dados pessoais
- Registra IP, user, timestamp
- Política de retenção configurável
- API e Admin para consulta

**Uso**:
```python
from apps.core.audit import log_audit

log_audit(
    instance=user,
    action="UPDATE",
    field_name="email",
    old_value="old@email.com",
    new_value="new@email.com",
    request=request
)
```

### 6. Soft Delete

#### `SoftDeleteManager` e `SoftDeleteModel`
Implementa soft delete (não remove do banco):

```python
# Deletar
instance.delete()  # Marca deleted_at, não remove

# Queries
Model.objects.all()  # Exclui deletados automaticamente
Model.objects.deleted()  # Apenas deletados
Model.objects.with_deleted()  # Todos (incluindo deletados)
```

---

## 🔄 Fluxo de Dados

### Request → WorkspaceMiddleware → ViewSet

```
1. Request HTTP com header X-Workspace-ID
2. WorkspaceMiddleware valida slug e busca Workspace
3. Define request.workspace (ou None)
4. ViewSet filtra automaticamente por workspace
5. Permission valida ownership
6. Response
```

---

## 📋 Convenções

### ALWAYS (Sempre Fazer)

1. **Herdar `WorkspaceModel`** para dados multi-tenant
2. **Herdar `WorkspaceViewSet`** para ViewSets
3. **Usar `SoftDeleteModel`** para soft delete
4. **Auditar mudanças** em dados pessoais (LGPD)
5. **Validar ownership** em permissions

### NEVER (Nunca Fazer)

1. **Modificar `WorkspaceModel`** sem autorização
2. **Modificar `WorkspaceMiddleware`** sem autorização
3. **Queries sem filtro de workspace** em ViewSets
4. **Hard delete** (usar soft delete)
5. **Ignorar auditoria** em dados pessoais

---

## 🔗 Dependências

```
core (base)
    ↑
    └── accounts (User, Workspace)
    └── leads (Lead)
    └── [outros apps]
```

**Regra**: `core` não depende de apps de negócio. Apps de negócio dependem de `core`.

---

## 🧪 Testes

### Arquivos de Teste

```
apps/core/tests/
├── test_models.py
├── test_middleware.py
├── test_viewsets.py
└── test_smoke.py
```

### Cobertura Esperada

- Models: 100% (crítico)
- Middleware: 100% (crítico)
- ViewSets: 90%+
- Permissions: 100% (segurança)

---

## 📚 Referências

- `@backend/ANALYSIS.md` — Análise geral do backend
- `@docs/ARCHITECTURE.md` — Decisões arquiteturais
- `@docs/LGPD_COMPLIANCE.md` — Compliance LGPD
- `@CLAUDE.md` — Contexto global
- `@AGENTS.md#007backend` — Agente backend

---

## ⚠️ Invariantes (Nunca Quebrar)

1. **WorkspaceModel sempre tem `workspace_id`**
2. **WorkspaceMiddleware sempre valida formato do slug**
3. **Soft delete nunca remove do banco**
4. **Auditoria sempre captura mudanças em dados pessoais**
5. **ViewSets sempre filtram por workspace**

---

## 🚀 Próximos Passos Recomendados

1. Revisar performance do middleware (cache de workspaces)
2. Otimizar queries de auditoria
3. Adicionar métricas de uso
4. Documentar padrões de cache

---

## 🔍 Anchors Semânticos

| Termo | Significado |
|-------|-------------|
| `WorkspaceModel` | Base model com `workspace_id` para multi-tenancy |
| `WorkspaceMiddleware` | Define `request.workspace` via header |
| `WorkspaceViewSet` | ViewSet base com filtro automático |
| `SoftDeleteModel` | Model com soft delete |
| `log_audit()` | Função para auditoria LGPD |




