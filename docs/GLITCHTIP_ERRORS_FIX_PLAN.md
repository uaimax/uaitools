# Plano de Correção de Erros do GlitchTip

**Data:** 2025-12-28  
**Status:** 🔄 Em Andamento

---

## 📋 Erros Encontrados

### 1. ⚠️ Issue #5: HTTP Error 401 - POST /api/v1/auth/login/

**Severidade:** Baixa  
**Status:** Não crítico  
**Ocorrências:** 3

**Descrição:**
- Tentativas de login com credenciais inválidas
- Pode ser tentativas legítimas de login ou bots

**Ação:**
- ✅ **Pode ser ignorado** - Erro esperado para credenciais inválidas
- Não requer correção de código
- Pode ser marcado como resolvido se quiser limpar o dashboard

---

### 2. ⚠️ Issue #8: HTTP Error 404 - GET /

**Severidade:** Baixa  
**Status:** Não crítico  
**Ocorrências:** 3

**Descrição:**
- Requisições para rota raiz `/` que não existe
- Provavelmente bot ou health check
- User-Agent: `python-requests/2.32.5`

**Ação:**
- ✅ **Pode ser ignorado** - Não afeta funcionalidade
- Opcional: Adicionar rota raiz que redireciona para `/api/` ou admin
- Pode ser marcado como resolvido se quiser limpar o dashboard

---

### 3. 🔴 Issue #43: HTTP Error 403 - POST /painel/login/ (CSRF)

**Severidade:** Crítica  
**Status:** Requer ação manual  
**Ocorrências:** 4

**Descrição:**
```
Origin checking failed - https://ut-be.app.webmaxdigital.com does not match any trusted origins.
```

**Causa:**
- `CSRF_TRUSTED_ORIGINS` não está sendo carregado corretamente
- Variável de ambiente não configurada ou não carregada após redeploy

**Correção no Código:**
- ✅ Já corrigido: Logging detalhado adicionado em `prod.py`
- ✅ Já corrigido: Script de diagnóstico criado (`check_csrf_config.py`)

**Ação Manual Necessária:**
1. Acessar dashboard do CapRover
2. Apps → `ut-be` → App Configs → Environment Variables
3. Verificar/Adicionar: `CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com`
4. Clicar em "Save & Update"
5. Aguardar redeploy
6. Testar login no admin
7. **Após confirmar funcionamento:** Marcar issue como resolvido

**Como Marcar como Resolvido:**
```bash
cd backend
python resolve_glitchtip_issues.py --issue-id 43
```

---

### 4. 🔴 Issue #42: ValueError - Storage R2

**Severidade:** Crítica  
**Status:** Requer ação manual  
**Ocorrências:** 1

**Descrição:**
```
Erro ao baixar arquivo do storage: [Errno 2] No such file or directory: 
'/app/media/supbrainnote/audios/...'
```

**Causa:**
- Storage está em modo local (`_use_local = True`)
- R2 não está configurado ou variáveis não foram carregadas
- Arquivo foi salvo antes de configurar R2 (ou R2 não está ativo)

**Correção no Código:**
- ✅ Já corrigido: Storage tem fallback automático
- ✅ Já corrigido: Documentação criada (`R2_STORAGE_SETUP.md`)

**Ação Manual Necessária:**
1. Acessar dashboard do CapRover
2. Apps → `ut-be` → App Configs → Environment Variables
3. Verificar/Adicionar todas as 4 variáveis R2:
   ```bash
   R2_ACCOUNT_ID=27fc4c8ce6a57ee0c7258d885ad2cecd
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=...
   ```
4. Clicar em "Save & Update"
5. Aguardar redeploy
6. Testar upload de novo áudio
7. **Após confirmar funcionamento:** Marcar issue como resolvido

**Nota:** Arquivos antigos (salvos antes de configurar R2) podem não funcionar. Apenas arquivos novos funcionarão corretamente.

**Como Marcar como Resolvido:**
```bash
cd backend
python resolve_glitchtip_issues.py --issue-id 42
```

---

## ✅ Checklist de Ações

### Erros Não Críticos (Podem ser ignorados ou resolvidos)

- [ ] **Issue #5 (401 login):** Decidir se marca como resolvido (opcional)
- [ ] **Issue #8 (404 GET /):** Decidir se marca como resolvido (opcional)

### Erros Críticos (Requerem Ação)

- [ ] **Issue #43 (CSRF):**
  - [ ] Configurar `CSRF_TRUSTED_ORIGINS` no CapRover
  - [ ] Fazer redeploy
  - [ ] Testar login no admin
  - [ ] Confirmar que funciona
  - [ ] Marcar como resolvido: `python resolve_glitchtip_issues.py --issue-id 43`

- [ ] **Issue #42 (Storage R2):**
  - [ ] Configurar todas as 4 variáveis R2 no CapRover
  - [ ] Fazer redeploy
  - [ ] Testar upload de novo áudio
  - [ ] Confirmar que transcrição funciona
  - [ ] Marcar como resolvido: `python resolve_glitchtip_issues.py --issue-id 42`

---

## 🚀 Comandos para Resolver Issues

### Resolver Issue Específico

```bash
cd backend
python resolve_glitchtip_issues.py --issue-id <ID>
```

**Exemplos:**
```bash
# Resolver CSRF
python resolve_glitchtip_issues.py --issue-id 43

# Resolver Storage R2
python resolve_glitchtip_issues.py --issue-id 42

# Resolver 404 (opcional)
python resolve_glitchtip_issues.py --issue-id 8

# Resolver 401 (opcional)
python resolve_glitchtip_issues.py --issue-id 5
```

### Resolver Todos os Issues Não Resolvidos

```bash
cd backend
python resolve_glitchtip_issues.py --all
```

**⚠️ CUIDADO:** Isso marca TODOS os issues não resolvidos como resolvidos. Use apenas se tiver certeza.

### Dry Run (Ver o que seria feito)

```bash
cd backend
python resolve_glitchtip_issues.py --all --dry-run
```

---

## 📝 Notas

1. **Issues #5 e #8** são não críticos e podem ser ignorados ou marcados como resolvidos para limpar o dashboard.

2. **Issues #43 e #42** requerem ação manual no CapRover (configurar variáveis de ambiente) antes de marcar como resolvidos.

3. **Sempre teste** após configurar variáveis antes de marcar como resolvido.

4. **Arquivos antigos** podem não funcionar após configurar R2. Apenas arquivos novos funcionarão.

---

## 🔗 Referências

- [CSRF Troubleshooting](CSRF_TROUBLESHOOTING.md)
- [R2 Storage Setup](R2_STORAGE_SETUP.md)
- [CapRover CLI Correct Commands](CAPROVER_CLI_CORRECT_COMMANDS.md)

