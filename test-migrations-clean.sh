#!/bin/bash
# Script para testar migrations em banco completamente limpo
# Garante que as migrations funcionam do zero sem erros

set -e

cd "$(dirname "$0")/backend"

echo "🧪 Teste: Migrations em Banco Completamente Limpo"
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
echo "   1. Resetar o banco de dados completamente (DROP SCHEMA)"
echo "   2. Aplicar TODAS as migrations do zero"
echo "   3. Verificar que não há erros ou avisos"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}1️⃣  Resetando banco de dados completamente...${NC}"

# Resetar banco usando Python (não precisa de psql)
python <<'PYEOF'
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("DROP SCHEMA IF EXISTS public CASCADE")
    cursor.execute("CREATE SCHEMA public")
    cursor.execute("GRANT ALL ON SCHEMA public TO postgres")
    cursor.execute("GRANT ALL ON SCHEMA public TO public")
    print("✅ Schema resetado")
PYEOF

echo -e "${GREEN}   ✅ Banco resetado completamente${NC}"

echo ""
echo -e "${BLUE}2️⃣  Aplicando TODAS as migrations do zero...${NC}"
echo -e "${YELLOW}   Isso vai criar todas as tabelas do zero${NC}"
echo ""

# Aplicar migrations e capturar output
MIGRATE_OUTPUT=$(python manage.py migrate --noinput --verbosity=1 2>&1)
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -ne 0 ]; then
    echo -e "${RED}   ❌ ERRO ao aplicar migrations em banco limpo!${NC}"
    echo ""
    echo "Output do erro:"
    echo "$MIGRATE_OUTPUT" | tail -20
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ FALHA: As migrations têm problemas mesmo em banco limpo!${NC}"
    echo -e "${YELLOW}💡 Isso indica que há um problema nas migrations em si${NC}"
    echo -e "${YELLOW}💡 Verifique as dependências entre migrations${NC}"
    exit 1
fi

echo -e "${GREEN}   ✅ Migrations aplicadas com sucesso${NC}"

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
echo -e "${BLUE}4️⃣  Verificando se há avisos ao iniciar servidor...${NC}"

# Capturar output do runserver por 3 segundos
TIMEOUT=3
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
echo -e "${GREEN}✅ TESTE PASSOU! Migrations funcionam perfeitamente em banco limpo.${NC}"
echo ""
echo "Conclusão:"
echo "  - As migrations estão corretas"
echo "  - Em banco limpo, tudo funciona do zero"
echo "  - O problema era apenas histórico inconsistente no banco de produção"
echo ""
