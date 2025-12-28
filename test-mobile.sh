#!/bin/bash
# Script para testar o app mobile localmente
# Padrão: Inicia backend e Expo com tunnel + ngrok para backend
#
# Uso:
#   ./test-mobile.sh                    # Padrão: Expo tunnel + ngrok para backend
#   ./test-mobile.sh --no-tunnel       # Sem tunnels (LAN apenas)
#   ./test-mobile.sh --no-backend-tunnel # Expo tunnel, backend IP local

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
MOBILE_DIR="$SCRIPT_DIR/mobile"

# Portas
BACKEND_PORT=${PORT:-8001}
EXPO_PORT=8081

# Verificar argumentos
# Padrão: usar tunnel para Expo E ngrok para backend
USE_TUNNEL=true
USE_BACKEND_TUNNEL=true
FORCE_ENV=false

# Verificar todos os argumentos
for arg in "$@"; do
    if [[ "$arg" == "--no-tunnel" ]] || [[ "$arg" == "-n" ]]; then
        USE_TUNNEL=false
        USE_BACKEND_TUNNEL=false
    elif [[ "$arg" == "--no-backend-tunnel" ]] || [[ "$arg" == "-nb" ]]; then
        USE_BACKEND_TUNNEL=false
        # Mantém tunnel do Expo
    elif [[ "$arg" == "--backend-tunnel" ]] || [[ "$arg" == "-b" ]]; then
        USE_BACKEND_TUNNEL=true
        # Já é o padrão, mas mantém para compatibilidade
    elif [[ "$arg" == "--force-env" ]] || [[ "$arg" == "-f" ]]; then
        FORCE_ENV=true
    fi
done

echo -e "${BLUE}📱 SupBrainNote Mobile - Ambiente de Teste${NC}"
echo -e "${YELLOW}💡 Padrão: Expo tunnel + ngrok para backend${NC}"
if [ "$USE_BACKEND_TUNNEL" = false ]; then
    echo -e "${YELLOW}💡 Modo: Backend usando IP local (sem ngrok)${NC}"
fi
echo ""

# Função para obter IP local (WSL ou Linux)
get_local_ip() {
    # Tenta obter IP da interface principal
    if command -v ip &> /dev/null; then
        # Linux moderno (ip command)
        ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' | head -1
    elif command -v ifconfig &> /dev/null; then
        # Linux/Mac (ifconfig)
        ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1
    else
        echo "127.0.0.1"
    fi
}

LOCAL_IP=$(get_local_ip)

# Função para iniciar ngrok tunnel para backend
start_backend_tunnel() {
    if ! command -v ngrok &> /dev/null; then
        echo -e "${RED}❌ ngrok não está instalado${NC}"
        echo -e "${YELLOW}💡 Instale em: https://ngrok.com/download${NC}"
        echo -e "${YELLOW}💡 Ou use --no-tunnel para tentar sem tunnel do backend${NC}"
        return 1
    fi

    echo -e "${BLUE}🌐 Iniciando ngrok tunnel para backend...${NC}"

    # Verificar se ngrok já está rodando
    if pgrep -f "ngrok http $BACKEND_PORT" > /dev/null; then
        echo -e "${YELLOW}⚠️  ngrok já está rodando na porta $BACKEND_PORT${NC}"
        # Tentar obter URL do ngrok API
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -oP '"public_url":"https://[^"]+' | head -1 | cut -d'"' -f4)
        if [ -n "$NGROK_URL" ]; then
            echo -e "${GREEN}✅ Tunnel ativo: $NGROK_URL${NC}"
            echo "$NGROK_URL" > /tmp/ngrok-backend-url.txt
            return 0
        fi
    fi

    # Iniciar ngrok em background
    nohup ngrok http $BACKEND_PORT > /tmp/ngrok-backend.log 2>&1 &
    NGROK_PID=$!
    echo $NGROK_PID > /tmp/ngrok-backend.pid

    # Aguardar ngrok iniciar
    echo -e "${YELLOW}   ⏳ Aguardando ngrok iniciar...${NC}"
    for i in {1..10}; do
        sleep 1
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -oP '"public_url":"https://[^"]+' | head -1 | cut -d'"' -f4)
        if [ -n "$NGROK_URL" ]; then
            echo -e "${GREEN}   ✅ Tunnel criado: $NGROK_URL${NC}"
            echo "$NGROK_URL" > /tmp/ngrok-backend-url.txt
            return 0
        fi
    done

    echo -e "${RED}   ❌ ngrok não iniciou a tempo${NC}"
    return 1
}

