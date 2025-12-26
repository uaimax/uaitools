# Setup do GlitchTip (Self-Hosted)

GlitchTip é uma alternativa open-source ao Sentry, compatível com a API do Sentry. Você pode usar GlitchTip self-hosted como alternativa gratuita ao Sentry SaaS.

## O Que é GlitchTip?

- ✅ **Open-source** - Gratuito e sem limites
- ✅ **Compatível com Sentry** - Usa os mesmos SDKs
- ✅ **Self-hosted** - Controle total sobre os dados
- ✅ **Dashboard completo** - Interface similar ao Sentry

## Opções de Instalação

### Opção 1: Docker Compose (Recomendado)

Adicione ao seu `docker-compose.yml`:

```yaml
services:
  glitchtip:
    image: glitchtip/glitchtip:latest
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/glitchtip
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=your-secret-key-here
      - EMAIL_URL=smtp://user:pass@smtp.example.com:587
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    volumes:
      - glitchtip_data:/app/data

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=glitchtip
      - POSTGRES_USER=glitchtip
      - POSTGRES_PASSWORD=glitchtip
    volumes:
      - glitchtip_db:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - glitchtip_redis:/data

volumes:
  glitchtip_data:
  glitchtip_db:
  glitchtip_redis:
```

### Opção 2: Instalação Manual

Siga a [documentação oficial do GlitchTip](https://glitchtip.com/documentation/install).

## Configuração no Projeto

### 1. Instalar SDK do Sentry (mesmo usado para GlitchTip)

**Backend:**
```bash
pip install sentry-sdk[django]
```

**Frontend:**
```bash
npm install @sentry/react
```

### 2. Obter DSN do GlitchTip

1. Acesse seu GlitchTip (ex: `http://localhost:8000`)
2. Crie um projeto
3. Copie o DSN (formato: `http://xxx@localhost:8000/1`)

### 3. Configurar Variáveis de Ambiente

**Backend `.env`:**
```bash
USE_SENTRY=true
SENTRY_DSN=http://xxx@localhost:8000/1  # DSN do GlitchTip
ENVIRONMENT=production
```

**Frontend `.env`:**
```bash
VITE_SENTRY_DSN=http://xxx@localhost:8000/1  # DSN do GlitchTip
```

### 4. Descomentar SDK no requirements.txt

**Backend:**
```txt
sentry-sdk[django]>=2.0,<3.0
```

## Verificação

Após configurar:

1. **Backend**: Erros não tratados serão enviados para GlitchTip
2. **Frontend**: Erros JavaScript serão enviados para GlitchTip
3. **Dashboard**: Acesse seu GlitchTip para ver os logs

## Comparação: Sentry vs GlitchTip

| Aspecto | Sentry SaaS | GlitchTip Self-Hosted |
|----------|-------------|----------------------|
| **Custo** | $26/mês (Developer) | Gratuito |
| **Setup** | 5 minutos | 15-30 minutos |
| **Manutenção** | Sentry gerencia | Você gerencia |
| **Limites** | 5k eventos/mês (free) | Ilimitado |
| **Features** | Todas | Maioria (algumas avançadas podem faltar) |
| **Dados** | Na nuvem do Sentry | Seus servidores |

## Troubleshooting

### Erro: "Failed to send to Sentry"

- Verifique se o GlitchTip está rodando
- Verifique se o DSN está correto
- Verifique conectividade de rede (CORS se frontend separado)

### Logs não aparecem no GlitchTip

- Verifique se `USE_SENTRY=true` está configurado
- Verifique logs do backend para erros de conexão
- Verifique se o projeto foi criado no GlitchTip

### CORS no Frontend

Se frontend e GlitchTip estiverem em domínios diferentes:

```python
# backend/config/settings/base.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Frontend
    "http://localhost:8000",  # GlitchTip (se necessário)
]
```

## Referências

- [Documentação do GlitchTip](https://glitchtip.com/documentation)
- [GitHub do GlitchTip](https://github.com/glitchtip/glitchtip)
- [Docker Hub - GlitchTip](https://hub.docker.com/r/glitchtip/glitchtip)



