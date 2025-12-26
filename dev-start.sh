#!/bin/bash
# Script único para iniciar ambiente de desenvolvimento completo
# Usa tmux se disponível, senão roda em modo simples

set -e  # Para em caso de erro

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

    # Criar nova sessão tmux com backend no painel superior
    tmux new-session -d -s "$TMUX_SESSION" -n "dev" \
        -c "$BACKEND_DIR" \
        "source venv/bin/activate && \
         echo -e '${GREEN}✅ Backend iniciado!${NC}' && \
         echo -e '${BLUE}🌐 http://localhost:$BACKEND_PORT${NC}' && \
         echo -e '${YELLOW}📌 Admin: http://localhost:$BACKEND_PORT/$ADMIN_PREFIX/${NC}' && \
         echo '' && \
         python manage.py runserver 0.0.0.0:$BACKEND_PORT"

    # Dividir janela horizontalmente (50% cada)
    tmux split-window -h -t "$TMUX_SESSION:0" -c "$FRONTEND_DIR" \
        "echo -e '${GREEN}✅ Frontend iniciado!${NC}' && \
         echo -e '${BLUE}🌐 http://localhost:$FRONTEND_PORT${NC}' && \
         echo '' && \
         npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT"

    # Selecionar painel esquerdo (backend) por padrão
    tmux select-pane -t "$TMUX_SESSION:0.0"

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
    tmux attach-session -t "$TMUX_SESSION"

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

    cd "$BACKEND_DIR"
    source venv/bin/activate
    python manage.py runserver 0.0.0.0:$BACKEND_PORT
fi
