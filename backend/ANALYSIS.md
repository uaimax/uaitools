# Backend — Análise do Módulo

> **Última atualização**: 2024-12
> **Domínio**: Backend Django + DRF
> **Status**: ✅ Ativo

---

## 🎯 Visão Geral

O backend é construído com **Django 5** e **Django REST Framework**, implementando arquitetura **multi-tenancy** por `workspace_id` (anteriormente `tenant_id` para compatibilidade).

### Stack Principal
- Django 5.x
- Django REST Framework
- PostgreSQL (prod) / SQLite (dev)
- pytest-django
- drf-spectacular (OpenAPI)

---

## 📁 Estrutura

```
backend/
├── config/              # Projeto Django
│   ├── settings/       # base.py, dev.py, prod.py
│   ├── urls.py         # Roteamento principal
│   └── wsgi.py         # WSGI application
├── apps/                # Apps modulares
│   ├── core/           # Base: models, middleware, audit
│   ├── accounts/       # User, Workspace (ZONA VERMELHA)
│   └── leads/          # Módulo exemplo
├── api/                 # Rotas API centralizadas
│   └── v1/             # Versão 1 da API
└── conftest.py          # Fixtures pytest
```

---

## 🔐 Áreas Protegidas

### 🔴 ZONA VERMELHA — NUNCA TOCAR

```
backend/apps/accounts/migrations/     # Migrations de autenticação
backend/apps/accounts/models.py       # User, Workspace (modelos críticos)
backend/apps/core/models.py            # WorkspaceModel, BaseModel (base do sistema)
backend/apps/core/middleware.py       # WorkspaceMiddleware (multi-tenancy)
backend/config/settings/prod.py       # Settings de produção
```

**Ação**: PARAR e solicitar autorização humana antes de qualquer modificação.

### 🟡 ZONA AMARELA — CUIDADO ESPECIAL

```
backend/config/settings/base.py      # Settings base (impacta tudo)
backend/config/settings/dev.py        # Settings de desenvolvimento
backend/config/urls.py                # Roteamento principal
```

**Ação**: Criar PLAN, aguardar aprovação, mudanças mínimas.

---

## 🏗️ Arquitetura Multi-Tenancy

### WorkspaceModel (Base para Multi-Tenancy)

Todos os models que precisam de isolamento por empresa devem herdar `WorkspaceModel`:

```python
from apps.core.models import WorkspaceModel

class MeuModel(WorkspaceModel):
    """Model com multi-tenancy automático."""
    nome = models.CharField(max_length=255)
```

**Características**:
- Campo `workspace` (ForeignKey para `accounts.Workspace`)
- Timestamps automáticos (`created_at`, `updated_at`)
- Soft delete automático
- Índices otimizados para queries por workspace

### WorkspaceMiddleware

Define `request.workspace` baseado no header `X-Workspace-ID` (ou `X-Tenant-ID` para compatibilidade):

```python
# Header HTTP
X-Workspace-ID: slug-da-empresa

# No código
workspace = request.workspace  # Workspace object ou None
```

**Segurança**:
- Validação de formato do slug (previne enumeração)
- Filtra apenas workspaces ativas (`is_active=True`)
- Define usuário para auditoria LGPD

---

## 🔄 Fluxo de Dados

### Request → Response

```
1. Request HTTP com header X-Workspace-ID
2. WorkspaceMiddleware identifica workspace
3. ViewSet filtra automaticamente por workspace
4. Serializer valida e serializa dados
5. Response JSON
```

### Filtro Automático

ViewSets que herdam `WorkspaceViewSet` filtram automaticamente:

```python
class MeuViewSet(WorkspaceViewSet):
    """Filtra automaticamente por request.workspace."""
    queryset = MeuModel.objects.all()
```

---

## 📋 Convenções

### ALWAYS (Sempre Fazer)

1. **Herdar `WorkspaceModel`** para dados multi-tenant
2. **Herdar `WorkspaceViewSet`** para ViewSets com multi-tenancy
3. **Type hints** em todas as funções
4. **Docstrings** em classes e funções públicas
5. **Arquivos < 300 linhas**
6. **APIs com prefixo `/api/`**
7. **Testes em `apps/<app>/tests/`**

### NEVER (Nunca Fazer)

1. **Queries sem filtro de workspace** (`objects.all()` sem filtro)
2. **Lógica de negócio em views** (usar services)
3. **Imports circulares**
4. **Modificar migrations existentes**
5. **Hardcodar URLs ou secrets**

---

## 🔗 Dependências Entre Módulos

```
accounts (User, Workspace)
    ↑
    └── core (WorkspaceModel, middleware)
            ↑
            └── leads (Lead herda WorkspaceModel)
```

**Regra**: Apps de negócio dependem de `core` e `accounts`. `core` não depende de apps de negócio.

---

## 🧪 Testes

### Estrutura

```
apps/<app>/tests/
├── __init__.py
├── test_models.py
├── test_viewsets.py
└── test_services.py (se houver)
```

### Convenções

- Usar `pytest-django`
- Fixtures em `conftest.py` (raiz do backend)
- Nomenclatura: `test_<funcionalidade>_<cenario>`
- Cobertura mínima: 80%

---

## 📚 Referências

- `@docs/ARCHITECTURE.md` — Decisões arquiteturais
- `@backend/apps/core/ANALYSIS.md` — Análise do app core
- `@backend/apps/accounts/ANALYSIS.md` — Análise do app accounts
- `@backend/apps/leads/ANALYSIS.md` — Análise do app leads
- `@CLAUDE.md` — Contexto global
- `@AGENTS.md#007backend` — Agente backend

---

## ⚠️ Invariantes (Nunca Quebrar)

1. **Multi-tenancy**: Todo dado de tenant deve ter `workspace_id`
2. **Soft delete**: Deletar marca `deleted_at`, não remove do banco
3. **UUID**: Primary keys são UUIDs (não inteiros)
4. **Auditoria**: Mudanças em dados pessoais são auditadas (LGPD)
5. **APIs versionadas**: Todas as APIs em `/api/v1/` (ou versão atual)

---

## 🚀 Próximos Passos Recomendados

1. Revisar queries N+1 e otimizar com `select_related`/`prefetch_related`
2. Implementar cache para queries frequentes
3. Adicionar rate limiting por workspace
4. Documentar APIs com OpenAPI (drf-spectacular)

---

## 🔍 Anchors Semânticos

| Termo | Significado |
|-------|-------------|
| `WorkspaceModel` | Base model com `workspace_id` para multi-tenancy |
| `WorkspaceMiddleware` | Define `request.workspace` via header |
| `X-Workspace-ID` | Header HTTP com slug da workspace |
| `WorkspaceViewSet` | ViewSet base com filtro automático por workspace |
| `SoftDeleteModel` | Model com soft delete (não remove do banco) |




