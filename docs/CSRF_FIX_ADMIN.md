# 🔧 Correção de CSRF no Django Admin

## Problema

Erro ao fazer login no Django Admin:
```
Proibido (403)
Verificação CSRF falhou. Pedido cancelado.

Origin checking failed - https://ut-be.app.webmaxdigital.com does not match any trusted origins.
```

## ✅ Solução Passo a Passo

### 1. Verificar Formato da Variável de Ambiente

No CapRover, a variável `CSRF_TRUSTED_ORIGINS` deve estar configurada **exatamente** assim:

**✅ CORRETO:**
```
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com
```

**❌ ERRADO (não funciona):**
```
# Com espaços
CSRF_TRUSTED_ORIGINS= https://ut-be.app.webmaxdigital.com

# Com trailing slash
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com/

# Com espaços entre vírgulas (múltiplas origens)
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com, https://localhost
```

**✅ CORRETO (múltiplas origens):**
```
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com,https://localhost
```

### 2. Configurar Variáveis no CapRover

1. Acesse o CapRover
2. Vá em **App Configs** → **Environment Variables**
3. Configure:
   ```
   ALLOWED_HOSTS=*
   CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com
   ```
4. **IMPORTANTE**: Clique em **Save & Update** e aguarde o redeploy

### 3. Verificar se Foi Aplicado

Após o redeploy, execute no container:

```bash
# Via CapRover CLI
caprover exec -a ut-be "python diagnose_csrf.py"
```

Ou via shell do Django:

```bash
caprover exec -a ut-be "python manage.py shell"
```

No shell Python:
```python
from django.conf import settings
print("CSRF_TRUSTED_ORIGINS:", settings.CSRF_TRUSTED_ORIGINS)
print("ALLOWED_HOSTS:", settings.ALLOWED_HOSTS)
```

### 4. Verificar Logs

Verifique os logs do container para confirmar que a configuração foi carregada:

```bash
caprover logs -a ut-be --tail 100 | grep CSRF
```

Você deve ver algo como:
```
[CSRF] CSRF_TRUSTED_ORIGINS_ENV (raw): 'https://ut-be.app.webmaxdigital.com'
[CSRF] CSRF_TRUSTED_ORIGINS configurado da variável: ['https://ut-be.app.webmaxdigital.com']
[CSRF] ✅ CSRF_TRUSTED_ORIGINS final: ['https://ut-be.app.webmaxdigital.com']
```

## 🔍 Troubleshooting

### Problema: Variável não está sendo lida

**Sintomas:**
- Logs mostram `CSRF_TRUSTED_ORIGINS_ENV (raw): ''`
- `CSRF_TRUSTED_ORIGINS` está vazio ou derivado de `ALLOWED_HOSTS`

**Solução:**
1. Verifique se a variável está configurada no CapRover
2. **Faça redeploy** após configurar (muito importante!)
3. Verifique se não há espaços extras no nome da variável

### Problema: Origem não está na lista

**Sintomas:**
- Logs mostram que `CSRF_TRUSTED_ORIGINS` tem valores, mas a origem esperada não está

**Solução:**
1. Verifique se não há trailing slash (`/`) na origem
2. Verifique se não há espaços extras
3. Use o script de diagnóstico: `python diagnose_csrf.py`

### Problema: Funciona em dev mas não em prod

**Causa comum:**
- Em dev, `CSRF_COOKIE_SECURE=False`
- Em prod, `CSRF_COOKIE_SECURE=True` (requer HTTPS)

**Solução:**
- Certifique-se de que está acessando via HTTPS em produção
- Verifique se o certificado SSL está válido

## 📝 Notas Importantes

1. **Sempre faça redeploy** após alterar variáveis de ambiente
2. **Sem espaços extras** na variável `CSRF_TRUSTED_ORIGINS`
3. **Sem trailing slash** nas origens (Django é sensível a isso)
4. **Use HTTPS** em produção (CSRF_COOKIE_SECURE=True requer HTTPS)

## 🛠️ Melhorias Aplicadas

O código foi melhorado para:
- Normalizar origens (remover trailing slashes)
- Adicionar logs detalhados para debug
- Criar script de diagnóstico (`diagnose_csrf.py`)

## 📚 Referências

- [Django CSRF - Trusted Origins](https://docs.djangoproject.com/en/5.0/ref/settings/#csrf-trusted-origins)
- `backend/config/settings/prod.py` - Configuração de produção
- `backend/diagnose_csrf.py` - Script de diagnóstico

