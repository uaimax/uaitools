# Erros Comuns e Soluções

Este arquivo documenta **erros já enfrentados** e suas soluções para evitar repetição.

---

## ❌ NUNCA Criar ou Editar Migrations Manualmente

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [django, migrations, database]
**Severidade**: critical

### Contexto
Criar ou editar migrations manualmente quebra o histórico do Django e causa `InconsistentMigrationHistory`.

### Problema
- Migrations criadas manualmente não seguem o padrão do Django
- Editar migrations existentes quebra histórico em ambientes que já aplicaram
- Causa erros de `InconsistentMigrationHistory`
- Em produção, pode quebrar o banco permanentemente

### Solução
**SEMPRE usar comandos do Django**:

```bash
# ✅ CORRETO - Criar migrations
python manage.py makemigrations

# ✅ CORRETO - Aplicar migrations
python manage.py migrate

# ✅ CORRETO - Ver estado
python manage.py showmigrations

# ❌ ERRADO - Criar arquivo manualmente
# apps/*/migrations/000X_*.py  # NUNCA fazer isso

# ❌ ERRADO - Editar migration existente
# Editar arquivo em migrations/  # NUNCA fazer isso
```

### Em Desenvolvimento
O `dev-start.sh` agora:
- Detecta erros de migrations automaticamente
- Reseta o banco e aplica migrations do zero se houver erro
- Garante que sempre começamos com banco limpo

### Lições Aprendidas
- Migrations são imutáveis após commit
- Se migration está errada, criar nova que corrige
- Nunca criar ou editar arquivos em `migrations/` diretamente
- Sempre usar `makemigrations` e `migrate` do Django
- Em desenvolvimento, resetar banco é mais simples que corrigir histórico

### Referências
- `.cursorrules` - Regra crítica sobre migrations
- `.cursor/rules/backend.mdc` - Regras específicas do backend
- `.cursor/rules/global.mdc` - Regras globais

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

## ❌ Executar collectstatic Durante Build no Docker (CapRover)

**Data**: 2025-12-28
**Categoria**: backend, devops
**Tags**: [docker, caprover, deploy, csrf, environment-variables]
**Severidade**: critical

### Contexto
Deploy no CapRover falha ou admin login não funciona por erro de CSRF, mesmo com variáveis de ambiente configuradas no painel.

### Problema
O Dockerfile original tentava executar `collectstatic` durante o build:

```dockerfile
# ❌ ERRADO - Durante o build, variáveis de ambiente não estão disponíveis!
RUN python manage.py collectstatic --noinput
```

O CapRover passa variáveis como `--build-arg`, mas o Dockerfile não declarava `ARG` para consumi-las. Resultado:
- `ALLOWED_HOSTS` vazio → erro de validação ou `*` como fallback
- `CSRF_TRUSTED_ORIGINS` vazio → login do admin bloqueado
- `DATABASE_URL` vazio → fallback para SQLite

**Warning típico:**
```
[Warning] One or more build-args [ALLOWED_HOSTS, DATABASE_URL, ...] were not consumed
```

### Solução
**NUNCA executar collectstatic ou migrations durante o build**. Mover para script de entrada (entrypoint):

```dockerfile
# ✅ CORRETO - Não executar collectstatic no build
# Copiar código e dependências
COPY . .

# Script de entrada executa em RUNTIME (variáveis disponíveis)
CMD ["/app/entrypoint.sh"]
```

```bash
# entrypoint.sh - Executado em RUNTIME
#!/bin/bash
python manage.py collectstatic --noinput  # ✅ Variáveis disponíveis aqui
python manage.py migrate --noinput
exec gunicorn config.wsgi:application --bind 0.0.0.0:80
```

### Por Que É Crítico
- **Build-time vs Runtime**: Docker `ARG` só existe durante build, `ENV` persiste
- **CapRover**: Passa variáveis como `--build-arg`, não como `ENV`
- **Django**: Precisa das variáveis para carregar settings corretamente
- **CSRF**: Sem `CSRF_TRUSTED_ORIGINS` correto, login do admin falha

### Lições Aprendidas
- **SEMPRE** mover collectstatic e migrations para script de entrada
- **NUNCA** assumir que variáveis de ambiente estarão disponíveis durante build
- Se precisar de variável no build, declarar explicitamente com `ARG`
- CapRover passa variáveis como `--build-arg`, não como variáveis de ambiente
- Warning "build-args not consumed" = Dockerfile não está usando as variáveis

### Dockerfile Ideal para CapRover + Django
Ver: `backend/Dockerfile` (atualizado em 2025-12-28)

### Referências
- `backend/Dockerfile`
- `backend/config/settings/base.py` (CSRF_TRUSTED_ORIGINS)
- https://justdjango.com/blog/deploy-django-caprover

---

## ❌ Sobrescrever CSRF_TRUSTED_ORIGINS em dev.py (perde origens de base.py)

**Data**: 2025-12-28
**Categoria**: backend, security
**Tags**: [csrf, settings, dev, production]
**Severidade**: critical

### Contexto
Login do admin Django falhando com erro CSRF mesmo com origem configurada em `base.py`.

### Problema
O `dev.py` estava **sobrescrevendo completamente** `CSRF_TRUSTED_ORIGINS`, perdendo as origens definidas em `base.py`:

```python
# ❌ ERRADO - dev.py
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
# Isso SOBRESCREVE a lista de base.py, perdendo https://ut-be.app.webmaxdigital.com!
```

**Sintoma:**
```
Forbidden (Origin checking failed - https://ut-be.app.webmaxdigital.com does not match any trusted origins.)
```

### Solução
**NUNCA sobrescrever `CSRF_TRUSTED_ORIGINS` em arquivos de settings específicos**. Sempre **adicionar** à lista existente:

```python
# ✅ CORRETO - dev.py
# base.py já tem a origem de produção e outras necessárias
if "http://localhost:5173" not in CSRF_TRUSTED_ORIGINS:  # noqa: F405
    CSRF_TRUSTED_ORIGINS.append("http://localhost:5173")  # noqa: F405
if "http://127.0.0.1:5173" not in CSRF_TRUSTED_ORIGINS:  # noqa: F405
    CSRF_TRUSTED_ORIGINS.append("http://127.0.0.1:5173")  # noqa: F405
```

### Por Que É Crítico
- `base.py` define origens compartilhadas (produção + desenvolvimento)
- `dev.py` e `prod.py` devem apenas **adicionar** configurações específicas
- Sobrescrever perde configurações importantes de `base.py`
- Em produção, isso quebra login do admin completamente

### Lições Aprendidas
- **SEMPRE** verificar se está sobrescrevendo ou adicionando configurações
- **NUNCA** fazer `CSRF_TRUSTED_ORIGINS = [...]` em `dev.py` ou `prod.py`
- **SEMPRE** usar `.append()` ou verificar `if not in` antes de adicionar
- Logs explícitos (`[CSRF] ✅ CSRF_TRUSTED_ORIGINS configurado`) ajudam a debugar

### Como Detectar
- Logs não mostram origem de produção: `[CSRF] - https://ut-be.app.webmaxdigital.com`
- Erro CSRF mesmo com origem configurada em `base.py`
- Verificar se `dev.py` ou `prod.py` fazem `CSRF_TRUSTED_ORIGINS = [...]`

### Referências
- `backend/config/settings/base.py` (define origens base)
- `backend/config/settings/dev.py` (deve apenas adicionar)
- `backend/config/settings/prod.py` (deve apenas adicionar)

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

