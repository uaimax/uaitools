# Guia de Setup como Template GitHub

Este repositório foi projetado para ser usado como template no GitHub. Siga este guia para personalizar o projeto para seu SaaS.

## 🎯 Personalização Rápida

### 1. Variáveis de Ambiente Obrigatórias

Edite o arquivo `.env` (ou `.env.example`) e configure:

```bash
# Nome do seu projeto
PROJECT_NAME=Meu SaaS Incrível

# Branding do Admin
SITE_TITLE=Meu SaaS Incrível Admin
SITE_HEADER=Meu SaaS Incrível
SITE_BRAND=Meu SaaS Incrível
API_TITLE=Meu SaaS Incrível API
COPYRIGHT=Meu SaaS Incrível

# Segurança: URL do Admin (NUNCA use "admin" em produção!)
ADMIN_URL_PREFIX=manage  # Use: dashboard, control, panel, etc

# Secret Key (OBRIGATÓRIO em produção)
SECRET_KEY=seu-secret-key-super-seguro-aqui
```

### 2. Renomear Repositório

1. No GitHub, clique em "Use this template"
2. Crie um novo repositório com o nome do seu projeto
3. Clone o repositório

### 3. Buscar e Substituir

Execute uma busca global por "SaaS Bootstrap" e substitua por seu nome:

```bash
# Exemplo com sed (Linux/Mac)
find . -type f -name "*.md" -o -name "*.py" | xargs sed -i 's/SaaS Bootstrap/Meu SaaS/g'
```

**Arquivos a verificar:**
- `README.md`
- `docs/*.md`
- `CLAUDE.md`
- `AGENTS.md`
- `.cursorrules`

### 4. Configurar Admin URL

O admin não está mais em `/admin/` por padrão. Use o prefixo configurado:

- **Desenvolvimento**: `http://localhost:8001/manage/` (ou o valor de `ADMIN_URL_PREFIX`)
- **Produção**: Configure `ADMIN_URL_PREFIX` no `.env` antes do deploy

**Por que mudar?**
- `/admin/` é alvo comum de ataques automatizados
- Prefixo customizado aumenta segurança
- Bots não conseguem descobrir facilmente

### 5. Verificar Funcionamento

```bash
# 1. Configurar .env
cp .env.example .env
# Edite .env com seus valores

# 2. Iniciar servidor
./dev-start.sh

# 3. Acessar admin
# http://localhost:8001/manage/ (ou seu ADMIN_URL_PREFIX)
```

## 🔒 Segurança

### Admin URL Prefix

**Recomendações:**
- ✅ Use algo único: `manage`, `dashboard`, `control`, `panel`
- ✅ Evite palavras comuns: `admin`, `login`, `access`
- ✅ Use caracteres aleatórios se possível: `x7k9m2p`
- ❌ NUNCA use `admin` em produção

**Exemplo:**
```bash
ADMIN_URL_PREFIX=x7k9m2p  # Muito mais seguro!
```

### Secret Key

**Em produção, SEMPRE:**
```bash
# Gere uma chave segura
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Use no .env
SECRET_KEY=<chave-gerada>
```

## 📝 Checklist de Personalização

- [ ] Renomear repositório no GitHub
- [ ] Configurar `PROJECT_NAME` no `.env`
- [ ] Configurar `SITE_TITLE`, `SITE_HEADER`, `SITE_BRAND`
- [ ] Configurar `API_TITLE`
- [ ] Configurar `COPYRIGHT`
- [ ] Configurar `ADMIN_URL_PREFIX` (não use "admin"!)
- [ ] Gerar `SECRET_KEY` seguro
- [ ] Buscar e substituir "SaaS Bootstrap" em documentação
- [ ] Atualizar `README.md` com informações do seu projeto
- [ ] Testar acesso ao admin com novo prefixo
- [ ] Verificar que API retorna nome correto

## 🚀 Deploy

Após personalizar, siga o guia de deploy:

- [Deploy Guide](DEPLOYMENT.md)

## 📚 Variáveis de Ambiente Completas

Veja `.env.example` para lista completa de variáveis configuráveis.

**Principais:**
- `PROJECT_NAME` - Nome do projeto
- `ADMIN_URL_PREFIX` - URL do admin (segurança)
- `SECRET_KEY` - Chave secreta Django
- `ALLOWED_HOSTS` - Hosts permitidos
- `FRONTEND_URL` - URL do frontend (quando separado)
- `API_URL` - URL da API (quando separado)
- `CORS_ENABLED` - Habilitar CORS (quando separado)

## 🔄 Sincronização de Código Compartilhado

Este template contém código compartilhado que pode ser atualizado quando o template é melhorado.

**Documentação completa**: [`@docs/SHARED_VS_CUSTOMIZABLE.md`](SHARED_VS_CUSTOMIZABLE.md)

### O que é Código Compartilhado?

Código compartilhado é código que vem do template e deve ser sincronizado quando o template é atualizado:

- **Backend**: `apps/core/`, `apps/accounts/` (base)
- **Frontend**: `features/admin/` (Admin UI Kit), `features/auth/` (lógica), `config/api.ts`, `lib/`

### O que é Código Customizável?

Código customizável é código que você pode modificar livremente:

- **Backend**: `apps/leads/` (exemplo), novos apps, `config/settings/`
- **Frontend**: `pages/`, `App.tsx`, `features/leads/` (exemplo), componentes de negócio

### Processo de Sincronização

Quando o template é atualizado:

1. Verificar versão do template (tags Git: `v1.0.0`, `v1.1.0`, etc)
2. Revisar CHANGELOG para breaking changes
3. Sincronizar código compartilhado seletivamente
4. Resolver conflitos manualmente
5. Testar após sincronização

**Guia detalhado**: [`@docs/SHARED_VS_CUSTOMIZABLE.md`](SHARED_VS_CUSTOMIZABLE.md#processo-de-sincronização-detalhado)

---

## ⚠️ Importante

1. **NUNCA commite `.env`** com valores reais
2. **SEMPRE use `ADMIN_URL_PREFIX` diferente de "admin"** em produção
3. **Gere `SECRET_KEY` único** para cada ambiente
4. **Atualize `ALLOWED_HOSTS`** antes do deploy
5. **NUNCA modifique código compartilhado diretamente** — use herança/extensão (ver [`@docs/SHARED_VS_CUSTOMIZABLE.md`](SHARED_VS_CUSTOMIZABLE.md))