# Função para parar ngrok
stop_backend_tunnel() {
    if [ -f /tmp/ngrok-backend.pid ]; then
        NGROK_PID=$(cat /tmp/ngrok-backend.pid)
        if ps -p $NGROK_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}🛑 Parando ngrok (PID: $NGROK_PID)...${NC}"
            kill $NGROK_PID 2>/dev/null || true
            rm /tmp/ngrok-backend.pid /tmp/ngrok-backend-url.txt 2>/dev/null || true
        fi
    fi
}

# Função para verificar se porta está em uso
check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Porta $port ($name) está em uso${NC}"
        return 1
    fi
    return 0
}

# Função para verificar se backend está rodando
check_backend_running() {
    if curl -s "http://localhost:$BACKEND_PORT/api/v1/" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Função para setup do backend
setup_backend() {
    echo -e "${BLUE}📦 Configurando Backend...${NC}"

    cd "$BACKEND_DIR"

    # Verificar virtualenv
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}   📦 Criando virtualenv...${NC}"
        python3 -m venv venv
    fi

    # Ativar virtualenv
    source venv/bin/activate

    # Instalar dependências se necessário
    if [ ! -d "venv/lib/python*/site-packages/rest_framework" ]; then
        echo -e "${YELLOW}   📥 Instalando dependências Python...${NC}"
        pip install --upgrade pip --quiet
        pip install -r requirements.txt --quiet
    fi

    # Carregar .env
    if [ -f "$SCRIPT_DIR/.env" ]; then
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
    fi

    # Rodar migrations
    echo -e "${YELLOW}   🗄️  Aplicando migrations...${NC}"
    python manage.py migrate --noinput > /dev/null 2>&1

    echo -e "${GREEN}   ✅ Backend configurado${NC}"
}

# Arquivo de log do Backend
BACKEND_LOG_FILE="$SCRIPT_DIR/backend-debug.log"

# Função para limpar cache do Django (rate limits, etc)
clear_django_cache() {
    echo -e "${YELLOW}   🧹 Limpando cache do Django (rate limits)...${NC}"
    cd "$BACKEND_DIR"
    source venv/bin/activate 2>/dev/null || true

    # Carregar .env
    if [ -f "$SCRIPT_DIR/.env" ]; then
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
    fi

    # Limpar chaves de throttle DIRETAMENTE no Redis
    python manage.py shell -c "
from django.core.cache import cache
try:
    client = cache.client.get_client()
    keys = client.keys('*throttle*')
    if keys:
        deleted = client.delete(*keys)
        print(f'✅ {deleted} chaves de throttle deletadas!')
    else:
        print('✅ Nenhuma chave de throttle encontrada')
except Exception as e:
    print(f'⚠️  Erro ao limpar throttle: {e}')
    cache.clear()
    print('Cache geral limpo (fallback)')
" 2>/dev/null || echo -e "${YELLOW}   ⚠️  Não foi possível limpar cache (Redis pode não estar ativo)${NC}"
}

# Função para parar processos antigos do backend
stop_old_backend() {
    # Parar processos antigos na porta
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}   🛑 Parando processo antigo na porta $BACKEND_PORT...${NC}"
        lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi

    # Parar processo do PID file se existir
    if [ -f /tmp/backend-mobile.pid ]; then
        OLD_PID=$(cat /tmp/backend-mobile.pid)
        if ps -p $OLD_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}   🛑 Parando processo antigo (PID: $OLD_PID)...${NC}"
            kill $OLD_PID 2>/dev/null || true
            sleep 2
        fi
        rm /tmp/backend-mobile.pid 2>/dev/null || true
    fi
}

