# Aprendizados Positivos - Gerais

Este arquivo documenta **soluções gerais que funcionaram bem** e devem ser replicadas.

---

---
date: 2024-12-23
category: devops
tags: [tmux, automação, desenvolvimento]
severity: medium
---

## tmux Split para Visualização Simultânea

### Contexto
Script de desenvolvimento usando tmux para rodar backend e frontend simultaneamente.

### Solução que Funcionou
**Janela dividida (split) em vez de janelas separadas:**

```bash
# Criar sessão
tmux new-session -d -s "saas-dev" -n "dev" -c "$BACKEND_DIR" "comando_backend"

# Dividir horizontalmente
tmux split-window -h -t "saas-dev:0" -c "$FRONTEND_DIR" "comando_frontend"

# Selecionar painel inicial
tmux select-pane -t "saas-dev:0.0"
```

**Vantagens:**
- Visualização simultânea de ambos os serviços
- Mais fácil de monitorar logs de ambos
- Melhor uso do espaço da tela
- Alternância rápida entre painéis com `Ctrl+B + ←/→`

### Padrão a Replicar
- Para serviços relacionados (backend/frontend), usar split
- Para serviços independentes, usar janelas separadas
- Sempre documentar comandos tmux úteis para o usuário

### Referências
- Arquivos: `dev-start.sh`
- Docs: `docs/DEV_START.md`

---

---
date: 2024-12-24
category: devops
tags: [django, management-commands, social-auth, automation]
severity: high
---

## Comando de Sincronização para SocialApps

### Contexto
SocialApps do django-allauth precisam ser criados no banco de dados, mas queremos automatizar via variáveis de ambiente.

### Solução que Funcionou
**Criar management command `sync_social_apps`** que:
1. Lê variáveis de ambiente para cada provider
2. Cria ou atualiza SocialApp automaticamente
3. Associa ao site atual
4. Ativa os SocialApps

**Uso:**
```bash
python manage.py sync_social_apps
```

**Benefícios:**
- Configuração 100% via ENV vars
- Sincronização automática quando credenciais mudam
- Não precisa acessar Django Admin
- Ideal para CI/CD e deploy automatizado

### Padrão a Replicar
- Criar management commands para configurações que normalmente seriam feitas no Admin
- Sempre verificar se objeto existe antes de criar (get_or_create)
- Atualizar se credenciais mudaram
- Fornecer feedback claro do que foi criado/atualizado

### Referências
- Arquivos: `backend/apps/accounts/management/commands/sync_social_apps.py`
- Docs: `docs/SOCIAL_AUTH.md`

---

---
date: 2024-12
category: general
tags: [architecture, contracts, yagni, bootstrap]
severity: high
---

## Contratos Arquiteturais para Funcionalidades Críticas

### Contexto
Bootstrap sendo finalizado para servir como base reutilizável para múltiplos MicroSaaS. Dois casos de uso críticos identificados: SaaS modular com módulos ativáveis e SaaS de leads com formulários dinâmicos.

### Solução que Funcionou
Criar **contratos arquiteturais** que definem estrutura sem implementar (YAGNI). Contratos em `docs/contracts/`:
- `MODULE_ACTIVATION.md` - Sistema de módulos ativáveis por workspace
- `DYNAMIC_FORMS.md` - Formulários dinâmicos criados em runtime

**Filosofia**: DEFINIR contratos agora, IMPLEMENTAR depois quando necessário.

**Benefícios:**
- Evita refatorações estruturais caras depois
- Permite implementação consistente em produtos derivados
- Não são código, são especificações arquiteturais
- Devem ser consultados ANTES de implementar funcionalidades críticas

### Padrão a Replicar
- Para funcionalidades críticas que afetam estrutura base (models, middleware, permissões)
- Para funcionalidades que múltiplos produtos derivados precisarão
- Quando custo de adicionar depois é alto (refatoração estrutural)
- Sempre documentar estrutura completa (models, helpers, endpoints, exemplos)

### Lições Aprendidas
- Contratos evitam refatorações estruturais caras
- Permitem implementação consistente em produtos derivados
- Não são código, são especificações arquiteturais
- Devem ser consultados ANTES de implementar funcionalidades críticas
- Seguir estrutura definida mantém compatibilidade com bootstrap

### Referências
- Arquivos: `docs/contracts/README.md`, `docs/contracts/MODULE_ACTIVATION.md`, `docs/contracts/DYNAMIC_FORMS.md`
- Docs: `CLAUDE.md` (hierarquia de leitura), `.cursorrules` (referência rápida)

---
