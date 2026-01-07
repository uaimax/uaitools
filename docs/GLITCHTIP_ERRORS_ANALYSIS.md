# Análise de Erros no GlitchTip

**Data:** 2025-12-28
**Status:** 🔴 3 erros ativos

---

## 📋 Resumo dos Erros

### 1. 🔴 CSRF Error (Issue #43) - **CRÍTICO**

**Erro:**
```
HTTP Error 403: POST /painel/login/
Origin checking failed - https://ut-be.app.webmaxdigital.com does not match any trusted origins.
```

**Detalhes:**
- **Frequência:** 4 ocorrências
- **Última ocorrência:** 2025-12-28 02:10:30
- **Origem enviada:** `https://ut-be.app.webmaxdigital.com`
- **Header Origin:** `Origin: https://ut-be.app.webmaxdigital.com`

**Causa:**
- `CSRF_TRUSTED_ORIGINS` não está sendo carregado corretamente
- Variável de ambiente não foi lida após redeploy
- Ou formato incorreto da variável

**Solução:**
1. Verificar se `CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com` está configurado no CapRover
2. Fazer redeploy do backend
3. Executar script de diagnóstico: `caprover exec -a ut-be "python check_csrf_config.py"`
4. Verificar logs: `caprover logs -a ut-be --tail 100 | grep CSRF`

---

### 2. 🔴 Storage Error (Issue #42) - **CRÍTICO**

**Erro:**
```
ValueError: Erro ao baixar arquivo do storage: [Errno 2] No such file or directory:
'/app/media/supbrainnote/audios/082d9b0c-20cf-45cf-8bc8-4e5970c84e93/2025/12/28/31bd06e4-5d09-4482-9_zKWv1do.m4a'
```

**Detalhes:**
- **Frequência:** 1 ocorrência
- **Última ocorrência:** 2025-12-28 01:38:43
- **Task:** `apps.supbrainnote.tasks.transcribe_audio`
- **Note ID:** `e26e17b9-854c-4ee9-8c7d-2a1d8ce3a272`

**Causa:**
- Storage está em modo local (`_use_local = True`)
- Tentando acessar arquivo do sistema de arquivos local
- Arquivo não existe porque foi salvo no R2 (ou deveria ter sido)
- R2 não está configurado ou variáveis não foram carregadas

**Stack Trace:**
```
apps/supbrainnote/storage.py:71 - _get_local_storage()._open()
apps/supbrainnote/tasks.py:175 - note.audio_file.open('rb')
```

**Solução:**
1. Verificar se todas as variáveis R2 estão configuradas no CapRover:
   ```bash
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=...
   ```
2. Fazer redeploy do backend
3. Verificar logs para confirmar que R2 está sendo usado
4. Arquivos novos funcionarão (serão salvos no R2)
5. Arquivos antigos podem precisar ser re-uploaded

---

### 3. ⚠️ 404 Error (Issue #8) - **NÃO CRÍTICO**

**Erro:**
```
HTTP Error 404: GET /
```

**Detalhes:**
- **Frequência:** 3 ocorrências
- **Última ocorrência:** 2025-12-28 02:10:32
- **User-Agent:** `python-requests/2.32.5` (bot ou health check)

**Causa:**
- Requisições para `/` (rota raiz não existe)
- Provavelmente bot ou health check
- Não é um erro crítico

**Solução:**
- Pode ser ignorado (não crítico)
- Se quiser, pode adicionar rota raiz que redireciona para `/api/` ou admin

---

## 🔍 Análise dos Headers (Erro CSRF)

Do evento mais recente de CSRF, vejo:

**Headers enviados:**
```
Origin: https://ut-be.app.webmaxdigital.com
Referer: https://ut-be.app.webmaxdigital.com/painel/login/?next=/painel/
Host: ut-be.app.webmaxdigital.com
X-Forwarded-Proto: https
```

**Problema identificado:**
- A origem `https://ut-be.app.webmaxdigital.com` está sendo enviada corretamente
- Mas o Django não está reconhecendo como confiável
- Isso indica que `CSRF_TRUSTED_ORIGINS` está vazio ou não contém essa origem

---

## ✅ Ações Recomendadas

### Prioridade 1: Corrigir CSRF

1. **Verificar variável no CapRover:**
   - Dashboard → App `ut-be` → Environment Variables
   - Verificar se `CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com` existe
   - Sem espaços, sem barra no final

2. **Fazer redeploy:**
   - Variáveis só são carregadas quando container é recriado

3. **Executar diagnóstico:**
   ```bash
   caprover exec -a ut-be "python check_csrf_config.py"
   ```

4. **Verificar logs:**
   ```bash
   caprover logs -a ut-be --tail 100 | grep CSRF
   ```

### Prioridade 2: Corrigir Storage R2

1. **Verificar variáveis R2 no CapRover:**
   ```bash
   R2_ACCOUNT_ID=27fc4c8ce6a57ee0c7258d885ad2cecd
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=...
   ```

2. **Fazer redeploy:**
   - Para carregar novas variáveis

3. **Testar com novo upload:**
   - Arquivos novos serão salvos no R2
   - Transcrições funcionarão corretamente

### Prioridade 3: Ignorar 404

- Não é crítico
- Pode ser bot ou health check
- Não afeta funcionalidade

---

## 📊 Status Atual

| Erro | Severidade | Status | Ação |
|------|-----------|--------|------|
| CSRF | 🔴 Crítico | Não resolvido | Verificar variável + redeploy |
| Storage R2 | 🔴 Crítico | Não resolvido | Configurar R2 + redeploy |
| 404 GET / | ⚠️ Baixo | Pode ignorar | Nenhuma |

---

## 🔗 Referências

- [CSRF Troubleshooting](CSRF_TROUBLESHOOTING.md)
- [R2 Storage Setup](R2_STORAGE_SETUP.md)
- [CapRover CLI Setup](CAPROVER_CLI_SETUP.md)


