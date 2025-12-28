# CapRover CLI - Comandos Corretos e Alternativas

**Data:** 2025-12-28  
**Status:** ✅ Documentação Atualizada

---

## 🔍 Descoberta Importante

O **CapRover CLI não possui comandos diretos** como `exec`, `logs`, `getenv`, `setenv`. Esses comandos que sugeri anteriormente **não existem** no CLI oficial.

O CapRover CLI é focado em:
- ✅ Login/Logout
- ✅ Deploy de aplicações
- ✅ Chamadas genéricas de API

---

## 📋 Comandos Disponíveis no CapRover CLI

### Comandos Básicos

```bash
# Ver ajuda geral
caprover --help

# Ver versão
caprover --version

# Login em servidor
caprover login

# Listar servidores conectados
caprover list
# ou
caprover ls

# Logout de servidor
caprover logout

# Deploy de aplicação
caprover deploy

# Chamada genérica de API
caprover api
```

### Comando `api` - Acesso a APIs do CapRover

O comando `api` permite chamar qualquer endpoint da API do CapRover:

```bash
caprover api \
  -n NOME_DO_SERVIDOR \
  -t /CAMINHO_DA_API \
  -m GET
```

**Exemplo:**
```bash
# Listar apps
caprover api -n captain-01 -t /user/apps -m GET

# Obter informações de um app
caprover api -n captain-01 -t /user/apps/ut-be -m GET
```

---

## 🔄 Alternativas para Comandos que Não Existem

### ❌ `caprover exec -a ut-be "comando"` (NÃO EXISTE)

**Alternativas:**

#### Opção 1: Via Dashboard do CapRover
1. Acesse o dashboard: `https://captain.app.webmaxdigital.com`
2. Vá em "Apps" → Selecione `ut-be`
3. Vá em "One-Click Apps/Docker" → "Terminal"
4. Execute comandos diretamente no terminal web

#### Opção 2: Via API do CapRover (SSH/Docker Exec)
O CapRover não expõe diretamente exec via API. Use o dashboard.

#### Opção 3: Via SSH no Servidor (se tiver acesso)
```bash
# Se tiver acesso SSH ao servidor CapRover
ssh usuario@servidor-caprover

# Depois, executar docker exec diretamente
docker exec -it captain-captain.ut-be.1 bash
python check_csrf_config.py
```

---

### ❌ `caprover logs -a ut-be` (NÃO EXISTE)

**Alternativas:**

#### Opção 1: Via Dashboard do CapRover
1. Acesse o dashboard: `https://captain.app.webmaxdigital.com`
2. Vá em "Apps" → Selecione `ut-be`
3. Vá em "App Logs"
4. Veja logs em tempo real

#### Opção 2: Via API do CapRover
```bash
# Obter logs via API
caprover api \
  -n captain-01 \
  -t /user/apps/ut-be/logs \
  -m GET
```

#### Opção 3: Via SSH no Servidor (se tiver acesso)
```bash
# Se tiver acesso SSH
docker logs captain-captain.ut-be.1 --tail 100
```

---

### ❌ `caprover getenv -a ut-be` (NÃO EXISTE)

**Alternativas:**

#### Opção 1: Via Dashboard do CapRover
1. Acesse o dashboard: `https://captain.app.webmaxdigital.com`
2. Vá em "Apps" → Selecione `ut-be`
3. Vá em "App Configs" → "Environment Variables"
4. Veja todas as variáveis

#### Opção 2: Via API do CapRover
```bash
# Obter variáveis de ambiente via API
caprover api \
  -n captain-01 \
  -t /user/apps/ut-be \
  -m GET
```

A resposta JSON incluirá `appDefinitions.envVars`.

#### Opção 3: Via Script Python no Container (se conseguir executar)
```python
# Se conseguir executar no container
import os
for key, value in os.environ.items():
    if 'CSRF' in key or 'R2' in key:
        print(f"{key}={value}")
```

---

### ❌ `caprover setenv -a ut-be KEY=VALUE` (NÃO EXISTE)

**Alternativas:**

#### Opção 1: Via Dashboard do CapRover (RECOMENDADO)
1. Acesse o dashboard: `https://captain.app.webmaxdigital.com`
2. Vá em "Apps" → Selecione `ut-be`
3. Vá em "App Configs" → "Environment Variables"
4. Adicione/Edite variáveis
5. Clique em "Save & Update"

