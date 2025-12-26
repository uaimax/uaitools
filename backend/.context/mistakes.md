# Erros Comuns e Soluções

Este arquivo documenta **erros já enfrentados** e suas soluções para evitar repetição.

---

## ❌ NUNCA Modificar Migrations Existentes

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [django, migrations, database]
**Severidade**: critical

### Contexto
Tentativa de corrigir migration já aplicada em produção ou desenvolvimento.

### Problema
Modificar migrations existentes quebra o histórico do Django e pode causar inconsistências em ambientes que já aplicaram a migration.

### Solução
**SEMPRE criar nova migration** ao invés de modificar existente:

```bash
# ❌ ERRADO: Editar migration existente
# ✅ CORRETO: Criar nova migration
python manage.py makemigrations
```

### Lições Aprendidas
- Migrations são imutáveis após commit
- Se migration está errada, criar nova que corrige
- Nunca editar `migrations/` diretamente

### Referências
- `docs/context/PROTECTED_AREAS.md`
- `.cursorrules`

---

## ❌ Não Hardcodar Secrets ou URLs

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [security, configuration, environment]
**Severidade**: high

### Contexto
Código com valores hardcoded que devem ser configuráveis.

### Problema
Secrets ou URLs hardcoded no código:
- Não funcionam em diferentes ambientes
- São risco de segurança
- Dificultam deploy

### Solução
**SEMPRE usar variáveis de ambiente**:

```python
# ❌ ERRADO
DATABASE_URL = "postgresql://user:pass@localhost/db"

# ✅ CORRETO
import os
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///db.sqlite3')
```

### Lições Aprendidas
- Usar `os.getenv()` ou `django-environ`
- Documentar variáveis necessárias em `.env.example`
- Nunca commitar `.env` no Git

### Referências
- `backend/config/settings/base.py`
- `.cursorrules`

---

## ❌ Não Ignorar Multi-tenancy em ViewSets

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [multi-tenancy, viewsets, security]
**Severidade**: critical

### Contexto
ViewSet que não filtra por tenant, permitindo acesso a dados de outros tenants.

---

## ❌ Remover WorkspaceObjectPermission ao Sobrescrever permission_classes

**Data**: 2025-12-24
**Categoria**: backend, security
**Tags**: [security, permissions, idor, multi-tenancy]
**Severidade**: critical

### Contexto
ViewSet que herda de `WorkspaceViewSet` mas sobrescreve `permission_classes` sem incluir `WorkspaceObjectPermission`.

### Problema
```python
# ❌ ERRADO
class MyViewSet(WorkspaceViewSet):
    permission_classes = [IsAuthenticated]  # Remove proteção IDOR!
```

### Solução
```python
# ✅ CORRETO
from apps.core.permissions import WorkspaceObjectPermission

class MyViewSet(WorkspaceViewSet):
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]
```

### Por Que É Crítico
- Remove proteção contra IDOR (Insecure Direct Object Reference)
- Permite acesso a objetos de outras workspaces
- Violação crítica de isolamento multi-tenant

### Lições Aprendidas
- **SEMPRE** incluir `WorkspaceObjectPermission` ao sobrescrever `permission_classes`
- `WorkspaceViewSet` já inclui por padrão, mas sobrescrever remove
- Verificar em code review se `WorkspaceObjectPermission` está presente

### Referências
- `backend/.context/security-patterns.md`
- `apps/core/permissions.py`
- `docs/SECURITY_ANALYSIS.md`

---

## ❌ Logar Dados Sensíveis Diretamente

**Data**: 2025-12-24
**Categoria**: backend, security
**Tags**: [security, logging, data-leakage]
**Severidade**: high

### Contexto
Código que loga senhas, tokens ou outros dados sensíveis diretamente.

### Problema
```python
# ❌ ERRADO
logger.info(f"Login attempt: password={password}, token={token}")
logger.error(f"API call failed: api_key={api_key}")
```

### Solução
```python
# ✅ CORRETO
# O SensitiveDataFilter redige automaticamente, mas melhor não logar
logger.info("Login attempt", extra={"user_id": user.id, "email": user.email})
logger.error("API call failed", extra={"endpoint": endpoint})
```

### Por Que É Crítico
- Dados sensíveis podem vazar em logs
- Logs são acessíveis por múltiplas pessoas/ferramentas
- Violação de LGPD se dados pessoais

### Lições Aprendidas
- **NUNCA** logar senhas, tokens, chaves diretamente
- `SensitiveDataFilter` redige automaticamente, mas não confiar apenas nisso
- Usar `extra={}` para contexto estruturado sem dados sensíveis

### Referências
- `backend/.context/security-patterns.md`
- `apps/core/logging.py`
- `docs/SECURITY_ANALYSIS.md`

---

## ❌ Não Ignorar Multi-tenancy em ViewSets

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [multi-tenancy, viewsets, security]
**Severidade**: critical

### Contexto
ViewSet que não filtra por tenant, permitindo acesso a dados de outros tenants.

### Problema
ViewSet sem filtro de tenant permite vazamento de dados entre tenants (violação de isolamento).

