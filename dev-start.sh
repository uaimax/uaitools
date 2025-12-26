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

# Função para setup do frontend
setup_frontend() {
    echo -e "${BLUE}📦 Configurando Frontend...${NC}"

    cd "$FRONTEND_DIR"

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
    setup_backend
    setup_frontend

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
    if [ "$HAS_TMUX" = true ] && tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        # Dividir janela horizontalmente (50% cada)
        tmux split-window -h -t "$TMUX_SESSION:0" -c "$FRONTEND_DIR" \
            "echo -e '${GREEN}✅ Frontend iniciado!${NC}' && \
             echo -e '${BLUE}🌐 http://localhost:$FRONTEND_PORT${NC}' && \
             echo '' && \
             npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT" 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Erro ao dividir janela tmux. Continuando com backend apenas...${NC}"
        }

        # Selecionar painel esquerdo (backend) por padrão
        tmux select-pane -t "$TMUX_SESSION:0.0" 2>/dev/null || true
    fi

        # Resumo
        echo ""
        echo -e "${GREEN}✅ Ambiente de desenvolvimento pronto!${NC}"
        echo ""
        echo -e "${BLUE}📊 Serviços rodando:${NC}"
        echo -e "   ${GREEN}Backend:${NC}  http://localhost:$BACKEND_PORT"
        echo -e "   ${GREEN}Frontend:${NC} http://localhost:$FRONTEND_PORT"
        echo -e "   ${GREEN}Admin:${NC}     http://localhost:$BACKEND_PORT/$ADMIN_PREFIX/ (admin / admin123)"
        echo ""
        echo -e "${BLUE}💡 Comandos tmux:${NC}"
        echo -e "   ${YELLOW}Ctrl+B + D${NC}     - Detach (sair sem parar serviços)"
        echo -e "   ${YELLOW}Ctrl+B + ←/→${NC}   - Alternar entre painéis (Backend/Frontend)"
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

# ============================================
# MODO SEM TMUX (FALLBACK)
# ============================================
else
    echo -e "${YELLOW}⚠️  tmux não está instalado${NC}"
    echo -e "${BLUE}💡 Rodando em modo simples (sem tmux)${NC}"
    echo -e "${YELLOW}💡 Para melhor experiência, instale: ${NC}sudo apt install tmux${BLUE} (Linux) ou ${NC}brew install tmux${BLUE} (Mac)"
    echo ""

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