# Função para iniciar backend
start_backend() {
    # Sempre parar processos antigos primeiro
    stop_old_backend

    if check_backend_running; then
        echo -e "${GREEN}✅ Backend já está rodando em http://localhost:$BACKEND_PORT${NC}"
        # Limpar cache mesmo se backend já está rodando
        clear_django_cache
        return 0
    fi

    echo -e "${BLUE}🚀 Iniciando Backend...${NC}"

    cd "$BACKEND_DIR"
    source venv/bin/activate

    # Carregar .env
    if [ -f "$SCRIPT_DIR/.env" ]; then
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
    fi

    # Limpar cache do Django antes de iniciar
    clear_django_cache

    # Iniciar backend em background
    # IMPORTANTE: Usar 0.0.0.0 (não 127.0.0.1) para aceitar conexões externas
    # Isso permite que o dispositivo acesse via IP local (modo LAN)
    # ou que o Expo tunnel acesse (modo tunnel)

    # Limpar log anterior e criar novo
    echo "=== Backend Log - $(date) ===" > "$BACKEND_LOG_FILE"
    echo "" >> "$BACKEND_LOG_FILE"

    # Iniciar backend em background com logs
    # Usar exec para garantir que o processo seja iniciado corretamente
    python manage.py runserver 0.0.0.0:$BACKEND_PORT --verbosity 2 >> "$BACKEND_LOG_FILE" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/backend-mobile.pid

    echo -e "${GREEN}   📋 Backend iniciando (PID: $BACKEND_PID)${NC}"
    echo -e "${GREEN}   📋 Backend logs salvos em: $BACKEND_LOG_FILE${NC}"

    # Aguardar backend iniciar
    echo -e "${YELLOW}   ⏳ Aguardando backend iniciar...${NC}"
    for i in {1..30}; do
        if check_backend_running; then
            echo -e "${GREEN}   ✅ Backend iniciado! (PID: $BACKEND_PID)${NC}"
            # Limpar cache após iniciar
            clear_django_cache
            return 0
        fi
        # Verificar se o processo ainda está rodando
        if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${RED}   ❌ Processo do backend morreu!${NC}"
            echo -e "${YELLOW}   💡 Verifique os logs em: $BACKEND_LOG_FILE${NC}"
            tail -20 "$BACKEND_LOG_FILE" 2>/dev/null || echo "Log não disponível"
            return 1
        fi
        sleep 1
    done

    echo -e "${RED}   ❌ Backend não iniciou a tempo${NC}"
    echo -e "${YELLOW}   💡 Verifique os logs em: $BACKEND_LOG_FILE${NC}"
    tail -20 "$BACKEND_LOG_FILE" 2>/dev/null || echo "Log não disponível"
    return 1
}

# Função para parar backend
stop_backend() {
    if [ -f /tmp/backend-mobile.pid ]; then
        BACKEND_PID=$(cat /tmp/backend-mobile.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}🛑 Parando backend (PID: $BACKEND_PID)...${NC}"
            kill $BACKEND_PID 2>/dev/null || true
            rm /tmp/backend-mobile.pid
        fi
    fi
}

# Função para setup do mobile
setup_mobile() {
    echo -e "${BLUE}📦 Configurando Mobile...${NC}"

    cd "$MOBILE_DIR"

    # Verificar node_modules
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}   📥 Instalando dependências Node.js...${NC}"
        npm install
    fi

    # Verificar se já existe .env com URL de produção
    PRODUCTION_URL="https://ut-be.app.webmaxdigital.com"
    HAS_PRODUCTION_ENV=false

    if [ -f "$MOBILE_DIR/.env" ]; then
        # Verificar se .env contém URL de produção
        if grep -q "EXPO_PUBLIC_API_URL.*$PRODUCTION_URL" "$MOBILE_DIR/.env" 2>/dev/null; then
            HAS_PRODUCTION_ENV=true
            echo -e "${YELLOW}   ⚠️  .env já existe com URL de produção configurada${NC}"
            echo -e "${YELLOW}   💡 Mantendo configuração de produção (não será sobrescrita)${NC}"
            echo -e "${BLUE}   💡 Para testar localmente, edite manualmente o .env ou use --force-env${NC}"
        fi
    fi
    
    # Exportar HAS_PRODUCTION_ENV para uso em outras funções
    export HAS_PRODUCTION_ENV

    # Se não for produção ou se --force-env foi passado, configurar para desenvolvimento
    if [ "$HAS_PRODUCTION_ENV" = false ] || [ "$FORCE_ENV" = true ]; then
        # Criar/atualizar .env do mobile
        echo -e "${YELLOW}   📝 Configurando .env do mobile para desenvolvimento...${NC}"

        # Determinar URL da API
        if [ "$USE_BACKEND_TUNNEL" = true ]; then
            # Usar ngrok tunnel para backend
            if [ -f /tmp/ngrok-backend-url.txt ]; then
                API_URL=$(cat /tmp/ngrok-backend-url.txt)
                echo -e "${BLUE}   🌐 Backend via NGROK: $API_URL${NC}"
            else
                echo -e "${RED}   ❌ URL do ngrok não encontrada${NC}"
                API_URL="http://$LOCAL_IP:$BACKEND_PORT"
                echo -e "${YELLOW}   💡 Usando IP local como fallback${NC}"
            fi
        else
            # Usar IP local (requer mesma rede ou firewall configurado)
            API_URL="http://$LOCAL_IP:$BACKEND_PORT"
            if [ "$USE_TUNNEL" = true ]; then
                echo -e "${BLUE}   🌐 Modo TUNNEL: Backend em http://$LOCAL_IP:$BACKEND_PORT${NC}"
                echo -e "${YELLOW}   💡 Tunnel é apenas para código do app, HTTP usa IP local${NC}"
                echo -e "${YELLOW}   💡 Se não conectar, use --backend-tunnel para usar ngrok${NC}"
            else
                echo -e "${BLUE}   🌐 Modo LAN: Backend em http://$LOCAL_IP:$BACKEND_PORT${NC}"
                echo -e "${YELLOW}   💡 Certifique-se de que backend está acessível neste IP${NC}"
            fi
        fi

        # Obter SENTRY_DSN do .env principal
        SENTRY_DSN=""
        if [ -f "$SCRIPT_DIR/.env" ]; then
            SENTRY_DSN=$(grep -E "^SENTRY_DSN=" "$SCRIPT_DIR/.env" | cut -d"'" -f2 | cut -d'"' -f2)
        fi

        # Criar .env (sobrescreve se --force-env foi passado)
        cat > "$MOBILE_DIR/.env" << EOF