### Solução
**SEMPRE filtrar por `request.tenant`**:

```python
# ❌ ERRADO
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()  # Sem filtro!

# ✅ CORRETO
class LeadViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Lead.objects.filter(tenant=self.request.tenant)
```

### Lições Aprendidas
- Sempre verificar filtro de tenant em ViewSets
- Testar isolamento de dados
- Usar `TenantModel` facilita, mas não garante (ainda precisa filtrar)

### Referências
- `backend/apps/core/middleware.py`
- `docs/ARCHITECTURE.md`

---

---
date: 2025-01-27
category: backend
tags: [cors, headers, api, multi-tenancy]
severity: high
---

## CORS: Falta de Headers Customizados em CORS_ALLOW_HEADERS

### Contexto
Requisições do frontend para API sendo bloqueadas por CORS com erro "Request header field x-workspace-id is not allowed by Access-Control-Allow-Headers".

### Problema
O header customizado `X-Workspace-ID` (usado para multi-tenancy) não estava na lista de headers permitidos pelo CORS:

```python
# ❌ ERRADO
CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "x-csrftoken",
    "x-tenant-id",  # Tinha apenas X-Tenant-ID
    # ❌ Faltava X-Workspace-ID
]
```

**Erro resultante:**
```
Access to XMLHttpRequest at 'http://localhost:8001/api/v1/auth/profile/'
from origin 'http://localhost:5173' has been blocked by CORS policy:
Request header field x-workspace-id is not allowed by Access-Control-Allow-Headers
in preflight response.
```

### Solução
**SEMPRE adicionar headers customizados em `CORS_ALLOW_HEADERS`:**

```python
# ✅ CORRETO
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "x-tenant-id",  # Compatibilidade
    "x-workspace-id",  # ✅ Header customizado para multi-tenancy
]
```

### Lições Aprendidas
- **SEMPRE** adicionar headers customizados em `CORS_ALLOW_HEADERS`
- Headers customizados precisam ser explicitamente permitidos pelo CORS
- Erro de CORS bloqueia requisições completamente (não é apenas warning)
- Verificar todos os headers enviados pelo frontend (`X-Workspace-ID`, `X-Tenant-ID`, etc.)
- Reiniciar servidor Django após mudanças em configurações de CORS

### Referências
- Arquivos: `backend/config/settings/base.py`
- Docs: [django-cors-headers](https://github.com/adamchainz/django-cors-headers)

---

---
date: 2025-01-27
category: backend
tags: [csrf, security, django, api]
severity: high
---

## CSRF: Falta de CSRF_TRUSTED_ORIGINS em Desenvolvimento

### Contexto
Requisições POST do frontend (login, etc.) sendo bloqueadas com erro "CSRF Failed: Origin checking failed".

### Problema
O `CSRF_TRUSTED_ORIGINS` não estava configurado em `dev.py`, causando bloqueio de requisições CSRF:

```python
# ❌ ERRADO - dev.py
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"
# ❌ Faltava CSRF_TRUSTED_ORIGINS
```

**Erro resultante:**
```json
{
    "detail": "CSRF Failed: Origin checking failed - http://localhost:5173 does not match any trusted origins."
}
```

### Solução
**SEMPRE configurar `CSRF_TRUSTED_ORIGINS` em desenvolvimento:**

```python
# ✅ CORRETO - dev.py
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"
# CSRF Trusted Origins - permite requisições do frontend
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### Lições Aprendidas
- **SEMPRE** configurar `CSRF_TRUSTED_ORIGINS` em desenvolvimento
- Django 5+ verifica origem mais rigorosamente
- `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` são coisas diferentes:
  - `CORS_ALLOWED_ORIGINS`: controla CORS (headers, métodos)
  - `CSRF_TRUSTED_ORIGINS`: controla validação CSRF (origem confiável)
- Reiniciar servidor Django após mudanças em configurações de CSRF
- Em produção, usar variáveis de ambiente para `CSRF_TRUSTED_ORIGINS`

### Referências
- Arquivos: `backend/config/settings/dev.py`
- Docs: [Django CSRF - Trusted Origins](https://docs.djangoproject.com/en/5.0/ref/settings/#csrf-trusted-origins)

---

## ❌ Não Criar Arquivos > 300 Linhas

**Data**: 2025-01-27
**Categoria**: general
**Tags**: [code-quality, maintainability]
**Severidade**: medium

### Contexto
Arquivo Python muito grande, difícil de manter e entender.

### Problema
Arquivos grandes:
- São difíceis de navegar
- Violam princípio de responsabilidade única
- Dificultam trabalho da LLM (contexto limitado)

### Solução
**Quebrar em módulos menores**:

```python
# ❌ ERRADO: arquivo.py com 500+ linhas
# ✅ CORRETO:
#   - arquivo/models.py
#   - arquivo/views.py
#   - arquivo/services.py
```

### Lições Aprendidas
- Máximo 300 linhas por arquivo
- Separar por responsabilidade (models, views, services)
- Facilita manutenção e compreensão

### Referências
- `.cursorrules`
- `AGENTS.md`

---

