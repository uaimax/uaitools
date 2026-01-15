#!/bin/bash
# Script para testar criação do banco do zero e garantir que não há avisos de migrations

set -e

cd "$(dirname "$0")/backend"

echo "🧪 Teste: Banco do Zero - Sem Avisos de Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado. Execute ./dev-start.sh primeiro${NC}"
    exit 1
fi

source venv/bin/activate

# Carregar .env se existir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    # Função para carregar .env de forma segura
    load_env_safe() {
        local env_file="$1"
        if [ ! -f "$env_file" ]; then
            return 1
        fi
        python3 -c "
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

env_file = Path('$env_file')
if env_file.exists():
    load_dotenv(env_file, override=True)
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                if (value.startswith(\"'\") and value.endswith(\"'\")) or (value.startswith('\"') and value.endswith('\"')):
                    value = value[1:-1]
                value_escaped = value.replace(\"'\", \"'\"'\"'\"'\")
                print(f\"export {key}='{value_escaped}'\")
"
    }
    eval "$(load_env_safe "$SCRIPT_DIR/.env")"
fi

echo -e "${YELLOW}⚠️  Este script vai:${NC}"
echo "   1. Resetar o banco de dados completamente"
echo "   2. Aplicar todas as migrations do zero"
echo "   3. Verificar que não há avisos de migrations pendentes"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}1️⃣  Resetando banco de dados...${NC}"

# Dropar todas as tabelas
python manage.py dbshell <<'EOF' 2>/dev/null || true
-- Dropar todas as tabelas em cascata
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    SET session_replication_role = 'replica';
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    SET session_replication_role = 'origin';
END $$;
EOF

# Limpar histórico de migrations
python manage.py dbshell <<'EOF' 2>/dev/null || true
DELETE FROM django_migrations;
EOF

echo -e "${GREEN}   ✅ Banco resetado${NC}"

echo ""
echo -e "${BLUE}2️⃣  Aplicando todas as migrations do zero...${NC}"
python manage.py migrate --noinput --verbosity=1

if [ $? -ne 0 ]; then
    echo -e "${RED}   ❌ Erro ao aplicar migrations${NC}"
    exit 1
fi

echo -e "${GREEN}   ✅ Migrations aplicadas${NC}"

echo ""
echo -e "${BLUE}3️⃣  Verificando estado das migrations...${NC}"
PENDING=$(python manage.py showmigrations --plan 2>/dev/null | grep -c "\[ \]" || echo "0")

if [ "$PENDING" -gt 0 ]; then
    echo -e "${RED}   ❌ Ainda há $PENDING migrations pendentes!${NC}"
    python manage.py showmigrations --plan | grep "\[ \]"
    exit 1
else
    echo -e "${GREEN}   ✅ Todas as migrations estão aplicadas${NC}"
fi

echo ""
echo -e "${BLUE}4️⃣  Testando inicialização do servidor (sem avisos)...${NC}"

# Capturar output do runserver por 5 segundos e verificar se há avisos
TIMEOUT=5
SERVER_OUTPUT=$(timeout $TIMEOUT python manage.py runserver 0.0.0.0:8002 2>&1 || true) &
SERVER_PID=$!

sleep 2
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

# Verificar se há avisos de migrations não aplicadas
if echo "$SERVER_OUTPUT" | grep -qi "unapplied migration"; then
    echo -e "${RED}   ❌ AVISO ENCONTRADO:${NC}"
    echo "$SERVER_OUTPUT" | grep -i "unapplied migration"
    exit 1
else
    echo -e "${GREEN}   ✅ Nenhum aviso de migrations encontrado${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Teste passou! Banco do zero configurado sem avisos.${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Execute ./dev-start.sh para iniciar o ambiente completo"
echo "  2. Verifique que não há avisos de migrations ao iniciar"
echo ""
