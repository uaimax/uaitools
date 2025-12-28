# Dockerfile - Frontend (Produção)

Este Dockerfile é otimizado para produção e será usado pelo CapRover através do `captain-definition`.

## Características

- **Build**: Multi-stage (Node.js builder + Nginx)
- **Base Builder**: node:20-alpine
- **Base Runtime**: nginx:alpine
- **Porta**: 80

## Variáveis de Ambiente para Build

As variáveis `VITE_*` são **embutidas no build** em tempo de compilação. Elas devem ser passadas como `--build-arg` durante o build do Docker.

### Variáveis Disponíveis

- `VITE_API_URL` - URL da API backend (ex: `https://api.exemplo.com/api/v1`)
- `VITE_APP_URL` - URL base da aplicação (ex: `https://app.exemplo.com`)
- `VITE_SENTRY_DSN` - DSN do Sentry/GlitchTip para monitoramento
- `VITE_SENTRY_ENVIRONMENT` - Ambiente do Sentry (padrão: `production`)

### Como Passar Variáveis no Build

#### Via CapRover (captain-definition)
O CapRover não suporta `--build-arg` diretamente no `captain-definition`. Você tem duas opções:

**Opção 1: Arquivo .env durante o build**
Crie um arquivo `.env.production` no diretório `frontend/` com as variáveis:
```env
VITE_API_URL=https://api.exemplo.com/api/v1
VITE_APP_URL=https://app.exemplo.com
VITE_SENTRY_DSN=https://xxx@app.glitchtip.com/14243
VITE_SENTRY_ENVIRONMENT=production
```

O Dockerfile pode ser modificado para ler este arquivo durante o build.

**Opção 2: Build manual com --build-arg**
Se você fizer build manual:
```bash
docker build \
  --build-arg VITE_API_URL=https://api.exemplo.com/api/v1 \
  --build-arg VITE_APP_URL=https://app.exemplo.com \
  --build-arg VITE_SENTRY_DSN=https://xxx@app.glitchtip.com/14243 \
  -t frontend:latest \
  .
```

## Build Process

1. **Stage 1 (Builder)**:
   - Instala dependências Node.js
   - Copia código fonte
   - Executa `npm run build` (otimizado para produção)

2. **Stage 2 (Runtime)**:
   - Copia apenas arquivos buildados (`dist/`)
   - Configura Nginx para SPA
   - Serve arquivos estáticos

## Nginx Configuration

O Nginx é configurado automaticamente com:
- Gzip compression
- SPA routing (todas as rotas redirecionam para `index.html`)
- Cache de 1 ano para assets estáticos

## Notas Importantes

⚠️ **Variáveis de ambiente em runtime não funcionam!**

As variáveis `VITE_*` são **embutidas no código JavaScript durante o build**. Se você mudar variáveis de ambiente após o build, elas **não serão refletidas** na aplicação.

Para mudar variáveis:
1. Refaça o build com as novas variáveis
2. Ou use um arquivo de configuração runtime (requer implementação customizada)

