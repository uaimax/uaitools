#!/bin/bash
# Script único para iniciar ambiente de desenvolvimento completo
# Usa tmux se disponível, senão roda em modo simples

# Não usar set -e aqui porque queremos tratar erros do tmux graciosamente
# set -e  # Para em caso de erro

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Nome da sessão tmux
TMUX_SESSION="saas-dev"

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
MOBILE_DIR="$SCRIPT_DIR/mobile"

# Função para carregar .env de forma segura (evita problemas com caracteres especiais)
# Usa python-dotenv para parse correto, evitando problemas com $, !, @, etc.
load_env_safe() {
    local env_file="$1"
    if [ ! -f "$env_file" ]; then
        return 1
    fi

    # Usa python-dotenv via Python para carregar o .env de forma segura
    # Isso evita problemas com caracteres especiais no bash
    python3 -c "
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

env_file = Path('$env_file')
if env_file.exists():
    # Carrega o .env usando python-dotenv (parse correto)
    load_dotenv(env_file, override=True)

    # Gera comandos export seguros para todas as variáveis do .env
    # Lê o arquivo diretamente para pegar apenas variáveis definidas nele
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Ignora comentários e linhas vazias
            if not line or line.startswith('#'):
                continue
            # Parse manual simples: KEY=VALUE ou KEY='VALUE'
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                # Remove aspas se existirem
                if (value.startswith(\"'\") and value.endswith(\"'\")) or (value.startswith('\"') and value.endswith('\"')):
                    value = value[1:-1]
                # Escapa aspas simples no valor para uso no bash
                value_escaped = value.replace(\"'\", \"'\"'\"'\"'\")
                print(f\"export {key}='{value_escaped}'\")
"
}

# Portas
BACKEND_PORT=${PORT:-8001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# Verificar argumentos
FORCE_RESTART=false
if [[ "$1" == "--restart" ]] || [[ "$1" == "-r" ]]; then
    FORCE_RESTART=true
fi

echo -e "${BLUE}🚀 SaaS Bootstrap - Ambiente de Desenvolvimento${NC}"
echo ""

# Verificar se tmux está instalado
HAS_TMUX=false
if command -v tmux &> /dev/null; then
    HAS_TMUX=true
fi

# Função para verificar e liberar porta
check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Porta $port ($name) está em uso. Encerrando processo...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ Porta $port liberada${NC}"
    fi
}

# Função para gerenciar PostgreSQL em Docker
setup_postgres() {
    echo -e "${BLUE}🐘 Configurando PostgreSQL...${NC}"
    
    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker não está instalado. Pulando PostgreSQL em container.${NC}"
        echo -e "${YELLOW}💡 Para usar PostgreSQL local, instale Docker ou configure DATABASE_URL manualmente.${NC}"
        return 0
    fi
    
    # Verificar se Docker está rodando
    if ! docker info &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker não está rodando. Pulando PostgreSQL em container.${NC}"
        echo -e "${YELLOW}💡 Inicie o Docker e execute o script novamente.${NC}"
        return 0
    fi
    
    # Configurações do PostgreSQL
    POSTGRES_CONTAINER_NAME="saas-postgres-dev"
    POSTGRES_PORT=5432
    POSTGRES_USER="postgres"
    POSTGRES_PASSWORD="postgres"
    POSTGRES_DB="saas_dev"
    
    # Verificar se container já existe e está rodando
    if docker ps -a --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER_NAME}$"; then
        # Container existe, verificar se está rodando
        if docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER_NAME}$"; then
            echo -e "${GREEN}✅ Container PostgreSQL já está rodando${NC}"
        else
            echo -e "${YELLOW}🔄 Iniciando container PostgreSQL existente...${NC}"
            docker start "$POSTGRES_CONTAINER_NAME" > /dev/null 2>&1
            sleep 2
            echo -e "${GREEN}✅ Container PostgreSQL iniciado${NC}"
        fi
    else
        # Container não existe, criar novo
        echo -e "${YELLOW}📦 Criando container PostgreSQL...${NC}"
        
        # Verificar se porta 5432 está livre
        if lsof -Pi :$POSTGRES_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            echo -e "${YELLOW}⚠️  Porta $POSTGRES_PORT já está em uso.${NC}"
            echo -e "${YELLOW}💡 Se você já tem PostgreSQL rodando, o script usará a DATABASE_URL do .env${NC}"
            return 0
        fi
        
        # Criar container PostgreSQL
        docker run -d \
            --name "$POSTGRES_CONTAINER_NAME" \
            -e POSTGRES_USER="$POSTGRES_USER" \
            -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
            -e POSTGRES_DB="$POSTGRES_DB" \
            -p "$POSTGRES_PORT:5432" \
            -v "${SCRIPT_DIR}/.postgres-data:/var/lib/postgresql/data" \
            postgres:15-alpine > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Container PostgreSQL criado e iniciado${NC}"
            echo -e "${YELLOW}⏳ Aguardando PostgreSQL ficar pronto...${NC}"
            sleep 3
            
            # Aguardar PostgreSQL estar pronto (máximo 30 segundos)
            local max_attempts=30
            local attempt=0
            while [ $attempt -lt $max_attempts ]; do
                if docker exec "$POSTGRES_CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ PostgreSQL está pronto${NC}"
                    break
                fi
                attempt=$((attempt + 1))
                sleep 1
            done
            
            if [ $attempt -eq $max_attempts ]; then
                echo -e "${RED}❌ Timeout aguardando PostgreSQL ficar pronto${NC}"
                return 1
            fi
        else
            echo -e "${RED}❌ Erro ao criar container PostgreSQL${NC}"
            return 1
        fi
    fi
    
    # Configurar DATABASE_URL se não estiver definida no .env
    if [ -f "$SCRIPT_DIR/.env" ]; then
        # Verificar se DATABASE_URL já está definida
        if grep -q "^DATABASE_URL=" "$SCRIPT_DIR/.env" 2>/dev/null; then
            echo -e "${GREEN}✅ DATABASE_URL já configurada no .env${NC}"
        else
            # Adicionar DATABASE_URL ao .env
            echo "" >> "$SCRIPT_DIR/.env"
            echo "# PostgreSQL local (Docker)" >> "$SCRIPT_DIR/.env"
            echo "DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}" >> "$SCRIPT_DIR/.env"
            echo -e "${GREEN}✅ DATABASE_URL adicionada ao .env${NC}"
        fi
    else
        # Criar .env se não existir
        echo "# PostgreSQL local (Docker)" > "$SCRIPT_DIR/.env"
        echo "DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}" >> "$SCRIPT_DIR/.env"
        echo -e "${GREEN}✅ Arquivo .env criado com DATABASE_URL${NC}"
    fi
    
    # Exportar DATABASE_URL para o ambiente atual
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
    
    echo -e "${GREEN}✅ PostgreSQL configurado: postgresql://${POSTGRES_USER}:***@localhost:${POSTGRES_PORT}/${POSTGRES_DB}${NC}"
}

# Função para setup do backend
setup_backend() {
    echo -e "${BLUE}📦 Configurando Backend...${NC}"

    cd "$BACKEND_DIR"

    # 1. Criar/ativar virtualenv
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}   📦 Criando virtualenv...${NC}"
        python3 -m venv venv
    fi

    # 2. Instalar dependências
    echo -e "${YELLOW}   📥 Instalando dependências Python...${NC}"
    source venv/bin/activate
    pip install --upgrade pip --quiet
    pip install -r requirements.txt --quiet

    # 3. Criar .env se não existir
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        echo -e "${YELLOW}   📝 Criando arquivo .env...${NC}"
        cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env" 2>/dev/null || true
        echo -e "${GREEN}   ✅ Arquivo .env criado${NC}"
    fi

    # 3.1. Carregar variáveis do .env para o ambiente do shell
    # Usa função segura que evita problemas com caracteres especiais
    if [ -f "$SCRIPT_DIR/.env" ]; then
        eval "$(load_env_safe "$SCRIPT_DIR/.env")"
    fi

    # 4. Rodar migrations
    echo -e "${YELLOW}   🗄️  Aplicando migrations...${NC}"
    python manage.py migrate --noinput

    # 5. Inicializar documentos legais se não existirem
    echo -e "${YELLOW}   📄 Verificando documentos legais...${NC}"
    python manage.py init_legal_documents --verbosity=0 2>/dev/null || true

    # 6. Criar superuser se não existir
    echo -e "${YELLOW}   👤 Verificando superuser...${NC}"
    python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser(
        email='admin@example.com',
        password='admin123',
        first_name='Admin',
        last_name='User'
    )
    print("✅ Superuser criado: admin@example.com / admin123")
else:
    print("✅ Superuser admin@example.com já existe")
EOF

    # 7. Popular dados de exemplo (seed)
    echo -e "${YELLOW}   🌱 Populando dados de exemplo...${NC}"
    python manage.py seed
    echo -e "${GREEN}   ✅ Dados de exemplo populados${NC}"

    echo -e "${GREEN}   ✅ Backend configurado${NC}"
}

# Função para verificar se npm está disponível
check_npm() {
    # Tentar encontrar npm de várias formas
    if command -v npm &> /dev/null; then
        return 0
    fi
    
    # Tentar carregar .zshrc/.bashrc e verificar novamente
    if [ -f "$HOME/.zshrc" ]; then
        source "$HOME/.zshrc" 2>/dev/null
        if command -v npm &> /dev/null; then
            return 0
        fi
    fi
    
    if [ -f "$HOME/.bashrc" ]; then
        source "$HOME/.bashrc" 2>/dev/null
        if command -v npm &> /dev/null; then
            return 0
        fi
    fi
    
    return 1
}

# Função para setup do frontend
setup_frontend() {
    echo -e "${BLUE}📦 Configurando Frontend...${NC}"

    cd "$FRONTEND_DIR"

    # Verificar se npm está disponível
    if ! check_npm; then
        echo -e "${RED}   ❌ npm não encontrado no sistema${NC}"
        echo -e "${YELLOW}   💡 Instale Node.js e npm primeiro:${NC}"
        echo -e "${YELLOW}      - Ubuntu/Debian: sudo apt install nodejs npm${NC}"
        echo -e "${YELLOW}      - Ou use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash${NC}"
        echo -e "${YELLOW}   ⚠️  Pulando instalação de dependências do frontend${NC}"
        return 1
    fi

    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}   📥 Instalando dependências Node.js...${NC}"
        npm install
    else
        echo -e "${GREEN}   ✅ Dependências Node.js já instaladas${NC}"
    fi

    # Criar .env do frontend se não existir
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        echo -e "${YELLOW}   📝 Criando .env do frontend...${NC}"
        cat > "$FRONTEND_DIR/.env" << EOF
# API Configuration
VITE_API_URL=http://localhost:$BACKEND_PORT/api
EOF
        echo -e "${GREEN}   ✅ .env do frontend criado${NC}"
    fi

    echo -e "${GREEN}   ✅ Frontend configurado${NC}"
}