# Configuração para teste mobile
# Gerado automaticamente por test-mobile.sh
# Para usar produção, edite manualmente e defina:
# EXPO_PUBLIC_API_URL=https://ut-be.app.webmaxdigital.com
EXPO_PUBLIC_API_URL=$API_URL
EXPO_PUBLIC_SENTRY_DSN=$SENTRY_DSN
EOF

        echo -e "${GREEN}   ✅ Mobile configurado para desenvolvimento${NC}"
    else
        # Manter configuração existente (produção)
        # Ler SENTRY_DSN do .env existente primeiro
        SENTRY_DSN=""
        if [ -f "$MOBILE_DIR/.env" ]; then
            SENTRY_DSN=$(grep -E "^EXPO_PUBLIC_SENTRY_DSN=" "$MOBILE_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
        fi
        # Se não encontrou no .env do mobile, tentar do .env principal
        if [ -z "$SENTRY_DSN" ] && [ -f "$SCRIPT_DIR/.env" ]; then
            SENTRY_DSN=$(grep -E "^SENTRY_DSN=" "$SCRIPT_DIR/.env" | cut -d"'" -f2 | cut -d'"' -f2)
            # Adicionar SENTRY_DSN ao .env existente se não tiver
            if [ -n "$SENTRY_DSN" ] && ! grep -q "EXPO_PUBLIC_SENTRY_DSN" "$MOBILE_DIR/.env" 2>/dev/null; then
                echo "" >> "$MOBILE_DIR/.env"
                echo "EXPO_PUBLIC_SENTRY_DSN=$SENTRY_DSN" >> "$MOBILE_DIR/.env"
                echo -e "${GREEN}   ✅ SENTRY_DSN adicionado ao .env${NC}"
            fi
        fi
        echo -e "${GREEN}   ✅ Mantendo configuração de produção (URL e SENTRY_DSN preservados)${NC}"
    fi

    if [ -n "$SENTRY_DSN" ]; then
        echo -e "${GREEN}   ✅ Sentry/GlitchTip configurado${NC}"
    else
        echo -e "${YELLOW}   ⚠️  SENTRY_DSN não encontrado (erros não serão enviados ao GlitchTip)${NC}"
    fi
}

# Arquivo de log do Expo
EXPO_LOG_FILE="$SCRIPT_DIR/mobile-debug.log"

# Arquivo de log do Celery
CELERY_WORKER_LOG_FILE="$SCRIPT_DIR/celery-worker-debug.log"
CELERY_BEAT_LOG_FILE="$SCRIPT_DIR/celery-beat-debug.log"

