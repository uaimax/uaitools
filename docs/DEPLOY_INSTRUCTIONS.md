# Instruções de Deploy - WhiteNoise e Sentry

## ✅ Mudanças Aplicadas

### 1. WhiteNoise (Arquivos Estáticos)
- ✅ Adicionado `whitenoise>=6.6,<7.0` ao `requirements.txt`
- ✅ Adicionado `WhiteNoiseMiddleware` ao `MIDDLEWARE`
- ✅ Configurado `STATICFILES_STORAGE` para compressão

### 2. Sentry/GlitchTip (Logging de Erros)
- ✅ Endpoint de teste: `/api/v1/test-sentry/`
- ✅ Logs de inicialização no `wsgi.py`
- ✅ Captura de erros durante boot do Django

## 🚀 Como Fazer o Deploy

### Opção 1: Via Interface Web do CapRover (Recomendado)

1. **Acesse o dashboard do CapRover:**
   - Escolha o servidor apropriado (captain-01, captain-02, ou captain-03)

2. **No app "ut-be" (backend):**
   - Vá em **App Configs** → **Deployment**
   - Clique em **Save & Update** para forçar novo build
   - Ou clique em **Trigger Build** se disponível

3. **Aguarde o build completar:**
   - O build irá:
     - Instalar `whitenoise` (novo)
     - Instalar `psycopg2-binary` (já estava)
     - Instalar `sentry-sdk[django]` (já estava)
     - Executar `collectstatic` (coletar arquivos estáticos)
     - Iniciar o container com Gunicorn

4. **Verifique os logs:**
   - Procure por `[Sentry] ✅ Sentry/GlitchTip inicializado`
   - Verifique se não há erros de importação

### Opção 2: Via CLI do CapRover

```bash
# Navegar até o diretório do projeto
cd /home/uaimax/projects/uaitools

# Fazer deploy do backend
caprover deploy -a ut-be

# Quando pedir o servidor, selecione o apropriado:
# - captain-01 (https://captain.app.webmaxdigital.com)
# - captain-02 (https://captain.pdc.ngtools.com.br)
# - captain-03 (https://captain.a.webmaxdigital.com)
```

## ✅ Verificações Pós-Deploy

### 1. Verificar CSS do Admin
- Acesse o admin Django em produção
- Verifique se o CSS está aparecendo corretamente
- Se não aparecer, verifique os logs do CapRover

### 2. Testar Sentry/GlitchTip
- Acesse: `https://seu-dominio.com/api/v1/test-sentry/`
- Verifique a resposta JSON:
  ```json
  {
    "sentry_configured": true,
    "sentry_initialized": true,
    "test_message_sent": true,
    "test_exception_sent": true
  }
  ```
- Verifique o GlitchTip para ver se os testes apareceram

### 3. Verificar Logs do CapRover
- Procure por mensagens do Sentry:
  - `[Sentry] ✅ Sentry/GlitchTip inicializado`
  - Ou avisos se não estiver configurado

## 🔧 Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas no CapRover:

```bash
# Backend
ENVIRONMENT=production
USE_SENTRY=true
SENTRY_DSN=https://xxx@seu-glitchtip.com/1
ALLOWED_HOSTS=seu-dominio.com
DATABASE_URL=postgresql://...
SECRET_KEY=...
```

## 📝 O Que Foi Commitado

- `backend/requirements.txt` - Adicionado whitenoise
- `backend/config/settings/base.py` - Configurado WhiteNoise
- `backend/api/v1/views.py` - Endpoint de teste Sentry
- `backend/api/v1/urls.py` - Rota de teste Sentry
- `backend/config/wsgi.py` - Logs de inicialização Sentry

**Commit:** `b6f72e5` - "fix: adiciona WhiteNoise para servir arquivos estáticos em produção"

## 🐛 Troubleshooting

### CSS do Admin não aparece
- Verifique se `collectstatic` foi executado durante o build
- Verifique se `WhiteNoiseMiddleware` está no `MIDDLEWARE`
- Verifique os logs do CapRover para erros

### Sentry não está enviando erros
- Verifique se `USE_SENTRY=true` está configurado
- Verifique se `SENTRY_DSN` está correto
- Use o endpoint `/api/v1/test-sentry/` para diagnosticar
- Verifique os logs do CapRover para mensagens do Sentry



