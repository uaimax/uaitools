# Dockerfile - Backend (Produção)

Este Dockerfile é otimizado para produção e será usado pelo CapRover através do `captain-definition`.

## Características

- **Base**: Python 3.12-slim
- **Ambiente**: Produção (`ENVIRONMENT=production`)
- **Processos**: Gunicorn + Celery Worker (gerenciados pelo Supervisor)
- **Porta**: 80

## Variáveis de Ambiente Necessárias

As seguintes variáveis de ambiente devem ser configuradas no CapRover:

### Obrigatórias
- `ALLOWED_HOSTS` - Lista de hosts permitidos (separados por vírgula)
- `DATABASE_URL` - URL de conexão PostgreSQL (formato: `postgresql://user:pass@host:port/dbname`)
- `SECRET_KEY` - Chave secreta do Django

### Opcionais (mas recomendadas)
- `CSRF_TRUSTED_ORIGINS` - Origens confiáveis para CSRF (separadas por vírgula)
- `CELERY_MODE` - Modo do Celery: `same` (padrão) ou `separate`
- `DEBUG` - `True` ou `False` (padrão: `False`)
- `SENTRY_DSN` - DSN do Sentry/GlitchTip para monitoramento

## Build

O build é feito automaticamente pelo CapRover quando você faz push ou através do `captain-definition`.

Durante o build:
1. Instala dependências do sistema
2. Instala dependências Python do `requirements.txt`
3. Copia código da aplicação
4. Tenta coletar arquivos estáticos (pode falhar se precisar de banco)

## Runtime

No início do container (`start.sh`):
1. Aplica migrations automaticamente
2. Coleta arquivos estáticos (fallback se não foi feito no build)
3. Inicia Supervisor que gerencia:
   - Gunicorn (3 workers)
   - Celery Worker

## Modos de Operação

### Modo `same` (padrão)
Gunicorn e Celery rodam no mesmo container, gerenciados pelo Supervisor.

### Modo `separate`
Apenas Gunicorn roda neste container. Use quando tiver um serviço Celery separado.

Para ativar: `CELERY_MODE=separate`

