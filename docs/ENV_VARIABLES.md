# Variáveis de Ambiente - Referência Completa

## 📋 Configuração Básica

Crie um arquivo `.env` na raiz do projeto `backend/` com as seguintes variáveis:

```bash
# Django Settings
SECRET_KEY=django-insecure-change-me-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,*

# Database (Produção)
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## 🚀 Performance e Cache

### Cache (Redis)
```bash
REDIS_CACHE_URL=redis://localhost:6379/1
CACHE_DEFAULT_TIMEOUT=300  # 5 minutos
```

### Rate Limiting
```bash
API_THROTTLE_ANON=100/hour      # Usuários não autenticados
API_THROTTLE_USER=1000/hour     # Usuários autenticados
```

### Logging
```bash
LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=text         # 'text' (dev) ou 'json' (prod)
```

### Logging Híbrido (Sentry/GlitchTip ou Banco)
```bash
# Backend
USE_SENTRY=false        # true para usar Sentry/GlitchTip, false para usar banco
SENTRY_DSN=             # DSN do Sentry ou GlitchTip (se USE_SENTRY=true)
LOG_RETENTION_DAYS=7    # Dias de retenção no banco (padrão: 7)
ENVIRONMENT=production   # Ambiente (development, staging, production)

# Frontend
VITE_SENTRY_DSN=        # DSN do Sentry ou GlitchTip (opcional, se configurado usa Sentry/GlitchTip)
```

**Nota**:
- Se `USE_SENTRY=true` (backend) ou `VITE_SENTRY_DSN` (frontend) estiver configurado,
  os logs vão para Sentry ou GlitchTip (compatível com API do Sentry).
- Caso contrário, são salvos no banco de dados.
- **GlitchTip**: Alternativa open-source ao Sentry, compatível com os mesmos SDKs.
  Use o DSN do GlitchTip no lugar do DSN do Sentry.

## 🔧 API Configuration

```bash
API_VERSION=v1
API_PREFIX=/api
ADMIN_URL_PREFIX=manage
```

## 🌐 CORS e Frontend

```bash
CORS_ENABLED=True
FRONTEND_URL=  # Vazio quando junto, URL absoluta quando separado
```

## 🔐 LGPD Compliance

```bash
AUDIT_LOG_RETENTION_DAYS=1095  # 3 anos (mínimo: 365)
```

## ⚙️ Celery (Jobs Assíncronos)

```bash
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## 📝 Branding

```bash
PROJECT_NAME=SaaS Bootstrap
SITE_TITLE=SaaS Bootstrap Admin
SITE_HEADER=SaaS Bootstrap
API_TITLE=SaaS Bootstrap API
```

## 🔗 Social Auth (Opcional)

```bash
# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Microsoft
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common  # common, organizations, consumers
```

## 📚 Documentação

- [Cache e Performance](CACHE_AND_PERFORMANCE.md) - Guia completo de cache, throttling e logging
- [Arquitetura](ARCHITECTURE.md) - Decisões técnicas e estrutura


