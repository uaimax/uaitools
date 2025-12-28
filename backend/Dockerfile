# =============================================================================
# DOCKERFILE IDEAL PARA DJANGO + CAPROVER
# =============================================================================
# Este Dockerfile segue as melhores práticas para deploy no CapRover:
# - Variáveis de ambiente são lidas apenas em RUNTIME (não no build)
# - collectstatic e migrations são executados pelo script de entrada
# - Build leve e rápido (usa cache eficientemente)
# =============================================================================

FROM python:3.12-slim

# -----------------------------------------------------------------------------
# Variáveis de ambiente básicas (não dependem de config externa)
# -----------------------------------------------------------------------------
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    # PIP configs para instalação mais rápida
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# -----------------------------------------------------------------------------
# Instalar dependências do sistema
# -----------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Para compilar pacotes Python com extensões C
    gcc \
    # Cliente PostgreSQL (psycopg2)
    libpq-dev \
    postgresql-client \
    # Supervisor para gerenciar múltiplos processos (Gunicorn + Celery)
    supervisor \
    # Limpar cache do apt para reduzir tamanho da imagem
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Criar diretório de trabalho
# -----------------------------------------------------------------------------
WORKDIR /app

# -----------------------------------------------------------------------------
# Instalar dependências Python (antes de copiar código para usar cache)
# -----------------------------------------------------------------------------
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install gunicorn

# -----------------------------------------------------------------------------
# Copiar código da aplicação
# -----------------------------------------------------------------------------
COPY . .

# -----------------------------------------------------------------------------
# NÃO executar collectstatic aqui!
# As variáveis de ambiente (ALLOWED_HOSTS, DATABASE_URL, etc.) só estão
# disponíveis em RUNTIME, não durante o build.
# O collectstatic será executado pelo entrypoint.sh
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Expor porta (CapRover usa porta 80 por padrão)
# -----------------------------------------------------------------------------
EXPOSE 80

# -----------------------------------------------------------------------------
# Criar script de entrada (entrypoint)
# Este script é executado em RUNTIME quando as variáveis de ambiente estão disponíveis
# -----------------------------------------------------------------------------
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "🚀 Iniciando aplicação Django..."\n\
echo "📍 Ambiente: ${ENVIRONMENT:-production}"\n\
\n\
# Coletar arquivos estáticos\n\
echo "📦 Coletando arquivos estáticos..."\n\
python manage.py collectstatic --noinput\n\
echo "✅ Arquivos estáticos coletados"\n\
\n\
# Aplicar migrations\n\
echo "📦 Aplicando migrations..."\n\
python manage.py migrate --noinput\n\
echo "✅ Migrations aplicadas"\n\
\n\
# Verificar modo de execução do Celery\n\
CELERY_MODE=${CELERY_MODE:-same}\n\
\n\
if [ "$CELERY_MODE" = "separate" ]; then\n\
    # Modo separado: apenas Gunicorn (quando Celery roda em container separado)\n\
    echo "🚀 Modo separado: Iniciando apenas Gunicorn..."\n\
    exec gunicorn config.wsgi:application \\\n\
        --bind 0.0.0.0:80 \\\n\
        --workers ${GUNICORN_WORKERS:-3} \\\n\
        --timeout ${GUNICORN_TIMEOUT:-120} \\\n\
        --access-logfile - \\\n\
        --error-logfile -\n\
else\n\
    # Modo mesmo container: Supervisor gerencia Gunicorn + Celery\n\
    echo "🚀 Modo mesmo container: Iniciando Gunicorn + Celery..."\n\
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n\
fi' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# -----------------------------------------------------------------------------
# Configuração do Supervisor (Gunicorn + Celery no mesmo container)
# -----------------------------------------------------------------------------
RUN mkdir -p /etc/supervisor/conf.d && \
    echo '[supervisord]\n\
nodaemon=true\n\
\n\
[program:gunicorn]\n\
command=gunicorn config.wsgi:application --bind 0.0.0.0:80 --workers 3 --timeout 120 --access-logfile - --error-logfile -\n\
directory=/app\n\
autostart=true\n\
autorestart=true\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
\n\
[program:celery]\n\
command=celery -A config worker -l info\n\
directory=/app\n\
autostart=true\n\
autorestart=true\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0' > /etc/supervisor/conf.d/supervisord.conf

# -----------------------------------------------------------------------------
# Comando de entrada
# -----------------------------------------------------------------------------
CMD ["/app/entrypoint.sh"]