#### Opção 2: Via API do CapRover
```bash
# Atualizar variáveis via API (complexo, requer JSON completo)
caprover api \
  -n captain-01 \
  -t /user/apps/ut-be \
  -m POST \
  -d '{"appDefinitions": {"envVars": {"KEY": "VALUE"}}}'
```

**⚠️ CUIDADO:** A API requer o JSON completo da definição do app, não apenas a variável.

---

## 🎯 Soluções Práticas para Nossos Casos de Uso

### 1. Executar Script de Diagnóstico CSRF

**Opção 1: Via Dashboard (MAIS FÁCIL)**
1. Dashboard → Apps → `ut-be` → Terminal
2. Execute: `python check_csrf_config.py`

**Opção 2: Via SSH (se tiver acesso)**
```bash
ssh usuario@servidor
docker exec -it captain-captain.ut-be.1 python check_csrf_config.py
```

### 2. Ver Logs de CSRF

**Opção 1: Via Dashboard (MAIS FÁCIL)**
1. Dashboard → Apps → `ut-be` → App Logs
2. Filtre por "CSRF"

**Opção 2: Via API**
```bash
caprover api -n captain-01 -t /user/apps/ut-be/logs -m GET | grep CSRF
```

### 3. Verificar Variáveis de Ambiente

**Opção 1: Via Dashboard (MAIS FÁCIL)**
1. Dashboard → Apps → `ut-be` → App Configs → Environment Variables
2. Procure por `CSRF_TRUSTED_ORIGINS` e variáveis `R2_*`

**Opção 2: Via API**
```bash
caprover api -n captain-01 -t /user/apps/ut-be -m GET | jq '.appDefinitions.envVars'
```

### 4. Configurar Variáveis de Ambiente

**Opção 1: Via Dashboard (RECOMENDADO)**
1. Dashboard → Apps → `ut-be` → App Configs → Environment Variables
2. Adicione/Edite:
   - `CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com`
   - `R2_ACCOUNT_ID=...`
   - `R2_ACCESS_KEY_ID=...`
   - `R2_SECRET_ACCESS_KEY=...`
   - `R2_BUCKET=...`
3. Clique em "Save & Update"
4. Aguarde o redeploy automático

---

## 📝 Checklist de Configuração

### Para Corrigir CSRF:

- [ ] Acessar dashboard: `https://captain.app.webmaxdigital.com`
- [ ] Apps → `ut-be` → App Configs → Environment Variables
- [ ] Verificar se `CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com` existe
- [ ] Se não existir, adicionar (sem espaços, sem barra no final)
- [ ] Clicar em "Save & Update"
- [ ] Aguardar redeploy
- [ ] Testar login no admin

### Para Corrigir Storage R2:

- [ ] Acessar dashboard: `https://captain.app.webmaxdigital.com`
- [ ] Apps → `ut-be` → App Configs → Environment Variables
- [ ] Verificar se todas as 4 variáveis R2 existem:
  - [ ] `R2_ACCOUNT_ID`
  - [ ] `R2_ACCESS_KEY_ID`
  - [ ] `R2_SECRET_ACCESS_KEY`
  - [ ] `R2_BUCKET`
- [ ] Se faltar alguma, adicionar
- [ ] Clicar em "Save & Update"
- [ ] Aguardar redeploy
- [ ] Testar upload de áudio

---

## 🔗 Referências

- [CapRover CLI GitHub](https://github.com/caprover/caprover-cli)
- [CapRover Main GitHub](https://github.com/caprover/caprover)
- [CapRover Documentation](https://caprover.com/docs/)

---

## ⚠️ Lições Aprendidas

1. **CapRover CLI é limitado** - Focado apenas em deploy e login
2. **Dashboard é a ferramenta principal** - Use o dashboard para gerenciar apps
3. **API existe mas é complexa** - Requer conhecimento da estrutura JSON
4. **SSH é alternativa** - Se tiver acesso ao servidor, pode usar docker diretamente

---

## ✅ Recomendação Final

**Para gerenciar apps no CapRover, use o Dashboard Web:**
- Mais fácil e intuitivo
- Todas as funcionalidades disponíveis
- Interface visual clara
- Sem necessidade de conhecer APIs complexas

**Use o CLI apenas para:**
- Deploy automatizado (CI/CD)
- Scripts de automação
- Login/logout programático

