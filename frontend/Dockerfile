FROM node:20-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Argumentos de build para variáveis de ambiente do Vite
# Essas variáveis são embutidas no build em tempo de compilação
ARG VITE_API_URL
ARG VITE_APP_URL
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT=production

# Definir variáveis de ambiente para o build (exceto NODE_ENV)
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_URL=${VITE_APP_URL}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV VITE_SENTRY_ENVIRONMENT=${VITE_SENTRY_ENVIRONMENT}

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies necessárias para o build)
# NODE_ENV não deve ser production durante npm ci para garantir instalação de devDependencies
RUN npm ci --include=dev

# Agora definir NODE_ENV=production para o build
ENV NODE_ENV=production

# Copiar código fonte
COPY . .

# Build da aplicação em modo produção
# Vite automaticamente:
# - Otimiza para produção quando NODE_ENV=production
# - Carrega variáveis de .env.production se existir (ou ARGs passados como ENV)
# - Embuti variáveis VITE_* no código JavaScript
RUN npm run build

# Estágio de produção - Nginx
FROM nginx:alpine

# Copiar arquivos buildados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx (opcional)
# Se você tiver um nginx.conf customizado, descomente a linha abaixo
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Configuração padrão do Nginx para SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json; \
    \
    # SPA routing - redirecionar todas as rotas para index.html \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache para assets estáticos \
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

