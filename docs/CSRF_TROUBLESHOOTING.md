# Troubleshooting CSRF no Django Admin

## 🔴 Problema: "Origin checking failed" no Django Admin

### Erro Típico
```
Proibido (403)
Verificação CSRF falhou. Pedido cancelado.

Origin checking failed - https://ut-be.app.webmaxdigital.com does not match any trusted origins.
```

## ✅ Solução

### 1. Verificar Variáveis de Ambiente

No CapRover, configure as seguintes variáveis de ambiente:

```bash
# Obrigatório
ALLOWED_HOSTS=ut-be.app.webmaxdigital.com
# OU (menos seguro, mas funciona)
ALLOWED_HOSTS=*

# Obrigatório para Django Admin
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com
```

**Importante:**
- `CSRF_TRUSTED_ORIGINS` deve incluir o protocolo (`https://`)
- Não deve ter espaços extras
- Se tiver múltiplas origens, separar por vírgula: `https://site1.com,https://site2.com`

### 2. Verificar Formato da Variável

**✅ Correto:**
```bash
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com
```

**❌ Errado:**
```bash
# Com espaços
CSRF_TRUSTED_ORIGINS= https://ut-be.app.webmaxdigital.com

# Sem protocolo
CSRF_TRUSTED_ORIGINS=ut-be.app.webmaxdigital.com

# Com barra no final
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com/
```

### 3. Redeploy Após Configurar

**IMPORTANTE:** Após configurar as variáveis de ambiente, você **DEVE fazer redeploy** do app no CapRover para que as novas variáveis sejam carregadas.

### 4. Verificar Logs

Após o redeploy, verifique os logs para confirmar que `CSRF_TRUSTED_ORIGINS` foi carregado:

```bash
caprover logs -a ut-be --tail 50 | grep CSRF
```

Se `DEBUG=True`, você verá:
```
[CSRF] CSRF_TRUSTED_ORIGINS configurado: ['https://ut-be.app.webmaxdigital.com']
```

### 5. Verificar no Django Shell

Você pode verificar diretamente no Django:

```bash
caprover exec -a ut-be "python manage.py shell"
```

No shell Python:
```python
from django.conf import settings
print("CSRF_TRUSTED_ORIGINS:", settings.CSRF_TRUSTED_ORIGINS)
print("ALLOWED_HOSTS:", settings.ALLOWED_HOSTS)
```

## 🔍 Troubleshooting Avançado

### Problema: Variável não está sendo lida

**Causa:** Variável não foi carregada após redeploy.

**Solução:**
1. Verifique se a variável está configurada no CapRover
2. Faça redeploy do app
3. Verifique logs para confirmar

### Problema: Origem diferente do esperado

**Causa:** O browser pode estar enviando de uma origem diferente (ex: `http://` vs `https://`).

**Solução:**
Adicione ambas as origens:
```bash
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com,http://ut-be.app.webmaxdigital.com
```

**Nota:** Em produção, geralmente só precisa de `https://`.

### Problema: Proxy Reverso (CapRover)

**Causa:** CapRover pode estar adicionando headers que confundem o Django.

**Solução:**
Verifique se o CapRover está configurado corretamente para passar headers de origem.

## 📝 Checklist

- [ ] `ALLOWED_HOSTS` configurado (sem espaços)
- [ ] `CSRF_TRUSTED_ORIGINS` configurado com protocolo (`https://`)
- [ ] Sem espaços extras na variável
- [ ] Redeploy realizado após configurar
- [ ] Logs verificados (se `DEBUG=True`)
- [ ] Django shell verificado (opcional)

## 🔍 Diagnóstico Rápido

Execute o script de diagnóstico no container:

```bash
caprover exec -a ut-be "python check_csrf_config.py"
```

Isso mostrará:
- Se a variável está sendo lida
- Se está no formato correto
- Se a origem esperada está na lista
- Problemas encontrados

## 🚨 Se Ainda Não Funcionar

### 1. Verificar Logs Após Redeploy

Após fazer redeploy, verifique os logs para ver o que foi carregado:

```bash
caprover logs -a ut-be --tail 100 | grep CSRF
```

Você deve ver algo como:
```
[CSRF] CSRF_TRUSTED_ORIGINS_ENV (raw): 'https://ut-be.app.webmaxdigital.com'
[CSRF] CSRF_TRUSTED_ORIGINS configurado da variável: ['https://ut-be.app.webmaxdigital.com']
[CSRF] ✅ CSRF_TRUSTED_ORIGINS final: ['https://ut-be.app.webmaxdigital.com']
```

### 2. Verificar se Variável Está no CapRover

No dashboard do CapRover:
1. Vá em "App Configs" → "Environment Variables"
2. Procure por `CSRF_TRUSTED_ORIGINS`
3. Verifique se está exatamente: `https://ut-be.app.webmaxdigital.com` (sem espaços)

### 3. Verificar Proxy Reverso (CapRover)

CapRover pode estar modificando headers. Verifique:
- Se o CapRover está configurado para passar headers de origem
- Se há algum proxy adicional na frente

### 4. Verificar Cookies do Browser

- Limpar cookies do site
- Tentar em modo anônimo/privado
- Verificar se cookies estão sendo bloqueados

### 5. Solução Temporária (NÃO RECOMENDADO)

Se nada funcionar, você pode temporariamente desabilitar verificação de origem apenas para o admin (NÃO RECOMENDADO EM PRODUÇÃO):

```python
# Em prod.py (temporário, apenas para debug)
# Adicionar após a configuração de CSRF_TRUSTED_ORIGINS
if not CSRF_TRUSTED_ORIGINS:
    # Fallback perigoso - apenas para debug
    CSRF_TRUSTED_ORIGINS = ["https://ut-be.app.webmaxdigital.com"]
```

**⚠️ ATENÇÃO:** Isso reduz a segurança. Use apenas temporariamente para debug.

## 📚 Referências

- [Django CSRF Documentation](https://docs.djangoproject.com/en/stable/ref/csrf/)
- [CSRF_TRUSTED_ORIGINS](https://docs.djangoproject.com/en/stable/ref/settings/#csrf-trusted-origins)