# Função para parar Celery
stop_celery() {
    # Parar Celery Worker
    if [ -f /tmp/celery-mobile.pid ]; then
        CELERY_PID=$(cat /tmp/celery-mobile.pid)
        if ps -p $CELERY_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}   🛑 Parando Celery Worker (PID: $CELERY_PID)...${NC}"
            kill $CELERY_PID 2>/dev/null || true
            sleep 1
            # Force kill se ainda estiver rodando
            if ps -p $CELERY_PID > /dev/null 2>&1; then
                kill -9 $CELERY_PID 2>/dev/null || true
            fi
        fi
        rm -f /tmp/celery-mobile.pid
    fi

    # Parar Celery Beat
    if [ -f /tmp/celery-beat-mobile.pid ]; then
        BEAT_PID=$(cat /tmp/celery-beat-mobile.pid)
        if ps -p $BEAT_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}   🛑 Parando Celery Beat (PID: $BEAT_PID)...${NC}"
            kill $BEAT_PID 2>/dev/null || true
            sleep 1
            # Force kill se ainda estiver rodando
            if ps -p $BEAT_PID > /dev/null 2>&1; then
                kill -9 $BEAT_PID 2>/dev/null || true
            fi
        fi
        rm -f /tmp/celery-beat-mobile.pid
    fi

    # Parar processos celery que possam estar rodando
    pkill -f "celery.*worker.*config" 2>/dev/null || true
    pkill -f "celery.*beat.*config" 2>/dev/null || true
}

# Função para iniciar Celery
start_celery() {
    echo -e "${BLUE}🚀 Iniciando Celery Worker...${NC}"

    cd "$BACKEND_DIR"
    source venv/bin/activate 2>/dev/null || true

    # Carregar .env
    if [ -f "$SCRIPT_DIR/.env" ]; then
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
    fi

    # Verificar se Redis está rodando
    # Tenta diferentes formas de verificar Redis
    REDIS_RUNNING=false
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping > /dev/null 2>&1; then
            REDIS_RUNNING=true
        fi
    elif pgrep -x redis-server > /dev/null 2>&1; then
        REDIS_RUNNING=true
    elif systemctl is-active --quiet redis-server 2>/dev/null; then
        REDIS_RUNNING=true
    fi

    if [ "$REDIS_RUNNING" = false ]; then
        echo -e "${RED}   ❌ Redis não está rodando!${NC}"
        echo -e "${YELLOW}   💡 Inicie o Redis antes de continuar${NC}"
        echo -e "${YELLOW}   💡 Comandos: sudo systemctl start redis-server (Linux) ou redis-server (local)${NC}"
        return 1
    fi

    # Verificar OPENAI_API_KEY
    if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${YELLOW}   ⚠️  OPENAI_API_KEY não configurada${NC}"
        echo -e "${YELLOW}   💡 Transcrições não funcionarão sem a chave${NC}"
    fi

    # Limpar log anterior
    echo "=== Celery Worker Log - $(date) ===" > "$CELERY_WORKER_LOG_FILE"
    echo "" >> "$CELERY_WORKER_LOG_FILE"

    # Iniciar Celery em background
    celery -A config worker -l info >> "$CELERY_WORKER_LOG_FILE" 2>&1 &
    CELERY_PID=$!
    echo $CELERY_PID > /tmp/celery-mobile.pid

    echo -e "${GREEN}   ✅ Celery Worker iniciado (PID: $CELERY_PID)${NC}"
    echo -e "${GREEN}   📋 Logs salvos em: $CELERY_WORKER_LOG_FILE${NC}"

    # Aguardar Celery iniciar
    echo -e "${YELLOW}   ⏳ Aguardando Celery iniciar...${NC}"
    sleep 3

    # Verificar se ainda está rodando
    if ! ps -p $CELERY_PID > /dev/null 2>&1; then
        echo -e "${RED}   ❌ Celery Worker não iniciou corretamente!${NC}"
        echo -e "${YELLOW}   💡 Verifique os logs em: $CELERY_WORKER_LOG_FILE${NC}"
        tail -20 "$CELERY_WORKER_LOG_FILE" 2>/dev/null || echo "Log não disponível"
        return 1
    fi

    echo -e "${GREEN}   ✅ Celery worker pronto!${NC}"
    return 0
}

