#!/bin/bash
# Script para configurar banco do zero após renomeação

set -e

cd "$(dirname "$0")/backend"

echo "🔄 Configurando Banco do Zero"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado${NC}"
    exit 1
fi

source venv/bin/activate

echo -e "${YELLOW}⚠️  Este script vai aplicar todas as migrations do zero${NC}"
echo -e "${YELLOW}   Se houver dados, eles serão perdidos${NC}"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}1️⃣  Verificando estado atual...${NC}"
HAS_TABLES=$(python manage.py dbshell <<'EOF' 2>/dev/null | grep -c "List of relations" || echo "0")
EOF

if [ "$HAS_TABLES" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  Tabelas existentes encontradas${NC}"
    echo -e "${BLUE}   Limpando banco primeiro...${NC}"
    
    # Tentar flush
    python manage.py flush --no-input --verbosity=0 2>/dev/null || {
        echo -e "${YELLOW}   Flush falhou, tentando dropar tabelas manualmente...${NC}"
        python manage.py dbshell <<'EOF' 2>/dev/null || true
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
EOF
    }
    echo -e "${GREEN}   ✅ Banco limpo${NC}"
else
    echo -e "${GREEN}   ✅ Banco vazio, pronto para migrations${NC}"
fi

# Limpar histórico de migrations
echo ""
echo -e "${BLUE}2️⃣  Limpando histórico de migrations...${NC}"
python manage.py dbshell <<'EOF' 2>/dev/null || true
TRUNCATE TABLE django_migrations RESTART IDENTITY CASCADE;
DELETE FROM django_migrations;
EOF
echo -e "${GREEN}   ✅ Histórico limpo${NC}"

# Aplicar migrations
echo ""
echo -e "${BLUE}3️⃣  Aplicando todas as migrations...${NC}"
python manage.py migrate --verbosity=1

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migrations aplicadas!${NC}"
    echo ""
    echo -e "${BLUE}4️⃣  Verificando...${NC}"
    python manage.py showmigrations bau_mental 2>&1 | tail -5
    echo ""
    echo -e "${GREEN}✅ Pronto para uso!${NC}"
    echo ""
    echo "Teste:"
    echo "  curl http://localhost:8000/api/v1/bau-mental/boxes/"
else
    echo -e "${RED}❌ Erro ao aplicar migrations${NC}"
    exit 1
fi
