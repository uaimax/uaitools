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
# Aplicar migrations (com tratamento de erro de histórico inconsistente)\n\
echo "📦 Aplicando migrations..."\n\
set +e  # Desabilitar exit on error temporariamente\n\
MIGRATE_OUTPUT=$(python manage.py migrate --noinput 2>&1)\n\
MIGRATE_EXIT=$?\n\
set -e  # Reabilitar exit on error\n\
\n\
if [ $MIGRATE_EXIT -ne 0 ]; then\n\
    # Se houver erro de histórico inconsistente, corrigir automaticamente\n\
    if echo "$MIGRATE_OUTPUT" | grep -q "InconsistentMigrationHistory"; then\n\
        echo "⚠️  Histórico de migrations inconsistente detectado. Corrigindo..."\n\
        set +e  # Desabilitar exit on error durante correção\n\
        # Marcar migrations do bau_mental como aplicadas (fake)\n\
        python manage.py migrate bau_mental 0001_initial --fake 2>/dev/null || true\n\
        python manage.py migrate bau_mental 0002_alter_box_id_alter_note_id --fake 2>/dev/null || true\n\
        python manage.py migrate bau_mental 0003_alter_note_audio_file --fake 2>/dev/null || true\n\
        python manage.py migrate bau_mental 0004_alter_note_audio_file --fake 2>/dev/null || true\n\
        python manage.py migrate bau_mental 0005_add_fulltext_search --fake 2>/dev/null || true\n\
        python manage.py migrate bau_mental 0006_add_forwarded_source_type --fake 2>/dev/null || true\n\
        python manage.py migrate bau_mental 0007_add_note_tracking --fake 2>/dev/null || true\n\
        python manage.py migrate bau_mental 0008_add_box_sharing --fake 2>/dev/null || true\n\
        python manage.py migrate bau_mental 0009_remove_note_note_transcript_gin_idx_and_more --fake 2>/dev/null || true\n\
        set -e  # Reabilitar exit on error\n\
        echo "✅ Histórico corrigido. Aplicando migrations restantes..."\n\
        python manage.py migrate --noinput\n\
    else\n\
        echo "❌ Erro ao aplicar migrations:"\n\
        echo "$MIGRATE_OUTPUT"\n\
        exit 1\n\
    fi\n\
fi\n\
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