# Função para iniciar Celery Beat
start_celery_beat() {
    echo -e "${BLUE}🚀 Iniciando Celery Beat...${NC}"

    cd "$BACKEND_DIR"
    source venv/bin/activate 2>/dev/null || true

    # Carregar .env
    if [ -f "$SCRIPT_DIR/.env" ]; then
        set -a
        source "$SCRIPT_DIR/.env"
        set +a
    fi

    # Verificar se Redis está rodando
    # Tenta diferentes formas de verificar Redis
    REDIS_RUNNING=false
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping > /dev/null 2>&1; then
            REDIS_RUNNING=true
        fi
    elif pgrep -x redis-server > /dev/null 2>&1; then
        REDIS_RUNNING=true
    elif systemctl is-active --quiet redis-server 2>/dev/null; then
        REDIS_RUNNING=true
    fi

    if [ "$REDIS_RUNNING" = false ]; then
        echo -e "${RED}   ❌ Redis não está rodando!${NC}"
        echo -e "${YELLOW}   💡 Inicie o Redis antes de continuar${NC}"
        return 1
    fi

    # Limpar log anterior
    echo "=== Celery Beat Log - $(date) ===" > "$CELERY_BEAT_LOG_FILE"
    echo "" >> "$CELERY_BEAT_LOG_FILE"

    # Iniciar Celery Beat em background com scheduler correto
    celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler >> "$CELERY_BEAT_LOG_FILE" 2>&1 &
    BEAT_PID=$!
    echo $BEAT_PID > /tmp/celery-beat-mobile.pid

    echo -e "${GREEN}   ✅ Celery Beat iniciado (PID: $BEAT_PID)${NC}"
    echo -e "${GREEN}   📋 Logs salvos em: $CELERY_BEAT_LOG_FILE${NC}"

    # Aguardar Celery Beat iniciar
    echo -e "${YELLOW}   ⏳ Aguardando Celery Beat iniciar...${NC}"
    sleep 2

    # Verificar se ainda está rodando
    if ! ps -p $BEAT_PID > /dev/null 2>&1; then
        echo -e "${RED}   ❌ Celery Beat não iniciou corretamente!${NC}"
        echo -e "${YELLOW}   💡 Verifique os logs em: $CELERY_BEAT_LOG_FILE${NC}"
        return 1
    fi

    echo -e "${GREEN}   ✅ Celery Beat pronto!${NC}"
    return 0
}

# Função para iniciar Expo
start_expo() {
    echo -e "${BLUE}🚀 Iniciando Expo...${NC}"

    cd "$MOBILE_DIR"

    # Limpar log anterior
    echo "=== Mobile Debug Log - $(date) ===" > "$EXPO_LOG_FILE"
    echo "" >> "$EXPO_LOG_FILE"

    echo -e "${GREEN}📋 Logs sendo salvos em: $EXPO_LOG_FILE${NC}"
    echo -e "${YELLOW}   💡 Use 'tail -f $EXPO_LOG_FILE' em outro terminal para acompanhar${NC}"
    echo ""

    if [ "$USE_TUNNEL" = true ]; then
        echo -e "${YELLOW}   🌐 Usando TUNNEL (necessário para WSL)${NC}"
        echo -e "${BLUE}   💡 O Expo criará um tunnel público para seu dispositivo${NC}"
        echo ""
        # Iniciar Expo em foreground para manter interatividade completa (QR code)
        # Capturar apenas stderr para o log, stdout fica livre para QR code
        # Usar process substitution para não bloquear a saída
        npx expo start --tunnel 2> >(tee -a "$EXPO_LOG_FILE" >&2)
    else
        echo -e "${YELLOW}   🌐 Usando LAN (dispositivo deve estar na mesma rede)${NC}"
        echo -e "${BLUE}   💡 Certifique-se de que o dispositivo está na mesma rede Wi-Fi${NC}"
        echo ""
        # Iniciar Expo em foreground para manter interatividade completa (QR code)
        npx expo start --lan 2> >(tee -a "$EXPO_LOG_FILE" >&2)
    fi
}

# Função para parar Expo
stop_expo() {
    if [ -f /tmp/expo-mobile.pid ]; then
        EXPO_PID=$(cat /tmp/expo-mobile.pid)
        if ps -p $EXPO_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}🛑 Parando Expo (PID: $EXPO_PID)...${NC}"
            kill $EXPO_PID 2>/dev/null || true
            rm -f /tmp/expo-mobile.pid
        fi
    fi
    # Parar processos Expo que possam estar rodando
    pkill -f "expo start" 2>/dev/null || true
}

