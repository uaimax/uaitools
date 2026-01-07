# Windsurf — Regras Persistentes

> **Versão**: 1.0.0
> **Última atualização**: 2024-12
> **Compatível com**: Claude Code, Cursor, Windsurf

---

## 🎯 Propósito

Este arquivo contém **regras persistentes** para o Windsurf, garantindo que o contexto e as decisões sejam mantidas entre sessões.

**Referências principais**:
- `@CLAUDE.md` — Contexto global
- `@AGENTS.md` — Agentes especializados
- `@docs/context/` — Contexto adicional

---

## 📦 Visão Geral do Projeto

| Aspecto | Valor |
|---------|-------|
| **Nome** | SaaS Bootstrap |
| **Stack** | Django 5 + Django REST Framework |
| **Arquitetura** | Multi-tenancy por `workspace_id` |
| **Banco Dev** | SQLite |
| **Banco Prod** | PostgreSQL |
| **Frontend** | React + Vite + TypeScript + Tailwind CSS |

---

## 🔐 REGRAS ABSOLUTAS

### ALWAYS (Sempre Fazer)

1. **Ler contexto antes de agir**
   - Ler `@CLAUDE.md`
   - Ler `@AGENTS.md`
   - Ler `ANALYSIS.md` do módulo atual
   - Verificar `@docs/context/PROTECTED_AREAS.md`

2. **Usar type hints** em todas as funções Python

3. **Manter arquivos < 300 linhas**

4. **Testes junto ao app** em `tests/`

5. **APIs com prefixo `/api/`** sempre

6. **Multi-tenancy**: Herdar `WorkspaceModel` para dados de tenant

7. **Variáveis de ambiente**: Nunca hardcodar URLs ou secrets

### NEVER (Nunca Fazer)

1. **NUNCA modificar migrations existentes**
   - Caminho: `backend/apps/*/migrations/`
   - Risco: Quebra de banco de dados

2. **NUNCA alterar models de autenticação sem autorização**
   - `backend/apps/accounts/models.py` (User, Workspace)
   - `backend/apps/core/models.py` (WorkspaceModel)

3. **NUNCA modificar middleware de tenant**
   - `backend/apps/core/middleware.py`
   - Risco: Vazamento entre tenants

4. **NUNCA alterar settings de produção**
   - `backend/config/settings/prod.py`
   - Risco: Exposição de produção

5. **NUNCA executar comandos destrutivos**
   - `DROP`, `DELETE` em massa, `migrate --fake`

---

## 🚦 Sistema de Zonas de Proteção

### 🔴 ZONA VERMELHA — NUNCA TOCAR

```
backend/apps/accounts/migrations/
backend/apps/accounts/models.py
backend/apps/core/models.py
backend/apps/core/middleware.py
backend/config/settings/prod.py
```

**Ação**: PARAR e solicitar autorização humana.

### 🟡 ZONA AMARELA — CUIDADO ESPECIAL

```
backend/config/settings/base.py
backend/config/settings/dev.py
backend/config/urls.py
*.sh (scripts shell)
```

**Ação**: Criar PLAN, aguardar aprovação, mudanças mínimas.

### 🟢 ZONA VERDE — DESENVOLVIMENTO NORMAL

```
backend/api/
backend/apps/ (novos apps)
frontend/
docs/
tests/
```

**Ação**: Desenvolver seguindo convenções.

---

## 🤖 Agentes Especializados

Este repositório usa agentes @007 para tarefas específicas.

**Referência completa**: `@AGENTS.md`

| Agente | Quando Usar |
|--------|-------------|
| `@007architect` | Decisões de arquitetura, novos módulos |
| `@007backend` | Django, APIs, models, services |
| `@007frontend` | React, UI, componentes, Tailwind CSS |
| `@007security` | Auth, authz, vulnerabilidades |
| `@007qa` | Testes, validação, cobertura |
| `@007devops` | Deploy, CI/CD, containers |
| `@007explorer` | Análise, onboarding, descoberta |
| `@007docs` | Documentação, README, contexto |

---

## 🔄 Workflow de Trabalho

Antes de qualquer implementação:

```
1. DISCOVERY   → Entender contexto (ler ANALYSIS.md)
2. ZONE CHECK  → Verificar se área é protegida
3. ANALYSIS    → Avaliar impactos e dependências
4. PLAN        → Criar plano (aguardar aprovação se zona amarela/vermelha)
5. IMPLEMENT   → Executar mudanças incrementais
6. REVIEW      → Validar e testar
```

**Referência completa**: `@docs/context/STATE_MACHINE.md`

---

## 📍 Anchors Semânticos (Anti-Alucinação)

Termos-chave deste projeto — use para validar entendimento:

| Termo | Significado Correto |
|-------|---------------------|
| `WorkspaceModel` | Base model com `workspace_id` para multi-tenancy |
| `X-Workspace-ID` | Header HTTP com slug do workspace |
| `WorkspaceMiddleware` | Define `request.workspace` |
| `/api/` | Prefixo obrigatório para todas as APIs |
| `AUTH_USER_MODEL` | `accounts.User` (customizado) |
| `Jazzmin` | Tema do Django Admin |

---

## 🧭 Navegação de Contexto

### Para entender o projeto
```
@README.md
@docs/ARCHITECTURE.md
```

### Para entender regras de proteção
```
@docs/context/PROTECTED_AREAS.md
@docs/context/ORCHESTRATION.md
```

### Para entender um módulo específico
```
@backend/ANALYSIS.md
@backend/apps/accounts/ANALYSIS.md
@backend/apps/core/ANALYSIS.md
@backend/apps/leads/ANALYSIS.md
@frontend/ANALYSIS.md
```

### Para entender agentes
```
@AGENTS.md
```

---

## 🛠️ Comandos Úteis

```bash
# Iniciar desenvolvimento
./dev-start.sh

# Executar testes
./run-tests.sh

# Aplicar migrations
make migrate

# Criar migrations
make makemigrations
```

---

## 📚 Referências Externas

- [Django 5 Docs](https://docs.djangoproject.com/en/5.0/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [drf-spectacular](https://drf-spectacular.readthedocs.io/)

---

## ⚠️ Lembrete Final

> **Antes de modificar qualquer código, pergunte-se:**
>
> 1. Estou em uma zona protegida?
> 2. Li o ANALYSIS.md deste módulo?
> 3. Entendo as invariantes?
> 4. Minhas mudanças seguem as convenções?
> 5. Preciso de autorização humana?

**Em caso de dúvida, PARE e pergunte.**

---

## 🔄 Interoperabilidade

Este arquivo é compatível com:
- **Claude Code**: Lê `@CLAUDE.md` e `@AGENTS.md`
- **Cursor**: Lê `.cursor/rules/*.mdc`
- **Windsurf**: Lê este arquivo (`Windsurf.md`)

**Sincronização**: Todos referenciam os mesmos arquivos de contexto para evitar divergências.


