FROM python:3.12-slim

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
# ENVIRONMENT=production garante que config/settings/prod.py será carregado
# Pode ser sobrescrito por variável de ambiente do CapRover se necessário
ENV ENVIRONMENT=production

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements e instalar dependências Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn

# Copiar código da aplicação
COPY . /app/

# Coletar arquivos estáticos em modo produção
# Nota: collectstatic pode falhar durante o build se apps precisarem de banco de dados
# Nesse caso, será executado no start.sh após migrations
# Tentamos aqui primeiro para otimizar (build cache), mas não falhamos o build se der erro
RUN python manage.py collectstatic --noinput 2>&1 || echo "⚠️ collectstatic será executado no start.sh"

# Expor porta
EXPOSE 80

# Configurar supervisor para gerenciar Gunicorn + Celery
RUN mkdir -p /etc/supervisor/conf.d

# Script de inicialização que aplica migrations e inicia supervisor
RUN echo '#!/bin/bash\nset -e\n\n# Aplicar migrations\necho "📦 Aplicando migrations..."\npython manage.py migrate --noinput\necho "✅ Migrations aplicadas"\n\n# Coletar arquivos estáticos (se não foi feito durante o build)\necho "📦 Coletando arquivos estáticos..."\npython manage.py collectstatic --noinput || echo "⚠️ collectstatic falhou (continuando...)"\necho "✅ Arquivos estáticos coletados"\n\n# Verificar se deve rodar Celery no mesmo container\nCELERY_MODE=${CELERY_MODE:-same}\n\nif [ "$CELERY_MODE" = "separate" ]; then\n    # Modo separado: apenas Gunicorn (para quando tiver serviço Celery separado)\n    echo "🚀 Modo separado: Iniciando apenas Gunicorn..."\n    exec gunicorn --bind 0.0.0.0:80 --workers 3 --timeout 120 --access-logfile - --error-logfile - config.wsgi:application\nelse\n    # Modo mesmo container: Supervisor gerencia Gunicorn + Celery\n    echo "🚀 Modo mesmo container: Iniciando Gunicorn + Celery Worker..."\n    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\nfi' > /app/start.sh && chmod +x /app/start.sh

# Configuração do Supervisor (Gunicorn + Celery)
RUN echo '[supervisord]\nnodaemon=true\n\n[program:gunicorn]\ncommand=gunicorn --bind 0.0.0.0:80 --workers 3 --timeout 120 --access-logfile - --error-logfile - config.wsgi:application\ndirectory=/app\nautostart=true\nautorestart=true\nstderr_logfile=/dev/stderr\nstderr_logfile_maxbytes=0\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0\n\n[program:celery]\ncommand=celery -A config worker -l info\ndirectory=/app\nautostart=true\nautorestart=true\nstderr_logfile=/dev/stderr\nstderr_logfile_maxbytes=0\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0' > /etc/supervisor/conf.d/supervisord.conf

# Comando para iniciar aplicação (executa migrations antes)
CMD ["/app/start.sh"]