# Trap para limpar ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Limpando...${NC}"
    stop_expo
    # Só parar backend/celery se não estiver usando produção
    if [ "$HAS_PRODUCTION_ENV" = false ]; then
        stop_celery
        stop_backend
        stop_backend_tunnel
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM

# Verificar portas
if ! check_port $BACKEND_PORT "Backend"; then
    echo -e "${YELLOW}💡 Backend pode já estar rodando. Continuando...${NC}"
fi

# Setup
setup_mobile

# Verificar se está usando produção
PRODUCTION_URL="https://ut-be.app.webmaxdigital.com"
HAS_PRODUCTION_ENV=false
if [ -f "$MOBILE_DIR/.env" ]; then
    if grep -q "EXPO_PUBLIC_API_URL.*$PRODUCTION_URL" "$MOBILE_DIR/.env" 2>/dev/null; then
        HAS_PRODUCTION_ENV=true
    fi
fi

# Se estiver usando produção, pular backend e celery
if [ "$HAS_PRODUCTION_ENV" = true ]; then
    echo -e "${GREEN}✅ Usando backend de produção: $PRODUCTION_URL${NC}"
    echo -e "${YELLOW}💡 Backend local e Celery não serão iniciados${NC}"
    echo -e "${BLUE}💡 Apenas Expo será iniciado com tunnel${NC}"
    echo ""
else
    # Setup e iniciar backend apenas se não for produção
    setup_backend

    # SEMPRE tentar iniciar backend (mesmo se check_backend_running retornar true)
    # Isso garante que o backend está realmente rodando
    start_backend
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Falha ao iniciar backend${NC}"
        echo -e "${YELLOW}💡 Verifique os logs em: $BACKEND_LOG_FILE${NC}"
        exit 1
    fi

    # Iniciar Celery worker para processar transcrições
    start_celery
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Celery Worker não iniciou, mas continuando...${NC}"
        echo -e "${YELLOW}💡 Transcrições não funcionarão sem o Celery Worker${NC}"
    fi

    # Iniciar Celery Beat para tarefas periódicas
    start_celery_beat
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Celery Beat não iniciou, mas continuando...${NC}"
        echo -e "${YELLOW}💡 Tarefas periódicas não funcionarão sem o Celery Beat${NC}"
    fi

    # Iniciar ngrok tunnel para backend se solicitado (apenas em desenvolvimento)
    if [ "$USE_BACKEND_TUNNEL" = true ]; then
        start_backend_tunnel
        if [ $? -eq 0 ]; then
            # Atualizar .env com URL do ngrok apenas se não for produção
            if [ -f /tmp/ngrok-backend-url.txt ]; then
                API_URL=$(cat /tmp/ngrok-backend-url.txt)
                if [ "$FORCE_ENV" = true ]; then
                    # Obter SENTRY_DSN do .env principal
                    SENTRY_DSN=""
                    if [ -f "$SCRIPT_DIR/.env" ]; then
                        SENTRY_DSN=$(grep -E "^SENTRY_DSN=" "$SCRIPT_DIR/.env" | cut -d"'" -f2 | cut -d'"' -f2)
                    fi
                    cat > "$MOBILE_DIR/.env" << EOF
# Configuração para teste mobile
# Gerado automaticamente por test-mobile.sh
# Para usar produção, edite manualmente e defina:
# EXPO_PUBLIC_API_URL=https://ut-be.app.webmaxdigital.com
EXPO_PUBLIC_API_URL=$API_URL
EXPO_PUBLIC_SENTRY_DSN=$SENTRY_DSN
EOF
                    echo -e "${GREEN}   ✅ .env atualizado com URL do ngrok${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  Continuando sem tunnel do backend (usando IP local)${NC}"
        fi
    fi
fi

# Resumo
echo ""
echo -e "${GREEN}✅ Ambiente pronto para teste mobile!${NC}"
echo ""
echo -e "${BLUE}📊 Configuração:${NC}"
echo -e "   ${GREEN}Backend:${NC}      http://localhost:$BACKEND_PORT"
if [ "$USE_BACKEND_TUNNEL" = true ]; then
    if [ -f /tmp/ngrok-backend-url.txt ]; then
        NGROK_URL=$(cat /tmp/ngrok-backend-url.txt)
        echo -e "   ${GREEN}Backend (ngrok):${NC} $NGROK_URL"
    else
        echo -e "   ${GREEN}Backend (ngrok):${NC} Iniciando..."
    fi
