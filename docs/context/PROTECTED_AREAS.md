# Áreas Protegidas — Zonas de Proteção

> **Última atualização**: 2024-12
> **Propósito**: Definir áreas que NUNCA devem ser modificadas sem autorização

---

## 🎯 Propósito

Este documento define **zonas de proteção** no código — áreas que são críticas para o funcionamento do sistema e **NUNCA devem ser modificadas** sem autorização explícita de um humano.

**Regra de Ouro**: Se você está em uma zona protegida, **PARE** e solicite autorização antes de continuar.

---

## 🔴 ZONA VERMELHA — NUNCA TOCAR

### Backend — Models Críticos

```
backend/apps/accounts/models.py
backend/apps/core/models.py
```

**Por quê?**
- `accounts.models`: Define `User` e `Workspace` — base do sistema de autenticação e multi-tenancy
- `core.models`: Define `WorkspaceModel` e `BaseModel` — base de todos os models do sistema

**Risco**: Modificações podem quebrar:
- Autenticação
- Multi-tenancy
- Migrations existentes
- Queries em todo o sistema

**Ação**: PARAR e solicitar autorização humana.

---

### Backend — Middleware Crítico

```
backend/apps/core/middleware.py
```

**Por quê?**
- Define `WorkspaceMiddleware` — responsável por identificar a workspace do request
- Define `UUIDSessionMiddleware` — limpa sessões inválidas

**Risco**: Modificações podem quebrar:
- Multi-tenancy (vazamento entre workspaces)
- Autenticação (sessões inválidas)
- Segurança (enumeration, IDOR)

**Ação**: PARAR e solicitar autorização humana.

---

### Backend — Migrations

```
backend/apps/*/migrations/
```

**Por quê?**
- Migrations são versionadas e aplicadas sequencialmente
- Modificações podem quebrar bancos de dados existentes
- Migrations antigas podem estar em produção

**Risco**: Modificações podem quebrar:
- Bancos de dados em produção
- Histórico de migrations
- Deploys futuros

**Ação**: PARAR e solicitar autorização humana.

**Exceção**: Criar novas migrations é permitido (não modificar existentes).

---

### Backend — Settings de Produção

```
backend/config/settings/prod.py
```

**Por quê?**
- Contém configurações sensíveis de produção
- Modificações podem expor secrets ou quebrar produção

**Risco**: Modificações podem causar:
- Exposição de secrets
- Quebra de produção
- Problemas de segurança

**Ação**: PARAR e solicitar autorização humana.

---

## 🟡 ZONA AMARELA — CUIDADO ESPECIAL

### Backend — Settings Base

```
backend/config/settings/base.py
backend/config/settings/dev.py
```

**Por quê?**
- Configurações base afetam todo o sistema
- Mudanças podem ter impacto em cascata

**Risco**: Modificações podem afetar:
- Todos os ambientes
- Todas as apps
- Configurações de segurança

**Ação**: Criar PLAN, aguardar aprovação, mudanças mínimas.

---

### Backend — URLs Principal

```
backend/config/urls.py
```

**Por quê?**
- Define roteamento principal do sistema
- Mudanças podem quebrar rotas existentes

**Risco**: Modificações podem:
- Quebrar rotas de API
- Afetar frontend
- Quebrar integrações

**Ação**: Criar PLAN, aguardar aprovação.

---

### Scripts Shell

```
*.sh (dev-start.sh, run-tests.sh, etc)
```

**Por quê?**
- Scripts são usados por toda a equipe
- Mudanças podem quebrar workflows

**Risco**: Modificações podem:
- Quebrar ambiente de desenvolvimento
- Afetar CI/CD
- Quebrar workflows da equipe

**Ação**: Criar PLAN, aguardar aprovação.

---

## 🟢 ZONA VERDE — DESENVOLVIMENTO NORMAL

### Backend — Apps de Negócio

```
backend/apps/leads/
backend/apps/[novos-apps]/
```

**Ação**: Desenvolver seguindo convenções.

---

### Backend — API

```
backend/api/
```

**Ação**: Desenvolver seguindo convenções.

---

### Frontend

```
frontend/
```

**Ação**: Desenvolver seguindo convenções.

---

### Documentação

```
docs/
```

**Ação**: Atualizar conforme necessário.

---

## 📋 Checklist Antes de Modificar

Antes de modificar qualquer código, pergunte-se:

- [ ] Estou em uma zona protegida?
- [ ] Este código é compartilhado do template? (ver `@docs/SHARED_VS_CUSTOMIZABLE.md`)
- [ ] Li o `ANALYSIS.md` deste módulo?
- [ ] Entendo as invariantes?
- [ ] Minhas mudanças seguem as convenções?
- [ ] Preciso de autorização humana?

**Se estiver em zona vermelha ou amarela**: PARAR e solicitar autorização.

**Se o código for compartilhado**: Usar herança/extensão ao invés de modificar diretamente (ver `@docs/SHARED_VS_CUSTOMIZABLE.md`).

---

## 🔄 Processo de Autorização

### Para Zona Vermelha

1. **PARAR** imediatamente
2. **Documentar** o que precisa ser modificado e por quê
3. **Solicitar autorização** ao humano
4. **Aguardar aprovação** explícita
5. **Implementar** apenas após aprovação

### Para Zona Amarela

1. **Criar PLAN** detalhado
2. **Documentar** impactos e riscos
3. **Solicitar revisão** ao humano
4. **Aguardar aprovação**
5. **Implementar** de forma incremental

---

## 📚 Referências

- `@CLAUDE.md` — Contexto global
- `@AGENTS.md` — Agentes especializados
- `@docs/SHARED_VS_CUSTOMIZABLE.md` — Código compartilhado vs customizável (template)
- `@backend/ANALYSIS.md` — Análise do backend
- `@docs/ARCHITECTURE.md` — Decisões arquiteturais

---

## ⚠️ Lembrete Final

> **Quando em dúvida, PARE e pergunte.**
>
> É melhor pedir autorização do que quebrar o sistema.


