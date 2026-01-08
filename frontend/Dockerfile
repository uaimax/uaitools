# ============================================================================
# Dockerfile para Frontend Vite + React
# ============================================================================
# Multi-stage build otimizado para produção
# - Stage 1: Builder (instala deps e faz build)
# - Stage 2: Production (nginx serve arquivos estáticos)

# ============================================================================
# STAGE 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

# Metadados
LABEL maintainer="uaitools"
LABEL description="Frontend Vite + React build stage"

# Definir diretório de trabalho
WORKDIR /app

# Argumentos de build (variáveis de ambiente do Vite)
# Essas variáveis são embutidas no código durante o build
ARG VITE_API_URL
ARG VITE_APP_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT=production

# Variáveis de ambiente para o build
# IMPORTANTE: Vite só embute variáveis que começam com VITE_
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_URL=${VITE_APP_URL}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV VITE_SENTRY_ENVIRONMENT=${VITE_SENTRY_ENVIRONMENT}

# Instalar dependências
# Usar npm ci para instalação determinística (mais rápido e confiável)
# Copiar apenas package*.json primeiro para aproveitar cache do Docker
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies necessárias para build)
# npm ci instala tudo por padrão, não precisa manipular NODE_ENV
RUN npm ci --prefer-offline --no-audit

# Copiar código fonte
# Copiar tudo exceto node_modules (que já está instalado)
COPY . .

# Verificações de debug (após copiar código)
RUN echo "=== Verificando estrutura de arquivos ===" && \
    (test -d /app/src/lib && ls -la /app/src/lib/ || echo "⚠️ Diretório /app/src/lib/ não existe ainda") && \
    echo "=== Verificando se console-logger.ts existe ===" && \
    (test -f /app/src/lib/console-logger.ts && echo "✓ console-logger.ts encontrado" || echo "✗ console-logger.ts NÃO encontrado") && \
    echo "=== Verificando se error-logger.ts existe ===" && \
    (test -f /app/src/lib/error-logger.ts && echo "✓ error-logger.ts encontrado" || echo "✗ error-logger.ts NÃO encontrado") && \
    echo "=== Verificando node_modules/vite-tsconfig-paths ===" && \
    (test -d /app/node_modules/vite-tsconfig-paths && echo "✓ vite-tsconfig-paths instalado" || echo "✗ vite-tsconfig-paths NÃO instalado") && \
    echo "=== Verificando vite.config.ts ===" && \
    (cat /app/vite.config.ts | grep -q "vite-tsconfig-paths" && echo "✓ vite.config.ts tem vite-tsconfig-paths" || echo "✗ vite.config.ts NÃO tem vite-tsconfig-paths")

# Build da aplicação
# Vite automaticamente:
# - Otimiza para produção
# - Resolve path aliases através do vite.config.ts
# - Embuti variáveis VITE_* no código JavaScript
RUN npm run build

# Verificar se build foi bem-sucedido
RUN test -d /app/dist || (echo "ERROR: Build failed - dist directory not found" && exit 1)

# ============================================================================
# STAGE 2: Production (Nginx)
# ============================================================================
FROM nginx:alpine

# Metadados
LABEL maintainer="uaitools"
LABEL description="Frontend production server (nginx)"

# Copiar arquivos buildados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Verificar se arquivos foram copiados corretamente
RUN echo "=== Verificando arquivos copiados ===" && \
    ls -la /usr/share/nginx/html/ && \
    echo "=== Verificando se index.html existe ===" && \
    test -f /usr/share/nginx/html/index.html && echo "✓ index.html encontrado" || echo "✗ index.html NÃO encontrado" && \
    echo "=== Conteúdo de index.html (primeiras 10 linhas) ===" && \
    head -10 /usr/share/nginx/html/index.html || echo "✗ Erro ao ler index.html"

# Criar configuração do Nginx para SPA
# - Suporte a roteamento client-side (SPA)
# - Compressão gzip
# - Cache para assets estáticos
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Compressão gzip \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript application/xml; \
    \
    # SPA routing - redirecionar todas as rotas para index.html \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache para assets estáticos (1 ano) \
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Não cachear index.html (sempre buscar versão nova) \
    location = /index.html { \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        add_header Pragma "no-cache"; \
        add_header Expires "0"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Verificar configuração do nginx
RUN echo "=== Verificando configuração do nginx ===" && \
    cat /etc/nginx/conf.d/default.conf && \
    echo "=== Testando sintaxe do nginx ===" && \
    nginx -t || echo "✗ Erro na configuração do nginx"

# Expor porta
EXPOSE 80

# Healthcheck (usar wget se disponível, caso contrário usar curl)
# nginx:alpine não tem wget por padrão, então vamos instalar ou usar curl
RUN apk add --no-cache wget || apk add --no-cache curl

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || (curl -f http://localhost/ || exit 1)

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