elif [ "$USE_TUNNEL" = false ]; then
    echo -e "   ${GREEN}Backend (LAN):${NC}  http://$LOCAL_IP:$BACKEND_PORT"
else
    echo -e "   ${GREEN}Backend (IP local):${NC}  http://$LOCAL_IP:$BACKEND_PORT"
fi
echo -e "   ${GREEN}Mobile API:${NC}   $API_URL"
if [ "$USE_BACKEND_TUNNEL" = true ]; then
    echo -e "   ${GREEN}Modo:${NC}         TUNNEL (Expo + ngrok) - Padrão"
elif [ "$USE_TUNNEL" = true ]; then
    echo -e "   ${GREEN}Modo:${NC}         TUNNEL (Expo apenas, backend IP local)"
else
    echo -e "   ${GREEN}Modo:${NC}         LAN (sem tunnels)"
fi
echo ""
echo -e "${BLUE}💡 Próximos passos:${NC}"
echo -e "   1. Escaneie o QR code com Expo Go (iOS/Android)"
echo -e "   2. Ou pressione ${YELLOW}a${NC} para Android, ${YELLOW}i${NC} para iOS"
echo ""
echo -e "${BLUE}📋 Debug & Logs:${NC}"
echo -e "   • ${GREEN}Mobile/Expo:${NC}  $EXPO_LOG_FILE"
if [ "$HAS_PRODUCTION_ENV" = false ]; then
    echo -e "   • ${GREEN}Backend:${NC}      $BACKEND_LOG_FILE"
    echo -e "   • ${GREEN}Celery Worker:${NC} $CELERY_WORKER_LOG_FILE"
    echo -e "   • ${GREEN}Celery Beat:${NC}   $CELERY_BEAT_LOG_FILE"
fi
echo -e "   • ${GREEN}GlitchTip:${NC}    https://app.glitchtip.com (erros do backend)"
echo ""
echo -e "   ${YELLOW}Acompanhar logs em tempo real:${NC}"
echo -e "   tail -f $EXPO_LOG_FILE        # Mobile"
if [ "$HAS_PRODUCTION_ENV" = false ]; then
    echo -e "   tail -f $BACKEND_LOG_FILE     # Backend"
    echo -e "   tail -f $CELERY_WORKER_LOG_FILE      # Celery Worker (transcrições)"
    echo -e "   tail -f $CELERY_BEAT_LOG_FILE # Celery Beat (tarefas periódicas)"
fi
echo ""
echo -e "${YELLOW}⚠️  Importante:${NC}"
if [ "$HAS_PRODUCTION_ENV" = true ]; then
    echo -e "   • ✅ Usando backend de PRODUÇÃO: $PRODUCTION_URL"
    echo -e "   • ✅ Expo usa tunnel para código do app"
    echo -e "   • ✅ Requisições HTTP vão para backend de produção"
    echo -e "   • ${BLUE}Backend local e Celery não são necessários${NC}"
elif [ "$USE_BACKEND_TUNNEL" = true ]; then
    echo -e "   • ✅ Backend acessível via ngrok tunnel (padrão)"
    echo -e "   • ✅ Funciona de qualquer rede (não precisa mesma Wi-Fi)"
    echo -e "   • ✅ Expo usa tunnel para código do app"
    echo -e "   • ✅ Requisições HTTP vão para ngrok tunnel"
    echo -e "   • ${BLUE}Use --no-backend-tunnel para usar IP local${NC}"
elif [ "$USE_TUNNEL" = true ]; then
    echo -e "   • Backend usa IP local (sem ngrok)"
    echo -e "   • Expo usa tunnel para código do app"
    echo -e "   • Requisições HTTP vão para $LOCAL_IP:$BACKEND_PORT"
    echo -e "   • Backend deve estar rodando em 0.0.0.0:$BACKEND_PORT"
    echo -e "   • ${YELLOW}Se não conectar, remova --no-backend-tunnel para usar ngrok${NC}"
else
    echo -e "   • Modo LAN (sem tunnels)"
    echo -e "   • Dispositivo deve estar na mesma rede Wi-Fi do notebook"
    echo -e "   • Backend deve estar acessível em $LOCAL_IP:$BACKEND_PORT"
    echo -e "   • Backend deve rodar em 0.0.0.0:$BACKEND_PORT (não apenas 127.0.0.1)"
    echo -e "   • Verifique firewall do Windows/WSL se não conectar"
fi
echo ""

# Iniciar Expo
start_expo