# Função para setup do mobile
setup_mobile() {
    if [ ! -d "$MOBILE_DIR" ]; then
        return 0  # Se não existe diretório mobile, pula
    fi

    echo -e "${BLUE}📦 Configurando Mobile...${NC}"

    cd "$MOBILE_DIR"

    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}   📥 Instalando dependências Node.js...${NC}"
        npm install
    else
        echo -e "${GREEN}   ✅ Dependências Node.js já instaladas${NC}"
    fi

    echo -e "${GREEN}   ✅ Mobile configurado${NC}"
}

# Verificar e liberar portas
check_port $BACKEND_PORT "Backend"
check_port $FRONTEND_PORT "Frontend"

# ============================================
# MODO COM TMUX
# ============================================
if [ "$HAS_TMUX" = true ]; then
    # Verificar se sessão já existe
    if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        if [ "$FORCE_RESTART" = true ]; then
            echo -e "${YELLOW}🔄 Reiniciando sessão tmux...${NC}"
            tmux kill-session -t "$TMUX_SESSION" 2>/dev/null || true
            sleep 1
        else
            echo -e "${YELLOW}📺 Sessão tmux '$TMUX_SESSION' já existe${NC}"
            # Recarregar configuração do tmux se .tmux.conf existir
            if [ -f "$HOME/.tmux.conf" ]; then
                tmux source-file "$HOME/.tmux.conf" 2>/dev/null || true
            fi
            echo -e "${GREEN}🔌 Fazendo attach à sessão existente...${NC}"
            echo ""
            echo -e "${BLUE}💡 Dica: Use ${YELLOW}./dev-start.sh --restart${NC}${BLUE} para reiniciar tudo${NC}"
            echo ""
            sleep 2
            tmux attach-session -t "$TMUX_SESSION"
            exit 0
        fi
    fi

    # Setup
    setup_postgres
    setup_backend
    setup_frontend
    setup_mobile

    # Obter prefixo do admin
    ADMIN_PREFIX=$(grep -E "^ADMIN_URL_PREFIX=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "manage")
    ADMIN_PREFIX=${ADMIN_PREFIX:-manage}

    echo ""
    echo -e "${GREEN}🎬 Criando sessão tmux com Backend e Frontend (janela dividida)...${NC}"

    # Preparar ambiente para tmux
    # Remove socket órfão se existir mas servidor não estiver rodando
    SOCKET_PATH="/tmp/tmux-$(id -u)/default"
    SOCKET_DIR="/tmp/tmux-$(id -u)"

    # Garante que diretório existe
    mkdir -p "$SOCKET_DIR" 2>/dev/null || true

    # Remove socket órfão se existir
    if [ -S "$SOCKET_PATH" ] && ! tmux list-sessions &>/dev/null 2>&1; then
        echo -e "${YELLOW}   🧹 Removendo socket tmux órfão...${NC}"
        rm -f "$SOCKET_PATH" 2>/dev/null || true
    fi

    # Garante variáveis de ambiente corretas
    unset TMUX  # Remove variável TMUX se existir (pode interferir)
    export TERM=${TERM:-xterm-256color}

    # Carregar .env para exportar variáveis antes de iniciar servidor
    if [ -f "$SCRIPT_DIR/.env" ]; then
        eval "$(load_env_safe "$SCRIPT_DIR/.env")"
    fi

    # Criar nova sessão tmux com backend no painel superior
    # Exporta variáveis do .env para o ambiente do tmux usando a função segura
    ENV_EXPORTS=""
    if [ -f "$SCRIPT_DIR/.env" ]; then
        ENV_EXPORTS=$(load_env_safe "$SCRIPT_DIR/.env")
    fi

    # Criar sessão tmux diretamente (servidor será iniciado automaticamente)
    # Variáveis já foram configuradas acima

    # #region agent log - DEBUG: Antes de criar sessão tmux
    DEBUG_LOG="/home/uaimax/projects/uaitools/.cursor/debug.log"
    echo "{\"id\":\"log_$(date +%s)_pre_tmux\",\"timestamp\":$(date +%s%3N),\"location\":\"dev-start.sh:260\",\"message\":\"Antes de criar sessão tmux\",\"data\":{\"session\":\"$TMUX_SESSION\",\"backend_dir\":\"$BACKEND_DIR\",\"socket_path\":\"$SOCKET_PATH\",\"term\":\"$TERM\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A,B,C,D,E\"}" >> "$DEBUG_LOG"
    # Verifica servidor antes
    SERVER_BEFORE=$(tmux list-sessions 2>&1 | head -1 || echo "no-server")
    echo "{\"id\":\"log_$(date +%s)_server_before\",\"timestamp\":$(date +%s%3N),\"location\":\"dev-start.sh:263\",\"message\":\"Status servidor antes\",\"data\":{\"server_status\":\"$SERVER_BEFORE\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A,E\"}" >> "$DEBUG_LOG"
    # #endregion

    # Cria sessão tmux com comando simples (como versão antiga)
    # Django já carrega .env automaticamente via load_dotenv() em base.py
    # Não precisamos carregar .env dentro do comando tmux

    # #region agent log - DEBUG: Criando sessão tmux simples
    echo "{\"id\":\"log_$(date +%s)_tmux_simple\",\"timestamp\":$(date +%s%3N),\"location\":\"dev-start.sh:270\",\"message\":\"Criando sessão tmux com comando simples\",\"data\":{\"session\":\"$TMUX_SESSION\",\"backend_dir\":\"$BACKEND_DIR\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"D\"}" >> "$DEBUG_LOG"
    # #endregion

    TMUX_OUTPUT=$(tmux new-session -d -s "$TMUX_SESSION" -n "dev" \
        -c "$BACKEND_DIR" \
        "source venv/bin/activate && \
         echo -e '${GREEN}✅ Backend iniciado!${NC}' && \
         echo -e '${BLUE}🌐 http://localhost:$BACKEND_PORT${NC}' && \
         echo -e '${YELLOW}📌 Admin: http://localhost:$BACKEND_PORT/$ADMIN_PREFIX/${NC}' && \
         echo '' && \
         python manage.py runserver 0.0.0.0:$BACKEND_PORT" 2>&1)
    TMUX_EXIT_CODE=$?

    # #region agent log - DEBUG: Após comando tmux
    echo "{\"id\":\"log_$(date +%s)_tmux_result\",\"timestamp\":$(date +%s%3N),\"location\":\"dev-start.sh:285\",\"message\":\"Resultado comando tmux\",\"data\":{\"exit_code\":$TMUX_EXIT_CODE,\"output_length\":${#TMUX_OUTPUT},\"output_preview\":\"${TMUX_OUTPUT:0:200}\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A,B,D\"}" >> "$DEBUG_LOG"
    # #endregion

    if [ $TMUX_EXIT_CODE -ne 0 ]; then
        echo -e "${RED}❌ Erro ao criar sessão tmux (exit code: $TMUX_EXIT_CODE)${NC}"
        echo -e "${YELLOW}💡 Output: ${TMUX_OUTPUT}${NC}"
        # #region agent log - DEBUG: Erro ao criar
        echo "{\"id\":\"log_$(date +%s)_tmux_error\",\"timestamp\":$(date +%s%3N),\"location\":\"dev-start.sh:302\",\"message\":\"Erro ao criar sessão\",\"data\":{\"exit_code\":$TMUX_EXIT_CODE,\"output\":\"$TMUX_OUTPUT\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A,B,D\"}" >> "$DEBUG_LOG"
        # #endregion
        echo -e "${YELLOW}💡 Verificando status do servidor...${NC}"
        tmux list-sessions 2>&1 || echo "Servidor não está rodando"
        exit 1
    fi

    # Aguarda um pouco para garantir que a sessão foi criada
    sleep 1
    
    # Recarregar configuração do tmux se .tmux.conf existir
    if [ -f "$HOME/.tmux.conf" ]; then
        tmux source-file "$HOME/.tmux.conf" 2>/dev/null || true
        echo -e "${GREEN}✅ Configuração do tmux carregada (mouse habilitado)${NC}"
    fi

    # #region agent log - DEBUG: Verificando sessão após sleep
    SESSION_CHECK=$(tmux has-session -t "$TMUX_SESSION" 2>&1; echo "exit:$?")
    SESSIONS_LIST=$(tmux list-sessions 2>&1 | head -5 || echo "error")
    SERVER_AFTER=$(tmux list-sessions 2>&1 | head -1 || echo "no-server")
    echo "{\"id\":\"log_$(date +%s)_session_check\",\"timestamp\":$(date +%s%3N),\"location\":\"dev-start.sh:315\",\"message\":\"Verificação sessão após sleep\",\"data\":{\"session_check\":\"$SESSION_CHECK\",\"sessions_list\":\"$SESSIONS_LIST\",\"server_after\":\"$SERVER_AFTER\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C,E\"}" >> "$DEBUG_LOG"
    # #endregion

    # Verifica se a sessão foi criada com sucesso
    if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        echo -e "${RED}❌ Sessão tmux não foi criada${NC}"
        # #region agent log - DEBUG: Sessão não encontrada
        echo "{\"id\":\"log_$(date +%s)_session_not_found\",\"timestamp\":$(date +%s%3N),\"location\":\"dev-start.sh:322\",\"message\":\"Sessão não encontrada após criação\",\"data\":{\"expected_session\":\"$TMUX_SESSION\",\"all_sessions\":\"$SESSIONS_LIST\",\"server_status\":\"$SERVER_AFTER\"},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C,E\"}" >> "$DEBUG_LOG"
        # #endregion
        exit 1
    fi

    # Só continua se a sessão foi criada com sucesso
    if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        # Aguardar um pouco para garantir que a sessão está totalmente criada
        sleep 1
        
        # Verificar se frontend existe antes de tentar dividir
        if [ ! -d "$FRONTEND_DIR" ]; then
            echo -e "${YELLOW}⚠️  Diretório frontend não encontrado. Continuando apenas com backend...${NC}"
        elif ! check_npm; then
            echo -e "${YELLOW}⚠️  npm não encontrado. Frontend não será iniciado.${NC}"
            echo -e "${YELLOW}💡 Instale Node.js e npm primeiro para usar o frontend.${NC}"
        else
            # Dividir janela horizontalmente (Backend | Frontend) - 50/50
            echo -e "${YELLOW}📦 Dividindo janela para iniciar Frontend...${NC}"
            
            # Criar o split primeiro (sem comando, apenas dividir)
            tmux split-window -h -t "$TMUX_SESSION:0" -c "$FRONTEND_DIR" 2>&1
            SPLIT_EXIT_CODE=$?
            
            if [ $SPLIT_EXIT_CODE -ne 0 ]; then
                echo -e "${RED}❌ Erro ao dividir janela tmux (exit code: $SPLIT_EXIT_CODE)${NC}"
                echo -e "${YELLOW}⚠️  Continuando com backend apenas...${NC}"
            else
                # Aguardar um pouco para o split ser criado
                sleep 0.5
                
                # Verificar se o split foi criado com sucesso
                PANE_COUNT=$(tmux display-message -t "$TMUX_SESSION:0" -p '#{window_panes}' 2>/dev/null || echo "0")
                if [ "$PANE_COUNT" -ge 2 ]; then
                    echo -e "${GREEN}✅ Janela dividida com sucesso (${PANE_COUNT} painéis)${NC}"
                    
                    # Ajustar layout para dividir igualmente (50/50)
                    tmux select-layout -t "$TMUX_SESSION:0" even-horizontal 2>/dev/null || {
                        echo -e "${YELLOW}⚠️  Não foi possível ajustar layout, mas split foi criado${NC}"
                    }
                    
                    # Agora executar o comando do frontend no painel direito (0.1)
                    # O problema é que o tmux pode não ter acesso ao npm se não estiver no PATH
                    # Vamos tentar carregar o ambiente completo do shell
                    SHELL_NAME=$(basename "$SHELL" 2>/dev/null || echo "bash")
                    
                    tmux send-keys -t "$TMUX_SESSION:0.1" "echo -e '${GREEN}✅ Frontend iniciado!${NC}'" C-m
                    tmux send-keys -t "$TMUX_SESSION:0.1" "echo -e '${BLUE}🌐 http://localhost:$FRONTEND_PORT${NC}'" C-m
                    tmux send-keys -t "$TMUX_SESSION:0.1" "echo ''" C-m
                    # Carregar shell interativo completo para ter acesso a npm/nvm/etc
                    # Primeiro, vamos tentar carregar o ambiente e depois executar npm
                    if [ "$SHELL_NAME" = "zsh" ]; then
                        # Para zsh, carregar .zshrc e depois executar
                        tmux send-keys -t "$TMUX_SESSION:0.1" "source ~/.zshrc 2>/dev/null; cd '$FRONTEND_DIR' && npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT" C-m
                    else
                        # Para bash, carregar .bashrc e depois executar
                        tmux send-keys -t "$TMUX_SESSION:0.1" "source ~/.bashrc 2>/dev/null; cd '$FRONTEND_DIR' && npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT" C-m
                    fi
                else
                    echo -e "${YELLOW}⚠️  Aviso: Apenas ${PANE_COUNT} painel(éis) encontrado(s) após split${NC}"
                fi
            fi
        fi

        # Adicionar janela para Expo Mobile (se diretório mobile existir)
        if [ -d "$MOBILE_DIR" ]; then
            # Verificar se expo-dev-client está instalado (development build)
            if [ -f "$MOBILE_DIR/node_modules/expo-dev-client/package.json" ]; then
                tmux new-window -t "$TMUX_SESSION" -n "mobile" -c "$MOBILE_DIR" \
                    "echo -e '${GREEN}✅ Expo Dev Client iniciado com tunnel!${NC}' && \
                     echo -e '${BLUE}📱 Use o Development Build instalado no dispositivo${NC}' && \
                     echo -e '${YELLOW}📌 Tunnel ativo para acesso remoto${NC}' && \
                     echo -e '${YELLOW}💡 Build necessário: npm run build:dev:android ou build:dev:ios${NC}' && \
                     echo '' && \
                     npm run start:dev:tunnel" 2>/dev/null || {
                    echo -e "${YELLOW}⚠️  Erro ao iniciar Expo Dev Client. Continuando sem mobile...${NC}"
                }
            else
                # Fallback para Expo Go se dev-client não estiver instalado
                tmux new-window -t "$TMUX_SESSION" -n "mobile" -c "$MOBILE_DIR" \
                    "echo -e '${GREEN}✅ Expo iniciado com tunnel!${NC}' && \
                     echo -e '${BLUE}📱 Escaneie o QR code no Expo Go${NC}' && \
                     echo -e '${YELLOW}📌 Tunnel ativo para acesso remoto${NC}' && \
                     echo '' && \
                     npm run start:tunnel" 2>/dev/null || {
                    echo -e "${YELLOW}⚠️  Erro ao iniciar Expo. Continuando sem mobile...${NC}"
                }
            fi
        fi

        # Selecionar painel esquerdo (backend) por padrão
        tmux select-pane -t "$TMUX_SESSION:0.0" 2>/dev/null || true

        # Configurar captura de logs via pipe-pane (Fase 2: Logs Integrados)
        LOGS_DIR="$SCRIPT_DIR/logs"
        mkdir -p "$LOGS_DIR" 2>/dev/null || true

        # Data para rotação diária de logs
        LOG_DATE=$(date +%Y%m%d)

        # Capturar logs do backend (painel 0.0)
        # pipe-pane captura stdout/stderr sem perder interatividade
        tmux pipe-pane -t "$TMUX_SESSION:0.0" -o "cat >> $LOGS_DIR/backend-$LOG_DATE.log" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Não foi possível configurar captura de logs do backend${NC}"
        }

        # Capturar logs do frontend (painel 0.1) se existir
        if tmux list-panes -t "$TMUX_SESSION:0" | grep -q "0.1"; then
            tmux pipe-pane -t "$TMUX_SESSION:0.1" -o "cat >> $LOGS_DIR/frontend-$LOG_DATE.log" 2>/dev/null || {
                echo -e "${YELLOW}⚠️  Não foi possível configurar captura de logs do frontend${NC}"
            }
        fi

        # Capturar logs do Expo Mobile (janela mobile) se existir
        if [ -d "$MOBILE_DIR" ] && tmux list-windows -t "$TMUX_SESSION" | grep -q "mobile"; then
            tmux pipe-pane -t "$TMUX_SESSION:mobile" -o "cat >> $LOGS_DIR/expo-mobile-$LOG_DATE.log" 2>/dev/null || {
                echo -e "${YELLOW}⚠️  Não foi possível configurar captura de logs do Expo Mobile${NC}"
            }
        fi

        echo -e "${GREEN}📝 Captura de logs ativada: $LOGS_DIR/${NC}"

        # Resumo
        echo ""
        echo -e "${GREEN}✅ Ambiente de desenvolvimento pronto!${NC}"
        echo ""
        echo -e "${BLUE}📊 Serviços rodando:${NC}"
        echo -e "   ${GREEN}Backend:${NC}      http://localhost:$BACKEND_PORT"
        echo -e "   ${GREEN}Frontend:${NC}     http://localhost:$FRONTEND_PORT"
        if [ -d "$MOBILE_DIR" ]; then
            if [ -f "$MOBILE_DIR/node_modules/expo-dev-client/package.json" ]; then
                echo -e "   ${GREEN}Expo Dev Client:${NC} Rodando com tunnel (janela 'mobile')"
                echo -e "   ${YELLOW}⚠️  Desenvolvimento:${NC} Use Development Build no dispositivo"
            else
                echo -e "   ${GREEN}Expo Mobile:${NC}   Rodando com tunnel (janela 'mobile')"
            fi
        fi
        echo -e "   ${GREEN}Admin:${NC}         http://localhost:$BACKEND_PORT/$ADMIN_PREFIX/ (admin / admin123)"
        echo ""
        echo -e "${BLUE}💡 Comandos tmux:${NC}"
        echo -e "   ${YELLOW}Ctrl+B + D${NC}     - Detach (sair sem parar serviços)"
        echo -e "   ${YELLOW}Ctrl+B + ←/→${NC}   - Alternar entre painéis (Backend/Frontend)"
        echo -e "   ${YELLOW}Ctrl+B + 0/1${NC}   - Alternar entre janelas (0=dev, 1=mobile)"
        echo -e "   ${YELLOW}Ctrl+B + Q${NC}     - Mostrar números dos painéis"
        echo -e "   ${YELLOW}Ctrl+B + C${NC}     - Criar nova janela"
        echo -e "   ${YELLOW}Ctrl+B + X${NC}     - Fechar painel atual"
        echo -e "   ${YELLOW}./dev-start.sh --restart${NC} - Reiniciar tudo"
        echo ""
        echo -e "${YELLOW}🔌 Conectando à sessão tmux...${NC}"
        echo ""

        sleep 2
        tmux attach-session -t "$TMUX_SESSION" || {
            echo -e "${RED}❌ Erro ao conectar à sessão tmux${NC}"
            echo -e "${YELLOW}💡 Rodando em modo simples...${NC}"
            HAS_TMUX=false
        }
    fi

    # Se tmux falhou, roda em modo simples
    if [ "$HAS_TMUX" = false ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Continuando em modo simples (sem tmux)${NC}"
        echo ""
        # Roda backend em modo simples
        cd "$BACKEND_DIR"
        source venv/bin/activate
        if [ -f "$SCRIPT_DIR/.env" ]; then
            eval "$(load_env_safe "$SCRIPT_DIR/.env")"
        fi
        echo -e "${GREEN}✅ Backend iniciado!${NC}"
        echo -e "${BLUE}🌐 http://localhost:$BACKEND_PORT${NC}"
        echo -e "${YELLOW}📌 Admin: http://localhost:$BACKEND_PORT/$ADMIN_PREFIX/${NC}"
        echo ""
        echo -e "${YELLOW}💡 Frontend:${NC} Abra outro terminal e execute:"
        echo -e "   ${BLUE}cd frontend && npm run dev${NC}"
        echo ""
        python manage.py runserver 0.0.0.0:$BACKEND_PORT
    fi
fi

# ============================================
# MODO SEM TMUX (FALLBACK)
# ============================================
if [ "$HAS_TMUX" = false ]; then
    echo -e "${YELLOW}⚠️  tmux não está instalado${NC}"
    echo -e "${BLUE}💡 Rodando em modo simples (sem tmux)${NC}"
    echo -e "${YELLOW}💡 Para melhor experiência, instale: ${NC}sudo apt install tmux${BLUE} (Linux) ou ${NC}brew install tmux${BLUE} (Mac)"
    echo ""

    setup_postgres
    setup_backend

    # Obter prefixo do admin
    ADMIN_PREFIX=$(grep -E "^ADMIN_URL_PREFIX=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "manage")
    ADMIN_PREFIX=${ADMIN_PREFIX:-manage}

    echo ""
    echo -e "${GREEN}✅ Ambiente pronto!${NC}"
    echo -e "${GREEN}🌐 Iniciando servidor em http://0.0.0.0:$BACKEND_PORT${NC}"
    echo -e "${YELLOW}📌 Admin: http://localhost:$BACKEND_PORT/$ADMIN_PREFIX/ (admin / admin123)${NC}"
    echo ""
    echo -e "${YELLOW}💡 Frontend:${NC} Abra outro terminal e execute:"
    echo -e "   ${BLUE}cd frontend && npm run dev${NC}"
    echo ""

    # Carregar .env para exportar variáveis antes de iniciar servidor
    if [ -f "$SCRIPT_DIR/.env" ]; then
        eval "$(load_env_safe "$SCRIPT_DIR/.env")"
    fi

    cd "$BACKEND_DIR"
    source venv/bin/activate
    python manage.py runserver 0.0.0.0:$BACKEND_PORT
fi
